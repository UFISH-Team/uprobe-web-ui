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
  CardHeader,
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Tooltip,
  Chip,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress
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
  Phone,
  Language,
  CalendarToday,
  Badge,
  Security,
  Verified
} from '@mui/icons-material';

const Profile: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [avatarDialog, setAvatarDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@uprobe.com',
    role: 'Administrator',
    title: 'Senior Bioinformatics Researcher',
    department: 'Research & Development',
    location: 'San Francisco, CA',
    phone: '+1 (555) 123-4567',
    language: 'English',
    joinDate: '2022-01-15',
    bio: 'Experienced researcher specializing in probe design and bioinformatics analysis. Passionate about advancing genomic research through innovative tools.',
    avatar: null as string | null,
    isVerified: true,
    profileComplete: 85
  });
  const [tempProfileData, setTempProfileData] = useState({ ...profileData });

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
    setTempProfileData({ ...profileData });
  };

  const handleSaveClick = () => {
    setProfileData({ ...tempProfileData });
    setIsEditMode(false);
    setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setTempProfileData({
      ...tempProfileData,
      [name]: value,
    });
  };

  const handleSelectChange = (event: any) => {
    const { name, value } = event.target;
    setTempProfileData({
      ...tempProfileData,
      [name]: value,
    });
  };

  const handleAvatarUpload = () => {
    setAvatarDialog(true);
  };

  const handleAvatarDialogClose = () => {
    setAvatarDialog(false);
    setUploadProgress(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate upload progress
      setIsUploading(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setProfileData(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
          setTempProfileData(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
          setAvatarDialog(false);
          setSnackbar({ open: true, message: 'Avatar updated successfully!', severity: 'success' });
          setUploadProgress(0);
        }
      }, 200);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            👤 My Profile
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Manage your personal information and account settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Profile Completion
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={profileData.profileComplete} 
              sx={{ width: 120, height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              {profileData.profileComplete}%
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Avatar and Basic Info */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120,
                    mx: 'auto',
                    background: profileData.avatar 
                      ? 'transparent' 
                      : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    fontSize: '2rem',
                    fontWeight: 600,
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: theme.shadows[8]
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
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {profileData.name}
                </Typography>
                {profileData.isVerified && (
                  <Verified sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                )}
              </Box>
              
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                {profileData.title}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                <Chip 
                  label={profileData.role}
                  icon={<Badge />}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Email fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={profileData.email}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Phone fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={profileData.phone}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationOn fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={profileData.location}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarToday fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`Joined ${new Date(profileData.joinDate).toLocaleDateString()}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Detailed Information */}
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ borderRadius: 3 }}>
            <CardHeader
              title="Personal Information"
              action={
                !isEditMode ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={handleEditClick}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
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
                )
              }
            />
            <CardContent>
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
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        name="language"
                        value={tempProfileData.language}
                        onChange={handleSelectChange}
                        startAdornment={<Language sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="Chinese">中文</MenuItem>
                        <MenuItem value="Spanish">Español</MenuItem>
                        <MenuItem value="French">Français</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={tempProfileData.role}
                        onChange={handleSelectChange}
                        startAdornment={<Security sx={{ mr: 1, color: 'action.active' }} />}
                      >
                        <MenuItem value="Administrator">Administrator</MenuItem>
                        <MenuItem value="Researcher">Researcher</MenuItem>
                        <MenuItem value="Analyst">Analyst</MenuItem>
                        <MenuItem value="User">User</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      multiline
                      rows={4}
                      value={tempProfileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Full Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {profileData.name}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {profileData.department}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Language
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {profileData.language}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Member Since
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(profileData.joinDate).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
                        Bio
                      </Typography>
                      <Typography variant="body1">
                        {profileData.bio}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Avatar Upload Dialog */}
      <Dialog open={avatarDialog} onClose={handleAvatarDialogClose} maxWidth="sm" fullWidth>
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
            
            {isUploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
            
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
              disabled={isUploading}
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
          <Button onClick={handleAvatarDialogClose} disabled={isUploading}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
