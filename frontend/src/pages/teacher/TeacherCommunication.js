import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Skeleton, alpha, useTheme,
  Button, Grid, Card, CardContent, TextField, MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import {
  Send, Sms, Email, Announcement, People, History
} from '@mui/icons-material';

export default function TeacherCommunication() {
  const [loading, setLoading] = useState(true);
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

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Communication</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
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

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
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

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, cursor: 'pointer',
            transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
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

      <Paper sx={{ mt: 3, borderRadius: 3, overflow: 'hidden', p: 4, textAlign: 'center' }}>
        <History sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="h6" color="text.secondary">No message history yet</Typography>
        <Typography variant="body2" color="text.disabled">Messages you send will appear here</Typography>
      </Paper>
    </Box>
  );
}
