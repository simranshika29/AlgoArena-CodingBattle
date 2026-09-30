import express from 'express';
import rateLimit from 'express-rate-limit';
import Problem, { IProblem } from '../models/Problem';
import Submission, { sanitizeTestResults } from '../models/Submission';
import { AuthRequest, authenticateToken, isUserAdmin } from '../middleware/auth';
import { asyncHandler, HttpError } from '../middleware/errorHandler';
import { ExecutionUnavailableError, judge } from '../services/execution';
import { isLanguage, isObjectId, validateCode } from '../utils/validation';

const router = express.Router();

// Code execution is the expensive path, so limit it per user.
const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Always mounted after authenticateToken, so a user id is present.
  keyGenerator: (req) => `user:${(req as AuthRequest).user?.userId}`,
  message: { message: 'You are running code too quickly. Please wait a minute and try again.' },
});

const loadRunnableProblem = async (req: AuthRequest): Promise<{ problem: IProblem; language: any; code: string }> => {
  const { problemId, language, code } = req.body || {};
  if (!isObjectId(problemId)) throw new HttpError(400, 'A valid problemId is required');
  if (!isLanguage(language)) throw new HttpError(400, 'Unsupported language');
  const cleanCode = validateCode(code);

  const problem = await Problem.findById(problemId);
  if (!problem) throw new HttpError(404, 'Problem not found');
  if (problem.status !== 'approved' && !(await isUserAdmin(req.user?.userId))) {
    throw new HttpError(404, 'Problem not found');
  }
  if (!problem.acceptedLanguages.includes(language)) {
    throw new HttpError(400, `${language} is not accepted for this problem`);
  }
  return { problem, language, code: cleanCode };
};

const runJudge = async (...args: Parameters<typeof judge>) => {
  try {
    return await judge(...args);
  } catch (error) {
    if (error instanceof ExecutionUnavailableError) {
      console.error('Execution unavailable:', error.message);
      throw new HttpError(503, 'The code runner is temporarily unavailable. Please try again shortly.');
    }
    throw error;
  }
};

// Run against the visible sample test cases only. Nothing is saved.
router.post(
  '/run',
  authenticateToken,
  executionLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    const { problem, language, code } = await loadRunnableProblem(req);
    const samples = problem.testCases.filter((tc) => !tc.isHidden);
    const outcome = await runJudge(code, language, samples, problem);
    res.json({
      verdict: outcome.verdict,
      passedTestCases: outcome.passed,
      totalTestCases: outcome.total,
      executionTime: outcome.maxTimeMs,
      testResults: sanitizeTestResults(outcome.results),
    });
  })
);

// Judge against every test case (including hidden ones) and record the submission.
router.post(
  '/',
  authenticateToken,
  executionLimiter,
  asyncHandler(async (req: AuthRequest, res) => {
    const { problem, language, code } = await loadRunnableProblem(req);
    const outcome = await runJudge(code, language, problem.testCases, problem);

    const submission = await Submission.create({
      problem: problem._id,
      user: req.user!.userId,
      code,
      language,
      status: 'completed',
      verdict: outcome.verdict,
      testResults: outcome.results,
      totalTestCases: outcome.total,
      passedTestCases: outcome.passed,
      executionTime: outcome.maxTimeMs,
      memoryUsed: outcome.maxMemoryKb,
    });

    res.status(201).json({
      _id: submission._id,
      verdict: submission.verdict,
      language: submission.language,
      passedTestCases: submission.passedTestCases,
      totalTestCases: submission.totalTestCases,
      executionTime: submission.executionTime,
      memoryUsed: submission.memoryUsed,
      createdAt: submission.createdAt,
      testResults: sanitizeTestResults(outcome.results),
    });
  })
);

// The current user's submissions, optionally for one problem. Code is omitted from the list.
router.get(
  '/mine',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const filter: Record<string, unknown> = { user: req.user!.userId };
    if (isObjectId(req.query.problemId)) filter.problem = req.query.problemId;
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));

    const submissions = await Submission.find(filter)
      .select('problem language verdict passedTestCases totalTestCases executionTime createdAt')
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(submissions);
  })
);

router.get(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!isObjectId(req.params.id)) throw new HttpError(404, 'Submission not found');
    const submission = await Submission.findById(req.params.id).populate('problem', 'title difficulty');
    if (!submission) throw new HttpError(404, 'Submission not found');
    if (submission.user.toString() !== req.user!.userId) {
      throw new HttpError(404, 'Submission not found');
    }

    const { testResults, ...rest } = submission.toObject();
    res.json({ ...rest, testResults: sanitizeTestResults(testResults) });
  })
);

export default router;
