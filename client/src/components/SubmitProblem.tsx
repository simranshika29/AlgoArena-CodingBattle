import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Alert
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
}

const defaultTestCase: TestCase = { input: '', output: '', isHidden: false };

const SubmitProblem: React.FC = () => {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [timeLimit, setTimeLimit] = useState(1000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [testCases, setTestCases] = useState<TestCase[]>([{ ...defaultTestCase }]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: string | boolean) => {
    const updated = [...testCases];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setTestCases(updated);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { ...defaultTestCase }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length === 1) return;
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);
    try {
      await axios.post(
        'http://10.180.28.83:5000/api/problems',
        {
          title,
          description,
          difficulty,
          timeLimit,
          memoryLimit,
          testCases
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('Problem submitted successfully!');
      setTitle('');
      setDescription('');
      setDifficulty('easy');
      setTimeLimit(1000);
      setMemoryLimit(256);
      setTestCases([{ ...defaultTestCase }]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Submit a New Problem
          </Typography>
          {success && <Alert severity="success">{success}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              minRows={4}
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={difficulty}
                  label="Difficulty"
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Time Limit (ms)"
                type="number"
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                sx={{ width: 150 }}
                required
              />
              <TextField
                label="Memory Limit (MB)"
                type="number"
                value={memoryLimit}
                onChange={e => setMemoryLimit(Number(e.target.value))}
                sx={{ width: 150 }}
                required
              />
            </Box>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Test Cases
            </Typography>
            {testCases.map((tc, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <TextField
                  label="Input"
                  value={tc.input}
                  onChange={e => handleTestCaseChange(idx, 'input', e.target.value)}
                  required
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Output"
                  value={tc.output}
                  onChange={e => handleTestCaseChange(idx, 'output', e.target.value)}
                  required
                  sx={{ flex: 2 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={tc.isHidden}
                      onChange={e => handleTestCaseChange(idx, 'isHidden', e.target.checked)}
                    />
                  }
                  label="Hidden"
                />
                <IconButton color="error" onClick={() => removeTestCase(idx)} disabled={testCases.length === 1}>
                  <RemoveCircleIcon />
                </IconButton>
                {idx === testCases.length - 1 && (
                  <IconButton color="primary" onClick={addTestCase}>
                    <AddCircleIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Problem'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default SubmitProblem; 