import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as connect, Socket } from 'socket.io-client';
import { createApp } from '../app';
import { DuelManager } from '../duels/duelManager';
import { registerDuelHandlers } from '../duels/socketHandlers';
import { signToken } from '../middleware/auth';
import Duel from '../models/Duel';
import Problem from '../models/Problem';
import User from '../models/User';
import { getUserStats } from '../services/stats';
import { startDb, stopDb } from './helpers';

let httpServer: HttpServer;
let io: Server;
let manager: DuelManager;
let url: string;
const sockets: Socket[] = [];

const emit = <T = any>(socket: Socket, event: string, payload: object = {}) =>
  new Promise<{ ok: boolean; data?: T; error?: string }>((resolve) => socket.emit(event, payload, resolve));

const nextUpdate = (socket: Socket, predicate: (room: any) => boolean, timeoutMs = 10_000) =>
  new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for duel update')), timeoutMs);
    const listener = (room: any) => {
      if (predicate(room)) {
        clearTimeout(timer);
        socket.off('duel:update', listener);
        resolve(room);
      }
    };
    socket.on('duel:update', listener);
  });

const connectAs = async (token: string) => {
  const socket = connect(url, { auth: { token }, transports: ['websocket'], forceNew: true });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => resolve());
    socket.on('connect_error', reject);
  });
  return socket;
};

beforeAll(async () => {
  await startDb();
  await Problem.create({
    title: 'Add',
    description: 'Add two numbers together and print them.',
    difficulty: 'easy',
    acceptedLanguages: ['python'],
    status: 'approved',
    testCases: [
      { input: '1 2', output: '3', isHidden: false },
      { input: '4 4', output: '8', isHidden: true },
    ],
  });

  httpServer = createServer(createApp());
  io = new Server(httpServer);
  manager = new DuelManager(io);
  registerDuelHandlers(io, manager);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  manager.shutdown();
  io.close();
  await stopDb();
});

it('rejects sockets without a valid token', async () => {
  const socket = connect(url, { auth: { token: 'forged' }, transports: ['websocket'], forceNew: true });
  sockets.push(socket);
  const error = await new Promise<Error>((resolve) => socket.on('connect_error', resolve));
  expect(error.message).toBe('unauthorized');
});

it('runs a full duel: lobby, join, ready, countdown, submit, result', async () => {
  const [alice, bob] = await Promise.all([
    User.create({ username: 'alice', email: 'alice@example.com', password: 'password123' }),
    User.create({ username: 'bob', email: 'bob@example.com', password: 'password123' }),
  ]);
  const a = await connectAs(signToken(alice._id.toString()));
  const b = await connectAs(signToken(bob._id.toString()));

  const lobby = await emit(b, 'lobby:subscribe');
  expect(lobby.data).toEqual([]);

  const created = await emit(a, 'duel:create');
  expect(created.ok).toBe(true);
  const code = created.data.code;
  expect(code).toMatch(/^[A-Z2-9]{6}$/);
  expect(created.data.players[0].username).toBe('alice');

  const bad = await emit(b, 'duel:join', { code: 'NOPE00' });
  expect(bad.ok).toBe(false);

  const joined = await emit(b, 'duel:join', { code: code.toLowerCase() });
  expect(joined.data.players.map((p: any) => p.username)).toEqual(['alice', 'bob']);

  // Nobody can submit before the duel starts.
  const early = await emit(a, 'duel:submit', { code, language: 'python', source: 'sum' });
  expect(early.ok).toBe(false);

  await emit(a, 'duel:ready', { code });
  const started = nextUpdate(a, (room) => room.phase === 'in-progress');
  await emit(b, 'duel:ready', { code });
  const live = await started;

  expect(live.problem.title).toBe('Add');
  expect(live.problem.testCases).toBeUndefined();
  expect(live.problem.examples).toEqual([{ input: '1 2', output: '3' }]);
  expect(live.endsAt - live.startedAt).toBe(10 * 60 * 1000);

  const wrong = await emit(b, 'duel:submit', { code, language: 'python', source: 'echo' });
  expect(wrong.data.verdict).toBe('wrong_answer');
  expect(wrong.data.testResults.find((r: any) => r.isHidden).expectedOutput).toBeUndefined();

  const finished = nextUpdate(b, (room) => room.phase === 'finished');
  const right = await emit(a, 'duel:submit', { code, language: 'python', source: 'sum' });
  expect(right.data.verdict).toBe('accepted');
  const result = await finished;
  expect(result.winnerId).toBe(alice._id.toString());
  expect(result.outcome).toBe('solved');

  // Persisted and reflected in stats.
  await new Promise((r) => setTimeout(r, 200));
  expect(await Duel.countDocuments()).toBe(1);
  const aliceStats = await getUserStats(alice._id.toString());
  expect(aliceStats.duels).toEqual({ played: 1, wins: 1, draws: 0, losses: 0 });
  const bobStats = await getUserStats(bob._id.toString());
  expect(bobStats.duels.losses).toBe(1);
}, 30_000);

it('lets a player leave a waiting room and hands the room to the other player', async () => {
  const [carol, dave] = await Promise.all([
    User.create({ username: 'carol', email: 'carol@example.com', password: 'password123' }),
    User.create({ username: 'dave', email: 'dave@example.com', password: 'password123' }),
  ]);
  const c = await connectAs(signToken(carol._id.toString()));
  const d = await connectAs(signToken(dave._id.toString()));

  const { data: room } = await emit(c, 'duel:create');
  await emit(d, 'duel:join', { code: room.code });

  const updated = nextUpdate(d, (r) => r.players.length === 1);
  await emit(c, 'duel:leave', { code: room.code });
  const after = await updated;
  expect(after.hostId).toBe(dave._id.toString());
  expect(after.phase).toBe('waiting');
});
