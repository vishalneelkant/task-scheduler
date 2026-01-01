import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  Button,
} from '@mui/material';
import { Delete, Edit, Repeat, Add } from '@mui/icons-material';
import { deleteRecurringTask } from '../services/api';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function RecurringTasksList({ tasks, loading, onTaskUpdated, onTaskDeleted, onOpenDialog, onEditTask }) {
  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this recurring task? This will not delete already created task instances.')) {
      try {
        await deleteRecurringTask(taskId);
        onTaskDeleted();
      } catch (err) {
        console.error('Failed to delete recurring task:', err);
      }
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 4) return '#d95550';
    if (priority === 3) return '#f59e0b';
    return '#4c9aff';
  };

  const getPriorityBgColor = (priority) => {
    if (priority >= 4) return '#fff5f5';
    if (priority === 3) return '#fffbeb';
    return '#eff6ff';
  };

  const getPriorityLabel = (priority) => {
    if (priority === 5) return 'Urgent';
    if (priority === 4) return 'High';
    if (priority === 3) return 'Medium';
    if (priority === 2) return 'Low';
    return 'Minimal';
  };

  const getRecurrenceLabel = (task) => {
    if (task.recurrence_type === 'daily') {
      return 'Daily';
    } else if (task.recurrence_type === 'weekly' && task.recurrence_days) {
      const days = task.recurrence_days.split(',').map(d => WEEKDAYS[parseInt(d.trim())]);
      return `Every ${days.join(', ')}`;
    }
    return 'Unknown';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#d95550' }} />
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card 
        sx={{ 
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          textAlign: 'center',
          py: 8,
          bgcolor: '#fafafa',
        }}
      >
        <Repeat sx={{ fontSize: 64, color: '#d0d0d0', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
          No recurring tasks yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create recurring tasks that automatically appear on your daily task list
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onOpenDialog}
          sx={{
            bgcolor: '#d95550',
            color: 'white',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderRadius: 2.5,
            '&:hover': {
              bgcolor: '#c62828',
            },
          }}
        >
          Create Recurring Task
        </Button>
      </Card>
    );
  }

  return (
    <Fade in={true} timeout={400}>
      <Card
        sx={{
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        {tasks.map((task, index) => (
          <React.Fragment key={task.id}>
            <Box
              sx={{
              p: 3,
              bgcolor: '#ffffff',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: '#f9fafb',
                transform: 'translateX(4px)',
                '& .task-actions': {
                  opacity: 1,
                },
              },
              animation: `fadeInSlide 0.3s ease-out ${index * 0.05}s both`,
              '@keyframes fadeInSlide': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    mt: 0.5,
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'rgba(217, 85, 80, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Repeat sx={{ fontSize: 24, color: '#d95550' }} />
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.primary',
                        wordBreak: 'break-word',
                        fontWeight: 600,
                        fontSize: '1.05rem',
                      }}
                    >
                      {task.title}
                    </Typography>
                    <Chip
                      label={getPriorityLabel(task.priority)}
                      size="small"
                      sx={{
                        bgcolor: getPriorityBgColor(task.priority),
                        color: getPriorityColor(task.priority),
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: '22px',
                        border: `1px solid ${getPriorityColor(task.priority)}`,
                        '& .MuiChip-label': {
                          px: 1,
                        }
                      }}
                    />
                    <Chip
                      icon={<Repeat sx={{ fontSize: '0.9rem' }} />}
                      label={getRecurrenceLabel(task)}
                      size="small"
                      sx={{
                        bgcolor: '#f0f9ff',
                        color: '#0369a1',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: '22px',
                        border: '1px solid #0369a1',
                        '& .MuiChip-label': {
                          px: 1,
                        }
                      }}
                    />
                  </Box>

                  {task.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                        wordBreak: 'break-word',
                        lineHeight: 1.5,
                        fontSize: '0.9rem',
                      }}
                    >
                      {task.description}
                    </Typography>
                  )}
                </Box>

                <Box 
                  className="task-actions"
                  sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    opacity: { xs: 1, md: 0.6 },
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <IconButton
                    onClick={() => onEditTask(task)}
                    size="small"
                    sx={{ 
                      color: '#4c9aff',
                      bgcolor: 'rgba(76, 154, 255, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(76, 154, 255, 0.15)',
                      },
                    }}
                    title="Edit recurring task"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(task.id)}
                    size="small"
                    sx={{ 
                      color: '#999',
                      '&:hover': {
                        color: '#d95550',
                        bgcolor: 'rgba(217, 85, 80, 0.05)',
                      },
                    }}
                    title="Delete recurring task"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
            </Box>
          </Box>
          {index < tasks.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Card>
    </Fade>
  );
}

export default RecurringTasksList;

