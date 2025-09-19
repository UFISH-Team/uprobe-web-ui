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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Chip,
  LinearProgress,
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
  const [rememberMe, setRememberMe] = useState(false);
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
        
        await login(formData.emailOrUsername, formData.password, rememberMe);
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
                  {isLoginMode ? 'Welcome Back! 👋' : 'Create Account 🚀'}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 3 
                  }}
                >
                  {isLoginMode 
                    ? 'Please sign in to your account to continue' 
                    : registrationStep === 0 
                      ? 'Enter your basic information to get started' 
                      : 'Enter the verification code sent to your email'
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

              {/* 注册步骤指示器 */}
                {!isLoginMode && (
                <Box sx={{ mb: 4 }}>
                  <Stepper 
                    activeStep={registrationStep} 
                    sx={{ 
                      mb: 2,
                      '& .MuiStepLabel-root .Mui-completed': {
                        color: theme.palette.success.main,
                      },
                      '& .MuiStepLabel-root .Mui-active': {
                        color: theme.palette.primary.main,
                      },
                      '& .MuiStepConnector-line': {
                        borderColor: registrationStep > 0 ? theme.palette.success.main : theme.palette.divider,
                      }
                    }}
                  >
                    <Step>
                      <StepLabel 
                        StepIconComponent={({ completed, active }) => (
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: completed 
                              ? theme.palette.success.main 
                              : active 
                                ? theme.palette.primary.main 
                                : theme.palette.grey[300],
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                          }}>
                            {completed ? '✓' : '1'}
                          </Box>
                        )}
                      >
                        <Typography variant="body2" sx={{ fontWeight: registrationStep >= 0 ? 600 : 400 }}>
                          Enter Basic Info
                        </Typography>
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel
                        StepIconComponent={({ completed, active }) => (
                          <Box sx={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: completed 
                              ? theme.palette.success.main 
                              : active 
                                ? theme.palette.primary.main 
                                : theme.palette.grey[300],
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            transition: 'all 0.3s ease'
                          }}>
                            {completed ? '✓' : '2'}
                          </Box>
                        )}
                      >
                        <Typography variant="body2" sx={{ fontWeight: registrationStep >= 1 ? 600 : 400 }}>
                          Verify Email
                        </Typography>
                      </StepLabel>
                    </Step>
                  </Stepper>
                </Box>
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
                          mb: 3,
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
                            helperText="Start typing to see email suggestions"
                            sx={{ 
                              mb: 3,
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
                      {formData.email && validateEmail(formData.email) && (
                        <Box sx={{ mb: 2 }}>
                          {checkingEmail ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                Checking email support...
                              </Typography>
                            </Box>
                          ) : emailSupportInfo && (
                            <Box sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              backgroundColor: emailSupportInfo.smtp_info?.supported 
                                ? theme.palette.success.main + '10'
                                : theme.palette.warning.main + '10',
                              border: `1px solid ${
                                emailSupportInfo.smtp_info?.supported 
                                  ? theme.palette.success.main + '30'
                                  : theme.palette.warning.main + '30'
                              }`
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {emailSupportInfo.smtp_info?.supported ? (
                                  <Box sx={{ 
                                    width: 16, 
                                    height: 16, 
                                    borderRadius: '50%', 
                                    backgroundColor: theme.palette.success.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</Typography>
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    width: 16, 
                                    height: 16, 
                                    borderRadius: '50%', 
                                    backgroundColor: theme.palette.warning.main,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>!</Typography>
                                  </Box>
                                )}
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: emailSupportInfo.smtp_info?.supported 
                                      ? theme.palette.success.dark 
                                      : theme.palette.warning.dark
                                  }}
                                >
                                  {emailSupportInfo.smtp_info?.supported 
                                    ? `Supported by ${emailSupportInfo.smtp_info.provider}` 
                                    : 'Email provider not supported'
                                  }
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.text.secondary,
                                display: 'block'
                              }}>
                                {emailSupportInfo.smtp_info?.message || emailSupportInfo.send_capability?.message}
                              </Typography>
                              {emailSupportInfo.send_capability?.mode === 'no_config' && (
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.info.main,
                                  display: 'block',
                                  mt: 0.5,
                                  backgroundColor: theme.palette.info.main + '10',
                                  padding: 1,
                                  borderRadius: 1,
                                  border: `1px solid ${theme.palette.info.main}30`
                                }}>
                                  🔧 开发模式：验证码将显示在服务器控制台中，请查看服务器日志获取验证码
                                </Typography>
                              )}
                            </Box>
                          )}
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
                        helperText="Password must be at least 6 characters"
                        sx={{ 
                          mb: 3,
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
                        helperText="Please confirm your password"
                        sx={{ 
                          mb: 3,
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
                        mb: 3, 
                        p: 3, 
                        borderRadius: 3, 
                        backgroundColor: theme.palette.primary.main + '08',
                        border: `1px solid ${theme.palette.primary.main}20`,
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        }
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Email sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                          Verification code sent to
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                        {formData.email}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 1, display: 'block' }}>
                        Please check your email (including spam folder)
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
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1.2rem',
                          letterSpacing: '0.3em',
                          textAlign: 'center',
                          fontFamily: 'monospace'
                        }
                      }}
                      inputProps={{ 
                        maxLength: 6,
                        style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.3em' }
                      }}
                      helperText="Please enter 6-digit verification code"
                      placeholder="000000"
                    />

                    {/* Countdown progress bar */}
                    {countdown > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Resend verification code
                          </Typography>
                          <Chip 
                            label={`Resend in ${countdown}s`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={((60 - countdown) / 60) * 100}
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: theme.palette.primary.main + '20',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    )}

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setRegistrationStep(0);
                          setCountdown(0);
                        }}
                        disabled={loading}
                        sx={{ borderRadius: 2 }}
                      >
                        Back to Edit Email
                      </Button>
                      <Button
                        variant={countdown > 0 ? "outlined" : "contained"}
                        onClick={handleSendVerificationCode}
                        disabled={loading || sendingCode || countdown > 0}
                        sx={{ 
                          borderRadius: 2,
                          minWidth: 120
                        }}
                      >
                        {sendingCode ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <span>Sending...</span>
                          </Box>
                        ) : countdown > 0 ? (
                          `Resend in ${countdown}s`
                        ) : (
                          'Resend'
                        )}
                      </Button>
                      </Box>
                    </Box>
                  </Fade>
                )}
                {isLoginMode && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="emailOrUsername"
                    label="Email or Username"
                    name="emailOrUsername"
                    autoComplete="username"
                    autoFocus={!isMobile}
                    value={formData.emailOrUsername}
                    onChange={handleChange}
                    disabled={loading}
                    error={Boolean(error)}
                    helperText="Enter your email address or admin username"
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
                )}

                {isLoginMode && (
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
                    onClick={handleForgotPassword}
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
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || sendingCode}
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
                  {loading || sendingCode ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <Typography variant="button">
                        {isLoginMode 
                          ? 'Signing In...' 
                          : sendingCode 
                            ? 'Sending Code...'
                            : registrationStep === 0 
                              ? 'Sending Code...' 
                              : 'Creating Account...'
                        }
                      </Typography>
                    </Box>
                  ) : (
                    isLoginMode 
                      ? 'Sign In' 
                      : registrationStep === 0 
                        ? 'Send Verification Code' 
                        : 'Complete Registration'
                  )}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, px: 2 }}>
                    or
                  </Typography>
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}{' '}
                    <Link
                      component="button"
                      type="button"
                      onClick={toggleMode}
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
                      {isLoginMode ? 'Create Account' : 'Sign In'}
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
