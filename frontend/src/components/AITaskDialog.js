import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    Box,
    Typography,
    Alert,
    Divider
} from '@mui/material';
import { Delete, Close, AutoAwesome, Mic, MicOff } from '@mui/icons-material';

function AITaskDialog({ open, onClose, onCreateTasks }) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState([]);
    const [error, setError] = useState('');

    // Voice recognition state
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [browserSupportsVoice, setBrowserSupportsVoice] = useState(true);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();

            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    }
                }

                if (finalTranscript) {
                    setDescription(prev => prev + finalTranscript);
                }
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setError('Microphone permission denied. Please allow microphone access in your browser settings.');
                } else if (event.error === 'no-speech') {
                    setError('No speech detected. Please try again.');
                }
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        } else {
            setBrowserSupportsVoice(false);
        }
    }, []);

    const startListening = () => {
        if (recognition) {
            setError('');
            setIsListening(true);
            try {
                recognition.start();
            } catch (err) {
                console.error('Failed to start recognition:', err);
                setIsListening(false);
            }
        }
    };

    const stopListening = () => {
        if (recognition) {
            setIsListening(false);
            try {
                recognition.stop();
            } catch (err) {
                console.error('Failed to stop recognition:', err);
            }
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/generate-tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ description })
            });

            const data = await response.json();

            if (response.ok) {
                setGeneratedTasks(data.tasks);
            } else {
                setError(data.error || 'Failed to generate tasks');
            }
        } catch (err) {
            console.error('AI generation error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        if (generatedTasks.length > 0) {
            onCreateTasks(generatedTasks);
            handleClose();
        }
    };

    const handleClose = () => {
        setDescription('');
        setGeneratedTasks([]);
        setError('');
        setLoading(false);
        onClose();
    };

    const handleRemoveTask = (index) => {
        setGeneratedTasks(prev => prev.filter((_, i) => i !== index));
    };


    const getPriorityLabel = (priority) => {
        const labels = {
            1: 'Low',
            2: 'Below Normal',
            3: 'Normal',
            4: 'High',
            5: 'Urgent'
        };
        return labels[priority] || 'Normal';
    };

    const getPriorityColor = (priority) => {
        if (priority >= 4) return '#d95550';
        if (priority === 3) return '#f59e0b';
        return '#4c9aff';
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'rgba(217, 85, 80, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <AutoAwesome sx={{ color: '#d95550', fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
                                Create Tasks with AI
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Describe your goal and let AI break it into actionable tasks
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                <TextField
                    autoFocus
                    margin="dense"
                    label="What do you want to accomplish?"
                    placeholder="e.g., Plan my product launch, Prepare for my exam, Organize wedding"
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading || generatedTasks.length > 0}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: '#fafafa'
                        }
                    }}
                />

                {loading && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                        <CircularProgress sx={{ color: '#d95550', mb: 2 }} />
                        <Typography color="text.secondary" variant="body2">
                            AI is thinking... ✨
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                {generatedTasks.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: '#1f2937', fontWeight: 600, mb: 2 }}>
                            Generated Tasks ({generatedTasks.length})
                        </Typography>
                        <List sx={{ bgcolor: '#fafafa', borderRadius: 2, p: 1 }}>
                            {generatedTasks.map((task, index) => (
                                <Box key={index}>
                                    <ListItem
                                        sx={{
                                            bgcolor: '#ffffff',
                                            borderRadius: 2,
                                            mb: 1,
                                            border: '1px solid #e5e7eb',
                                            '&:hover': {
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                                            }
                                        }}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleRemoveTask(index)}
                                                size="small"
                                                sx={{ color: '#999' }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {task.title}
                                                    </Typography>
                                                    <Chip
                                                        label={getPriorityLabel(task.priority)}
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 500,
                                                            bgcolor: `${getPriorityColor(task.priority)}15`,
                                                            color: getPriorityColor(task.priority),
                                                            border: `1px solid ${getPriorityColor(task.priority)}`
                                                        }}
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {task.description}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                </Box>
                            ))}
                        </List>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            💡 Tip: You can remove tasks before creating them
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, gap: 1 }}>
                <Button onClick={handleClose} sx={{ color: '#6b7280' }}>
                    Cancel
                </Button>
                {generatedTasks.length === 0 ? (
                    <Button
                        onClick={handleGenerate}
                        disabled={!description.trim() || loading}
                        variant="contained"
                        startIcon={<AutoAwesome />}
                        sx={{
                            bgcolor: '#d95550',
                            '&:hover': { bgcolor: '#c62828' },
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Generate Tasks
                    </Button>
                ) : (
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        sx={{
                            bgcolor: '#d95550',
                            '&:hover': { bgcolor: '#c62828' },
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        Create {generatedTasks.length} Task{generatedTasks.length !== 1 ? 's' : ''}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default AITaskDialog;
