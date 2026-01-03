import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
} from '@mui/material';
import { Logout, Add, BarChart, ExpandMore, ExpandLess, Timer, Repeat, CheckCircle, CheckBox, Person, Sparkles } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getTasks, getAnalytics, getPomodoroStats, getRecurringTasks } from '../services/api';
import TaskList from './TaskList';
import TaskDialog from './TaskDialog';
import PomodoroTimer from './PomodoroTimer';
import Analytics from './Analytics';
import RecurringTasksList from './RecurringTasksList';
import RecurringTaskDialog from './RecurringTaskDialog';
import AITaskDialog from './AITaskDialog';

function Dashboard() {
  const navigate = useNavigate();
  const { user, isGuest, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  // eslint-disable-next-line no-unused-vars
  const [analyticsData, setAnalyticsData] = useState(null);
  const [currentView, setCurrentView] = useState('tasks'); // 'tasks', 'analytics', 'recurring'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [pomodoroStats, setPomodoroStats] = useState({ today: { count: 0, focus_time: 0 } });
  const [recurringTasks, setRecurringTasks] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(false);
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false); // NEW
  const [editingRecurringTask, setEditingRecurringTask] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || name?.substring(0, 2).toUpperCase() || 'U';
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasks();
      setTasks(response.tasks);
      setError('');
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await getAnalytics();
      setAnalyticsData(response);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchPomodoroStats = async () => {
    try {
      const response = await getPomodoroStats();
      setPomodoroStats(response);
    } catch (err) {
      console.error('Failed to load pomodoro stats:', err);
    }
  };

  const fetchRecurringTasks = async () => {
    try {
      setRecurringLoading(true);
      const response = await getRecurringTasks();
      setRecurringTasks(response.recurring_tasks);
    } catch (err) {
      console.error('Failed to load recurring tasks:', err);
    } finally {
      setRecurringLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
    fetchPomodoroStats();
  }, []);

  useEffect(() => {
    if (currentView === 'recurring') {
      fetchRecurringTasks();
    }
  }, [currentView]);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    // Guests stay on dashboard after logout
    if (!isGuest) {
      navigate('/dashboard');
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignUpClick = () => {
    navigate('/register');
  };

  const handleTaskCreated = () => {
    fetchTasks();
    fetchAnalytics();
    const message = editingTask ? 'Task updated successfully!' : 'Task created successfully!';
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const handleTaskUpdated = () => {
    fetchTasks();
    fetchAnalytics();
    setSnackbar({ open: true, message: 'Task updated successfully!', severity: 'success' });
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTask(null);
  };

  const handleTaskDeleted = () => {
    fetchTasks();
    fetchAnalytics();
    setSnackbar({ open: true, message: 'Task deleted successfully!', severity: 'info' });
  };

  const handleStartPomodoro = (task) => {
    setSelectedTask(task);
    setShowTimer(true); // Ensure timer is expanded when starting
  };

  const handlePomodoroComplete = (mode) => {
    fetchTasks();
    fetchPomodoroStats();
    const message = mode === 'work'
      ? '🎉 Focus session complete!'
      : '☕ Break complete!';
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const handleAICreateTasks = async (tasks) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Create all tasks
      for (const task of tasks) {
        await import('../services/api').then(module =>
          module.createTask({
            ...task,
            due_date: today
          })
        );
      }

      setSnackbar({
        open: true,
        message: `✨ Created ${tasks.length} task${tasks.length !== 1 ? 's' : ''} with AI!`,
        severity: 'success'
      });

      fetchTasks();
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to create tasks',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRecurringTaskCreated = () => {
    fetchRecurringTasks();
    setSnackbar({ open: true, message: 'Recurring task created successfully!', severity: 'success' });
  };

  const handleRecurringTaskUpdated = () => {
    fetchRecurringTasks();
    setSnackbar({ open: true, message: 'Recurring task updated successfully!', severity: 'success' });
  };

  const handleRecurringTaskDeleted = () => {
    fetchRecurringTasks();
    setSnackbar({ open: true, message: 'Recurring task deleted successfully!', severity: 'info' });
  };

  const handleEditRecurringTask = (task) => {
    setEditingRecurringTask(task);
    setOpenRecurringDialog(true);
  };

  const handleCloseRecurringDialog = () => {
    setOpenRecurringDialog(false);
    setEditingRecurringTask(null);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  const totalCount = tasks.length;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: '#d95550',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar sx={{ py: 0.5 }}>
          <Timer sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 0.5 }}>
            Pomovity
          </Typography>
          <Button
            color="inherit"
            startIcon={<CheckBox />}
            onClick={() => setCurrentView('tasks')}
            sx={{
              mr: 1,
              borderRadius: 2,
              px: 2,
              bgcolor: currentView === 'tasks' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Tasks
          </Button>
          {!isGuest && (
            <>
              <Button
                color="inherit"
                startIcon={<Repeat />}
                onClick={() => setCurrentView('recurring')}
                sx={{
                  mr: 1,
                  borderRadius: 2,
                  px: 2,
                  bgcolor: currentView === 'recurring' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Recurring
              </Button>
              <Button
                color="inherit"
                startIcon={<BarChart />}
                onClick={() => setCurrentView('analytics')}
                sx={{
                  mr: 2,
                  borderRadius: 2,
                  px: 2,
                  bgcolor: currentView === 'analytics' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Analytics
              </Button>
            </>
          )}
          {isGuest ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                variant="outlined"
                onClick={handleLoginClick}
                sx={{
                  borderColor: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Login
              </Button>
              <Button
                color="inherit"
                variant="contained"
                onClick={handleSignUpClick}
                sx={{
                  bgcolor: 'white',
                  color: '#d95550',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Sign Up
              </Button>
            </Box>
          ) : (
            <IconButton
              onClick={handleMenuClick}
              sx={{
                padding: 0.5,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'white',
                  color: '#d95550',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {getInitials(user?.username)}
              </Avatar>
            </IconButton>
          )}
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.5,
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    bgcolor: 'rgba(217, 85, 80, 0.08)',
                  },
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                {user?.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {user?.email}
              </Typography>
            </Box>
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">My Profile</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 8, pb: 6 }}>
        {/* Guest Mode Banner */}
        {isGuest && (
          <Alert
            severity="info"
            sx={{
              mb: 4,
              borderRadius: 2,
              border: '1px solid #3b82f6',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2">
                You're using <strong>Guest Mode</strong>. Your data is saved locally on this device.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleLoginClick}
                  sx={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                >
                  Login
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSignUpClick}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Sign Up to Save Permanently
                </Button>
              </Box>
            </Box>
          </Alert>
        )}

        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
            {currentView === 'tasks' && "Today's Tasks"}
            {currentView === 'analytics' && "Analytics"}
            {currentView === 'recurring' && "Recurring Tasks"}
          </Typography>
          {currentView === 'tasks' && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1rem' }}>
              {today}
            </Typography>
          )}
          {currentView === 'analytics' && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1rem' }}>
              Track your productivity and completion trends
            </Typography>
          )}
          {currentView === 'recurring' && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1rem' }}>
              Manage tasks that repeat automatically
            </Typography>
          )}

          {currentView === 'tasks' && (
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircle sx={{ fontSize: '1.1rem' }} />}
                label={`${completedCount} / ${totalCount} Completed`}
                sx={{
                  bgcolor: completedCount === totalCount && totalCount > 0 ? '#ecfdf5' : '#f3f4f6',
                  color: completedCount === totalCount && totalCount > 0 ? '#059669' : '#374151',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  px: 2.5,
                  py: 3,
                  height: 'auto',
                  borderRadius: 2.5,
                  border: completedCount === totalCount && totalCount > 0 ? '1px solid #059669' : '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                }}
              />
              <Chip
                icon={<Timer sx={{ fontSize: '1.1rem' }} />}
                label={`${pomodoroStats.today.count} Pomodoros`}
                sx={{
                  bgcolor: '#fff5f5',
                  color: '#d95550',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  px: 2.5,
                  py: 3,
                  height: 'auto',
                  borderRadius: 2.5,
                  border: '1.5px solid #d95550',
                  transition: 'all 0.2s ease',
                }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
                sx={{
                  bgcolor: '#d95550',
                  color: 'white',
                  fontWeight: 500,
                  px: 3,
                  fontSize: '0.95rem',
                  borderRadius: 2.5,
                  boxShadow: '0 2px 8px rgba(217, 85, 80, 0.25)',
                  '&:hover': {
                    bgcolor: '#c62828',
                    boxShadow: '0 4px 12px rgba(217, 85, 80, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Add Task
              </Button>
              <Button
                variant="outlined"
                startIcon={<Sparkles />}
                onClick={() => setAiDialogOpen(true)}
                sx={{
                  borderColor: '#d95550',
                  color: '#d95550',
                  fontWeight: 500,
                  px: 3,
                  fontSize: '0.95rem',
                  borderRadius: 2.5,
                  '&:hover': {
                    borderColor: '#c62828',
                    bgcolor: 'rgba(217, 85, 80, 0.05)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Create with AI ✨
              </Button>
            </Box>
          )}
          {currentView === 'recurring' && (
            <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenRecurringDialog(true)}
                sx={{
                  bgcolor: '#d95550',
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '0.95rem',
                  borderRadius: 2.5,
                  boxShadow: '0 2px 8px rgba(217, 85, 80, 0.25)',
                  '&:hover': {
                    bgcolor: '#c62828',
                    boxShadow: '0 4px 12px rgba(217, 85, 80, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                New Recurring Task
              </Button>
            </Box>
          )}
        </Box>

        {/* Pomodoro Timer Section */}
        {selectedTask && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                Pomodoro Timer
              </Typography>
              <IconButton
                onClick={() => {
                  const newShowTimer = !showTimer;
                  setShowTimer(newShowTimer);
                  // Clear task selection when fully collapsing
                  if (!newShowTimer) {
                    setSelectedTask(null);
                  }
                }}
                size="small"
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(217, 85, 80, 0.08)',
                  },
                }}
              >
                {showTimer ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <PomodoroTimer
              selectedTask={selectedTask}
              onComplete={handlePomodoroComplete}
              minimized={!showTimer}
            />
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 4,
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            {error}
          </Alert>
        )}

        {currentView === 'tasks' && (
          <TaskList
            tasks={tasks}
            loading={loading}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onStartPomodoro={handleStartPomodoro}
            onEditTask={handleEditTask}
          />
        )}

        {!isGuest && currentView === 'analytics' && (
          <Analytics data={analyticsData} />
        )}

        {!isGuest && currentView === 'recurring' && (
          <RecurringTasksList
            tasks={recurringTasks}
            loading={recurringLoading}
            onTaskDeleted={handleRecurringTaskDeleted}
            onOpenDialog={() => setOpenRecurringDialog(true)}
            onEditTask={handleEditRecurringTask}
          />
        )}

        <TaskDialog
          open={openDialog}
          onClose={handleCloseDialog}
          onTaskCreated={handleTaskCreated}
          editTask={editingTask}
        />

        <RecurringTaskDialog
          open={openRecurringDialog}
          onClose={() => {
            setOpenRecurringDialog(false);
            setEditingRecurringTask(null);
          }}
          onTaskCreated={handleRecurringTaskCreated}
          onTaskUpdated={handleRecurringTaskUpdated}
          task={editingRecurringTask}
        />

        <AITaskDialog
          open={aiDialogOpen}
          onClose={() => setAiDialogOpen(false)}
          onCreateTasks={handleAICreateTasks}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default Dashboard;

