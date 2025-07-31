import { styled } from '@mui/system';
import { Box, Paper, Button, Card } from '@mui/material';

// Modern Container with better spacing and styling
export const Container = styled(Box)(({ theme }) => ({
  padding: '32px',
  maxWidth: '1400px',
  margin: '0 auto',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  [theme.breakpoints.down('md')]: {
    padding: '24px',
    borderRadius: '12px',
  },
  
  [theme.breakpoints.down('sm')]: {
    padding: '16px',
    borderRadius: '8px',
  },
}));

// Modern Section with improved spacing
export const Section = styled(Box)(({ theme }) => ({
  marginBottom: '48px',
  
  [theme.breakpoints.down('md')]: {
    marginBottom: '32px',
  },
  
  [theme.breakpoints.down('sm')]: {
    marginBottom: '24px',
  },
}));

// Modern Gradient Button
export const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #0e7490 100%)',
    transform: 'translateY(-1px)',
    boxShadow: '0px 6px 20px -4px rgba(37, 99, 235, 0.3), 0px 12px 24px -8px rgba(37, 99, 235, 0.2)',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Modern Card with glass effect
export const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    boxShadow: '0px 4px 12px -2px rgba(0, 0, 0, 0.08), 0px 12px 24px -4px rgba(0, 0, 0, 0.08)',
  },
}));

// Status indicator component
export const StatusIndicator = styled(Box)<{ status: 'success' | 'warning' | 'error' | 'info' }>(
  ({ theme, status }) => {
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

// Modern progress bar
export const ProgressBar = styled(Box)<{ progress: number }>(({ theme, progress }) => ({
  width: '100%',
  height: '8px',
  backgroundColor: 'rgba(226, 232, 240, 0.5)',
  borderRadius: '4px',
  overflow: 'hidden',
  position: 'relative',
  
  '&::after': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${progress}%`,
    background: 'linear-gradient(90deg, #2563eb 0%, #0891b2 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
}));
