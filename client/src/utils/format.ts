import { Verdict } from '../api/types';
import { colors } from '../theme';

export const VERDICTS: Record<Verdict, { label: string; color: string }> = {
  accepted: { label: 'Accepted', color: colors.easy },
  wrong_answer: { label: 'Wrong Answer', color: colors.hard },
  runtime_error: { label: 'Runtime Error', color: colors.hard },
  time_limit_exceeded: { label: 'Time Limit Exceeded', color: colors.medium },
  compile_error: { label: 'Compilation Error', color: colors.medium },
  internal_error: { label: 'Judge Error', color: colors.textMuted },
};

export const pluralize = (count: number, word: string, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`;

export const timeAgo = (value: string | number | Date) => {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const units: [number, string][] = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
    [604800, 'week'],
    [2629800, 'month'],
    [31557600, 'year'],
  ];
  for (let i = units.length - 1; i >= 0; i--) {
    const [size, name] = units[i];
    if (seconds >= size) return `${pluralize(Math.floor(seconds / size), name)} ago`;
  }
  return 'just now';
};

/** Formats a millisecond duration as m:ss (or h:mm:ss). */
export const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const formatDate = (value: string | number | Date) =>
  new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
