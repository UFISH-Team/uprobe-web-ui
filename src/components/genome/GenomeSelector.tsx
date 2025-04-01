import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  Button
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

interface GenomeSelectorProps {
  genomes: string[];
  selectedGenome: string;
  setSelectedGenome: (genome: string) => void;
  customGenome: string;
  setCustomGenome: (genome: string) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteGenome: () => void;
  showMetadata: () => void;
}

const GenomeSelector: React.FC<GenomeSelectorProps> = ({
  genomes,
  selectedGenome,
  setSelectedGenome,
  customGenome,
  setCustomGenome,
  onUpload,
  onDeleteGenome,
  showMetadata
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGenomeChange = (event: any) => {
    setSelectedGenome(event.target.value);
    setCustomGenome('');
  };

  const handleCustomGenomeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCustomGenome(event.target.value);
    setSelectedGenome('');
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 2,
        mb: 3,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}
    >
      <FormControl sx={{ minWidth: 150, flex: { sm: 1 } }}>
        <Select
          value={selectedGenome}
          onChange={handleGenomeChange}
          displayEmpty
          fullWidth
          sx={{ height: '40px' }}
        >
          <MenuItem value="">
            <em>Select Species</em>
          </MenuItem>
          {genomes.map((genome, index) => (
            <MenuItem key={index} value={genome}>{genome}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        placeholder="Or enter new species..."
        variant="outlined"
        size="small"
        value={customGenome}
        onChange={handleCustomGenomeChange}
        sx={{ flex: { sm: 1 } }}
        InputProps={{ sx: { height: '40px' } }}
      />

      <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
        <Tooltip title="Upload files">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={triggerFileInput}
            startIcon={<CloudUploadIcon />}
            size="small"
          >
            Upload
          </Button>
        </Tooltip>
        <input
          type="file"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={onUpload}
        />

        <Tooltip title="Delete selected genome">
          <IconButton
            color="error"
            onClick={onDeleteGenome}
            disabled={!selectedGenome}
            size="small"
            sx={{ ml: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Toggle metadata panel">
          <IconButton
            color="info"
            onClick={showMetadata}
            size="small"
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <InfoIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default GenomeSelector;