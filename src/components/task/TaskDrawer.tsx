import React from 'react';
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
} from '@mui/material';
import {
  PauseCircle as PauseIcon,
  PlayCircle as PlayIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';

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
            <Typography variant="body2">{task.parameters.probeType}</Typography>
          </Grid>
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