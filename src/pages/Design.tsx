import React from 'react';
import { Card, CardActions, CardContent, CardMedia, Button, Typography, Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';

// Define a React Functional Component using TypeScript
const Design: React.FC = () => {
  const navigate = useNavigate();  // Use useNavigate for navigation
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth={false} sx={{ 
      width: '100%',
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      py: 2,
      backgroundColor: theme.palette.background.default,
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        mx: 'auto',
        width: '60%',
        maxWidth: 'lg',
      }}>
        <Outlet />
        {/* Description text above the cards */}
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          component="h2" 
          sx={{ 
            mb: 3,
            textAlign: 'center',
            fontWeight: 700,
            color: theme.palette.primary.main,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.02)',
              letterSpacing: '0.5px',
            }
          }}
        >
          ✨ Choose One of the Following
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4,
          width: '100%',
          justifyContent: 'center',
        }}>
          {/* First Card */}
          <Card sx={{ 
            width: { xs: '100%', md: '45%' },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: theme.shadows[4],
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: theme.shadows[15],
              '& .MuiCardMedia-root': {
                transform: 'scale(1.05)',
              },
            },
          }}>
            <Box sx={{ 
              position: 'relative',
              paddingTop: '100%',
              width: '100%',
              overflow: 'hidden',
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
                  objectFit: 'contain',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </Box>
            <CardContent sx={{ 
              flexGrow: 1,
              textAlign: 'center',
              p: 3,
            }}>
              <Typography 
                gutterBottom 
                variant="h5" 
                component="div"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                Design Workflow
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                Please start your probe design work.
              </Typography>
            </CardContent>
            <CardActions sx={{ 
              p: 3,
              pt: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}>
              <Button 
                onClick={() => navigate('/designworkflow')} 
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6,
                  }
                }}
              >
                Start
              </Button>
              <Button 
                onClick={() => navigate('/tutorial')} 
                variant="outlined"
                size="large"
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  }
                }}
              >
                Learn More
              </Button>
            </CardActions>
          </Card>

          {/* Second Card */}
          <Card sx={{ 
            width: { xs: '100%', md: '45%' },
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: theme.shadows[4],
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: theme.shadows[15],
              '& .MuiCardMedia-root': {
                transform: 'scale(1.05)',
              },
            },
          }}>
            <Box sx={{ 
              position: 'relative',
              paddingTop: '100%',
              width: '100%',
              overflow: 'hidden',
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
                  objectFit: 'contain',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </Box>
            <CardContent sx={{ 
              flexGrow: 1,
              textAlign: 'center',
              p: 3,
            }}>
              <Typography 
                gutterBottom 
                variant="h5" 
                component="div"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  mb: 2,
                }}
              >
                Custom Probe
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  lineHeight: 1.6,
                }}
              >
                Please create your own probe type.
              </Typography>
            </CardContent>
            <CardActions sx={{ 
              p: 3,
              pt: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
            }}>
              <Button 
                onClick={() => navigate('/customprobe')} 
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 6,
                  }
                }}
              >
                Start
              </Button>
              <Button 
                onClick={() => navigate('/tutorial')} 
                variant="outlined"
                size="large"
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  }
                }}
              >
                Learn More
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}

export default Design;