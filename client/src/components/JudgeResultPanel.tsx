import React, { useEffect, useState } from 'react';
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { JudgeResult } from '../api/types';
import { colors } from '../theme';
import { VERDICTS } from '../utils/format';
import { CodeBlock } from './ProblemStatement';

interface JudgeResultPanelProps {
  result: JudgeResult | null;
  pending: 'run' | 'submit' | null;
  error: string;
  /** "Sample tests" for Run, "All tests" for Submit. */
  scopeLabel?: string;
  idleHint?: React.ReactNode;
}

const JudgeResultPanel: React.FC<JudgeResultPanelProps> = ({ result, pending, error, scopeLabel, idleHint }) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!result) return;
    const firstFailure = result.testResults.findIndex((r) => !r.passed);
    setSelected(firstFailure === -1 ? 0 : firstFailure);
  }, [result]);

  if (pending) {
    return (
      <Box sx={{ p: 2 }} role="status">
        <Typography sx={{ fontWeight: 600, mb: 1 }}>
          {pending === 'run' ? 'Running your code on the sample tests…' : 'Judging your solution against all tests…'}
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }} role="alert">
        <Typography color="error.main" sx={{ fontWeight: 600 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {idleHint ?? (
            <>
              <strong>Run</strong> checks your code against the sample tests. <strong>Submit</strong> judges it against every
          test, including hidden ones.
            </>
          )}
        </Typography>
      </Box>
    );
  }

  const verdict = VERDICTS[result.verdict] ?? VERDICTS.internal_error;
  const current = result.testResults[selected];
  const compileError = result.verdict === 'compile_error' ? result.testResults[0]?.error : '';

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap" useFlexGap>
        <Typography variant="h6" sx={{ color: verdict.color }}>
          {verdict.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {result.passedTestCases}/{result.totalTestCases} {scopeLabel ?? 'tests'} passed
          {typeof result.executionTime === 'number' && result.verdict !== 'compile_error'
            ? ` · ${result.executionTime} ms max`
            : ''}
        </Typography>
      </Stack>

      {compileError ? (
        <Box sx={{ mt: 1.5 }}>
          <CodeBlock label="Compiler output" value={compileError} />
        </Box>
      ) : (
        <>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
            {result.testResults.map((test, index) => (
              <Chip
                key={index}
                size="small"
                icon={test.isHidden ? <LockOutlinedIcon /> : test.passed ? <CheckCircleIcon /> : <CancelIcon />}
                label={`Test ${index + 1}`}
                onClick={() => setSelected(index)}
                variant={index === selected ? 'filled' : 'outlined'}
                sx={{
                  '& .MuiChip-icon': { color: test.passed ? colors.easy : colors.hard },
                  borderColor: colors.border,
                }}
              />
            ))}
          </Stack>

          {current && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: VERDICTS[current.status]?.color }}>
                {VERDICTS[current.status]?.label ?? current.status}
                {current.executionTime ? ` · ${current.executionTime} ms` : ''}
              </Typography>
              {current.isHidden ? (
                <Typography variant="body2" color="text.secondary">
                  This is a hidden test case, so its input and expected output aren't shown.
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
                  <CodeBlock label="Input" value={current.input ?? ''} />
                  <CodeBlock label="Your output" value={current.output ?? ''} />
                  <CodeBlock label="Expected" value={current.expectedOutput ?? ''} />
                </Box>
              )}
              {!current.isHidden && current.error && current.status !== 'accepted' && (
                <Box sx={{ mt: 1.5 }}>
                  <CodeBlock label="Error output" value={current.error} />
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default JudgeResultPanel;
