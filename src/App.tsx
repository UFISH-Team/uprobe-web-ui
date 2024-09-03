import "./App.css";
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Home from './pages/Home';
import Design from './pages/Design';
import Genome from './pages/Genome';
import JobsPanel from './pages/JobsPanel';
import Tutorial from './pages/Tutorial';
import Profile from './pages/Profile'; 
import MyAccount from './pages/MyAccount';
import AddAccount from './pages/AddAccount';
import Settings from './pages/Settings';
import Logout from './pages/Logout';
import { PanelLabel } from './types';
import useStore from "./store";

import HomeIcon from '@mui/icons-material/Home';
import DesignIcon from '@mui/icons-material/Pinch';
import GenomeIcon from '@mui/icons-material/Dataset'; 
import TaskIcon from '@mui/icons-material/List';
import TutorialIcon from '@mui/icons-material/HelpOutline'; 

// Import necessary components for the AccountMenu
import AccountMenu from './components/common/AccountMenu';

const ContentRoute = (props: {label: PanelLabel}) => {
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
  } else if (label === "profile") {  // 新增的分支
    return <Profile />;
  } else if (label === "myaccount") {
    return <MyAccount />;
  } else if (label === "addaccount") {
    return <AddAccount />;
  } else if (label === "settings") {
    return <Settings />;
  } else if (label === "logout") {
    return <Logout />;
  } else {
    return <div />;
  }
}

const App: React.FC = () => {
  const { panel, setPanel } = useStore();
  
  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            {/* 左侧：Home按钮 */}
            <Button color="inherit" startIcon={<HomeIcon />} onClick={() => { setPanel("home") }}>Home</Button>
            
            {/* 占位，用于将右侧按钮推到右边 */}
            <Box sx={{ flexGrow: 1 }} />
            
            {/* 右侧：其他按钮 */}
            <Button color="inherit" startIcon={<DesignIcon />} onClick={() => { setPanel("design") }}>Design</Button>
            <Button color="inherit" startIcon={<GenomeIcon />} onClick={() => { setPanel("genome") }}>Genome</Button>
            <Button color="inherit" startIcon={<TaskIcon />} onClick={() => { setPanel("task") }}>Task</Button>
            <Button color="inherit" startIcon={<TutorialIcon />} onClick={() => { setPanel("tutorial") }}>Tutorial</Button>
            
            {/* AccountMenu 组件替换 User 菜单 */}
            <AccountMenu />
          </Toolbar>
        </AppBar>
      </Box>
      <div className="pageContent">
        <ContentRoute label={panel} />
      </div>
    </>
  );
};

export default App;
