/**
 * Minimal client for the official Codeforces API (https://codeforces.com/apiHelp).
 * Codeforces allows at most one call every two seconds, so calls are serialized.
 */
const BASE_URL = 'https://codeforces.com/api';
const MIN_INTERVAL_MS = 2100;
const TIMEOUT_MS = 20_000;

export class CodeforcesApiError extends Error {
  constructor(message: string, public notFound = false) {
    super(message);
  }
}

let queue: Promise<unknown> = Promise.resolve();
let lastCallAt = 0;

type Fetcher = typeof fetch;
let fetcher: Fetcher = (...args) => fetch(...args);

/** Test hook: replace the network layer. */
export const setCodeforcesFetcher = (custom: Fetcher | null) => {
  fetcher = custom ?? ((...args) => fetch(...args));
  lastCallAt = 0;
};

const call = async <T>(method: string, params: Record<string, string>): Promise<T> => {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0 && process.env.NODE_ENV !== 'test') await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetcher(`${BASE_URL}/${method}?${new URLSearchParams(params)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    throw new CodeforcesApiError(`Codeforces is unreachable (${(error as Error).message})`);
  } finally {
    clearTimeout(timer);
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    throw new CodeforcesApiError(`Codeforces returned an unexpected response (HTTP ${response.status})`);
  }
  if (body?.status !== 'OK') {
    const comment = String(body?.comment || `HTTP ${response.status}`);
    throw new CodeforcesApiError(`Codeforces API error: ${comment}`, /not found/i.test(comment));
  }
  return body.result as T;
};

export const codeforcesApi = <T>(method: string, params: Record<string, string> = {}): Promise<T> => {
  const run = () => call<T>(method, params);
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
};

export interface CodeforcesProblem {
  contestId?: number;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

export interface CodeforcesSubmission {
  problem: { contestId?: number; index: string; name: string };
  verdict?: string;
}

export const problemUrl = (contestId: number, index: string) =>
  `https://codeforces.com/problemset/problem/${contestId}/${index}`;
