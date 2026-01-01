import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Replay,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { createPomodoro } from '../services/api';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

function PomodoroTimer({ selectedTask, onComplete, minimized = false }) {
  const [minutes, setMinutes] = useState(WORK_MINUTES);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const totalSeconds = mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line no-use-before-define
  }, [isActive, isPaused, minutes, seconds, handleTimerComplete]);

  // Update browser tab title with timer countdown
  useEffect(() => {
    if (isActive && !isPaused) {
      const emoji = mode === 'work' ? '🍅' : '☕';
      const modeText = mode === 'work' ? 'Focus' : 'Break';
      document.title = `(${formatTime(minutes, seconds)}) ${emoji} ${modeText} - Task Scheduler`;
    } else {
      document.title = 'Task Scheduler';
    }

    return () => {
      document.title = 'Task Scheduler';
    };
  }, [minutes, seconds, isActive, isPaused, mode]);

  const handleTimerComplete = useCallback(async () => {
    setIsActive(false);

    // Play notification sound
    playNotificationSound();

    // Show browser notification
    showNotification();

    // Save to backend if it was a work session
    if (mode === 'work' && selectedTask) {
      try {
        await createPomodoro({
          task_id: selectedTask.id,
          duration: WORK_MINUTES,
          type: 'work'
        });
        setSessions(sessions + 1);
      } catch (err) {
        console.error('Failed to save pomodoro:', err);
      }
    }

    // Auto-switch mode
    if (mode === 'work') {
      setMode('break');
      setMinutes(BREAK_MINUTES);
      setSeconds(0);
    } else {
      setMode('work');
      setMinutes(WORK_MINUTES);
      setSeconds(0);
    }

    if (onComplete) {
      onComplete(mode);
    }
  }, [mode, selectedTask, sessions, onComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const playStartSound = () => {
    // Clock tick sound when starting
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  const playNotificationSound = () => {
    // Clock alarm sound when timer completes (3 chimes)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Play three chimes
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      const startTime = audioContext.currentTime + (i * 0.3);
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'work' ? '🎉 Work session complete!' : '☕ Break time over!';
      const body = mode === 'work'
        ? 'Time to take a break! You earned it.'
        : 'Ready to focus again? Let\'s get back to work!';

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const handleStart = () => {
    requestNotificationPermission();
    playStartSound();
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    setMinutes(mode === 'work' ? WORK_MINUTES : BREAK_MINUTES);
    setSeconds(0);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setMode('work');
    setMinutes(WORK_MINUTES);
    setSeconds(0);
  };

  const formatTime = (mins, secs) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mini timer bar for minimized state
  if (minimized) {
    return (
      <Card
        sx={{
          borderRadius: 2,
          bgcolor: mode === 'work' ? '#fff5f5' : '#eff6ff',
          border: `2px solid ${mode === 'work' ? '#d95550' : '#4c9aff'}`,
        }}
      >
        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: mode === 'work' ? '#d95550' : '#4c9aff',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <span>{mode === 'work' ? '🍅' : '☕'}</span>
            <span>{formatTime(minutes, seconds)}</span>
            <span style={{ fontSize: '0.9rem' }}>•</span>
            <span style={{ fontSize: '1rem' }}>{mode === 'work' ? 'Focus Time' : 'Break Time'}</span>
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 2,
        bgcolor: mode === 'work' ? '#fff5f5' : '#eff6ff',
        border: `2px solid ${mode === 'work' ? '#d95550' : '#4c9aff'}`,
      }}
    >
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <TimerIcon sx={{ color: mode === 'work' ? '#d95550' : '#4c9aff' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: mode === 'work' ? '#d95550' : '#4c9aff' }}>
            {mode === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
          </Typography>
        </Box>

        {selectedTask && mode === 'work' && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Working on: <strong>{selectedTask.title}</strong>
          </Typography>
        )}

        <Box sx={{ position: 'relative', display: 'inline-flex', my: 3 }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={180}
            thickness={4}
            sx={{
              color: mode === 'work' ? '#d95550' : '#4c9aff',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 600, color: '#333', fontFamily: 'monospace' }}>
              {formatTime(minutes, seconds)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {mode === 'work' ? 'minutes' : 'break'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
          {!isActive ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStart}
              sx={{
                bgcolor: mode === 'work' ? '#d95550' : '#4c9aff',
                '&:hover': {
                  bgcolor: mode === 'work' ? '#c62828' : '#2b6cb0',
                },
                px: 3,
              }}
            >
              Start
            </Button>
          ) : (
            <>
              <IconButton
                onClick={handlePause}
                sx={{
                  bgcolor: isPaused ? '#4caf50' : '#f59e0b',
                  color: 'white',
                  '&:hover': {
                    bgcolor: isPaused ? '#388e3c' : '#d97706',
                  },
                }}
              >
                {isPaused ? <PlayArrow /> : <Pause />}
              </IconButton>
              <IconButton
                onClick={handleStop}
                sx={{
                  bgcolor: '#ef4444',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#dc2626',
                  },
                }}
              >
                <Stop />
              </IconButton>
            </>
          )}
          <IconButton
            onClick={handleReset}
            sx={{
              bgcolor: '#e0e0e0',
              '&:hover': {
                bgcolor: '#bdbdbd',
              },
            }}
          >
            <Replay />
          </IconButton>
        </Box>

        {sessions > 0 && (
          <Chip
            label={`${sessions} Pomodoro${sessions > 1 ? 's' : ''} completed today`}
            sx={{
              bgcolor: '#4caf50',
              color: 'white',
              fontWeight: 500,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default PomodoroTimer;

