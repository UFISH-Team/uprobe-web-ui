// App.tsx
import React from 'react';
import { AppBar, Toolbar, Button, Box, IconButton, useMediaQuery, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';

import Home from './pages/Home';
import Design from './pages/Design';
import Genome from './pages/Genome';
import Task from './pages/Task';
import Tutorial from './pages/Tutorial';
import Auth from './pages/Auth';

import Layout from './components/common/Layout';
import AccountMenu from './components/users/AccountMenu';
import Profile from './components/users/Profile';
import MyAccount from './components/users/MyAccount';
import AddAccount from './components/users/AddAccount';
import Settings from './components/users/Settings';
import Logout from './components/users/Logout';
import CustomProbe from './pages/CustomProbe';
import DesignWorkflow from './pages/DesignWorkflow';
import NotFound from './components/common/NotFound';

import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DesignIcon from '@mui/icons-material/Pinch';
import GenomeIcon from '@mui/icons-material/Dataset';
import TaskIcon from '@mui/icons-material/List';
import TutorialIcon from '@mui/icons-material/HelpOutline';

import theme from './theme';

// Navigation items configuration
const navItems = [
  { text: 'Home', icon: HomeIcon, path: '/home' },
  { text: 'Design', icon: DesignIcon, path: '/design' },
  { text: 'Genome', icon: GenomeIcon, path: '/genome' },
  { text: 'Task', icon: TaskIcon, path: '/task' },
  { text: 'Tutorial', icon: TutorialIcon, path: '/tutorial' },
];

// Protected Route component
const ProtectedRoute = () => {
  const [isChecking, setIsChecking] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('token');
      const authFlag = localStorage.getItem('isAuthenticated') === 'true';
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      
      // If no token or auth flag, user is not authenticated
      if (!token || !authFlag) {
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      // Check if token has expired
      if (tokenExpiration) {
        const expirationTime = parseInt(tokenExpiration);
        const currentTime = Date.now();
        
        if (currentTime > expirationTime) {
          // Token has expired, clear localStorage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('tokenExpiration');
          setIsAuthenticated(false);
          setIsChecking(false);
          return;
        }
      }

      // Token is valid and not expired
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuthentication();
  }, []);

  if (isChecking) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <List sx={{ p: 2 }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        return (
          <ListItemButton
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile) handleDrawerToggle();
            }}
            selected={isActive}
            sx={{
              borderRadius: 2,
              mb: 1,
              py: 1.5,
              backgroundColor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'white' : 'text.primary',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: isActive ? 'primary.dark' : 'rgba(37, 99, 235, 0.08)',
                transform: 'translateX(4px)',
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon 
                sx={{ 
                  color: isActive ? 'white' : 'primary.main',
                  fontSize: '1.3rem'
                }} 
              />
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem'
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0}>
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 } }}>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>
                U
              </Typography>
            </Box>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 0,
                fontWeight: 700,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.8) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              U-Probe
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Button
                    key={item.text}
                    color="inherit"
                    startIcon={<Icon sx={{ fontSize: '1.1rem' }} />}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      py: 1,
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      textTransform: 'none',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      backdropFilter: isActive ? 'blur(8px)' : 'none',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-1px)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                );
              })}
            </Box>
          )}

          <AccountMenu />
        </Toolbar>
      </AppBar>

      {isMobile && (
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 280, 
              boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '0 20px 20px 0',
              border: 'none',
              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <Typography sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.3rem' }}>
                  U
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                U-Probe
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Probe Design Platform
            </Typography>
          </Box>
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
        }}
      >
        <Routes>
          <Route path="/auth" element={<Auth />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout><Outlet /></Layout>}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="design" element={<Design />}>
                <Route path="customprobe" element={<CustomProbe />} />
                <Route path="designworkflow" element={<DesignWorkflow />} />
              </Route>
              <Route path="genome" element={<Genome />} />
              <Route path="task" element={<Task />} />
              <Route path="tutorial" element={<Tutorial />} />
              <Route path="account/*" element={<AccountMenu />} />
              <Route path="account/profile" element={<Profile />} />
              <Route path="account/my-account" element={<MyAccount />} />
              <Route path="account/add-account" element={<AddAccount />} />
              <Route path="account/settings" element={<Settings />} />
              <Route path="account/logout" element={<Logout />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Box>
    </Box>
  );
}

const MainApp = () => (
  <Router>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </Router>
);

export default MainApp;
