import express from 'express';
import Problem from '../models/Problem';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all problems (only approved)
router.get('/', async (req, res) => {
  try {
    const { difficulty, search } = req.query;
    const query: any = { status: 'approved' };

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const problems = await Problem.find(query)
      .select('-testCases.isHidden')
      .sort({ createdAt: -1 });

    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching problems', error: (error as Error).message });
  }
});

// Get single problem
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .select('-testCases.isHidden');
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching problem', error: (error as Error).message });
  }
});

// Create new problem (user or admin, always pending)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const problem = new Problem({
      ...req.body,
      createdBy: req.user.userId,
      status: 'pending'
    });

    await problem.save();
    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating problem', error: (error as Error).message });
  }
});

// Update problem (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating problem', error: (error as Error).message });
  }
});

// Delete problem (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting problem', error: (error as Error).message });
  }
});

// Admin: Get all pending problems
router.get('/admin/pending', authenticateToken, isAdmin, async (req, res) => {
  // TODO: Add admin check here
  try {
    const pendingProblems = await Problem.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(pendingProblems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending problems', error: (error as Error).message });
  }
});

// Admin: Approve a problem
router.patch('/admin/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  // TODO: Add admin check here
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Error approving problem', error: (error as Error).message });
  }
});

// Admin: Reject a problem
router.patch('/admin/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  // TODO: Add admin check here
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting problem', error: (error as Error).message });
  }
});

export default router; 