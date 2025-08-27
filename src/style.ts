import { styled } from '@mui/system';
import { Box, Button, Card } from '@mui/material';

// Modern Container with clean minimal styling
export const Container = styled(Box)(({ theme }) => ({
  padding: '24px',
  maxWidth: '1400px',
  margin: '0 auto',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  border: '1px solid rgba(226, 232, 240, 0.6)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  
  [theme.breakpoints.down('md')]: {
    padding: '20px',
    borderRadius: '10px',
  },
  
  [theme.breakpoints.down('sm')]: {
    padding: '16px',
    borderRadius: '8px',
    margin: '0 8px',
  },
}));

// Section with clean spacing
export const Section = styled(Box)(({ theme }) => ({
  marginBottom: '32px',
  
  [theme.breakpoints.down('md')]: {
    marginBottom: '24px',
  },
  
  [theme.breakpoints.down('sm')]: {
    marginBottom: '20px',
  },
}));

// Clean Gradient Button
export const GradientButton = styled(Button)(() => ({
  background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '0.875rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: '40px',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Clean Card with subtle glass effect
export const GlassCard = styled(Card)(() => ({
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(226, 232, 240, 0.6)',
  borderRadius: '12px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    transform: 'translateY(-1px)',
    backgroundColor: '#ffffff',
    border: '1px solid rgba(37, 99, 235, 0.15)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
}));

// Status indicator component
export const StatusIndicator = styled(Box)<{ status: 'success' | 'warning' | 'error' | 'info' }>(
  ({ status }) => {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    };
    
    return {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      backgroundColor: colors[status],
      position: 'relative',
      
      '&::after': {
        content: '""',
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        backgroundColor: colors[status],
        animation: 'pulse 2s infinite',
        opacity: 0.6,
      },
    };
  }
);

// Clean progress bar
export const ProgressBar = styled(Box)<{ progress: number }>(({ progress }) => ({
  width: '100%',
  height: '6px',
  backgroundColor: 'rgba(226, 232, 240, 0.4)',
  borderRadius: '3px',
  overflow: 'hidden',
  position: 'relative',
  
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${progress}%`,
    backgroundColor: '#2563eb',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
}));
