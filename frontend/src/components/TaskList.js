import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Fade,
} from '@mui/material';
import { Delete, Edit, Flag, Timer, PlayArrow } from '@mui/icons-material';
import { toggleTask, deleteTask } from '../services/api';

function TaskList({ tasks, loading, onTaskUpdated, onTaskDeleted, onStartPomodoro, onEditTask }) {
  const handleToggle = async (taskId) => {
    try {
      await toggleTask(taskId);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        onTaskDeleted();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 4) return '#d95550'; // Red
    if (priority === 3) return '#f59e0b'; // Amber
    return '#4c9aff'; // Blue
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
          border: '1px solid #e0e0e0',
          textAlign: 'center',
          py: 8,
          bgcolor: '#fafafa',
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
          No tasks for today
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click "Add Task" to create your first task
        </Typography>
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
              bgcolor: task.completed ? '#fafafa' : '#ffffff',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: task.completed ? '#f5f5f5' : '#f9fafb',
                transform: 'translateX(4px)',
                '& .task-actions': {
                  opacity: 1,
                },
              },
              opacity: task.completed ? 0.7 : 1,
              animation: `fadeInSlide 0.3s ease-out ${index * 0.05}s both`,
              '@keyframes fadeInSlide': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-10px)',
                },
                to: {
                  opacity: task.completed ? 0.7 : 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Checkbox
                checked={task.completed}
                onChange={() => handleToggle(task.id)}
                sx={{ 
                  mt: -0.5,
                  p: 0.5,
                  color: '#d0d0d0',
                  '&.Mui-checked': {
                    color: '#4caf50',
                  },
                  transition: 'all 0.2s ease',
                }}
              />

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'text.secondary' : 'text.primary',
                      wordBreak: 'break-word',
                      fontWeight: 500,
                      fontSize: '1rem',
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
                  {task.pomodoro_count > 0 && (
                    <Chip
                      icon={<Timer sx={{ fontSize: '0.9rem' }} />}
                      label={task.pomodoro_count}
                      size="small"
                      sx={{
                        bgcolor: '#fff5f5',
                        color: '#d95550',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        height: '22px',
                        '& .MuiChip-label': {
                          px: 0.5,
                        }
                      }}
                    />
                  )}
                </Box>

                {task.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
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
                {!task.completed && onStartPomodoro && (
                  <IconButton
                    onClick={() => onStartPomodoro(task)}
                    size="small"
                    sx={{ 
                      mt: -0.5,
                      color: '#d95550',
                      bgcolor: 'rgba(217, 85, 80, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(217, 85, 80, 0.15)',
                      },
                    }}
                    title="Start Pomodoro"
                  >
                    <PlayArrow fontSize="small" />
                  </IconButton>
                )}
                {onEditTask && (
                  <IconButton
                    onClick={() => onEditTask(task)}
                    size="small"
                    sx={{ 
                      mt: -0.5,
                      color: '#4c9aff',
                      bgcolor: 'rgba(76, 154, 255, 0.05)',
                      '&:hover': {
                        bgcolor: 'rgba(76, 154, 255, 0.15)',
                      },
                    }}
                    title="Edit task"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleDelete(task.id)}
                  size="small"
                  sx={{ 
                    mt: -0.5,
                    color: '#999',
                    '&:hover': {
                      color: '#d95550',
                      bgcolor: 'rgba(217, 85, 80, 0.05)',
                    },
                  }}
                  title="Delete task"
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

export default TaskList;

