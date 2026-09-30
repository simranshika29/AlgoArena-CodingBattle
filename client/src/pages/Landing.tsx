import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import BoltIcon from '@mui/icons-material/Bolt';
import InsightsIcon from '@mui/icons-material/Insights';
import api from '../api/client';
import { Difficulty, PracticeOptions, ProblemPage } from '../api/types';
import { useAuth } from '../contexts/AuthContext';
import { colors, monoFont } from '../theme';

const FEATURES = [
  {
    icon: <CodeIcon />,
    title: 'Solve in the browser',
    body: 'Write Python, JavaScript, C++, C or Java in a real editor. Run against samples, then submit against hidden tests in a sandbox.',
  },
  {
    icon: <BoltIcon />,
    title: '1v1 coding duels',
    body: 'Share a room code with a friend. You both get the same unseen problem and a timer, and the first accepted solution wins.',
  },
  {
    icon: <InsightsIcon />,
    title: 'Track real progress',
    body: 'See solved counts by difficulty, your daily streak, recent submissions, duel record and leaderboard rank.',
  },
];

const DUEL_STEPS = [
  ['Create a room', 'Get a six-character code and send it to your opponent.'],
  ['Ready up', 'Once both players are ready, a random problem neither of you has duelled on is revealed.'],
  ['Race to Accepted', 'Submit as often as you like. The first full pass wins; at time-out, the most tests passed wins.'],
];

const EditorPreview: React.FC = () => (
  <Box
    aria-hidden
    sx={{
      border: `1px solid ${colors.border}`,
      borderRadius: 2,
      bgcolor: colors.surface,
      overflow: 'hidden',
      fontFamily: monoFont,
      fontSize: { xs: '0.75rem', sm: '0.85rem' },
    }}
  >
    <Box sx={{ display: 'flex', gap: 0.75, px: 2, py: 1.25, borderBottom: `1px solid ${colors.border}` }}>
      {[colors.hard, colors.medium, colors.easy].map((c) => (
        <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c, opacity: 0.7 }} />
      ))}
      <Typography sx={{ ml: 1.5, fontFamily: monoFont, fontSize: '0.75rem', color: 'text.secondary' }}>
        two_sum.py
      </Typography>
    </Box>
    <Box component="pre" sx={{ m: 0, p: 2, lineHeight: 1.7, overflowX: 'auto', color: colors.text }}>
      <Box component="span" sx={{ color: '#c678dd' }}>def</Box> <Box component="span" sx={{ color: colors.primary }}>two_sum</Box>(nums, target):{'\n'}
      {'    '}seen = {'{}'}{'\n'}
      {'    '}<Box component="span" sx={{ color: '#c678dd' }}>for</Box> i, x <Box component="span" sx={{ color: '#c678dd' }}>in</Box> enumerate(nums):{'\n'}
      {'        '}<Box component="span" sx={{ color: '#c678dd' }}>if</Box> target - x <Box component="span" sx={{ color: '#c678dd' }}>in</Box> seen:{'\n'}
      {'            '}<Box component="span" sx={{ color: '#c678dd' }}>return</Box> seen[target - x], i{'\n'}
      {'        '}seen[x] = i
    </Box>
    <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${colors.border}`, display: 'flex', gap: 2, alignItems: 'center' }}>
      <Typography sx={{ color: colors.easy, fontWeight: 700, fontFamily: 'Inter' }}>Accepted</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', fontFamily: 'Inter' }}>5/5 tests passed</Typography>
    </Box>
  </Box>
);

const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [catalog, setCatalog] = useState<{ total: number; byDifficulty: Record<Difficulty, number> } | null>(null);
  const [externalCount, setExternalCount] = useState(0);

  // Real catalogue numbers straight from the API.
  useEffect(() => {
    const count = (difficulty?: Difficulty) =>
      api
        .get<ProblemPage>('/problems', { params: { limit: 1, ...(difficulty && { difficulty }) } })
        .then((r) => r.data.total);
    Promise.all([count(), count('easy'), count('medium'), count('hard')])
      .then(([total, easy, medium, hard]) => setCatalog({ total, byDifficulty: { easy, medium, hard } }))
      .catch(() => setCatalog(null));
    api
      .get<PracticeOptions>('/problem-sets/options')
      .then((r) => setExternalCount(r.data.sources.find((s) => s.id === 'codeforces' && s.available)?.problemCount ?? 0))
      .catch(() => setExternalCount(0));
  }, []);

  const primaryCta = isAuthenticated ? '/dashboard' : '/register';

  return (
    <>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
            gap: { xs: 5, md: 8 },
            alignItems: 'center',
            pt: { xs: 6, md: 12 },
            pb: { xs: 6, md: 10 },
          }}
        >
          <Box>
            <Typography variant="overline" color="primary">
              Coding practice · real-time duels
            </Typography>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: '2.4rem', sm: '3.2rem', md: '3.6rem' }, lineHeight: 1.05, mt: 1 }}
            >
              Sharpen your DSA.
              <br />
              <Box component="span" sx={{ color: 'primary.main' }}>
                Prove it in a duel.
              </Box>
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2.5, fontSize: '1.1rem', maxWidth: 520, lineHeight: 1.7 }}>
              AlgoArena is a practice platform for students and developers preparing for coding interviews and contests.
              Solve curated problems, get judged against hidden tests, and race a friend to the first accepted solution.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={RouterLink} to={primaryCta} variant="contained" size="large">
                {isAuthenticated ? 'Go to dashboard' : 'Start coding free'}
              </Button>
              <Button component={RouterLink} to="/problems" variant="outlined" size="large">
                Explore problems
              </Button>
            </Stack>
            {catalog && catalog.total > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                {catalog.total} problems ·{' '}
                <Box component="span" sx={{ color: colors.easy }}>{catalog.byDifficulty.easy} easy</Box> ·{' '}
                <Box component="span" sx={{ color: colors.medium }}>{catalog.byDifficulty.medium} medium</Box> ·{' '}
                <Box component="span" sx={{ color: colors.hard }}>{catalog.byDifficulty.hard} hard</Box>
                {externalCount > 0 && ` · plus ${externalCount.toLocaleString()} Codeforces problems for practice sets`}
              </Typography>
            )}
          </Box>
          <EditorPreview />
        </Box>
      </Container>

      <Box sx={{ borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 4, md: 6 }, py: { xs: 5, md: 7 } }}>
            {FEATURES.map((feature) => (
              <Box key={feature.title}>
                <Box sx={{ color: 'primary.main', mb: 1.5 }}>{feature.icon}</Box>
                <Typography variant="h6">{feature.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                  {feature.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
          How a duel works
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {DUEL_STEPS.map(([title, body], index) => (
            <Box key={title} sx={{ display: 'flex', gap: 2 }}>
              <Typography sx={{ fontFamily: monoFont, color: 'primary.main', fontWeight: 600, pt: 0.25 }}>
                0{index + 1}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                  {body}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: 6 }}>
          <Button component={RouterLink} to={isAuthenticated ? '/arena' : '/register'} variant="contained" size="large">
            {isAuthenticated ? 'Open the arena' : 'Create an account to duel'}
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default Landing;
