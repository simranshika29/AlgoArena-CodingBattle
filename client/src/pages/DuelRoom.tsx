import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { DuelPlayer, DuelRoomState, JudgeResult, Language } from '../api/types';
import { VerdictChip } from '../components/Chips';
import CodeEditor from '../components/CodeEditor';
import EditorToolbar from '../components/EditorToolbar';
import JudgeResultPanel from '../components/JudgeResultPanel';
import ProblemStatement from '../components/ProblemStatement';
import { ErrorState, LoadingState } from '../components/StatusViews';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { colors, monoFont } from '../theme';
import { formatClock } from '../utils/format';
import { getPreferredLanguage, LANGUAGES, loadDraft, saveDraft, setPreferredLanguage } from '../utils/languages';
import { ConnectionBanner } from './Arena';

/** Re-renders every 250ms while `active`, for countdowns and timers. */
const useNow = (active: boolean) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [active]);
  return now;
};

const PlayerCard: React.FC<{ player: DuelPlayer; isMe: boolean; showScore: boolean; isWinner: boolean }> = ({
  player,
  isMe,
  showScore,
  isWinner,
}) => (
  <Box sx={{ minWidth: 0, flex: 1 }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title={player.connected ? 'Connected' : 'Disconnected'}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: player.connected ? colors.easy : colors.textMuted, flexShrink: 0 }} />
      </Tooltip>
      <Typography noWrap sx={{ fontWeight: 600, color: isWinner ? colors.easy : 'text.primary' }}>
        {player.username}
        {isMe && (
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
            {' '}
            (you)
          </Box>
        )}
      </Typography>
      {player.judging && <CircularProgress size={14} aria-label="Judging" />}
    </Stack>
    {showScore && (
      <>
        <LinearProgress
          variant="determinate"
          value={player.totalTestCases ? (player.bestPassed / player.totalTestCases) * 100 : 0}
          sx={{ mt: 1, height: 5, borderRadius: 3, bgcolor: colors.surfaceRaised, '& .MuiLinearProgress-bar': { bgcolor: player.solved ? colors.easy : colors.primary } }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: monoFont }}>
          {player.bestPassed}/{player.totalTestCases} tests · {player.submissions} submits
          {player.solved && player.solvedInMs !== null ? ` · solved in ${formatClock(player.solvedInMs)}` : ''}
        </Typography>
      </>
    )}
  </Box>
);

const RoomCode: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const copy = async (kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(kind === 'code' ? code : `${window.location.origin}/arena/${code}`);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary">
        Room code
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
        <Typography sx={{ fontFamily: monoFont, fontSize: { xs: '2rem', sm: '2.6rem' }, fontWeight: 600, letterSpacing: '0.18em', color: 'primary.main' }}>
          {code}
        </Typography>
        <Tooltip title={copied === 'code' ? 'Copied' : 'Copy code'}>
          <IconButton onClick={() => copy('code')} aria-label="Copy room code">
            {copied === 'code' ? <CheckIcon /> : <ContentCopyIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
      <Button size="small" onClick={() => copy('link')}>
        {copied === 'link' ? 'Invite link copied' : 'Copy invite link'}
      </Button>
    </Box>
  );
};

