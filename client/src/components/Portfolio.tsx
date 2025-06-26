import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ProblemSummary {
  _id: string;
  title: string;
}

interface PortfolioStats {
  totalSubmissions: number;
  completedSubmissions: number;
  problemsAttempted: number;
  problemsSolved: number;
  attemptedProblems: ProblemSummary[];
  solvedProblems: ProblemSummary[];
  languageUsage: Record<string, number>;
}

const Portfolio: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !token) return;
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`http://10.180.28.83:5000/api/users/${user.id}/portfolio`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err: any) {
        setError('Failed to fetch portfolio stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, token]);

  if (!user) return <Alert severity="error">You must be logged in to view your portfolio.</Alert>;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>Portfolio</Typography>
          <Typography variant="h6" sx={{ color: 'white' }}>Name: {user.username}</Typography>
          <Typography variant="body1" sx={{ color: 'white' }}>User ID: {user.id}</Typography>
          <Typography variant="body1" sx={{ color: 'white' }}>Email: {user.email}</Typography>
          {loading ? (
            <CircularProgress sx={{ mt: 2 }} />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : stats && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ color: 'white' }}>Total Submissions: {stats.totalSubmissions}</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>Completed Submissions: {stats.completedSubmissions}</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>Problems Attempted: {stats.problemsAttempted}</Typography>
              <Typography variant="body1" sx={{ color: 'white' }}>Problems Solved: {stats.problemsSolved}</Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Solved Problems:</Typography>
                {stats.solvedProblems.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'lightgray' }}>None yet.</Typography>
                ) : (
                  <ul style={{ color: 'white' }}>
                    {stats.solvedProblems.map(p => (
                      <li key={p._id}>{p.title}</li>
                    ))}
                  </ul>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Attempted Problems:</Typography>
                {stats.attemptedProblems.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'lightgray' }}>None yet.</Typography>
                ) : (
                  <ul style={{ color: 'white' }}>
                    {stats.attemptedProblems.map(p => (
                      <li key={p._id}>{p.title}</li>
                    ))}
                  </ul>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Language Usage:</Typography>
                {Object.keys(stats.languageUsage).length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'lightgray' }}>No submissions yet.</Typography>
                ) : (
                  <ul style={{ color: 'white' }}>
                    {Object.entries(stats.languageUsage).map(([lang, count]) => (
                      <li key={lang}>{lang.toUpperCase()}: {count}</li>
                    ))}
                  </ul>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Portfolio; 