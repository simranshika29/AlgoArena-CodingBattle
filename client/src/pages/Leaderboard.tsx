import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import { LeaderboardEntry } from '../api/types';
import PageHeader from '../components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { colors, monoFont } from '../theme';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api
      .get<LeaderboardEntry[]>('/users/leaderboard', { params: { limit: 100 } })
      .then((r) => setEntries(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Unable to load the leaderboard.')));
  }, []);

  useEffect(load, [load]);

  return (
    <Container maxWidth="md">
      <PageHeader title="Leaderboard" subtitle="Ranked by distinct problems solved, then duel wins." />
      <Paper sx={{ overflow: 'hidden' }}>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !entries ? (
          <LoadingState />
        ) : entries.length === 0 ? (
          <EmptyState title="No one is ranked yet" description="Solve a problem or win a duel to claim the top spot." />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 72 }}>Rank</TableCell>
                <TableCell>User</TableCell>
                <TableCell align="right">Solved</TableCell>
                <TableCell align="right">Duel wins</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => {
                const isMe = entry.userId === user?.id;
                return (
                  <TableRow
                    key={entry.userId}
                    sx={{ bgcolor: isMe ? 'rgba(76, 194, 255, 0.06)' : undefined, '&:last-child td': { border: 0 } }}
                  >
                    <TableCell sx={{ fontFamily: monoFont, color: entry.rank <= 3 ? 'primary.main' : 'text.secondary', fontWeight: 600 }}>
                      #{entry.rank}
                    </TableCell>
                    <TableCell>
                      <Box
                        component={RouterLink}
                        to={`/u/${entry.username}`}
                        sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 500, '&:hover': { color: 'primary.main' } }}
                      >
                        {entry.username}
                      </Box>
                      {isMe && <Box component="span" sx={{ color: colors.textMuted, ml: 1, fontSize: '0.85rem' }}>(you)</Box>}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: monoFont }}>
                      {entry.solved}
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: monoFont }}>
                      {entry.duelWins}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default Leaderboard;
