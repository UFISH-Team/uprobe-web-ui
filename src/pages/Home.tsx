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
      backgroundColor: theme.palette.background.default,
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
            mb: 2,
            color: theme.palette.primary.main,
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
          elevation={4}
          sx={{ 
            width: '100%',
            maxWidth: '800px', 
            textAlign: 'center', 
            mb: 4, 
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 8,
            }
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
                objectFit: 'cover',
                transition: 'transform 0.5s',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            />
          </Box>
          
          <CardContent sx={{ py: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Select an action to start exploring U-Probe capabilities. 🚀
            </Typography>
          </CardContent>
          
          <CardActions 
            sx={{ 
              padding: { xs: 2, sm: 3 },
              paddingTop: 0,
              paddingBottom: 3,
              display: 'flex',
              flexDirection: isTablet ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: isTablet ? 2 : 3,
            }}
          >
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/designworkflow"
              sx={{ 
                flex: isTablet ? '1 1 auto' : '1 1 0',
                width: isTablet ? '100%' : undefined,
                py: 1.5,
                borderRadius: 1.5,
                fontWeight: 500,
                boxShadow: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
              ✏️ Start Designing 
            </Button>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/tutorial"
              color="secondary"
              sx={{ 
                flex: isTablet ? '1 1 auto' : '1 1 0',
                width: isTablet ? '100%' : undefined,
                py: 1.5,
                borderRadius: 1.5,
                fontWeight: 500,
                boxShadow: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
              👀 View Examples 
            </Button>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/genome"
              color="info"
              sx={{ 
                flex: isTablet ? '1 1 auto' : '1 1 0',
                width: isTablet ? '100%' : undefined,
                py: 1.5,
                borderRadius: 1.5,
                fontWeight: 500,
                boxShadow: 2,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
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
            maxWidth: '800px',
            fontStyle: 'italic'
          }}
        >
          ✨ Create custom probes tailored to your specific research needs with ease! 🧬
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;