import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Home from './pages/Home';
import Design from './pages/Design';
import Genome from './pages/Genome';
import JobsPanel from './pages/Task';
import Tutorial from './pages/Tutorial';
import Profile from './components/users/Profile'; 
import MyAccount from './components/users/MyAccount';
import AddAccount from './components/users/AddAccount';
import Settings from './components/users/Settings';
import Logout from './components/users/Logout';

import CustomProbe from './components/designs/CustomProbe';
import DesignWorkflow from './components/designs/DesignWorkflow';


import { PanelLabel } from './types';
import useStore from "./store";

import HomeIcon from '@mui/icons-material/Home';
import DesignIcon from '@mui/icons-material/Pinch';
import GenomeIcon from '@mui/icons-material/Dataset'; 
import TaskIcon from '@mui/icons-material/List';
import TutorialIcon from '@mui/icons-material/HelpOutline'; 

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

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

// Import necessary components for the AccountMenu
import AccountMenu from './components/common/AccountMenu';

const ContentRoute = (props: { label: PanelLabel }) => {
  const { label } = props;

  if (label === "home") {
    return <Home />;
  } else if (label === "design") {
    return <Design />;
  } else if (label === "genome") {
    return <Genome />;
  } else if (label === "task") {
    return <JobsPanel />;
  } else if (label === "tutorial") {
    return <Tutorial />;
  } else if (label === "profile") {
    return <Profile />;
  } else if (label === "myaccount") {
    return <MyAccount />;
  } else if (label === "addaccount") {
    return <AddAccount />;
  } else if (label === "settings") {
    return <Settings />;
  } else if (label === "logout") {
    return <Logout />;
  } else if (label === "customprobe") {
    return <CustomProbe />;
  } else if (label === "designworkflow") {
    return <DesignWorkflow />;
  } else {
    return <div />;
  }
}


const App: React.FC = () => {
  const { panel, setPanel } = useStore();

  // Function to determine if a button is active
  const isActive = (currentPanel: PanelLabel) => panel === currentPanel;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ width: '100%', margin: '0 auto'}}> {/* 设置 AppBar 的宽度 */}
          <Toolbar>
            {/* Home Button with Active Style */}
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => setPanel("home")}
              sx={isActive("home") ? { backgroundColor: '#e0f7fa', color: '#00796b' } : {}}
            >
              U-Probe
            </Button>
            
            {/* Empty Space to Align Right Buttons */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Design Button with Active Style */}
            <Button
              color="inherit"
              startIcon={<DesignIcon />}
              onClick={() => setPanel("design")}
              sx={isActive("design") ? { backgroundColor: '#e0f7fa', color: '#00796b' } : {}}
            >
              Design
            </Button>

            {/* Genome Button with Active Style */}
            <Button
              color="inherit"
              startIcon={<GenomeIcon />}
              onClick={() => setPanel("genome")}
              sx={isActive("genome") ? { backgroundColor: '#e0f7fa', color: '#00796b' } : {}}
            >
              Genome
            </Button>

            {/* Task Button with Active Style */}
            <Button
              color="inherit"
              startIcon={<TaskIcon />}
              onClick={() => setPanel("task")}
              sx={isActive("task") ? { backgroundColor: '#e0f7fa', color: '#00796b' } : {}}
            >
              Task
            </Button>

            {/* Tutorial Button with Active Style */}
            <Button
              color="inherit"
              startIcon={<TutorialIcon />}
              onClick={() => setPanel("tutorial")}
              sx={isActive("tutorial") ? { backgroundColor: '#e0f7fa', color: '#00796b' } : {}}
            >
              Tutorial
            </Button>

            {/* AccountMenu for User Account Options */}
            <AccountMenu />
          </Toolbar>
        </AppBar>
      </Box>
      <div className="pageContent">
        <ContentRoute label={panel} />
      </div>
    </ThemeProvider>
  );
}

export default App;
