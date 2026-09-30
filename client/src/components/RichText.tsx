import React from 'react';
import { Box, Typography, TypographyProps } from '@mui/material';
import { colors, monoFont } from '../theme';

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*)/g;

const renderInline = (text: string, keyPrefix: string) =>
  text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <Box
          key={key}
          component="code"
          sx={{
            fontFamily: monoFont,
            fontSize: '0.88em',
            px: 0.6,
            py: 0.1,
            borderRadius: 0.75,
            bgcolor: colors.surfaceRaised,
            border: `1px solid ${colors.border}`,
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });

/**
 * Renders problem text with paragraphs, line breaks, `inline code`, and **bold**.
 * Builds React elements directly, so user-contributed text can never inject HTML.
 */
const RichText: React.FC<{ text: string } & TypographyProps> = ({ text, ...props }) => (
  <>
    {text
      .trim()
      .split(/\n{2,}/)
      .map((paragraph, p) => (
        <Typography key={p} variant="body1" sx={{ lineHeight: 1.7, '&:not(:last-child)': { mb: 1.5 } }} {...props}>
          {paragraph.split('\n').map((line, l, lines) => (
            <React.Fragment key={l}>
              {renderInline(line, `${p}-${l}`)}
              {l < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </Typography>
      ))}
  </>
);

export default RichText;
