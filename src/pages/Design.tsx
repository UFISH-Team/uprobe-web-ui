import React from 'react';
import { Card, CardActions, CardContent, CardMedia, Button, Typography, Box, Container } from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';

// Define a React Functional Component using TypeScript
const Design: React.FC = () => {
  const navigate = useNavigate();  // Use useNavigate for navigation

  return (
    <Container maxWidth={false} sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 4,
        mx: 'auto',
        mt: 5,
        width: '50%', // Set the main container to occupy 70% of the screen
      }}>
        <Outlet />
        {/* Description text above the cards */}
        <Typography variant="h4" component="h2" sx={{ mb: 0 }}>
          Just Do It ! ✨
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, // Stack cards vertically on small screens, horizontally on medium and up
          gap: 4,
          width: '100%',
        }}>
          {/* First Card */}
          <Card sx={{ 
            width: { xs: '100%', md: '50%' }, // Full width on mobile, 50% on desktop (of the 70% container)
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              position: 'relative',
              paddingTop: '100%', // For 1:1 aspect ratio (9/16 = 0.5625, which is 56.25%, but we need inverse for paddingTop, so 16/9 = 1.7778 or 177.78%)
              width: '100%'
            }}>
              <CardMedia
                component="img"
                alt="blue iguana"
                image="/1.webp"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain', // This ensures the image maintains its aspect ratio
                }}
              />
            </Box>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h5" component="div">
                Design Workflow
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Please start your probe design work.
              </Typography>
            </CardContent>
            <CardActions>
              <Button onClick={() => navigate('/designworkflow')} size="small">Start</Button>
              <Button onClick={() => navigate('/tutorial')} size="small">Learn More</Button>
            </CardActions>
          </Card>

          {/* Second Card */}
          <Card sx={{ 
            width: { xs: '100%', md: '50%' }, // Full width on mobile, 50% on desktop (of the 70% container)
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              position: 'relative',
              paddingTop: '100%', // For 1:1 aspect ratio
              width: '100%'
            }}>
              <CardMedia
                component="img"
                alt="Probe type"
                image="/design_1.webp"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain', // This ensures the image maintains its aspect ratio
                }}
              />
            </Box>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h5" component="div">
                Custom Probe
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Please create your own probe type.
              </Typography>
            </CardContent>
            <CardActions>
              <Button onClick={() => navigate('/customprobe')} size="small">Start</Button>
              <Button onClick={() => navigate('/tutorial')} size="small">Learn More</Button>
            </CardActions>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}

export default Design;