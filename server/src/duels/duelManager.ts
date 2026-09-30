import crypto from 'crypto';
import mongoose from 'mongoose';
import { Server, Socket } from 'socket.io';
import Duel from '../models/Duel';
import Problem, { Difficulty, toPublicProblem } from '../models/Problem';
import { sanitizeTestResults } from '../models/Submission';
import User from '../models/User';
import { ExecutionUnavailableError, judge } from '../services/execution';
import { isLanguage, validateCode } from '../utils/validation';

export const DUEL_DURATION_MS: Record<Difficulty, number> = {
  easy: 10 * 60 * 1000,
  medium: 20 * 60 * 1000,
  hard: 30 * 60 * 1000,
};
const COUNTDOWN_MS = 5000;
const RECONNECT_GRACE_MS = 20_000;
const FINISHED_ROOM_TTL_MS = 5 * 60 * 1000;
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type Phase = 'waiting' | 'countdown' | 'in-progress' | 'finished';
type Outcome = 'solved' | 'timeout' | 'forfeit' | 'draw';

export interface SocketUser {
  userId: string;
  username: string;
}

interface DuelPlayer extends SocketUser {
  socketIds: Set<string>;
  ready: boolean;
  bestPassed: number;
  solvedInMs: number | null;
  submissions: number;
  judging: boolean;
  lastVerdict: string | null;
  disconnectTimer: NodeJS.Timeout | null;
}

interface DuelRoom {
  code: string;
  hostId: string;
  phase: Phase;
  players: DuelPlayer[];
  problem: any | null;
  countdownEndsAt: number | null;
  startedAt: number | null;
  endsAt: number | null;
  winnerId: string | null;
  outcome: Outcome | null;
  createdAt: number;
  timer: NodeJS.Timeout | null;
}

/** Errors whose message is safe to show to the player. */
export class DuelError extends Error {}

const channel = (code: string) => `duel:${code}`;

export class DuelManager {
  private rooms = new Map<string, DuelRoom>();

  constructor(private io: Server) {}

  // ---------- Views ----------

  private publicRoom(room: DuelRoom) {
    const showProblem = room.phase === 'in-progress' || room.phase === 'finished';
    const total = room.problem?.testCases?.length ?? 0;
    return {
      code: room.code,
      hostId: room.hostId,
      phase: room.phase,
      players: room.players.map((p) => ({
        userId: p.userId,
        username: p.username,
        ready: p.ready,
        connected: p.socketIds.size > 0,
        bestPassed: p.bestPassed,
        totalTestCases: total,
        solved: p.solvedInMs !== null,
        solvedInMs: p.solvedInMs,
        submissions: p.submissions,
        judging: p.judging,
        lastVerdict: p.lastVerdict,
      })),
      problem: showProblem && room.problem ? toPublicProblem(room.problem) : null,
      countdownEndsAt: room.countdownEndsAt,
      startedAt: room.startedAt,
      endsAt: room.endsAt,
      winnerId: room.winnerId,
      outcome: room.outcome,
      serverNow: Date.now(),
    };
  }

  listOpenRooms() {
    return [...this.rooms.values()]
      .filter((room) => room.phase === 'waiting' && room.players.length === 1)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((room) => ({ code: room.code, host: room.players[0].username, createdAt: room.createdAt }));
  }

  private broadcast(room: DuelRoom) {
    this.io.to(channel(room.code)).emit('duel:update', this.publicRoom(room));
  }

  private broadcastLobby() {
    this.io.to('lobby').emit('lobby:rooms', this.listOpenRooms());
  }

  // ---------- Helpers ----------

