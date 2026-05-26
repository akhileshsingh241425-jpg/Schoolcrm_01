import React from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  alpha, useTheme, Avatar
} from '@mui/material';
import {
  AccountBalance, Download, CheckCircle, CalendarMonth, Receipt
} from '@mui/icons-material';

export default function TeacherPayroll() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const payslips = [
    { month: 'May 2026', salary: '₹45,000', status: 'pending', date: '01 Jun 2026' },
    { month: 'April 2026', salary: '₹45,000', status: 'paid', date: '01 May 2026' },
    { month: 'March 2026', salary: '₹45,000', status: 'paid', date: '01 Apr 2026' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Payroll</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5, bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                <AccountBalance />
              </Avatar>
              <Typography variant="h4" fontWeight={800}>₹45,000</Typography>
              <Typography variant="body2" color="text.secondary">Current Monthly Salary</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>Payslip History</Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payslips.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{p.month}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.salary}</TableCell>
                      <TableCell>
                        <Chip label={p.status} size="small"
                          color={p.status === 'paid' ? 'success' : 'warning'}
                          sx={{ height: 22, fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{p.date}</TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Download />}
                          disabled={p.status === 'pending'}
                          sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
