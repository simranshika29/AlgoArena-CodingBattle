import express from 'express';
import Duel from '../models/Duel';
import Problem from '../models/Problem';
import mongoose from 'mongoose';

const router = express.Router();

// Create a new duel (open challenge)
router.post('/create', async (req, res) => {
  try {
    const { challengerId } = req.body;
    // Pick a random approved problem
    const problems = await Problem.aggregate([{ $match: { status: 'approved' } }, { $sample: { size: 1 } }]);
    const problem = problems[0];
    if (!problem) return res.status(400).json({ error: 'No approved problems available' });
    const duel = await Duel.create({
      challenger: new mongoose.Types.ObjectId(challengerId),
      problem: problem._id,
      status: 'pending',
    });
    res.json(duel);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// List open duels (lobby)
router.get('/lobby', async (req, res) => {
  try {
    const duels = await Duel.find({ status: 'pending' }).populate('challenger', 'username');
    res.json(duels);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// Join a duel
router.post('/join/:duelId', async (req, res) => {
  try {
    const { opponentId } = req.body;
    const { duelId } = req.params;
    const duel = await Duel.findById(duelId);
    if (!duel || duel.status !== 'pending') return res.status(400).json({ error: 'Duel not available' });
    duel.opponent = new mongoose.Types.ObjectId(opponentId);
    duel.status = 'active';
    await duel.save();
    res.json(duel);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

// Get duel status
router.get('/:duelId', async (req, res) => {
  try {
    const { duelId } = req.params;
    const duel = await Duel.findById(duelId).populate('challenger opponent problem');
    if (!duel) return res.status(404).json({ error: 'Duel not found' });
    res.json(duel);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  }
});

export default router; 