  private newCode(): string {
    let code: string;
    do {
      code = Array.from(crypto.randomBytes(6), (b) => ROOM_CODE_ALPHABET[b % ROOM_CODE_ALPHABET.length]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  private getRoom(code: unknown): DuelRoom {
    const room = typeof code === 'string' ? this.rooms.get(code.trim().toUpperCase()) : undefined;
    if (!room) throw new DuelError('Duel room not found. Check the code and try again.');
    return room;
  }

  private activeRoomFor(userId: string): DuelRoom | undefined {
    return [...this.rooms.values()].find(
      (room) => room.phase !== 'finished' && room.players.some((p) => p.userId === userId)
    );
  }

  private attach(room: DuelRoom, player: DuelPlayer, socket: Socket) {
    player.socketIds.add(socket.id);
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = null;
    }
    socket.join(channel(room.code));
  }

  private newPlayer(user: SocketUser): DuelPlayer {
    return {
      ...user,
      socketIds: new Set(),
      ready: false,
      bestPassed: 0,
      solvedInMs: null,
      submissions: 0,
      judging: false,
      lastVerdict: null,
      disconnectTimer: null,
    };
  }

  private clearTimer(room: DuelRoom) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = null;
  }

  // ---------- Lifecycle ----------

  active(socket: Socket, user: SocketUser) {
    const room = this.activeRoomFor(user.userId);
    if (!room) return null;
    this.attach(room, room.players.find((p) => p.userId === user.userId)!, socket);
    return this.publicRoom(room);
  }

  create(socket: Socket, user: SocketUser) {
    const existing = this.activeRoomFor(user.userId);
    if (existing) {
      this.attach(existing, existing.players.find((p) => p.userId === user.userId)!, socket);
      return this.publicRoom(existing);
    }

    const room: DuelRoom = {
      code: this.newCode(),
      hostId: user.userId,
      phase: 'waiting',
      players: [this.newPlayer(user)],
      problem: null,
      countdownEndsAt: null,
      startedAt: null,
      endsAt: null,
      winnerId: null,
      outcome: null,
      createdAt: Date.now(),
      timer: null,
    };
    this.rooms.set(room.code, room);
    this.attach(room, room.players[0], socket);
    this.broadcastLobby();
    return this.publicRoom(room);
  }

  join(socket: Socket, user: SocketUser, code: unknown) {
    const room = this.getRoom(code);
    const existingPlayer = room.players.find((p) => p.userId === user.userId);

    if (existingPlayer) {
      // Rejoining (page refresh, second tab, or navigating back).
      this.attach(room, existingPlayer, socket);
      this.broadcast(room);
      return this.publicRoom(room);
    }

    if (room.phase === 'finished') {
      // Spectating a result is harmless; just show it.
      socket.join(channel(room.code));
      return this.publicRoom(room);
    }
    if (room.phase !== 'waiting' || room.players.length >= 2) {
      throw new DuelError('This duel is already full or has started.');
    }
    const other = this.activeRoomFor(user.userId);
    if (other) {
      throw new DuelError(`You are already in duel ${other.code}. Leave it before joining another.`);
    }

    const player = this.newPlayer(user);
    room.players.push(player);
    this.attach(room, player, socket);
    this.broadcast(room);
    this.broadcastLobby();
    return this.publicRoom(room);
  }

  leave(socket: Socket, user: SocketUser, code: unknown) {
    const room = this.getRoom(code);
    socket.leave(channel(room.code));
    this.removePlayer(room, user.userId);
  }

  /** Removes a player voluntarily or after their reconnect grace period ran out. */
  private removePlayer(room: DuelRoom, userId: string) {
    const player = room.players.find((p) => p.userId === userId);
    if (!player) return;
    if (player.disconnectTimer) clearTimeout(player.disconnectTimer);

    if (room.phase === 'in-progress') {
      const opponent = room.players.find((p) => p.userId !== userId);
      void this.finish(room, opponent?.userId ?? null, 'forfeit');
      return;
    }
    if (room.phase === 'finished') return;

    // waiting or countdown: drop the player and reset the room.
    this.clearTimer(room);
    room.players = room.players.filter((p) => p.userId !== userId);
    room.players.forEach((p) => (p.ready = false));
    room.phase = 'waiting';
    room.problem = null;
    room.countdownEndsAt = null;

    if (room.players.length === 0) {
      this.rooms.delete(room.code);
    } else {
      room.hostId = room.players[0].userId;
      this.broadcast(room);
    }
    this.broadcastLobby();
  }

  async setReady(user: SocketUser, code: unknown, ready: boolean) {
    const room = this.getRoom(code);
    const player = room.players.find((p) => p.userId === user.userId);
    if (!player) throw new DuelError('You are not part of this duel.');
    if (room.phase !== 'waiting') throw new DuelError('The duel has already started.');

    player.ready = ready;
    this.broadcast(room);

    if (room.players.length === 2 && room.players.every((p) => p.ready)) {
      await this.startCountdown(room);
    }
    return this.publicRoom(room);
  }

  private async pickProblem(userIds: string[]) {
    const users = await User.find({ _id: { $in: userIds } }).select('duelSolvedProblems');
    const used = users.flatMap((u) => u.duelSolvedProblems);
    const [fresh] = await Problem.aggregate([
      { $match: { status: 'approved', _id: { $nin: used } } },
      { $sample: { size: 1 } },
    ]);
    if (fresh) return fresh;
    // Both players have seen everything: allow repeats rather than blocking the duel.
    const [any] = await Problem.aggregate([{ $match: { status: 'approved' } }, { $sample: { size: 1 } }]);
    return any ?? null;
  }

  private async startCountdown(room: DuelRoom) {
    room.phase = 'countdown';
    room.countdownEndsAt = null;
    this.broadcastLobby();

    const problem = await this.pickProblem(room.players.map((p) => p.userId));

    // Someone may have left while we were querying.
    if (room.phase !== 'countdown' || room.players.length !== 2) return;
    if (!problem) {
      room.phase = 'waiting';
      room.players.forEach((p) => (p.ready = false));
      this.io.to(channel(room.code)).emit('duel:error', { message: 'No approved problems are available yet.' });
      this.broadcast(room);
      return;
    }

    room.problem = problem;
    room.countdownEndsAt = Date.now() + COUNTDOWN_MS;
    room.timer = setTimeout(() => this.begin(room), COUNTDOWN_MS);
    this.broadcast(room);
  }

  private begin(room: DuelRoom) {
    if (room.phase !== 'countdown') return;
    const duration = DUEL_DURATION_MS[room.problem.difficulty as Difficulty] ?? DUEL_DURATION_MS.medium;
    room.phase = 'in-progress';
    room.startedAt = Date.now();
    room.endsAt = room.startedAt + duration;
    room.timer = setTimeout(() => this.finishByTimeout(room), duration);
    this.broadcast(room);
  }

  private finishByTimeout(room: DuelRoom) {
    if (room.phase !== 'in-progress') return;
    const [a, b] = room.players;
    if (a.bestPassed === b.bestPassed) void this.finish(room, null, 'draw');
    else void this.finish(room, a.bestPassed > b.bestPassed ? a.userId : b.userId, 'timeout');
  }

  private async finish(room: DuelRoom, winnerId: string | null, outcome: Outcome) {
    if (room.phase === 'finished') return;
    this.clearTimer(room);
    room.phase = 'finished';
    room.winnerId = winnerId;
    room.outcome = outcome;
    const endedAt = Date.now();
    this.broadcast(room);
    this.broadcastLobby();

    setTimeout(() => {
      if (this.rooms.get(room.code) === room) this.rooms.delete(room.code);
    }, FINISHED_ROOM_TTL_MS).unref();

    try {
      await Duel.create({
        roomCode: room.code,
        problem: room.problem._id,
        players: room.players.map((p) => ({
          user: new mongoose.Types.ObjectId(p.userId),
          username: p.username,
          passedTestCases: p.bestPassed,
          totalTestCases: room.problem.testCases.length,
          solvedInMs: p.solvedInMs,
          submissions: p.submissions,
        })),
        winner: winnerId ? new mongoose.Types.ObjectId(winnerId) : null,
        outcome,
        startedAt: new Date(room.startedAt ?? endedAt),
        endedAt: new Date(endedAt),
      });
      await User.updateMany(
        { _id: { $in: room.players.map((p) => p.userId) } },
        { $addToSet: { duelSolvedProblems: room.problem._id } }
      );
    } catch (error) {
      console.error(`Failed to persist duel ${room.code}:`, error);
    }
  }

  async submit(user: SocketUser, code: unknown, language: unknown, source: unknown) {
    const room = this.getRoom(code);
    const player = room.players.find((p) => p.userId === user.userId);
    if (!player) throw new DuelError('You are not part of this duel.');
    if (room.phase !== 'in-progress' || (room.endsAt && Date.now() > room.endsAt)) {
      throw new DuelError('The duel is not in progress.');
    }
    if (player.judging) throw new DuelError('Your previous submission is still being judged.');
    if (!isLanguage(language) || !room.problem.acceptedLanguages.includes(language)) {
      throw new DuelError('That language is not accepted for this problem.');
    }
    let cleanSource: string;
    try {
      cleanSource = validateCode(source);
    } catch (error) {
      throw new DuelError((error as Error).message);
    }

    player.judging = true;
    this.broadcast(room);

    try {
      const outcome = await judge(cleanSource, language, room.problem.testCases, room.problem);
      if (room.phase === 'in-progress') {
        player.submissions += 1;
        player.lastVerdict = outcome.verdict;
        player.bestPassed = Math.max(player.bestPassed, outcome.passed);
        if (outcome.verdict === 'accepted') {
          player.solvedInMs = Date.now() - (room.startedAt ?? Date.now());
          await this.finish(room, player.userId, 'solved');
        }
      }
      return {
        verdict: outcome.verdict,
        passedTestCases: outcome.passed,
        totalTestCases: outcome.total,
        testResults: sanitizeTestResults(outcome.results),
      };
    } catch (error) {
      if (error instanceof ExecutionUnavailableError) {
        throw new DuelError('The code runner is temporarily unavailable. Please try again.');
      }
      throw error;
    } finally {
      player.judging = false;
      this.broadcast(room);
    }
  }

  handleDisconnect(socket: Socket, user: SocketUser) {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.userId === user.userId);
      if (!player || !player.socketIds.delete(socket.id) || player.socketIds.size > 0) continue;
      if (room.phase === 'finished') continue;

      this.broadcast(room);
      player.disconnectTimer = setTimeout(() => {
        player.disconnectTimer = null;
        if (player.socketIds.size === 0) this.removePlayer(room, player.userId);
      }, RECONNECT_GRACE_MS);
    }
  }

  /** Test/shutdown helper. */
  shutdown() {
    for (const room of this.rooms.values()) {
      this.clearTimer(room);
      room.players.forEach((p) => p.disconnectTimer && clearTimeout(p.disconnectTimer));
    }
    this.rooms.clear();
  }
}
