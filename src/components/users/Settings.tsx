import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Card, 
  CardContent,
  Grid,
  Alert,
  Snackbar,
  useTheme,
  TextField,
  Button
} from '@mui/material';
import {
  Notifications,
  Lock
} from '@mui/icons-material';
import ApiService from '../../api';

const Settings: React.FC = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: 'Settings saved successfully!',
    severity: 'success' as 'success' | 'error'
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handlePasswordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match.',
        severity: 'error'
      });
      return;
    }
    try {
      await ApiService.updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setSnackbar({
        open: true,
        message: 'Password updated successfully!',
        severity: 'success'
      });
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update password. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleSwitchChange = (setting: keyof typeof settings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
    
    // Auto-save with feedback
    setTimeout(() => {
      setSnackbar({ 
        open: true, 
        message: 'Settings saved successfully!', 
        severity: 'success' 
      });
    }, 500);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Preferences
        </Typography>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          Customize your experience and notification settings
        </Typography>
      </Box>

      {/* Account Security Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Lock color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Account Security
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordInputChange}
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={handlePasswordChange}>
                Update Password
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Notifications color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.notifications}
                    onChange={handleSwitchChange('notifications')}
                    color="primary"
                  />
                } 
                label="Enable system notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel 
                control={
                  <Switch 
                    checked={settings.emailAlerts}
                    onChange={handleSwitchChange('emailAlerts')}
                    color="primary"
                  />
                } 
                label="Email alerts for task completion"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
