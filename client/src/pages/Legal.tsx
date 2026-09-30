import React from 'react';
import { Box, Container, Link, Typography } from '@mui/material';
import PageHeader from '../components/PageHeader';

const REPO_URL = 'https://github.com/simranshika29/AlgoArena-CodingBattle';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box component="section" sx={{ mb: 3.5 }}>
    <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Box sx={{ color: 'text.secondary', lineHeight: 1.75, '& li': { mb: 0.75 } }}>{children}</Box>
  </Box>
);

const Contact = () => (
  <>
    open an issue on the{' '}
    <Link href={`${REPO_URL}/issues`} target="_blank" rel="noopener noreferrer">
      AlgoArena GitHub repository
    </Link>
  </>
);

export const Privacy: React.FC = () => (
  <Container maxWidth="md">
    <PageHeader title="Privacy" subtitle="What AlgoArena stores, and why." />
    <Section title="What we store">
      <ul>
        <li>Account details: username, email address, and either a hashed password or your Google account id if you use “Continue with Google”.</li>
        <li>Your activity: code you run or submit, judging results, duel results, and practice sets you generate.</li>
        <li>Optional: a Codeforces handle, if you link one.</li>
      </ul>
      We don't show ads, and we don't sell or share your data for marketing.
    </Section>
    <Section title="Google sign-in">
      If you choose “Continue with Google”, we receive your name, email address and Google account id from Google, and use them only to
      create or sign you in to your AlgoArena account. We don't access anything else in your Google account.
    </Section>
    <Section title="Services we use">
      <ul>
        <li>Code you run is sent to Judge0 to be executed in a sandbox.</li>
        <li>If you link a Codeforces handle, your public Codeforces submissions are read from the Codeforces API to show your progress.</li>
        <li>The site is hosted on Vercel and Render, and data is stored in MongoDB Atlas.</li>
      </ul>
    </Section>
    <Section title="Public information">
      Your username, solved-problem statistics and duel record appear on the leaderboard and your public profile. Your email is never
      shown publicly.
    </Section>
    <Section title="Your choices">
      You can unlink your Codeforces handle at any time from the Practice page. To have your account and data deleted, <Contact />.
    </Section>
  </Container>
);

export const Terms: React.FC = () => (
  <Container maxWidth="md">
    <PageHeader title="Terms of use" subtitle="The short version: practice, have fun, don't abuse the service." />
    <Section title="The service">
      AlgoArena is a free coding practice project, provided as-is without guarantees of availability or accuracy. Features may change or
      be removed.
    </Section>
    <Section title="Fair use">
      <ul>
        <li>Don't try to break, overload or misuse the code runner, the API, or other users' accounts.</li>
        <li>Don't submit code intended to attack systems, and don't upload content that isn't yours to share.</li>
        <li>Problems contributed to AlgoArena may be reviewed, edited or removed by admins.</li>
      </ul>
    </Section>
    <Section title="Third-party problems">
      Problems from Codeforces belong to Codeforces and their authors. AlgoArena only links to them, and you read and submit them on
      codeforces.com under Codeforces' own terms.
    </Section>
    <Section title="Accounts">
      You're responsible for activity on your account. Accounts that abuse the service may be removed. Questions? <Contact />.
    </Section>
  </Container>
);
