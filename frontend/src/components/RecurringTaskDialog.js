import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import { Repeat } from '@mui/icons-material';
import { createRecurringTask, updateRecurringTask } from '../services/api';

const WEEKDAYS = [
  { value: 0, label: 'Mon' },
  { value: 1, label: 'Tue' },
  { value: 2, label: 'Wed' },
  { value: 3, label: 'Thu' },
  { value: 4, label: 'Fri' },
  { value: 5, label: 'Sat' },
  { value: 6, label: 'Sun' },
];

function RecurringTaskDialog({ open, onClose, onTaskCreated, editTask = null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    recurrence_type: 'daily',
    recurrence_days: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title || '',
        description: editTask.description || '',
        priority: editTask.priority || 3,
        recurrence_type: editTask.recurrence_type || 'daily',
        recurrence_days: editTask.recurrence_days 
          ? editTask.recurrence_days.split(',').map(d => parseInt(d.trim()))
          : [],
      });
    }
  }, [editTask]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleRecurrenceTypeChange = (e) => {
    setFormData({
      ...formData,
      recurrence_type: e.target.value,
      recurrence_days: e.target.value === 'daily' ? [] : formData.recurrence_days,
    });
  };

  const handleDayToggle = (event, newDays) => {
    if (newDays.length > 0) {
      setFormData({
        ...formData,
        recurrence_days: newDays.sort((a, b) => a - b),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.recurrence_type === 'weekly' && formData.recurrence_days.length === 0) {
      setError('Please select at least one day for weekly recurrence');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        recurrence_type: formData.recurrence_type,
        recurrence_days: formData.recurrence_type === 'weekly' 
          ? formData.recurrence_days.join(',') 
          : null,
        due_date: new Date().toISOString().split('T')[0],
      };

      if (editTask) {
        await updateRecurringTask(editTask.id, taskData);
      } else {
        await createRecurringTask(taskData);
      }
      
      onTaskCreated();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save recurring task');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 3,
      recurrence_type: 'daily',
      recurrence_days: [],
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Repeat />
          {editTask ? 'Edit Recurring Task' : 'Create Recurring Task'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            autoFocus
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              label="Priority"
            >
              <MenuItem value={1}>Low (1)</MenuItem>
              <MenuItem value={2}>Low-Medium (2)</MenuItem>
              <MenuItem value={3}>Medium (3)</MenuItem>
              <MenuItem value={4}>High (4)</MenuItem>
              <MenuItem value={5}>Critical (5)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Recurrence</InputLabel>
            <Select
              name="recurrence_type"
              value={formData.recurrence_type}
              onChange={handleRecurrenceTypeChange}
              label="Recurrence"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </Select>
          </FormControl>

          {formData.recurrence_type === 'weekly' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Select days of the week:
              </Typography>
              <ToggleButtonGroup
                value={formData.recurrence_days}
                onChange={handleDayToggle}
                aria-label="weekdays"
                multiple
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  '& .MuiToggleButton-root': {
                    flex: '0 0 auto',
                    minWidth: '48px',
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    '&.Mui-selected': {
                      bgcolor: '#d95550',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#c62828',
                      },
                    },
                  },
                }}
              >
                {WEEKDAYS.map((day) => (
                  <ToggleButton key={day.value} value={day.value}>
                    {day.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          <Box sx={{ mt: 2, p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> This task will automatically appear on your task list 
              {formData.recurrence_type === 'daily' 
                ? ' every day'
                : formData.recurrence_days.length > 0
                  ? ` every ${formData.recurrence_days.map(d => WEEKDAYS[d].label).join(', ')}`
                  : ' on selected days'
              }.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            sx={{
              bgcolor: '#d95550',
              '&:hover': {
                bgcolor: '#c62828',
              },
            }}
          >
            {loading ? 'Saving...' : editTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default RecurringTaskDialog;

