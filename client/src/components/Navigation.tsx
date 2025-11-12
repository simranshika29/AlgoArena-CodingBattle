import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/image/algo.png';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/') }>
            <img src={logo} alt="AlgoArena Logo" style={{ height: 40, marginRight: 12, filter: 'drop-shadow(0 0 8px #00bfff)' }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              AlgoArena
            </Typography>
          </Box>
          <Box>
            {isAuthenticated ? (
              <>
                <Typography
                  component="span"
                  sx={{ mr: 2 }}
                >
                  Welcome, {user?.username}
                </Typography>
                <Button color="inherit" onClick={() => navigate('/problems')}>
                  Problems
                </Button>
                <Button color="inherit" onClick={() => navigate('/submit-problem')}>
                  Submit Problem
                </Button>
                <Button color="inherit" onClick={() => navigate('/duel')}>
                  Duels
                </Button>
                <Button color="inherit" onClick={() => navigate('/duel-lobby')}>
                  Duel Lobby
                </Button>
                <Button color="inherit" onClick={() => navigate('/portfolio')}>
                  Portfolio
                </Button>
                {user?.isAdmin && (
                  <Button color="inherit" onClick={() => navigate('/admin/review')}>
                    Admin Review
                  </Button>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button color="inherit" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation; 