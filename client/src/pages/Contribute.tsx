import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import api, { getErrorMessage } from '../api/client';
import { Difficulty, Language } from '../api/types';
import { DifficultyChip } from '../components/Chips';
import PageHeader from '../components/PageHeader';
import { Panel } from '../components/StatsWidgets';
import { colors, monoFont } from '../theme';
import { timeAgo } from '../utils/format';
import { LANGUAGE_ORDER, LANGUAGES } from '../utils/languages';

interface TestCaseDraft {
  input: string;
  output: string;
  isHidden: boolean;
}

interface Contribution {
  _id: string;
  title: string;
  difficulty: Difficulty;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const STATUS_COLOR = { pending: colors.medium, approved: colors.easy, rejected: colors.hard };

const emptyForm = () => ({
  title: '',
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  difficulty: 'easy' as Difficulty,
  tags: '',
  timeLimit: 1000,
  memoryLimit: 256,
  languages: [...LANGUAGE_ORDER] as Language[],
  testCases: [
    { input: '', output: '', isHidden: false },
    { input: '', output: '', isHidden: true },
  ] as TestCaseDraft[],
});

const mono = { style: { fontFamily: monoFont, fontSize: '0.85rem' } };

const Contribute: React.FC = () => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mine, setMine] = useState<Contribution[]>([]);

  const loadMine = useCallback(() => {
    api.get<Contribution[]>('/problems/contributions/mine').then((r) => setMine(r.data)).catch(() => setMine([]));
  }, []);
  useEffect(loadMine, [loadMine]);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateCase = (index: number, patch: Partial<TestCaseDraft>) =>
    set('testCases', form.testCases.map((tc, i) => (i === index ? { ...tc, ...patch } : tc)));

  const validate = () => {
    if (form.title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (form.description.trim().length < 20) return 'Description must be at least 20 characters.';
    if (!form.languages.length) return 'Select at least one language.';
    if (form.testCases.some((tc) => !tc.output.trim())) return 'Every test case needs an expected output.';
    if (!form.testCases.some((tc) => !tc.isHidden)) return 'At least one test case must be visible (it becomes the example).';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    const problem = validate();
    setError(problem);
    if (problem) return;

    setSubmitting(true);
    try {
      await api.post('/problems', {
        title: form.title,
        description: form.description,
        inputFormat: form.inputFormat,
        outputFormat: form.outputFormat,
        constraints: form.constraints,
        difficulty: form.difficulty,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        timeLimit: form.timeLimit,
        memoryLimit: form.memoryLimit,
        acceptedLanguages: form.languages,
        testCases: form.testCases,
      });
      setSuccess('Thanks! Your problem was submitted and is waiting for admin review.');
      setForm(emptyForm());
      loadMine();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to submit your problem.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <PageHeader title="Contribute a problem" subtitle="Submitted problems are reviewed by an admin before they go live." />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1.8fr 1fr' }, alignItems: 'start' }}>
        <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: { xs: 2.5, sm: 3 } }}>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2.5}>
            <TextField label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} required inputProps={{ maxLength: 120 }} />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
              multiline
              minRows={5}
              helperText="Plain text. Use `backticks` for code and **double asterisks** for bold."
            />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Input format" value={form.inputFormat} onChange={(e) => set('inputFormat', e.target.value)} multiline minRows={2} />
              <TextField label="Output format" value={form.outputFormat} onChange={(e) => set('outputFormat', e.target.value)} multiline minRows={2} />
            </Box>
            <TextField label="Constraints" value={form.constraints} onChange={(e) => set('constraints', e.target.value)} placeholder="1 ≤ n ≤ 10^5" />

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' } }}>
              <FormControl>
                <InputLabel>Difficulty</InputLabel>
                <Select label="Difficulty" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Time limit (ms)"
                type="number"
                value={form.timeLimit}
                onChange={(e) => set('timeLimit', Number(e.target.value))}
                inputProps={{ min: 100, max: 10000, step: 100 }}
              />
              <TextField
                label="Memory (MB)"
                type="number"
                value={form.memoryLimit}
                onChange={(e) => set('memoryLimit', Number(e.target.value))}
                inputProps={{ min: 32, max: 512 }}
              />
            </Box>
            <TextField
              label="Topics"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="arrays, hashing"
              helperText="Comma-separated, up to 5"
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 0.5 }}>
                Accepted languages
              </FormLabel>
              <FormGroup row>
                {LANGUAGE_ORDER.map((lang) => (
                  <FormControlLabel
                    key={lang}
                    label={LANGUAGES[lang].label}
                    control={
                      <Checkbox
                        checked={form.languages.includes(lang)}
                        onChange={(e) =>
                          set('languages', e.target.checked ? [...form.languages, lang] : form.languages.filter((l) => l !== lang))
                        }
                      />
                    }
                  />
                ))}
              </FormGroup>
            </FormControl>

            <Box>
              <Typography sx={{ fontWeight: 600 }}>Test cases</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Visible cases are shown as examples. Hidden cases are only used for judging.
              </Typography>
              <Stack spacing={2}>
                {form.testCases.map((tc, index) => (
                  <Box key={index} sx={{ p: 1.5, border: `1px solid ${colors.border}`, borderRadius: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Test {index + 1}
                      </Typography>
                      <Stack direction="row" alignItems="center">
                        <FormControlLabel
                          label="Hidden"
                          control={<Checkbox size="small" checked={tc.isHidden} onChange={(e) => updateCase(index, { isHidden: e.target.checked })} />}
                        />
                        <Tooltip title="Remove test case">
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Remove test ${index + 1}`}
                              disabled={form.testCases.length === 1}
                              onClick={() => set('testCases', form.testCases.filter((_, i) => i !== index))}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                      <TextField label="Input" size="small" multiline minRows={2} value={tc.input} onChange={(e) => updateCase(index, { input: e.target.value })} inputProps={mono} />
                      <TextField label="Expected output" size="small" multiline minRows={2} required value={tc.output} onChange={(e) => updateCase(index, { output: e.target.value })} inputProps={mono} />
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Button
                startIcon={<AddIcon />}
                sx={{ mt: 1.5 }}
                disabled={form.testCases.length >= 30}
                onClick={() => set('testCases', [...form.testCases, { input: '', output: '', isHidden: true }])}
              >
                Add test case
              </Button>
            </Box>

            <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
              {submitting ? 'Submitting…' : 'Submit for review'}
            </Button>
          </Stack>
        </Paper>

        <Panel title="Your contributions">
          {mine.length === 0 ? (
            <Typography color="text.secondary">You haven't submitted any problems yet.</Typography>
          ) : (
            <Stack spacing={1.5}>
              {mine.map((p) => (
                <Box key={p._id}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    {p.status === 'rejected' ? (
                      <Typography noWrap>{p.title}</Typography>
                    ) : (
                      <Box component={RouterLink} to={`/problems/${p._id}`} sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                        {p.title}
                      </Box>
                    )}
                    <Chip size="small" label={p.status} sx={{ color: STATUS_COLOR[p.status], textTransform: 'capitalize' }} variant="outlined" />
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <DifficultyChip difficulty={p.difficulty} />
                    <Typography variant="caption" color="text.secondary">
                      {timeAgo(p.createdAt)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Panel>
      </Box>
    </Container>
  );
};

export default Contribute;
