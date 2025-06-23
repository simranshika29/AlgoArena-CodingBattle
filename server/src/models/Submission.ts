import mongoose from 'mongoose';

export interface ITestResult {
  testCase: mongoose.Types.ObjectId;
  passed: boolean;
  output: string;
  expectedOutput: string;
  executionTime: number;
  memoryUsed: number;
}

export interface ISubmission extends mongoose.Document {
  problem: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  code: string;
  language: 'javascript' | 'python' | 'java' | 'cpp';
  status: 'pending' | 'running' | 'completed' | 'error';
  testResults: ITestResult[];
  totalTestCases: number;
  passedTestCases: number;
  executionTime: number;
  memoryUsed: number;
  createdAt: Date;
}

const submissionSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'error'],
    default: 'pending'
  },
  testResults: [{
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem.testCases'
    },
    passed: Boolean,
    output: String,
    expectedOutput: String,
    executionTime: Number,
    memoryUsed: Number
  }],
  totalTestCases: {
    type: Number,
    required: true
  },
  passedTestCases: {
    type: Number,
    default: 0
  },
  executionTime: {
    type: Number,
    default: 0
  },
  memoryUsed: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<ISubmission>('Submission', submissionSchema); 