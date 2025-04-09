import React, { useEffect } from 'react';
import { Box, Container, Grid, Typography, Snackbar } from '@mui/material';
import { useGenomeData } from '../components/genome/hooks/useGenomeData';
import { useNotification } from '../components/genome/hooks/useNotification';
import FileUpload from '../components/genome/FileUpload';
import FileList from '../components/genome/FileList';
import GenomeSelector from '../components/genome/GenomeSelector';

const Genome: React.FC = () => {
  const {
    genomes,
    selectedGenome,
    genomeFiles,
    isLoading,
    setSelectedGenome,
    fetchGenomes,
    fetchGenomeFiles,
    uploadGenomeFile,
    deleteGenomeFile,
    downloadGenomeFile,
    addGenome,
    deleteGenome,
  } = useGenomeData();

  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  useEffect(() => {
    if (selectedGenome) {
      fetchGenomeFiles(selectedGenome);
    }
  }, [selectedGenome, fetchGenomeFiles]);

  const handleFileUpload = async (file: File) => {
    if (!selectedGenome) {
      showNotification('Please select a genome first', 'error');
      return;
    }
    await uploadGenomeFile(selectedGenome, file);
  };

  const handleFileDelete = async (fileName: string) => {
    if (!selectedGenome) return;
    await deleteGenomeFile(selectedGenome, fileName);
  };

  const handleFileDownload = async (fileName: string) => {
    if (!selectedGenome) return;
    await downloadGenomeFile(selectedGenome, fileName);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Genome Management
      </Typography>

      <Grid container spacing={3}>
        {/* Left Column: Genome Selection and File Upload */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Genome
            </Typography>
            <GenomeSelector
              genomes={genomes}
              selectedGenome={selectedGenome}
              onSelectGenome={setSelectedGenome}
              onAddGenome={addGenome}
              onDeleteGenome={deleteGenome}
              isLoading={isLoading}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Files
            </Typography>
            <FileUpload
              onUpload={handleFileUpload}
              disabled={!selectedGenome || isLoading}
            />
          </Box>
        </Grid>

        {/* Right Column: File List */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Files
            </Typography>
            <FileList
              files={genomeFiles.map(fileName => ({
                id: fileName,
                name: fileName,
                type: fileName.split('.').pop() || '',
                size: 0,
                path: '',
                createdAt: '',
                updatedAt: '',
                genomeId: selectedGenome || '',
              }))}
              onDownload={handleFileDownload}
              onDelete={handleFileDelete}
              isLoading={isLoading}
            />
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default Genome;