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
  Visibility as VisibilityIcon,
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
  onViewTask: (task: Task) => void;
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
  pending: <ScheduleIcon />,
  running: <LinearProgress size={16} />,
  completed: <CheckCircleIcon />,
  failed: <DeleteIcon />,
  paused: <PauseIcon />,
};

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewTask,
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
                    label={task.status}
                    color={getStatusColor(task.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ width: '100%', mr: 1 }}>
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
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(task.created_at).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="small"
                      onClick={() => onViewTask(task)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {task.status === "pending" && (
                      <Tooltip title="运行任务">
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
                      <IconButton
                        size="small"
                        onClick={() => onPauseTask(task.id)}
                      >
                        <PauseIcon />
                      </IconButton>
                    )}
                    {task.status === "paused" && (
                      <IconButton
                        size="small"
                        onClick={() => onResumeTask(task.id)}
                      >
                        <PlayIcon />
                      </IconButton>
                    )}
                    {task.status === "completed" && task.result_url && (
                      <IconButton
                        size="small"
                        onClick={() => onDownloadResult(task.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
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
