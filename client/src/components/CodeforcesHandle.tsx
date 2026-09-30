import React, { useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import api, { getErrorMessage } from '../api/client';
import { User } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

/** Links a Codeforces handle (verified against the Codeforces API) so solves can be checked. */
const CodeforcesHandle: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [handle, setHandle] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (value: string) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.put<{ user: User }>('/users/me/codeforces', { handle: value });
      updateUser(data.user);
      setEditing(false);
      setHandle('');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save your Codeforces handle.'));
    } finally {
      setBusy(false);
    }
  };

  const linked = user?.codeforcesHandle;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Link your handle to check which Codeforces problems in your sets you've solved, using your public
        submissions from the Codeforces API.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      {linked && !editing ? (
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Link href={`https://codeforces.com/profile/${linked}`} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
            {linked}
          </Link>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => setEditing(true)}>
              Change
            </Button>
            <Button size="small" color="inherit" onClick={() => save('')} disabled={busy}>
              Unlink
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (handle.trim()) save(handle.trim());
          }}
          sx={{ display: 'flex', gap: 1 }}
        >
          <TextField
            size="small"
            placeholder="Codeforces handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            inputProps={{ 'aria-label': 'Codeforces handle', maxLength: 24 }}
            sx={{ flexGrow: 1 }}
          />
          <Button type="submit" variant="outlined" disabled={busy || !handle.trim()}>
            {busy ? 'Checking…' : 'Link'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CodeforcesHandle;
