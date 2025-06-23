import express from 'express';
import Submission from '../models/Submission';
import Problem from '../models/Problem';
import { authenticateToken } from '../middleware/auth';
import { executeCode } from '../services/codeExecutor';

const router = express.Router();

// Get user's submissions
router.get('/my-submissions', authenticateToken, async (req, res) => {
  try {
    const submissions = await Submission.find({ user: req.user?.userId })
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: (error as Error).message });
  }
});

// Submit code
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;

    // Find problem
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Create submission
    const submission = new Submission({
      problem: problemId,
      user: req.user?.userId,
      code,
      language,
      totalTestCases: problem.testCases.length
    });

    await submission.save();

    // Execute code against test cases
    const testResults = await executeCode(code, language, problem.testCases);
    
    // Update submission with results
    submission.testResults = testResults;
    submission.passedTestCases = testResults.filter(result => result.passed).length;
    submission.status = 'completed';
    submission.executionTime = Math.max(...testResults.map(result => result.executionTime));
    submission.memoryUsed = Math.max(...testResults.map(result => result.memoryUsed));

    await submission.save();

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting code', error: (error as Error).message });
  }
});

// Get submission details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problem', 'title difficulty')
      .populate('user', 'username');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Only allow users to view their own submissions
    if (submission.user._id.toString() !== req.user?.userId) {
      return res.status(403).json({ message: 'Not authorized to view this submission' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission', error: (error as Error).message });
  }
});

export default router; 