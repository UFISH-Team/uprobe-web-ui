// 文件路径: src/pages/TaskManagerPage.tsx

import React, { useState, useEffect } from 'react';
import {
  Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Button, Box
} from '@mui/material';

interface Task {
  id: string;
  description: string;
  status: string;
  progress: number; // 任务进度（百分比）
}

const JobsPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 用于过滤任务状态
  const [sortOrder, setSortOrder] = useState<string>('progress'); // 排序依据

  // 模拟从后端获取任务列表，定时轮询获取最新状态
  useEffect(() => {
    const fetchTasks = () => {
      // 模拟后端API请求
      const mockTasks = [
        { id: '1', description: '设计任务1', status: '进行中', progress: Math.random() * 100 },
        { id: '2', description: '设计任务2', status: '已完成', progress: 100 },
        { id: '3', description: '设计任务3', status: '进行中', progress: Math.random() * 100 },
        { id: '4', description: '设计任务4', status: '已失败', progress: Math.random() * 100 },
      ];
      setTasks(mockTasks);
      setLoading(false);
    };

    // 初次加载
    fetchTasks();

    // 每隔5秒轮询一次任务状态
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);  // 清理 interval
  }, []);

  // 任务过滤逻辑
  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'all') return true;
    return task.status === statusFilter;
  });

  // 任务排序逻辑
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortOrder === 'progress') {
      return b.progress - a.progress;
    }
    if (sortOrder === 'id') {
      return parseInt(a.id) - parseInt(b.id);
    }
    return 0;
  });

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Container className="probe-container">
      <Typography variant="h4" gutterBottom>任务管理</Typography>

      {/* 过滤器和排序功能 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>任务状态</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="任务状态"
          >
            <MenuItem value="all">所有状态</MenuItem>
            <MenuItem value="进行中">进行中</MenuItem>
            <MenuItem value="已完成">已完成</MenuItem>
            <MenuItem value="已失败">已失败</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>排序</InputLabel>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            label="排序"
          >
            <MenuItem value="progress">按进度排序</MenuItem>
            <MenuItem value="id">按任务ID排序</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* 任务列表 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>任务 ID</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>进度</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.id}</TableCell>
                <TableCell>{task.description}</TableCell>
                <TableCell>{task.status}</TableCell>
                <TableCell>{Math.round(task.progress)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default JobsPanel;
