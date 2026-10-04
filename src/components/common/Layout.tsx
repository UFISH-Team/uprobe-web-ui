import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  maxWidth = false,
  padding = 3,
  fullWidth = false
}) => {
  const hasPageContainer = ['/home', '/design/designworkflow', '/design/customprobe', '/tutorial'].includes(useLocation().pathname);
  return (
    <Box
      sx={{
        minHeight: hasPageContainer ? 0 : 'calc(100vh - 64px)', // Subtract AppBar height
        backgroundColor: 'background.default',
        width: '100%',
      }}
    >
      {fullWidth || hasPageContainer ? (
        <Box
          sx={{
            py: hasPageContainer ? 0 : { xs: 2, sm: 3, md: padding },
            px: hasPageContainer ? 0 : { xs: 2, sm: 3, md: 3 },
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
