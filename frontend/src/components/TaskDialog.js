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
} from '@mui/material';
import { createTask, updateTask } from '../services/api';

function TaskDialog({ open, onClose, onTaskCreated, editTask = null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    due_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title || '',
        description: editTask.description || '',
        priority: editTask.priority || 3,
        due_date: editTask.due_date || new Date().toISOString().split('T')[0],
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, formData);
      } else {
        await createTask(formData);
      }
      onTaskCreated();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editTask ? 'update' : 'create'} task`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 3,
      due_date: new Date().toISOString().split('T')[0],
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
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

          <TextField
            fullWidth
            label="Due Date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? (editTask ? 'Updating...' : 'Creating...') : (editTask ? 'Update Task' : 'Create Task')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default TaskDialog;

