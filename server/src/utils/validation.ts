import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler';
import { DIFFICULTIES, Difficulty, LANGUAGES, Language } from '../models/Problem';

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value);

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && (DIFFICULTIES as readonly string[]).includes(value);

export const MAX_CODE_LENGTH = 64 * 1024;

export const validateCode = (code: unknown): string => {
  if (typeof code !== 'string' || !code.trim()) throw new HttpError(400, 'Code cannot be empty');
  if (code.length > MAX_CODE_LENGTH) throw new HttpError(400, 'Code is too long (max 64 KB)');
  return code;
};

const str = (value: unknown, field: string, min: number, max: number, required = true): string => {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `${field} is required`);
    return '';
  }
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return trimmed;
};

const int = (value: unknown, field: string, min: number, max: number): number => {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new HttpError(400, `${field} must be a whole number between ${min} and ${max}`);
  }
  return num;
};

/** Validates a problem payload and returns only whitelisted fields (prevents mass assignment). */
export const validateProblemInput = (body: any) => {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid problem data');

  const difficulty = body.difficulty;
  if (!isDifficulty(difficulty)) throw new HttpError(400, 'Difficulty must be easy, medium, or hard');

  const acceptedLanguages = Array.isArray(body.acceptedLanguages) ? body.acceptedLanguages : [];
  if (!acceptedLanguages.length || !acceptedLanguages.every(isLanguage)) {
    throw new HttpError(400, `Choose at least one language from: ${LANGUAGES.join(', ')}`);
  }

  const rawTags = Array.isArray(body.tags) ? body.tags : [];
  if (rawTags.length > 5) throw new HttpError(400, 'Use at most 5 tags');
  const tags = Array.from(
    new Set(
      rawTags.map((tag: unknown) => {
        const clean = str(tag, 'Tag', 2, 24).toLowerCase();
        if (!/^[a-z0-9][a-z0-9 -]*$/.test(clean)) throw new HttpError(400, `Invalid tag: ${clean}`);
        return clean;
      })
    )
  ) as string[];

  const testCases = Array.isArray(body.testCases) ? body.testCases : [];
  if (testCases.length < 1 || testCases.length > 30) throw new HttpError(400, 'Provide between 1 and 30 test cases');
  const cleanCases = testCases.map((tc: any, index: number) => {
    if (typeof tc?.input !== 'string' || typeof tc?.output !== 'string') {
      throw new HttpError(400, `Test case ${index + 1} needs text input and output`);
    }
    if (!tc.output.trim()) throw new HttpError(400, `Test case ${index + 1} needs an expected output`);
    if (tc.input.length > 10000 || tc.output.length > 10000) {
      throw new HttpError(400, `Test case ${index + 1} is too large (max 10,000 characters)`);
    }
    return { input: tc.input, output: tc.output, isHidden: Boolean(tc.isHidden) };
  });
  if (!cleanCases.some((tc: { isHidden: boolean }) => !tc.isHidden)) {
    throw new HttpError(400, 'At least one test case must be visible so it can be shown as an example');
  }

  return {
    title: str(body.title, 'Title', 3, 120),
    description: str(body.description, 'Description', 20, 10000),
    inputFormat: str(body.inputFormat, 'Input format', 0, 2000, false),
    outputFormat: str(body.outputFormat, 'Output format', 0, 2000, false),
    constraints: str(body.constraints, 'Constraints', 0, 2000, false),
    difficulty,
    tags,
    acceptedLanguages: Array.from(new Set(acceptedLanguages)) as Language[],
    timeLimit: int(body.timeLimit ?? 1000, 'Time limit (ms)', 100, 10000),
    memoryLimit: int(body.memoryLimit ?? 256, 'Memory limit (MB)', 32, 512),
    testCases: cleanCases,
  };
};
