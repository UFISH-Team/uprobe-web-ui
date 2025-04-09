import React, { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, disabled = false }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'text/plain': ['.txt', '.fasta', '.fa', '.fna', '.faa', '.ffn', '.frn'],
      'application/gzip': ['.gz'],
      'application/zip': ['.zip'],
    },
    maxFiles: 1,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        '&:hover': {
          borderColor: disabled ? 'grey.300' : 'primary.main',
        },
      }}
    >
      <input {...getInputProps()} />
      <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {isDragActive ? 'Drop the file here' : 'Drag and drop a file here'}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        or
      </Typography>
      <Button
        variant="contained"
        component="span"
        disabled={disabled}
      >
        Select File
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Supported formats: .txt, .fasta, .fa, .fna, .faa, .ffn, .frn, .gz, .zip
      </Typography>
    </Box>
  );
};

export default FileUpload; 