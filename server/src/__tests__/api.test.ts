import request from 'supertest';
import { createApp } from '../app';
import Problem from '../models/Problem';
import User from '../models/User';
import { seed } from '../seed/seed';
import { startDb, stopDb } from './helpers';

const app = createApp();

const register = async (username: string) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@example.com`, password: 'correct-horse' });
  expect(res.status).toBe(201);
  return res.body.token as string;
};

let sumProblemId: string;

beforeAll(async () => {
  await startDb();
  await seed();
  sumProblemId = (await Problem.findOne({ title: 'Sum of Two Numbers' }))!._id.toString();
});
afterAll(stopDb);

describe('health', () => {
  it('reports database status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
  });
});

describe('auth', () => {
  it('validates registration input', async () => {
    const weak = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'bad', password: 'x' });
    expect(weak.status).toBe(400);

    const shortPassword = await request(app)
      .post('/api/auth/register')
      .send({ username: 'valid_name', email: 'valid@example.com', password: 'short' });
    expect(shortPassword.status).toBe(400);
    expect(shortPassword.body.message).toMatch(/Password/);
  });

  it('registers, rejects duplicates, logs in, and restores the session', async () => {
    const token = await register('alice');

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ALICE', email: 'other@example.com', password: 'correct-horse' });
    expect(duplicate.status).toBe(409);

    const badLogin = await request(app).post('/api/auth/login').send({ email: 'alice@example.com', password: 'nope-nope' });
    expect(badLogin.status).toBe(401);
    expect(badLogin.body.message).toBe('Invalid email or password');

    const login = await request(app).post('/api/auth/login').send({ email: 'ALICE@example.com', password: 'correct-horse' });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ username: 'alice', email: 'alice@example.com', isAdmin: false });
    expect(login.body.user.password).toBeUndefined();

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe('alice');

    const forged = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token');
    expect(forged.status).toBe(401);
  });
});

describe('problems', () => {
  it('lists approved problems with pagination and difficulty ordering', async () => {
    const res = await request(app).get('/api/problems?limit=5&page=1');
    expect(res.status).toBe(200);
    expect(res.body.problems).toHaveLength(5);
    expect(res.body.total).toBeGreaterThan(20);
    expect(res.body.problems[0].difficulty).toBe('easy');
    expect(res.body.problems[0].testCases).toBeUndefined();

    const lastPage = await request(app).get(`/api/problems?limit=5&page=${res.body.totalPages}`);
    expect(lastPage.body.problems.at(-1).difficulty).toBe('hard');
  });

  it('filters by difficulty, tag, and search (with regex characters escaped)', async () => {
    const hard = await request(app).get('/api/problems?difficulty=hard&limit=50');
    expect(hard.body.problems.every((p: any) => p.difficulty === 'hard')).toBe(true);

    const dp = await request(app).get('/api/problems?tag=dynamic%20programming&limit=50');
    expect(dp.body.problems.length).toBeGreaterThan(0);
    expect(dp.body.problems.every((p: any) => p.tags.includes('dynamic programming'))).toBe(true);

    const regex = await request(app).get('/api/problems?search=(');
    expect(regex.status).toBe(200);

    const search = await request(app).get('/api/problems?search=sudoku');
    expect(search.body.problems.map((p: any) => p.title)).toEqual(['Sudoku Solver']);
  });

  it('never exposes hidden test cases', async () => {
    const res = await request(app).get(`/api/problems/${sumProblemId}`);
    expect(res.status).toBe(200);
    expect(res.body.testCases).toBeUndefined();
    expect(res.body.examples).toHaveLength(3);
    expect(res.body.totalTestCases).toBe(4);
    expect(JSON.stringify(res.body)).not.toContain('1000000000 1000000000');
  });

  it('returns 404 for unknown or malformed ids', async () => {
    expect((await request(app).get('/api/problems/not-an-id')).status).toBe(404);
    expect((await request(app).get('/api/problems/507f1f77bcf86cd799439011')).status).toBe(404);
  });

  it('keeps contributions pending until an admin approves them', async () => {
    const token = await register('contributor');
    const auth = { Authorization: `Bearer ${token}` };

    const invalid = await request(app).post('/api/problems').set(auth).send({ title: 'x' });
    expect(invalid.status).toBe(400);

    const created = await request(app)
      .post('/api/problems')
      .set(auth)
      .send({
        title: 'Double It',
        description: 'Read an integer and print twice its value.',
        difficulty: 'easy',
        acceptedLanguages: ['python'],
        tags: ['Math'],
        testCases: [{ input: '2', output: '4' }, { input: '5', output: '10', isHidden: true }],
        status: 'approved', // must be ignored
      });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');

    const list = await request(app).get('/api/problems?search=Double');
    expect(list.body.problems).toHaveLength(0);

    // Regular users cannot approve, edit, or delete.
    expect((await request(app).patch(`/api/problems/admin/${created.body._id}/approve`).set(auth)).status).toBe(403);
    expect((await request(app).delete(`/api/problems/${created.body._id}`).set(auth)).status).toBe(403);
    expect((await request(app).put(`/api/problems/${created.body._id}`).set(auth).send({})).status).toBe(403);

    const adminToken = await register('admin_user');
    await User.updateOne({ username: 'admin_user' }, { isAdmin: true });
    const admin = { Authorization: `Bearer ${adminToken}` };

    const pending = await request(app).get('/api/problems/admin/pending').set(admin);
    expect(pending.body.map((p: any) => p.title)).toContain('Double It');

    const approved = await request(app).patch(`/api/problems/admin/${created.body._id}/approve`).set(admin);
    expect(approved.body.status).toBe('approved');
    const visible = await request(app).get('/api/problems?search=Double');
    expect(visible.body.problems).toHaveLength(1);
    expect(visible.body.problems[0].tags).toEqual(['math']);
  });
});

describe('submissions and stats', () => {
  let token: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    token = await register('solver');
  });

  it('requires authentication and validates input', async () => {
    expect((await request(app).post('/api/submissions').send({})).status).toBe(401);
    const badLang = await request(app)
      .post('/api/submissions')
      .set(auth())
      .send({ problemId: sumProblemId, language: 'ruby', code: 'sum' });
    expect(badLang.status).toBe(400);
  });

  it('runs sample tests without saving', async () => {
    const res = await request(app)
      .post('/api/submissions/run')
      .set(auth())
      .send({ problemId: sumProblemId, language: 'python', code: 'sum' });
    expect(res.status).toBe(200);
    expect(res.body.verdict).toBe('accepted');
    expect(res.body.totalTestCases).toBe(3);
    const mine = await request(app).get('/api/submissions/mine').set(auth());
    expect(mine.body).toHaveLength(0);
  });

  it('reports wrong answers and masks hidden test data', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .set(auth())
      .send({ problemId: sumProblemId, language: 'cpp', code: 'echo' });
    expect(res.status).toBe(201);
    expect(res.body.verdict).toBe('wrong_answer');
    const hidden = res.body.testResults.find((r: any) => r.isHidden);
    expect(hidden.input).toBeUndefined();
    expect(hidden.expectedOutput).toBeUndefined();
    const visible = res.body.testResults.find((r: any) => !r.isHidden);
    expect(visible.expectedOutput).toBe('8');
  });

  it('maps compile errors to every test case', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .set(auth())
      .send({ problemId: sumProblemId, language: 'c', code: 'broken' });
    expect(res.body.verdict).toBe('compile_error');
    expect(res.body.passedTestCases).toBe(0);
  });

  it('accepts a correct solution and updates stats, filters, and leaderboard', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .set(auth())
      .send({ problemId: sumProblemId, language: 'python', code: 'sum' });
    expect(res.body.verdict).toBe('accepted');
    expect(res.body.passedTestCases).toBe(4);

    const stats = await request(app).get('/api/users/me/stats').set(auth());
    expect(stats.status).toBe(200);
    expect(stats.body.solvedCount).toBe(1);
    expect(stats.body.totalSubmissions).toBe(3);
    expect(stats.body.byDifficulty.easy.solved).toBe(1);
    expect(stats.body.streak.current).toBe(1);
    expect(stats.body.rank).toBe(1);
    expect(stats.body.recentSubmissions[0].verdict).toBe('accepted');

    const solved = await request(app).get('/api/problems?status=solved').set(auth());
    expect(solved.body.problems.map((p: any) => p.title)).toEqual(['Sum of Two Numbers']);
    expect(solved.body.problems[0].userStatus).toBe('solved');

    const board = await request(app).get('/api/users/leaderboard');
    expect(board.body[0]).toMatchObject({ rank: 1, username: 'solver', solved: 1 });
    expect(board.body[0].email).toBeUndefined();

    const profile = await request(app).get('/api/users/SOLVER/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.user.email).toBeUndefined();
    expect(profile.body.stats.solvedCount).toBe(1);
  });

  it('does not let users read other users’ submissions', async () => {
    const mine = await request(app).get('/api/submissions/mine').set(auth());
    const otherToken = await register('snoop');
    const res = await request(app)
      .get(`/api/submissions/${mine.body[0]._id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
