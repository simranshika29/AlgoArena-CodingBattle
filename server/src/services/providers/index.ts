import { config } from '../../config';
import { CodeforcesProvider } from './codeforces';
import { LocalProvider } from './local';
import { ProblemProvider, SourceId, SOURCE_IDS } from './types';

export * from './types';

export const localProvider = new LocalProvider();
export const codeforcesProvider = new CodeforcesProvider();

/**
 * Registered problem sources. LeetCode, HackerRank and CodeChef are not listed
 * because none of them currently offers a public API that permits this use
 * (see README > Problem sources). Add a provider here once one does.
 */
export const providers = (): ProblemProvider[] => [
  localProvider,
  ...(config.providers.codeforces ? [codeforcesProvider] : []),
];

export const getProvider = (id: SourceId) => providers().find((p) => p.id === id);

export const isSourceId = (value: unknown): value is SourceId =>
  typeof value === 'string' && (SOURCE_IDS as readonly string[]).includes(value);
