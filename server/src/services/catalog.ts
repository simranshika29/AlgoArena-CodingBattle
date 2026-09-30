import { formatDistanceToNowStrict } from './time';
import { CatalogItem, getProvider, ProviderStatus, providers, SourceId } from './providers';

export interface CatalogResult {
  items: CatalogItem[];
  warnings: string[];
  unavailable: SourceId[];
}

/**
 * Loads problems from the requested sources. A source that is down never breaks the
 * request: its cached snapshot is used (with a warning), or it is skipped (with a warning).
 */
export const loadCatalog = async (sources: SourceId[]): Promise<CatalogResult> => {
  const warnings: string[] = [];
  const unavailable: SourceId[] = [];
  const items: CatalogItem[] = [];

  for (const id of sources) {
    const provider = getProvider(id);
    if (!provider) {
      unavailable.push(id);
      warnings.push(`${id} is not enabled on this server.`);
      continue;
    }
    try {
      const listing = await provider.list();
      if (listing.stale && listing.fetchedAt) {
        warnings.push(
          `${provider.name} could not be reached, so its problem list is from ${formatDistanceToNowStrict(listing.fetchedAt)} ago.`
        );
      }
      items.push(...listing.items);
    } catch (error) {
      unavailable.push(id);
      warnings.push(`${provider.name} is unavailable right now, so its problems were skipped.`);
      console.error(`Provider ${id} failed:`, (error as Error).message);
    }
  }
  return { items, warnings, unavailable };
};

export const providerStatuses = (): Promise<ProviderStatus[]> => Promise.all(providers().map((p) => p.status()));

export interface CatalogQuery {
  search?: string;
  difficulty?: string;
  topic?: string;
}

const DIFFICULTY_RANK = { easy: 0, medium: 1, hard: 2 } as const;

/** Filters and orders catalog items: AlgoArena first, then external problems by rating. */
export const queryCatalog = (items: CatalogItem[], query: CatalogQuery): CatalogItem[] => {
  const search = query.search?.trim().toLowerCase();
  const topic = query.topic?.toLowerCase();
  return items
    .filter((item) => !query.difficulty || item.difficulty === query.difficulty)
    .filter((item) => !topic || item.topics.includes(topic))
    .filter(
      (item) =>
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.topics.some((t) => t.includes(search)) ||
        item.externalId.toLowerCase() === search
    )
    .sort(
      (a, b) =>
        Number(b.judged) - Number(a.judged) ||
        DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
        (a.rating ?? 0) - (b.rating ?? 0)
    );
};
