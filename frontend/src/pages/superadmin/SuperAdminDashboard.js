import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, alpha, useTheme
} from '@mui/material';
import { School, People, AttachMoney, TrendingUp, Business } from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    superAdminAPI.dashboard().then(res => {
      setStats(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;
  if (!stats) return <Typography>Failed to load dashboard</Typography>;

  const statCards = [
    { label: 'Total Schools', value: stats.total_schools, icon: <School />, color: '#3b82f6' },
    { label: 'Active Schools', value: stats.active_schools, icon: <Business />, color: '#10b981' },
    { label: 'Total Students', value: stats.total_students, icon: <People />, color: '#8b5cf6' },
    { label: 'Total Staff', value: stats.total_staff, icon: <People />, color: '#f59e0b' },
    { label: 'Total Revenue', value: `₹${stats.total_revenue?.toLocaleString()}`, icon: <AttachMoney />, color: '#ef4444' },
    { label: 'Inactive Schools', value: stats.inactive_schools, icon: <TrendingUp />, color: '#6b7280' },
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={3}>Super Admin Dashboard</Typography>

      <Grid container spacing={3} mb={4}>
        {statCards.map((s, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: 2, mx: 'auto', mb: 1.5,
                  bgcolor: alpha(s.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.color,
                }}>
                  {s.icon}
                </Box>
                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Plan Breakdown */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Plan Distribution</Typography>
              {Object.entries(stats.plan_breakdown || {}).map(([plan, count]) => (
                <Box key={plan} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Chip label={plan.toUpperCase()} size="small" color={
                    plan === 'premium' ? 'secondary' : plan === 'standard' ? 'primary' : 'default'
                  } />
                  <Typography fontWeight={600}>{count} schools</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Recent Subscriptions</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>School</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>End Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats.recent_subscriptions || []).map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.school_id}</TableCell>
                        <TableCell>{sub.plan?.name}</TableCell>
                        <TableCell>₹{sub.amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip size="small" label={sub.payment_status}
                            color={sub.payment_status === 'paid' ? 'success' : sub.payment_status === 'pending' ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{sub.end_date}</TableCell>
                      </TableRow>
                    ))}
                    {(!stats.recent_subscriptions?.length) && (
                      <TableRow><TableCell colSpan={5} align="center">No subscriptions yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
