import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, IconButton,
  alpha, useTheme, LinearProgress, Alert, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Save, Refresh, CheckCircle, Cancel, AccessTime, CalendarMonth } from '@mui/icons-material';
import { attendanceAPI, dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherAttendancePage() {
  const [myClasses, setMyClasses] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attLoading, setAttLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    dashboardAPI.getTeacher()
      .then(res => {
        const d = res.data?.data || {};
        setMyClasses(d.my_classes || []);
        setMySubjects(d.my_subjects || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadAttendance = async () => {
    if (!selectedSection) { toast.error('Select a class'); return; }
    setAttLoading(true);
    try {
      const res = await attendanceAPI.getStudent({
        section_id: selectedSection,
        date: selectedDate,
      });
      const data = res.data?.data;
      const studentList = Array.isArray(data) ? data : data?.students || data?.items || [];
      
      if (studentList.length > 0 && studentList[0].status) {
        // Already marked
        setAlreadyMarked(true);
        const att = {};
        studentList.forEach(s => { att[s.student_id || s.id] = s.status; });
        setAttendance(att);
        setStudents(studentList);
      } else {
        setAlreadyMarked(false);
        setStudents(studentList);
        const att = {};
        studentList.forEach(s => { att[s.student_id || s.id] = 'present'; });
        setAttendance(att);
      }
    } catch {
      // No attendance yet, load student list
      setAlreadyMarked(false);
      try {
        const cls = myClasses.find(c => c.section_id === parseInt(selectedSection));
        if (cls) {
          const res = await attendanceAPI.getStudent({ section_id: selectedSection, date: selectedDate });
          const data = res.data?.data;
          setStudents(Array.isArray(data) ? data : []);
        }
      } catch { setStudents([]); }
    } finally {
      setAttLoading(false);
    }
  };

  const handleSave = async () => {
    if (students.length === 0) return;
    setSaving(true);
    try {
      const cls = myClasses.find(c => c.section_id === parseInt(selectedSection));
      const entries = students.map(s => ({
        student_id: s.student_id || s.id,
        status: attendance[s.student_id || s.id] || 'present',
      }));
      await attendanceAPI.markStudent({
        class_id: cls?.class_id,
        section_id: parseInt(selectedSection),
        date: selectedDate,
        entries,
      });
      toast.success('Attendance saved!');
      setAlreadyMarked(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    const att = {};
    students.forEach(s => { att[s.student_id || s.id] = status; });
    setAttendance(att);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;
  const lateCount = Object.values(attendance).filter(v => v === 'late').length;

  // Derive sections from both my_classes and my_subjects
  const allSections = [...new Map([
    ...myClasses.map(c => [c.section_id, { id: c.section_id, label: `${c.class_name} - ${c.section_name}`, class_id: c.class_id }]),
    ...mySubjects.filter(s => s.section_id).map(s => [s.section_id, { id: s.section_id, label: `${s.class_name} - ${s.section_name}`, class_id: s.class_id }]),
  ]).values()];

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Mark Attendance</Typography>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Class - Section" value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}>
              {allSections.map(s => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" type="date" label="Date" InputLabelProps={{ shrink: true }}
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <Button fullWidth variant="contained" onClick={loadAttendance} disabled={attLoading}
              startIcon={<CalendarMonth />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              {attLoading ? 'Loading...' : 'Load'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={2.5}>
            <Button fullWidth variant="contained" color="success" startIcon={<Save />}
              onClick={handleSave} disabled={saving || students.length === 0}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions + Stats */}
      {students.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" color="success" onClick={() => markAll('present')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>All Present</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => markAll('absent')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>All Absent</Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label={`Present: ${presentCount}`} color="success" size="small" />
              <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label={`Absent: ${absentCount}`} color="error" size="small" />
              <Chip icon={<AccessTime sx={{ fontSize: 14 }} />} label={`Late: ${lateCount}`} color="warning" size="small" />
              <Chip label={`Total: ${students.length}`} size="small" />
            </Box>
          </Box>
          {alreadyMarked && (
            <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
              Attendance already marked for this date. You can update it.
            </Alert>
          )}
        </Paper>
      )}

      {/* Student List */}
      {students.length > 0 ? (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, idx) => {
                  const sid = s.student_id || s.id;
                  const status = attendance[sid] || 'present';
                  return (
                    <TableRow key={sid} hover sx={{
                      bgcolor: status === 'absent' ? alpha('#ef4444', 0.04) : status === 'late' ? alpha('#f59e0b', 0.04) : 'transparent'
                    }}>
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                            {(s.first_name || s.student_name || '?')[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.student_name || `Student #${sid}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{s.roll_no || '-'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <ToggleButtonGroup
                          value={status}
                          exclusive
                          onChange={(_, val) => { if (val) setAttendance({ ...attendance, [sid]: val }); }}
                          size="small"
                        >
                          <ToggleButton value="present" sx={{
                            px: 1.5, py: 0.3, fontSize: '0.7rem', fontWeight: 600,
                            '&.Mui-selected': { bgcolor: '#10b981', color: '#fff', '&:hover': { bgcolor: '#059669' } }
                          }}>P</ToggleButton>
                          <ToggleButton value="absent" sx={{
                            px: 1.5, py: 0.3, fontSize: '0.7rem', fontWeight: 600,
                            '&.Mui-selected': { bgcolor: '#ef4444', color: '#fff', '&:hover': { bgcolor: '#dc2626' } }
                          }}>A</ToggleButton>
                          <ToggleButton value="late" sx={{
                            px: 1.5, py: 0.3, fontSize: '0.7rem', fontWeight: 600,
                            '&.Mui-selected': { bgcolor: '#f59e0b', color: '#fff', '&:hover': { bgcolor: '#d97706' } }
                          }}>L</ToggleButton>
                        </ToggleButtonGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : !attLoading && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Select a class and date, then click "Load" to mark attendance.
        </Alert>
      )}
    </Box>
  );
}
