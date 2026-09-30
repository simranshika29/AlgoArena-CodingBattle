import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DuelRoomState, OpenRoom } from '../api/types';
import PageHeader from '../components/PageHeader';
import { Panel } from '../components/StatsWidgets';
import { EmptyState, LoadingState } from '../components/StatusViews';
import { useSocket } from '../contexts/SocketContext';
import { colors, monoFont } from '../theme';
import { timeAgo } from '../utils/format';

const RULES = [
  'Both players get the same problem, chosen at random from ones neither of you has duelled on.',
  'Time limit: 10 minutes for easy, 20 for medium, 30 for hard.',
  'The first submission that passes every test wins immediately.',
  'At time-out, whoever passed more tests wins; equal scores are a draw.',
  'Leaving mid-duel, or staying disconnected for 20 seconds, forfeits.',
];

export const ConnectionBanner: React.FC<{ state: string }> = ({ state }) =>
  state === 'error' ? (
    <Alert severity="error" sx={{ mb: 3 }}>
      Can't reach the duel server. We'll keep retrying in the background.
    </Alert>
  ) : state === 'connecting' ? (
    <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 3 }}>
      Connecting to the duel server…
    </Alert>
  ) : null;

const Arena: React.FC = () => {
  const { socket, state, request } = useSocket();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<OpenRoom[] | null>(null);
  const [active, setActive] = useState<DuelRoomState | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | 'leave' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket || state !== 'connected') return;
    const onRooms = (list: OpenRoom[]) => setRooms(list);
    socket.on('lobby:rooms', onRooms);
    request<OpenRoom[]>('lobby:subscribe').then(setRooms).catch((e) => setError(e.message));
    request<DuelRoomState | null>('duel:active').then(setActive).catch(() => setActive(null));
    return () => {
      socket.off('lobby:rooms', onRooms);
      socket.emit('lobby:unsubscribe');
    };
  }, [socket, state, request]);

  const run = async (kind: 'create' | 'join', roomCode?: string) => {
    setBusy(kind);
    setError('');
    try {
      const room =
        kind === 'create'
          ? await request<DuelRoomState>('duel:create')
          : await request<DuelRoomState>('duel:join', { code: roomCode });
      navigate(`/arena/${room.code}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  };

  const leaveActive = async () => {
    if (!active) return;
    setBusy('leave');
    try {
      await request('duel:leave', { code: active.code });
      setActive(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const connected = state === 'connected';
  const cleanCode = code.trim().toUpperCase();

  return (
    <Container maxWidth="lg">
      <PageHeader title="Arena" subtitle="Challenge another coder to a real-time 1v1 duel." />
      <ConnectionBanner state={state} />
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {active && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Stack direction="row" spacing={1}>
              {active.phase === 'waiting' && (
                <Button color="inherit" size="small" onClick={leaveActive} disabled={busy === 'leave'}>
                  Leave
                </Button>
              )}
              <Button component={RouterLink} to={`/arena/${active.code}`} color="inherit" size="small" variant="outlined">
                Return
              </Button>
            </Stack>
          }
        >
          You're already in room <strong>{active.code}</strong>.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1.3fr' }, alignItems: 'start' }}>
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6">Start a duel</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Create a room and share its code with a friend.
            </Typography>
            <Button variant="contained" fullWidth size="large" onClick={() => run('create')} disabled={!connected || Boolean(busy) || Boolean(active)}>
              {busy === 'create' ? <CircularProgress size={22} color="inherit" /> : 'Create room'}
            </Button>

            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (cleanCode) run('join', cleanCode);
              }}
              sx={{ display: 'flex', gap: 1, mt: 3 }}
            >
              <TextField
                size="small"
                placeholder="Room code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                inputProps={{ 'aria-label': 'Room code', style: { fontFamily: monoFont, letterSpacing: '0.2em' } }}
                sx={{ flexGrow: 1 }}
              />
              <Button type="submit" variant="outlined" disabled={!connected || cleanCode.length !== 6 || Boolean(busy)}>
                Join
              </Button>
            </Box>
          </Paper>

          <Panel title="Rules">
            <Box component="ol" sx={{ m: 0, pl: 2.5, display: 'grid', gap: 1, color: 'text.secondary' }}>
              {RULES.map((rule) => (
                <li key={rule}>
                  <Typography variant="body2">{rule}</Typography>
                </li>
              ))}
            </Box>
          </Panel>
        </Stack>

        <Panel title="Open rooms" padded={false} action={<Typography variant="body2" color="text.secondary">Updates live</Typography>}>
          {!connected && !rooms ? (
            <LoadingState minHeight={160} label="Connecting…" />
          ) : !rooms || rooms.length === 0 ? (
            <EmptyState title="No open rooms right now" description="Create one and share the code, or check back in a moment." />
          ) : (
            <List disablePadding>
              {rooms.map((room) => (
                <ListItem
                  key={room.code}
                  divider
                  sx={{ borderColor: colors.border, px: 2.5 }}
                  secondaryAction={
                    <Button size="small" variant="outlined" onClick={() => run('join', room.code)} disabled={Boolean(busy) || Boolean(active)}>
                      Join
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <>
                        <Box component="span" sx={{ fontFamily: monoFont, color: 'primary.main', mr: 1.5 }}>
                          {room.code}
                        </Box>
                        hosted by {room.host}
                      </>
                    }
                    secondary={`Opened ${timeAgo(room.createdAt)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Panel>
      </Box>
    </Container>
  );
};

export default Arena;
