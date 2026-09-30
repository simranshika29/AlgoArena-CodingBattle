import mongoose from 'mongoose';

export const LANGUAGES = ['javascript', 'python', 'c', 'cpp', 'java'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface ITestCase {
  _id?: mongoose.Types.ObjectId;
  input: string;
  output: string;
  isHidden: boolean;
}

export interface IProblem extends mongoose.Document<mongoose.Types.ObjectId> {
  title: string;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  difficulty: Difficulty;
  tags: string[];
  testCases: ITestCase[];
  timeLimit: number;
  memoryLimit: number;
  createdAt: Date;
  createdBy?: mongoose.Types.ObjectId | null;
  status: 'pending' | 'approved' | 'rejected';
  acceptedLanguages: Language[];
}

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 10000 },
  inputFormat: { type: String, default: '', maxlength: 2000 },
  outputFormat: { type: String, default: '', maxlength: 2000 },
  constraints: { type: String, default: '', maxlength: 2000 },
  difficulty: { type: String, enum: DIFFICULTIES, required: true },
  tags: { type: [String], default: [] },
  testCases: [
    {
      input: { type: String, default: '' },
      output: { type: String, required: true },
      isHidden: { type: Boolean, default: false },
    },
  ],
  timeLimit: { type: Number, required: true, default: 1000 }, // milliseconds
  memoryLimit: { type: Number, required: true, default: 256 }, // MB
  createdAt: { type: Date, default: Date.now },
  // null for problems curated by the platform (seed data)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  acceptedLanguages: { type: [String], enum: LANGUAGES, required: true },
});

problemSchema.index({ status: 1, difficulty: 1 });
problemSchema.index({ status: 1, tags: 1 });

/**
 * Shape sent to regular users: sample (visible) test cases become examples;
 * hidden test cases never leave the server.
 */
export const toPublicProblem = (problem: any) => {
  const testCases: ITestCase[] = problem.testCases || [];
  return {
    _id: problem._id,
    title: problem.title,
    description: problem.description,
    inputFormat: problem.inputFormat || '',
    outputFormat: problem.outputFormat || '',
    constraints: problem.constraints || '',
    difficulty: problem.difficulty,
    tags: problem.tags || [],
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    acceptedLanguages: problem.acceptedLanguages,
    status: problem.status,
    createdAt: problem.createdAt,
    examples: testCases.filter((tc) => !tc.isHidden).map((tc) => ({ input: tc.input, output: tc.output })),
    totalTestCases: testCases.length,
  };
};

export default mongoose.model<IProblem>('Problem', problemSchema);
