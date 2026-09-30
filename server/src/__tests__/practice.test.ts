import request from 'supertest';
import { createApp } from '../app';
import ProblemSet from '../models/ProblemSet';
import ProviderSnapshot from '../models/ProviderSnapshot';
import Problem from '../models/Problem';
import { seed } from '../seed/seed';
import { mixedTargets } from '../services/problemSets';
import { compactProblems, toCatalogItems } from '../services/providers/codeforces';
import { setCodeforcesFetcher } from '../services/providers/codeforcesClient';
import { codeforcesProvider, ProviderUnavailableError } from '../services/providers';
import { startDb, stopDb } from './helpers';
import fixture from './fixtures/codeforces-problems.json';

const app = createApp();

/** Mocked Codeforces API: serves the real-data fixture, or fails when `down` is set. */
let down = false;
let calls: string[] = [];
const userStatus: Record<string, { problem: { contestId: number; index: string; name: string }; verdict: string }[]> = {};
const respond = (status: number, body: unknown) => ({ status, json: async () => body }) as unknown as Response;
const mockCodeforces = async (url: string | URL | Request) => {
  const href = String(url);
  calls.push(href);
  if (down) throw new Error('connect ECONNREFUSED');
  const { pathname, searchParams } = new URL(href);
  if (pathname.endsWith('/problemset.problems')) return respond(200, { status: 'OK', result: { problems: fixture.problems } });
  if (pathname.endsWith('/user.info')) {
    const handle = searchParams.get('handles')!;
    return handle.toLowerCase() === 'tourist'
      ? respond(200, { status: 'OK', result: [{ handle: 'tourist' }] })
      : respond(400, { status: 'FAILED', comment: `handles: User with handle ${handle} not found` });
  }
  if (pathname.endsWith('/user.status')) {
    return respond(200, { status: 'OK', result: userStatus[searchParams.get('handle')!] ?? [] });
  }
  return respond(404, { status: 'FAILED', comment: 'unknown method' });
};

const register = async (username: string) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@example.com`, password: 'correct-horse' });
  return { Authorization: `Bearer ${res.body.token}` };
};

beforeAll(async () => {
  await startDb();
  await seed();
  setCodeforcesFetcher(mockCodeforces as typeof fetch);
});
afterAll(async () => {
  setCodeforcesFetcher(null);
  await stopDb();
});
beforeEach(async () => {
  down = false;
  calls = [];
  codeforcesProvider.reset();
  await ProviderSnapshot.deleteMany({});
});

describe('Codeforces catalog mapping (real API data)', () => {
  const items = toCatalogItems(compactProblems(fixture.problems as any));

  it('drops unrated problems and maps ratings to difficulty', () => {
    expect(items).toHaveLength(fixture.problems.length - 2);
    for (const item of items) {
      const expected = item.rating! <= 1200 ? 'easy' : item.rating! <= 1900 ? 'medium' : 'hard';
      expect(item.difficulty).toBe(expected);
      expect(item.url).toBe(`https://codeforces.com/problemset/problem/${item.externalId.match(/^\d+/)![0]}/${item.externalId.replace(/^\d+/, '')}`);
      expect(item.judged).toBe(false);
    }
  });

  it('keeps different problems that share a title', () => {
    expect(items.filter((i) => i.title === 'Triangles').map((i) => i.externalId).sort()).toEqual(['13D', '15E']);
    expect(items.filter((i) => i.title === 'Divide and Conquer')).toHaveLength(2);
  });

  it('normalizes Codeforces tags to AlgoArena topics', () => {
    const all = new Set(items.flatMap((i) => i.topics));
    expect(all.has('dp')).toBe(false);
    expect(all.has('*special')).toBe(false);
    expect([...all].some((t) => t === 'dynamic programming' || t === 'greedy' || t === 'math')).toBe(true);
  });
});

describe('provider fallback', () => {
  it('fetches live, stores a snapshot, and serves the snapshot when Codeforces is down', async () => {
    const live = await codeforcesProvider.list();
    expect(live.stale).toBe(false);
    expect(await ProviderSnapshot.countDocuments({ provider: 'codeforces' })).toBe(1);

    // Simulate a restart during an outage with an old snapshot.
    await ProviderSnapshot.updateOne({ provider: 'codeforces' }, { fetchedAt: new Date(Date.now() - 2 * 86400000) });
    codeforcesProvider.reset();
    down = true;
    const fallback = await codeforcesProvider.list();
    expect(fallback.stale).toBe(true);
    expect(fallback.items).toHaveLength(live.items.length);
  });

  it('reports the source as unavailable when there is no snapshot', async () => {
    down = true;
    await expect(codeforcesProvider.list()).rejects.toBeInstanceOf(ProviderUnavailableError);
    const status = await codeforcesProvider.status();
    expect(status.available).toBe(false);
    expect(status.error).toMatch(/ECONNREFUSED/);
  });
});

