import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const MyAccount: React.FC = () => {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Account Settings</Typography>
      <TextField label="Change Password" type="password" fullWidth sx={{ mb: 2 }} />
      <Button variant="contained" color="primary">Update Password</Button>
    </Box>
  );
};

export default MyAccount;