const DuelRoom: React.FC = () => {
  const { code: rawCode = '' } = useParams<{ code: string }>();
  const code = rawCode.toUpperCase();
  const { user } = useAuth();
  const { socket, state, request } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState<DuelRoomState | null>(null);
  const [joinError, setJoinError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [language, setLanguage] = useState<Language>('python');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const clockOffset = useRef(0);
  const problemId = room?.problem?._id;

  const applyRoom = useCallback((next: DuelRoomState) => {
    clockOffset.current = next.serverNow - Date.now();
    setRoom(next);
  }, []);

  // Join (or rejoin) the room whenever the socket (re)connects.
  useEffect(() => {
    if (!socket || state !== 'connected') return;
    const onUpdate = (next: DuelRoomState) => next.code === code && applyRoom(next);
    const onError = (payload: { message: string }) => setNotice(payload.message);
    socket.on('duel:update', onUpdate);
    socket.on('duel:error', onError);
    request<DuelRoomState>('duel:join', { code })
      .then((r) => {
        setJoinError('');
        applyRoom(r);
      })
      .catch((e) => setJoinError(e.message));
    return () => {
      socket.off('duel:update', onUpdate);
      socket.off('duel:error', onError);
    };
  }, [socket, state, code, request, applyRoom]);

  // Load the draft once the problem is revealed.
  useEffect(() => {
    if (!room?.problem || !problemId) return;
    const initial = getPreferredLanguage(room.problem.acceptedLanguages);
    setLanguage(initial);
    setSource(loadDraft(`duel-${code}`, initial));
    // Only when a new problem appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId, code]);

  useEffect(() => {
    if (!problemId) return;
    const timer = setTimeout(() => saveDraft(`duel-${code}`, language, source), 400);
    return () => clearTimeout(timer);
  }, [problemId, code, language, source]);

  const ticking = room?.phase === 'countdown' || room?.phase === 'in-progress';
  const now = useNow(ticking) + clockOffset.current;

  const me = room?.players.find((p) => p.userId === user?.id);
  const opponent = room?.players.find((p) => p.userId !== user?.id);

  const setReady = async (ready: boolean) => {
    setBusy(true);
    setNotice('');
    try {
      applyRoom(await request<DuelRoomState>('duel:ready', { code, ready }));
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setConfirmLeave(false);
    try {
      await request('duel:leave', { code });
    } catch {
      // Leaving a room that no longer exists is fine.
    }
    navigate('/arena');
  };

  const submit = async () => {
    if (!source.trim()) {
      setSubmitError('Write some code before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    setResult(null);
    try {
      setResult(await request<JudgeResult>('duel:submit', { code, language, source }));
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const changeLanguage = (next: Language) => {
    saveDraft(`duel-${code}`, language, source);
    setLanguage(next);
    setPreferredLanguage(next);
    setSource(loadDraft(`duel-${code}`, next));
  };

  if (joinError) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <ErrorState message={joinError} />
        <Box sx={{ textAlign: 'center' }}>
          <Button component={RouterLink} to="/arena" variant="contained">
            Back to the arena
          </Button>
        </Box>
      </Container>
    );
  }
  if (!room) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <ConnectionBanner state={state} />
        <LoadingState label="Joining duel…" minHeight="50vh" />
      </Container>
    );
  }

  // ---------- Waiting & countdown ----------
  if (room.phase === 'waiting' || room.phase === 'countdown') {
    const secondsLeft = room.countdownEndsAt ? Math.max(0, Math.ceil((room.countdownEndsAt - now) / 1000)) : null;
    return (
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        <ConnectionBanner state={state} />
        {notice && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setNotice('')}>
            {notice}
          </Alert>
        )}
        <Paper sx={{ p: { xs: 3, sm: 4 } }}>
          {room.phase === 'countdown' ? (
            <Box sx={{ textAlign: 'center', py: 3 }} role="status">
              <Typography variant="overline" color="text.secondary">
                {secondsLeft === null ? 'Picking a problem…' : 'Duel starts in'}
              </Typography>
              <Typography sx={{ fontFamily: monoFont, fontSize: '5rem', fontWeight: 600, color: 'primary.main', lineHeight: 1.1 }}>
                {secondsLeft ?? '…'}
              </Typography>
            </Box>
          ) : (
            <RoomCode code={room.code} />
          )}

          <Stack spacing={2} sx={{ mt: 3 }}>
            {room.players.map((player) => (
              <Stack key={player.userId} direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, border: `1px solid ${colors.border}`, borderRadius: 1 }}>
                <PlayerCard player={player} isMe={player.userId === user?.id} showScore={false} isWinner={false} />
                <Typography variant="body2" sx={{ color: player.ready ? colors.easy : 'text.secondary', fontWeight: 600 }}>
                  {player.ready ? 'Ready' : 'Not ready'}
                </Typography>
              </Stack>
            ))}
            {room.players.length < 2 && (
              <Box sx={{ p: 1.5, border: `1px dashed ${colors.border}`, borderRadius: 1, textAlign: 'center' }}>
                <Typography color="text.secondary">Waiting for an opponent to join…</Typography>
              </Box>
            )}
          </Stack>

          {room.phase === 'waiting' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                variant={me?.ready ? 'outlined' : 'contained'}
                fullWidth
                size="large"
                onClick={() => setReady(!me?.ready)}
                disabled={busy || room.players.length < 2}
              >
                {room.players.length < 2 ? 'Waiting for opponent' : me?.ready ? 'Cancel ready' : "I'm ready"}
              </Button>
              <Button variant="text" color="inherit" onClick={leave} sx={{ flexShrink: 0 }}>
                Leave room
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    );
  }

  // ---------- In progress & finished ----------
  const problem = room.problem!;
  const finished = room.phase === 'finished';
  const timeLeft = room.endsAt ? room.endsAt - now : 0;
  const lowTime = !finished && timeLeft < 60_000;

  const resultTitle = !finished
    ? ''
    : room.winnerId === null
      ? "It's a draw"
      : room.winnerId === user?.id
        ? 'You won!'
        : `${room.players.find((p) => p.userId === room.winnerId)?.username ?? 'Your opponent'} won`;
  const resultReason =
    room.outcome === 'solved'
      ? 'First to pass every test.'
      : room.outcome === 'timeout'
        ? 'Time ran out; more tests passed wins.'
        : room.outcome === 'forfeit'
          ? 'A player left the duel.'
          : 'Time ran out with equal scores.';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { md: 'calc(100vh - 60px)' } }}>
      {/* Scoreboard bar */}
      <Box sx={{ borderBottom: `1px solid ${colors.border}`, bgcolor: colors.surface, px: { xs: 2, md: 3 }, py: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, md: 4 }} alignItems={{ md: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {finished ? 'Final' : 'Time left'}
              </Typography>
              <Typography sx={{ fontFamily: monoFont, fontSize: '1.6rem', fontWeight: 600, lineHeight: 1.1, color: lowTime ? colors.hard : 'text.primary' }} aria-live="off">
                {finished ? '—' : formatClock(timeLeft)}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontFamily: monoFont, color: 'text.secondary' }}>
              #{room.code}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ flexGrow: 1, minWidth: 0 }}>
            {me && <PlayerCard player={me} isMe showScore isWinner={room.winnerId === me.userId} />}
            {opponent && <PlayerCard player={opponent} isMe={false} showScore isWinner={room.winnerId === opponent.userId} />}
          </Stack>
          {!finished && (
            <Button color="error" variant="text" onClick={() => setConfirmLeave(true)} sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', md: 'center' } }}>
              Forfeit
            </Button>
          )}
        </Stack>
      </Box>

      {finished && (
        <Alert
          severity={room.winnerId === user?.id ? 'success' : room.winnerId === null ? 'info' : 'warning'}
          sx={{ borderRadius: 0 }}
          action={
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to={`/problems/${problem._id}`} color="inherit" size="small">
                Practice this problem
              </Button>
              <Button component={RouterLink} to="/arena" color="inherit" size="small" variant="outlined">
                New duel
              </Button>
            </Stack>
          }
        >
          <strong>{resultTitle}</strong> {resultReason}
        </Alert>
      )}
      {!finished && <ConnectionBanner state={state} />}

      <Box sx={{ flexGrow: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(340px, 1fr) minmax(420px, 1.25fr)' } }}>
        <Box sx={{ overflowY: 'auto', p: { xs: 2, md: 3 }, borderRight: { md: `1px solid ${colors.border}` } }}>
          <ProblemStatement problem={problem} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderTop: { xs: `1px solid ${colors.border}`, md: 'none' } }}>
          <EditorToolbar languages={problem.acceptedLanguages} language={language} onLanguageChange={changeLanguage} disabled={submitting || finished}>
            {me?.lastVerdict && <VerdictChip verdict={me.lastVerdict} />}
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadOutlinedIcon />}
              onClick={submit}
              disabled={submitting || finished || timeLeft <= 0}
            >
              Submit
            </Button>
          </EditorToolbar>
          <Box sx={{ flexGrow: 1, minHeight: { xs: 360, md: 0 }, height: { xs: 360, md: 'auto' } }}>
            <CodeEditor language={language} value={source} onChange={setSource} readOnly={finished} />
          </Box>
          <Box sx={{ borderTop: `1px solid ${colors.border}`, height: { md: '34%' }, minHeight: { md: 160 }, overflowY: 'auto', bgcolor: colors.surface }} aria-live="polite">
            <JudgeResultPanel
              result={result}
              pending={submitting ? 'submit' : null}
              error={submitError}
              idleHint="Submit as often as you like. Each submission is judged against every test, and the first full pass wins."
            />
          </Box>
        </Box>
      </Box>

      <Dialog open={confirmLeave} onClose={() => setConfirmLeave(false)}>
        <DialogTitle>Forfeit this duel?</DialogTitle>
        <DialogContent>Your opponent will be awarded the win. {LANGUAGES[language].label} drafts stay saved in this browser.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeave(false)}>Keep playing</Button>
          <Button color="error" onClick={leave}>
            Forfeit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuelRoom;
