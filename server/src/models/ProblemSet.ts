import mongoose from 'mongoose';
import { DIFFICULTIES } from './Problem';

export const SET_DIFFICULTIES = [...DIFFICULTIES, 'mixed'] as const;
export type SetDifficulty = (typeof SET_DIFFICULTIES)[number];

export interface IProblemSetItem {
  key: string;
  source: 'algoarena' | 'codeforces';
  externalId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  url: string;
  judged: boolean;
  rating?: number;
  /** For external problems: verified from the source (e.g. Codeforces submissions). */
  externalStatus?: 'solved' | 'attempted' | null;
}

export interface IProblemSet extends mongoose.Document<mongoose.Types.ObjectId> {
  user: mongoose.Types.ObjectId;
  criteria: {
    difficulty: SetDifficulty;
    topics: string[];
    count: number;
    sources: string[];
    excludeSolved: boolean;
    avoidRepeats: boolean;
  };
  items: IProblemSetItem[];
  warnings: string[];
  codeforcesSyncedAt?: Date | null;
  createdAt: Date;
}

const problemSetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  criteria: {
    difficulty: { type: String, enum: SET_DIFFICULTIES, required: true },
    topics: { type: [String], default: [] },
    count: { type: Number, required: true },
    sources: { type: [String], default: [] },
    excludeSolved: { type: Boolean, default: true },
    avoidRepeats: { type: Boolean, default: true },
  },
  items: [
    {
      _id: false,
      key: { type: String, required: true },
      source: { type: String, required: true },
      externalId: { type: String, required: true },
      title: { type: String, required: true },
      difficulty: { type: String, enum: DIFFICULTIES, required: true },
      topics: { type: [String], default: [] },
      url: { type: String, required: true },
      judged: { type: Boolean, default: false },
      rating: Number,
      externalStatus: { type: String, enum: ['solved', 'attempted', null], default: null },
    },
  ],
  warnings: { type: [String], default: [] },
  codeforcesSyncedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

problemSetSchema.index({ user: 1, createdAt: -1 });
problemSetSchema.index({ user: 1, 'items.key': 1 });

export default mongoose.model<IProblemSet>('ProblemSet', problemSetSchema);
