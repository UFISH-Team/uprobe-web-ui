import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface GenomeSelectorProps {
  genomes: string[];
  selectedGenome: string | null;
  onSelectGenome: (genomeName: string) => void;
  onAddGenome: (genomeName: string) => void;
  onDeleteGenome: (genomeName: string) => void;
  isLoading?: boolean;
}

const GenomeSelector: React.FC<GenomeSelectorProps> = ({
  genomes,
  selectedGenome,
  onSelectGenome,
  onAddGenome,
  onDeleteGenome,
  isLoading = false,
}) => {
  const [newGenomeName, setNewGenomeName] = React.useState('');

  const handleAddGenome = () => {
    if (newGenomeName.trim()) {
      onAddGenome(newGenomeName.trim());
      setNewGenomeName('');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="genome-select-label">Select Genome</InputLabel>
        <Select
          labelId="genome-select-label"
          value={selectedGenome || ''}
          label="Select Genome"
          onChange={(e) => onSelectGenome(e.target.value)}
        >
          {genomes.map((genome) => (
            <MenuItem key={genome} value={genome}>
              {genome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          label="New Genome Name"
          value={newGenomeName}
          onChange={(e) => setNewGenomeName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddGenome();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddGenome}
          disabled={!newGenomeName.trim()}
          startIcon={<AddIcon />}
        >
          Add
        </Button>
      </Box>

      {selectedGenome && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            color="error"
            onClick={() => onDeleteGenome(selectedGenome)}
            title="Delete Genome"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default GenomeSelector;