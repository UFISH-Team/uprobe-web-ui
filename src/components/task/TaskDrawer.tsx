import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Stack,
  styled,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PauseCircle as PauseIcon,
  PlayCircle as PlayIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  InsertDriveFile as FileIcon,
  TableChart as CsvIcon,
  Web as HtmlIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import ApiService from '../../api';

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '600px',
    padding: theme.spacing(3),
  },
}));

interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onDownloadResult: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

interface TaskFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

const getStatusColor = (status: string): "success" | "info" | "warning" | "error" | "default" => {
  switch (status) {
    case "completed":
      return "success";
    case "running":
      return "info";
    case "pending":
      return "warning";
    case "failed":
      return "error";
    case "paused":
    default:
      return "default";
  }
};

const TaskDrawer: React.FC<TaskDrawerProps> = ({
  task,
  open,
  onClose,
  onPauseTask,
  onResumeTask,
  onDownloadResult,
  onDeleteTask,
}) => {
  const [taskFiles, setTaskFiles] = useState<TaskFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // 获取任务文件列表
  useEffect(() => {
    if (task && task.status === "completed" && open) {
      setLoadingFiles(true);
      ApiService.getTaskFiles(task.id)
        .then(response => {
          if (response.data && response.data.files) {
            setTaskFiles(response.data.files);
          }
        })
        .catch(error => {
          console.error("Failed to load task files", error);
        })
        .finally(() => {
          setLoadingFiles(false);
        });
    }
  }, [task, open]);

  const handleDownloadFile = async (filename: string) => {
    if (!task) return;
    
    try {
      const blob = await ApiService.downloadTaskFile(task.id, filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file", error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'csv':
        return <CsvIcon />;
      case 'html':
        return <HtmlIcon />;
      default:
        return <FileIcon />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!task) return null;

  return (
    <StyledDrawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      <Box>
        <Typography variant="h5" gutterBottom>
          {task.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {task.description}
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Basic Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Task ID</Typography>
            <Typography variant="body2">{task.id}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Status</Typography>
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Created At</Typography>
            <Typography variant="body2">
              {new Date(task.created_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Updated At</Typography>
            <Typography variant="body2">
              {new Date(task.updated_at).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2">Progress</Typography>
            <LinearProgress
              variant="determinate"
              value={task.progress}
              color={
                task.status === "failed"
                  ? "error"
                  : task.status === "completed"
                  ? "success"
                  : "primary"
              }
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Parameters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Genome</Typography>
            <Typography variant="body2">{task.genome}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="subtitle2">Probe Type</Typography>
            <Typography variant="body2">{task.parameters.probe_type || task.parameters.probeType || 'Unknown'}</Typography>
          </Grid>
          {task.parameters.probe_name && (
            <Grid item xs={6}>
              <Typography variant="subtitle2">Probe Name</Typography>
              <Typography variant="body2">{task.parameters.probe_name}</Typography>
            </Grid>
          )}
          {task.parameters.probe_length && (
            <Grid item xs={6}>
              <Typography variant="subtitle2">Probe Length</Typography>
              <Typography variant="body2">{task.parameters.probe_length}</Typography>
            </Grid>
          )}
          {task.parameters.tm_range && (
            <Grid item xs={6}>
              <Typography variant="subtitle2">Melting Temperature Range</Typography>
              <Typography variant="body2">{task.parameters.tm_range}</Typography>
            </Grid>
          )}
          {task.parameters.gc_range && (
            <Grid item xs={6}>
              <Typography variant="subtitle2">GC Content Range</Typography>
              <Typography variant="body2">{task.parameters.gc_range}%</Typography>
            </Grid>
          )}
        </Grid>

        {/* Result Files Section */}
        {task.status === "completed" && (
          <Box sx={{ mt: 3 }}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="result-files-content"
                id="result-files-header"
              >
                <Typography variant="h6">Result Files</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {loadingFiles ? (
                  <Typography>Loading files...</Typography>
                ) : taskFiles.length > 0 ? (
                  <List dense>
                    {taskFiles.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <Tooltip title={`下载 ${file.name}`}>
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleDownloadFile(file.name)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemIcon>
                          {getFileIcon(file.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={file.name}
                          secondary={`${formatFileSize(file.size)} • ${file.type.toUpperCase()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No result files available
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* YAML Configuration Section */}
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="yaml-config-content"
              id="yaml-config-header"
            >
              <Typography variant="h6">YAML Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  backgroundColor: '#f5f5f5',
                  padding: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              >
                {task.yaml_content || 'No YAML configuration available'}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Stack direction="row" spacing={2}>
            {task.status === "running" && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<PauseIcon />}
                onClick={() => {
                  onPauseTask(task.id);
                  onClose();
                }}
              >
                Pause Task
              </Button>
            )}
            {task.status === "paused" && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayIcon />}
                onClick={() => {
                  onResumeTask(task.id);
                  onClose();
                }}
              >
                Resume Task
              </Button>
            )}
            {task.status === "completed" && task.result_url && (
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={() => onDownloadResult(task.id)}
              >
                Download Results
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
            >
              Delete Task
            </Button>
          </Stack>
        </Box>
      </Box>
    </StyledDrawer>
  );
};

export default TaskDrawer; 