describe('browsing across sources', () => {
  it('keeps the default AlgoArena listing unchanged', async () => {
    const res = await request(app).get('/api/problems?limit=50');
    expect(res.body.total).toBe(31);
    expect(res.body.problems[0].source).toBeUndefined();
  });

  it('lists, filters and searches Codeforces problems with attribution links', async () => {
    const hard = await request(app).get('/api/problems?source=codeforces&difficulty=hard&limit=50');
    expect(hard.status).toBe(200);
    expect(hard.body.total).toBeGreaterThan(0);
    expect(hard.body.problems.every((p: any) => p.source === 'codeforces' && p.external && p.difficulty === 'hard')).toBe(true);
    expect(hard.body.problems[0].url).toMatch(/^https:\/\/codeforces\.com\/problemset\/problem\//);

    const search = await request(app).get('/api/problems?source=codeforces&search=triangles');
    expect(search.body.problems.map((p: any) => p.title)).toEqual(['Triangles', 'Triangles']);
  });

  it('merges sources with AlgoArena first and still works when Codeforces is down', async () => {
    const all = await request(app).get('/api/problems?source=all&limit=50');
    expect(all.body.total).toBe(31 + fixture.problems.length - 2);
    expect(all.body.problems[0].source).toBe('algoarena');

    // Outage with no snapshot to fall back on: Codeforces is skipped, AlgoArena still works.
    codeforcesProvider.reset();
    await ProviderSnapshot.deleteMany({});
    down = true;
    const degraded = await request(app).get('/api/problems?source=all&limit=50');
    expect(degraded.status).toBe(200);
    expect(degraded.body.total).toBe(31);
    expect(degraded.body.warnings[0]).toMatch(/Codeforces is unavailable/);
  });

  it('offers topics from every source', async () => {
    const res = await request(app).get('/api/problem-sets/options');
    expect(res.body.sources.map((s: any) => [s.id, s.available])).toEqual([
      ['algoarena', true],
      ['codeforces', true],
    ]);
    expect(res.body.topics).toEqual(expect.arrayContaining(['arrays', 'dynamic programming']));
  });
});

describe('practice set generation', () => {
  it('validates input', async () => {
    const auth = await register('validator');
    expect((await request(app).post('/api/problem-sets').send({})).status).toBe(401);
    expect((await request(app).post('/api/problem-sets').set(auth).send({ count: 0 })).status).toBe(400);
    expect((await request(app).post('/api/problem-sets').set(auth).send({ count: 51 })).status).toBe(400);
    expect((await request(app).post('/api/problem-sets').set(auth).send({ difficulty: 'insane' })).status).toBe(400);
    expect((await request(app).post('/api/problem-sets').set(auth).send({ sources: ['leetcode'] })).status).toBe(400);
  });

  it('splits mixed sets evenly', () => {
    expect(mixedTargets(10)).toEqual({ easy: 4, medium: 3, hard: 3 });
    expect(mixedTargets(2)).toEqual({ easy: 1, medium: 1, hard: 0 });
  });

  it('generates unique, randomized, mixed-source sets without repeating earlier sets', async () => {
    const auth = await register('generator');
    const body = { difficulty: 'mixed', count: 12, sources: ['algoarena', 'codeforces'] };
    const first = await request(app).post('/api/problem-sets').set(auth).send(body);
    expect(first.status).toBe(201);
    const items = first.body.set.items;
    expect(items).toHaveLength(12);
    expect(new Set(items.map((i: any) => i.key)).size).toBe(12);
    expect(new Set(items.map((i: any) => i.title.toLowerCase())).size).toBe(12);
    expect(new Set(items.map((i: any) => i.source))).toEqual(new Set(['algoarena', 'codeforces']));
    const counts = { easy: 0, medium: 0, hard: 0 } as Record<string, number>;
    items.forEach((i: any) => (counts[i.difficulty] += 1));
    expect(counts).toEqual({ easy: 4, medium: 4, hard: 4 });

    const second = await request(app).post('/api/problem-sets').set(auth).send(body);
    const overlap = second.body.set.items.filter((i: any) => items.some((j: any) => j.key === i.key));
    expect(overlap).toHaveLength(0);

    const list = await request(app).get('/api/problem-sets').set(auth);
    expect(list.body).toHaveLength(2);
  });

  it('filters by difficulty and topic, and warns when the pool runs out', async () => {
    const auth = await register('topical');
    const res = await request(app)
      .post('/api/problem-sets')
      .set(auth)
      .send({ difficulty: 'hard', topics: ['backtracking'], count: 5, sources: ['algoarena'] });
    expect(res.status).toBe(201);
    expect(res.body.set.items.every((i: any) => i.difficulty === 'hard' && i.topics.includes('backtracking'))).toBe(true);
    expect(res.body.set.items).toHaveLength(2); // N-Queens Count, Sudoku Solver
    expect(res.body.warnings).toContain('Only 2 problem(s) match these filters.');

    // Same request again: only repeats remain, which is allowed but flagged.
    const again = await request(app)
      .post('/api/problem-sets')
      .set(auth)
      .send({ difficulty: 'hard', topics: ['backtracking'], count: 2, sources: ['algoarena'] });
    expect(again.body.set.items).toHaveLength(2);
    expect(again.body.warnings.join(' ')).toMatch(/repeat/);
  });

  it('excludes problems the user already solved on AlgoArena', async () => {
    const auth = await register('solver2');
    const sum = await Problem.findOne({ title: 'Sum of Two Numbers' });
    await request(app).post('/api/submissions').set(auth).send({ problemId: sum!._id, language: 'python', code: 'sum' });
    const res = await request(app)
      .post('/api/problem-sets')
      .set(auth)
      .send({ difficulty: 'easy', count: 18, sources: ['algoarena'], avoidRepeats: false });
    expect(res.body.set.items.map((i: any) => i.title)).not.toContain('Sum of Two Numbers');
    expect(res.body.set.items).toHaveLength(17);
    expect(res.body.set.items.every((i: any) => i.status === null)).toBe(true);
  });

  it('falls back to AlgoArena when Codeforces is down, and fails clearly when nothing is available', async () => {
    const auth = await register('fallback');
    down = true;
    const res = await request(app)
      .post('/api/problem-sets')
      .set(auth)
      .send({ difficulty: 'easy', count: 3, sources: ['algoarena', 'codeforces'] });
    expect(res.status).toBe(201);
    expect(res.body.set.items.every((i: any) => i.source === 'algoarena')).toBe(true);
    expect(res.body.warnings[0]).toMatch(/Codeforces is unavailable/);

    const none = await request(app).post('/api/problem-sets').set(auth).send({ count: 3, sources: ['codeforces'] });
    expect(none.status).toBe(503);
  });

  it('only lets owners read or delete their sets', async () => {
    const owner = await register('owner1');
    const other = await register('other1');
    const created = await request(app).post('/api/problem-sets').set(owner).send({ count: 2, sources: ['algoarena'] });
    const id = created.body.set._id;
    expect((await request(app).get(`/api/problem-sets/${id}`).set(other)).status).toBe(404);
    expect((await request(app).delete(`/api/problem-sets/${id}`).set(other)).status).toBe(404);
    expect((await request(app).delete(`/api/problem-sets/${id}`).set(owner)).status).toBe(200);
    expect(await ProblemSet.countDocuments({ _id: id })).toBe(0);
  });
});

describe('Codeforces progress verification', () => {
  it('verifies the handle and marks solved problems from real submission data', async () => {
    const auth = await register('cfuser');
    const bad = await request(app).put('/api/users/me/codeforces').set(auth).send({ handle: 'no_such_user_x' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toMatch(/No Codeforces user/);

    const ok = await request(app).put('/api/users/me/codeforces').set(auth).send({ handle: 'Tourist' });
    expect(ok.body.user.codeforcesHandle).toBe('tourist');

    const set = await request(app)
      .post('/api/problem-sets')
      .set(auth)
      .send({ difficulty: 'mixed', count: 6, sources: ['codeforces'], excludeSolved: false });
    const [first, second] = set.body.set.items;
    const [c1, i1] = [Number(first.externalId.match(/^\d+/)[0]), first.externalId.replace(/^\d+/, '')];
    const [c2, i2] = [Number(second.externalId.match(/^\d+/)[0]), second.externalId.replace(/^\d+/, '')];
    userStatus.tourist = [
      { problem: { contestId: c1, index: i1, name: first.title }, verdict: 'OK' },
      { problem: { contestId: c2, index: i2, name: second.title }, verdict: 'WRONG_ANSWER' },
    ];

    const synced = await request(app).post(`/api/problem-sets/${set.body.set._id}/sync-codeforces`).set(auth);
    expect(synced.status).toBe(200);
    const byKey = Object.fromEntries(synced.body.items.map((i: any) => [i.key, i.status]));
    expect(byKey[first.key]).toBe('solved');
    expect(byKey[second.key]).toBe('attempted');
    expect(synced.body.solvedCount).toBe(1);

    // New sets skip the problem solved on Codeforces.
    const next = await request(app)
      .post('/api/problem-sets')
      .set(auth)
      .send({ difficulty: 'mixed', count: 30, sources: ['codeforces'], avoidRepeats: false });
    expect(next.body.set.items.map((i: any) => i.key)).not.toContain(first.key);
  });
});
