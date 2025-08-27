import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { ExitToApp, Warning } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    
    try {
      await logout();
      
      // Small delay for better UX
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed, but will still redirect to login page.');
      
      // Even if API call fails, still redirect
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 2000);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    navigate(-1); // Go back to previous page
  };

  // Auto-logout if user doesn't interact within 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open && !isLoggingOut) {
        handleConfirmLogout();
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [open, isLoggingOut]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ExitToApp color="warning" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Sign Out Confirmation
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {isLoggingOut ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 3,
            gap: 2 
          }}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
              Signing you out securely...
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}>
              Please wait while we clean up your session and secure your data.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning color="warning" />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Are you sure you want to sign out?
              </Typography>
            </Box>
            
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
              You will be redirected to the login page and will need to sign in again to access your account.
            </Typography>
            
            <Typography variant="caption" sx={{ 
              color: theme.palette.text.secondary, 
              display: 'block', 
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              This dialog will automatically sign you out in 30 seconds if no action is taken.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      {!isLoggingOut && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancel}
            variant="outlined"
            disabled={isLoggingOut}
          >
            Stay Signed In
          </Button>
          <Button 
            onClick={handleConfirmLogout}
            variant="contained"
            color="warning"
            disabled={isLoggingOut}
            startIcon={<ExitToApp />}
          >
            Sign Out
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default Logout;
