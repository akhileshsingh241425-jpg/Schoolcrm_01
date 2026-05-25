import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Paper, List, ListItem, ListItemText,
  Chip, Avatar, ListItemAvatar, Skeleton, alpha, useTheme, IconButton, Tooltip,
  Button, Divider, LinearProgress
} from '@mui/material';
import {
  School, People, CalendarMonth, Book, Class, Schedule,
  TrendingUp, ArrowForwardIos, Refresh, AccessTime, Event,
  CheckCircle, HourglassEmpty
} from '@mui/icons-material';
import { dashboardAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    <Box sx={{ mt: 3 }}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} /></Box>
  </Box>
);

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, school } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

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
    dashboardAPI.getTeacher()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <Typography color="error">Failed to load dashboard</Typography>;

  const { teacher, my_classes, my_subjects, today_timetable, today_attendance, upcoming_exams } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayName = DAY_NAMES[new Date().getDay()];
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, borderRadius: 3,
              overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.95)', p: 0.5, flexShrink: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <img src={schoolLogo || '/assets/images/logo-crm.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 0.3, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                {greeting}, {teacher?.first_name || 'Teacher'}!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.8rem', md: '0.88rem' } }}>
                {teacher?.designation ? `${teacher.designation} • ` : ''}{school?.name || ''}
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
          <StatCard title="My Classes" value={my_classes?.length || 0} icon={<Class />} gradient={GRADIENTS.primary} shadowColor={alpha(PRIMARY, 0.25)} delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="My Subjects" value={my_subjects?.length || 0} icon={<Book />} gradient={GRADIENTS.secondary} shadowColor={alpha(SECONDARY, 0.25)} delay={80} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={today_attendance?.student_count || 0} icon={<People />} gradient={GRADIENTS.info} shadowColor={alpha('#3b82f6', 0.25)} delay={160} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Attendance Today" value={`${today_attendance?.percentage || 0}%`} icon={<CalendarMonth />} gradient={GRADIENTS.success} shadowColor={alpha('#10b981', 0.25)} delay={240} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3, mb: 3 }}>
        <Button variant="contained" startIcon={<CalendarMonth />}
          onClick={() => navigate('/attendance')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Mark Attendance
        </Button>
        <Button variant="outlined" startIcon={<Schedule />}
          onClick={() => navigate('/teacher/timetable')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          My Timetable
        </Button>
        <Button variant="outlined" startIcon={<Book />}
          onClick={() => navigate('/academics')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Marks Entry
        </Button>
        <Button variant="outlined" startIcon={<Event />}
          onClick={() => navigate('/academics')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Exams & Homework
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {/* Today's Timetable */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Today's Schedule</Typography>
              </Box>
              <Chip label={todayName} size="small" color="primary" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {today_timetable?.filter(t => !t.is_break)?.map((slot, idx) => (
                <ListItem key={slot.id} divider={idx < today_timetable.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 38, height: 38, fontSize: '0.75rem', fontWeight: 700 }}>
                      #{slot.period_number || idx + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{slot.subject_name}</Typography>
                        <Chip label={`${slot.class_name}${slot.section_name ? ' - ' + slot.section_name : ''}`} size="small"
                          sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(PRIMARY, 0.08), color: 'text.secondary' }} />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <AccessTime sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {slot.start_time} - {slot.end_time}
                        </Typography>
                        {slot.room_no && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • Room: {slot.room_no}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {(!today_timetable || today_timetable.filter(t => !t.is_break).length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarMonth sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No classes scheduled for today</Typography>
                    <Typography variant="caption" color="text.disabled">Enjoy your day off!</Typography>
                  </Box>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Exams */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Event sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Upcoming Exams</Typography>
              </Box>
              <Chip label={`Next 7 days`} size="small" color="warning" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {upcoming_exams?.map((exam, idx) => (
                <ListItem key={exam.id} divider={idx < upcoming_exams.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: 38, height: 38, fontSize: '0.75rem', fontWeight: 700 }}>
                      <Event sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {exam.exam_name} - {exam.subject_name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Typography variant="caption" color="text.secondary">
                          {exam.exam_date} • {exam.start_time} - {exam.end_time}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {exam.class_name}{exam.section_name ? ' - ' + exam.section_name : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {(!upcoming_exams || upcoming_exams.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 36, color: 'success.light', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No exams scheduled this week</Typography>
                  </Box>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* My Subjects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Book sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>My Subjects</Typography>
              </Box>
              <Chip label={my_subjects?.length || 0} size="small" color="secondary" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {my_subjects?.map((subj, idx) => (
                <ListItem key={subj.id} divider={idx < my_subjects.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(SECONDARY, 0.1), color: SECONDARY, width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}>
                      {subj.subject_name?.[0] || 'S'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{subj.subject_name}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {subj.class_name}{subj.section_name ? ' - ' + subj.section_name : ''}
                        {subj.periods_per_week ? ` • ${subj.periods_per_week} periods/week` : ''}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {(!my_subjects || my_subjects.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No subjects assigned yet</Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* My Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Class sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>My Classes</Typography>
              </Box>
              <Chip label={my_classes?.length || 0} size="small" color="info" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {my_classes?.map((cls, idx) => (
                <ListItem key={cls.section_id} divider={idx < my_classes.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}>
                      <School sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{cls.class_name} - {cls.section_name}</Typography>
                        <Chip label={cls.role} size="small"
                          sx={{ height: 20, fontSize: '0.65rem',
                            bgcolor: cls.role === 'Class Teacher' ? alpha('#10b981', 0.1) : alpha('#3b82f6', 0.1),
                            color: cls.role === 'Class Teacher' ? '#10b981' : '#3b82f6' }} />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {cls.student_count} students
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {(!my_classes || my_classes.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No class assigned</Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
