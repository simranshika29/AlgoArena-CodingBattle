import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import config from '../config';

interface DuelRoom {
  id: string;
  host: {
    userId: string;
    username: string;
  };
  guest?: {
    userId: string;
    username: string;
  };
  status: 'waiting' | 'ready' | 'starting' | 'in-progress' | 'completed';
  problem?: {
    title: string;
    difficulty: string;
    description: string;
    timeLimit: number;
    acceptedLanguages: string[];
  };
  players: {
    userId: string;
    socketId: string;
    username: string;
    isReady: boolean;
    submission?: any;
  }[];
  startTime?: number;
  winnerId?: string;
}

const DuelLobby: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [rooms, setRooms] = useState<DuelRoom[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const newSocket = io(config.socketUrl, {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setSocket(newSocket);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to server. Please check your connection.');
    });

    newSocket.on('roomList', (roomList: DuelRoom[]) => {
      setRooms(roomList);
    });

    newSocket.on('duelCreated', (room: DuelRoom) => {
      navigate(`/duel/${room.id}`);
    });

    newSocket.on('duelJoined', (room: DuelRoom) => {
      navigate(`/duel/${room.id}`);
    });

    newSocket.on('joinError', (data: { message: string }) => {
      setError(data.message);
    });

    newSocket.on('duelError', (data: { message: string }) => {
      setError(data.message);
    });

    // Request room list
    newSocket.emit('getRoomList');

    return () => {
      newSocket.close();
    };
  }, [user, token, navigate]);

  const createDuel = () => {
    if (socket && user) {
      socket.emit('createDuel', {
        userId: user.id,
        username: user.username
      });
    }
  };

  const joinDuel = (roomId: string) => {
    if (socket && user) {
      socket.emit('joinDuel', {
        roomId,
        userId: user.id,
        username: user.username
      });
    }
  };

  if (!user) {
    return <Alert severity="error">You must be logged in to access duels.</Alert>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
          Duel Lobby
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={createDuel}
            disabled={!socket}
            sx={{ mr: 2 }}
          >
            Create New Duel
          </Button>
        </Box>

        <Paper elevation={2} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" sx={{ p: 2, color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            Available Rooms ({rooms.length})
          </Typography>
          <List>
            {rooms.length === 0 ? (
              <ListItem>
                <ListItemText 
                  primary="No rooms available" 
                  sx={{ color: 'lightgray', textAlign: 'center' }}
                />
              </ListItem>
            ) : (
              rooms.map((room) => (
                <ListItem
                  key={room.id}
                  divider
                  sx={{ 
                    '& .MuiListItemText-primary': { color: 'white' },
                    '& .MuiListItemText-secondary': { color: 'lightgray' }
                  }}
                >
                  <ListItemText
                    primary={`Room ${room.id.slice(0, 8)}...`}
                    secondary={`Host: ${room.host.username} | Status: ${room.status}`}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => joinDuel(room.id)}
                    disabled={room.status !== 'waiting'}
                  >
                    Join
                  </Button>
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default DuelLobby; 