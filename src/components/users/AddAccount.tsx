import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

const AddAccount: React.FC = () => {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Add New Account</Typography>
      <TextField label="Username" fullWidth sx={{ mb: 2 }} />
      <TextField label="Email" type="email" fullWidth sx={{ mb: 2 }} />
      <TextField label="Password" type="password" fullWidth sx={{ mb: 2 }} />
      <Button variant="contained" color="primary">Add Account</Button>
    </Box>
  );
};

export default AddAccount;
