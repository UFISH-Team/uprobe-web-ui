import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

export const GenomeHeader: React.FC = () => {
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        mb: 4,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 2,
        px: { xs: 2, sm: 4, md: 6, lg: 8 }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        maxWidth: '1800px',
        margin: '0 auto'
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            🧬 U-Probe Genome Manager
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              mt: 0.5
            }}
          >
            Manage reference genomes and annotation files for your probe design projects.
            Select an existing genome or create a new one to get started.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default GenomeHeader;