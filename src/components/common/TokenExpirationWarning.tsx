import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  Alert,
  useTheme
} from '@mui/material';
import { Warning, AccessTime } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { isTokenExpiringSoon, getTokenRemainingTime, formatRemainingTime } from '../../utils';

const TokenExpirationWarning: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, logout, checkAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      const remaining = getTokenRemainingTime();
      setRemainingTime(remaining);

      if (isTokenExpiringSoon() && remaining > 0) {
        setOpen(true);
      } else if (remaining <= 0) {
        // Token expired, auto logout
        logout();
      }
    };

    // 初始检查
    checkTokenExpiration();

    // 每30秒检查一次
    const interval = setInterval(checkTokenExpiration, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  const handleExtendSession = async () => {
    try {
      await checkAuth(); // 重新验证token
      setOpen(false);
    } catch (error) {
      console.error('Session extension failed:', error);
      await logout();
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  const progressValue = remainingTime > 0 ? Math.max(0, Math.min(100, (remainingTime / (20 * 60 * 1000)) * 100)) : 0;

  if (!open || !isAuthenticated) return null;

  return (
    <Dialog
      open={open}
      onClose={() => {}} // 防止点击外部关闭
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: theme.palette.warning.main, fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Session Expiring Soon
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your session will expire in <strong>{formatRemainingTime(remainingTime)}</strong>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTime sx={{ color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Remaining Time
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: progressValue > 50 
                  ? theme.palette.success.main 
                  : progressValue > 25 
                    ? theme.palette.warning.main 
                    : theme.palette.error.main
              }
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          To protect your account security, please choose to continue the session or logout safely.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleLogout}
          variant="outlined"
          sx={{
            borderColor: theme.palette.error.main,
            color: theme.palette.error.main,
            '&:hover': {
              borderColor: theme.palette.error.dark,
              backgroundColor: `${theme.palette.error.main}08`
            }
          }}
        >
          Logout Now
        </Button>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
            }
          }}
        >
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenExpirationWarning;
