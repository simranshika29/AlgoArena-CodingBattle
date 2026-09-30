import express from 'express';
import rateLimit from 'express-rate-limit';
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
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'Invalid email or password');
    }

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
