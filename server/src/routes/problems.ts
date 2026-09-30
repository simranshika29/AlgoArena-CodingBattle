import express from 'express';
import mongoose from 'mongoose';
import Problem, { DIFFICULTIES, toPublicProblem } from '../models/Problem';
import { AuthRequest, authenticateToken, isUserAdmin, optionalAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { getAttemptedProblemIds, getSolvedProblemIds } from '../services/stats';
import { escapeRegex, isDifficulty, isObjectId, validateProblemInput } from '../utils/validation';

const router = express.Router();

const LIST_PROJECTION = { title: 1, difficulty: 1, tags: 1, acceptedLanguages: 1, createdAt: 1 };

// List approved problems with search, filters, pagination, and per-user solve status.
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const { difficulty, search, tag, status } = req.query;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));

    const query: Record<string, any> = { status: 'approved' };
    if (isDifficulty(difficulty)) query.difficulty = difficulty;
    if (typeof tag === 'string' && tag) query.tags = tag.toLowerCase();
    if (typeof search === 'string' && search.trim()) {
      const pattern = escapeRegex(search.trim().slice(0, 100));
      query.$or = [
        { title: { $regex: pattern, $options: 'i' } },
        { tags: { $regex: pattern, $options: 'i' } },
      ];
    }

    let solved = new Set<string>();
    let attempted = new Set<string>();
    if (req.user) {
      const [solvedIds, attemptedIds] = await Promise.all([
        getSolvedProblemIds(req.user.userId),
        getAttemptedProblemIds(req.user.userId),
      ]);
      solved = new Set(solvedIds);
      attempted = new Set(attemptedIds);
      const toIds = (ids: string[]) => ids.map((id) => new mongoose.Types.ObjectId(id));
      if (status === 'solved') query._id = { $in: toIds(solvedIds) };
      else if (status === 'unsolved') query._id = { $nin: toIds(solvedIds) };
      else if (status === 'attempted') query._id = { $in: toIds(attemptedIds.filter((id) => !solved.has(id))) };
    }

    const [problems, total] = await Promise.all([
      Problem.aggregate([
        { $match: query },
        // Sort easy → medium → hard (alphabetical order would put hard before medium).
        { $addFields: { difficultyRank: { $indexOfArray: [[...DIFFICULTIES], '$difficulty'] } } },
        { $sort: { difficultyRank: 1, createdAt: 1, _id: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: LIST_PROJECTION },
      ]),
      Problem.countDocuments(query),
    ]);

    res.json({
      problems: problems.map((p: { _id: mongoose.Types.ObjectId }) => {
        const id = p._id.toString();
        return {
          ...p,
          userStatus: solved.has(id) ? 'solved' : attempted.has(id) ? 'attempted' : null,
        };
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  })
);

router.get(
  '/tags',
  asyncHandler(async (_req, res) => {
    const tags = await Problem.distinct('tags', { status: 'approved' });
    res.json(tags.sort());
  })
);

router.get(
  '/contributions/mine',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const problems = await Problem.find({ createdBy: req.user!.userId })
      .select('title difficulty status createdAt')
      .sort({ createdAt: -1 });
    res.json(problems);
  })
);

router.get(
  '/admin/pending',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const pending = await Problem.find({ status: 'pending' })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(pending);
  })
);

const setStatus = (status: 'approved' | 'rejected') =>
  asyncHandler(async (req, res) => {
    if (!isObjectId(req.params.id)) throw new HttpError(404, 'Problem not found');
    const problem = await Problem.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!problem) throw new HttpError(404, 'Problem not found');
    res.json({ _id: problem._id, status: problem.status });
  });

router.patch('/admin/:id/approve', authenticateToken, requireAdmin, setStatus('approved'));
router.patch('/admin/:id/reject', authenticateToken, requireAdmin, setStatus('rejected'));

router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!isObjectId(req.params.id)) throw new HttpError(404, 'Problem not found');
    const problem = await Problem.findById(req.params.id).lean();
    if (!problem) throw new HttpError(404, 'Problem not found');

    if (problem.status !== 'approved') {
      const isOwner = req.user && problem.createdBy?.toString() === req.user.userId;
      if (!isOwner && !(await isUserAdmin(req.user?.userId))) throw new HttpError(404, 'Problem not found');
    }

    res.json(toPublicProblem(problem));
  })
);

// Any user can contribute a problem; it stays pending until an admin approves it.
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const data = validateProblemInput(req.body);
    const problem = await Problem.create({ ...data, createdBy: req.user!.userId, status: 'pending' });
    res.status(201).json({ _id: problem._id, title: problem.title, status: problem.status });
  })
);

router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isObjectId(req.params.id)) throw new HttpError(404, 'Problem not found');
    const data = validateProblemInput(req.body);
    const problem = await Problem.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!problem) throw new HttpError(404, 'Problem not found');
    res.json(problem);
  })
);

router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isObjectId(req.params.id)) throw new HttpError(404, 'Problem not found');
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) throw new HttpError(404, 'Problem not found');
    res.json({ message: 'Problem deleted' });
  })
);

export default router;
