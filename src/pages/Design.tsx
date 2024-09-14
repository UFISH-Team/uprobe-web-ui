// Importing necessary components from MUI and React Router
import React from 'react';
import { Card, CardActions, CardContent, CardMedia, Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';  // Import useNavigate

// Define a React Functional Component using TypeScript
const Design: React.FC = () => {

  const navigate = useNavigate();  // Use useNavigate for navigation

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, ml: 50, mt: 5 }}>
      {/* Description text above the cards */}
      <Typography variant="h4" component="h2" sx={{ mb: 0 }}>
        Just Do It ! ✨
      </Typography>

      <Box sx={{ display: 'flex', gap: 4 }}>

        <Card sx={{ maxWidth: 500 }}>
          <CardMedia
            component="img"
            alt="blue iguana"
            height="300"
            image="/1.webp"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Design Workflow
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Please start your probe design work.
            </Typography>
          </CardContent>
          <CardActions>
            {/* Navigate to /designworkflow */}
            <Button onClick={() => navigate('/design/workflow')} size="small">Start</Button>
            <Button onClick={() => navigate('/tutorial')} size="small">Learn More</Button>
          </CardActions>
        </Card>

        <Card sx={{ maxWidth: 500 }}>
          <CardMedia
            component="img"
            alt="Probe type"
            height="300"
            image="/design_1.webp"
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Custom Probe
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Please create your own probe type.
            </Typography>
          </CardContent>
          <CardActions>
            {/* Navigate to /customprobe */}
            <Button onClick={() => navigate('/customprobe')} size="small">Start</Button>
            <Button onClick={() => navigate('/tutorial')} size="small">Learn More</Button>
          </CardActions>
        </Card>

      </Box>
    </Box>
  );
}

export default Design;
