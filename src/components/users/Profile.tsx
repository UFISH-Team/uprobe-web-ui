import React, { useState } from 'react';
import { Box, Typography, Avatar, Grid, Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import UploadIcon from '@mui/icons-material/Upload';

const Profile: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    role: 'Administrator',
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
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setTempProfileData({
      ...tempProfileData,
      [name]: value,
    });
  };

  const handleUploadClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}>
          <Avatar sx={{ width: 100, height: 100 }}>Self</Avatar>
          <Box mt={2}>
            <Tooltip title="Upload new avatar">
              <IconButton color="primary" component="label" onClick={handleUploadClick}>
                <UploadIcon />
                <input hidden accept="image/*" type="file" />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
        <Grid item xs={12} sm={8}>
          {isEditMode ? (
            <Box component="form" noValidate autoComplete="off">
              <TextField
                margin="normal"
                fullWidth
                id="name"
                label="Name"
                name="name"
                value={tempProfileData.name}
                onChange={handleInputChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email"
                name="email"
                value={tempProfileData.email}
                onChange={handleInputChange}
              />
              <TextField
                margin="normal"
                fullWidth
                id="role"
                label="Role"
                name="role"
                value={tempProfileData.role}
                onChange={handleInputChange}
              />
              <Box mt={2}>
                <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSaveClick} sx={{ mr: 2 }}>
                  Save
                </Button>
                <Button variant="outlined" color="secondary" startIcon={<CancelIcon />} onClick={handleCancelClick}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6">Name: {profileData.name}</Typography>
              <Typography variant="body1">Email: {profileData.email}</Typography>
              <Typography variant="body1">Role: {profileData.role}</Typography>
              <Box mt={2}>
                <Button variant="contained" startIcon={<EditIcon />} onClick={handleEditClick}>
                  Edit Profile
                </Button>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Dialog for Uploading Avatar */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Upload New Avatar</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please select an image file to upload as your new avatar.
          </DialogContentText>
          <Button variant="contained" component="label">
            Upload File
            <input hidden accept="image/*" type="file" />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose} color="primary">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
