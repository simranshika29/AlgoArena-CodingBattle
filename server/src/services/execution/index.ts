import { config } from '../../config';
import { Language } from '../../models/Problem';
import { ITestResult, Verdict } from '../../models/Submission';
import { DockerProvider } from './docker';
import { Judge0Provider } from './judge0';
import { ExecutionProvider, ExecutionUnavailableError } from './types';

export { ExecutionUnavailableError } from './types';

/** Interpreted/JIT languages get proportionally more time, as on most judges. */
const TIME_MULTIPLIER: Record<Language, number> = {
  c: 1,
  cpp: 1,
  java: 2,
  javascript: 2,
  python: 3,
};

const CONCURRENCY = 3;
const MAX_STORED_OUTPUT = 2000;

export interface JudgeCase {
  _id?: any;
  input: string;
  output: string;
  isHidden: boolean;
}

export interface JudgeLimits {
  timeLimit: number; // ms
  memoryLimit: number; // MB
}

export interface JudgeOutcome {
  verdict: Verdict;
  results: ITestResult[];
  passed: number;
  total: number;
  maxTimeMs: number;
  maxMemoryKb: number;
}

let provider: ExecutionProvider | null | undefined;

export const setExecutionProvider = (custom: ExecutionProvider | null) => {
  provider = custom;
};

const getProvider = (): ExecutionProvider | null => {
  if (provider !== undefined) return provider;
  const { execution } = config;
  if (execution.provider === 'judge0') provider = new Judge0Provider(execution.judge0Url, execution.judge0ApiKey);
  else if (execution.provider === 'docker') provider = new DockerProvider();
  else provider = null;
  return provider;
};

/** Normalizes line endings and trailing whitespace so formatting noise isn't a wrong answer. */
export const normalizeOutput = (value: string) =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
    .replace(/^\n+/, '');

const truncate = (value: string) =>
  value.length > MAX_STORED_OUTPUT ? `${value.slice(0, MAX_STORED_OUTPUT)}\n… (truncated)` : value;

/** Runs a solution against the given test cases and computes an overall verdict. */
export async function judge(
  code: string,
  language: Language,
  testCases: JudgeCase[],
  limits: JudgeLimits
): Promise<JudgeOutcome> {
  const runner = getProvider();
  if (!runner) {
    throw new ExecutionUnavailableError('Code execution is disabled on this server.');
  }

  const runLimits = {
    timeLimitMs: limits.timeLimit * TIME_MULTIPLIER[language],
    memoryLimitMb: limits.memoryLimit,
  };
  const results: ITestResult[] = new Array(testCases.length);
  let compileError: string | null = null;
  let next = 0;

  const worker = async () => {
    while (next < testCases.length) {
      const index = next++;
      const testCase = testCases[index];
      if (compileError !== null) {
        results[index] = buildResult(testCase, 'compile_error', '', compileError, 0, 0);
        continue;
      }
      const run = await runner.run(code, language, testCase.input, runLimits);
      if (run.status === 'compile_error') {
        compileError = run.stderr;
        results[index] = buildResult(testCase, 'compile_error', '', run.stderr, 0, 0);
        continue;
      }
      if (run.status !== 'ok') {
        const status = run.status === 'time_limit_exceeded' ? 'time_limit_exceeded'
          : run.status === 'runtime_error' ? 'runtime_error' : 'internal_error';
        results[index] = buildResult(testCase, status, run.stdout, run.stderr, run.timeMs, run.memoryKb);
        continue;
      }
      const passed = normalizeOutput(run.stdout) === normalizeOutput(testCase.output);
      results[index] = buildResult(
        testCase, passed ? 'accepted' : 'wrong_answer', run.stdout, run.stderr, run.timeMs, run.memoryKb
      );
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, testCases.length) }, worker));

  const failed = results.find((r) => !r.passed);
  const passed = results.filter((r) => r.passed).length;
  return {
    verdict: failed ? failed.status : 'accepted',
    results,
    passed,
    total: results.length,
    maxTimeMs: results.reduce((max, r) => Math.max(max, r.executionTime), 0),
    maxMemoryKb: results.reduce((max, r) => Math.max(max, r.memoryUsed), 0),
  };
}

function buildResult(
  testCase: JudgeCase,
  status: Verdict,
  output: string,
  error: string,
  timeMs: number,
  memoryKb: number
): ITestResult {
  return {
    testCase: testCase._id,
    passed: status === 'accepted',
    status,
    isHidden: testCase.isHidden,
    input: truncate(testCase.input),
    output: truncate(output),
    expectedOutput: truncate(testCase.output),
    error: truncate(error),
    executionTime: timeMs,
    memoryUsed: memoryKb,
  };
}
