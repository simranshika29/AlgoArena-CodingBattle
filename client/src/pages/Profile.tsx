import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Avatar, Box, Button, Container, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import { DuelHistoryEntry, UserStats } from '../api/types';
import PageHeader from '../components/PageHeader';
import {
  ActivityHeatmap,
  DifficultyBreakdown,
  LanguageUsage,
  Panel,
  RecentSubmissions,
  SolvedList,
  StatStrip,
} from '../components/StatsWidgets';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import { formatClock, formatDate, timeAgo } from '../utils/format';

interface ProfileResponse {
  user: { id: string; username: string; createdAt: string };
  stats: UserStats;
}

const DuelHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const [duels, setDuels] = useState<DuelHistoryEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<DuelHistoryEntry[]>('/duels/history', { params: { limit: 10 } })
      .then((r) => setDuels(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Unable to load duel history.')));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!duels) return <LoadingState minHeight={120} />;
  if (!duels.length) return <EmptyState title="No duels yet" action={<Button component={RouterLink} to="/arena">Find an opponent</Button>} />;

  return (
    <Table size="small">
      <TableBody>
        {duels.map((duel) => {
          const opponent = duel.players.find((p) => p.user !== userId);
          const me = duel.players.find((p) => p.user === userId);
          const result = duel.winner === null ? 'Draw' : duel.winner === userId ? 'Won' : 'Lost';
          const color = result === 'Won' ? colors.easy : result === 'Lost' ? colors.hard : colors.textMuted;
          return (
            <TableRow key={duel._id} sx={{ '&:last-child td': { border: 0 } }}>
              <TableCell sx={{ pl: 2.5, color, fontWeight: 600, width: 64 }}>{result}</TableCell>
              <TableCell>
                vs {opponent?.username ?? 'unknown'}
                <Typography variant="body2" color="text.secondary">
                  {duel.problem?.title ?? 'Deleted problem'}
                  {me?.solvedInMs ? ` · solved in ${formatClock(me.solvedInMs)}` : ''}
                  {duel.outcome === 'forfeit' ? ' · forfeit' : ''}
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ pr: 2.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {timeAgo(duel.endedAt)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const Profile: React.FC = () => {
  const { username = '' } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState('');
  const isMe = user?.username.toLowerCase() === username.toLowerCase();

  const load = useCallback(() => {
    setError('');
    setProfile(null);
    api
      .get<ProfileResponse>(`/users/${encodeURIComponent(username)}/profile`)
      .then((r) => setProfile(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Unable to load this profile.')));
  }, [username]);

  useEffect(load, [load]);

  if (error) {
    return (
      <Container maxWidth="lg">
        <ErrorState message={error} onRetry={load} />
      </Container>
    );
  }
  if (!profile) return <LoadingState label="Loading profile…" minHeight="50vh" />;

  const { stats } = profile;

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 56, height: 56, mt: { xs: 3, md: 5 }, bgcolor: colors.surfaceRaised, color: 'primary.main', fontWeight: 800, fontSize: 24, border: `1px solid ${colors.border}` }}>
          {profile.user.username.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <PageHeader
            title={profile.user.username}
            subtitle={`Member since ${formatDate(profile.user.createdAt)}${stats.rank ? ` · Rank #${stats.rank}` : ''}`}
          />
        </Box>
      </Box>

      <Stack spacing={3}>
        <StatStrip stats={stats} />
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, alignItems: 'start' }}>
          <Panel title="Difficulty">
            <DifficultyBreakdown stats={stats} />
          </Panel>
          <Panel title="Activity">
            <ActivityHeatmap stats={stats} />
          </Panel>
          <Panel title="Languages">
            <LanguageUsage stats={stats} />
          </Panel>
        </Box>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' }, alignItems: 'start' }}>
          <Stack spacing={3}>
            <Panel title="Recent submissions" padded={false}>
              <RecentSubmissions stats={stats} />
            </Panel>
            {isMe && (
              <Panel title="Duel history" padded={false}>
                <DuelHistory userId={profile.user.id} />
              </Panel>
            )}
          </Stack>
          <Panel title={`Solved problems (${stats.solvedCount})`}>
            <SolvedList stats={stats} />
          </Panel>
        </Box>
      </Stack>
    </Container>
  );
};

export default Profile;
