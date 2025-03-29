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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container maxWidth={false} sx={{ 
      minHeight: '100vh', 
      py: 4,
      display: 'flex',
      alignItems: 'center',
    }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 'lg',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            mb: 2
          }}
        >
          🌍 U-Probe: A Universal Probe Design Tool 🔬
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'text.secondary', 
            mb: 4,
            maxWidth: '800px'
          }} 
        >
          Welcome to U-Probe, your universal tool for designing and optimizing probes for various applications, including fluorescence in situ hybridization (FISH). 
        </Typography>

        {/* Card with Image and Buttons */}
        <Card 
          sx={{ 
            width: '100%',
            maxWidth: '800px', 
            textAlign: 'center', 
            mb: 4, 
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            position: 'relative',
            width: '100%',
            paddingTop: '50%', // 2:1 aspect ratio for the image
            overflow: 'hidden'
          }}>
            <CardMedia
              component="img"
              alt="U-Probe 示例图"
              image="/2.jpg"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
          
          <CardContent sx={{ py: 3 }}>
            <Typography variant="body1" color="text.secondary">
            Select an action to start exploring U-Probe capabilities. 🚀
            </Typography>
          </CardContent>
          
          <CardActions sx={{ 
            justifyContent: 'center',
            flexDirection: isTablet ? 'column' : 'row',
            gap: 2,
            pb: 3,
            px: 3,
          }}>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/designworkflow"
              sx={{ 
                width: isTablet ? '100%' : 'auto',
                minWidth: isTablet ? 'unset' : '180px',
                py: 1.5
              }}
            >
              ✏️ Design Probe 
            </Button>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/tutorial"
              sx={{ 
                width: isTablet ? '100%' : 'auto',
                minWidth: isTablet ? 'unset' : '180px',
                py: 1.5
              }}
            >
              👀 View Examples 
            </Button>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/genome"
              sx={{ 
                width: isTablet ? '100%' : 'auto',
                minWidth: isTablet ? 'unset' : '180px',
                py: 1.5
              }}
            >
              🗃️ Upload Data 
            </Button>
          </CardActions>
        </Card>

        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: 'text.secondary',
            maxWidth: '800px'
          }}
        >
          ✨ Create custom probes tailored to your specific research needs with ease! 🧬
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;