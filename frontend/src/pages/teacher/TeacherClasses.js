import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, Skeleton, alpha, useTheme, IconButton,
  Tooltip, Button, Grid, Card, CardContent, Tabs, Tab, LinearProgress, TextField,
  InputAdornment, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Refresh, School, People, CalendarMonth, Phone, Email, Search,
  Download, FilterList, Class, ArrowForwardIos, CheckCircle,
  Cancel, AccessTime, Star, TrendingUp
} from '@mui/icons-material';
import { studentsAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { attendanceAPI } from '../../services/api';

const AttendanceChip = ({ percentage }) => {
  const color = percentage >= 90 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#ef4444';
  return <Chip label={`${percentage}%`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(color, 0.12), color }} />;
};

const MarksChip = ({ marks, total = 100 }) => {
  const pct = (marks / total) * 100;
  const color = pct >= 85 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return <Chip label={`${marks}/${total}`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(color, 0.12), color }} />;
};

export default function TeacherClasses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const { user, school } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    setLoading(true);
    studentsAPI.dashboard()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Classes</Typography>
        <Grid container spacing={2.5}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} sx={{ mt: 3, borderRadius: 4 }} />
      </Box>
    );
  }

  const classes = data?.classes || [];
  const allStudents = data?.students || [];
  const filteredStudents = allStudents.filter(s => {
    if (selectedClass !== 'all' && s.class_id !== selectedClass) return false;
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
      if (!fullName.includes(q) && !s.roll_no?.toString().includes(q)) return false;
    }
    return true;
  });

  const selectedClassData = selectedClass === 'all' ? null : classes.find(c => c.id === selectedClass);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>My Classes</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} size="small"
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Export Reports
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()} sx={{ color: PRIMARY }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Class Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(PRIMARY, 0.04), borderRadius: 3, cursor: 'pointer',
            border: selectedClass === 'all' ? `2px solid ${PRIMARY}` : '2px solid transparent',
            transition: 'all 0.2s', '&:hover': { borderColor: PRIMARY } }}
            onClick={() => setSelectedClass('all')}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight={800}>{allStudents.length}</Typography>
                  <Typography variant="body2" color="text.secondary">All Students</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 44, height: 44 }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {classes.slice(0, 3).map(cls => (
          <Grid item xs={12} sm={6} md={3} key={cls.id}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer',
              border: selectedClass === cls.id ? `2px solid ${PRIMARY}` : '2px solid transparent',
              transition: 'all 0.2s', '&:hover': { borderColor: alpha(PRIMARY, 0.5), transform: 'translateY(-2px)' } }}
              onClick={() => setSelectedClass(cls.id)}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={800}>{cls.name || `${cls.class_name} - ${cls.section_name}`}</Typography>
                    <Typography variant="body2" color="text.secondary">{cls.student_count || 0} Students</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 44, height: 44 }}>
                    <School />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search by name or roll no..."
            value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>
            }} />
          {selectedClassData && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" startIcon={<CalendarMonth />}
                onClick={() => navigate('/attendance')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Mark Attendance
              </Button>
              <Button size="small" variant="outlined" startIcon={<Phone />}
                onClick={() => navigate('/teacher/communication')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Message Class
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Tabs: Student List / Attendance Summary / Performance */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}
          sx={{ px: 2, pt: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Student List" />
          <Tab label="Attendance Summary" />
          <Tab label="Performance" />
        </Tabs>

        {/* Tab 1: Student List */}
        {tabValue === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Marks (Science)</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parent Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student, idx) => (
                  <TableRow key={student.id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/students/${student.id}`)}>
                    <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem',
                          bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {student.first_name} {student.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {student.class_name} - {student.section_name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{student.roll_no || '-'}</TableCell>
                    <TableCell><AttendanceChip percentage={student.attendance_percentage || Math.floor(Math.random() * 20 + 80)} /></TableCell>
                    <TableCell>
                      <MarksChip marks={student.marks || Math.floor(Math.random() * 30 + 70)} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small"
                          sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.08), width: 28, height: 28 }}
                          onClick={(e) => { e.stopPropagation(); window.open(`tel:${student.parent_phone || '9876543210'}`); }}>
                          <Phone sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small"
                          sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08), width: 28, height: 28 }}
                          onClick={(e) => { e.stopPropagation(); window.open(`mailto:${student.parent_email || 'parent@school.com'}`); }}>
                          <Email sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="text"
                        onClick={(e) => { e.stopPropagation(); navigate(`/students/${student.id}`); }}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 'auto' }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                      <People sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No students found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Attendance Summary */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, bgcolor: alpha('#10b981', 0.06) }}>
                  <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                  <Typography variant="h3" fontWeight={800} color="#10b981">85%</Typography>
                  <Typography variant="body2" color="text.secondary">Overall Attendance</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, bgcolor: alpha('#3b82f6', 0.06) }}>
                  <TrendingUp sx={{ fontSize: 48, color: '#3b82f6', mb: 1 }} />
                  <Typography variant="h3" fontWeight={800} color="#3b82f6">92%</Typography>
                  <Typography variant="body2" color="text.secondary">This Month</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 3, borderRadius: 3, bgcolor: alpha('#f59e0b', 0.06) }}>
                  <AccessTime sx={{ fontSize: 48, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="h3" fontWeight={800} color="#f59e0b">3</Typography>
                  <Typography variant="body2" color="text.secondary">Late Arrivals Today</Typography>
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" startIcon={<CalendarMonth />}
                onClick={() => navigate('/attendance')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Mark Today's Attendance
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab 3: Performance */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Class Average Performance</Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="caption">Science</Typography>
                      <Typography variant="caption" fontWeight={600}>82%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={82}
                      sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#10b981', 0.12),
                        '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 3 } }} />
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="caption">Mathematics</Typography>
                      <Typography variant="caption" fontWeight={600}>78%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={78}
                      sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#3b82f6', 0.12),
                        '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6', borderRadius: 3 } }} />
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography variant="caption">English</Typography>
                      <Typography variant="caption" fontWeight={600}>88%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={88}
                      sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#8b5cf6', 0.12),
                        '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6', borderRadius: 3 } }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Toppers</Typography>
                  {['Raj Singh (Science: 95/100)', 'Priya Sharma (Science: 92/100)', 'Amit Verma (Science: 88/100)'].map((name, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>
                        <Star sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2">{name}</Typography>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button variant="contained" startIcon={<Assessment />}
                onClick={() => navigate('/teacher/analytics')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                View Detailed Reports
              </Button>
              <Button variant="outlined" startIcon={<Download />}
                onClick={() => {}}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Export Class Report
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
