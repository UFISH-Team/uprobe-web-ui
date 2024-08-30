import "./App.css";
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import Home from './pages/Home';
import Design from './pages/Design';
import { PanelLabel } from './types';
import useStore from "./store";


const ContentRoute = (props: {label: PanelLabel}) => {
  const { label } = props
  if (label === "home") {
    return <Home />
  } else if (label === "design") {
    return <Design />
  } else {
    return <div/>
  }
}


const App: React.FC = () => {

  const { panel, setPanel } = useStore()

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              U-Probe web
            </Typography>
            <Button color="inherit" onClick={() => {setPanel("home")}}>Home</Button>
            <Button color="inherit" onClick={() => {setPanel("design")}}>Design</Button>
            <Button color="inherit">Genome</Button>
            <Button color="inherit">Tutorial</Button>
            <Button color="inherit">User</Button>
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
