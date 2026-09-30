import React from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export const LoadingState: React.FC<{ label?: string; minHeight?: number | string }> = ({
  label = 'Loading…',
  minHeight = 240,
}) => (
  <Box role="status" sx={{ minHeight, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
    <Box>
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
        {label}
      </Typography>
    </Box>
  </Box>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <Box role="alert" sx={{ py: 6, px: 2, textAlign: 'center' }}>
    <ErrorOutlineIcon color="error" sx={{ fontSize: 36 }} />
    <Typography sx={{ mt: 1, mb: onRetry ? 2 : 0 }}>{message}</Typography>
    {onRetry && (
      <Button variant="outlined" onClick={onRetry}>
        Try again
      </Button>
    )}
  </Box>
);

export const EmptyState: React.FC<{ title: string; description?: string; action?: React.ReactNode }> = ({
  title,
  description,
  action,
}) => (
  <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
    <InboxOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
    <Typography sx={{ mt: 1, fontWeight: 600 }}>{title}</Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 420, mx: 'auto' }}>
        {description}
      </Typography>
    )}
    {action && <Box sx={{ mt: 2 }}>{action}</Box>}
  </Box>
);
