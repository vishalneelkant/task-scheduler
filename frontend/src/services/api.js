import axios from 'axios';
import * as localStorageService from './localStorage';

// Dynamic API URL configuration
// In production (Vercel), uses relative path '/api'
// In development, uses localhost:5000
const API_URL = process.env.REACT_APP_API_URL || 
                (process.env.NODE_ENV === 'production' 
                  ? '/api' 
                  : 'http://localhost:5000/api');

// Helper to check if user is in guest mode
const isGuestMode = () => {
  return !localStorage.getItem('token');
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = async (username, email, password) => {
  const response = await api.post('/register', { username, email, password });
  return response.data;
};

export const login = async (username, password) => {
  const response = await api.post('/login', { username, password });
  return response.data;
};

// Profile APIs
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/profile', profileData);
  return response.data;
};

export const updatePassword = async (passwordData) => {
  const response = await api.put('/profile/password', passwordData);
  return response.data;
};

// Task APIs
export const getTasks = async () => {
  if (isGuestMode()) {
    const tasks = localStorageService.getTasks();
    return { tasks };
  }
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (taskData) => {
  if (isGuestMode()) {
    const task = localStorageService.createTask(taskData);
    return { task };
  }
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  if (isGuestMode()) {
    const task = localStorageService.updateTask(taskId, taskData);
    return { task };
  }
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  if (isGuestMode()) {
    localStorageService.deleteTask(taskId);
    return { message: 'Task deleted' };
  }
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const toggleTask = async (taskId) => {
  if (isGuestMode()) {
    const tasks = localStorageService.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = localStorageService.updateTask(taskId, { completed: !task.completed });
      return { task: updatedTask };
    }
    throw new Error('Task not found');
  }
  const response = await api.post(`/tasks/${taskId}/toggle`);
  return response.data;
};

export const getAnalytics = async () => {
  if (isGuestMode()) {
    // Analytics not available for guests
    return {
      total_tasks: 0,
      completed_tasks: 0,
      pending_tasks: 0,
      completion_rate: 0,
      weekly_stats: [],
    };
  }
  const response = await api.get('/analytics');
  return response.data;
};

export const createPomodoro = async (pomodoroData) => {
  if (isGuestMode()) {
    const pomodoro = localStorageService.createPomodoro(pomodoroData);
    return { pomodoro };
  }
  const response = await api.post('/pomodoros', pomodoroData);
  return response.data;
};

export const getPomodoroStats = async () => {
  if (isGuestMode()) {
    return localStorageService.getPomodoroStats();
  }
  const response = await api.get('/pomodoros/stats');
  return response.data;
};

// Recurring Tasks APIs
export const getRecurringTasks = async () => {
  const response = await api.get('/recurring-tasks');
  return response.data;
};

export const createRecurringTask = async (taskData) => {
  const response = await api.post('/tasks', { ...taskData, is_recurring: true });
  return response.data;
};

export const updateRecurringTask = async (taskId, taskData) => {
  const response = await api.put(`/recurring-tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteRecurringTask = async (taskId) => {
  const response = await api.delete(`/recurring-tasks/${taskId}`);
  return response.data;
};

export default api;

