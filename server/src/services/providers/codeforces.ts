import ProviderSnapshot from '../../models/ProviderSnapshot';
import { codeforcesApi, CodeforcesProblem, problemUrl } from './codeforcesClient';
import { codeforcesDifficulty, normalizeCodeforcesTags } from './topics';
import { CatalogItem, ProblemProvider, ProviderListing, ProviderStatus, ProviderUnavailableError } from './types';

const REFRESH_AFTER_MS = 6 * 60 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000;

type CompactProblem = [contestId: number, index: string, name: string, rating: number, tags: string[]];

/** Keeps only rated programming problems, in a compact form suitable for the snapshot. */
export const compactProblems = (problems: CodeforcesProblem[]): CompactProblem[] =>
  problems
    .filter((p) => p.type === 'PROGRAMMING' && typeof p.contestId === 'number' && typeof p.rating === 'number')
    .map((p) => [p.contestId!, p.index, p.name, p.rating!, p.tags]);

/**
 * Converts compact rows to catalog items. A problem's identity is its contest id + index:
 * the problemset API already lists shared Div. 1/Div. 2 problems once, and problems that
 * merely share a title (e.g. 505A and 506E, "Mr. Kitayuta's Gift") are different problems.
 */
export const toCatalogItems = (rows: CompactProblem[]): CatalogItem[] => {
  const seen = new Set<string>();
  const items: CatalogItem[] = [];
  for (const [contestId, index, name, rating, tags] of rows) {
    const difficulty = codeforcesDifficulty(rating);
    const externalId = `${contestId}${index}`;
    if (!difficulty || seen.has(externalId)) continue;
    seen.add(externalId);
    items.push({
      key: `codeforces:${externalId}`,
      source: 'codeforces',
      externalId,
      title: name,
      difficulty,
      topics: normalizeCodeforcesTags(tags),
      url: problemUrl(contestId, index),
      judged: false,
      rating,
    });
  }
  return items;
};

/** Problem metadata from the official Codeforces API. Statements stay on codeforces.com. */
export class CodeforcesProvider implements ProblemProvider {
  readonly id = 'codeforces' as const;
  readonly name = 'Codeforces';
  readonly judged = false;
  readonly homepage = 'https://codeforces.com/problemset';
  readonly attribution = 'Problem data from the official Codeforces API. Solve and submit on codeforces.com.';

  private cache: ProviderListing | null = null;
  private refreshing: Promise<ProviderListing> | null = null;
  private lastError: string | null = null;
  private lastAttemptAt = 0;

  private async fetchLive(): Promise<ProviderListing> {
    const result = await codeforcesApi<{ problems: CodeforcesProblem[] }>('problemset.problems');
    const rows = compactProblems(result.problems);
    if (!rows.length) throw new Error('Codeforces returned no problems');
    const fetchedAt = new Date();
    await ProviderSnapshot.updateOne(
      { provider: this.id },
      { $set: { fetchedAt, data: rows } },
      { upsert: true }
    ).catch((error) => console.error('Could not save Codeforces snapshot:', error.message));
    this.lastError = null;
    return { items: toCatalogItems(rows), fetchedAt, stale: false };
  }

  private async loadSnapshot(): Promise<ProviderListing | null> {
    const snapshot = await ProviderSnapshot.findOne({ provider: this.id }).lean();
    if (!snapshot) return null;
    const stale = Date.now() - new Date(snapshot.fetchedAt).getTime() > REFRESH_AFTER_MS;
    return { items: toCatalogItems(snapshot.data as CompactProblem[]), fetchedAt: snapshot.fetchedAt, stale };
  }

  private refresh(): Promise<ProviderListing> {
    if (!this.refreshing) {
      this.refreshing = this.fetchLive()
        .then((listing) => (this.cache = listing))
        .catch((error: Error) => {
          this.lastError = error.message;
          throw error;
        })
        .finally(() => {
          this.refreshing = null;
        });
    }
    return this.refreshing;
  }

  /** Refreshes without making the caller wait; retries at most every few minutes after a failure. */
  private refreshInBackground() {
    if (this.refreshing || Date.now() - this.lastAttemptAt < RETRY_AFTER_FAILURE_MS) return;
    this.lastAttemptAt = Date.now();
    this.refresh().catch(() => {
      if (this.cache) this.cache = { ...this.cache, stale: true };
    });
  }

  async list(): Promise<ProviderListing> {
    // After a restart, start from the stored snapshot instead of waiting on the network.
    if (!this.cache) this.cache = await this.loadSnapshot().catch(() => null);

    if (this.cache) {
      const age = this.cache.fetchedAt ? Date.now() - this.cache.fetchedAt.getTime() : Infinity;
      if (this.cache.stale || age >= REFRESH_AFTER_MS) this.refreshInBackground();
      return this.cache;
    }

    try {
      this.lastAttemptAt = Date.now();
      return await this.refresh();
    } catch (error) {
      throw new ProviderUnavailableError(this.id, `Codeforces is unavailable right now (${(error as Error).message}).`);
    }
  }

  async status(): Promise<ProviderStatus> {
    let listing: ProviderListing | null = null;
    try {
      listing = await this.list();
    } catch {
      listing = null;
    }
    return {
      id: this.id,
      name: this.name,
      judged: this.judged,
      homepage: this.homepage,
      attribution: this.attribution,
      available: Boolean(listing),
      problemCount: listing?.items.length ?? 0,
      fetchedAt: listing?.fetchedAt ?? null,
      stale: listing?.stale ?? false,
      error: listing && !listing.stale ? null : this.lastError,
    };
  }

  /** Test hook. */
  reset() {
    this.cache = null;
    this.refreshing = null;
    this.lastError = null;
    this.lastAttemptAt = 0;
  }
}
