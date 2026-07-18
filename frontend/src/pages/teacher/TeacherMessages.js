import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Message } from '@mui/icons-material';

export default function TeacherMessages() {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Message History</Typography>
      <Paper sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
        <Message sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="h6" color="text.secondary">No messages yet</Typography>
        <Typography variant="body2" color="text.disabled">Your sent and received messages will appear here</Typography>
      </Paper>
    </Box>
  );
}
