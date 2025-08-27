import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Grid, 
  Button, 
  TextField, 
  Card,
  CardContent,
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Alert,
  Snackbar,
  useTheme,
  Divider
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Person,
  Email,
  Work,
  LocationOn,
  Phone
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../api';

const Profile: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, updateUser } = useAuth();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [avatarDialog, setAvatarDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [profileData, setProfileData] = useState({
    name: user?.full_name || user?.username || 'Unknown User',
    email: user?.email || 'No email set',
    title: 'Researcher',
    department: 'Research & Development',
    location: 'Not set',
    phone: 'Not set',
    bio: 'Researcher specializing in probe design and bioinformatics analysis.',
    avatar: null as string | null,
  });
  const [tempProfileData, setTempProfileData] = useState({ ...profileData });

  // Sync user data to local state when updated
  React.useEffect(() => {
    if (user) {
      const updatedData = {
        name: user.full_name || user.username || 'Unknown User',
        email: user.email || 'No email set',
        title: 'Researcher',
        department: 'Research & Development',
        location: 'Not set',
        phone: 'Not set',
        bio: 'Researcher specializing in probe design and bioinformatics analysis.',
        avatar: null as string | null,
      };
      setProfileData(updatedData);
      setTempProfileData(updatedData);
    }
  }, [user]);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
    setTempProfileData({ ...profileData });
  };

  const handleSaveClick = async () => {
    try {
      // Call API to update user profile
      const updatedUser = await ApiService.updateUserProfile({
        full_name: tempProfileData.name,
        email: tempProfileData.email
      });
      
      // Update local state
      setProfileData({ ...tempProfileData });
      
      // Update user info in auth context
      updateUser({
        full_name: updatedUser.full_name,
        email: updatedUser.email
      });
      
      setIsEditMode(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSnackbar({ open: true, message: 'Failed to update profile. Please try again.', severity: 'error' });
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setTempProfileData({
      ...tempProfileData,
      [name]: value,
    });
  };

  const handleAvatarUpload = () => {
    setAvatarDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newAvatar = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, avatar: newAvatar }));
      setTempProfileData(prev => ({ ...prev, avatar: newAvatar }));
      setAvatarDialog(false);
      setSnackbar({ open: true, message: 'Avatar updated successfully!', severity: 'success' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Profile
        </Typography>
        <Box>
          {!isEditMode ? (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEditClick}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveClick}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Avatar and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100,
                    mx: 'auto',
                    background: profileData.avatar 
                      ? 'transparent' 
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    fontSize: '1.8rem',
                    fontWeight: 600
                  }}
                  src={profileData.avatar || undefined}
                >
                  {!profileData.avatar && profileData.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    }
                  }}
                  onClick={handleAvatarUpload}
                >
                  <PhotoCamera />
                </IconButton>
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {profileData.name}
              </Typography>
              
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {profileData.title}
              </Typography>
              
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {profileData.department}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Detailed Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              {isEditMode ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={tempProfileData.name}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={tempProfileData.email}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      name="title"
                      value={tempProfileData.title}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <Work sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      name="department"
                      value={tempProfileData.department}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={tempProfileData.phone}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      name="location"
                      value={tempProfileData.location}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      multiline
                      rows={3}
                      value={tempProfileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Email sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body1">{profileData.email}</Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Phone sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">Phone:</Typography>
                      <Typography variant="body1">{profileData.phone}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <LocationOn sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">Location:</Typography>
                      <Typography variant="body1">{profileData.location}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Bio
                    </Typography>
                    <Typography variant="body1">
                      {profileData.bio}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialog} onClose={() => setAvatarDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCamera />
            Update Profile Picture
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                mb: 3,
                background: profileData.avatar 
                  ? 'transparent' 
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100())`,
              }}
              src={profileData.avatar || undefined}
            >
              {!profileData.avatar && profileData.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              Choose New Photo
            </Button>
            
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Upload a clear photo of yourself. JPG, PNG files up to 5MB.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
