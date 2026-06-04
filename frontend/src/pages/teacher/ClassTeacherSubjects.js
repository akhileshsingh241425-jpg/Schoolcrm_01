import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Chip, Button, Avatar, alpha, useTheme,
  LinearProgress, Alert, Tooltip, IconButton, Stack
} from '@mui/material';
import { Save, Refresh, MenuBook, CheckCircle } from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ClassTeacherSubjects() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(null);        // {class_name, section_name, ...}
  const [subjects, setSubjects] = useState([]);  // available subjects
  const [students, setStudents] = useState([]);  // roster
  // enrollment state: { [studentId]: Set(subjectId) }
  const [enrollment, setEnrollment] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    academicsAPI.getClassTeacherRoster()
      .then(res => {
        const d = res.data?.data || res.data;
        setInfo(d);
        setSubjects(d.subjects || []);
        setStudents(d.students || []);
        const map = {};
        (d.students || []).forEach(s => {
          map[s.student_id] = new Set(s.enrolled_subject_ids || []);
        });
        setEnrollment(map);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load your class roster');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSubject = (studentId, subjectId) => {
    setEnrollment(prev => {
      const next = { ...prev };
      const set = new Set(next[studentId] || []);
      if (set.has(subjectId)) set.delete(subjectId);
      else set.add(subjectId);
      next[studentId] = set;
      return next;
    });
  };

  const saveStudent = async (studentId) => {
    setSavingId(studentId);
    try {
      await academicsAPI.setStudentSubjects({
        student_id: studentId,
        subject_ids: Array.from(enrollment[studentId] || []),
      });
      toast.success('Subjects saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  const saveAll = async () => {
    setSavingId('all');
    try {
      for (const s of students) {
        await academicsAPI.setStudentSubjects({
          student_id: s.student_id,
          subject_ids: Array.from(enrollment[s.student_id] || []),
        });
      }
      toast.success('All students saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save all');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Student Subjects</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Student Subjects</Typography>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Student Subjects</Typography>
          <Typography variant="body2" color="text.secondary">
            {info?.class_name} - {info?.section_name} • Choose which subjects each student studies this academic year
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={load}><Refresh /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Save />} onClick={saveAll}
            disabled={savingId === 'all'}>
            {savingId === 'all' ? 'Saving...' : 'Save All'}
          </Button>
        </Stack>
      </Box>

      <Alert severity="info" icon={<MenuBook />} sx={{ mb: 2, borderRadius: 2 }}>
        Tick the subjects for each student. Which teacher teaches a subject is assigned separately.
      </Alert>

      {students.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No active students in your section.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, minWidth: 60, bgcolor: alpha(PRIMARY, 0.06) }}>Roll</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 200, bgcolor: alpha(PRIMARY, 0.06), position: 'sticky', left: 0, zIndex: 3 }}>Student</TableCell>
                {subjects.map(sub => (
                  <TableCell key={sub.id} align="center" sx={{ fontWeight: 700, bgcolor: alpha(PRIMARY, 0.06), whiteSpace: 'nowrap' }}>
                    {sub.name}
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: alpha(PRIMARY, 0.06) }}>Save</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s, idx) => {
                const set = enrollment[s.student_id] || new Set();
                return (
                  <TableRow key={s.student_id} hover sx={{ '&:nth-of-type(odd)': { bgcolor: alpha('#000', 0.015) } }}>
                    <TableCell sx={{ color: 'text.secondary' }}>{s.roll_no || idx + 1}</TableCell>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                          {s.student_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} noWrap>{s.student_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.admission_no}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    {subjects.map(sub => (
                      <TableCell key={sub.id} align="center" sx={{ p: 0.5 }}>
                        <Checkbox size="small" checked={set.has(sub.id)}
                          onChange={() => toggleSubject(s.student_id, sub.id)} />
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <Tooltip title="Save this student">
                        <span>
                          <IconButton size="small" color="success"
                            onClick={() => saveStudent(s.student_id)}
                            disabled={savingId === s.student_id}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
