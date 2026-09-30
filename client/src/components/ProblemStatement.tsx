import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Problem } from '../api/types';
import { colors, monoFont } from '../theme';
import { DifficultyChip, TagChip } from './Chips';
import RichText from './RichText';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box sx={{ mt: 3 }}>
    <Typography variant="overline" color="text.secondary" component="h3">
      {title}
    </Typography>
    <Box sx={{ mt: 0.5 }}>{children}</Box>
  </Box>
);

export const CodeBlock: React.FC<{ label?: string; value: string }> = ({ label, value }) => (
  <Box sx={{ minWidth: 0 }}>
    {label && (
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    )}
    <Box
      component="pre"
      sx={{
        m: 0,
        mt: 0.5,
        p: 1.5,
        fontFamily: monoFont,
        fontSize: '0.85rem',
        lineHeight: 1.6,
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 1,
        overflowX: 'auto',
        whiteSpace: 'pre',
        minHeight: 38,
      }}
    >
      {value === '' ? <Box component="span" sx={{ color: 'text.secondary' }}>(empty)</Box> : value}
    </Box>
  </Box>
);

const ProblemStatement: React.FC<{ problem: Problem; showHeader?: boolean }> = ({ problem, showHeader = true }) => (
  <Box>
    {showHeader && (
      <>
        <Typography variant="h5" component="h1" sx={{ mb: 1.5 }}>
          {problem.title}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2.5 }}>
          <DifficultyChip difficulty={problem.difficulty} />
          {problem.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </Stack>
      </>
    )}

    <RichText text={problem.description} />

    {problem.inputFormat && (
      <Section title="Input">
        <RichText text={problem.inputFormat} />
      </Section>
    )}
    {problem.outputFormat && (
      <Section title="Output">
        <RichText text={problem.outputFormat} />
      </Section>
    )}

    {problem.examples.map((example, index) => (
      <Section key={index} title={`Example ${index + 1}`}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          <CodeBlock label="Input" value={example.input} />
          <CodeBlock label="Output" value={example.output} />
        </Box>
      </Section>
    ))}

    {problem.constraints && (
      <Section title="Constraints">
        <RichText text={problem.constraints} />
      </Section>
    )}

    <Section title="Limits">
      <Typography variant="body2" color="text.secondary">
        Time {problem.timeLimit} ms (extra time for Java, JavaScript and Python) · Memory {problem.memoryLimit} MB ·{' '}
        {problem.totalTestCases} test cases, {problem.totalTestCases - problem.examples.length} hidden
      </Typography>
    </Section>
  </Box>
);

export default ProblemStatement;
