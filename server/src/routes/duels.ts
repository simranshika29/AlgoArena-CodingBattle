import express from 'express';
import mongoose from 'mongoose';
import Duel from '../models/Duel';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

// Live duels run over Socket.io (see duels/socketHandlers.ts); this exposes finished-duel history.
const router = express.Router();

router.get(
  '/history',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));
    const duels = await Duel.find({ 'players.user': userId })
      .sort({ endedAt: -1 })
      .limit(limit)
      .populate('problem', 'title difficulty');
    res.json(duels);
  })
);

export default router;
