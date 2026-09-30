import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import api, { getErrorMessage } from '../api/client';
import { PracticeOptions, PracticeSet, SetDifficulty, SourceId } from '../api/types';
import CodeforcesHandle from '../components/CodeforcesHandle';
import PageHeader from '../components/PageHeader';
import { Panel } from '../components/StatsWidgets';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';
import { colors } from '../theme';
import { timeAgo } from '../utils/format';

const DIFFICULTIES: { value: SetDifficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

export const describeCriteria = (set: PracticeSet) => {
  const { criteria } = set;
  const difficulty = criteria.difficulty.charAt(0).toUpperCase() + criteria.difficulty.slice(1);
  const topics = criteria.topics.length ? criteria.topics.join(', ') : 'any topic';
  const sources = criteria.sources.map((s) => (s === 'algoarena' ? 'AlgoArena' : 'Codeforces')).join(' + ');
  return `${difficulty} · ${topics} · ${sources}`;
};

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState<PracticeOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [sets, setSets] = useState<PracticeSet[] | null>(null);

  const [difficulty, setDifficulty] = useState<SetDifficulty>('mixed');
  const [count, setCount] = useState('10');
  const [topics, setTopics] = useState<string[]>([]);
  const [sources, setSources] = useState<SourceId[]>(['algoarena', 'codeforces']);
  const [excludeSolved, setExcludeSolved] = useState(true);
  const [avoidRepeats, setAvoidRepeats] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const loadOptions = useCallback(() => {
    setOptionsError('');
    api
      .get<PracticeOptions>('/problem-sets/options')
      .then(({ data }) => {
        setOptions(data);
        // Don't preselect a source that is currently down.
        setSources((current) => current.filter((id) => data.sources.find((s) => s.id === id)?.available));
      })
      .catch((e) => setOptionsError(getErrorMessage(e, 'Unable to load practice options.')));
  }, []);

  const loadSets = useCallback(() => {
    api
      .get<PracticeSet[]>('/problem-sets')
      .then((r) => setSets(r.data))
      .catch(() => setSets([]));
  }, []);

  useEffect(() => {
    loadOptions();
    loadSets();
  }, [loadOptions, loadSets]);

  const maxCount = options?.maxCount ?? 50;
  const countNumber = Number(count);
  const countValid = Number.isInteger(countNumber) && countNumber >= 1 && countNumber <= maxCount;

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countValid || !sources.length) return;
    setGenerating(true);
    setError('');
    setWarnings([]);
    try {
      const { data } = await api.post<{ set: PracticeSet | null; warnings: string[] }>('/problem-sets', {
        difficulty,
        count: countNumber,
        topics,
        sources,
        excludeSolved,
        avoidRepeats,
      });
      if (data.set) navigate(`/practice/${data.set._id}`);
      else setWarnings(data.warnings);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to generate a practice set.'));
    } finally {
      setGenerating(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/problem-sets/${id}`);
      setSets((list) => list?.filter((s) => s._id !== id) ?? null);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete that set.'));
    }
  };

  const toggleSource = (id: SourceId, checked: boolean) =>
    setSources((current) => (checked ? [...current, id] : current.filter((s) => s !== id)));

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Practice sets"
        subtitle="Generate a random set of problems by difficulty and topic, from AlgoArena and Codeforces."
      />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.6fr 1fr' }, alignItems: 'start' }}>
        <Paper component="form" onSubmit={generate} sx={{ p: { xs: 2.5, sm: 3 } }}>
          {optionsError ? (
            <ErrorState message={optionsError} onRetry={loadOptions} />
          ) : !options ? (
            <LoadingState label="Loading sources and topics…" minHeight={200} />
          ) : (
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}
              {warnings.map((w) => (
                <Alert key={w} severity="warning">
                  {w}
                </Alert>
              ))}

              <Box>
                <FormLabel component="legend" sx={{ mb: 1 }}>
                  Difficulty
                </FormLabel>
                <ToggleButtonGroup
                  exclusive
                  value={difficulty}
                  onChange={(_, value) => value && setDifficulty(value)}
                  size="small"
                  fullWidth
                  aria-label="Difficulty"
                >
                  {DIFFICULTIES.map((d) => (
                    <ToggleButton key={d.value} value={d.value} sx={{ textTransform: 'none', fontWeight: 600 }}>
                      {d.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                {difficulty === 'mixed' && (
                  <Typography variant="caption" color="text.secondary">
                    Split evenly across easy, medium and hard.
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '140px 1fr' } }}>
                <TextField
                  label="Problems"
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  inputProps={{ min: 1, max: maxCount }}
                  error={!countValid}
                  helperText={countValid ? `1–${maxCount}` : `Enter 1–${maxCount}`}
                />
                <Autocomplete
                  multiple
                  options={options.topics}
                  value={topics}
                  onChange={(_, value) => setTopics(value.slice(0, 10))}
                  filterSelectedOptions
                  renderInput={(params) => (
                    <TextField {...params} label="Topics" placeholder={topics.length ? '' : 'Any topic'} helperText="Matches any selected topic" />
                  )}
                />
              </Box>

              <FormGroup>
                <FormLabel component="legend" sx={{ mb: 0.5 }}>
                  Sources
                </FormLabel>
                {options.sources.map((source) => (
                  <FormControlLabel
                    key={source.id}
                    disabled={!source.available}
                    control={
                      <Checkbox checked={sources.includes(source.id)} onChange={(e) => toggleSource(source.id, e.target.checked)} />
                    }
                    label={
                      <Box>
                        <Typography component="span" sx={{ fontWeight: 600 }}>
                          {source.name}
                        </Typography>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {' · '}
                          {source.available
                            ? `${source.problemCount.toLocaleString()} problems · ${source.judged ? 'judged here' : 'solve on codeforces.com'}`
                            : 'unavailable right now'}
                          {source.stale ? ' · using cached list' : ''}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
                {!sources.length && (
                  <Typography variant="caption" color="error">
                    Choose at least one source.
                  </Typography>
                )}
              </FormGroup>

              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={excludeSolved} onChange={(e) => setExcludeSolved(e.target.checked)} />}
                  label="Skip problems I've already solved"
                />
                <FormControlLabel
                  control={<Checkbox checked={avoidRepeats} onChange={(e) => setAvoidRepeats(e.target.checked)} />}
                  label="Don't repeat problems from my earlier sets"
                />
              </FormGroup>

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<ShuffleIcon />}
                disabled={generating || !countValid || !sources.length}
                sx={{ alignSelf: 'flex-start' }}
              >
                {generating ? 'Generating…' : 'Generate set'}
              </Button>
            </Stack>
          )}
        </Paper>

        <Stack spacing={3}>
          <Panel title="Codeforces handle">
            <CodeforcesHandle />
          </Panel>
          <Panel title="About the sources">
            <Stack spacing={1.25}>
              <Typography variant="body2" color="text.secondary">
                <strong>AlgoArena</strong> problems run in the built-in editor and are judged against hidden tests.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Codeforces</strong> problems come from the official Codeforces API and open on codeforces.com,
                where you read and submit them.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                LeetCode, HackerRank and CodeChef don't offer a public API for this, so they aren't included.
              </Typography>
            </Stack>
          </Panel>
        </Stack>
      </Box>

      <Typography variant="h6" component="h2" sx={{ mt: 5, mb: 2 }}>
        Your sets
      </Typography>
      <Paper sx={{ overflow: 'hidden' }}>
        {!sets ? (
          <LoadingState minHeight={120} />
        ) : !sets.length ? (
          <EmptyState title="No practice sets yet" description="Generate your first set above." />
        ) : (
          sets.map((set, index) => (
            <Box
              key={set._id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2.5,
                py: 1.75,
                borderTop: index ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box
                  component={RouterLink}
                  to={`/practice/${set._id}`}
                  sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
                >
                  {set.items.length} problems · {describeCriteria(set)}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {timeAgo(set.createdAt)} · {set.solvedCount}/{set.items.length} solved
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(set.solvedCount / set.items.length) * 100}
                  sx={{ mt: 1, height: 4, borderRadius: 2, maxWidth: 320, bgcolor: colors.surfaceRaised }}
                  aria-label="Set progress"
                />
              </Box>
              <Tooltip title="Delete set">
                <IconButton onClick={() => remove(set._id)} aria-label="Delete set" size="small">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))
        )}
      </Paper>
    </Container>
  );
};

export default Practice;
