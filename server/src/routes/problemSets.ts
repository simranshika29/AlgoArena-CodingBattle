import express from 'express';
import rateLimit from 'express-rate-limit';
import ProblemSet, { IProblemSet, SET_DIFFICULTIES, SetDifficulty } from '../models/ProblemSet';
import User from '../models/User';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { loadCatalog, providerStatuses } from '../services/catalog';
import { codeforcesStatusOf, fetchCodeforcesProgress } from '../services/codeforcesProgress';
import { generateProblemSet, MAX_SET_SIZE } from '../services/problemSets';
import { isSourceId, providers, SourceId } from '../services/providers';
import { getAttemptedProblemIds, getSolvedProblemIds } from '../services/stats';
import { isObjectId } from '../utils/validation';

const router = express.Router();

const perUser = (limit: number, windowMs: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `user:${(req as AuthRequest).user?.userId}`,
    message: { message },
  });

const generateLimiter = perUser(20, 60 * 1000, 'You are generating sets too quickly. Please wait a minute.');
const syncLimiter = perUser(5, 60 * 1000, 'Please wait a minute before checking Codeforces again.');

// Sources (with live availability) and topics available for generating sets.
router.get(
  '/options',
  asyncHandler(async (_req, res) => {
    const [sources, catalog] = await Promise.all([
      providerStatuses(),
      loadCatalog(providers().map((p) => p.id)),
    ]);
    const topics = Array.from(new Set(catalog.items.flatMap((i) => i.topics))).sort();
    res.json({ sources, topics, maxCount: MAX_SET_SIZE, difficulties: SET_DIFFICULTIES });
  })
);

/** Adds per-item progress: AlgoArena from real submissions, Codeforces from the last verified sync. */
const withProgress = async (set: IProblemSet | any, userId: string) => {
  const [solved, attempted] = await Promise.all([getSolvedProblemIds(userId), getAttemptedProblemIds(userId)]);
  const solvedSet = new Set(solved);
  const attemptedSet = new Set(attempted);
  const plain = typeof set.toObject === 'function' ? set.toObject() : set;
  const items = plain.items.map((item: any) => ({
    ...item,
    status:
      item.source === 'algoarena'
        ? solvedSet.has(item.externalId)
          ? 'solved'
          : attemptedSet.has(item.externalId)
            ? 'attempted'
            : null
        : item.externalStatus ?? null,
  }));
  return { ...plain, items, solvedCount: items.filter((i: any) => i.status === 'solved').length };
};

router.post(
  '/',
  authenticateToken,
  generateLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    const body = req.body || {};
    const difficulty: SetDifficulty = body.difficulty ?? 'mixed';
    if (!(SET_DIFFICULTIES as readonly string[]).includes(difficulty)) {
      throw new HttpError(400, 'Difficulty must be easy, medium, hard or mixed');
    }
    const count = Number(body.count ?? 10);
    if (!Number.isInteger(count) || count < 1 || count > MAX_SET_SIZE) {
      throw new HttpError(400, `Choose between 1 and ${MAX_SET_SIZE} problems`);
    }
    const sources: SourceId[] = Array.isArray(body.sources) && body.sources.length ? body.sources : ['algoarena'];
    if (!sources.every(isSourceId)) throw new HttpError(400, 'Unknown problem source');
    const topics: string[] = Array.isArray(body.topics) ? body.topics : [];
    if (topics.length > 10 || !topics.every((t) => typeof t === 'string' && t.length <= 40)) {
      throw new HttpError(400, 'Choose at most 10 topics');
    }

    const criteria = {
      difficulty,
      topics: topics.map((t) => t.toLowerCase()),
      count,
      sources: Array.from(new Set(sources)),
      excludeSolved: body.excludeSolved !== false,
      avoidRepeats: body.avoidRepeats !== false,
    };
    const { items, warnings } = await generateProblemSet(req.user!.userId, criteria);
    if (!items.length) return res.status(200).json({ set: null, warnings });

    const set = await ProblemSet.create({ user: req.user!.userId, criteria, items, warnings });
    res.status(201).json({ set: await withProgress(set, req.user!.userId), warnings });
  })
);

router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const sets = await ProblemSet.find({ user: req.user!.userId }).sort({ createdAt: -1 }).limit(30).lean();
    res.json(await Promise.all(sets.map((set) => withProgress(set, req.user!.userId))));
  })
);

const loadOwnSet = async (req: AuthRequest) => {
  if (!isObjectId(req.params.id)) throw new HttpError(404, 'Practice set not found');
  const set = await ProblemSet.findOne({ _id: req.params.id, user: req.user!.userId });
  if (!set) throw new HttpError(404, 'Practice set not found');
  return set;
};

router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    res.json(await withProgress(await loadOwnSet(req), req.user!.userId));
  })
);

router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const set = await loadOwnSet(req);
    await set.deleteOne();
    res.json({ message: 'Practice set deleted' });
  })
);

// Verify Codeforces problems in this set against the user's real Codeforces submissions.
router.post(
  '/:id/sync-codeforces',
  authenticateToken,
  syncLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    const set = await loadOwnSet(req);
    const user = await User.findById(req.user!.userId).select('codeforcesHandle');
    if (!user?.codeforcesHandle) throw new HttpError(400, 'Add your Codeforces handle first.');

    let progress;
    try {
      progress = await fetchCodeforcesProgress(user.codeforcesHandle);
    } catch (error) {
      throw new HttpError(503, `Could not reach Codeforces: ${(error as Error).message}`);
    }
    set.items.forEach((item) => {
      if (item.source === 'codeforces') item.externalStatus = codeforcesStatusOf(item, progress);
    });
    set.codeforcesSyncedAt = new Date();
    set.markModified('items');
    await set.save();
    res.json(await withProgress(set, req.user!.userId));
  })
);

export default router;
