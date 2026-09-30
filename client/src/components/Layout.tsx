import React, { useState } from 'react';
import { Link as RouterLink, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';
import logoMark from '../assets/logo-mark.png';

const MAIN_LINKS = [
  { to: '/problems', label: 'Problems' },
  { to: '/practice', label: 'Practice' },
  { to: '/arena', label: 'Arena' },
  { to: '/leaderboard', label: 'Leaderboard' },
];

const Brand: React.FC = () => (
  <Box
    component={RouterLink}
    to="/"
    sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.primary', textDecoration: 'none', mr: 3 }}
  >
    <Box component="img" src={logoMark} alt="" sx={{ width: 30, height: 30, borderRadius: 1 }} />
    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>AlgoArena</Typography>
  </Box>
);

const navLinkSx = {
  color: 'text.secondary',
  px: 1.5,
  '&.active': { color: 'text.primary', bgcolor: colors.surfaceRaised },
  '&:hover': { color: 'text.primary' },
};

const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // The problem workspace uses the full viewport width and height.
  const fullBleed = /^\/(problems\/[^/]+|arena\/[^/]+)$/.test(location.pathname);

  const accountLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> },
    { to: `/u/${user?.username}`, label: 'Profile', icon: <PersonOutlineIcon fontSize="small" /> },
    { to: '/contribute', label: 'Contribute a problem', icon: <AddBoxOutlinedIcon fontSize="small" /> },
    ...(user?.isAdmin
      ? [{ to: '/admin/review', label: 'Review queue', icon: <FactCheckOutlinedIcon fontSize="small" /> }]
      : []),
  ];

  const handleLogout = () => {
    setMenuAnchor(null);
    setDrawerOpen(false);
    logout();
    navigate('/');
  };

  const go = (to: string) => {
    setMenuAnchor(null);
    setDrawerOpen(false);
    navigate(to);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="transparent"
        sx={{ bgcolor: 'rgba(10, 15, 23, 0.85)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${colors.border}` }}
      >
        <Container maxWidth={fullBleed ? false : 'lg'}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 60 } }}>
            <Brand />
            <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexGrow: 1 }}>
              {MAIN_LINKS.map((link) => (
                <Button key={link.to} component={NavLink} to={link.to} sx={navLinkSx}>
                  {link.label}
                </Button>
              ))}
            </Box>
            <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              {isAuthenticated ? (
                <>
                  <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Account menu" size="small">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: colors.surfaceRaised, color: 'primary.main', fontSize: 14, fontWeight: 700, border: `1px solid ${colors.border}` }}>
                      {user?.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { minWidth: 220, mt: 1 } } }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{user?.username}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {user?.email}
                      </Typography>
                    </Box>
                    <Divider />
                    {accountLinks.map((link) => (
                      <MenuItem key={link.to} onClick={() => go(link.to)}>
                        <ListItemIcon>{link.icon}</ListItemIcon>
                        {link.label}
                      </MenuItem>
                    ))}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      Log out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button component={RouterLink} to="/login" color="inherit">
                    Log in
                  </Button>
                  <Button component={RouterLink} to="/register" variant="contained">
                    Sign up
                  </Button>
                </>
              )}
            </Box>

            <IconButton
              sx={{ display: { md: 'none' } }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              edge="end"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280, bgcolor: colors.surface } }}
      >
        <Box sx={{ p: 2 }}>
          {isAuthenticated ? (
            <>
              <Typography sx={{ fontWeight: 700 }}>{user?.username}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontWeight: 700 }}>AlgoArena</Typography>
          )}
        </Box>
        <Divider />
        <List>
          {MAIN_LINKS.map((link) => (
            <ListItemButton key={link.to} selected={location.pathname.startsWith(link.to)} onClick={() => go(link.to)}>
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List>
          {isAuthenticated ? (
            <>
              {accountLinks.map((link) => (
                <ListItemButton key={link.to} onClick={() => go(link.to)}>
                  <ListItemIcon>{link.icon}</ListItemIcon>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              ))}
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Log out" />
              </ListItemButton>
            </>
          ) : (
            <Box sx={{ px: 2, display: 'grid', gap: 1 }}>
              <Button variant="contained" onClick={() => go('/register')}>
                Sign up
              </Button>
              <Button variant="outlined" onClick={() => go('/login')}>
                Log in
              </Button>
            </Box>
          )}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>

      {!fullBleed && (
        <Box component="footer" sx={{ borderTop: `1px solid ${colors.border}`, py: 3, mt: 6 }}>
          <Container maxWidth="lg" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              AlgoArena · practice DSA, then prove it in a duel.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Built with React, Express, MongoDB and Socket.io
            </Typography>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default Layout;
