import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemButton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
  CircularProgress,
  Fab,
  Tooltip,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  OutlinedInput,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CreateNewFolder as CreateFolderIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Search as SearchIcon,
  FolderDelete as FolderDeleteIcon,
} from '@mui/icons-material';
import { useGenomeData } from '../hooks/useGenomeData';
import { useNotification } from '../hooks/useNotification';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  path: string;
}

interface GenomeItem {
  name: string;
  isPreset: boolean;
}

const Genome: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  
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

  const { showNotification } = useNotification();

  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showAddGenomeDialog, setShowAddGenomeDialog] = useState(false);
  const [newGenomeName, setNewGenomeName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<FileItem[]>([]);
  const [showDeleteGenomeDialog, setShowDeleteGenomeDialog] = useState(false);
  const [genomeToDelete, setGenomeToDelete] = useState<string>('');
  const [genomeList, setGenomeList] = useState<GenomeItem[]>([]);

  // Load genomes on component mount
  useEffect(() => {
    fetchGenomes();
  }, [fetchGenomes]);

  // Convert genomes to GenomeItem format with preset information
  useEffect(() => {
    // 这里假设预设的基因组列表，实际应该从后端获取或配置文件中读取
    const presetGenomes = ['hg38', 'hg19', 'mm10', 'mm9'];
    const items = genomes.map(genome => ({
      name: genome,
      isPreset: presetGenomes.includes(genome)
    }));
    setGenomeList(items);
  }, [genomes]);

  const handleDeleteGenome = async () => {
    if (!genomeToDelete) return;
    
    const genomeItem = genomeList.find(g => g.name === genomeToDelete);
    if (!genomeItem || genomeItem.isPreset) {
      showNotification('Cannot delete preset genome', 'error');
      return;
    }

    try {
      await deleteGenome(genomeToDelete);
      setShowDeleteGenomeDialog(false);
      setGenomeToDelete('');
      showNotification('Genome deleted successfully', 'success');
      
      // If the deleted genome was selected, clear the selection
      if (selectedGenome === genomeToDelete) {
        setSelectedGenome('');
      }
    } catch (error) {
      showNotification('Failed to delete genome', 'error');
    }
  };

  // Load files when genome is selected
  useEffect(() => {
    if (selectedGenome) {
      fetchGenomeFiles(selectedGenome);
      setCurrentPath([]);
    }
  }, [selectedGenome, fetchGenomeFiles]);

  // Convert API files to FileItem format
  useEffect(() => {
    if (genomeFiles) {
      const items: FileItem[] = genomeFiles.map(file => ({
        name: file,
        type: 'file',
        size: 0,
        modified: new Date().toISOString(),
        path: currentPath.length > 0 ? `${currentPath.join('/')}/${file}` : file,
      }));
      setFileItems(items);
      setFilteredItems(items);
    }
  }, [genomeFiles, currentPath]);

  const handleGenomeSelect = (genomeName: string) => {
    setSelectedGenome(genomeName);
    setSelectedFiles(new Set());
  };

  const handleFileSelect = (fileName: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
  };

  const handleFileDownload = async (fileName: string) => {
    if (!selectedGenome) return;
    try {
      await downloadGenomeFile(selectedGenome, fileName);
    } catch (error) {
      showNotification('Failed to download file', 'error');
    }
  };

  const handleFileDelete = async (fileName: string) => {
    if (!selectedGenome) return;
    try {
      await deleteGenomeFile(selectedGenome, fileName);
      showNotification('File deleted successfully', 'success');
      fetchGenomeFiles(selectedGenome); // Refresh the file list
    } catch (error) {
      showNotification('Failed to delete file', 'error');
    }
  };

  const handleFolderDelete = async (folderPath: string) => {
    if (!selectedGenome) return;
    try {
      // Delete all files in the folder
      const folderFiles = fileItems.filter(item => 
        item.path?.startsWith(folderPath) || item.name.startsWith(folderPath)
      );
      
      for (const file of folderFiles) {
        await deleteGenomeFile(selectedGenome, file.name);
      }
      
      showNotification('Folder deleted successfully', 'success');
      fetchGenomeFiles(selectedGenome); // Refresh the file list
    } catch (error) {
      showNotification('Failed to delete folder', 'error');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredItems(fileItems);
      return;
    }
    
    const filtered = fileItems.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleAddGenome = async () => {
    if (!newGenomeName.trim()) return;
    try {
      await addGenome(newGenomeName.trim());
      setShowAddGenomeDialog(false);
      setNewGenomeName('');
    } catch (error) {
      showNotification('Failed to add genome', 'error');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedGenome || uploadFiles.length === 0) return;
    
    try {
      for (const file of uploadFiles) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        await uploadGenomeFile(selectedGenome, file);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
      setShowUploadDialog(false);
      setUploadFiles([]);
      setUploadProgress({});
      showNotification('Files uploaded successfully', 'success');
    } catch (error) {
      showNotification('Failed to upload files', 'error');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
  };

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(prev => [...prev, ...files]);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'fasta':
      case 'fa':
        return '🧬';
      case 'fastq':
      case 'fq':
        return '📊';
      case 'bam':
        return '📈';
      case 'vcf':
        return '🔍';
      case 'gtf':
      case 'gff':
        return '📋';
      case 'txt':
        return '📄';
      default:
        return '📁';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          🧬 Genome Browser
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and manage genome files for probe design
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Header with Genome Selection and Search */}
        <Grid item xs={12}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="genome-select-label">Select Genome</InputLabel>
                      <Select
                        labelId="genome-select-label"
                        value={selectedGenome || ''}
                        onChange={(e) => handleGenomeSelect(e.target.value)}
                        label="Select Genome"
                      >
                        {genomeList.map((genome) => (
                          <MenuItem 
                            key={genome.name} 
                            value={genome.name}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FolderIcon 
                                fontSize="small" 
                                color={selectedGenome === genome.name ? 'primary' : 'inherit'}
                              />
                              <Typography>
                                {genome.name}
                                {genome.isPreset && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ 
                                      ml: 1,
                                      color: 'text.secondary',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    (preset)
                                  </Typography>
                                )}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowAddGenomeDialog(true)}
                        startIcon={<AddIcon />}
                        sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                      >
                        Add
                      </Button>
                      {selectedGenome && !genomeList.find(g => g.name === selectedGenome)?.isPreset && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setGenomeToDelete(selectedGenome);
                            setShowDeleteGenomeDialog(true);
                          }}
                          startIcon={<DeleteIcon />}
                          color="error"
                          sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                        >
                          Delete
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={9}>
                  <FormControl fullWidth size="small">
                    <OutlinedInput
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      startAdornment={
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* File Browser Panel */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              {selectedGenome ? (
                <>
                  {/* Header with breadcrumbs and actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => setCurrentPath([])}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <HomeIcon fontSize="small" />
                          {selectedGenome}
                        </Link>
                        {currentPath.map((path, index) => (
                          <Link
                            key={index}
                            component="button"
                            variant="body2"
                            onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                          >
                            {path}
                          </Link>
                        ))}
                      </Breadcrumbs>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Refresh">
                        <IconButton size="small" onClick={() => fetchGenomeFiles(selectedGenome)}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<UploadIcon />}
                        onClick={() => setShowUploadDialog(true)}
                      >
                        Upload
                      </Button>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* File List */}
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (searchQuery ? filteredItems : fileItems).length > 0 ? (
                    <List>
                      {(searchQuery ? filteredItems : fileItems).map((item) => (
                        <ListItem
                          key={item.name}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '& .MuiListItemButton-root': {
                              '&.Mui-selected': {
                                backgroundColor: theme.palette.action.selected,
                              },
                            },
                          }}
                        >
                          <ListItemButton
                            selected={selectedFiles.has(item.name)}
                            onClick={() => handleFileSelect(item.name)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon>
                              <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                                {item.type === 'folder' ? '📁' : getFileIcon(item.name)}
                              </Typography>
                            </ListItemIcon>
                            <ListItemText
                              primary={item.name}
                              secondary={
                                <>
                                  {item.type === 'folder' ? 'Folder' : (item.size ? formatFileSize(item.size) : '')}
                                  {item.modified && ` • ${new Date(item.modified).toLocaleDateString()}`}
                                </>
                              }
                              primaryTypographyProps={{
                                fontSize: '0.9rem',
                                fontWeight: 500,
                              }}
                            />
                          </ListItemButton>
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {item.type === 'file' ? (
                                <>
                                  <Tooltip title="View">
                                    <IconButton size="small">
                                      <ViewIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Download">
                                    <IconButton 
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileDownload(item.name);
                                      }}
                                    >
                                      <DownloadIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Tooltip title="Delete Folder">
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFolderDelete(item.path);
                                    }}
                                    sx={{ color: theme.palette.error.main }}
                                  >
                                    <FolderDeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    item.type === 'folder' ? handleFolderDelete(item.path) : handleFileDelete(item.name);
                                  }}
                                  sx={{ color: theme.palette.error.main }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {searchQuery 
                          ? 'No files match your search'
                          : selectedGenome
                            ? 'No files found in this genome'
                            : 'Select a genome to browse files'
                        }
                      </Typography>
                      {selectedGenome && !searchQuery && (
                        <Button
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={() => setShowUploadDialog(true)}
                        >
                          Upload Files
                        </Button>
                      )}
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Select a genome to browse files
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Genome Dialog */}
      <Dialog open={showAddGenomeDialog} onClose={() => setShowAddGenomeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Genome</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Genome Name"
            fullWidth
            variant="outlined"
            value={newGenomeName}
            onChange={(e) => setNewGenomeName(e.target.value)}
            placeholder="Enter genome name (e.g., hg38, mm10)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddGenomeDialog(false)}>Cancel</Button>
          <Button onClick={handleAddGenome} variant="contained" disabled={!newGenomeName.trim()}>
            Add Genome
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Genome Confirmation Dialog */}
      <Dialog
        open={showDeleteGenomeDialog}
        onClose={() => {
          setShowDeleteGenomeDialog(false);
          setGenomeToDelete('');
        }}
      >
        <DialogTitle>Delete Genome</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the genome "{genomeToDelete}"? This action cannot be undone.
          </Typography>
          <Typography color="error" sx={{ mt: 2 }}>
            Warning: All files associated with this genome will be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowDeleteGenomeDialog(false);
              setGenomeToDelete('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteGenome}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Files Dialog */}
      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload Files to {selectedGenome}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <input
              ref={folderInputRef}
              type="file"
              multiple
              {...({ webkitdirectory: '' } as any)}
              style={{ display: 'none' }}
              onChange={handleFolderUpload}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Select Files
              </Button>
              <Button
                variant="outlined"
                startIcon={<CreateFolderIcon />}
                onClick={() => folderInputRef.current?.click()}
              >
                Select Folder
              </Button>
            </Box>

            {uploadFiles.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files ({uploadFiles.length})
                </Typography>
                <List dense>
                  {uploadFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <FileIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                      {uploadProgress[file.name] !== undefined && (
                        <CircularProgress size={20} variant="determinate" value={uploadProgress[file.name]} />
                      )}
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={uploadFiles.length === 0 || isLoading}
          >
            Upload Files
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      {isMobile && selectedGenome && (
        <Fab
          color="primary"
          aria-label="upload"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowUploadDialog(true)}
        >
          <UploadIcon />
        </Fab>
      )}
    </Container>
  );
};

export default Genome; 