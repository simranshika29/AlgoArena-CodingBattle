import { codeforcesApi, CodeforcesSubmission } from './providers/codeforcesClient';

export interface CodeforcesProgress {
  /** Problem ids (e.g. "1791A") with at least one accepted submission. */
  solved: Set<string>;
  /** Problem ids with submissions but none accepted. */
  attempted: Set<string>;
}

/** Reads a user's real submissions from the Codeforces API. */
export const fetchCodeforcesProgress = async (handle: string): Promise<CodeforcesProgress> => {
  const submissions = await codeforcesApi<CodeforcesSubmission[]>('user.status', { handle });
  const solved = new Set<string>();
  const tried = new Set<string>();
  for (const s of submissions) {
    if (typeof s.problem.contestId !== 'number') continue;
    const id = `${s.problem.contestId}${s.problem.index}`;
    if (s.verdict === 'OK') solved.add(id);
    else tried.add(id);
  }
  return { solved, attempted: new Set([...tried].filter((id) => !solved.has(id))) };
};

export const codeforcesStatusOf = (item: { externalId: string }, progress: CodeforcesProgress) =>
  progress.solved.has(item.externalId) ? 'solved' : progress.attempted.has(item.externalId) ? 'attempted' : null;
