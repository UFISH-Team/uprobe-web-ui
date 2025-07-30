import React from 'react';
import { 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar, 
  Typography, 
  Divider,
  ListItemIcon,
  ListItemText,
  Badge,
  useTheme,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  AccountCircle,
  Person,
  Settings,
  ExitToApp,
  AdminPanelSettings,
  Notifications,
  Security
} from '@mui/icons-material';

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  // Mock user data - in real app, this would come from context/state
  const currentUser = {
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@uprobe.com',
    role: 'Administrator',
    avatar: null, // could be a URL
    notifications: 3,
    isOnline: true
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(`/account/${path}`);
    handleClose();
  };

  const menuItems = [
    {
      label: 'My Profile',
      icon: <Person />,
      path: 'profile',
      description: 'Manage your personal information'
    },
    {
      label: 'Account Security',
      icon: <Security />,
      path: 'my-account',
      description: 'Password and security settings'
    },
    {
      label: 'Preferences',
      icon: <Settings />,
      path: 'settings',
      description: 'Customize your experience'
    }
  ];

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleMenu}
        color="inherit"
        sx={{
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
          }
        }}
      >
        <Badge
          color="error"
          badgeContent={currentUser.notifications}
          overlap="circular"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: currentUser.avatar 
                ? 'transparent' 
                : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              border: currentUser.isOnline ? `3px solid ${theme.palette.success.main}` : 'none',
              fontSize: '1.1rem',
              fontWeight: 600
            }}
            src={currentUser.avatar || undefined}
          >
            {!currentUser.avatar && currentUser.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
        </Badge>
      </IconButton>
      
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 320,
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'translateX(4px)',
              },
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: currentUser.avatar 
                  ? 'transparent' 
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                fontSize: '1.2rem',
                fontWeight: 600
              }}
              src={currentUser.avatar || undefined}
            >
              {!currentUser.avatar && currentUser.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {currentUser.name}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5 }}>
                {currentUser.email}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={currentUser.role}
                  size="small"
                  icon={<AdminPanelSettings />}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    backgroundColor: theme.palette.secondary.light,
                    color: 'white',
                  }}
                />
                {currentUser.isOnline && (
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: theme.palette.success.main,
                    fontSize: '0.75rem'
                  }}>
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.success.main,
                      animation: 'pulse 2s infinite'
                    }} />
                    Online
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <MenuItem 
            key={index}
            onClick={() => handleMenuItemClick(item.path)}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText>
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {item.description}
              </Typography>
            </ListItemText>
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Logout */}
        <MenuItem 
          onClick={() => handleMenuItemClick('logout')}
          sx={{ 
            py: 1.5,
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: `${theme.palette.error.main}10`,
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
              Sign Out
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Securely logout from your account
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AccountMenu;
