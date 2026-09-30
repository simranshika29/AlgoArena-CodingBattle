import React, { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import GoogleSignIn from '../components/GoogleSignIn';
import { useAuth } from '../contexts/AuthContext';
import logoMark from '../assets/logo-mark.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

type Errors = Partial<Record<'username' | 'email' | 'password' | 'confirm', string>>;

const AuthCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <Box sx={{ flexGrow: 1, display: 'grid', placeItems: 'center', px: 2, py: { xs: 4, md: 8 } }}>
    <Paper sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 } }}>
      <Box component="img" src={logoMark} alt="" sx={{ width: 40, height: 40, borderRadius: 1, mb: 2 }} />
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        {subtitle}
      </Typography>
      {children}
    </Paper>
  </Box>
);

const PasswordField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
  disabled: boolean;
  helperText?: string;
}> = ({ label, value, onChange, error, autoComplete, disabled, helperText }) => {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={Boolean(error)}
      helperText={error || helperText}
      autoComplete={autoComplete}
      disabled={disabled}
      fullWidth
      margin="normal"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((v) => !v)}
              edge="end"
              size="small"
            >
              {visible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

const useRedirectTarget = () => {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
};

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={target} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(target, { replace: true });
    } catch (error) {
      setFormError((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue solving and duelling.">
      {formError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {formError}
        </Alert>
      )}
      <GoogleSignIn onSignedIn={() => navigate(target, { replace: true })} onError={setFormError} />
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          autoComplete="email"
          autoFocus
          disabled={loading}
          fullWidth
          margin="normal"
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
          disabled={loading}
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Log in'}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        New to AlgoArena?{' '}
        <Link component={RouterLink} to="/register" state={{ from: target }}>
          Create an account
        </Link>
      </Typography>
    </AuthCard>
  );
};

export const Register: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={target} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!USERNAME_REGEX.test(username.trim())) next.username = '3–20 characters: letters, numbers and underscores';
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Enter a valid email address';
    if (password.length < 8) next.password = 'Use at least 8 characters';
    else if (password.length > 128) next.password = 'Use at most 128 characters';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      navigate(target, { replace: true });
    } catch (error) {
      setFormError((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Track your progress and challenge friends to duels.">
      {formError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {formError}
        </Alert>
      )}
      <GoogleSignIn onSignedIn={() => navigate(target, { replace: true })} onError={setFormError} />
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={Boolean(errors.username)}
          helperText={errors.username || 'Shown on the leaderboard and in duels'}
          autoComplete="username"
          autoFocus
          disabled={loading}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          autoComplete="email"
          disabled={loading}
          fullWidth
          margin="normal"
        />
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          helperText="At least 8 characters"
          autoComplete="new-password"
          disabled={loading}
        />
        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
          disabled={loading}
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" state={{ from: target }}>
          Log in
        </Link>
      </Typography>
    </AuthCard>
  );
};
