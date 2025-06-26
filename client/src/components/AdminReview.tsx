import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  createdBy: { username?: string; email?: string };
  status: string;
}

const AdminReview: React.FC = () => {
  const { token, user } = useAuth();
  const [pendingProblems, setPendingProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) return;
    const fetchPending = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://10.180.28.83:5000/api/problems/admin/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingProblems(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch pending problems');
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, [token, user]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setError('');
    setSuccess('');
    try {
      await axios.patch(`http://10.180.28.83:5000/api/problems/admin/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`Problem ${action}d successfully!`);
      setPendingProblems(pendingProblems.filter(p => p._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${action} problem`);
    }
  };

  if (!user?.isAdmin) {
    return <Alert severity="error">You do not have admin access.</Alert>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Pending Problems for Review
          </Typography>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          {!loading && pendingProblems.length === 0 && (
            <Typography>No pending problems.</Typography>
          )}
          {pendingProblems.map(problem => (
            <Paper key={problem._id} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6">{problem.title}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Difficulty: {problem.difficulty} | Submitted by: {problem.createdBy?.username || 'Unknown'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{problem.description}</Typography>
              <Button
                variant="contained"
                color="success"
                sx={{ mr: 2 }}
                onClick={() => handleAction(problem._id, 'approve')}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleAction(problem._id, 'reject')}
              >
                Reject
              </Button>
            </Paper>
          ))}
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminReview; 