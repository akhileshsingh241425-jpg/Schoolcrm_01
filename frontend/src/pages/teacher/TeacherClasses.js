import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, Skeleton, alpha, useTheme, IconButton,
  Tooltip, Button, Grid, Card, CardContent, Tabs, Tab, LinearProgress, TextField,
  InputAdornment, ToggleButton, ToggleButtonGroup, Alert
} from '@mui/material';
import {
  Refresh, School, People, CalendarMonth, Phone, Email, Search,
  Download, CheckCircle, Cancel, AccessTime, Save, Assessment
} from '@mui/icons-material';
import { dashboardAPI, attendanceAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const AttendanceChip = ({ percentage }) => {
  const color = percentage >= 90 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#ef4444';
  return <Chip label={`${percentage}%`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(color, 0.12), color }} />;
};

export default function TeacherClasses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  // Attendance state
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [attSaving, setAttSaving] = useState(false);
  const [attMarked, setAttMarked] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadData = () => {
    setLoading(true);
    dashboardAPI.getTeacher()
      .then(res => setData(res.data?.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Classes</Typography>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  const classes = data?.my_classes || [];
  const allStudents = data?.class_students || [];

  const filteredStudents = allStudents.filter(s => {
    if (selectedClass !== 'all' && s.section_id !== selectedClass) return false;
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      if (!fullName.includes(q) && !s.roll_no?.toString().includes(q)) return false;
    }
    return true;
  });

  // Attendance helpers
  const initAttendance = () => {
    const att = {};
    filteredStudents.forEach(s => { att[s.id] = 'present'; });
    setAttendance(att);
    setAttMarked(false);
  };

  const markAll = (status) => {
    const att = {};
    filteredStudents.forEach(s => { att[s.id] = status; });
    setAttendance(att);
  };

  const saveAttendance = async () => {
    if (filteredStudents.length === 0) return;
    const cls = classes.find(c => c.section_id === selectedClass);
    if (!cls && selectedClass !== 'all') { toast.error('Select a specific class'); return; }
    setAttSaving(true);
    try {
      const entries = filteredStudents.map(s => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
      }));
      await attendanceAPI.markStudent({
        class_id: cls?.class_id || filteredStudents[0]?.class_id,
        section_id: selectedClass !== 'all' ? selectedClass : filteredStudents[0]?.section_id,
        date: attDate,
        entries,
      });
      toast.success('Attendance saved!');
      setAttMarked(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setAttSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;
  const lateCount = Object.values(attendance).filter(v => v === 'late').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>My Classes</Typography>
        <Tooltip title="Refresh"><IconButton onClick={loadData}><Refresh /></IconButton></Tooltip>
      </Box>

      {/* Class Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(PRIMARY, 0.04), borderRadius: 3, cursor: 'pointer',
            border: selectedClass === 'all' ? `2px solid ${PRIMARY}` : '2px solid transparent' }}
            onClick={() => { setSelectedClass('all'); setTabValue(0); }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight={800}>{allStudents.length}</Typography>
                  <Typography variant="body2" color="text.secondary">All Students</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 44, height: 44 }}><People /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {classes.map(cls => (
          <Grid item xs={12} sm={6} md={3} key={cls.section_id}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer',
              border: selectedClass === cls.section_id ? `2px solid ${PRIMARY}` : '2px solid transparent',
              '&:hover': { borderColor: alpha(PRIMARY, 0.5) } }}
              onClick={() => { setSelectedClass(cls.section_id); initAttendance(); }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight={800}>{cls.class_name} - {cls.section_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{cls.student_count} students • {cls.role}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 44, height: 44 }}><School /></Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search + Tabs */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); if (v === 1) initAttendance(); }}
          sx={{ px: 2, pt: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Student List" />
          <Tab label="Mark Attendance" />
        </Tabs>

        {/* Tab 0: Student List */}
        {tabValue === 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Roll</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Last Marks</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((s, idx) => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
                    <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{s.first_name} {s.last_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.roll_no || '-'}</TableCell>
                    <TableCell><Chip label={`${s.class_name}-${s.section_name}`} size="small" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell><AttendanceChip percentage={s.attendance_percentage || 0} /></TableCell>
                    <TableCell>
                      {s.marks ? (
                        <Chip label={`${s.marks}/100`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600,
                          bgcolor: alpha(s.marks >= 75 ? '#10b981' : s.marks >= 50 ? '#f59e0b' : '#ef4444', 0.12),
                          color: s.marks >= 75 ? '#10b981' : s.marks >= 50 ? '#f59e0b' : '#ef4444' }} />
                      ) : <Typography variant="caption" color="text.secondary">N/A</Typography>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {s.parent_phone && (
                          <IconButton size="small" onClick={e => { e.stopPropagation(); window.open(`tel:${s.parent_phone}`); }}
                            sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.08), width: 26, height: 26 }}>
                            <Phone sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                        {s.parent_email && (
                          <IconButton size="small" onClick={e => { e.stopPropagation(); window.open(`mailto:${s.parent_email}`); }}
                            sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08), width: 26, height: 26 }}>
                            <Email sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No students found</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 1: Mark Attendance */}
        {tabValue === 1 && (
          <Box>
            {/* Controls */}
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
              <TextField size="small" type="date" label="Date" InputLabelProps={{ shrink: true }}
                value={attDate} onChange={e => setAttDate(e.target.value)} sx={{ width: 160 }} />
              <Button size="small" variant="outlined" color="success" onClick={() => markAll('present')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>All Present</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => markAll('absent')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>All Absent</Button>
              <Box sx={{ flex: 1 }} />
              <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label={`P: ${presentCount}`} color="success" size="small" />
              <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label={`A: ${absentCount}`} color="error" size="small" />
              <Chip icon={<AccessTime sx={{ fontSize: 14 }} />} label={`L: ${lateCount}`} color="warning" size="small" />
              <Button variant="contained" color="success" startIcon={<Save />} onClick={saveAttendance}
                disabled={attSaving || filteredStudents.length === 0}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                {attSaving ? 'Saving...' : 'Save'}
              </Button>
            </Box>

            {attMarked && (
              <Alert severity="success" sx={{ mx: 2, mt: 1, borderRadius: 2 }}>Attendance saved successfully!</Alert>
            )}

            {selectedClass === 'all' && classes.length > 1 && (
              <Alert severity="warning" sx={{ mx: 2, mt: 1, borderRadius: 2 }}>
                Select a specific class above to mark attendance.
              </Alert>
            )}

            <TableContainer sx={{ maxHeight: 450 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roll</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((s, idx) => {
                    const status = attendance[s.id] || 'present';
                    return (
                      <TableRow key={s.id} hover sx={{
                        bgcolor: status === 'absent' ? alpha('#ef4444', 0.04) : status === 'late' ? alpha('#f59e0b', 0.04) : 'transparent'
                      }}>
                        <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                              {s.first_name?.[0]}{s.last_name?.[0]}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>{s.first_name} {s.last_name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{s.roll_no || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <ToggleButtonGroup value={status} exclusive size="small"
                            onChange={(_, val) => { if (val) setAttendance({ ...attendance, [s.id]: val }); }}>
                            <ToggleButton value="present" sx={{ px: 1.5, py: 0.3, fontSize: '0.7rem', fontWeight: 600,
                              '&.Mui-selected': { bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' } } }}>P</ToggleButton>
                            <ToggleButton value="absent" sx={{ px: 1.5, py: 0.3, fontSize: '0.7rem', fontWeight: 600,
                              '&.Mui-selected': { bgcolor: '#ef4444', color: '#fff', '&:hover': { bgcolor: '#dc2626' } } }}>A</ToggleButton>
                            <ToggleButton value="late" sx={{ px: 1.5, py: 0.3, fontSize: '0.7rem', fontWeight: 600,
                              '&.Mui-selected': { bgcolor: '#f59e0b', color: '#fff', '&:hover': { bgcolor: '#d97706' } } }}>L</ToggleButton>
                          </ToggleButtonGroup>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
