import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import { GenomeMetadata as GenomeMetadataType } from '../../types';

interface GenomeMetadataProps {
  metadata: GenomeMetadataType | null;
  isLoading?: boolean;
}

const GenomeMetadata: React.FC<GenomeMetadataProps> = ({
  metadata,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!metadata) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No metadata available
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Genome Metadata
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Species
          </Typography>
          <Typography variant="body1">
            {metadata.species}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Assembly
          </Typography>
          <Typography variant="body1">
            {metadata.assembly}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Version
          </Typography>
          <Typography variant="body1">
            {metadata.version}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Source
          </Typography>
          <Typography variant="body1">
            {metadata.source}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            Description
          </Typography>
          <Typography variant="body1">
            {metadata.description}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Created At
          </Typography>
          <Typography variant="body1">
            {new Date(metadata.createdAt).toLocaleString()}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Last Updated
          </Typography>
          <Typography variant="body1">
            {new Date(metadata.updatedAt).toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GenomeMetadata;