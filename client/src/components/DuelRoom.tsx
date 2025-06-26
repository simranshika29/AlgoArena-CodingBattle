import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
  Alert,
  Grid,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Chip,
} from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import { keyframes } from '@mui/system';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../config';
// Import the Problem interface directly if it's exported, or redefine it here if simple.
// Assuming Problem interface is exported from ProblemList.tsx as a named export:
// import { Problem as ProblemInterface } from './ProblemList'; 
// If not exported, redefine it:
interface ProblemInterface {
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: { input: string; output: string; isHidden: boolean }[];
  timeLimit: number;
  memoryLimit: number;
  acceptedLanguages?: string[];
}

// Define interfaces for data received from backend Socket.io events
interface DuelRoom {
  id: string;
  players: { userId: string; socketId: string; username: string; isReady: boolean; submission?: { code: string; language: string; testResults?: any[]; passedAll?: boolean; submissionTime?: number; }; }[];
  problem: ProblemInterface | null;
  status: 'waiting' | 'starting' | 'in-progress' | 'completed';
  startTime: number | null;
  winnerId: string | null;
}

const getDefaultCode = (lang: string) => {
  switch (lang) {
    case 'javascript':
      return 'function solution(input) {\n  // Write your code here\n  return input;\n}';
    case 'python':
      return 'def solution(input):\n    # Write your code here\n    return input';
    case 'c':
      return '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    return 0;\n}';
    case 'cpp':
      return '#include <iostream>\n#include <string>\n\nstd::string solution(std::string input) {\n    // Write your code here\n    return input;\n}';
    default:
      return '';
  }
};

