import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { monoFont } from '../theme';

const NotFound: React.FC = () => (
  <Box sx={{ flexGrow: 1, display: 'grid', placeItems: 'center', textAlign: 'center', px: 2, py: 10 }}>
    <Box>
      <Typography sx={{ fontFamily: monoFont, color: 'primary.main', fontSize: '3rem', fontWeight: 600 }}>404</Typography>
      <Typography variant="h5" sx={{ mt: 1 }}>
        This page doesn't exist
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        The link may be broken, or the page may have moved.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Go home
      </Button>
    </Box>
  </Box>
);

export default NotFound;
