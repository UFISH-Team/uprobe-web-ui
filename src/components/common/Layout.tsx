import React from 'react';
import { Box, Container } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  maxWidth = 'lg',
  padding = 3,
  fullWidth = false
}) => {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // 减去AppBar的高度
        backgroundColor: 'background.default',
        width: '100%',
      }}
    >
      {fullWidth ? (
        <Box
          sx={{
            py: { xs: 2, sm: 3, md: padding },
            px: { xs: 2, sm: 3, md: 3 },
            width: '100%',
          }}
        >
          {children}
        </Box>
      ) : (
        <Container 
          maxWidth={maxWidth}
          sx={{
            py: { xs: 2, sm: 3, md: padding },
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          {children}
        </Container>
      )}
    </Box>
  );
};

export default Layout; 
