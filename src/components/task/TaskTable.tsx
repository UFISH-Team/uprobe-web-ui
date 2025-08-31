import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
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
  marginTop: theme.spacing(3),
  '& .MuiTableCell-head': {
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.default,
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
    <StyledTableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task ID</TableCell>
            <TableCell>Task Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Genome</TableCell>
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
