import express from 'express';
import User from '../models/User';
import Submission from '../models/Submission';
import Problem from '../models/Problem';

const router = express.Router();

// Portfolio route
router.get('/:id/portfolio', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const totalSubmissions = await Submission.countDocuments({ user: userId });
    const completedSubmissions = await Submission.countDocuments({ user: userId, status: 'completed' });

    // Problems attempted and solved
    const attemptedProblemIds = await Submission.distinct('problem', { user: userId });
    const solvedProblemIds = await Submission.distinct('problem', {
      user: userId,
      status: 'completed',
      $expr: { $eq: ['$passedTestCases', '$totalTestCases'] }
    });

    // Get problem titles
    const attemptedProblems = await Problem.find({ _id: { $in: attemptedProblemIds } }, { _id: 1, title: 1 });
    const solvedProblems = await Problem.find({ _id: { $in: solvedProblemIds } }, { _id: 1, title: 1 });

    // Language usage breakdown
    const languageAgg = await Submission.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);
    const languageUsage: Record<string, number> = {};
    languageAgg.forEach(l => { languageUsage[l._id] = l.count; });

    res.json({
      totalSubmissions,
      completedSubmissions,
      problemsAttempted: attemptedProblems.length,
      problemsSolved: solvedProblems.length,
      attemptedProblems,
      solvedProblems,
      languageUsage
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch portfolio stats' });
  }
});

export default router; 