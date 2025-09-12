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
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Person,
  Settings,
  ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl } from '../../utils';

const AccountMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuth();

  // User data with fallback values
  const currentUser = {
    name: user?.full_name || user?.username || 'Unknown User',
    email: user?.email || 'No email set',
    role: 'User',
    avatar: getAvatarUrl(user?.avatar_url),
    notifications: 0,
    isOnline: true
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = async (path: string) => {
    if (path === 'logout') {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
      }
    } else {
      navigate(`/account/${path}`);
    }
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
      label: 'Preferences',
      icon: <Settings />,
      path: 'settings',
      description: 'Customize your experience and notification settings'
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
          elevation: 4,
          sx: {
            mt: 1.5,
            minWidth: 280,
            borderRadius: 2,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 1,
              my: 0.5,
              transition: 'all 0.15s',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
          },
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                background: currentUser.avatar 
                  ? 'transparent' 
                  : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                fontSize: '1.1rem',
                fontWeight: 600
              }}
              src={currentUser.avatar || undefined}
            >
              {!currentUser.avatar && currentUser.name.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {currentUser.name}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {currentUser.email}
              </Typography>
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
            <ListItemIcon sx={{ minWidth: 36 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {item.label}
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
              backgroundColor: `${theme.palette.error.main}08`,
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Sign Out
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AccountMenu;
