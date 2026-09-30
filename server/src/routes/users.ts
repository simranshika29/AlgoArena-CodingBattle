import express from 'express';
import User from '../models/User';
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
