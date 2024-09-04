import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Menu,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const Genome: React.FC = () => {
  const [files, setFiles] = useState<Array<{ id: number; name: string; type: string; date: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState('All Databases');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [fileId, setFileId] = useState(1); // 用于唯一标识文件

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const newFiles = Array.from(event.target.files || []).map((file) => ({
      id: fileId + Math.random(),
      name: file.name,
      type: fileType,
      date: new Date().toLocaleDateString(),
    }));
    setFiles([...files, ...newFiles]);
    setFileId(fileId + newFiles.length); // 更新文件 ID
    setAnchorEl(null); // Close the menu after selection
  };

  const handleFileDelete = (fileId: number) => {
    setFiles(files.filter((file) => file.id !== fileId));
  };

  const handleSaveToDatabase = (fileName: string) => {
    alert(`Saving ${fileName} to database...`);
    // 这里可以添加实际的保存逻辑，例如调用 API 将文件信息保存到数据库
  };

  const handleSearch = () => {
    console.log(`Searching for "${searchQuery}" in "${selectedDatabase}" database`);
    // 实际的搜索操作可以在这里实现，例如调用 API 或过滤数据
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ padding: 10 }}>
      <Typography variant="h6" gutterBottom>🗄️ U-Probe Database</Typography>

      {/* 搜索公共数据库的搜索栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <FormControl sx={{ minWidth: 120, marginRight: 2 }}>
          <Select
            labelId="database-select-label"
            value={selectedDatabase}
            onChange={(e) => setSelectedDatabase(e.target.value)}
          >
            <MenuItem value="All Databases">Species</MenuItem>
            <MenuItem value="Database 1">Database 1</MenuItem>
            <MenuItem value="Database 2">Database 2</MenuItem>
            <MenuItem value="Database 3">Database 3</MenuItem>
          </Select>
        </FormControl>
        <TextField
          placeholder="Enter search term..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, marginRight: 2 }}
        />
        <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {/* 上传文件信息展示区 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <Typography variant="h6">📤 Uploaded Files</Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          endIcon={<ArrowDropDownIcon />}
          onClick={handleMenuClick}
        >
          Upload
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem component="label">
            Upload genome file
            <input
              type="file"
              hidden
              onChange={(e) => handleFileUpload(e, 'Genome')}
            />
          </MenuItem>
          <MenuItem component="label">
            Upload annotation file
            <input
              type="file"
              hidden
              onChange={(e) => handleFileUpload(e, 'Annotation')}
            />
          </MenuItem>
          <MenuItem component="label">
            Upload index file
            <input
              type="file"
              hidden
              onChange={(e) => handleFileUpload(e, 'Index')}
            />
          </MenuItem>
        </Menu>
      </Box>
      
      {/* 使用 Table 展示上传文件信息 */}
      <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>File Type</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{file.date}</TableCell>
                <TableCell>
                  <Button startIcon={<DownloadIcon />} sx={{ marginRight: 1 }}>Download</Button>
                  <Button startIcon={<DeleteIcon />} sx={{ marginRight: 1 }} onClick={() => handleFileDelete(file.id)}>Delete</Button>
                  <Button startIcon={<SaveIcon />} onClick={() => handleSaveToDatabase(file.name)}>Save</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 文件统计信息 */}
      <Grid container spacing={2} justifyContent="center" sx={{ marginY: 2 }}>
        <Grid item>
          <Alert severity="success">Total Files: {files.length}</Alert>
        </Grid>
        <Grid item>
          <Alert severity="success">Genome Files: {files.filter(file => file.type === 'Genome').length}</Alert>
        </Grid>
        <Grid item>
          <Alert severity="success">Annotation Files: {files.filter(file => file.type === 'Annotation').length}</Alert>
        </Grid>
        <Grid item>
          <Alert severity="success">Index Files: {files.filter(file => file.type === 'Index').length}</Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Genome;
