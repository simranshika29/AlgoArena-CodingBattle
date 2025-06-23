import mongoose, { Schema, Document } from 'mongoose';

export interface IDuel extends Document {
  challenger: mongoose.Types.ObjectId;
  opponent?: mongoose.Types.ObjectId;
  problem: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'finished';
  result?: {
    winner: mongoose.Types.ObjectId;
    challengerTime: number;
    opponentTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DuelSchema: Schema = new Schema({
  challenger: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: Schema.Types.ObjectId, ref: 'User' },
  problem: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
  status: { type: String, enum: ['pending', 'active', 'finished'], default: 'pending' },
  result: {
    winner: { type: Schema.Types.ObjectId, ref: 'User' },
    challengerTime: Number,
    opponentTime: Number,
  },
}, { timestamps: true });

export default mongoose.model<IDuel>('Duel', DuelSchema); 