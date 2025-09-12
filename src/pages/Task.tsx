import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Stack,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import type { Task } from "../types";
import ApiService from "../api";
import { useNavigate } from "react-router-dom";
import useTaskStore from "../store/taskStore";
import TaskStatistics from '../components/task/TaskStatistics';
import TaskTable from '../components/task/TaskTable';


const Task: React.FC = () => {
  const { 
    tasks, 
    isLoading, 
    fetchTasks, 
    deleteTask, 
    pauseTask, 
    resumeTask, 
    runTask,
    rerunTask
  } = useTaskStore();
  

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info"
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    const refreshInterval = setInterval(fetchTasks, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchTasks]);

  const handleCreateTask = () => {
    navigate('/design');
  };



  const handleDeleteTask = (taskId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this task? This action cannot be undone.");
    if (confirmDelete) {
      deleteTask(taskId)
        .then(() => {
          setSnackbar({
            open: true,
            message: "Task deleted successfully",
            severity: "success"
          });
        })
        .catch(error => {
          console.error("Failed to delete task", error);
          setSnackbar({
            open: true,
            message: "Failed to delete task, please try again later",
            severity: "error"
          });
        });
    }
  };

  const handlePauseTask = (taskId: string) => {
    pauseTask(taskId)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Task paused successfully",
          severity: "success"
        });
      })
      .catch(error => {
        console.error("Failed to pause task", error);
        setSnackbar({
          open: true,
          message: "Failed to pause task, please try again later",
          severity: "error"
        });
      });
  };

  const handleResumeTask = (taskId: string) => {
    resumeTask(taskId)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Task resumed successfully",
          severity: "success"
        });
      })
      .catch(error => {
        console.error("Failed to resume task", error);
        setSnackbar({
          open: true,
          message: "Failed to resume task, please try again later",
          severity: "error"
        });
      });
  };

  const handleRunTask = (taskId: string) => {
    runTask(taskId)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Task started successfully",
          severity: "success"
        });
      })
      .catch(error => {
        console.error("Failed to run task", error);
        setSnackbar({
          open: true,
          message: "Failed to start task, please try again later",
          severity: "error"
        });
      });
  };

  const handleRerunTask = (taskId: string) => {
    rerunTask(taskId)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Task is restarting successfully",
          severity: "success"
        });
      })
      .catch(error => {
        console.error("Failed to rerun task", error);
        setSnackbar({
          open: true,
          message: "Failed to restart task, please try again later",
          severity: "error"
        });
      });
  };

  const handleDownloadResult = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const filename = task ? `${task.name}_${taskId}_results.zip` : `${taskId}_results.zip`;
    
    ApiService.downloadTaskResult(taskId)
      .then(blob => {
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSnackbar({
          open: true,
          message: "Result file downloaded successfully",
          severity: "success"
        });
      })
      .catch(error => {
        console.error("Failed to download result file", error);
        setSnackbar({
          open: true,
          message: "Failed to download result file, please try again later",
          severity: "error"
        });
      });
  };

  const getTasksStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const running = tasks.filter((task) => task.status === "running").length;
    const pending = tasks.filter((task) => task.status === "pending").length;
    const failed = tasks.filter((task) => task.status === "failed").length;
    const paused = tasks.filter((task) => task.status === "paused").length;
    
    return { total, completed, running, pending, failed, paused };
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesTab = activeTab === "all" || task.status === activeTab;
    const matchesSearch =
      task.name.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description.toLowerCase().includes(searchText.toLowerCase()) ||
      task.genome.toLowerCase().includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AssignmentIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h4" component="h1">
              Task Management
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            Manage and monitor your probe design tasks
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTask}
            color="primary"
          >
            Create Task
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTasks}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      <TaskStatistics stats={getTasksStatistics()} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Search tasks..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
          size="small"
        />
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 0 }}
        >
          <Tab label="All Tasks" value="all" />
          <Tab label="Running" value="running" />
          <Tab label="Pending" value="pending" />
          <Tab label="Completed" value="completed" />
          <Tab label="Paused" value="paused" />
          <Tab label="Failed" value="failed" />
        </Tabs>
      </Box>

      <TaskTable
        tasks={filteredTasks}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        onPauseTask={handlePauseTask}
        onResumeTask={handleResumeTask}
        onRunTask={handleRunTask}
        onRerunTask={handleRerunTask}
        onDownloadResult={handleDownloadResult}
        onDeleteTask={handleDeleteTask}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Task;
