import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Chip, Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { SourceId } from '../api/types';
import { colors } from '../theme';

const SOURCE_LABELS: Record<SourceId, string> = { algoarena: 'AlgoArena', codeforces: 'Codeforces' };

/** Where a problem comes from. External sources are credited and linked, never copied. */
export const SourceChip: React.FC<{ source: SourceId; rating?: number | null }> = ({ source, rating }) => (
  <Tooltip
    title={
      source === 'algoarena'
        ? 'Judged here on AlgoArena'
        : `From ${SOURCE_LABELS[source]}. Read and submit on ${SOURCE_LABELS[source]}${rating ? ` (rating ${rating})` : ''}.`
    }
  >
    <Chip
      size="small"
      variant="outlined"
      label={SOURCE_LABELS[source] ?? source}
      sx={{
        fontWeight: 500,
        borderColor: colors.border,
        color: source === 'algoarena' ? 'primary.main' : 'text.secondary',
      }}
    />
  </Tooltip>
);

const linkSx = {
  color: 'text.primary',
  textDecoration: 'none',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  '&:hover': { color: 'primary.main' },
};

/** Internal problems open the AlgoArena workspace; external ones open the source site in a new tab. */
const ProblemTitleLink: React.FC<{ title: string; url: string; external: boolean }> = ({ title, url, external }) =>
  external ? (
    <Box component="a" href={url} target="_blank" rel="noopener noreferrer" sx={linkSx}>
      {title}
      <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary' }} aria-label="(opens in a new tab)" />
    </Box>
  ) : (
    <Box component={RouterLink} to={url} sx={linkSx}>
      {title}
    </Box>
  );

export default ProblemTitleLink;
