// Local Storage Service for Guest Users

const TASKS_KEY = 'pomovity_guest_tasks';
const POMODOROS_KEY = 'pomovity_guest_pomodoros';
const TASK_ID_COUNTER = 'pomovity_task_id_counter';

// Task Management
export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
    return false;
  }
};

export const getTasks = () => {
  try {
    const tasks = localStorage.getItem(TASKS_KEY);
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return [];
  }
};

export const createTask = (task) => {
  try {
    const tasks = getTasks();
    const counter = getTaskIdCounter();
    const newTask = {
      ...task,
      id: counter,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed: false,
    };
    tasks.push(newTask);
    saveTasks(tasks);
    incrementTaskIdCounter();
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = (taskId, updates) => {
  try {
    const tasks = getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveTasks(tasks);
    return tasks[taskIndex];
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = (taskId) => {
  try {
    const tasks = getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    saveTasks(filteredTasks);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Task ID Counter Management
const getTaskIdCounter = () => {
  try {
    const counter = localStorage.getItem(TASK_ID_COUNTER);
    return counter ? parseInt(counter, 10) : 1;
  } catch (error) {
    return 1;
  }
};

const incrementTaskIdCounter = () => {
  try {
    const counter = getTaskIdCounter();
    localStorage.setItem(TASK_ID_COUNTER, (counter + 1).toString());
  } catch (error) {
    console.error('Error incrementing task ID counter:', error);
  }
};

// Pomodoro Management
export const savePomodoros = (pomodoros) => {
  try {
    localStorage.setItem(POMODOROS_KEY, JSON.stringify(pomodoros));
    return true;
  } catch (error) {
    console.error('Error saving pomodoros to localStorage:', error);
    return false;
  }
};

export const getPomodoros = () => {
  try {
    const pomodoros = localStorage.getItem(POMODOROS_KEY);
    return pomodoros ? JSON.parse(pomodoros) : [];
  } catch (error) {
    console.error('Error reading pomodoros from localStorage:', error);
    return [];
  }
};

export const createPomodoro = (pomodoro) => {
  try {
    const pomodoros = getPomodoros();
    const newPomodoro = {
      ...pomodoro,
      id: Date.now(),
      created_at: new Date().toISOString(),
    };
    pomodoros.push(newPomodoro);
    savePomodoros(pomodoros);
    return newPomodoro;
  } catch (error) {
    console.error('Error creating pomodoro:', error);
    throw error;
  }
};

export const getPomodoroStats = () => {
  try {
    const pomodoros = getPomodoros();
    const today = new Date().toDateString();
    
    const todayPomodoros = pomodoros.filter(p => {
      const pomodoroDate = new Date(p.created_at).toDateString();
      return pomodoroDate === today;
    });
    
    const focusTime = todayPomodoros.reduce((total, p) => total + (p.duration || 25), 0);
    
    return {
      today: {
        count: todayPomodoros.length,
        focus_time: focusTime,
      },
      total: {
        count: pomodoros.length,
        focus_time: pomodoros.reduce((total, p) => total + (p.duration || 25), 0),
      },
    };
  } catch (error) {
    console.error('Error calculating pomodoro stats:', error);
    return {
      today: { count: 0, focus_time: 0 },
      total: { count: 0, focus_time: 0 },
    };
  }
};

// Data Management
export const hasGuestData = () => {
  const tasks = getTasks();
  const pomodoros = getPomodoros();
  return tasks.length > 0 || pomodoros.length > 0;
};

export const getGuestData = () => {
  return {
    tasks: getTasks(),
    pomodoros: getPomodoros(),
  };
};

export const clearGuestData = () => {
  try {
    localStorage.removeItem(TASKS_KEY);
    localStorage.removeItem(POMODOROS_KEY);
    localStorage.removeItem(TASK_ID_COUNTER);
    return true;
  } catch (error) {
    console.error('Error clearing guest data:', error);
    return false;
  }
};

const localStorageService = {
  saveTasks,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  savePomodoros,
  getPomodoros,
  createPomodoro,
  getPomodoroStats,
  hasGuestData,
  getGuestData,
  clearGuestData,
};

export default localStorageService;

