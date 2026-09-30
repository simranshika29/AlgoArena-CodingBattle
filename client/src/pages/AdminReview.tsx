import React, { useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api, { getErrorMessage } from '../api/client';
import { Difficulty, Language } from '../api/types';
import { DifficultyChip, TagChip } from '../components/Chips';
import PageHeader from '../components/PageHeader';
import { CodeBlock } from '../components/ProblemStatement';
import RichText from '../components/RichText';
import { EmptyState, ErrorState, LoadingState } from '../components/StatusViews';
import { timeAgo } from '../utils/format';
import { LANGUAGES } from '../utils/languages';

interface PendingProblem {
  _id: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  difficulty: Difficulty;
  tags: string[];
  acceptedLanguages: Language[];
  timeLimit: number;
  memoryLimit: number;
  testCases: { input: string; output: string; isHidden: boolean }[];
  createdBy: { username?: string } | null;
  createdAt: string;
}

const AdminReview: React.FC = () => {
  const [pending, setPending] = useState<PendingProblem[] | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError('');
    api
      .get<PendingProblem[]>('/problems/admin/pending')
      .then((r) => setPending(r.data))
      .catch((e) => setError(getErrorMessage(e, 'Unable to load the review queue.')));
  }, []);

  useEffect(load, [load]);

  const act = async (problem: PendingProblem, action: 'approve' | 'reject') => {
    setBusyId(problem._id);
    setActionError('');
    setMessage('');
    try {
      await api.patch(`/problems/admin/${problem._id}/${action}`);
      setPending((list) => list?.filter((p) => p._id !== problem._id) ?? null);
      setMessage(`"${problem.title}" was ${action === 'approve' ? 'approved and is now live' : 'rejected'}.`);
    } catch (e) {
      setActionError(getErrorMessage(e, `Unable to ${action} this problem.`));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container maxWidth="md">
      <PageHeader title="Review queue" subtitle="Check the statement and test cases before approving a contribution." />
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !pending ? (
        <LoadingState />
      ) : pending.length === 0 ? (
        <EmptyState title="The queue is empty" description="New contributions will show up here." />
      ) : (
        <Stack spacing={1.5}>
          {pending.map((problem) => (
            <Accordion key={problem._id} disableGutters sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{problem.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    by {problem.createdBy?.username ?? 'unknown'} · {timeAgo(problem.createdAt)} · {problem.testCases.length} tests
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
                  <DifficultyChip difficulty={problem.difficulty} />
                  {problem.tags.map((t) => <TagChip key={t} tag={t} />)}
                </Stack>
                <RichText text={problem.description} />
                {problem.inputFormat && <Typography variant="body2" sx={{ mt: 2 }}><strong>Input:</strong> {problem.inputFormat}</Typography>}
                {problem.outputFormat && <Typography variant="body2"><strong>Output:</strong> {problem.outputFormat}</Typography>}
                {problem.constraints && <Typography variant="body2"><strong>Constraints:</strong> {problem.constraints}</Typography>}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {problem.timeLimit} ms · {problem.memoryLimit} MB · {problem.acceptedLanguages.map((l) => LANGUAGES[l]?.label ?? l).join(', ')}
                </Typography>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {problem.testCases.map((tc, i) => (
                    <Box key={i} sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                      <CodeBlock label={`Test ${i + 1} input${tc.isHidden ? ' (hidden)' : ''}`} value={tc.input} />
                      <CodeBlock label="Expected output" value={tc.output} />
                    </Box>
                  ))}
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                  <Button variant="contained" color="success" disabled={busyId === problem._id} onClick={() => act(problem, 'approve')}>
                    Approve
                  </Button>
                  <Button variant="outlined" color="error" disabled={busyId === problem._id} onClick={() => act(problem, 'reject')}>
                    Reject
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}
    </Container>
  );
};

export default AdminReview;
