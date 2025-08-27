import React from 'react';
import { Box, Container, Paper } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
  noPaper?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  padding = 3,
  noPaper = false
}) => {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)', // 减去AppBar的高度
        backgroundColor: '#fafbfc',
        py: { xs: 2, sm: 3, md: 3 },
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
        {noPaper ? (
          <Box sx={{ width: '100%' }}>
            {children}
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: padding },
              backgroundColor: '#ffffff',
              borderRadius: 2,
              width: '100%',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(226, 232, 240, 0.6)',
            }}
          >
            {children}
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Layout; 
