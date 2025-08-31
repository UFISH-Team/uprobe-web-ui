import React from 'react';
import { Grid, Card, CardContent, Typography, styled, Box } from '@mui/material';
import {
  Assignment as TotalIcon,
  CheckCircle as CompletedIcon,
  PlayCircle as RunningIcon,
  Schedule as PendingIcon,
  Error as FailedIcon,
  PauseCircle as PausedIcon,
} from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledStatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
}));

const StyledStatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
}));

interface TaskStats {
  total: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
  paused: number;
}

interface TaskStatisticsProps {
  stats: TaskStats;
}

const TaskStatistics: React.FC<TaskStatisticsProps> = ({ stats }) => {
  const statItems = [
    { value: stats.total, label: 'Total Tasks', color: 'text.primary', icon: <TotalIcon /> },
    { value: stats.completed, label: 'Completed', color: 'success.main', icon: <CompletedIcon /> },
    { value: stats.running, label: 'Running', color: 'info.main', icon: <RunningIcon /> },
    { value: stats.pending, label: 'Pending', color: 'warning.main', icon: <PendingIcon /> },
    { value: stats.failed, label: 'Failed', color: 'error.main', icon: <FailedIcon /> },
    { value: stats.paused, label: 'Paused', color: 'text.secondary', icon: <PausedIcon /> },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statItems.map((item, index) => (
        <Grid item xs={12} sm={4} md={2} key={index}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <StyledStatValue sx={{ color: item.color, mb: 0 }}>
                  {item.value}
                </StyledStatValue>
                <Box sx={{ color: item.color, opacity: 0.7 }}>
                  {item.icon}
                </Box>
              </Box>
              <StyledStatLabel>{item.label}</StyledStatLabel>
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  );
};

export default TaskStatistics; 
