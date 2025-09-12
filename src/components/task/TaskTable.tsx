import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  Box,
  LinearProgress,
  IconButton,
  Stack,
  Tooltip,
  styled,
} from '@mui/material';
import {
  PauseCircle as PauseIcon,
  PlayCircle as PlayIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import YAML from 'yaml';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(1),
  boxShadow: theme.shadows[2],
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  '& .MuiTableCell-head': {
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.default,
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
  '& .MuiTableRow-hover:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

interface TaskTableProps {
  tasks: Task[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPauseTask: (taskId: string) => void;
  onResumeTask: (taskId: string) => void;
  onRunTask: (taskId: string) => void;
  onRerunTask: (taskId: string) => void;
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

const statusIcons = {
  pending: <ScheduleIcon fontSize="small" />,
  running: <PlayArrowIcon fontSize="small" />,
  completed: <CheckCircleIcon fontSize="small" />,
  failed: <DeleteIcon fontSize="small" />,
  paused: <PauseIcon fontSize="small" />,
};

// Helper function to get probe name from task
const getTaskProbeName = (task: Task): string => {
  try {
    // First try to get the probe type name from description
    // The description format is: "Protocol for designing {probeName} probes from species {species}"
    const match = task.description.match(/Protocol for designing (.+?) probes from species/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Fallback: check yaml_content for probe configurations
    if (task.yaml_content) {
      const yamlData = YAML.parse(task.yaml_content);
      
      // Look for probe configurations (probe_1, probe_2, etc.)
      if (yamlData.probes) {
        const probeKeys = Object.keys(yamlData.probes).filter(key => key.startsWith('probe_'));
        if (probeKeys.length > 0) {
          return `Custom (${probeKeys.length} probes)`;
        }
      }
    }
    
    // Check parameters for probe configurations
    if (task.parameters?.probes) {
      const probeKeys = Object.keys(task.parameters.probes).filter(key => key.startsWith('probe_'));
      if (probeKeys.length > 0) {
        return `Custom (${probeKeys.length} probes)`;
      }
    }
    
    // Default fallback
    return 'Custom Probe';
  } catch (error) {
    console.warn('Error determining probe name for task:', task.id, error);
    return 'Unknown';
  }
};

// Helper function to get probe type (source) from task
const getTaskSource = (task: Task): string => {
  try {
    // Check yaml_content for extracts.target_region.source
    if (task.yaml_content) {
      const yamlData = YAML.parse(task.yaml_content);
      if (yamlData.extracts?.target_region?.source) {
        return yamlData.extracts.target_region.source;
      }
    }
    
    // Check parameters for extracts.target_region.source
    if (task.parameters?.extracts?.target_region?.source) {
      return task.parameters.extracts.target_region.source;
    }
    
    // Default fallback
    return 'exon';
  } catch (error) {
    console.warn('Error determining source for task:', task.id, error);
    return 'Unknown';
  }
};

// Helper function to get probe type (DNA/RNA) from task
const getTaskProbeType = (task: Task): 'DNA' | 'RNA' => {
  const source = getTaskSource(task);
  if (source === 'genome') {
    return 'DNA';
  }
  return 'RNA';
};

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onPauseTask,
  onResumeTask,
  onRunTask,
  onDownloadResult,
  onDeleteTask,
  onRerunTask,
}) => {
  return (
    <StyledTableContainer>
      <Table sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '20%' }}>Task</TableCell>
            <TableCell sx={{ width: '20%' }}>Description</TableCell>
            <TableCell>Genome</TableCell>
            <TableCell>Probe Name</TableCell>
            <TableCell>Probe Type</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Status</TableCell>
            <TableCell sx={{ width: '15%' }}>Progress</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" component="div" sx={{ fontWeight: 500 }}>
                      {task.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {task.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={task.description}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {task.description}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{task.genome}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{getTaskProbeName(task)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getTaskProbeType(task)} 
                    size="small" 
                    color={getTaskProbeType(task) === 'DNA' ? 'primary' : 'secondary'}
                    sx={{
                      fontWeight: 500,
                      borderRadius: '6px',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{getTaskSource(task)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[task.status as keyof typeof statusIcons]}
                    label={task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
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
                      sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35 }}>
                      {task.progress}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(task.created_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {task.status === "pending" && (
                      <Tooltip title="Run Task">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onRunTask(task.id)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {task.status === "running" && (
                      <Tooltip title="Pause Task">
                        <IconButton
                          size="small"
                          onClick={() => onPauseTask(task.id)}
                          color="warning"
                        >
                          <PauseIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {task.status === "paused" && (
                      <Tooltip title="Resume Task">
                        <IconButton
                          size="small"
                          onClick={() => onResumeTask(task.id)}
                          color="primary"
                        >
                          <PlayIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(task.status === 'failed' || task.status === 'completed') && (
                      <Tooltip title="Rerun Task">
                        <IconButton onClick={() => onRerunTask(task.id)} color="primary">
                          <ReplayIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {task.status === "completed" && task.result_url && (
                      <Tooltip title="Download Results">
                        <IconButton
                          size="small"
                          onClick={() => onDownloadResult(task.id)}
                          color="success"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Task">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={tasks.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </StyledTableContainer>
  );
};

export default TaskTable; 