const DuelRoom: React.FC = () => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<DuelRoom | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submissionResult, setSubmissionResult] = useState<any>(null); // Store last submission result
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showRoomId, setShowRoomId] = useState(false); // Show room ID after creation
  const [copied, setCopied] = useState(false); // Track if room ID was copied

  useEffect(() => {
    if (!user || !token) {
      setError('Authentication required to join a duel.');
      return;
    }

    const newSocket = io(config.socketUrl, {
        auth: { token }, // Send JWT for authentication if needed by backend socket
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setError(''); // Clear errors on successful connection
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setCurrentRoom(null);
      setError('Disconnected from duel server. Please refresh or try again.');
    });

    newSocket.on('duelCreated', (room: DuelRoom) => {
      console.log('Duel created:', room);
      setCurrentRoom(room);
      setShowRoomId(true); // Show room ID after creation
      setCopied(false); // Reset copied state
      setError('');
    });

    newSocket.on('duelJoined', (room: DuelRoom) => {
      console.log('Duel joined:', room);
      setCurrentRoom(room);
      setShowRoomId(false); // Hide room ID when someone joins
      setError('');
       // Set default code when problem is assigned
      if (room.problem) {
         setCode(getDefaultCode(language));
      }
      if (room.status === 'starting') {
         // Assuming room.startTime is the timestamp when starting began
         const timeRemaining = Math.max(0, 5 - Math.floor((Date.now() - (room.startTime || Date.now())) / 1000)); // 5-second countdown
         setCountdown(timeRemaining);
      } else {
         setCountdown(0);
      }
      if (room.status === 'in-progress' && room.problem && room.startTime) {
         const timeRemaining = Math.max(0, room.problem.timeLimit - Math.floor((Date.now() - room.startTime) / 1000));
         setTimeLeft(timeRemaining);
      } else {
         setTimeLeft(0);
      }
    });

    newSocket.on('joinError', (data: { message: string }) => {
      console.error('Join error:', data.message);
      setError(data.message);
    });

    newSocket.on('duelUpdate', (room: DuelRoom) => {
      console.log('Duel update:', room);
      setCurrentRoom(room);
      // Hide room ID if duel is no longer waiting
      if (room.status !== 'waiting') {
        setShowRoomId(false);
      }
      // If problem is just assigned, set default code
      if (!currentRoom?.problem && room.problem) {
         setCode(getDefaultCode(language));
      }
      if (room.status === 'starting') {
         // Assuming room.startTime is the timestamp when starting began
         const timeRemaining = Math.max(0, 5 - Math.floor((Date.now() - (room.startTime || Date.now())) / 1000)); // 5-second countdown
         setCountdown(timeRemaining);
      } else {
         setCountdown(0);
      }
      if (room.status === 'in-progress' && room.problem && room.startTime) {
         const timeRemaining = Math.max(0, room.problem.timeLimit - Math.floor((Date.now() - room.startTime) / 1000));
         setTimeLeft(timeRemaining);
      } else {
         setTimeLeft(0);
      }
    });

    newSocket.on('duelEnded', (data: { winnerId: string; room: DuelRoom }) => {
      console.log('Duel ended:', data);
      setCurrentRoom(data.room);
      // Display winner, maybe navigate away or show results summary
      setSubmitting(false);
      // TODO: Display detailed results to the user
    });

    newSocket.on('submissionResult', (result: any) => {
       console.log('Submission result:', result);
       setSubmissionResult(result);
       setSubmitting(false);
       // TODO: Display detailed results to the user
    });

    // Handle countdown timer updates
    const countdownInterval = setInterval(() => {
      if (currentRoom && currentRoom.status === 'starting' && currentRoom.startTime !== null) {
        const timeRemaining = Math.max(0, 5 - Math.floor((Date.now() - currentRoom.startTime) / 1000));
        setCountdown(timeRemaining);
        if (timeRemaining === 0) {
          // Countdown finished, duel should transition to in-progress (handled by backend)
        }
      } else {
        setCountdown(0);
      }
      if (currentRoom && currentRoom.status === 'in-progress' && currentRoom.problem && currentRoom.startTime) {
         const timeRemaining = Math.max(0, currentRoom.problem.timeLimit - Math.floor((Date.now() - currentRoom.startTime) / 1000));
         setTimeLeft(timeRemaining);
         if (timeRemaining === 0) {
           // Time's up, duel should end (handled by backend)
         }
      } else {
         setTimeLeft(0);
      }
    }, 1000);

    return () => {
      newSocket.disconnect();
      clearInterval(countdownInterval);
    };
  }, [user, token, language]); // Removed currentRoom dependency to prevent multiple connections

  const handleCreateDuel = () => {
    if (socket && user) {
      socket.emit('createDuel', { userId: user.id, username: user.username });
      setError('');
    } else if (!user) {
       setError('User not authenticated.');
    }
  };

  const handleJoinDuel = () => {
    if (socket && user && roomIdInput) {
      socket.emit('joinDuel', { roomId: roomIdInput, userId: user.id, username: user.username });
      setError('');
      setRoomIdInput(''); // Clear input after joining attempt
    } else if (!user) {
      setError('User not authenticated.');
    } else if (!roomIdInput) {
      setError('Please enter a Room ID to join.');
    }
  };

  const handleLanguageChange = (event: any) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    if (currentRoom?.problem) {
        setCode(getDefaultCode(newLanguage));
    }
  };

  const handleSubmitCode = () => {
    if (socket && user && currentRoom && currentRoom.status === 'in-progress') {
       setSubmitting(true);
      socket.emit('submitCode', {
        roomId: currentRoom.id,
        userId: user.id,
        code,
        language,
      });
    } else if (currentRoom?.status !== 'in-progress') {
       setError('Cannot submit code when duel is not in progress.');
    } else if (!user) {
       setError('User not authenticated.');
    } else if (!socket) {
       setError('Socket not connected.');
    } else if (!currentRoom) {
       setError('Not in a duel room.');
    }
  };

  const handleReadyClick = () => {
     if (socket && user && currentRoom && currentRoom.status === 'waiting') {
        socket.emit('playerReady', { roomId: currentRoom.id, userId: user.id });
     } else if (currentRoom?.status !== 'waiting') {
        setError('Cannot set ready state when duel is not waiting.');
     } else if (!user) {
        setError('User not authenticated.');
     } else if (!socket) {
        setError('Socket not connected.');
     } else if (!currentRoom) {
        setError('Not in a duel room.');
     }
  };

  const copyRoomId = () => {
    if (currentRoom?.id) {
      navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  if (!user) {
      return <Alert severity="error">Please log in to participate in duels.</Alert>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Code Duels
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Room ID Display */}
          {showRoomId && currentRoom && (
            <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(25, 118, 210, 0.1)' }}>
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                <strong>Duel Room Created!</strong> Share this Room ID with your opponent:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ 
                  color: '#4caf50', 
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #4caf50'
                }}>
                  {currentRoom.id}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={copyRoomId}
                  sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Box>
              <Typography variant="body2" sx={{ color: 'lightgray', mt: 1 }}>
                {copied ? 'Room ID copied successfully!' : 'Waiting for opponent to join...'}
              </Typography>
            </Alert>
          )}

          {!currentRoom ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>Start or Join a Duel</Typography>
              <Button variant="contained" color="primary" onClick={handleCreateDuel} disabled={!socket} fullWidth sx={{ mb: 2 }}>
                Create New Duel
              </Button>
              <Typography align="center" sx={{ mb: 2, color: 'white' }}>- OR -</Typography>
              <TextField
                label="Enter Room ID"
                value={roomIdInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomIdInput(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                InputLabelProps={{ style: { color: 'white' } }}
                inputProps={{ style: { color: 'white' } }}
              />
              <Button variant="contained" color="secondary" onClick={handleJoinDuel} disabled={!socket || !roomIdInput} fullWidth>
                Join Duel
              </Button>
            </Box>
          ) : (
            // Display room info and duel UI
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>Duel Room: {currentRoom.id}</Typography>
              <Typography sx={{ color: 'white' }}>Status: {currentRoom.status}</Typography>
              <Typography sx={{ color: 'white' }}>Players:</Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, mb: 2 }}>
                 {currentRoom.players.map(player => (
                  <Box component="li" key={player.socketId} sx={{ mb: 1, color: 'white' }}>
                    {player.username} ({player.isReady ? 'Ready' : 'Not Ready'})
                  </Box>
                 ))}
              </Box>

              {currentRoom.status === 'waiting' && (currentRoom.players.some(p => p.userId === user?.id && p.isReady) ? (
                 <Typography variant="h6" sx={{ mt: 2, color: 'lightgray' }}>Waiting for opponent to be ready...</Typography>
              ) : (
                 <Button variant="contained" color="success" onClick={handleReadyClick} disabled={!socket || currentRoom.status !== 'waiting'} sx={{ mt: 2 }}>
                    Ready!
                 </Button>
              ))}

              {currentRoom.status === 'starting' && (
                 <Box sx={{ textAlign: 'center', my: 3 }}>
                    <Typography variant="h3" sx={{ animation: 'pulse 1s infinite', color: '#4fc3f7' }}>
                       Starting in {countdown}...
                    </Typography>
                 </Box>
              )}

              {currentRoom.status === 'in-progress' && currentRoom.problem && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ color: 'white' }}>{currentRoom.problem.title}</Typography>
                  <Typography variant="subtitle1" sx={{ color: 'lightgray' }} gutterBottom>
                    Difficulty: {currentRoom.problem.difficulty}
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                     <Typography variant="body1" sx={{ color: 'white' }}>{currentRoom.problem.description}</Typography>
                  </Paper>

                   {/* Timer */}
                  <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>Time Left: {timeLeft} seconds</Typography>

                  {currentRoom?.problem && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: 'white' }}>Accepted Languages:</Typography>
                      {currentRoom.problem.acceptedLanguages && currentRoom.problem.acceptedLanguages.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          {currentRoom.problem.acceptedLanguages.map(lang => (
                            <span key={lang} style={{
                              background: '#e0e0e0',
                              borderRadius: '8px',
                              padding: '2px 10px',
                              fontSize: '0.95em',
                              marginRight: '6px',
                              marginBottom: '4px',
                              display: 'inline-block'
                            }}>{lang.toUpperCase()}</span>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Grid container spacing={3}>
                     <Grid item xs={12} md={8}>
                       <Paper elevation={2} sx={{ height: '400px' }}>
                          <Editor
                            height="100%"
                            language={language}
                            value={code}
                            onChange={(value?: string) => setCode(value || '')}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              readOnly: timeLeft === 0 // Disable editor when time is up
                            }}
                          />
                       </Paper>
                     </Grid>
                     <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ p: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                           <FormControl fullWidth sx={{ mb: 2 }}>
                             <InputLabel sx={{ color: 'white' }}>Language</InputLabel>
                             <Select
                               value={language}
                               label="Language"
                               onChange={handleLanguageChange}
                               sx={{ color: 'white' }}
                             >
                               {currentRoom?.problem?.acceptedLanguages && currentRoom.problem.acceptedLanguages.map(lang => {
                                 let label = lang;
                                 if (lang === 'cpp') label = 'C++';
                                 else if (lang === 'c') label = 'C';
                                 else if (lang === 'java') label = 'Java';
                                 else if (lang === 'python') label = 'Python';
                                 else label = lang.charAt(0).toUpperCase() + lang.slice(1);
                                 return <MenuItem key={lang} value={lang}>{label}</MenuItem>;
                               })}
                             </Select>
                           </FormControl>
                           
                           <Button
                              variant="contained"
                              color="primary"
                              fullWidth
                              onClick={handleSubmitCode}
                              disabled={!socket || submitting || currentRoom.status !== 'in-progress' || timeLeft === 0}
                           >
                             {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Code'}
                           </Button>

                           {/* Submission Results */}
                           {submissionResult && ( 
                              <Box sx={{ mt: 2 }}>
                                 <Typography variant="h6" sx={{ color: 'white' }}>Last Submission Result:</Typography>
                                 <Alert severity={submissionResult.passedAll ? 'success' : 'error'} sx={{ mb: 1 }}>
                                    {submissionResult.passedAll ? 'All tests passed!' : 'Some tests failed.'}
                                 </Alert>
                                 
                                 {submissionResult.testResults && (
                                    <Box sx={{ mt: 1 }}>
                                       <Typography variant="subtitle2" sx={{ color: 'white' }}>Test Case Results:</Typography>
                                       {submissionResult.testResults.map((result: any, index: number) => (
                                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                             <Typography variant="body2" sx={{ mr: 1, color: 'white' }}>Test {index + 1}:</Typography>
                                             <Alert severity={result.passed ? 'success' : 'error'} sx={{ py: 0, px: 1, flexGrow: 1 }}>
                                                {result.passed ? 'Passed' : `Failed: ${result.error || 'Incorrect output'}`}
                                             </Alert>
                                          </Box>
                                       ))}
                                    </Box>
                                 )}
                              </Box>
                           )}

                           {/* Opponent Status */}
                            <Box sx={{ mt: 2 }}>
                               <Typography variant="h6" sx={{ color: 'white' }}>Opponent Status:</Typography>
                               {currentRoom.players.find(p => p.userId !== user?.id)?.submission ? (
                                  <Alert severity="info">Opponent has submitted a solution.</Alert>
                               ) : (
                                  <Alert severity="warning">Opponent is still working...</Alert>
                               )}
                            </Box>
                        </Paper>
                     </Grid>
                  </Grid>
                </Box>
              )}

              {currentRoom.status === 'completed' && (
                 <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                       Duel Ended!
                    </Typography>
                    {currentRoom.winnerId === user?.id ? (
                       <Typography variant="h6" color="success.main">You Won!</Typography>
                    ) : currentRoom.winnerId ? (
                       <Typography variant="h6" color="error.main">{currentRoom.players.find(p => p.userId === currentRoom.winnerId)?.username} Won!</Typography>
                    ) : (
                        <Typography variant="h6" sx={{ color: 'white' }}>It's a Draw!</Typography>
                    )}
                 </Box>
              )}

            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default DuelRoom; 