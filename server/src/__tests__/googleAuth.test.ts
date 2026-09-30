import request from 'supertest';
import { createApp } from '../app';
import { config } from '../config';
import Problem from '../models/Problem';
import User from '../models/User';
import { seed } from '../seed/seed';
import { GoogleIdentity, InvalidGoogleTokenError, setGoogleVerifier } from '../services/googleAuth';
import { startDb, stopDb } from './helpers';

const app = createApp();

/** Stand-in for Google's token verification: the "credential" is a key into this table. */
const identities: Record<string, GoogleIdentity> = {
  'new-user': { sub: 'g-100', email: 'new.person@gmail.com', emailVerified: true, name: 'New Person' },
  existing: { sub: 'g-200', email: 'existing@example.com', emailVerified: true, name: 'Existing' },
  unverified: { sub: 'g-300', email: 'shady@example.com', emailVerified: false, name: 'Shady' },
  'short-name': { sub: 'g-400', email: 'ab@gmail.com', emailVerified: true, name: 'A B' },
  'new-user-again': { sub: 'g-101', email: 'new.person2@gmail.com', emailVerified: true, name: 'New Person' },
};

beforeAll(async () => {
  await startDb();
  await seed();
  setGoogleVerifier(async (credential) => {
    const identity = identities[credential];
    if (!identity) throw new InvalidGoogleTokenError('bad token');
    return identity;
  });
});
afterAll(async () => {
  setGoogleVerifier(null);
  config.googleClientId = '';
  await stopDb();
});
beforeEach(() => {
  config.googleClientId = 'test-client.apps.googleusercontent.com';
});

describe('Continue with Google', () => {
  it('exposes the client id and reports when Google sign-in is not configured', async () => {
    expect((await request(app).get('/api/auth/config')).body.googleClientId).toBe('test-client.apps.googleusercontent.com');
    config.googleClientId = '';
    expect((await request(app).get('/api/auth/config')).body.googleClientId).toBeNull();
    expect((await request(app).post('/api/auth/google').send({ credential: 'new-user' })).status).toBe(503);
  });

  it('rejects invalid tokens and unverified Google emails', async () => {
    expect((await request(app).post('/api/auth/google').send({})).status).toBe(400);
    expect((await request(app).post('/api/auth/google').send({ credential: 'forged' })).status).toBe(401);
    const unverified = await request(app).post('/api/auth/google').send({ credential: 'unverified' });
    expect(unverified.status).toBe(401);
    expect(unverified.body.message).toMatch(/not verified/);
  });

  it('creates an account on first sign-in and reuses it afterwards', async () => {
    const first = await request(app).post('/api/auth/google').send({ credential: 'new-user' });
    expect(first.status).toBe(201);
    expect(first.body.user).toMatchObject({ username: 'new_person', email: 'new.person@gmail.com', googleLinked: true });

    const again = await request(app).post('/api/auth/google').send({ credential: 'new-user' });
    expect(again.status).toBe(200);
    expect(again.body.user.id).toBe(first.body.user.id);

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${again.body.token}`);
    expect(me.body.user.username).toBe('new_person');

    // Username collisions get a numeric suffix; very short names are padded.
    const clash = await request(app).post('/api/auth/google').send({ credential: 'new-user-again' });
    expect(clash.body.user.username).toMatch(/^new_person2$|^new_person_\d{4}$/);
    const short = await request(app).post('/api/auth/google').send({ credential: 'short-name' });
    expect(short.body.user.username).toBe('ab_dev');
  });

  it('tells Google-only users to use Google instead of a password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'new.person@gmail.com', password: 'anything-1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Continue with Google/);
  });

  it('links Google to an existing password account only after the password is confirmed, keeping progress', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ username: 'existing_user', email: 'existing@example.com', password: 'my-real-password' });
    const auth = { Authorization: `Bearer ${reg.body.token}` };
    const sum = await Problem.findOne({ title: 'Sum of Two Numbers' });
    await request(app).post('/api/submissions').set(auth).send({ problemId: sum!._id, language: 'python', code: 'sum' });

    const attempt = await request(app).post('/api/auth/google').send({ credential: 'existing' });
    expect(attempt.status).toBe(409);
    expect(attempt.body.code).toBe('LINK_REQUIRED');
    expect(attempt.body.token).toBeUndefined();

    const wrong = await request(app).post('/api/auth/google/link').send({ credential: 'existing', password: 'guess-guess' });
    expect(wrong.status).toBe(401);
    expect((await User.findById(reg.body.user.id))!.googleId).toBeUndefined();

    const linked = await request(app).post('/api/auth/google/link').send({ credential: 'existing', password: 'my-real-password' });
    expect(linked.status).toBe(200);
    expect(linked.body.user.id).toBe(reg.body.user.id);
    expect(linked.body.user.googleLinked).toBe(true);

    // Same account, same progress, and both sign-in methods keep working.
    const stats = await request(app).get('/api/users/me/stats').set('Authorization', `Bearer ${linked.body.token}`);
    expect(stats.body.solvedCount).toBe(1);
    expect((await request(app).post('/api/auth/google').send({ credential: 'existing' })).body.user.id).toBe(reg.body.user.id);
    expect(
      (await request(app).post('/api/auth/login').send({ email: 'existing@example.com', password: 'my-real-password' })).status
    ).toBe(200);
  });
});
