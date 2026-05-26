import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, Avatar, Skeleton, alpha, useTheme, IconButton,
  Tooltip, Button, Grid, Card, CardContent, TextField, TextareaAutosize,
  MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
  ListItemAvatar, ListItemText, Divider, Snackbar, Alert
} from '@mui/material';
import {
  Refresh, Send, Sms, Email, Announcement, Message, Phone,
  People, History, Add, School, CheckCircle, Schedule
} from '@mui/icons-material';

export default function TeacherCommunication() {
  const [loading, setLoading] = useState(true);
  const [sendType, setSendType] = useState('sms');
  const [sendDialog, setSendDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Communication</Typography>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  const recentMessages = [
    { id: 1, to: 'Class 10-A Parents', subject: 'Exam Schedule Update', sent: '2026-05-26 10:30', status: 'delivered', type: 'sms' },
    { id: 2, to: 'Raj Singh Parent', subject: 'Attendance Alert', sent: '2026-05-26 09:15', status: 'delivered', type: 'sms' },
    { id: 3, to: 'Class 9-B Parents', subject: 'PTM Reminder', sent: '2026-05-25 14:00', status: 'delivered', type: 'email' },
    { id: 4, to: 'Priya Sharma Parent', subject: 'Homework Pending', sent: '2026-05-25 11:20', status: 'failed', type: 'sms' },
  ];

  const handleSend = () => {
    setSendDialog(false);
    setSnackbar({ open: true, message: 'Message sent successfully!', severity: 'success' });
    setMessage('');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>Communication</Typography>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => setSendDialog(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          New Message
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Send Message Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
            onClick={() => setSendDialog(true)}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5,
                bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                <Send />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Send SMS / Email</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Send messages to parents and students
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Announcements Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
            onClick={() => navigate('/teacher/announcements')}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5,
                bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                <Announcement />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Announcements</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create announcements for classes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Parent Contacts Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}
            onClick={() => navigate('/teacher/parents')}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5,
                bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <People />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Parent Contacts</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                View and manage parent directory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Messages */}
      <Paper sx={{ mt: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>Message History</Typography>
          </Box>
          <Chip label={`${recentMessages.length} total`} size="small" sx={{ height: 22 }} />
        </Box>
        <List disablePadding>
          {recentMessages.map((msg, idx) => (
            <ListItem key={msg.id} divider={idx < recentMessages.length - 1} sx={{ px: 2.5, py: 1.5 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: msg.type === 'sms' ? alpha(PRIMARY, 0.1) : alpha('#ef4444', 0.1),
                  color: msg.type === 'sms' ? PRIMARY : '#ef4444', width: 38, height: 38 }}>
                  {msg.type === 'sms' ? <Sms sx={{ fontSize: 18 }} /> : <Email sx={{ fontSize: 18 }} />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{msg.subject}</Typography>
                    <Chip label={msg.type.toUpperCase()} size="small"
                      sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(PRIMARY, 0.06) }} />
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    To: {msg.to} • {msg.sent}
                  </Typography>
                }
              />
              <Chip label={msg.status} size="small"
                color={msg.status === 'delivered' ? 'success' : 'error'}
                sx={{ height: 22, fontSize: '0.65rem' }} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Send Message Dialog */}
      <Dialog open={sendDialog} onClose={() => setSendDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Send Message</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
            <Button variant={sendType === 'sms' ? 'contained' : 'outlined'}
              startIcon={<Sms />} onClick={() => setSendType('sms')}
              sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}>
              SMS
            </Button>
            <Button variant={sendType === 'email' ? 'contained' : 'outlined'}
              startIcon={<Email />} onClick={() => setSendType('email')}
              sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}>
              Email
            </Button>
          </Box>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Send To</InputLabel>
            <Select label="Send To" defaultValue="class">
              <MenuItem value="class">Whole Class (10-A)</MenuItem>
              <MenuItem value="multiple">Multiple Students</MenuItem>
              <MenuItem value="single">Single Student</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Class</InputLabel>
            <Select label="Select Class">
              <MenuItem value="10a">Class 10-A</MenuItem>
              <MenuItem value="10b">Class 10-B</MenuItem>
              <MenuItem value="9a">Class 9-A</MenuItem>
            </Select>
          </FormControl>

          <TextField fullWidth size="small" label="Subject" sx={{ mb: 2 }} />

          <TextField fullWidth multiline rows={4} label="Message"
            value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Type your message here..." />

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel control={<Switch defaultChecked />} label="Use Template" />
            <Button size="small" variant="text" sx={{ textTransform: 'none' }}>Select Template</Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSendDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />}
            onClick={handleSend} disabled={!message.trim()}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Send {sendType === 'sms' ? 'SMS' : 'Email'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
