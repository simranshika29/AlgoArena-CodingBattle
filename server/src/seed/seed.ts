import mongoose from 'mongoose';
import { config } from '../config';
import Problem, { LANGUAGES } from '../models/Problem';
import { seedProblems } from './problems';

/**
 * Upserts the curated problem set by title. Safe to re-run: it never deletes
 * problems and never touches user-contributed problems.
 */
export const seed = async () => {
  let created = 0;
  let updated = 0;

  for (const p of seedProblems) {
    const doc = {
      title: p.title,
      difficulty: p.difficulty,
      tags: p.tags,
      description: p.description,
      inputFormat: p.inputFormat,
      outputFormat: p.outputFormat,
      constraints: p.constraints,
      timeLimit: p.timeLimit ?? 1000,
      memoryLimit: 256,
      acceptedLanguages: p.acceptedLanguages ?? [...LANGUAGES],
      status: 'approved',
      createdBy: null,
      testCases: p.tests.map(([input, output, hidden]) => ({ input, output, isHidden: Boolean(hidden) })),
    };
    const result = await Problem.updateOne(
      { title: p.title, createdBy: null },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
    else if (result.modifiedCount) updated += 1;
  }

  return { created, updated, total: seedProblems.length };
};

if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(seed)
    .then(({ created, updated, total }) => {
      console.log(`Seeded ${total} problems (${created} created, ${updated} updated)`);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
