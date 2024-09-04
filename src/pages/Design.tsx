// Importing necessary components from MUI
import React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box'; // Importing Box for layout management
import useStore from '../store';


// Define a React Functional Component using TypeScript
const ImgMediaCard: React.FC = () => {

  const { setPanel } = useStore();

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
            <Button onClick={() => setPanel("designworkflow")} size="small">Start</Button>
            <Button onClick={() => setPanel("tutorial")} size="small">Learn More</Button>
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
            <Button onClick={() => setPanel("customprobe")} size="small">Start</Button>
            <Button onClick={() => setPanel("tutorial")} size="small">Learn More</Button>
          </CardActions>
        </Card>

      </Box>
    </Box>
  );
}

export default ImgMediaCard;
