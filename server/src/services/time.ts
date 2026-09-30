/** "3 hours", "2 days": a small stand-in for date-fns' formatDistanceToNowStrict. */
export const formatDistanceToNowStrict = (date: Date) => {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 1000));
  const units: [number, string][] = [
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
    [1, 'second'],
  ];
  const [size, name] = units.find(([s]) => seconds >= s)!;
  const value = Math.floor(seconds / size);
  return `${value} ${name}${value === 1 ? '' : 's'}`;
};
