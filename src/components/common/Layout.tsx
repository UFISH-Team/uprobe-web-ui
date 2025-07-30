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
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        py: { xs: 2, sm: 3, md: 4 },
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
              p: { xs: 2, sm: 3, md: padding },
              backgroundColor: 'background.paper',
              borderRadius: 3,
              width: '100%',
              boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
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
