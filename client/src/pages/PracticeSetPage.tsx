import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import api, { getErrorMessage } from '../api/client';
import { PracticeSet } from '../api/types';
import { DifficultyChip, TagChip } from '../components/Chips';
import PageHeader from '../components/PageHeader';
import ProblemTitleLink, { SourceChip } from '../components/ProblemTitleLink';
import { ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import { timeAgo } from '../utils/format';
import { describeCriteria } from './Practice';

const STATUS_STYLE = {
  solved: { label: 'Solved', color: colors.easy },
  attempted: { label: 'Attempted', color: colors.medium },
};

const PracticeSetPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [set, setSet] = useState<PracticeSet | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(() => {
    setError('');
    api
      .get<PracticeSet>(`/problem-sets/${id}`)
      .then((r) => setSet(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Unable to load this practice set.')));
  }, [id]);

  useEffect(load, [load]);

  const sync = async () => {
    setSyncing(true);
    setActionError('');
    try {
      const { data } = await api.post<PracticeSet>(`/problem-sets/${id}/sync-codeforces`);
      setSet(data);
    } catch (e) {
      setActionError(getErrorMessage(e, 'Could not check Codeforces right now.'));
    } finally {
      setSyncing(false);
    }
  };

  const regenerate = async () => {
    if (!set) return;
    setRegenerating(true);
    setActionError('');
    try {
      const { data } = await api.post<{ set: PracticeSet | null; warnings: string[] }>('/problem-sets', set.criteria);
      if (data.set) navigate(`/practice/${data.set._id}`);
      else setActionError(data.warnings.join(' '));
    } catch (e) {
      setActionError(getErrorMessage(e, 'Unable to generate a new set.'));
    } finally {
      setRegenerating(false);
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <ErrorState message={error} onRetry={load} />
        <Box sx={{ textAlign: 'center' }}>
          <Button component={RouterLink} to="/practice">
            Back to practice sets
          </Button>
        </Box>
      </Container>
    );
  }
  if (!set) return <LoadingState label="Loading practice set…" minHeight="50vh" />;

  const hasCodeforces = set.items.some((i) => i.source === 'codeforces');
  const progress = set.items.length ? (set.solvedCount / set.items.length) * 100 : 0;

  return (
    <Container maxWidth="lg">
      <PageHeader
        title={`Practice set · ${set.items.length} problems`}
        subtitle={`${describeCriteria(set)} · created ${timeAgo(set.createdAt)}`}
        actions={
          <>
            <Button component={RouterLink} to="/practice" color="inherit">
              All sets
            </Button>
            <Button variant="outlined" startIcon={<ShuffleIcon />} onClick={regenerate} disabled={regenerating}>
              {regenerating ? 'Generating…' : 'New set like this'}
            </Button>
          </>
        }
      />

      {set.warnings.map((w) => (
        <Alert key={w} severity="warning" sx={{ mb: 2 }}>
          {w}
        </Alert>
      ))}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box sx={{ flexGrow: 1, maxWidth: 480 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {set.solvedCount} of {set.items.length} solved
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              aria-label="Set progress"
              sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: colors.surfaceRaised, '& .MuiLinearProgress-bar': { bgcolor: colors.easy } }}
            />
          </Box>
          {hasCodeforces && (
            <Box sx={{ textAlign: { sm: 'right' } }}>
              {user?.codeforcesHandle ? (
                <>
                  <Button variant="outlined" startIcon={<SyncIcon />} onClick={sync} disabled={syncing}>
                    {syncing ? 'Checking Codeforces…' : 'Check Codeforces progress'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {set.codeforcesSyncedAt
                      ? `Last checked ${timeAgo(set.codeforcesSyncedAt)} for ${user.codeforcesHandle}`
                      : `Uses ${user.codeforcesHandle}'s public submissions`}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  <RouterLink to="/practice" style={{ color: colors.primary }}>
                    Link your Codeforces handle
                  </RouterLink>{' '}
                  to track Codeforces problems.
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40, display: { xs: 'none', sm: 'table-cell' } }}>#</TableCell>
              <TableCell>Problem</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Topics</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Source</TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                Difficulty
              </TableCell>
              <TableCell align="right" sx={{ width: 96 }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {set.items.map((item, index) => (
              <TableRow key={item.key} hover sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>{index + 1}</TableCell>
                <TableCell>
                  <ProblemTitleLink title={item.title} url={item.url} external={!item.judged} />
                  <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'flex', sm: 'none' }, mt: 0.75 }}>
                    <DifficultyChip difficulty={item.difficulty} />
                    <SourceChip source={item.source} rating={item.rating} />
                  </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                    {item.topics.slice(0, 3).map((t) => (
                      <TagChip key={t} tag={t} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <SourceChip source={item.source} rating={item.rating} />
                </TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <DifficultyChip difficulty={item.difficulty} />
                </TableCell>
                <TableCell align="right">
                  {item.status ? (
                    <Typography variant="body2" sx={{ color: STATUS_STYLE[item.status].color, fontWeight: 600 }}>
                      {STATUS_STYLE[item.status].label}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        AlgoArena problems are judged here. Codeforces problems open on codeforces.com (data from the official
        Codeforces API); their status comes from your Codeforces submissions.
      </Typography>
    </Container>
  );
};

export default PracticeSetPage;
