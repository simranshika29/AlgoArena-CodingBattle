import crypto from 'crypto';
import { HttpError } from '../middleware/errorHandler';
import { Difficulty } from '../models/Problem';
import ProblemSet, { SetDifficulty } from '../models/ProblemSet';
import User from '../models/User';
import { loadCatalog } from './catalog';
import { fetchCodeforcesProgress } from './codeforcesProgress';
import { CatalogItem, SourceId } from './providers';
import { normalizeTitle } from './providers/topics';
import { getSolvedProblemIds } from './stats';

export const MAX_SET_SIZE = 50;

export interface GenerateOptions {
  difficulty: SetDifficulty;
  topics: string[];
  count: number;
  sources: SourceId[];
  excludeSolved: boolean;
  avoidRepeats: boolean;
}

/** Unbiased in-place Fisher–Yates shuffle using a cryptographic RNG. */
export const shuffle = <T>(items: T[]): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

/** Splits `count` across easy/medium/hard as evenly as possible (extra goes to easier levels). */
export const mixedTargets = (count: number): Record<Difficulty, number> => {
  const base = Math.floor(count / 3);
  const extra = count % 3;
  return { easy: base + (extra > 0 ? 1 : 0), medium: base + (extra > 1 ? 1 : 0), hard: base };
};

/**
 * Picks up to `count` items, alternating between sources so a large source cannot crowd
 * out a small one, and never taking two items with the same normalized title.
 */
const pickFrom = (candidates: CatalogItem[], count: number, usedTitles: Set<string>, usedKeys: Set<string>) => {
  const bySource = new Map<SourceId, CatalogItem[]>();
  for (const item of shuffle([...candidates])) {
    if (!bySource.has(item.source)) bySource.set(item.source, []);
    bySource.get(item.source)!.push(item);
  }
  const queues = shuffle([...bySource.values()]);
  const picked: CatalogItem[] = [];
  while (picked.length < count && queues.some((q) => q.length)) {
    for (const queue of queues) {
      if (picked.length >= count) break;
      while (queue.length) {
        const item = queue.shift()!;
        const title = normalizeTitle(item.title);
        if (usedKeys.has(item.key) || usedTitles.has(title)) continue;
        usedKeys.add(item.key);
        usedTitles.add(title);
        picked.push(item);
        break;
      }
    }
  }
  return picked;
};

export const generateProblemSet = async (userId: string, options: GenerateOptions) => {
  const catalog = await loadCatalog(options.sources);
  const warnings = [...catalog.warnings];
  if (catalog.unavailable.length === options.sources.length) {
    throw new HttpError(503, 'None of the selected problem sources are available right now. Please try again later.');
  }

  const topics = options.topics.map((t) => t.toLowerCase());
  const matching = catalog.items.filter(
    (item) =>
      (options.difficulty === 'mixed' || item.difficulty === options.difficulty) &&
      (!topics.length || item.topics.some((t) => topics.includes(t)))
  );

  // Problems to leave out: already solved, and (optionally) already served in earlier sets.
  const solvedKeys = new Set<string>();
  const seenKeys = new Set<string>();
  if (options.excludeSolved) {
    (await getSolvedProblemIds(userId)).forEach((id) => solvedKeys.add(`algoarena:${id}`));
    const user = await User.findById(userId).select('codeforcesHandle');
    if (user?.codeforcesHandle && options.sources.includes('codeforces')) {
      try {
        const { solved } = await fetchCodeforcesProgress(user.codeforcesHandle);
        solved.forEach((id) => solvedKeys.add(`codeforces:${id}`));
      } catch {
        warnings.push('Could not check your Codeforces submissions, so solved Codeforces problems may appear.');
      }
    }
  }
  const previousSets = await ProblemSet.find({ user: userId }).select('items.key items.externalStatus').lean();
  for (const set of previousSets) {
    for (const item of set.items) {
      if (options.excludeSolved && item.externalStatus === 'solved') solvedKeys.add(item.key);
      if (options.avoidRepeats) seenKeys.add(item.key);
    }
  }

  const eligible = matching.filter((item) => !solvedKeys.has(item.key));
  const fresh = eligible.filter((item) => !seenKeys.has(item.key));

  const usedTitles = new Set<string>();
  const usedKeys = new Set<string>();
  const picked: CatalogItem[] = [];
  const take = (pool: CatalogItem[], difficulty: Difficulty | null, count: number) =>
    picked.push(
      ...pickFrom(difficulty ? pool.filter((i) => i.difficulty === difficulty) : pool, count, usedTitles, usedKeys)
    );

  if (options.difficulty === 'mixed') {
    const targets = mixedTargets(options.count);
    (Object.keys(targets) as Difficulty[]).forEach((d) => take(fresh, d, targets[d]));
  }
  take(fresh, null, options.count - picked.length);

  // Pool of unseen problems exhausted: allow repeats rather than returning too few.
  if (picked.length < options.count && options.avoidRepeats) {
    const before = picked.length;
    take(eligible, null, options.count - picked.length);
    if (picked.length > before) {
      warnings.push(`You've already been given every matching problem, so ${picked.length - before} repeat(s) were included.`);
    }
  }
  if (picked.length < options.count) {
    warnings.push(
      picked.length
        ? `Only ${picked.length} problem(s) match these filters.`
        : 'No problems match these filters. Try another topic, difficulty or source.'
    );
  }

  const order = { easy: 0, medium: 1, hard: 2 } as const;
  picked.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  return { items: picked, warnings };
};
