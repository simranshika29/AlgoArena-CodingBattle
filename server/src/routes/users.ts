import express from 'express';
import User, { toPublicUser } from '../models/User';
import { codeforcesApi, CodeforcesApiError } from '../services/providers/codeforcesClient';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { getLeaderboard, getUserStats } from '../services/stats';
import { escapeRegex } from '../utils/validation';

const router = express.Router();

const withRank = async (userId: string) => {
  const board = await getLeaderboard(Number.MAX_SAFE_INTEGER);
  return board.find((entry) => entry.userId === userId)?.rank ?? null;
};

router.get(
  '/leaderboard',
  asyncHandler(async (req, res) => {
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
    res.json(await getLeaderboard(limit));
  })
);

// Private dashboard statistics for the logged-in user.
router.get(
  '/me/stats',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const [stats, rank] = await Promise.all([getUserStats(userId), withRank(userId)]);
    res.json({ ...stats, rank });
  })
);

// Link (or clear) a Codeforces handle, verified against the Codeforces API.
router.put(
  '/me/codeforces',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const raw = typeof req.body?.handle === 'string' ? req.body.handle.trim() : '';
    const user = await User.findById(req.user!.userId);
    if (!user) throw new HttpError(401, 'Account not found');

    if (!raw) {
      user.codeforcesHandle = undefined;
      await user.save();
      return res.json({ user: toPublicUser(user) });
    }
    if (!/^[A-Za-z0-9_.-]{3,24}$/.test(raw)) throw new HttpError(400, 'That is not a valid Codeforces handle');

    let profiles: { handle: string }[];
    try {
      profiles = await codeforcesApi<{ handle: string }[]>('user.info', { handles: raw });
    } catch (error) {
      if (error instanceof CodeforcesApiError && error.notFound) {
        throw new HttpError(400, `No Codeforces user named "${raw}"`);
      }
      throw new HttpError(503, 'Could not reach Codeforces to verify the handle. Please try again.');
    }
    user.codeforcesHandle = profiles[0]?.handle || raw;
    await user.save();
    res.json({ user: toPublicUser(user) });
  })
);

// Public profile: no email or other private fields.
router.get(
  '/:username/profile',
  asyncHandler(async (req, res) => {
    const username = String(req.params.username || '').slice(0, 20);
    const user = await User.findOne({ username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' } }).select(
      'username createdAt'
    );
    if (!user) throw new HttpError(404, 'User not found');

    const userId = user._id.toString();
    const [stats, rank] = await Promise.all([getUserStats(userId), withRank(userId)]);
    res.json({
      user: { id: userId, username: user.username, createdAt: user.createdAt },
      stats: { ...stats, rank },
    });
  })
);

export default router;
