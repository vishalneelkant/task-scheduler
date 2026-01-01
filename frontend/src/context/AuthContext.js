import React, { createContext, useState, useContext, useEffect } from 'react';
import { hasGuestData, getGuestData, clearGuestData } from '../services/localStorage';
import { createTask as createTaskAPI, createPomodoro as createPomodoroAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const GUEST_USER = {
  username: 'Guest',
  email: null,
  isGuest: true,
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    // If no user is logged in, default to guest mode
    return GUEST_USER;
  });
  const [isGuest, setIsGuest] = useState(!localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      setIsGuest(false);
    } else {
      localStorage.removeItem('token');
      setIsGuest(true);
    }
  }, [token]);

  useEffect(() => {
    if (user && !user.isGuest) {
      localStorage.setItem('user', JSON.stringify(user));
    } else if (!user) {
      localStorage.removeItem('user');
    }
  }, [user]);

  const migrateGuestData = async () => {
    if (!hasGuestData() || isGuest) {
      return { success: true, migrated: false };
    }

    try {
      const guestData = getGuestData();
      let migratedTasks = 0;
      let migratedPomodoros = 0;

      // Migrate tasks
      for (const task of guestData.tasks) {
        try {
          await createTaskAPI({
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            completed: task.completed,
          });
          migratedTasks++;
        } catch (error) {
          console.error('Error migrating task:', error);
        }
      }

      // Migrate pomodoros
      for (const pomodoro of guestData.pomodoros) {
        try {
          await createPomodoroAPI({
            task_id: null, // Guest pomodoros won't have task associations
            duration: pomodoro.duration,
            type: pomodoro.type || 'work',
          });
          migratedPomodoros++;
        } catch (error) {
          console.error('Error migrating pomodoro:', error);
        }
      }

      // Clear guest data after successful migration
      clearGuestData();

      return {
        success: true,
        migrated: true,
        tasks: migratedTasks,
        pomodoros: migratedPomodoros,
      };
    } catch (error) {
      console.error('Error during guest data migration:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setIsGuest(false);
    
    // Migrate guest data if available
    const migrationResult = await migrateGuestData();
    return migrationResult;
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(GUEST_USER);
    setIsGuest(true);
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      isGuest, 
      login, 
      updateUser, 
      logout, 
      migrateGuestData 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

