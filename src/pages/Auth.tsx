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
  const { login, register } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
    full_name: '',
    email: ''  // 仅用于注册
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: 输入邮箱, 1: 输入代码和新密码
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
    resetCode: '',
    newPassword: ''
  });
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // 邮箱格式验证
  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(163\.com|gmail\.com)$/i;
    return emailPattern.test(email);
  };
  
  // 检查是否为邮箱格式
  const isEmailFormat = (input: string): boolean => {
    return input.includes('@');
  };

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
      if (isLoginMode) {
        // 登录模式验证
        if (!formData.emailOrUsername || !formData.password) {
          throw new Error('Please fill in all fields');
        }
        
        // 如果是邮箱格式，需要验证邮箱格式
        if (isEmailFormat(formData.emailOrUsername) && !validateEmail(formData.emailOrUsername)) {
          throw new Error('Only 163.com and Gmail addresses are allowed');
        }
        
        await login(formData.emailOrUsername, formData.password, rememberMe);
      } else {
        // 注册模式验证
        if (!formData.email || !formData.password || !formData.full_name) {
          throw new Error('Please fill in all fields');
        }
        
        // 邮箱格式验证
        if (!validateEmail(formData.email)) {
          throw new Error('Only 163.com and Gmail addresses are allowed');
        }
        
        // 密码验证
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        
        await register(formData.email, formData.password, formData.full_name);
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
      email: ''
    });
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
        // 第一步：发送重置代码
        if (!forgotPasswordData.email) {
          throw new Error('请输入邮箱地址');
        }
        if (!validateEmail(forgotPasswordData.email)) {
          throw new Error('只支持163.com和Gmail邮箱');
        }
        
        await ApiService.forgotPassword(forgotPasswordData.email);
        setForgotPasswordStep(1);
        setError(null);
      } else {
        // 第二步：重置密码
        if (!forgotPasswordData.resetCode || !forgotPasswordData.newPassword) {
          throw new Error('请填写所有字段');
        }
        if (forgotPasswordData.newPassword.length < 6) {
          throw new Error('密码至少需要6位字符');
        }
        
        await ApiService.resetPassword(
          forgotPasswordData.email,
          forgotPasswordData.resetCode,
          forgotPasswordData.newPassword
        );
        
        setForgotPasswordOpen(false);
        setError(null);
        // 显示成功消息
        alert('密码重置成功！请使用新密码登录。');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.message || 
        '操作失败，请重试'
      );
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
                    : 'Join U-Probe platform to start your research journey'
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
                {!isLoginMode && (
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
                )}
                {isLoginMode ? (
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
                ) : (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus={!isMobile}
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    error={Boolean(error)}
                    helperText="Only 163.com and Gmail addresses are supported"
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
                      <Typography variant="button">
                        {isLoginMode ? 'Signing In...' : 'Creating Account...'}
                      </Typography>
                    </Box>
                  ) : (
                    isLoginMode ? 'Sign In' : 'Create Account'
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
                helperText="Only 163.com and Gmail addresses are supported"
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                Enter the 6-digit code sent to your email and your new password.
              </Typography>
              <TextField
                fullWidth
                label="Reset Code"
                value={forgotPasswordData.resetCode}
                onChange={(e) => handleForgotPasswordChange('resetCode', e.target.value)}
                disabled={forgotPasswordLoading}
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 6 }}
                helperText="Check your email for the 6-digit reset code"
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={forgotPasswordData.newPassword}
                onChange={(e) => handleForgotPasswordChange('newPassword', e.target.value)}
                disabled={forgotPasswordLoading}
                helperText="At least 6 characters required"
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
