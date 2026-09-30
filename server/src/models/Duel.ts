import mongoose, { Schema, Document } from 'mongoose';

/** A finished duel, persisted for history and leaderboards. Live duels are held in memory. */
export interface IDuelPlayer {
  user: mongoose.Types.ObjectId;
  username: string;
  passedTestCases: number;
  totalTestCases: number;
  solvedInMs: number | null;
  submissions: number;
}

export interface IDuel extends Document<mongoose.Types.ObjectId> {
  roomCode: string;
  problem: mongoose.Types.ObjectId;
  players: IDuelPlayer[];
  winner: mongoose.Types.ObjectId | null;
  outcome: 'solved' | 'timeout' | 'forfeit' | 'draw';
  startedAt: Date;
  endedAt: Date;
}

const DuelSchema = new Schema({
  roomCode: { type: String, required: true },
  problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
  players: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true },
      passedTestCases: { type: Number, default: 0 },
      totalTestCases: { type: Number, default: 0 },
      solvedInMs: { type: Number, default: null },
      submissions: { type: Number, default: 0 },
    },
  ],
  winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  outcome: { type: String, enum: ['solved', 'timeout', 'forfeit', 'draw'], required: true },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true },
});

DuelSchema.index({ 'players.user': 1, endedAt: -1 });
DuelSchema.index({ winner: 1 });

export default mongoose.model<IDuel>('Duel', DuelSchema);
