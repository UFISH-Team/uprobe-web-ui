import React from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <FormControlLabel control={<Switch />} label="Enable Notifications" />
      <FormControlLabel control={<Switch />} label="Enable Dark Mode" />
    </Box>
  );
};

export default Settings;
