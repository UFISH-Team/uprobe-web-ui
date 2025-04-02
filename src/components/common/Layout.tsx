import React from 'react';
import { Box, Container, Paper } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  padding = 2
}) => {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // 减去AppBar的高度
        backgroundColor: 'background.default',
        py: padding,
        width: '100%',
      }}
    >
      <Container 
        maxWidth={false}
        sx={{
          width: '100%',
          maxWidth: '100% !important',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: padding,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            width: '100%',
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default Layout; 