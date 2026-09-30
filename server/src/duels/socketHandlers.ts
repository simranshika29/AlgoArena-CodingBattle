import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';
import User from '../models/User';
import { DuelError, DuelManager, SocketUser } from './duelManager';

type Ack = (response: unknown) => void;

/** Wraps a handler so it always answers the client's ack with data or a safe error message. */
const handle =
  (fn: (payload: any) => unknown | Promise<unknown>) =>
  async (payload: unknown, ack?: Ack) => {
    const reply: Ack = typeof ack === 'function' ? ack : () => undefined;
    try {
      reply({ ok: true, data: await fn(payload ?? {}) });
    } catch (error) {
      if (!(error instanceof DuelError)) console.error('Duel handler error:', error);
      reply({ ok: false, error: error instanceof DuelError ? error.message : 'Something went wrong. Please try again.' });
    }
  };

export const registerDuelHandlers = (io: Server, manager: DuelManager) => {
  // Identity comes from the JWT, never from client-supplied user ids.
  io.use(async (socket, next) => {
    try {
      const payload = verifyToken(String(socket.handshake.auth?.token || ''));
      const user = payload && (await User.findById(payload.userId).select('username'));
      if (!user) return next(new Error('unauthorized'));
      socket.data.user = { userId: user._id.toString(), username: user.username } satisfies SocketUser;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUser = socket.data.user;

    socket.on('lobby:subscribe', handle(() => {
      socket.join('lobby');
      return manager.listOpenRooms();
    }));
    socket.on('lobby:unsubscribe', () => socket.leave('lobby'));

    socket.on('duel:active', handle(() => manager.active(socket, user)));
    socket.on('duel:create', handle(() => manager.create(socket, user)));
    socket.on('duel:join', handle(({ code }) => manager.join(socket, user, code)));
    socket.on('duel:leave', handle(({ code }) => manager.leave(socket, user, code)));
    socket.on('duel:ready', handle(({ code, ready }) => manager.setReady(user, code, ready !== false)));
    socket.on('duel:submit', handle(({ code, language, source }) => manager.submit(user, code, language, source)));

    socket.on('disconnect', () => manager.handleDisconnect(socket, user));
  });
};
