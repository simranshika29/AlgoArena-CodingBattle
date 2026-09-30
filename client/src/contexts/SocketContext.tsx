import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import config from '../config';
import { useAuth } from './AuthContext';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

interface AckResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface SocketContextType {
  socket: Socket | null;
  state: ConnectionState;
  /** Emits an event and resolves with the server's data, or rejects with a user-facing message. */
  request: <T>(event: string, payload?: object) => Promise<T>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const REQUEST_TIMEOUT_MS = 60_000;

/** One authenticated socket for the whole app, so navigating between pages keeps duel state. */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<ConnectionState>('idle');

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSocket(null);
      setState('idle');
      return;
    }
    const next = io(config.socketUrl, { auth: { token }, transports: ['websocket', 'polling'] });
    setState('connecting');
    next.on('connect', () => setState('connected'));
    next.on('disconnect', () => setState('connecting'));
    next.on('connect_error', () => setState('error'));
    setSocket(next);
    return () => {
      next.removeAllListeners();
      next.disconnect();
    };
  }, [isAuthenticated, token]);

  const request = useCallback(
    <T,>(event: string, payload: object = {}) =>
      new Promise<T>((resolve, reject) => {
        if (!socket?.connected) {
          reject(new Error('Not connected to the duel server yet. Please wait a moment.'));
          return;
        }
        socket.timeout(REQUEST_TIMEOUT_MS).emit(event, payload, (err: Error | null, response: AckResponse<T>) => {
          if (err) reject(new Error('The duel server did not respond. Please try again.'));
          else if (!response?.ok) reject(new Error(response?.error || 'Something went wrong.'));
          else resolve(response.data as T);
        });
      }),
    [socket]
  );

  return <SocketContext.Provider value={{ socket, state, request }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
