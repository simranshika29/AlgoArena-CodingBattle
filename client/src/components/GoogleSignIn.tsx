import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    google?: any;
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let clientIdPromise: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;

/** The client id comes from the API at runtime, so Google can be enabled without rebuilding the site. */
const getClientId = () => {
  clientIdPromise ??= api
    .get<{ googleClientId: string | null }>('/auth/config')
    .then((r) => r.data.googleClientId)
    .catch(() => {
      clientIdPromise = null;
      return null;
    });
  return clientIdPromise;
};

const loadGoogleScript = () => {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

interface GoogleSignInProps {
  onSignedIn: () => void;
  onError: (message: string) => void;
}

/** "Continue with Google" (Google Identity Services). Renders nothing when Google sign-in isn't configured. */
const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSignedIn, onError }) => {
  const { loginWithGoogle, linkGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkCredential, setLinkCredential] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linking, setLinking] = useState(false);

  // Keep the latest handlers without re-initializing Google on every render.
  const handlers = useRef({ onSignedIn, onError, loginWithGoogle });
  handlers.current = { onSignedIn, onError, loginWithGoogle };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const clientId = await getClientId();
      if (!clientId || cancelled) return;
      try {
        await loadGoogleScript();
      } catch {
        if (!cancelled) handlers.current.onError('Google sign-in could not be loaded. Check your connection or try email instead.');
        return;
      }
      if (cancelled || !buttonRef.current) return;
      setEnabled(true);
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        callback: async ({ credential }: { credential: string }) => {
          setBusy(true);
          try {
            const result = await handlers.current.loginWithGoogle(credential);
            if (result === 'link-required') setLinkCredential(credential);
            else handlers.current.onSignedIn();
          } catch (error) {
            handlers.current.onError((error as Error).message);
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        // Google's button accepts 200–400px; fit it to the card so it never overflows on phones.
        width: Math.max(200, Math.min(buttonRef.current.offsetWidth || 300, 400)),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const confirmLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCredential || !password) return;
    setLinking(true);
    setLinkError('');
    try {
      await linkGoogle(linkCredential, password);
      setLinkCredential(null);
      onSignedIn();
    } catch (error) {
      setLinkError((error as Error).message);
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      {/* Always laid out (empty until Google loads) so the button can be sized to the real card width. */}
      <Box sx={{ position: 'relative', minHeight: enabled ? 44 : 0, display: 'flex', justifyContent: 'center' }}>
        <Box ref={buttonRef} sx={{ width: '100%', display: 'flex', justifyContent: 'center', opacity: busy ? 0.5 : 1 }} />
        {busy && <CircularProgress size={22} sx={{ position: 'absolute', top: 11 }} aria-label="Signing in with Google" />}
      </Box>
      {enabled && <Divider sx={{ my: 2.5, color: 'text.secondary', fontSize: '0.8rem' }}>or use email</Divider>}

      <Dialog open={Boolean(linkCredential)} onClose={() => !linking && setLinkCredential(null)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={confirmLink}>
          <DialogTitle>Link your Google account</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              An AlgoArena account already uses this email. Enter its password once to link Google sign-in. Your
              progress, submissions and duels stay exactly as they are.
            </Typography>
            {linkError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {linkError}
              </Alert>
            )}
            <TextField
              label="AlgoArena password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLinkCredential(null)} disabled={linking}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={linking || !password}>
              {linking ? 'Linking…' : 'Link and sign in'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default GoogleSignIn;
