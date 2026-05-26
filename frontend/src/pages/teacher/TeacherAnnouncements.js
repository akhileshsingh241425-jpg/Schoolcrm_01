import React from 'react';
import {
  Box, Typography, Paper, Button, Chip, alpha, useTheme
} from '@mui/material';
import { Announcement, Add } from '@mui/icons-material';

export default function TeacherAnnouncements() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Announcements</Typography>
        <Button variant="contained" startIcon={<Add />}
          sx={{ borderRadius: 2, textTransform: 'none' }}>
          Create Announcement
        </Button>
      </Box>
      <Paper sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
        <Announcement sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>No announcements yet</Typography>
        <Typography variant="body2" color="text.disabled">Create your first announcement to communicate with parents and students</Typography>
      </Paper>
    </Box>
  );
}
