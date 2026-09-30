import { Difficulty } from '../../models/Problem';

export const SOURCE_IDS = ['algoarena', 'codeforces'] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

/** A problem from any source, in one shape the catalog and generator can work with. */
export interface CatalogItem {
  /** Globally unique: `${source}:${externalId}` */
  key: string;
  source: SourceId;
  externalId: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  /** App path for AlgoArena problems, absolute URL for external ones. */
  url: string;
  /** True when the problem can be run and judged on AlgoArena itself. */
  judged: boolean;
  rating?: number;
}

export interface ProviderListing {
  items: CatalogItem[];
  fetchedAt: Date | null;
  /** True when serving cached data because the live source could not be refreshed. */
  stale: boolean;
}

export interface ProviderStatus {
  id: SourceId;
  name: string;
  judged: boolean;
  homepage: string;
  attribution: string;
  available: boolean;
  problemCount: number;
  fetchedAt: Date | null;
  stale: boolean;
  error: string | null;
}

/**
 * A source of practice problems. To add a platform, implement this interface with
 * its official API and register it in providers/index.ts. Never scrape a site whose
 * terms or robots.txt disallow automated access.
 */
export interface ProblemProvider {
  readonly id: SourceId;
  readonly name: string;
  readonly judged: boolean;
  readonly homepage: string;
  readonly attribution: string;
  list(): Promise<ProviderListing>;
  status(): Promise<ProviderStatus>;
}

export class ProviderUnavailableError extends Error {
  constructor(public provider: SourceId, message: string) {
    super(message);
  }
}
