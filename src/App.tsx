// App.tsx
import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'; // Import Router components

import Home from './pages/Home';
import Design from './pages/Design';
import Genome from './pages/Genome';
import JobsPanel from './pages/JobsPanel';
import Tutorial from './pages/Tutorial';

import AccountMenu from './pages/AccountMenu';
import Profile from './components/users/Profile';
import MyAccount from './components/users/MyAccount';
import AddAccount from './components/users/AddAccount';
import Settings from './components/users/Settings';
import Logout from './components/users/Logout';
import CustomProbe from './components/designs/CustomProbe';
import DesignWorkflow from './components/designs/DesignWorkflow';
import NotFound from './components/common/NotFound';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DesignIcon from '@mui/icons-material/Pinch';
import GenomeIcon from '@mui/icons-material/Dataset';
import TaskIcon from '@mui/icons-material/List';
import TutorialIcon from '@mui/icons-material/HelpOutline';


const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // 取消所有按钮的大写转换
        },
      },
    },
  },
});

const App: React.FC = () => {
  const navigate = useNavigate(); // Hook to programmatically navigate

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ width: '100%', margin: '0 auto' }}>
          <Toolbar>
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/home')}
            >
              U-Probe
            </Button>
            
            <Box sx={{ flexGrow: 1 }} />

            <Button
              color="inherit"
              startIcon={<DesignIcon />}
              onClick={() => navigate('/design')}
            >
              Design
            </Button>

            <Button
              color="inherit"
              startIcon={<GenomeIcon />}
              onClick={() => navigate('/genome')}
            >
              Genome
            </Button>

            <Button
              color="inherit"
              startIcon={<TaskIcon />}
              onClick={() => navigate('/task')}
            >
              Task
            </Button>

            <Button
              color="inherit"
              startIcon={<TutorialIcon />}
              onClick={() => navigate('/tutorial')}
            >
              Tutorial
            </Button>

            <AccountMenu />
          </Toolbar>
        </AppBar>
      </Box>

      <div className="pageContent">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/design" element={<Design />} />
          <Route path="/genome" element={<Genome />} />
          <Route path="/task" element={<JobsPanel />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/myaccount" element={<MyAccount />} />
          <Route path="/addaccount" element={<AddAccount />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/customprobe" element={<CustomProbe />} />
          <Route path="/designworkflow" element={<DesignWorkflow />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
};

const MainApp = () => (
  <Router>
    <App />
  </Router>
);

export default MainApp;