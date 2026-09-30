import React from 'react';
import { Box, FormControl, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import { Language } from '../api/types';
import { colors } from '../theme';
import { LANGUAGES, sortLanguages } from '../utils/languages';

interface EditorToolbarProps {
  languages: Language[];
  language: Language;
  onLanguageChange: (language: Language) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

/** Language picker on the left, page-specific actions (Run/Submit…) on the right. */
const EditorToolbar: React.FC<EditorToolbarProps> = ({ languages, language, onLanguageChange, disabled, children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 1.5,
      py: 1,
      borderBottom: `1px solid ${colors.border}`,
      flexWrap: 'wrap',
    }}
  >
    <FormControl size="small" sx={{ minWidth: 130 }}>
      <Select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        disabled={disabled}
        inputProps={{ 'aria-label': 'Language' }}
        sx={{ fontSize: '0.875rem' }}
      >
        {sortLanguages(languages).map((lang) => (
          <MenuItem key={lang} value={lang}>
            {LANGUAGES[lang].label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    {LANGUAGES[language].hint && (
      <Tooltip title={LANGUAGES[language].hint}>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' } }}>
          {LANGUAGES[language].hint}
        </Typography>
      </Tooltip>
    )}
    <Box sx={{ flexGrow: 1 }} />
    {children}
  </Box>
);

export default EditorToolbar;
