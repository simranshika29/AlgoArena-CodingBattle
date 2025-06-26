import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Problem {
  _id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (difficulty) params.append('difficulty', difficulty);

        const response = await axios.get(`http://10.180.28.83:5000/api/problems?${params}`);
        setProblems(response.data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    fetchProblems();
  }, [search, difficulty]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
          Coding Problems
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Search Problems"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputLabelProps={{ style: { color: 'white' } }}
            inputProps={{ style: { color: 'white' } }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel sx={{ color: 'white' }}>Difficulty</InputLabel>
            <Select
              value={difficulty}
              label="Difficulty"
              onChange={(e) => setDifficulty(e.target.value)}
              sx={{ color: 'white' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Paper elevation={2} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <List>
            {problems.map((problem) => (
              <ListItem
                key={problem._id}
                onClick={() => navigate(`/problems/${problem._id}`)}
                divider
                sx={{ 
                  cursor: 'pointer', 
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  '& .MuiListItemText-primary': { color: 'white' },
                  '& .MuiListItemText-secondary': { color: 'lightgray' }
                }}
              >
                <ListItemText
                  primary={problem.title}
                  secondary={problem.description.substring(0, 150) + '...'}
                />
                <Chip
                  label={problem.difficulty}
                  color={getDifficultyColor(problem.difficulty)}
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProblemList; 