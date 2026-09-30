import { judge, normalizeOutput, setExecutionProvider } from '../services/execution';
import { computeStreaks } from '../services/stats';
import { fakeProvider } from './helpers';

beforeAll(() => setExecutionProvider(fakeProvider));

const cases = [
  { input: '1 2', output: '3', isHidden: false },
  { input: '5 5', output: '10', isHidden: true },
];
const limits = { timeLimit: 1000, memoryLimit: 256 };

describe('normalizeOutput', () => {
  it('ignores trailing whitespace and line-ending differences', () => {
    expect(normalizeOutput('1 2 \r\n3\n\n')).toBe(normalizeOutput('1 2\n3'));
    expect(normalizeOutput('a\nb')).not.toBe(normalizeOutput('a b'));
  });
});

describe('judge', () => {
  it.each([
    ['sum', 'accepted', 2],
    ['echo', 'wrong_answer', 0],
    ['crash', 'runtime_error', 0],
    ['loop', 'time_limit_exceeded', 0],
    ['broken', 'compile_error', 0],
  ])('%s -> %s', async (code, verdict, passed) => {
    const outcome = await judge(code, 'python', cases, limits);
    expect(outcome.verdict).toBe(verdict);
    expect(outcome.passed).toBe(passed);
    expect(outcome.total).toBe(2);
  });

  it('fails clearly when execution is disabled', async () => {
    setExecutionProvider(null);
    await expect(judge('sum', 'python', cases, limits)).rejects.toThrow(/disabled/);
    setExecutionProvider(fakeProvider);
  });
});

describe('computeStreaks', () => {
  const today = new Date('2026-03-10T12:00:00Z');

  it('counts consecutive days ending today or yesterday', () => {
    expect(computeStreaks(['2026-03-08', '2026-03-09', '2026-03-10'], today)).toEqual({ current: 3, longest: 3 });
    expect(computeStreaks(['2026-03-08', '2026-03-09'], today)).toEqual({ current: 2, longest: 2 });
  });

  it('resets after a missed day but remembers the longest run', () => {
    expect(computeStreaks(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-10'], today)).toEqual({
      current: 1,
      longest: 3,
    });
    expect(computeStreaks([], today)).toEqual({ current: 0, longest: 0 });
  });
});
