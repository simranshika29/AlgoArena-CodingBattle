import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

interface TokenPayload {
  userId: string;
}

export const signToken = (userId: string): string =>
  jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] });

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    return decoded?.userId ? decoded : null;
  } catch {
    return null;
  }
};

const readBearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
  req.user = { userId: payload.userId };
  next();
};

/** Attaches the user when a valid token is present, but never rejects the request. */
export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  const payload = token ? verifyToken(token) : null;
  if (payload) req.user = { userId: payload.userId };
  next();
};

/** Checks admin rights against the database so revoked admins lose access immediately. */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user && (await User.findById(req.user.userId).select('isAdmin'));
    if (!user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const isUserAdmin = async (userId?: string): Promise<boolean> => {
  if (!userId) return false;
  const user = await User.findById(userId).select('isAdmin');
  return Boolean(user?.isAdmin);
};
