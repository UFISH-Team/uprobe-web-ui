import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Box,
  Typography,
  TablePagination,
  Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { FileItem } from '../../types';

interface FileTableProps {
  files: FileItem[];
  onDelete: (fileName: string) => void;
  onDownload: (fileName: string) => void;
}

const FileTable: React.FC<FileTableProps> = ({ files, onDelete, onDownload }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Genome File':
        return 'primary';
      case 'Annotation File':
        return 'success';
      case 'Index File':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Display empty state when no files
  if (files.length === 0) {
    return (
      <Box 
        sx={{ 
          p: 4, 
          textAlign: 'center', 
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow: 1,
          mb: 4
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No files uploaded yet. Select a species and upload files.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="genome files table">
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>File Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((file) => (
                <TableRow key={file.id} hover>
                  <TableCell component="th" scope="row">
                    {file.name}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={file.type} 
                      size="small" 
                      color={getTypeColor(file.type) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{file.size || 'N/A'}</TableCell>
                  <TableCell>{file.date}</TableCell>
                  <TableCell sx={{ width: '20%' }}>
                    {file.isUploading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={file.progress} 
                          sx={{ flex: 1, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption">{file.progress}%</Typography>
                      </Box>
                    ) : (
                      <Chip label="Completed" size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download file">
                      <IconButton 
                        color="primary" 
                        onClick={() => onDownload(file.name)}
                        disabled={file.isUploading}
                        size="small"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete file">
                      <IconButton 
                        color="error" 
                        onClick={() => onDelete(file.name)}
                        disabled={file.isUploading}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={files.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default FileTable;