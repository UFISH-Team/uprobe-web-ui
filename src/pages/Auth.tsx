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
  Link,
  Fade,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Chip,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  Science,
  Person,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../api';

const Auth = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { login, registerWithCode, sendVerificationCode } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    full_name: '',
    email: '',  // For registration only
    password_confirm: '',  // Password confirmation
    verification_code: ''  // Email verification code
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: Enter email, 1: Enter code and new password
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    resetCode: '',
    newPassword: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0); // 0: Enter basic info, 1: Verify email
  const [, setVerificationCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Common email suffixes list
  const emailSuffixes = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    '163.com',
    '126.com',
    'qq.com',
    'sina.com',
    'sohu.com',
    'edu.cn',
    'pku.edu.cn',
    'tsinghua.edu.cn',
    'fudan.edu.cn',
    'sjtu.edu.cn',
    'zju.edu.cn',
    'nju.edu.cn',
    'ustc.edu.cn',
    'bit.edu.cn',
    'buaa.edu.cn',
    'hit.edu.cn'
  ];
  
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [emailSupportInfo, setEmailSupportInfo] = useState<any>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Email format validation - supports all email formats
  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
    return emailPattern.test(email);
  };
  
  // Check if input is email format
  const isEmailFormat = (input: string): boolean => {
    return input.includes('@');
  };

  // Page loading animation
  React.useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut support
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key to clear error messages
      if (event.key === 'Escape' && error) {
        setError(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [error]);

  // Countdown functionality
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Email auto-completion logic
  const generateEmailSuggestions = (inputValue: string) => {
    if (!inputValue || inputValue.includes('@')) {
      setEmailSuggestions([]);
      return;
    }
    
    const suggestions = emailSuffixes.map(suffix => `${inputValue}@${suffix}`);
    setEmailSuggestions(suggestions.slice(0, 5)); // Only show first 5 suggestions
  };

  // Check email support status
  const checkEmailSupport = async (email: string) => {
    if (!validateEmail(email)) {
      setEmailSupportInfo(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const supportInfo = await ApiService.checkEmailSupport(email);
      setEmailSupportInfo(supportInfo);
    } catch (err: any) {
      console.error('Failed to check email support:', err);
      setEmailSupportInfo(null);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Generate email suggestions and check support status
    if (name === 'email' && !isLoginMode && registrationStep === 0) {
      const emailPrefix = value.split('@')[0];
      generateEmailSuggestions(emailPrefix);
      
      // If it's a complete email address, check support status
      if (validateEmail(value)) {
        checkEmailSupport(value);
      } else {
        setEmailSupportInfo(null);
      }
    }
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email) {
      setError('Please enter email address');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setSendingCode(true);
    try {
      const response = await sendVerificationCode(formData.email);
      setVerificationCodeSent(true);
      setRegistrationStep(1);
      
      // Use countdown time returned from server
      const resendAfter = (response as any)?.can_resend_after || 60;
      setCountdown(resendAfter);
      setError(null);
    } catch (err: any) {
      // Handle different types of errors
      if (err.response?.status === 429) {
        setError(err.response.data.detail || 'Sending too frequently, please try again later');
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Invalid email address or already registered');
      } else {
        setError('Failed to send verification code, please check network and try again');
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        // Login mode validation
        if (!formData.emailOrUsername || !formData.password) {
          throw new Error('Please fill in all fields');
        }
        
        // If email format, validate email format
        if (isEmailFormat(formData.emailOrUsername) && !validateEmail(formData.emailOrUsername)) {
          throw new Error('Please enter a valid email address');
        }
        
        await login(formData.emailOrUsername, formData.password, false);
      } else {
        // Registration mode validation
        if (registrationStep === 0) {
          // First step: Validate basic info and send verification code
          if (!formData.full_name || !formData.email || !formData.password || !formData.password_confirm) {
          throw new Error('Please fill in all fields');
        }
        if (!validateEmail(formData.email)) {
            throw new Error('Please enter a valid email address');
          }
          if (formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
          }
          if (formData.password !== formData.password_confirm) {
            throw new Error('Passwords do not match');
          }
          await handleSendVerificationCode();
          return; // Don't continue execution
        } else {
          // Second step: Verification code registration
          if (!formData.email || !formData.verification_code || !formData.password || !formData.full_name) {
            throw new Error('Please fill in all fields');
          }
          
          // Password validation
        if (formData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
          await registerWithCode(formData.email, formData.verification_code, formData.password, formData.full_name);
        }
      }
      
      navigate('/home');
    } catch (err: any) {
      console.error(isLoginMode ? 'Login error:' : 'Registration error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        (isLoginMode ? 'Login failed. Please check your credentials and try again.' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setFormData({
      emailOrUsername: '',
      password: '',
      full_name: '',
      email: '',
      password_confirm: '',
      verification_code: ''
    });
    setRegistrationStep(0);
    setVerificationCodeSent(false);
    setCountdown(0);
  };

  const handleForgotPassword = () => {
    setForgotPasswordOpen(true);
    setForgotPasswordStep(0);
    setForgotPasswordData({
      email: '',
      resetCode: '',
      newPassword: ''
    });
  };

  const handleForgotPasswordSubmit = async () => {
    setForgotPasswordLoading(true);
    try {
      if (forgotPasswordStep === 0) {
        // First step: Send reset code
        if (!forgotPasswordData.email) {
          throw new Error('Please enter email address');
        }
        if (!validateEmail(forgotPasswordData.email)) {
          throw new Error('Please enter a valid email address');
        }
        
        const response = await ApiService.forgotPassword(forgotPasswordData.email);
        setForgotPasswordStep(1);
        setError(null);
        
        // Set countdown (for resend button)
        const resendAfter = (response as any)?.can_resend_after || 60;
        setCountdown(resendAfter);
      } else {
        // Second step: Reset password
        if (!forgotPasswordData.resetCode || !forgotPasswordData.newPassword) {
          throw new Error('Please fill in all fields');
        }
        if (forgotPasswordData.newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        await ApiService.resetPassword(
          forgotPasswordData.email,
          forgotPasswordData.resetCode,
          forgotPasswordData.newPassword
        );
        
        setForgotPasswordOpen(false);
        setError(null);
        setCountdown(0);
        
        // Show success message
        alert('Password reset successful! Please login with your new password.');
      }
    } catch (err: any) {
      // Handle different types of errors
      if (err.response?.status === 429) {
        setError(err.response.data.detail || 'Sending too frequently, please try again later');
      } else if (err.response?.status === 400) {
        if (forgotPasswordStep === 1) {
          setError('Verification code is incorrect or expired, please get a new one');
        } else {
          setError(err.response.data.detail || 'Invalid email address');
        }
      } else {
        setError(forgotPasswordStep === 0 ? 'Failed to send reset code, please try again' : 'Password reset failed, please try again');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleForgotPasswordChange = (field: string, value: string) => {
    setForgotPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
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
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
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
                py: 3,
                px: 3,
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
                <Science sx={{ fontSize: 40, mb: 1.5 }} />
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  component="h1" 
                  fontWeight={700}
                  sx={{ mb: 0.5 }}
                >
                  🔬 U-Probe
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Universal Probe Design Platform
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  sx={{ 
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    mb: 0.5,
                    fontSize: '1.25rem'
                  }}
                >
                  {isLoginMode ? 'Welcome Back! 👋' : 'Create Account 🚀'}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.875rem'
                  }}
                >
                  {isLoginMode 
                    ? 'Sign in to continue' 
                    : registrationStep === 0 
                      ? 'Get started with your account' 
                      : 'Verify your email'
                  }
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
                {!isLoginMode && registrationStep === 0 && (
                  <Fade in={true} timeout={600}>
                    <Box>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="full_name"
                    label="Full Name"
                    name="full_name"
                    autoComplete="name"
                    value={formData.full_name}
                    onChange={handleChange}
                        disabled={loading || sendingCode}
                    error={Boolean(error)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main,
                              }
                            },
                            '&.Mui-focused': {
                              boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                            }
                          }
                        }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                      <Autocomplete
                        freeSolo
                        options={emailSuggestions}
                        value={formData.email}
                        onInputChange={(_, newInputValue) => {
                          setFormData(prev => ({ ...prev, email: newInputValue }));
                          const emailPrefix = newInputValue.split('@')[0];
                          generateEmailSuggestions(emailPrefix);
                          
                          // 检查邮箱支持情况
                          if (validateEmail(newInputValue)) {
                            checkEmailSupport(newInputValue);
                          } else {
                            setEmailSupportInfo(null);
                          }
                          
                          if (error) setError(null);
                        }}
                        renderInput={(params) => (
                  <TextField
                            {...params}
                    margin="normal"
                    required
                    fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            type="email"
                            autoComplete="email"
                    autoFocus={!isMobile}
                            disabled={loading || sendingCode}
                    error={Boolean(error)}
                            sx={{ 
                              mb: 2,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: theme.palette.primary.main,
                                  }
                                },
                                '&.Mui-focused': {
                                  boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                                }
                              }
                            }}
                    InputProps={{
                              ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                        )}
                        renderOption={(props, option) => {
                          const [localPart, domain] = option.split('@');
                          const isPopularDomain = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'].includes(domain);
                          
                          return (
                            <Box 
                              component="li" 
                              {...props} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                py: 2,
                                px: 3,
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                }
                              }}
                            >
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  flex: 1,
                                  fontSize: '0.95rem',
                                  fontWeight: 400,
                                  letterSpacing: '0.01em'
                                }}
                              >
                                <span style={{ color: theme.palette.text.primary }}>{localPart}</span>
                                <span style={{ color: theme.palette.text.secondary }}>@{domain}</span>
                              </Typography>
                              {isPopularDomain && (
                                <Box sx={{ 
                                  width: 6, 
                                  height: 6, 
                                  borderRadius: '50%', 
                                  backgroundColor: theme.palette.primary.main,
                                  ml: 2
                                }} />
                              )}
                            </Box>
                          );
                        }}
                        PaperComponent={(props) => (
                          <Box
                            {...props}
                            sx={{
                              borderRadius: 2,
                              boxShadow: theme.shadows[4],
                              border: `1px solid ${theme.palette.divider}`,
                              mt: 1,
                              backgroundColor: theme.palette.background.paper,
                              '& .MuiAutocomplete-listbox': {
                                padding: 0,
                                maxHeight: '200px'
                              }
                            }}
                          />
                        )}
                        sx={{ mb: 2 }}
                      />

                      {/* 邮箱支持信息显示 */}
                      {formData.email && validateEmail(formData.email) && emailSupportInfo && !checkingEmail && (
                        <Box sx={{ mb: 1.5 }}>
                            <Box sx={{ 
                              p: 1.5, 
                              borderRadius: 1.5, 
                              backgroundColor: emailSupportInfo.smtp_info?.supported 
                                ? theme.palette.success.main + '10'
                                : theme.palette.warning.main + '10',
                              border: `1px solid ${
                                emailSupportInfo.smtp_info?.supported 
                                  ? theme.palette.success.main + '30'
                                  : theme.palette.warning.main + '30'
                              }`
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {emailSupportInfo.smtp_info?.supported ? (
                                  <Box sx={{ 
                                    width: 14, 
                                    height: 14, 
                                    borderRadius: '50%', 
                                    backgroundColor: theme.palette.success.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Typography sx={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>✓</Typography>
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    width: 14, 
                                    height: 14, 
                                    borderRadius: '50%', 
                                    backgroundColor: theme.palette.warning.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Typography sx={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>!</Typography>
                                  </Box>
                                )}
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontWeight: 600,
                                    fontSize: '0.8125rem',
                                    color: emailSupportInfo.smtp_info?.supported 
                                      ? theme.palette.success.dark 
                                      : theme.palette.warning.dark
                                  }}
                                >
                                  {emailSupportInfo.smtp_info?.supported 
                                    ? `${emailSupportInfo.smtp_info.provider}` 
                                    : 'Not supported'
                                  }
                                </Typography>
                              </Box>
                              {emailSupportInfo.send_capability?.mode === 'no_config' && (
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.info.main,
                                  display: 'block',
                                  mt: 0.5,
                                  fontSize: '0.75rem'
                                }}>
                                  Dev mode: Check server console
                                </Typography>
                              )}
                            </Box>
                        </Box>
                      )}
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading || sendingCode}
                        error={Boolean(error)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main,
                              }
                            },
                            '&.Mui-focused': {
                              boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                            }
                          }
                        }}
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
                                disabled={loading || sendingCode}
                                sx={{
                                  transition: 'transform 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password_confirm"
                        label="Confirm Password"
                        type={showPasswordConfirm ? 'text' : 'password'}
                        id="password_confirm"
                        autoComplete="new-password"
                        value={formData.password_confirm}
                        onChange={handleChange}
                        disabled={loading || sendingCode}
                        error={Boolean(error && formData.password !== formData.password_confirm)}
                        sx={{ 
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main,
                              }
                            },
                            '&.Mui-focused': {
                              boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
                            }
                          }
                        }}
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
                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                edge="end"
                                disabled={loading || sendingCode}
                                sx={{
                                  transition: 'transform 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Fade>
                )}

                {!isLoginMode && registrationStep === 1 && (
                  <Fade in={true} timeout={600}>
                    <Box>
                      {/* Email confirmation info */}
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2, 
                        backgroundColor: theme.palette.primary.main + '08',
                        border: `1px solid ${theme.palette.primary.main}20`,
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Email sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '0.875rem' }}>
                          Code sent to
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-all', fontSize: '0.875rem' }}>
                        {formData.email}
                      </Typography>
                    </Box>

                    {/* Verification code input */}
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="verification_code"
                      label="Verification Code"
                      name="verification_code"
                      value={formData.verification_code}
                      onChange={handleChange}
                      disabled={loading}
                      error={Boolean(error)}
                      sx={{ 
                        mb: 1.5,
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1.1rem',
                          letterSpacing: '0.3em',
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }
                      }}
                      inputProps={{ 
                        maxLength: 6,
                        style: { textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.3em' }
                      }}
                      placeholder="000000"
                    />

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setRegistrationStep(0);
                          setCountdown(0);
                        }}
                        disabled={loading}
                        sx={{ borderRadius: 1.5, fontSize: '0.8125rem', py: 0.75 }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={handleSendVerificationCode}
                        disabled={loading || sendingCode || countdown > 0}
                        sx={{ 
                          borderRadius: 1.5,
                          fontSize: '0.8125rem',
                          py: 0.75
                        }}
                      >
                        {sendingCode ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircularProgress size={14} />
                            <span>Sending...</span>
                          </Box>
                        ) : countdown > 0 ? (
                          `Resend (${countdown}s)`
                        ) : (
                          'Resend Code'
                        )}
                      </Button>
                      </Box>
                    </Box>
                  </Fade>
                )}
                {isLoginMode && (
                  <TextField
                    margin="normal"
                    fullWidth
                    id="emailOrUsername"
                    label="Username or Email"
                    name="emailOrUsername"
                    autoComplete="username"
                    autoFocus={!isMobile}
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    disabled={loading}
                    error={Boolean(error)}
                    //helperText="Enter your email address or admin username"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                {isLoginMode && (
                <TextField
                  margin="normal"
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
                )}

                {isLoginMode && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Link
                    component="button"
                    variant="body2"
                    type="button"
                    onClick={handleForgotPassword}
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    disabled={loading}
                  >
                    Forgot password?
                  </Link>
                </Box>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || sendingCode}
                  sx={{
                    py: 1.25,
                    mb: 2,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '0.9375rem',
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
                  {loading || sendingCode ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} color="inherit" />
                      <Typography variant="button" sx={{ fontSize: '0.9375rem' }}>
                        {isLoginMode 
                          ? 'Signing In...' 
                          : sendingCode 
                            ? 'Sending...'
                            : registrationStep === 0 
                              ? 'Sending...' 
                              : 'Creating...'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    isLoginMode 
                      ? 'Sign In' 
                      : registrationStep === 0 
                        ? 'Send Code' 
                        : 'Complete'
                  )}
                </Button>


                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.875rem' }}>
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                    <Link
                      component="button"
                      type="button"
                      onClick={toggleMode}
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                      disabled={loading}
                    >
                      {isLoginMode ? 'Create Account' : 'Sign In'}
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Fade>

        {/* Footer Information */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem'
            }}
          >
            © 2026 U-Probe Platform
          </Typography>
        </Box>
      </Container>
      
      {/* 忘记密码对话框 */}
      <Dialog 
        open={forgotPasswordOpen} 
        onClose={() => setForgotPasswordOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reset Password
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={forgotPasswordStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Enter Email</StepLabel>
            </Step>
            <Step>
              <StepLabel>Reset Password</StepLabel>
            </Step>
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {forgotPasswordStep === 0 ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                Enter your email address and we'll send you a reset code.
              </Typography>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={forgotPasswordData.email}
                onChange={(e) => handleForgotPasswordChange('email', e.target.value)}
                disabled={forgotPasswordLoading}
                sx={{ mb: 2 }}
                helperText="All email formats are supported"
              />
            </Box>
          ) : (
            <Box>
              {/* 邮箱确认信息 */}
              <Box sx={{ 
                mb: 3, 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: theme.palette.info.main + '10',
                border: `1px solid ${theme.palette.info.main}30`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Email sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.info.main }}>
                    Reset code sent to
              </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                  {forgotPasswordData.email}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 1, display: 'block' }}>
                  Please check your email (including spam folder)
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Reset Code"
                value={forgotPasswordData.resetCode}
                onChange={(e) => handleForgotPasswordChange('resetCode', e.target.value)}
                disabled={forgotPasswordLoading}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.1rem',
                    letterSpacing: '0.2em',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }
                }}
                inputProps={{ 
                  maxLength: 6,
                  style: { textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }
                }}
                placeholder="000000"
                helperText="Please enter 6-digit reset code"
              />

              {/* Countdown and resend button */}
              {countdown > 0 && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <Chip 
                    label={`Resend in ${countdown}s`} 
                    size="small" 
                    color="info" 
                    variant="outlined"
                  />
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Button
                  variant={countdown > 0 ? "outlined" : "text"}
                  onClick={async () => {
                    // Resend reset code
                    setForgotPasswordLoading(true);
                    try {
                      const response = await ApiService.forgotPassword(forgotPasswordData.email);
                      setError(null);
                      const resendAfter = (response as any)?.can_resend_after || 60;
                      setCountdown(resendAfter);
                    } catch (err: any) {
                      if (err.response?.status === 429) {
                        setError(err.response.data.detail || 'Sending too frequently, please try again later');
                      } else {
                        setError('Failed to send reset code, please try again');
                      }
                    } finally {
                      setForgotPasswordLoading(false);
                    }
                  }}
                  disabled={forgotPasswordLoading || countdown > 0}
                  size="small"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Reset Code'}
                </Button>
              </Box>

              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={forgotPasswordData.newPassword}
                onChange={(e) => handleForgotPasswordChange('newPassword', e.target.value)}
                disabled={forgotPasswordLoading}
                helperText="Password must be at least 6 characters"
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setForgotPasswordOpen(false)}
            disabled={forgotPasswordLoading}
          >
            Cancel
          </Button>
          {forgotPasswordStep === 1 && (
            <Button 
              onClick={() => {
                setForgotPasswordStep(0);
                setError(null);
              }}
              disabled={forgotPasswordLoading}
            >
              Back
            </Button>
          )}
          <Button 
            variant="contained"
            onClick={handleForgotPasswordSubmit}
            disabled={forgotPasswordLoading}
          >
            {forgotPasswordLoading ? (
              <CircularProgress size={20} />
            ) : (
              forgotPasswordStep === 0 ? 'Send Code' : 'Reset Password'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Auth; 
