import { Difficulty } from '../../models/Problem';

/**
 * Maps Codeforces tags onto the topic names AlgoArena already uses, so one topic
 * filter works across every source. Unmapped tags are kept as-is.
 */
const CODEFORCES_TOPICS: Record<string, string | null> = {
  dp: 'dynamic programming',
  sortings: 'sorting',
  'dfs and similar': 'graphs',
  'shortest paths': 'graphs',
  dsu: 'graphs',
  flows: 'graphs',
  'graph matchings': 'graphs',
  '2-sat': 'graphs',
  bitmasks: 'bit manipulation',
  'constructive algorithms': 'constructive',
  'chinese remainder theorem': 'number theory',
  'string suffix structures': 'strings',
  matrices: 'matrix',
  '*special': null, // marks special contests, not a topic
};

export const normalizeCodeforcesTags = (tags: string[]): string[] =>
  Array.from(
    new Set(
      tags
        .map((tag) => (tag in CODEFORCES_TOPICS ? CODEFORCES_TOPICS[tag] : tag.toLowerCase()))
        .filter((tag): tag is string => Boolean(tag))
    )
  );

/**
 * Codeforces ratings (800–3500) mapped onto AlgoArena's three difficulty levels.
 * Unrated problems return null and are left out, because their difficulty is unknown.
 */
export const codeforcesDifficulty = (rating?: number): Difficulty | null => {
  if (typeof rating !== 'number') return null;
  if (rating <= 1200) return 'easy';
  if (rating <= 1900) return 'medium';
  return 'hard';
};

export const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^a-z0-9]/g, '');
