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
  googleLinked?: boolean;
  codeforcesHandle?: string | null;
}

export type SourceId = 'algoarena' | 'codeforces';

export interface ProblemSummary {
  _id: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  acceptedLanguages?: Language[];
  userStatus?: 'solved' | 'attempted' | null;
  /** Present when browsing across sources. */
  source?: SourceId;
  url?: string;
  external?: boolean;
  rating?: number | null;
}

export interface ProblemPage {
  problems: ProblemSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  warnings?: string[];
}

export interface Example {
  input: string;
  output: string;
}

export interface Problem extends ProblemSummary {
  acceptedLanguages: Language[];
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

export interface ProviderStatus {
  id: SourceId;
  name: string;
  judged: boolean;
  homepage: string;
  attribution: string;
  available: boolean;
  problemCount: number;
  fetchedAt: string | null;
  stale: boolean;
  error: string | null;
}

export type SetDifficulty = Difficulty | 'mixed';

export interface PracticeOptions {
  sources: ProviderStatus[];
  topics: string[];
  maxCount: number;
}

export interface PracticeItem {
  key: string;
  source: SourceId;
  externalId: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  url: string;
  judged: boolean;
  rating?: number;
  status: 'solved' | 'attempted' | null;
}

export interface PracticeSet {
  _id: string;
  criteria: {
    difficulty: SetDifficulty;
    topics: string[];
    count: number;
    sources: SourceId[];
    excludeSolved: boolean;
    avoidRepeats: boolean;
  };
  items: PracticeItem[];
  warnings: string[];
  solvedCount: number;
  codeforcesSyncedAt: string | null;
  createdAt: string;
}
