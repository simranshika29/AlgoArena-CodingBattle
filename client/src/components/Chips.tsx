import React from 'react';
import { alpha, Chip, ChipProps } from '@mui/material';
import { Difficulty, Verdict } from '../api/types';
import { colors } from '../theme';
import { VERDICTS } from '../utils/format';

const tinted = (color: string): ChipProps['sx'] => ({
  color,
  bgcolor: alpha(color, 0.12),
  border: `1px solid ${alpha(color, 0.3)}`,
});

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: colors.easy,
  medium: colors.medium,
  hard: colors.hard,
};

export const DifficultyChip: React.FC<{ difficulty: Difficulty; size?: ChipProps['size'] }> = ({
  difficulty,
  size = 'small',
}) => (
  <Chip
    size={size}
    label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    sx={tinted(DIFFICULTY_COLORS[difficulty])}
  />
);

export const VerdictChip: React.FC<{ verdict: Verdict; size?: ChipProps['size'] }> = ({ verdict, size = 'small' }) => {
  const { label, color } = VERDICTS[verdict] ?? VERDICTS.internal_error;
  return <Chip size={size} label={label} sx={tinted(color)} />;
};

export const TagChip: React.FC<{ tag: string; onClick?: () => void }> = ({ tag, onClick }) => (
  <Chip
    size="small"
    variant="outlined"
    label={tag}
    onClick={onClick}
    sx={{ fontWeight: 500, color: 'text.secondary', borderColor: colors.border }}
  />
);
