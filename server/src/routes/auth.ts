import crypto from 'crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { InvalidGoogleTokenError, verifyGoogleCredential } from '../services/googleAuth';
import User, { toPublicUser } from '../models/User';
import { AuthRequest, authenticateToken, signToken } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { escapeRegex } from '../utils/validation';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body || {};

    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      throw new HttpError(400, 'Username, email, and password are required');
    }
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!USERNAME_REGEX.test(cleanUsername)) {
      throw new HttpError(400, 'Username must be 3–20 characters: letters, numbers, and underscores only');
    }
    if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > 254) {
      throw new HttpError(400, 'Please enter a valid email address');
    }
    if (password.length < 8 || password.length > 128) {
      throw new HttpError(400, 'Password must be between 8 and 128 characters');
    }

    const [emailTaken, usernameTaken] = await Promise.all([
      User.exists({ email: cleanEmail }),
      User.exists({ username: { $regex: `^${escapeRegex(cleanUsername)}$`, $options: 'i' } }),
    ]);
    if (emailTaken) throw new HttpError(409, 'An account with this email already exists');
    if (usernameTaken) throw new HttpError(409, 'This username is already taken');

    const user = await User.create({ username: cleanUsername, email: cleanEmail, password });
    res.status(201).json({ token: signToken(user._id.toString()), user: toPublicUser(user) });
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      throw new HttpError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (user && !user.password && user.googleId) {
      throw new HttpError(400, 'This account signs in with Google. Use "Continue with Google".');
    }
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'Invalid email or password');
    }

    res.json({ token: signToken(user._id.toString()), user: toPublicUser(user) });
  })
);

// Public settings the client needs at runtime (the Google client id is not a secret).
router.get('/config', (_req, res) => {
  res.json({ googleClientId: config.googleClientId || null });
});

const requireGoogleConfigured = () => {
  if (!config.googleClientId) throw new HttpError(503, 'Google sign-in is not configured on this server.');
};

const readGoogleIdentity = async (credential: unknown) => {
  if (typeof credential !== 'string' || !credential) throw new HttpError(400, 'Missing Google credential');
  let identity;
  try {
    identity = await verifyGoogleCredential(credential);
  } catch (error) {
    if (error instanceof InvalidGoogleTokenError) throw new HttpError(401, 'Google sign-in failed. Please try again.');
    throw error;
  }
  if (!identity.emailVerified) throw new HttpError(401, 'Your Google email address is not verified.');
  return identity;
};

/** Builds a free, valid username from the Google account name/email. */
const uniqueUsername = async (email: string, name: string) => {
  const clean = (value: string) =>
    value.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 16);
  let base = clean(email.split('@')[0]) || clean(name) || 'coder';
  if (base.length < 3) base = `${base}_dev`;
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt++) {
    const taken = await User.exists({ username: { $regex: `^${escapeRegex(candidate)}$`, $options: 'i' } });
    if (!taken) return candidate;
    candidate = `${base.slice(0, 15)}_${crypto.randomInt(1000, 10000)}`;
  }
  throw new HttpError(500, 'Could not create a username. Please try again.');
};

// Sign in (or sign up) with a Google Identity Services ID token.
router.post(
  '/google',
  authLimiter,
  asyncHandler(async (req, res) => {
    requireGoogleConfigured();
    const identity = await readGoogleIdentity(req.body?.credential);

    const linked = await User.findOne({ googleId: identity.sub });
    if (linked) return res.json({ token: signToken(linked._id.toString()), user: toPublicUser(linked) });

    const existing = await User.findOne({ email: identity.email });
    if (existing) {
      // Never auto-merge into a password account: the password must be confirmed once,
      // otherwise whoever registered that email first would share the account.
      return res.status(409).json({
        code: 'LINK_REQUIRED',
        email: identity.email,
        message: 'An AlgoArena account already uses this email. Enter its password once to link Google sign-in.',
      });
    }

    const user = await User.create({
      username: await uniqueUsername(identity.email, identity.name),
      email: identity.email,
      googleId: identity.sub,
    });
    res.status(201).json({ token: signToken(user._id.toString()), user: toPublicUser(user) });
  })
);

// Link Google to an existing password account (keeps all progress), then sign in.
router.post(
  '/google/link',
  authLimiter,
  asyncHandler(async (req, res) => {
    requireGoogleConfigured();
    const identity = await readGoogleIdentity(req.body?.credential);
    const { password } = req.body || {};
    if (typeof password !== 'string' || !password) throw new HttpError(400, 'Enter your AlgoArena password');

    const user = await User.findOne({ email: identity.email }).select('+password');
    if (!user || !(await user.comparePassword(password))) throw new HttpError(401, 'Incorrect password');
    if (user.googleId && user.googleId !== identity.sub) {
      throw new HttpError(409, 'This account is already linked to a different Google account.');
    }
    user.googleId = identity.sub;
    await user.save();
    res.json({ token: signToken(user._id.toString()), user: toPublicUser(user) });
  })
);

router.get(
  '/me',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.user!.userId);
    if (!user) throw new HttpError(401, 'Account not found. Please log in again.');
    res.json({ user: toPublicUser(user) });
  })
);

export default router;
