import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import api, { getErrorMessage } from '../api/client';
import { JudgeResult, Language, Problem, SubmissionSummary } from '../api/types';
import { VerdictChip } from '../components/Chips';
import CodeEditor from '../components/CodeEditor';
import EditorToolbar from '../components/EditorToolbar';
import JudgeResultPanel from '../components/JudgeResultPanel';
import ProblemStatement from '../components/ProblemStatement';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import { timeAgo } from '../utils/format';
import { getPreferredLanguage, LANGUAGES, loadDraft, saveDraft, setPreferredLanguage } from '../utils/languages';

const WORKSPACE_HEIGHT = { xs: 'auto', md: 'calc(100vh - 60px)' };

const MySubmissions: React.FC<{
  problemId: string;
  refreshKey: number;
  onLoadCode: (code: string, language: Language) => void;
}> = ({ problemId, refreshKey, onLoadCode }) => {
  const [items, setItems] = useState<SubmissionSummary[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api
      .get<SubmissionSummary[]>('/submissions/mine', { params: { problemId, limit: 50 } })
      .then((r) => setItems(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Unable to load your submissions.')));
  }, [problemId]);

  useEffect(load, [load, refreshKey]);

  const openCode = async (id: string) => {
    try {
      const { data } = await api.get<{ code: string; language: Language }>(`/submissions/${id}`);
      onLoadCode(data.code, data.language);
    } catch (e) {
      setError(getErrorMessage(e, 'Unable to load that submission.'));
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <LoadingState />;
  if (!items.length) return <EmptyState title="No submissions yet" description="Your submissions for this problem will appear here." />;

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Verdict</TableCell>
          <TableCell>Language</TableCell>
          <TableCell>Tests</TableCell>
          <TableCell>When</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((s) => (
          <TableRow key={s._id}>
            <TableCell>
              <VerdictChip verdict={s.verdict} />
            </TableCell>
            <TableCell>{LANGUAGES[s.language]?.label ?? s.language}</TableCell>
            <TableCell>
              {s.passedTestCases}/{s.totalTestCases}
            </TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{timeAgo(s.createdAt)}</TableCell>
            <TableCell align="right">
              <Button size="small" onClick={() => openCode(s._id)}>
                Load code
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const ProblemDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadError, setLoadError] = useState('');
  const [tab, setTab] = useState(0);
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<'run' | 'submit' | null>(null);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [resultScope, setResultScope] = useState<'run' | 'submit'>('run');
  const [judgeError, setJudgeError] = useState('');
  const [submissionsKey, setSubmissionsKey] = useState(0);
  const [toast, setToast] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const loadProblem = useCallback(() => {
    setLoadError('');
    setProblem(null);
    api
      .get<Problem>(`/problems/${id}`)
      .then(({ data }) => {
        const initial = getPreferredLanguage(data.acceptedLanguages);
        setProblem(data);
        setLanguage(initial);
        setCode(loadDraft(data._id, initial));
        setResult(null);
      })
      .catch((e) => setLoadError(getErrorMessage(e, 'Unable to load this problem.')));
  }, [id]);

  useEffect(loadProblem, [loadProblem]);

  // Autosave the draft for this problem/language in this browser.
  useEffect(() => {
    if (!problem) return;
    const timer = setTimeout(() => saveDraft(problem._id, language, code), 400);
    return () => clearTimeout(timer);
  }, [problem, language, code]);

  const changeLanguage = (next: Language) => {
    if (problem) saveDraft(problem._id, language, code);
    setLanguage(next);
    setPreferredLanguage(next);
    setCode(problem ? loadDraft(problem._id, next) : LANGUAGES[next].starter);
  };

  const judge = async (mode: 'run' | 'submit') => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/problems/${id}` } });
      return;
    }
    if (!code.trim()) {
      setJudgeError('Write some code before running it.');
      return;
    }
    setPending(mode);
    setJudgeError('');
    setResult(null);
    setResultScope(mode);
    try {
      const { data } = await api.post<JudgeResult>(mode === 'run' ? '/submissions/run' : '/submissions', {
        problemId: id,
        language,
        code,
      });
      setResult(data);
      if (mode === 'submit') {
        setSubmissionsKey((k) => k + 1);
        if (data.verdict === 'accepted') setToast('Accepted! This problem now counts as solved.');
      }
    } catch (e) {
      setJudgeError(getErrorMessage(e, 'Unable to run your code. Please try again.'));
    } finally {
      setPending(null);
    }
  };

  if (loadError) {
    return (
      <Box sx={{ py: 8 }}>
        <ErrorState message={loadError} onRetry={loadProblem} />
        <Box sx={{ textAlign: 'center' }}>
          <Button component={RouterLink} to="/problems">
            Back to problems
          </Button>
        </Box>
      </Box>
    );
  }
  if (!problem) return <LoadingState label="Loading problem…" minHeight="60vh" />;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(360px, 1fr) minmax(420px, 1.25fr)' },
        height: WORKSPACE_HEIGHT,
        minHeight: 0,
      }}
    >
      {/* Statement */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: { md: `1px solid ${colors.border}` } }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: `1px solid ${colors.border}`, minHeight: 44 }}>
          <Tab label="Description" sx={{ minHeight: 44 }} />
          <Tab label="My submissions" sx={{ minHeight: 44 }} disabled={!isAuthenticated} />
        </Tabs>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          {problem.status !== 'approved' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This problem is {problem.status} and only visible to you and admins.
            </Alert>
          )}
          {tab === 0 ? (
            <ProblemStatement problem={problem} />
          ) : (
            <MySubmissions
              problemId={problem._id}
              refreshKey={submissionsKey}
              onLoadCode={(loaded, lang) => {
                setLanguage(lang);
                setCode(loaded);
                setToast('Loaded submission into the editor.');
              }}
            />
          )}
        </Box>
      </Box>

      {/* Editor + results */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderTop: { xs: `1px solid ${colors.border}`, md: 'none' } }}>
        <EditorToolbar languages={problem.acceptedLanguages} language={language} onLanguageChange={changeLanguage} disabled={Boolean(pending)}>
          <Tooltip title="Reset to starter code">
            <span>
              <IconButton size="small" onClick={() => setConfirmReset(true)} disabled={Boolean(pending)} aria-label="Reset code">
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => judge('run')}
            disabled={Boolean(pending)}
          >
            Run
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<CloudUploadOutlinedIcon />}
            onClick={() => judge('submit')}
            disabled={Boolean(pending)}
          >
            {isAuthenticated ? 'Submit' : 'Log in to submit'}
          </Button>
        </EditorToolbar>
        <Box sx={{ flexGrow: 1, minHeight: { xs: 380, md: 0 }, height: { xs: 380, md: 'auto' } }}>
          <CodeEditor language={language} value={code} onChange={setCode} />
        </Box>
        <Box
          sx={{
            borderTop: `1px solid ${colors.border}`,
            height: { md: '36%' },
            minHeight: { md: 170 },
            overflowY: 'auto',
            bgcolor: colors.surface,
          }}
          aria-live="polite"
        >
          <JudgeResultPanel
            result={result}
            pending={pending}
            error={judgeError}
            scopeLabel={resultScope === 'run' ? 'sample tests' : 'tests'}
          />
        </Box>
      </Box>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>Reset your code?</DialogTitle>
        <DialogContent>This replaces the editor contents with the {LANGUAGES[language].label} starter template.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setCode(LANGUAGES[language].starter);
              setConfirmReset(false);
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ProblemDetail;
