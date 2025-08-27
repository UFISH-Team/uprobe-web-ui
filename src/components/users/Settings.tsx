import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Card, 
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  useTheme
} from '@mui/material';
import {
  Notifications,
  Language,
  Palette
} from '@mui/icons-material';

const Settings: React.FC = () => {
  const theme = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    language: 'en',
    timezone: 'UTC',
    theme: 'light'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: 'Settings saved successfully!',
    severity: 'success' as 'success' | 'error'
  });

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

  const handleSelectChange = (setting: keyof typeof settings) => (
    event: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.value
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

      {/* Appearance Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Palette color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Appearance
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Theme</InputLabel>
                <Select
                  value={settings.theme}
                  onChange={handleSelectChange('theme')}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto (System)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Language & Region Settings */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Language color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Language & Region
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={settings.language}
                  onChange={handleSelectChange('language')}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  onChange={handleSelectChange('timezone')}
                  label="Timezone"
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  <MenuItem value="Europe/London">London Time</MenuItem>
                  <MenuItem value="Asia/Shanghai">Shanghai Time</MenuItem>
                </Select>
              </FormControl>
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
