import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

interface FileItem {
  id: number;
  name: string;
  type: string;
  date: string;
  progress: number;
  isUploading: boolean;
}

// 文件类型分类函数
const getFileType = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'fa':
    case 'fna':
    case 'fasta':
      return 'Genome File'; // 基因组文件
    case 'gff':
    case 'gtf':
      return 'Annotation File'; // 注释文件
    case 'jf':
    case 'sam':
    case 'bam':
      return 'Index File'; // 比对索引文件
    default:
      return 'Other'; // 无法识别的文件类型
  }
};

const Genome: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedGenome, setSelectedGenome] = useState(''); // 选择的基因组
  const [customGenome, setCustomGenome] = useState(''); // 自定义基因组名称
  const [genomes, setGenomes] = useState<string[]>([]); // 现有基因组列表
  const [openSnackbar, setOpenSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 通过 XMLHttpRequest 上传文件并跟踪进度
  const uploadFile = (file: File, fileId: number, genomeName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `http://127.0.0.1:8123/genomes/${genomeName}/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.id === fileId ? { ...f, progress } : f
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setOpenSnackbar({
            open: true,
            message: `File '${file.name}' uploaded successfully to ${genomeName}`
          });
          resolve();
        } else {
          reject(xhr.responseText); // 失败时处理
        }
      };

      xhr.onerror = () => {
        reject('Network error'); // 网络错误时处理
      };

      // 使用 FormData 发送文件
      const formData = new FormData();
      formData.append('file', file); // 添加文件到表单
      xhr.send(formData); // 发送表单
    });
  };

  // 文件上传逻辑（并发上传）
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const genomeName = customGenome || selectedGenome;

    if (!genomeName) {
      alert("Please select or enter a genome name before uploading files.");
      return;
    }

    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) return;

    const newFiles = uploadedFiles.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: getFileType(file.name),
      date: new Date().toLocaleDateString(),
      progress: 0,
      isUploading: true,
      file // 添加原始的File对象
    }));

    setFiles([...files, ...newFiles]);

    // 并发上传每个文件，并跟踪进度
    const uploadPromises = newFiles.map((file) =>
      uploadFile(file.file, file.id, genomeName)
    );

    // 使用 Promise.all 处理并发上传
    Promise.all(uploadPromises)
      .then(() => {
        console.log('All files uploaded successfully');
      })
      .catch(() => {
        console.error('Some uploads failed');
      });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除文件逻辑
  const deleteFile = async (fileName: string) => {
    try {
      const encodedFileName = encodeURIComponent(fileName);  // URL 编码文件名
      const response = await fetch(`http://127.0.0.1:8123/genomes/${selectedGenome}/files/${encodedFileName}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        setOpenSnackbar({
          open: true,
          message: `File '${fileName}' deleted successfully from ${selectedGenome}`
        });
        setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
      } else {
        throw new Error('File deletion failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setOpenSnackbar({ open: true, message: `Error deleting file: ${fileName}` });
    }
  };
  
  // 文件下载逻辑
  const downloadFile = async (fileName: string) => {
    try {
      const encodedFileName = encodeURIComponent(fileName);  // 对文件名进行URL编码
      const response = await fetch(`http://127.0.0.1:8123/genomes/${selectedGenome}/files/${encodedFileName}`);
  
      if (response.ok) {
        const blob = await response.blob(); // 获取文件的二进制数据
        const url = window.URL.createObjectURL(blob); // 创建Blob对象URL
        const link = document.createElement('a'); // 创建一个临时的下载链接
        link.href = url;
        link.setAttribute('download', fileName); // 设置下载文件名
        document.body.appendChild(link);
        link.click(); // 自动触发下载
        link.parentNode?.removeChild(link); // 下载完成后移除临时链接
        setOpenSnackbar({ open: true, message: `File '${fileName}' downloaded successfully` });
      } else {
        throw new Error('File download failed');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setOpenSnackbar({ open: true, message: `Error downloading file: ${fileName}` });
    }
  };

  // 删除物种逻辑
  const deleteGenome = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8123/genomes/${selectedGenome}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOpenSnackbar({
          open: true,
          message: `Genome directory '${selectedGenome}' deleted successfully`
        });
        setGenomes((prevGenomes) => prevGenomes.filter((genome) => genome !== selectedGenome));
        setSelectedGenome('');
        setFiles([]); // 清空文件列表
      } else {
        throw new Error('Genome deletion failed');
      }
    } catch (error) {
      console.error('Error deleting genome:', error);
      setOpenSnackbar({ open: true, message: `Error deleting genome: ${selectedGenome}` });
    }
  };

  // 获取基因组列表
  const fetchGenomes = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8123/genomes');
      const data = await response.json();
      setGenomes(data);
    } catch (error) {
      console.error('Error fetching genomes:', error);
    }
  };

  useEffect(() => {
    fetchGenomes(); // 加载基因组列表
  }, []);

  const handleSnackbarClose = () => {
    setOpenSnackbar({ open: false, message: '' });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box sx={{ padding: 10 }}>
      <Typography variant="h6" gutterBottom>🚀 U-Probe Genome</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mt: 2 , mb: 2}}>
        Please upload your needed files to species directory.
      </Typography>


      {/* 上传文件信息展示区 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <Select
            labelId="genome-select-label"
            value={selectedGenome}
            onChange={(e) => setSelectedGenome(e.target.value)}
            displayEmpty
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
          placeholder="Or enter new species ..."
          variant="outlined"
          size="small"
          value={customGenome}
          onChange={(e) => setCustomGenome(e.target.value)}
          sx={{ width: '200px' }}
        />

        {/* 上传文件按钮（仅图标） */}
        <Tooltip title="Upload files">
          <IconButton color="primary" onClick={triggerFileInput}>
            <CloudUploadIcon />
          </IconButton>
        </Tooltip>
        <input
          type="file"
          multiple
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileUpload}
        />

        {/* 删除物种按钮（仅图标） */}
        <Tooltip title="Delete selected genome">
          <IconButton
            color="secondary"
            onClick={deleteGenome}
            disabled={!selectedGenome}
            aria-label="delete genome"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* 文件信息展示 */}
      <TableContainer component={Paper} sx={{ marginBottom: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>File Type</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Progress</TableCell>
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
                  {file.isUploading ? (
                    <LinearProgress variant="determinate" value={file.progress} />
                  ) : (
                    'Completed'
                  )}
                </TableCell>
                <TableCell>
                  {/* 下载按钮（仅图标） */}
                  <Tooltip title="Download file">
                    <IconButton color="primary" onClick={() => downloadFile(file.name)}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>

                  {/* 删除文件按钮（仅图标） */}
                  <Tooltip title="Delete file">
                    <IconButton color="secondary" onClick={() => deleteFile(file.name)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 提示消息 */}
      <Snackbar
        open={openSnackbar.open}
        onClose={handleSnackbarClose}
        message={openSnackbar.message}
        autoHideDuration={3000}
      />
    </Box>
  );
};

export default Genome;
