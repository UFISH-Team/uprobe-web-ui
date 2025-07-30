import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a base theme with modern gradient colors
let theme = createTheme({
  palette: {
    primary: {
      main: '#1565c0', // 深蓝色，代表专业性和可靠性
      light: '#5e92f3',
      dark: '#003c8f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00838f', // 青色，代表科技感
      light: '#4fb3bf',
      dark: '#005662',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',  // 更纯净的背景色
      paper: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12, // 更现代的圆角
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0px 4px 12px -2px rgba(0,0,0,0.1), 0px 8px 16px -4px rgba(0,0,0,0.07)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            boxShadow: '0px 6px 20px -4px rgba(37, 99, 235, 0.3), 0px 12px 24px -8px rgba(37, 99, 235, 0.2)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            background: 'rgba(37, 99, 235, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 4px 12px -2px rgba(0, 0, 0, 0.08), 0px 12px 24px -4px rgba(0, 0, 0, 0.08)',
            borderColor: 'rgba(37, 99, 235, 0.2)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderColor: 'rgba(224, 224, 224, 1)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f7fa',
          color: '#1a2027',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0891b2 100%)',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 4px 12px -4px rgba(37, 99, 235, 0.3)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            padding: '8px 12px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          height: 32,
          '& .MuiChip-label': {
            px: 2,
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '24px',
          paddingRight: '24px',
          '@media (min-width:960px)': {
            paddingLeft: '32px',
            paddingRight: '32px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 1px 2px rgba(0, 0, 0, 0.1)',
        },
        elevation4: {
          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

// Apply responsive font sizes
theme = responsiveFontSizes(theme);

export default theme;
