import { Language } from '../../models/Problem';
import { ExecutionProvider, ExecutionUnavailableError, RunLimits, RunResult } from './types';

/**
 * Judge0 language ids. These classic ids exist on the public CE instance,
 * the RapidAPI-hosted instance, and default self-hosted installs.
 */
const LANGUAGE_IDS: Record<Language, number> = {
  c: 50, // C (GCC 9.2.0)
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1) - class must be named Main
  javascript: 63, // JavaScript (Node.js 12.14.0)
  python: 71, // Python (3.8.1)
};

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_CHARS = 64 * 1024;

const b64encode = (value: string) => Buffer.from(value, 'utf8').toString('base64');
const b64decode = (value?: string | null) => (value ? Buffer.from(value, 'base64').toString('utf8') : '');

export class Judge0Provider implements ExecutionProvider {
  readonly name = 'judge0';

  constructor(private baseUrl: string, private apiKey: string) {}

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      const host = new URL(this.baseUrl).host;
      if (host.endsWith('rapidapi.com')) {
        headers['X-RapidAPI-Key'] = this.apiKey;
        headers['X-RapidAPI-Host'] = host;
      } else {
        headers['X-Auth-Token'] = this.apiKey;
      }
    }
    return headers;
  }

  async run(code: string, language: Language, stdin: string, limits: RunLimits): Promise<RunResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          language_id: LANGUAGE_IDS[language],
          source_code: b64encode(code),
          stdin: b64encode(stdin),
          cpu_time_limit: Math.min(Math.max(limits.timeLimitMs / 1000, 0.5), 15),
          wall_time_limit: Math.min(Math.max((limits.timeLimitMs * 3) / 1000, 2), 20),
          memory_limit: Math.min(Math.max(limits.memoryLimitMb * 1024, 32_000), 512_000),
          enable_network: false,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      throw new ExecutionUnavailableError(`Judge0 request failed: ${(error as Error).message}`);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 429) {
      throw new ExecutionUnavailableError('The code runner is rate limited right now. Please retry in a moment.');
    }
    if (!response.ok) {
      throw new ExecutionUnavailableError(`Judge0 responded with HTTP ${response.status}`);
    }

    const body: any = await response.json();
    const statusId: number = body?.status?.id ?? 13;
    const stdout = b64decode(body.stdout).slice(0, MAX_OUTPUT_CHARS);
    const stderr = (b64decode(body.stderr) || b64decode(body.message)).slice(0, MAX_OUTPUT_CHARS);
    const timeMs = Math.round(parseFloat(body.time || '0') * 1000);
    const memoryKb = Number(body.memory) || 0;

    // https://ce.judge0.com/statuses
    if (statusId === 6) {
      return { status: 'compile_error', stdout: '', stderr: b64decode(body.compile_output), timeMs, memoryKb };
    }
    if (statusId === 5) return { status: 'time_limit_exceeded', stdout, stderr, timeMs, memoryKb };
    if (statusId >= 7 && statusId <= 12) return { status: 'runtime_error', stdout, stderr, timeMs, memoryKb };
    if (statusId === 3 || statusId === 4) return { status: 'ok', stdout, stderr, timeMs, memoryKb };
    if (statusId === 1 || statusId === 2) {
      throw new ExecutionUnavailableError('Judge0 did not finish the run in time');
    }
    return { status: 'internal_error', stdout, stderr, timeMs, memoryKb };
  }
}
