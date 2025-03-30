import React, { useState, useEffect } from 'react';
import { Box, Typography, Snackbar } from '@mui/material';
import GenomeSelector from '../components/genome/GenomeSelector';
import FileTable from '../components/genome/FileTable';
import GenomeMetadata from '../components/genome/GenomeMetadata';
import { useGenomeData } from '../components/genome/hooks/useGenomeData';
import { useFileOperations } from '../components/genome/hooks/useFileOperations';
import { useNotification } from '../components/genome/hooks/useNotification';
import { GenomeHeader } from '../components/genome/GenomeHeader';
import { GenomeInfoPanel } from '../components/genome/GenomeinfoPanel';

const Genome: React.FC = () => {
  // Custom hooks for better separation of concerns
  const { genomes, selectedGenome, setSelectedGenome, customGenome, setCustomGenome, fetchGenomes, deleteGenome } = useGenomeData();
  const { files, handleFileUpload, deleteFile, downloadFile } = useFileOperations(selectedGenome, customGenome);
  const { notification, showNotification, hideNotification } = useNotification();
  const [showMetadata, setShowMetadata] = useState<boolean>(false);

  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  return (
    <Box 
      sx={{ 
        padding: { xs: 2, sm: 4, md: 6, lg: 8 },
        maxWidth: '1400px',
        margin: '0 auto'
      }}
    >
      <GenomeHeader />
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 4
        }}
      >
        {/* Main content area - 2/3 width on larger screens */}
        <Box sx={{ flex: { md: 4 }, width: '100%' }}>
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
          
          <FileTable 
            files={files} 
            onDelete={deleteFile} 
            onDownload={downloadFile} 
          />
        </Box>
        
        {/* Side panel - 1/3 width on larger screens */}
        <Box sx={{ 
          flex: { md: 1 }, 
          width: '100%',
          display: { xs: showMetadata ? 'block' : 'none', md: 'block' }
        }}>
          {selectedGenome && (
            <GenomeInfoPanel 
              genomeName={selectedGenome}
              fileCount={files.length}
            />
          )}
          
          {selectedGenome && (
            <GenomeMetadata genomeName={selectedGenome} />
          )}
        </Box>
      </Box>

      <Snackbar
        open={notification.open}
        onClose={hideNotification}
        message={notification.message}
        autoHideDuration={3000}
      />
    </Box>
  );
};

export default Genome;