import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Paper, List, ListItem, ListItemText,
  Chip, Avatar, ListItemAvatar, Skeleton, alpha, useTheme
} from '@mui/material';
import {
  People, School, AttachMoney, Campaign, PersonAdd, CalendarMonth,
  TrendingUp, ArrowForwardIos
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const StatCard = ({ title, value, icon, gradient, shadowColor }) => (
  <Card sx={{ overflow: 'visible', position: 'relative' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ pt: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{
          width: 52, height: 52, borderRadius: 3,
          background: gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px ${shadowColor}`,
          color: '#fff',
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="rounded" height={32} width={300} sx={{ mb: 1, borderRadius: 2 }} />
    <Skeleton variant="rounded" height={18} width={200} sx={{ mb: 4, borderRadius: 1 }} />
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map(i => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rounded" height={110} sx={{ borderRadius: 4 }} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  // Redirect parent users to their portal
  useEffect(() => {
    if (user?.role?.name === 'parent') navigate('/my-children', { replace: true });
  }, [user, navigate]);

  const GRADIENTS = {
    primary: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
    secondary: `linear-gradient(135deg, ${SECONDARY} 0%, ${theme.palette.primary.light} 100%)`,
    success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
  };

  useEffect(() => {
    dashboardAPI.get()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <Typography color="error">Failed to load dashboard</Typography>;

  const { stats, recent_leads, recent_payments } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 50%, ${theme.palette.primary.light} 100%)`,
        borderRadius: { xs: 3, md: 4 }, p: { xs: 2.5, sm: 3, md: 3.5 }, mb: { xs: 2, md: 3 }, position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: -30, right: -30, width: { xs: 100, md: 160 }, height: { xs: 100, md: 160 },
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -40, right: 80, width: { xs: 80, md: 120 }, height: { xs: 80, md: 120 },
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)',
        }} />
        <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>
          {greeting}, {user?.first_name || 'User'} 👋
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Here's what's happening at your school today
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={stats.total_students} icon={<People />} gradient={GRADIENTS.primary} shadowColor={alpha(PRIMARY, 0.35)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Staff" value={stats.total_staff} icon={<School />} gradient={GRADIENTS.secondary} shadowColor={alpha(SECONDARY, 0.35)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Fee Collected" value={`₹${stats.monthly_fee_collection?.toLocaleString() || 0}`} icon={<AttachMoney />} gradient={GRADIENTS.success} shadowColor={alpha('#10b981', 0.35)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="New Leads" value={stats.new_leads_this_month} icon={<Campaign />} gradient={GRADIENTS.warning} shadowColor={alpha('#f59e0b', 0.35)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Attendance Today" value={`${stats.attendance_today?.percentage || 0}%`} icon={<CalendarMonth />} gradient={GRADIENTS.info} shadowColor={alpha('#3b82f6', 0.35)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Admissions" value={stats.pending_admissions} icon={<PersonAdd />} gradient={GRADIENTS.error} shadowColor={alpha('#ef4444', 0.35)} />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Recent Leads</Typography>
              </Box>
              <Chip label={recent_leads?.length || 0} size="small" color="primary" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {recent_leads?.map((lead, idx) => (
                <ListItem key={lead.id} divider={idx < recent_leads.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}>
                      {lead.student_name?.[0] || 'L'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{lead.student_name}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{lead.phone} • {lead.class_interested || 'N/A'}</Typography>}
                  />
                  <Chip label={lead.status} size="small" color={lead.status === 'new' ? 'primary' : 'default'} />
                </ListItem>
              ))}
              {(!recent_leads || recent_leads.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No recent leads</Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Recent Payments</Typography>
              </Box>
              <Chip label={recent_payments?.length || 0} size="small" color="success" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {recent_payments?.map((payment, idx) => (
                <ListItem key={payment.id} divider={idx < recent_payments.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}>
                      ₹
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>₹{payment.amount_paid?.toLocaleString()}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{payment.payment_mode} • {payment.payment_date}</Typography>}
                  />
                  <Chip label={payment.status} size="small" color={payment.status === 'completed' ? 'success' : 'default'} />
                </ListItem>
              ))}
              {(!recent_payments || recent_payments.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No recent payments</Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
