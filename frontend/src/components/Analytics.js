import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Paper,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, CheckCircle, Flag, Timer } from '@mui/icons-material';
import { getPomodoroStats } from '../services/api';

function Analytics({ data }) {
  const [pomodoroStats, setPomodoroStats] = useState(null);

  useEffect(() => {
    const fetchPomodoroStats = async () => {
      try {
        const stats = await getPomodoroStats();
        setPomodoroStats(stats);
      } catch (err) {
        console.error('Failed to load pomodoro stats:', err);
      }
    };
    fetchPomodoroStats();
  }, []);

  if (!data) {
    return null;
  }

  const { today, week, daily_trend, priority_stats } = data;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Analytics & Insights
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(6, 182, 212, 0.25)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Today's Progress</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {today.completed} of {today.total} tasks completed
                </Typography>
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {today.rate}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(139, 92, 246, 0.25)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h6">Weekly Progress</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {week.completed} of {week.total} tasks completed
                </Typography>
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {week.rate}%
            </Typography>
          </Paper>
        </Grid>

        {pomodoroStats && (
          <>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #d95550 0%, #ef4444 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 8px 30px rgba(217, 85, 80, 0.25)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timer sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Today's Focus</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {pomodoroStats.today.count} Pomodoros completed
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {pomodoroStats.today.focus_time} min
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                  color: 'white',
                  borderRadius: 3,
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.25)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timer sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h6">Weekly Focus</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {pomodoroStats.week.count} Pomodoros completed
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {pomodoroStats.week.focus_time} min
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      {/* 7-Day Trend - Simple bars */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ mr: 1 }} />
                7-Day Completion Trend
              </Typography>
              <Box>
                {daily_trend.map((day, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {day.day}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {day.completed} / {day.total}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={day.total > 0 ? (day.completed / day.total) * 100 : 0}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#06b6d4',
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Stats - Simple bars */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Flag sx={{ mr: 1 }} />
                Tasks by Priority (This Week)
              </Typography>
              <Box>
                {priority_stats.map((stat, index) => {
                  const priorityLabels = ['Minimal', 'Low', 'Medium', 'High', 'Urgent'];
                  const priorityColors = ['#4c9aff', '#4c9aff', '#f59e0b', '#d95550', '#d95550'];
                  return (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Priority {stat.priority} - {priorityLabels[stat.priority - 1]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.completed} / {stat.total}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={stat.total > 0 ? (stat.completed / stat.total) * 100 : 0}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: priorityColors[stat.priority - 1],
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f0f0', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          💡 To enable interactive charts, run: <code>npm install recharts</code>
        </Typography>
      </Box>
    </Box>
  );
}

export default Analytics;
