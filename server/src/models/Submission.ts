import mongoose from 'mongoose';
import { LANGUAGES, Language } from './Problem';

export const VERDICTS = [
  'accepted',
  'wrong_answer',
  'runtime_error',
  'time_limit_exceeded',
  'compile_error',
  'internal_error',
] as const;
export type Verdict = (typeof VERDICTS)[number];

export interface ITestResult {
  testCase?: mongoose.Types.ObjectId;
  passed: boolean;
  status: Verdict;
  isHidden: boolean;
  input: string;
  output: string;
  expectedOutput: string;
  error: string;
  executionTime: number;
  memoryUsed: number;
}

export interface ISubmission extends mongoose.Document<mongoose.Types.ObjectId> {
  problem: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  code: string;
  language: Language;
  status: 'pending' | 'running' | 'completed' | 'error';
  verdict: Verdict;
  testResults: ITestResult[];
  totalTestCases: number;
  passedTestCases: number;
  executionTime: number;
  memoryUsed: number;
  createdAt: Date;
}

const submissionSchema = new mongoose.Schema({
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  language: { type: String, enum: LANGUAGES, required: true },
  status: { type: String, enum: ['pending', 'running', 'completed', 'error'], default: 'pending' },
  verdict: { type: String, enum: VERDICTS },
  testResults: [
    {
      testCase: { type: mongoose.Schema.Types.ObjectId },
      passed: Boolean,
      status: { type: String, enum: VERDICTS },
      isHidden: Boolean,
      input: String,
      output: String,
      expectedOutput: String,
      error: String,
      executionTime: Number,
      memoryUsed: Number,
    },
  ],
  totalTestCases: { type: Number, required: true },
  passedTestCases: { type: Number, default: 0 },
  executionTime: { type: Number, default: 0 },
  memoryUsed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ user: 1, problem: 1, verdict: 1 });
submissionSchema.index({ verdict: 1, user: 1 });

/** Hides inputs/outputs of hidden test cases so they cannot be scraped. */
export const sanitizeTestResults = (results: ITestResult[]) =>
  results.map((r) =>
    r.isHidden
      ? {
          passed: r.passed,
          status: r.status,
          isHidden: true,
          executionTime: r.executionTime,
          memoryUsed: r.memoryUsed,
          error: r.status === 'compile_error' ? r.error : '',
        }
      : {
          passed: r.passed,
          status: r.status,
          isHidden: false,
          input: r.input,
          output: r.output,
          expectedOutput: r.expectedOutput,
          error: r.error,
          executionTime: r.executionTime,
          memoryUsed: r.memoryUsed,
        }
  );

export default mongoose.model<ISubmission>('Submission', submissionSchema);
