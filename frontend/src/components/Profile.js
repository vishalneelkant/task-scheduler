import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  AppBar,
  Toolbar,
  Fade,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Lock,
  Email,
  Person,
  Timer,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { updateProfile, updatePassword } from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || name?.substring(0, 2).toUpperCase() || 'U';
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
    setPasswordErrors({});
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await updateProfile({
        username: formData.username,
        email: formData.email,
      });
      
      // Update user in context with new token
      login(response.access_token, response.user);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updatePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });
      
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordErrors({ 
        currentPassword: err.response?.data?.error || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setEditMode(false);
    setError('');
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Fade in timeout={500}>
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
            <IconButton
              color="inherit"
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <Timer sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: 0.5 }}>
              Pomovity
            </Typography>
            <Typography variant="body2" sx={{ mr: 2, opacity: 0.95 }}>
              {user?.username}
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 8, pb: 6 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#d95550',
                fontSize: '2.5rem',
                fontWeight: 600,
                margin: '0 auto',
                mb: 2,
                boxShadow: '0 4px 12px rgba(217, 85, 80, 0.3)',
              }}
            >
              {getInitials(user?.username)}
            </Avatar>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1f2937' }}>
              My Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your account settings
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <Card sx={{ borderRadius: 2, mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                  Account Information
                </Typography>
                {!editMode && (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{
                      bgcolor: '#d95550',
                      color: 'white',
                      '&:hover': {
                        bgcolor: '#c62828',
                      },
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                  <Person sx={{ mt: 2, mr: 2, color: 'text.secondary' }} />
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={!editMode || loading}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                  <Email sx={{ mt: 2, mr: 2, color: 'text.secondary' }} />
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!editMode || loading}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Box>

                {editMode && (
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancelEdit}
                      disabled={loading}
                      sx={{
                        borderColor: '#d95550',
                        color: '#d95550',
                        '&:hover': {
                          borderColor: '#c62828',
                          bgcolor: 'rgba(217, 85, 80, 0.04)',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                      disabled={loading}
                      sx={{
                        bgcolor: '#d95550',
                        '&:hover': {
                          bgcolor: '#c62828',
                        },
                      }}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                )}
              </form>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
                Security
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Change your password to keep your account secure
                  </Typography>
                </Box>
                <Button
                  startIcon={<Lock />}
                  onClick={() => setOpenPasswordDialog(true)}
                  sx={{
                    bgcolor: '#d95550',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#c62828',
                    },
                  }}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Password Change Dialog */}
          <Dialog 
            open={openPasswordDialog} 
            onClose={() => !loading && setOpenPasswordDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <form onSubmit={handlePasswordSubmit}>
              <DialogTitle>Change Password</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  required
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  required
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword || 'Minimum 6 characters'}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  required
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                  onClick={() => setOpenPasswordDialog(false)} 
                  disabled={loading}
                  sx={{ color: 'text.secondary' }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  sx={{
                    bgcolor: '#d95550',
                    '&:hover': {
                      bgcolor: '#c62828',
                    },
                  }}
                >
                  {loading ? 'Saving...' : 'Change Password'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>

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
    </Fade>
  );
}

export default Profile;





