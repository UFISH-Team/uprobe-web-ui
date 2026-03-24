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
  PauseCircle as PauseCircleIcon,
  PlayCircle as PlayCircleIcon,
  PlayArrow as PlayArrowIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Replay as ReplayIcon,
  Visibility as VisibilityIcon,
  Autorenew as AutorenewIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import type { Task } from '../../types';
import YAML from 'yaml';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiTableCell-head': {
    fontWeight: 500,
    backgroundColor: theme.palette.background.default,
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: '0.875rem',
  },
  '& .MuiTableRow-hover:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .MuiTableCell-root': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 2),
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
  onViewReport: (task: Task) => void;
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
  running: <AutorenewIcon fontSize="small" />,
  completed: <CheckCircleIcon fontSize="small" />,
  failed: <DeleteIcon fontSize="small" />,
  paused: <PauseIcon fontSize="small" />,
};

// Helper function to get probe name from task
const getTaskProbeName = (task: Task): string => {
  try {
    const match = task.description.match(/Protocol for designing (.+?) probes from species/);
    if (match && match[1]) {
      return match[1];
    }
    if (task.yaml_content) {
      const yamlData = YAML.parse(task.yaml_content);
      if (yamlData.probes) {
        const probeKeys = Object.keys(yamlData.probes).filter(key => key.startsWith('probe_'));
        if (probeKeys.length > 0) {
          return `Custom (${probeKeys.length} probes)`;
        }
      }
    }
    if (task.parameters?.probes) {
      const probeKeys = Object.keys(task.parameters.probes).filter(key => key.startsWith('probe_'));
      if (probeKeys.length > 0) {
        return `Custom (${probeKeys.length} probes)`;
      }
    }
    return 'Custom Probe';
  } catch (error) {
    console.warn('Error determining probe name for task:', task.id, error);
    return 'Unknown';
  }
};

// Helper function to get probe type (source) from task
const getTaskSource = (task: Task): string => {
  try {
    if (task.yaml_content) {
      const yamlData = YAML.parse(task.yaml_content);
      if (yamlData.extracts?.target_region?.source) {
        return yamlData.extracts.target_region.source;
      }
    }
    if (task.parameters?.extracts?.target_region?.source) {
      return task.parameters.extracts.target_region.source;
    }
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
  onViewReport,
}) => {
  return (
    <StyledTableContainer>
      <Table sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '15%' }}>Task</TableCell>
            <TableCell sx={{ width: '20%' }}>Description</TableCell>
            <TableCell sx={{ width: '8%' }}>Genome</TableCell>
            <TableCell sx={{ width: '12%', whiteSpace: 'nowrap' }}>Probe Name</TableCell>
            <TableCell sx={{ width: '5%' }}>Type</TableCell>
            <TableCell sx={{ width: '5%' }}>Source</TableCell>
            <TableCell sx={{ width: '8%' }}>Status</TableCell>
            <TableCell sx={{ width: '10%' }}>Progress</TableCell>
            <TableCell sx={{ width: '12%', whiteSpace: 'nowrap' }}>Created</TableCell>
            <TableCell align="right" sx={{ minWidth: 140 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {task.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
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
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {task.description}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{task.genome}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">{getTaskProbeName(task)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: getTaskProbeType(task) === 'DNA' ? 'primary.main' : 'secondary.main',
                      fontSize: '0.875rem'
                    }}
                  >
                    {getTaskProbeType(task)}
                  </Typography>
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
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(task.created_at).toLocaleString([], {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    {task.status === "pending" && (
                      <Tooltip title="Run Task">
                        <IconButton size="small" onClick={() => onRunTask(task.id)}>
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {task.status === "running" && (
                      <Tooltip title="Pause Task">
                        <IconButton size="small" onClick={() => onPauseTask(task.id)}>
                          <PauseCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {task.status === "paused" && (
                      <Tooltip title="Resume Task">
                        <IconButton size="small" onClick={() => onResumeTask(task.id)}>
                          <PlayCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(task.status === 'failed' || task.status === 'completed') && (
                      <Tooltip title="Rerun Task">
                        <IconButton size="small" onClick={() => onRerunTask(task.id)}>
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {task.status === "completed" && task.result_url && (
                      <>
                        <Tooltip title="View Report">
                          <IconButton size="small" onClick={() => onViewReport(task)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download Results">
                          <IconButton size="small" onClick={() => onDownloadResult(task.id)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="Delete Task">
                      <IconButton size="small" onClick={() => onDeleteTask(task.id)} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" />
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
