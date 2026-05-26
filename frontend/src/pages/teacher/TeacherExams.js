import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, Skeleton, alpha, useTheme, IconButton,
  Tooltip, Button, Grid, Card, CardContent, Tabs, Tab, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel, LinearProgress
} from '@mui/material';
import {
  Refresh, Event, Schedule, School, People, Book, Search, Download,
  Assessment, Star, TrendingUp, CheckCircle, Assignment, Grade
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';

export default function TeacherExams() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    setLoading(true);
    academicsAPI.getExamDashboard()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Exams & Marks</Typography>
        <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 4 }} />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  const upcomingExams = data?.upcoming_exams || [];
  const markedExams = data?.marked_exams || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>Exams & Marks</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Assessment />} size="small"
            onClick={() => navigate('/teacher/analytics')}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Performance Analytics
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()} sx={{ color: PRIMARY }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Upcoming Exams</Typography>
                  <Typography variant="h4" fontWeight={800}>{upcomingExams.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}><Event /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Marks Entered</Typography>
                  <Typography variant="h4" fontWeight={800}>{markedExams.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}><CheckCircle /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Pending Entry</Typography>
                  <Typography variant="h4" fontWeight={800}>{Math.max(0, upcomingExams.length - markedExams.length)}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}><Assignment /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Class Avg</Typography>
                  <Typography variant="h4" fontWeight={800}>82%</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' }}><Star /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Content */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}
          sx={{ px: 2, pt: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Exam Schedule" />
          <Tab label="Enter Marks" />
          <Tab label="View Results" />
        </Tabs>

        {/* Tab 1: Exam Schedule */}
        {tabValue === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Exam Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingExams.map((exam, idx) => (
                  <TableRow key={exam.id || idx} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{exam.exam_name || 'Mid Term Exam'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={exam.subject_name || 'Science'} size="small"
                        sx={{ bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY, fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{exam.class_name || '10-A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{exam.exam_date || '2026-06-15'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{exam.start_time || '09:00'} - {exam.end_time || '11:00'}</TableCell>
                    <TableCell>
                      <Chip label={exam.status || 'Scheduled'} size="small"
                        color={exam.status === 'Completed' ? 'success' : exam.status === 'Ongoing' ? 'warning' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
                {upcomingExams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                      <Event sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No exams scheduled</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Enter Marks */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Quick Marks Entry</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Select Exam</InputLabel>
                      <Select label="Select Exam">
                        <MenuItem value="1">Mid Term - Science</MenuItem>
                        <MenuItem value="2">Mid Term - Math</MenuItem>
                        <MenuItem value="3">Final - Science</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Select Class</InputLabel>
                      <Select label="Select Class">
                        <MenuItem value="1">Class 10-A</MenuItem>
                        <MenuItem value="2">Class 10-B</MenuItem>
                        <MenuItem value="3">Class 9-A</MenuItem>
                      </Select>
                    </FormControl>
                    <Button variant="contained" startIcon={<Grade />}
                      onClick={() => navigate('/academics')}
                      sx={{ borderRadius: 2, textTransform: 'none' }}>
                      Go to Marks Entry
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Select exam and class above to enter marks for all students at once.
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                  <Typography variant="h5" fontWeight={800} color="#10b981">{markedExams.length}/{upcomingExams.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Marks Entered</Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate"
                      value={upcomingExams.length > 0 ? (markedExams.length / upcomingExams.length) * 100 : 0}
                      sx={{ height: 8, borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          borderRadius: 4
                        } }} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 3: View Results */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Button fullWidth variant="outlined" startIcon={<School />}
                  onClick={() => navigate('/teacher/classes')}
                  sx={{ p: 3, borderRadius: 3, textTransform: 'none', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>Class Results</Typography>
                  <Typography variant="body2" color="text.secondary">View results by class and section</Typography>
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button fullWidth variant="outlined" startIcon={<People />}
                  onClick={() => navigate('/teacher/classes')}
                  sx={{ p: 3, borderRadius: 3, textTransform: 'none', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700}>Student Results</Typography>
                  <Typography variant="body2" color="text.secondary">View individual student report cards</Typography>
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
