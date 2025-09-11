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
} from '@mui/icons-material';
import type { Task } from '../../types';

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

// Helper function to determine probe type from task
const getTaskProbeType = (task: Task): 'DNA' | 'RNA' => {
  try {
    // Check if task has yaml_content
    if (task.yaml_content) {
      const yamlData = JSON.parse(task.yaml_content);
      
      // Check extracts.target_region.source
      if (yamlData.extracts?.target_region?.source) {
        return yamlData.extracts.target_region.source === 'genome' ? 'DNA' : 'RNA';
      }
    }
    
    // Check parameters for source information
    if (task.parameters?.extracts?.target_region?.source) {
      return task.parameters.extracts.target_region.source === 'genome' ? 'DNA' : 'RNA';
    }
    
    // Check summary report_name if available
    if (task.parameters?.summary?.report_name) {
      return task.parameters.summary.report_name === 'dna_report' ? 'DNA' : 'RNA';
    }
    
    // Default to RNA for legacy tasks
    return 'RNA';
  } catch (error) {
    console.warn('Error determining probe type for task:', task.id, error);
    return 'RNA';
  }
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
}) => {
  return (
    <StyledTableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task ID</TableCell>
            <TableCell>Task Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Genome</TableCell>
            <TableCell>Probe Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Progress</TableCell>
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
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {task.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{task.name}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={task.description}>
                    <Typography
                      variant="body2"
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
                  <Chip label={task.genome} size="small" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getTaskProbeType(task)} 
                    size="small" 
                    color={getTaskProbeType(task) === 'DNA' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={statusIcons[task.status as keyof typeof statusIcons]}
                    label={task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    color={getStatusColor(task.status)}
                    size="small"
                    variant={task.status === 'running' ? 'filled' : 'outlined'}
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
