import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, LinearProgress, Paper, Table, TableBody, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { Difficulty, UserStats } from '../api/types';
import { colors, monoFont } from '../theme';
import { formatDate, pluralize, timeAgo } from '../utils/format';
import { LANGUAGES } from '../utils/languages';
import { DifficultyChip, VerdictChip } from './Chips';
import { EmptyState } from './StatusViews';

export const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; padded?: boolean }> = ({
  title,
  action,
  children,
  padded = true,
}) => (
  <Paper sx={{ overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.75, borderBottom: `1px solid ${colors.border}` }}>
      <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
      {action}
    </Box>
    <Box sx={{ p: padded ? 2.5 : 0 }}>{children}</Box>
  </Paper>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <Box sx={{ px: 2.5, py: 2 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography sx={{ fontFamily: monoFont, fontSize: '1.6rem', fontWeight: 600, mt: 0.25 }}>{value}</Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </Box>
);

export const StatStrip: React.FC<{ stats: UserStats }> = ({ stats }) => {
  const totalProblems = stats.byDifficulty.easy.total + stats.byDifficulty.medium.total + stats.byDifficulty.hard.total;
  const { duels } = stats;
  return (
    <Paper
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
        '& > *': { borderRight: { md: `1px solid ${colors.border}` }, borderBottom: { xs: `1px solid ${colors.border}`, md: 'none' } },
        '& > *:last-of-type': { borderRight: 'none' },
      }}
    >
      <Stat label="Solved" value={stats.solvedCount} hint={`of ${totalProblems} problems`} />
      <Stat label="Current streak" value={`${stats.streak.current}d`} hint={`Longest: ${pluralize(stats.streak.longest, 'day')}`} />
      <Stat label="Acceptance" value={`${stats.acceptanceRate}%`} hint={pluralize(stats.totalSubmissions, 'submission')} />
      <Stat label="Global rank" value={stats.rank ? `#${stats.rank}` : '—'} hint={stats.rank ? 'by problems solved' : 'solve a problem to rank'} />
      <Stat
        label="Duels"
        value={`${duels.wins}–${duels.losses}${duels.draws ? `–${duels.draws}` : ''}`}
        hint={duels.played ? `W–L${duels.draws ? '–D' : ''} · ${pluralize(duels.played, 'duel')}` : 'no duels yet'}
      />
    </Paper>
  );
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = { easy: colors.easy, medium: colors.medium, hard: colors.hard };

export const DifficultyBreakdown: React.FC<{ stats: UserStats }> = ({ stats }) => (
  <Box sx={{ display: 'grid', gap: 2.25 }}>
    {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => {
      const { solved, total } = stats.byDifficulty[difficulty];
      return (
        <Box key={difficulty}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography sx={{ textTransform: 'capitalize', color: DIFFICULTY_COLOR[difficulty], fontWeight: 600 }}>
              {difficulty}
            </Typography>
            <Typography sx={{ fontFamily: monoFont }} color="text.secondary">
              {solved} / {total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={total ? (solved / total) * 100 : 0}
            aria-label={`${difficulty} problems solved`}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: colors.surfaceRaised,
              '& .MuiLinearProgress-bar': { bgcolor: DIFFICULTY_COLOR[difficulty], borderRadius: 3 },
            }}
          />
        </Box>
      );
    })}
  </Box>
);

const heatColor = (count: number) =>
  count === 0 ? colors.surfaceRaised : count < 2 ? '#0e4a6e' : count < 4 ? '#1677b3' : count < 7 ? '#2ea3e6' : colors.primary;

/** 12-week submission activity grid (columns are weeks, rows are days). */
export const ActivityHeatmap: React.FC<{ stats: UserStats }> = ({ stats }) => {
  const total = stats.activity.reduce((sum, d) => sum + d.count, 0);
  return (
    <Box>
      <Box
        role="img"
        aria-label={`${pluralize(total, 'submission')} in the last 12 weeks`}
        sx={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gap: '4px', width: 'fit-content', maxWidth: '100%' }}
      >
        {stats.activity.map((day) => (
          <Tooltip key={day.date} title={`${pluralize(day.count, 'submission')} on ${formatDate(day.date + 'T00:00:00Z')}`}>
            <Box sx={{ width: { xs: 12, sm: 14 }, height: { xs: 12, sm: 14 }, borderRadius: '3px', bgcolor: heatColor(day.count) }} />
          </Tooltip>
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        {pluralize(total, 'submission')} in the last 12 weeks
      </Typography>
    </Box>
  );
};

export const LanguageUsage: React.FC<{ stats: UserStats }> = ({ stats }) => {
  const entries = Object.entries(stats.languageUsage).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  if (!entries.length) return <Typography color="text.secondary">No submissions yet.</Typography>;
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {entries.map(([language, count]) => (
        <Box key={language} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography>{LANGUAGES[language as keyof typeof LANGUAGES]?.label ?? language}</Typography>
          <Typography sx={{ fontFamily: monoFont }} color="text.secondary">
            {count}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export const RecentSubmissions: React.FC<{ stats: UserStats }> = ({ stats }) =>
  stats.recentSubmissions.length === 0 ? (
    <EmptyState title="No submissions yet" description="Pick a problem and submit your first solution." />
  ) : (
    <Table size="small" sx={{ tableLayout: 'fixed' }}>
      <TableBody>
        {stats.recentSubmissions.map((s) => (
          <TableRow key={s._id} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{ pl: 2.5, width: '100%' }}>
              {s.problem ? (
                <Box
                  component={RouterLink}
                  to={`/problems/${s.problem._id}`}
                  sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' }, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {s.problem.title}
                </Box>
              ) : (
                <Typography color="text.secondary">Deleted problem</Typography>
              )}
            </TableCell>
            <TableCell sx={{ width: 170 }}>
              <VerdictChip verdict={s.verdict} />
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, width: 100, color: 'text.secondary' }}>
              {LANGUAGES[s.language]?.label}
            </TableCell>
            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, width: 120, pr: 2.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {timeAgo(s.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

export const SolvedList: React.FC<{ stats: UserStats }> = ({ stats }) =>
  stats.solvedProblems.length === 0 ? (
    <Typography color="text.secondary">Nothing solved yet.</Typography>
  ) : (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {stats.solvedProblems.map((p) => (
        <Box key={p._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box component={RouterLink} to={`/problems/${p._id}`} sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
            {p.title}
          </Box>
          <DifficultyChip difficulty={p.difficulty} />
        </Box>
      ))}
    </Box>
  );
