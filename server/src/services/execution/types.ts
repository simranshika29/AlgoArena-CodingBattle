import { Language } from '../../models/Problem';

export type RunStatus = 'ok' | 'runtime_error' | 'time_limit_exceeded' | 'compile_error' | 'internal_error';

export interface RunLimits {
  /** CPU/wall time limit in milliseconds (already adjusted for the language). */
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface RunResult {
  status: RunStatus;
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKb: number;
}

/** Runs one program against one stdin inside an isolated sandbox. */
export interface ExecutionProvider {
  readonly name: string;
  run(code: string, language: Language, stdin: string, limits: RunLimits): Promise<RunResult>;
}

/** Thrown when the sandbox itself is unreachable/misconfigured (not the user's fault). */
export class ExecutionUnavailableError extends Error {}
