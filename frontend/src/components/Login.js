import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Fade,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [migrationMessage, setMigrationMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  // Load remembered username
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setFormData(prev => ({ ...prev, username: rememberedUsername }));
      setRememberMe(true);
    }
  }, []);

  const validateField = (name, value) => {
    const errors = {};
    
    if (name === 'username') {
      if (!value.trim()) {
        errors.username = 'Username is required';
      } else if (value.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }
    }
    
    if (name === 'password') {
      if (!value) {
        errors.password = 'Password is required';
      } else if (value.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    
    // Clear field-specific error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errors = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, ...errors }));
  };

  const validateForm = () => {
    const usernameErrors = validateField('username', formData.username);
    const passwordErrors = validateField('password', formData.password);
    const allErrors = { ...usernameErrors, ...passwordErrors };
    
    setFieldErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await loginApi(formData.username, formData.password);
      
      // Remember username if checked
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', formData.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      
      // Login and migrate guest data if available
      const migrationResult = await login(response.access_token, response.user);
      
      // Show migration success message if data was migrated
      if (migrationResult?.migrated && migrationResult?.success) {
        const taskCount = migrationResult.tasks || 0;
        const pomodoroCount = migrationResult.pomodoros || 0;
        setMigrationMessage(
          `Welcome back! Your guest data has been saved: ${taskCount} task(s) and ${pomodoroCount} pomodoro(s).`
        );
        // Navigate after showing message
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#ffffff',
          p: 2,
        }}
      >
        <Container maxWidth="xs">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LoginIcon sx={{ fontSize: 48, color: '#d95550', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ color: '#d95550', fontWeight: 600, mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue to Pomovity
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 2, p: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                  {error}
                </Alert>
              )}
              {migrationMessage && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
                  {migrationMessage}
                </Alert>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  margin="normal"
                  required
                  autoComplete="username"
                  autoFocus
                  error={!!fieldErrors.username}
                  helperText={fieldErrors.username}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  error={!!fieldErrors.password}
                  helperText={fieldErrors.password}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={loading}
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                      disabled={loading}
                    />
                  }
                  label={<Typography variant="body2">Remember me</Typography>}
                  sx={{ mt: 1, mb: 1 }}
                />

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                  sx={{ 
                    mt: 2, 
                    mb: 2, 
                    py: 1.5,
                    borderRadius: 1.5,
                    bgcolor: '#d95550',
                    '&:hover': {
                      bgcolor: '#c62828',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Link 
                      component={RouterLink} 
                      to="/register" 
                      underline="hover" 
                      sx={{ 
                        color: '#d95550',
                        fontWeight: 500,
                        '&:hover': {
                          color: '#c62828',
                        }
                      }}
                    >
                      Create one
                    </Link>
                  </Typography>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Fade>
  );
}

export default Login;

