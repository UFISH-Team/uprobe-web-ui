import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Checkbox,
  Link,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Lock,
  Science,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Auth = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 页面加载动画
  React.useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC键清除错误信息
      if (event.key === 'Escape' && error) {
        setError(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.username || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      await login(formData.username, formData.password);
      navigate('/home');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Fade in={showForm} timeout={800}>
          <Card
            elevation={8}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[12],
              },
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
                py: 4,
                px: 4,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'url("/uprobe_background.webp") center/cover',
                  opacity: 0.1,
                  zIndex: 0,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Science sx={{ fontSize: 48, mb: 2 }} />
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="h1" 
                  fontWeight={700}
                  sx={{ mb: 1 }}
                >
                  🔬 U-Probe
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Universal Probe Design Platform
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    mb: 1 
                  }}
                >
                  Welcome Back! 👋
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 3 
                  }}
                >
                  Please sign in to your account to continue
                </Typography>
              </Box>

              {error && (
                <Fade in={Boolean(error)}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: '1.2rem'
                      }
                    }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  autoFocus={!isMobile}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(error)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(error)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Remember me
                      </Typography>
                    }
                  />
                  <Link
                    component="button"
                    variant="body2"
                    type="button"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    disabled={loading}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: theme.shadows[8],
                    },
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <Typography variant="button">Signing In...</Typography>
                    </Box>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, px: 2 }}>
                    or
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Don't have an account?{' '}
                    <Link
                      component="button"
                      type="button"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                      disabled={loading}
                    >
                      Contact Administrator
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Footer Information */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              mb: 1,
              fontWeight: 500
            }}
          >
            © 2024 U-Probe Platform. All rights reserved.
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'block',
              mb: 1
            }}
          >
            Version 1.0 | Powered by Advanced Bioinformatics
          </Typography>
          {error && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'block',
                fontStyle: 'italic'
              }}
            >
              💡 Press ESC to dismiss error messages
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Auth; 
