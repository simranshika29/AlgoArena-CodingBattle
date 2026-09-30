export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'javascript' | 'python' | 'c' | 'cpp' | 'java';
export type Verdict =
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'compile_error'
  | 'internal_error';

export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface ProblemSummary {
  _id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  acceptedLanguages: Language[];
  userStatus?: 'solved' | 'attempted' | null;
}

export interface ProblemPage {
  problems: ProblemSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Example {
  input: string;
  output: string;
}

export interface Problem extends ProblemSummary {
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  timeLimit: number;
  memoryLimit: number;
  examples: Example[];
  totalTestCases: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface TestResult {
  passed: boolean;
  status: Verdict;
  isHidden: boolean;
  input?: string;
  output?: string;
  expectedOutput?: string;
  error?: string;
  executionTime: number;
  memoryUsed: number;
}

export interface JudgeResult {
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTime?: number;
  testResults: TestResult[];
}

export interface SubmissionSummary {
  _id: string;
  problem: { _id: string; title: string; difficulty: Difficulty } | null;
  language: Language;
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTime?: number;
  createdAt: string;
}

export interface UserStats {
  solvedCount: number;
  attemptedCount: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  byDifficulty: Record<Difficulty, { solved: number; total: number }>;
  languageUsage: Partial<Record<Language, number>>;
  streak: { current: number; longest: number };
  activity: { date: string; count: number }[];
  recentSubmissions: SubmissionSummary[];
  solvedProblems: { _id: string; title: string; difficulty: Difficulty }[];
  duels: { played: number; wins: number; losses: number; draws: number };
  rank: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  solved: number;
  duelWins: number;
}

export interface DuelPlayer {
  userId: string;
  username: string;
  ready: boolean;
  connected: boolean;
  bestPassed: number;
  totalTestCases: number;
  solved: boolean;
  solvedInMs: number | null;
  submissions: number;
  judging: boolean;
  lastVerdict: Verdict | null;
}

export interface DuelRoomState {
  code: string;
  hostId: string;
  phase: 'waiting' | 'countdown' | 'in-progress' | 'finished';
  players: DuelPlayer[];
  problem: Problem | null;
  countdownEndsAt: number | null;
  startedAt: number | null;
  endsAt: number | null;
  winnerId: string | null;
  outcome: 'solved' | 'timeout' | 'forfeit' | 'draw' | null;
  serverNow: number;
}

export interface OpenRoom {
  code: string;
  host: string;
  createdAt: number;
}

export interface DuelHistoryEntry {
  _id: string;
  roomCode: string;
  problem: { _id: string; title: string; difficulty: Difficulty } | null;
  players: { user: string; username: string; passedTestCases: number; totalTestCases: number; solvedInMs: number | null }[];
  winner: string | null;
  outcome: 'solved' | 'timeout' | 'forfeit' | 'draw';
  endedAt: string;
}
