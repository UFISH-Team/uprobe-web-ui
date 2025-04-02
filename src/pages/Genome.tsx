import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Snackbar, 
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import GenomeSelector from '../components/genome/GenomeSelector';
import FileTable from '../components/genome/FileTable';
import GenomeMetadata from '../components/genome/GenomeMetadata';
import { useGenomeData } from '../components/genome/hooks/useGenomeData';
import { useFileOperations } from '../components/genome/hooks/useFileOperations';
import { useNotification } from '../components/genome/hooks/useNotification';
import { GenomeHeader } from '../components/genome/GenomeHeader';
import { GenomeInfoPanel } from '../components/genome/GenomeInfoPanel';
import { useGenomeStatsVisualization } from '../components/genome/GenomeStatsVisualization';

const Genome: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Custom hooks for better separation of concerns
  const { genomes, selectedGenome, setSelectedGenome, customGenome, setCustomGenome, fetchGenomes, deleteGenome } = useGenomeData();
  const { files, handleFileUpload, deleteFile, downloadFile } = useFileOperations(selectedGenome, customGenome);
  const { notification, hideNotification } = useNotification();
  const [showMetadata, setShowMetadata] = useState<boolean>(!isMobile);

  // Get stats visualization component
  const StatsVisualization = useGenomeStatsVisualization(selectedGenome || '', files);

  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  // Update showMetadata based on screen size
  useEffect(() => {
    setShowMetadata(!isMobile);
  }, [isMobile]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default
      }}
    >
      <GenomeHeader />
      
      <Box 
        sx={{ 
          flex: 1,
          width: '100%',
          maxWidth: '1800px',
          margin: '0 auto',
          padding: {
            xs: 1,
            sm: 2,
            md: 3,
            lg: 4
          }
        }}
      >
        <Paper 
          elevation={2}
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Top Section: Genome Selection and Quick Stats */}
          <Box sx={{ p: 3, bgcolor: theme.palette.background.default }}>
            <GenomeSelector 
              genomes={genomes}
              selectedGenome={selectedGenome}
              setSelectedGenome={setSelectedGenome}
              customGenome={customGenome}
              setCustomGenome={setCustomGenome}
              onUpload={handleFileUpload}
              onDeleteGenome={deleteGenome}
              showMetadata={() => setShowMetadata(!showMetadata)}
            />
          </Box>

          <Divider />

          {/* Main Content Area */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '3fr 1fr'
              },
              gap: 0,
              minHeight: '600px'
            }}
          >
            {/* Left Side: File Table */}
            <Box 
              sx={{ 
                borderRight: { md: `1px solid ${theme.palette.divider}` },
                bgcolor: theme.palette.background.paper,
                p: 3
              }}
            >
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Genome Files
                </Typography>
                <FileTable 
                  files={files} 
                  onDelete={deleteFile} 
                  onDownload={downloadFile} 
                />
              </Box>

              {!isTablet && selectedGenome && (
                <Box sx={{ mt: 4 }}>
                  {StatsVisualization}
                </Box>
              )}
            </Box>

            {/* Right Side: Info Panels */}
            <Box 
              sx={{ 
                bgcolor: theme.palette.grey[50],
                display: { xs: showMetadata ? 'block' : 'none', md: 'block' },
                p: 3,
                position: 'relative'
              }}
            >
              {isMobile && (
                <IconButton
                  onClick={() => setShowMetadata(false)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              )}

              {selectedGenome ? (
                <>
                  <GenomeInfoPanel 
                    genomeName={selectedGenome}
                    fileCount={files.length}
                  />
                  <GenomeMetadata genomeName={selectedGenome} />
                  {isTablet && StatsVisualization}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="text.secondary">
                    Select a genome to view detailed information
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Genome;