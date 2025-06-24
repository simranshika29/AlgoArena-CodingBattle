import mongoose from 'mongoose';

export interface ITestCase {
  _id?: mongoose.Types.ObjectId;
  input: string;
  output: string;
  isHidden: boolean;
}

export interface IProblem extends mongoose.Document {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: ITestCase[];
  timeLimit: number;
  memoryLimit: number;
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  acceptedLanguages: ('java' | 'c' | 'cpp' | 'python' | 'javascript')[];
}

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  testCases: [{
    input: {
      type: String,
      required: true
    },
    output: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  }],
  timeLimit: {
    type: Number,
    required: true,
    default: 1000 // milliseconds
  },
  memoryLimit: {
    type: Number,
    required: true,
    default: 256 // MB
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  acceptedLanguages: {
    type: [String],
    enum: ['java', 'c', 'cpp', 'python', 'javascript'],
    required: true,
  },
});

export default mongoose.model<IProblem>('Problem', problemSchema); 