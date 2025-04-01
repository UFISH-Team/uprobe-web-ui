import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import MemoryIcon from '@mui/icons-material/Memory';

export const GenomeHeader: React.FC = () => {
  return (
    <Box sx={{ mb: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center' }}
          color="inherit"
          href="/"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <MemoryIcon sx={{ mr: 0.5 }} fontSize="small" />
          Genome Management
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 500 }}>
        🧬 U-Probe Genome Manager
      </Typography>
      
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
        Manage reference genomes and annotation files for your probe design projects.
        Select an existing genome or create a new one to get started.
      </Typography>
    </Box>
  );
};

export default GenomeHeader;