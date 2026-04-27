import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Paper, List, ListItem, ListItemText,
  Chip, Avatar, ListItemAvatar, Skeleton, alpha, useTheme, IconButton, Tooltip
} from '@mui/material';
import {
  People, School, AttachMoney, Campaign, PersonAdd, CalendarMonth,
  TrendingUp, ArrowForwardIos, Refresh
} from '@mui/icons-material';
import { dashboardAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const LOGO_CRM = '/assets/images/logo-crm.svg';
const CLASSROOM_IMG = '/assets/images/classroom.jpg';

const StatCard = ({ title, value, icon, gradient, shadowColor, delay = 0 }) => (
  <Card sx={{ overflow: 'visible', position: 'relative', transition: 'all 0.3s ease',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
    '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 32px ${shadowColor}` } }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ pt: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.78rem', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ width: 50, height: 50, borderRadius: 3,
          background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px ${shadowColor}`, color: '#fff' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 4 }} />
    <Grid container spacing={2.5}>
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
  const { user, school } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

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

  const loadData = () => {
    setLoading(true);
    dashboardAPI.get()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <Typography color="error">Failed to load dashboard</Typography>;

  const { stats, recent_leads, recent_payments } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const schoolLogo = school?.branding?.logo_url;

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 50%, ${theme.palette.primary.light} 100%)`,
        borderRadius: { xs: 3, md: 4 }, p: { xs: 2.5, sm: 3, md: 4 }, mb: { xs: 2, md: 3 },
        position: 'relative', overflow: 'hidden',
        animation: 'fadeIn 0.6s ease',
        '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: { xs: 120, md: 200 },
          height: { xs: 120, md: 200 }, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ position: 'absolute', bottom: -50, right: 100, width: { xs: 90, md: 150 },
          height: { xs: 90, md: 150 }, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', top: 20, left: -30, width: 80, height: 80,
          borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
        {/* Classroom image on right side (desktop only) */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', right: 16, top: '50%',
          transform: 'translateY(-50%)', width: 160, height: 100, borderRadius: 3, overflow: 'hidden',
          opacity: 0.25, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <img src={CLASSROOM_IMG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, borderRadius: 3,
              overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.95)', p: 0.5, flexShrink: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <img src={schoolLogo || LOGO_CRM} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 0.3, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                {greeting}, {user?.first_name || 'User'}!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.8rem', md: '0.88rem' } }}>
                {school?.name ? `Here's what's happening at ${school.name} today` : "Here's what's happening today"}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={stats.total_students} icon={<People />} gradient={GRADIENTS.primary} shadowColor={alpha(PRIMARY, 0.25)} delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Staff" value={stats.total_staff} icon={<School />} gradient={GRADIENTS.secondary} shadowColor={alpha(SECONDARY, 0.25)} delay={80} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Fee Collected" value={`\u20B9${stats.monthly_fee_collection?.toLocaleString() || 0}`} icon={<AttachMoney />} gradient={GRADIENTS.success} shadowColor={alpha('#10b981', 0.25)} delay={160} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="New Leads" value={stats.new_leads_this_month} icon={<Campaign />} gradient={GRADIENTS.warning} shadowColor={alpha('#f59e0b', 0.25)} delay={240} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Attendance Today" value={`${stats.attendance_today?.percentage || 0}%`} icon={<CalendarMonth />} gradient={GRADIENTS.info} shadowColor={alpha('#3b82f6', 0.25)} delay={320} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Admissions" value={stats.pending_admissions} icon={<PersonAdd />} gradient={GRADIENTS.error} shadowColor={alpha('#ef4444', 0.25)} delay={400} />
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
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
                    secondary={<Typography variant="caption" color="text.secondary">{lead.phone} &bull; {lead.class_interested || 'N/A'}</Typography>}
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
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
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
                      {'\u20B9'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{'\u20B9'}{payment.amount_paid?.toLocaleString()}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{payment.payment_mode} &bull; {payment.payment_date}</Typography>}
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
