import { alpha, createTheme } from '@mui/material/styles';

export const colors = {
  bg: '#0a0f17',
  surface: '#0f1621',
  surfaceRaised: '#141c29',
  border: '#1e2838',
  text: '#e6edf3',
  textMuted: '#8b98a9',
  primary: '#4cc2ff',
  easy: '#3fb950',
  medium: '#e3b341',
  hard: '#f85149',
};

export const monoFont = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: colors.primary, contrastText: '#04111c' },
    secondary: { main: '#8b9cff' },
    success: { main: colors.easy },
    warning: { main: colors.medium },
    error: { main: colors.hard },
    background: { default: colors.bg, paper: colors.surface },
    text: { primary: colors.text, secondary: colors.textMuted },
    divider: colors.border,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.08em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.bg },
        'code, kbd': { fontFamily: monoFont },
        '::selection': { background: alpha(colors.primary, 0.3) },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', border: `1px solid ${colors.border}` },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { border: 'none' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: colors.border },
        head: { color: colors.textMuted, fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
      },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: colors.surfaceRaised, border: `1px solid ${colors.border}` } },
    },
    MuiDialog: {
      styleOverrides: { paper: { backgroundColor: colors.surface } },
    },
    MuiMenu: {
      styleOverrides: { paper: { backgroundColor: colors.surfaceRaised } },
    },
  },
});

export default theme;
