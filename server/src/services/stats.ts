import mongoose from 'mongoose';
import Duel from '../models/Duel';
import Problem from '../models/Problem';
import Submission from '../models/Submission';
import User from '../models/User';

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_DAYS = 84; // 12 weeks

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/** Distinct problem ids the user has an accepted submission for. */
export const getSolvedProblemIds = async (userId: string): Promise<string[]> => {
  const ids = await Submission.distinct('problem', { user: userId, verdict: 'accepted' });
  return ids.map((id: mongoose.Types.ObjectId) => id.toString());
};

export const getAttemptedProblemIds = async (userId: string): Promise<string[]> => {
  const ids = await Submission.distinct('problem', { user: userId });
  return ids.map((id: mongoose.Types.ObjectId) => id.toString());
};

/** Current and longest run of consecutive UTC days with at least one submission. */
export const computeStreaks = (activeDays: string[], today = new Date()) => {
  const days = new Set(activeDays);
  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of [...days].sort()) {
    const time = Date.parse(day);
    run = previous !== null && time - previous === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = time;
  }

  let current = 0;
  let cursor = Date.parse(dayKey(today));
  // A streak is still alive if the user hasn't submitted yet today.
  if (!days.has(dayKey(new Date(cursor)))) cursor -= DAY_MS;
  while (days.has(dayKey(new Date(cursor)))) {
    current += 1;
    cursor -= DAY_MS;
  }
  return { current, longest };
};

export const getDuelRecord = async (userId: string) => {
  const objectId = new mongoose.Types.ObjectId(userId);
  const [played, wins, draws] = await Promise.all([
    Duel.countDocuments({ 'players.user': objectId }),
    Duel.countDocuments({ winner: objectId }),
    Duel.countDocuments({ 'players.user': objectId, winner: null }),
  ]);
  return { played, wins, draws, losses: played - wins - draws };
};

/** Aggregated, data-backed statistics for dashboards and profiles. */
export const getUserStats = async (userId: string) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  const [solvedIds, attemptedIds, totalSubmissions, acceptedSubmissions, languageAgg, dayAgg, recent, duels, totals] =
    await Promise.all([
      getSolvedProblemIds(userId),
      getAttemptedProblemIds(userId),
      Submission.countDocuments({ user: objectId }),
      Submission.countDocuments({ user: objectId, verdict: 'accepted' }),
      Submission.aggregate([{ $match: { user: objectId } }, { $group: { _id: '$language', count: { $sum: 1 } } }]),
      Submission.aggregate([
        { $match: { user: objectId } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
      Submission.find({ user: objectId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('problem language verdict passedTestCases totalTestCases createdAt')
        .populate('problem', 'title difficulty'),
      getDuelRecord(userId),
      Problem.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
    ]);

  const solvedProblems = await Problem.find({ _id: { $in: solvedIds } }).select('title difficulty');
  const byDifficulty = { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } };
  totals.forEach((t: { _id: keyof typeof byDifficulty; count: number }) => {
    if (byDifficulty[t._id]) byDifficulty[t._id].total = t.count;
  });
  solvedProblems.forEach((p) => {
    byDifficulty[p.difficulty].solved += 1;
  });

  const languageUsage: Record<string, number> = {};
  languageAgg.forEach((l: { _id: string; count: number }) => {
    languageUsage[l._id] = l.count;
  });

  const activityMap = new Map<string, number>(dayAgg.map((d: { _id: string; count: number }) => [d._id, d.count]));
  const today = Date.parse(dayKey(new Date()));
  const activity = Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const date = dayKey(new Date(today - (ACTIVITY_DAYS - 1 - i) * DAY_MS));
    return { date, count: activityMap.get(date) || 0 };
  });

  return {
    solvedCount: solvedIds.length,
    attemptedCount: attemptedIds.length,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate: totalSubmissions ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
    byDifficulty,
    languageUsage,
    streak: computeStreaks([...activityMap.keys()]),
    activity,
    recentSubmissions: recent,
    solvedProblems,
    duels,
  };
};

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  solved: number;
  duelWins: number;
}

/** Ranks users by distinct problems solved, then duel wins. */
export const getLeaderboard = async (limit = 50): Promise<LeaderboardEntry[]> => {
  const [solvedAgg, winsAgg] = await Promise.all([
    Submission.aggregate([
      { $match: { verdict: 'accepted' } },
      { $group: { _id: { user: '$user', problem: '$problem' } } },
      { $group: { _id: '$_id.user', solved: { $sum: 1 } } },
    ]),
    Duel.aggregate([{ $match: { winner: { $ne: null } } }, { $group: { _id: '$winner', wins: { $sum: 1 } } }]),
  ]);

  const scores = new Map<string, { solved: number; duelWins: number }>();
  solvedAgg.forEach((s: { _id: mongoose.Types.ObjectId; solved: number }) =>
    scores.set(s._id.toString(), { solved: s.solved, duelWins: 0 })
  );
  winsAgg.forEach((w: { _id: mongoose.Types.ObjectId; wins: number }) => {
    const entry = scores.get(w._id.toString()) || { solved: 0, duelWins: 0 };
    entry.duelWins = w.wins;
    scores.set(w._id.toString(), entry);
  });

  const users = await User.find({ _id: { $in: [...scores.keys()] } }).select('username');
  const names = new Map(users.map((u) => [u._id.toString(), u.username]));

  const sorted = [...scores.entries()]
    .filter(([id]) => names.has(id))
    .map(([id, s]) => ({ userId: id, username: names.get(id)!, ...s }))
    .sort((a, b) => b.solved - a.solved || b.duelWins - a.duelWins || a.username.localeCompare(b.username));

  // Standard competition ranking: ties share a rank.
  let lastRank = 0;
  return sorted.slice(0, limit).map((entry, index) => {
    const prev = sorted[index - 1];
    const tied = prev && prev.solved === entry.solved && prev.duelWins === entry.duelWins;
    lastRank = tied ? lastRank : index + 1;
    return { rank: lastRank, ...entry };
  });
};
