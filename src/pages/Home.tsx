import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardActions,
  CardMedia,
  CardContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Home: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          🌍 U-Probe: A Universal Probe Design Tool 🔬
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 2 }} paragraph>
          🎯 Welcome to U-Probe, your universal tool for designing and optimizing probes for various applications, including fluorescence in situ hybridization (FISH). 🔬
        </Typography>

        {/* Card with Image and Buttons */}
        <Card sx={{ maxWidth: 700, textAlign: 'center', mb: 2, mt: 2, boxShadow: 3 }}>
          <CardMedia
            component="img"
            alt="U-Probe logo"
            height="300"
            image="/2.jpg"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Select an action to start exploring U-Probe capabilities. 🚀
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/designworkflow')}  // Navigate to /design
              sx={{ minWidth: 200, mx: 1 }}
            >
              ✏️ Start Designing 
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/tutorial')}  // Navigate to /tutorial
              sx={{ minWidth: 200, mx: 1 }}
            >
              👀 View Examples 
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/genome')}  // Navigate to /genome
              sx={{ minWidth: 200, mx: 1 }}
            >
              🗃️ Upload Data 
            </Button>
          </CardActions>
        </Card>

        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 2 }}>
          ✨ Create custom probes tailored to your specific research needs with ease! 🧬
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
