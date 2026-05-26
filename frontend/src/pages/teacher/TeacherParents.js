import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, IconButton, Button, alpha, useTheme, TextField,
  InputAdornment
} from '@mui/material';
import { People, Phone, Email, Search, Message } from '@mui/icons-material';

export default function TeacherParents() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const parents = [
    { id: 1, name: 'Mr. Amit Singh', student: 'Raj Singh', class: '10-A', phone: '98765-10001', email: 'amit.singh@email.com' },
    { id: 2, name: 'Mrs. Sunita Sharma', student: 'Priya Sharma', class: '10-A', phone: '98765-10002', email: 'sunita.sharma@email.com' },
    { id: 3, name: 'Mr. Rajesh Verma', student: 'Amit Verma', class: '10-A', phone: '98765-10003', email: 'rajesh.verma@email.com' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Parent Contacts</Typography>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField size="small" placeholder="Search parents..."
          sx={{ width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
      </Paper>
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parent Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {parents.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, fontSize: '0.7rem' }}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{p.student}</TableCell>
                  <TableCell><Chip label={p.class} size="small" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{p.phone}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{p.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.08), width: 28, height: 28 }}>
                        <Phone sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08), width: 28, height: 28 }}>
                        <Email sx={{ fontSize: 14 }} />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.08), width: 28, height: 28 }}>
                        <Message sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
