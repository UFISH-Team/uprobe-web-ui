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
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
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
    <List>
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
          >
            <ListItemIcon>
              <Icon color={isActive ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
            U-Probe
          </Typography>

          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Button
                    key={item.text}
                    color="inherit"
                    startIcon={<Icon />}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 1,
                      px: 2,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
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
            '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
          }}
        >
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