import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Grid,
  Paper,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  RocketLaunch, 
  Visibility, 
  CloudUpload,
  Science,
  TipsAndUpdates,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const quickActions = [
    {
      title: 'Start Designing',
      description: 'Create custom probes with our advanced workflow',
      icon: <RocketLaunch />,
      path: '/design/designworkflow',
      color: theme.palette.primary.main,
      bgColor: 'rgba(37, 99, 235, 0.1)',
    },
    {
      title: 'View Examples',
      description: 'Explore tutorials and learn best practices',
      icon: <Visibility />,
      path: '/tutorial',
      color: theme.palette.secondary.main,
      bgColor: 'rgba(8, 145, 178, 0.1)',
    },
    {
      title: 'Upload Data',
      description: 'Import your genome and annotation files',
      icon: <CloudUpload />,
      path: '/genome',
      color: theme.palette.info.main,
      bgColor: 'rgba(59, 130, 246, 0.1)',
    }
  ];

  return (
    <>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 4, sm: 6, md: 8 },
            pt: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Paper
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
                borderRadius: '50%',
                width: { xs: 80, sm: 100 },
                height: { xs: 80, sm: 100 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            >
              <Science sx={{ 
                fontSize: { xs: 40, sm: 50 }, 
                color: 'white' 
              }} />
            </Paper>
          </Box>

          <Typography 
            variant={isMobile ? "h3" : "h2"} 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
            }}
          >
            Universal Probe Design Platform
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'text.secondary', 
              mb: 4,
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1rem', sm: '1.1rem' }
            }} 
          >
            Professional universal probe design tool supporting FISH and other applications,
            empowering your research with breakthrough scientific discoveries
          </Typography>

          {/* Quick Actions Grid */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  component={Link}
                  to={action.path}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      '& .action-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                      }
                    }
                  }}
                >
                  <CardContent sx={{ 
                    textAlign: 'center', 
                    p: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Box
                      className="action-icon"
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: action.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        mb: 1,
                      }}
                    >
                      {React.cloneElement(action.icon, { 
                        sx: { 
                          fontSize: 28, 
                          color: action.color 
                        } 
                      })}
                    </Box>
                    
                    <Typography 
                      variant="h6" 
                      component="h3"
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 1
                      }}
                    >
                      {action.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        textAlign: 'center',
                        lineHeight: 1.5
                      }}
                    >
                      {action.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Feature Showcase */}
          <Card
            sx={{
              mb: 4,
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(8, 145, 178, 0.05) 100%)',
              border: '1px solid rgba(37, 99, 235, 0.1)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box sx={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}>
                <TipsAndUpdates sx={{ 
                  fontSize: 32, 
                  color: theme.palette.primary.main,
                  mr: 2
                }} />
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  Core Features
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Smart Design
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Advanced algorithm-based probe sequence optimization
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Multi-Format Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Support for FASTA, GFF and various data formats
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Visual Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Intuitive result visualization and data analysis
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Batch Processing
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Efficient large-scale data processing capabilities
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              fontStyle: 'italic',
              opacity: 0.8
            }}
          >
            🧬 Start your probe design journey for more efficient and precise research
          </Typography>
        </Box>
    </>
  );
};

export default Home;
