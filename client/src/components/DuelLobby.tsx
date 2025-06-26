import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
} from '@mui/material';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import config from '../config';

interface DuelRoom {
  id: string;
  players: { userId: string; socketId: string; username: string; isReady: boolean; }[];
  status: 'waiting' | 'starting' | 'in-progress' | 'completed';
}

const DuelLobby: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<DuelRoom[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      setError('Authentication required to view the duel lobby.');
      return;
    }

    const newSocket = io(config.socketUrl, {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server with socket ID:', newSocket.id);
      setError('');
      // Request room list after connection
      newSocket.emit('getRoomList');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      setError('Connection lost. Please refresh the page.');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to server. Please check your connection.');
    });

    newSocket.on('roomList', (roomList: DuelRoom[]) => {
      console.log('Received room list:', roomList);
      setRooms(roomList);
    });

    newSocket.on('duelCreated', (room: DuelRoom) => {
      console.log('Duel created successfully:', room);
      // Navigate to the duel room with the room ID
      navigate(`/duel?roomId=${room.id}`);
    });

    newSocket.on('joinError', (data: { message: string }) => {
      console.error('Join error:', data.message);
      setError(data.message);
    });

    newSocket.on('duelError', (data: { message: string }) => {
      console.error('Duel creation error:', data.message);
      setError(data.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, token, navigate]);

  const handleJoinRoom = (roomId: string) => {
    if (socket && user) {
      socket.emit('joinDuel', { roomId, userId: user.id, username: user.username });
      navigate(`/duel?roomId=${roomId}`); // Navigate to the duel room
    } else if (!user) {
      setError('User not authenticated.');
    }
  };

  const handleCreateDuel = () => {
    console.log('handleCreateDuel called');
    console.log('Socket:', socket);
    console.log('User:', user);
    
    if (socket && user) {
      console.log('Emitting createDuel event with data:', { userId: user.id, username: user.username });
      socket.emit('createDuel', { userId: user.id, username: user.username });
      // Don't navigate immediately - wait for duelCreated event
    } else if (!user) {
      console.error('User not authenticated');
      setError('User not authenticated.');
    } else if (!socket) {
      console.error('Socket not connected');
      setError('Socket not connected.');
    }
  };

  if (!user) {
    return <Alert severity="error">Please log in to view the duel lobby.</Alert>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
            Duel Lobby
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateDuel}
              sx={{ mb: 2 }}
            >
              Create New Duel
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
            Available Rooms
          </Typography>
          <List>
            {rooms.length === 0 ? (
              <ListItem>
                <ListItemText primary="No duel rooms available." sx={{ color: 'white' }} />
              </ListItem>
            ) : (
              rooms.map((room) => (
                <React.Fragment key={room.id}>
                  <ListItem>
                    <ListItemText
                      primary={`Room: ${room.id}`}
                      secondary={`Players: ${room.players.length}/2, Status: ${room.status}`}
                      sx={{ color: 'white' }}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={room.players.length >= 2 || room.status !== 'waiting'}
                      >
                        Join
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>
      </Box>
    </Container>
  );
};

export default DuelLobby; 