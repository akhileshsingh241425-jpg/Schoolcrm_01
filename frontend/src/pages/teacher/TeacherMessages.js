import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem, ListItemAvatar, ListItemText,
  Avatar, Chip, Button, alpha, useTheme
} from '@mui/material';
import { Message, Sms, Email } from '@mui/icons-material';

export default function TeacherMessages() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const messages = [
    { id: 1, to: 'Class 10-A Parents', subject: 'Exam Schedule Update', date: '2026-05-26', type: 'sms', status: 'delivered' },
    { id: 2, to: 'Raj Singh Parent', subject: 'Attendance Alert', date: '2026-05-25', type: 'sms', status: 'delivered' },
    { id: 3, to: 'All Parents', subject: 'PTM Reminder', date: '2026-05-24', type: 'email', status: 'delivered' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Message History</Typography>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <List disablePadding>
          {messages.map((msg, idx) => (
            <ListItem key={msg.id} divider={idx < messages.length - 1} sx={{ px: 2.5, py: 2 }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: msg.type === 'sms' ? alpha(PRIMARY, 0.1) : alpha('#ef4444', 0.1),
                  color: msg.type === 'sms' ? PRIMARY : '#ef4444' }}>
                  {msg.type === 'sms' ? <Sms /> : <Email />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>{msg.subject}</Typography>}
                secondary={`To: ${msg.to} • ${msg.date}`}
              />
              <Chip label={msg.status} size="small" color="success" sx={{ height: 22 }} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
