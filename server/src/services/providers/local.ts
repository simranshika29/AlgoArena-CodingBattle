import Problem from '../../models/Problem';
import { CatalogItem, ProblemProvider, ProviderListing, ProviderStatus } from './types';

/** AlgoArena's own approved problems: the only ones with test cases that can be judged here. */
export class LocalProvider implements ProblemProvider {
  readonly id = 'algoarena' as const;
  readonly name = 'AlgoArena';
  readonly judged = true;
  readonly homepage = '/problems';
  readonly attribution = 'Curated and community problems, judged on AlgoArena';

  async list(): Promise<ProviderListing> {
    const problems = await Problem.find({ status: 'approved' }).select('title difficulty tags').sort({ createdAt: 1 }).lean();
    const items: CatalogItem[] = problems.map((p) => ({
      key: `algoarena:${p._id}`,
      source: 'algoarena',
      externalId: p._id.toString(),
      title: p.title,
      difficulty: p.difficulty,
      topics: p.tags || [],
      url: `/problems/${p._id}`,
      judged: true,
    }));
    return { items, fetchedAt: new Date(), stale: false };
  }

  async status(): Promise<ProviderStatus> {
    const problemCount = await Problem.countDocuments({ status: 'approved' });
    return {
      id: this.id,
      name: this.name,
      judged: this.judged,
      homepage: this.homepage,
      attribution: this.attribution,
      available: true,
      problemCount,
      fetchedAt: new Date(),
      stale: false,
      error: null,
    };
  }
}
