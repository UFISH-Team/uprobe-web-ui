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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    content: string;
  }>({
    open: false,
    title: "",
    content: "",
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

  const handleViewReport = async (task: Task) => {
    try {
      setSnackbar({
        open: true,
        message: "Processing report, this may take a moment...",
        severity: "info",
      });

      // 1. Download the zip file
      const blob = await ApiService.downloadTaskResult(task.id);
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(blob);

      // 2. Find the HTML file
      const htmlFileEntry = Object.values(zip.files).find(
        (file) => file.name.endsWith('.html') && !file.dir
      );
      
      if (!htmlFileEntry) {
        throw new Error("No HTML file found in the archive.");
      }

      const mainHtmlContent = await htmlFileEntry.async('text');
      
      // 3. Parse the HTML and prepare for inlining resources
      const parser = new DOMParser();
      const doc = parser.parseFromString(mainHtmlContent, 'text/html');
      const promises: Promise<void>[] = [];
      const baseUrl = `file:///${htmlFileEntry.name}`;

      // 4. Inline CSS
      doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('//')) {
          const resourcePath = new URL(href, baseUrl).pathname.substring(1);
          const cssFile = zip.file(resourcePath);
          if (cssFile) {
            promises.push(
              cssFile.async('text').then(cssContent => {
                const style = doc.createElement('style');
                style.textContent = cssContent;
                link.replaceWith(style);
              })
            );
          }
        }
      });

      // 5. Inline Javascript
      doc.querySelectorAll('script[src]').forEach(script => {
        const src = script.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('//')) {
          const resourcePath = new URL(src, baseUrl).pathname.substring(1);
          const jsFile = zip.file(resourcePath);
          if (jsFile) {
            promises.push(
              jsFile.async('text').then(jsContent => {
                const newScript = doc.createElement('script');
                newScript.textContent = jsContent;
                script.replaceWith(newScript);
              })
            );
          }
        }
      });
      
      // 6. Inline Images
      doc.querySelectorAll('img[src]').forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('//')) {
          const resourcePath = new URL(src, baseUrl).pathname.substring(1);
          const imgFile = zip.file(resourcePath);
          if (imgFile) {
            promises.push(
              imgFile.async('base64').then(base64Content => {
                const extension = src.split('.').pop()?.toLowerCase() || 'png';
                const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                img.setAttribute('src', `data:${mimeType};base64,${base64Content}`);
              })
            );
          }
        }
      });

      await Promise.all(promises);

      // 7. Create a blob from the modified, self-contained HTML
      const finalHtml = doc.documentElement.outerHTML;
      const htmlBlob = new Blob([finalHtml], { type: 'text/html' });
      const url = URL.createObjectURL(htmlBlob);

      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.addEventListener('unload', () => URL.revokeObjectURL(url));
      } else {
        URL.revokeObjectURL(url);
      }
      
      setSnackbar({
        open: true,
        message: "Report opened successfully.",
        severity: "success",
      });

    } catch (error) {
      console.error('Failed to create self-contained report:', error);
      setSnackbar({
        open: true,
        message: "Failed to open report. See console for details.",
        severity: "error",
      });
    }
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
        // Create download link
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

  const handleViewError = (task: Task) => {
    setErrorDialog({
      open: true,
      title: `Error Details: ${task.name}`,
      content: task.error_message || "No error details available.",
    });
  };

  const getTasksStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const running = tasks.filter((task) => task.status === "running").length;
    const pending = tasks.filter((task) => task.status === "pending" || task.status === "queued").length;
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
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
          <Tab label="Queued" value="pending" />
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
        onViewReport={handleViewReport}
        onViewError={handleViewError}
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

      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ ...errorDialog, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{errorDialog.title}</DialogTitle>
        <DialogContent dividers>
          <Typography
            component="pre"
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontFamily: 'monospace',
              maxHeight: '60vh',
              overflow: 'auto'
            }}
          >
            {errorDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialog({ ...errorDialog, open: false })}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Task;
