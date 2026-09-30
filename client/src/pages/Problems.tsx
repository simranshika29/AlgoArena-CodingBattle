import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PendingIcon from '@mui/icons-material/Pending';
import api, { getErrorMessage } from '../api/client';
import { ProblemPage } from '../api/types';
import { DifficultyChip, TagChip } from '../components/Chips';
import PageHeader from '../components/PageHeader';
import ProblemTitleLink, { SourceChip } from '../components/ProblemTitleLink';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import { pluralize } from '../utils/format';

const PAGE_SIZE = 20;

const StatusIcon: React.FC<{ status?: 'solved' | 'attempted' | null }> = ({ status }) => {
  if (status === 'solved')
    return (
      <Tooltip title="Solved">
        <CheckCircleIcon sx={{ color: colors.easy, fontSize: 18 }} aria-label="Solved" />
      </Tooltip>
    );
  if (status === 'attempted')
    return (
      <Tooltip title="Attempted">
        <PendingIcon sx={{ color: colors.medium, fontSize: 18 }} aria-label="Attempted" />
      </Tooltip>
    );
  return <RadioButtonUncheckedIcon sx={{ color: colors.border, fontSize: 18 }} aria-label="Not attempted" />;
};

const Problems: React.FC = () => {
  const { isAuthenticated, status: authStatus } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const difficulty = params.get('difficulty') ?? '';
  const tag = params.get('tag') ?? '';
  const status = params.get('status') ?? '';
  const source = (['codeforces', 'all'].includes(params.get('source') ?? '') ? params.get('source') : 'algoarena') as
    | 'algoarena'
    | 'codeforces'
    | 'all';
  const judgedOnly = source === 'algoarena';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [data, setData] = useState<ProblemPage | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const updateParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          if (key !== 'page') next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Keep the input in sync when the URL changes (back/forward navigation).
  useEffect(() => {
    setSearchInput((current) => (current.trim() === search ? current : search));
  }, [search]);

  // Debounce typing so we don't send a request per keystroke.
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => updateParam('search', searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParam]);

  useEffect(() => {
    api
      .get<string[]>('/problems/tags', { params: { source: judgedOnly ? undefined : source } })
      .then((r) => setTags(r.data))
      .catch(() => setTags([]));
  }, [source, judgedOnly]);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get<ProblemPage>('/problems', {
        params: {
          source: judgedOnly ? undefined : source,
          search: search || undefined,
          difficulty: difficulty || undefined,
          tag: tag || undefined,
          status: judgedOnly ? status || undefined : undefined,
          page,
          limit: PAGE_SIZE,
        },
      })
      .then((r) => !cancelled && setData(r.data))
      .catch((e) => !cancelled && setError(getErrorMessage(e, 'Unable to load problems. Please try again.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [source, judgedOnly, search, difficulty, tag, status, page]);

  // Wait until we know whether the user is logged in, so solved status is included.
  useEffect(() => {
    if (authStatus === 'loading') return;
    return load();
  }, [load, authStatus]);

  const hasFilters = Boolean(search || difficulty || tag || (judgedOnly && status));

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Problems"
        subtitle={
          data
            ? `${pluralize(data.total, 'problem')}${hasFilters ? (data.total === 1 ? ' matches' : ' match') + ' your filters' : ''}`
            : 'Curated DSA problems, easy to hard'
        }
        actions={
          <Button component={RouterLink} to="/practice" variant="outlined" startIcon={<ShuffleIcon />}>
            Generate a practice set
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search by title or topic"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          inputProps={{ 'aria-label': 'Search problems' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <Box
          sx={{
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: 'repeat(auto-fit, minmax(104px, 1fr))', md: 'none' },
            gridAutoFlow: { md: 'column' },
            '& .MuiFormControl-root': { minWidth: { xs: 0, md: 130 } },
          }}
        >
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Source</InputLabel>
            <Select
              label="Source"
              value={source}
              onChange={(e) => updateParam('source', e.target.value === 'algoarena' ? '' : e.target.value)}
            >
              <MenuItem value="algoarena">AlgoArena (judged here)</MenuItem>
              <MenuItem value="codeforces">Codeforces</MenuItem>
              <MenuItem value="all">All sources</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Difficulty</InputLabel>
            <Select label="Difficulty" value={difficulty} onChange={(e) => updateParam('difficulty', e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Topic</InputLabel>
            <Select label="Topic" value={tags.includes(tag) ? tag : ''} onChange={(e) => updateParam('tag', e.target.value)}>
              <MenuItem value="">All topics</MenuItem>
              {tags.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {isAuthenticated && judgedOnly && (
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(e) => updateParam('status', e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="solved">Solved</MenuItem>
                <MenuItem value="attempted">Attempted</MenuItem>
                <MenuItem value="unsolved">Unsolved</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Stack>

      {data?.warnings?.map((warning) => (
        <Alert key={warning} severity="warning" sx={{ mb: 2 }}>
          {warning}
        </Alert>
      ))}

      <Paper sx={{ overflow: 'hidden' }}>
        {loading && !data ? (
          <LoadingState label="Loading problems…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !data || data.problems.length === 0 ? (
          <EmptyState
            title="No problems found"
            description={hasFilters ? 'Try a different search or clear some filters.' : 'Problems will appear here once they are published.'}
          />
        ) : (
          <Table size="medium" sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
            <TableHead>
              <TableRow>
                {isAuthenticated && <TableCell sx={{ width: 48 }} aria-label="Status" />}
                <TableCell>Title</TableCell>
                {!judgedOnly && <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, width: 130 }}>Source</TableCell>}
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Topics</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>
                  Difficulty
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.problems.map((problem) => (
                <TableRow key={problem._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  {isAuthenticated && (
                    <TableCell sx={{ pr: 0 }}>
                      {problem.external ? null : <StatusIcon status={problem.userStatus} />}
                    </TableCell>
                  )}
                  <TableCell>
                    <ProblemTitleLink
                      title={problem.title}
                      url={problem.external && problem.url ? problem.url : `/problems/${problem._id}`}
                      external={Boolean(problem.external)}
                    />
                  </TableCell>
                  {!judgedOnly && (
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <SourceChip source={problem.source ?? 'algoarena'} rating={problem.rating} />
                    </TableCell>
                  )}
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                      {problem.tags.slice(0, 3).map((t) => (
                        <TagChip key={t} tag={t} onClick={() => updateParam('tag', t)} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <DifficultyChip difficulty={problem.difficulty} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {!judgedOnly && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Codeforces problem data comes from the official Codeforces API. Statements, submissions and judging stay
          on codeforces.com; links open there.
        </Typography>
      )}

      {data && data.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={(_, value) => updateParam('page', String(value))}
            shape="rounded"
          />
        </Box>
      )}
    </Container>
  );
};

export default Problems;
