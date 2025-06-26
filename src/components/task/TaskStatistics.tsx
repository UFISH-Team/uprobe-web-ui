import React from 'react';
import { Grid, Card, CardContent, Typography, styled } from '@mui/material';

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
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={4} md={2}>
        <StyledCard>
          <CardContent>
            <StyledStatValue>{stats.total}</StyledStatValue>
            <StyledStatLabel>Total Tasks</StyledStatLabel>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <StyledCard>
          <CardContent>
            <StyledStatValue color="success.main">
              {stats.completed}
            </StyledStatValue>
            <StyledStatLabel>Completed</StyledStatLabel>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <StyledCard>
          <CardContent>
            <StyledStatValue color="info.main">
              {stats.running}
            </StyledStatValue>
            <StyledStatLabel>Running</StyledStatLabel>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <StyledCard>
          <CardContent>
            <StyledStatValue color="warning.main">
              {stats.pending}
            </StyledStatValue>
            <StyledStatLabel>Pending</StyledStatLabel>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <StyledCard>
          <CardContent>
            <StyledStatValue color="error.main">
              {stats.failed}
            </StyledStatValue>
            <StyledStatLabel>Failed</StyledStatLabel>
          </CardContent>
        </StyledCard>
      </Grid>
      <Grid item xs={12} sm={4} md={2}>
        <StyledCard>
          <CardContent>
            <StyledStatValue sx={{ color: 'text.secondary' }}>
              {stats.paused}
            </StyledStatValue>
            <StyledStatLabel>Paused</StyledStatLabel>
          </CardContent>
        </StyledCard>
      </Grid>
    </Grid>
  );
};

export default TaskStatistics; 