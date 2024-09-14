import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/home'); // Redirect to home page
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        bgcolor: '#f0f0f0',
        padding: 2,
      }}
    >
      <Typography variant="h1" component="div" sx={{ fontWeight: 'bold', mb: 2 }}>
        404
      </Typography>
      <Typography variant="h5" component="div" sx={{ mb: 2 }}>
        Oops! The page you're looking for doesn't exist.
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        It looks like you might have followed a broken link or mistyped the URL.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleGoHome}>
        Go to Homepage
      </Button>
    </Box>
  );
};

export default NotFound;
