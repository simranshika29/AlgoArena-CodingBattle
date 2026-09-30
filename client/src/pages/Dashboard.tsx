import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import { DuelRoomState, ProblemPage, ProblemSummary, UserStats } from '../api/types';
import { DifficultyChip } from '../components/Chips';
import PageHeader from '../components/PageHeader';
import { ActivityHeatmap, DifficultyBreakdown, Panel, RecentSubmissions, StatStrip } from '../components/StatsWidgets';
import { ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { state: socketState, request } = useSocket();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [nextUp, setNextUp] = useState<ProblemSummary[]>([]);
  const [activeDuel, setActiveDuel] = useState<DuelRoomState | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    Promise.all([
      api.get<UserStats>('/users/me/stats'),
      api.get<ProblemPage>('/problems', { params: { status: 'unsolved', limit: 3 } }),
    ])
      .then(([statsRes, nextRes]) => {
        setStats(statsRes.data);
        setNextUp(nextRes.data.problems);
      })
      .catch((e) => setError(getErrorMessage(e, 'Unable to load your dashboard. Please try again.')));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (socketState !== 'connected') return;
    request<DuelRoomState | null>('duel:active')
      .then(setActiveDuel)
      .catch(() => setActiveDuel(null));
  }, [socketState, request]);

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={`Welcome back, ${user?.username}`}
        subtitle="Your progress, based on every submission you've made."
        actions={
          <>
            <Button component={RouterLink} to="/arena" variant="outlined">
              Start a duel
            </Button>
            <Button component={RouterLink} to="/problems" variant="contained">
              Browse problems
            </Button>
          </>
        }
      />

      {activeDuel && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button component={RouterLink} to={`/arena/${activeDuel.code}`} color="inherit" size="small">
              Return to duel
            </Button>
          }
        >
          You're in duel room <strong>{activeDuel.code}</strong> ({activeDuel.phase.replace('-', ' ')}).
        </Alert>
      )}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !stats ? (
        <LoadingState label="Loading your stats…" />
      ) : (
        <Stack spacing={3}>
          <StatStrip stats={stats} />

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Panel title="Difficulty breakdown">
              <DifficultyBreakdown stats={stats} />
            </Panel>
            <Panel title="Activity">
              <ActivityHeatmap stats={stats} />
            </Panel>
          </Box>

          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, alignItems: 'start' }}>
            <Panel
              title="Recent submissions"
              padded={false}
              action={
                <Button component={RouterLink} to={`/u/${user?.username}`} size="small">
                  View profile
                </Button>
              }
            >
              <RecentSubmissions stats={stats} />
            </Panel>
            <Panel title="Next up">
              {nextUp.length === 0 ? (
                <Typography color="text.secondary">You've solved every published problem. Impressive.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {nextUp.map((p) => (
                    <Box key={p._id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box
                        component={RouterLink}
                        to={`/problems/${p._id}`}
                        sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                      >
                        {p.title}
                      </Box>
                      <DifficultyChip difficulty={p.difficulty} />
                    </Box>
                  ))}
                  <Button component={RouterLink} to="/problems?status=unsolved" size="small" sx={{ alignSelf: 'flex-start' }}>
                    See all unsolved
                  </Button>
                </Stack>
              )}
            </Panel>
          </Box>
        </Stack>
      )}
    </Container>
  );
};

export default Dashboard;
