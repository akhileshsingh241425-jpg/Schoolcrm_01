import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, alpha, useTheme, IconButton,
  Tooltip, Button, Grid, Card, CardContent, TextField, MenuItem,
  LinearProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel, InputAdornment, Divider, Stack, Tabs, Tab
} from '@mui/material';
import {
  Refresh, Save, Close, Search, Grade, CheckCircle, Cancel,
  Person, School, CalendarMonth, Assessment, Download, Print,
  Visibility, TrendingUp
} from '@mui/icons-material';
import { academicsAPI, dashboardAPI, studentsAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Grade calculation
const calcGrade = (pct) => {
  if (pct >= 91) return { grade: 'A+', color: '#10b981' };
  if (pct >= 81) return { grade: 'A', color: '#10b981' };
  if (pct >= 71) return { grade: 'B+', color: '#3b82f6' };
  if (pct >= 61) return { grade: 'B', color: '#3b82f6' };
  if (pct >= 51) return { grade: 'C+', color: '#f59e0b' };
  if (pct >= 41) return { grade: 'C', color: '#f59e0b' };
  if (pct >= 33) return { grade: 'D', color: '#ef4444' };
  return { grade: 'F', color: '#ef4444' };
};

export default function TeacherExams() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  // Filter state
  const [mySubjects, setMySubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Marks state
  const [schedule, setSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: { marks_obtained, is_absent, remarks } }
  const [marksLoading, setMarksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Student detail dialog
  const [detailStudent, setDetailStudent] = useState(null);

  // Tab
  const [tab, setTab] = useState(0);

  // Derived filter options — merge from my_subjects AND my_classes
  const [myClasses, setMyClasses] = useState([]);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getTeacher().catch(() => ({ data: { data: {} } })),
      academicsAPI.listExams({}).catch(() => ({ data: { data: { items: [] } } })),
    ]).then(([dashRes, examsRes]) => {
      const dash = dashRes.data?.data || {};
      setMySubjects(dash.my_subjects || []);
      setMyClasses(dash.my_classes || []);
      const ed = examsRes.data?.data;
      setExams(Array.isArray(ed) ? ed : ed?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const uniqueClasses = useMemo(() => {
    const map = new Map();
    mySubjects.forEach(s => map.set(s.class_id, { id: s.class_id, name: s.class_name }));
    myClasses.forEach(c => map.set(c.class_id, { id: c.class_id, name: c.class_name }));
    return [...map.values()];
  }, [mySubjects, myClasses]);

  const uniqueSections = useMemo(() => {
    const map = new Map();
    mySubjects.filter(s => s.class_id === parseInt(selectedClass)).forEach(s => {
      if (s.section_id) map.set(s.section_id, { id: s.section_id, name: s.section_name });
    });
    myClasses.filter(c => c.class_id === parseInt(selectedClass)).forEach(c => {
      if (c.section_id) map.set(c.section_id, { id: c.section_id, name: c.section_name });
    });
    return [...map.values()];
  }, [mySubjects, myClasses, selectedClass]);

  const uniqueSubjects = useMemo(() =>
    [...new Map(mySubjects.filter(s => !selectedClass || s.class_id === parseInt(selectedClass)).map(s => [s.subject_id, { id: s.subject_id, name: s.subject_name }])).values()],
    [mySubjects, selectedClass]
  );

  // Load marks sheet
  const loadMarks = async () => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
      toast.error('Select Exam, Class and Subject');
      return;
    }
    setMarksLoading(true);
    try {
      // Find matching schedule
      const schedRes = await academicsAPI.listSchedules(selectedExam);
      const allScheds = schedRes.data?.data || [];
      const matched = allScheds.find(s =>
        s.class_id === parseInt(selectedClass) &&
        s.subject_id === parseInt(selectedSubject) &&
        (!selectedSection || s.section_id === parseInt(selectedSection) || !s.section_id)
      );

      if (!matched) {
        toast.error('No exam schedule found for this combination. Ask admin to create one.');
        setMarksLoading(false);
        return;
      }

      setSchedule(matched);

      // Load marks sheet
      const res = await academicsAPI.getMarksSheet({ exam_schedule_id: matched.id });
      const data = res.data?.data;
      const studentList = data?.marks || data?.students || [];
      setStudents(studentList);

      // Pre-fill existing marks
      const existing = {};
      studentList.forEach(s => {
        const subMarks = (s.subjects || []).find(sub => sub.schedule_id === matched.id);
        existing[s.student_id] = {
          marks_obtained: subMarks?.marks_obtained ?? '',
          is_absent: subMarks?.is_absent || false,
          remarks: subMarks?.remarks || '',
        };
      });
      setMarks(existing);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load');
    } finally {
      setMarksLoading(false);
    }
  };

  // Save marks
  const saveMarks = async (status = 'draft') => {
    if (!schedule) return;
    setSaving(true);
    try {
      const entries = students.map(s => {
        const m = marks[s.student_id] || {};
        return {
          student_id: s.student_id,
          marks_obtained: m.is_absent ? null : (m.marks_obtained !== '' ? parseFloat(m.marks_obtained) : null),
          is_absent: m.is_absent || false,
          remarks: m.remarks || '',
        };
      }).filter(e => e.marks_obtained !== null || e.is_absent);

      if (entries.length === 0) {
        toast.error('No marks to save');
        setSaving(false);
        return;
      }

      await academicsAPI.bulkMarksEntry({
        exam_schedule_id: schedule.id,
        entries,
      });
      toast.success(`${entries.length} marks saved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Mark all present/absent
  const markAllAbsent = (absent) => {
    const updated = { ...marks };
    students.forEach(s => {
      updated[s.student_id] = { ...updated[s.student_id], is_absent: absent };
    });
    setMarks(updated);
  };

  // Filtered students
  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.student_name || '').toLowerCase().includes(q) ||
      (s.admission_no || '').toLowerCase().includes(q) ||
      (s.roll_no || '').toString().includes(q);
  });

  // Stats
  const filledCount = Object.values(marks).filter(m => m.marks_obtained !== '' || m.is_absent).length;
  const absentCount = Object.values(marks).filter(m => m.is_absent).length;
  const maxMarks = schedule?.max_marks || 100;

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Exams & Marks Entry</Typography>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary' }}>
          SELECT EXAM DETAILS
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.4}>
            <TextField fullWidth select size="small" label="Exam" value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}>
              {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth select size="small" label="Class" value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); setSelectedSubject(''); }}>
              {uniqueClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth select size="small" label="Section" value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {uniqueSections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField fullWidth select size="small" label="Subject" value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}>
              {uniqueSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={1.8}>
            <Button fullWidth variant="contained" onClick={loadMarks} disabled={marksLoading}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40 }}>
              {marksLoading ? 'Loading...' : 'Load Students'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={1.8}>
            <Button fullWidth variant="contained" color="success" startIcon={<Save />}
              onClick={() => saveMarks('submitted')} disabled={saving || !schedule}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, height: 40 }}>
              {saving ? 'Saving...' : 'Save Marks'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Marks Entry Area */}
      {schedule && students.length > 0 && (
        <>
          {/* Info Bar */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Chip label={`Max: ${maxMarks}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`Pass: ${schedule.passing_marks || 33}`} color="warning" size="small" sx={{ fontWeight: 700 }} />
                <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label={`Filled: ${filledCount}/${students.length}`} color="success" size="small" />
                <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label={`Absent: ${absentCount}`} color="error" size="small" />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField size="small" placeholder="Search student..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  sx={{ width: 200 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
              </Box>
            </Box>
          </Paper>

          {/* Marks Table */}
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 50, bgcolor: alpha(PRIMARY, 0.05) }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180, bgcolor: alpha(PRIMARY, 0.05) }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 80, bgcolor: alpha(PRIMARY, 0.05) }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120, textAlign: 'center', bgcolor: alpha(PRIMARY, 0.05) }}>
                      Marks (/{maxMarks})
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 60, textAlign: 'center', bgcolor: alpha(PRIMARY, 0.05) }}>%</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 60, textAlign: 'center', bgcolor: alpha(PRIMARY, 0.05) }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 70, textAlign: 'center', bgcolor: alpha(PRIMARY, 0.05) }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 60, textAlign: 'center', bgcolor: alpha(PRIMARY, 0.05) }}>Absent</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 140, bgcolor: alpha(PRIMARY, 0.05) }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 50, bgcolor: alpha(PRIMARY, 0.05) }}>View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((s, idx) => {
                    const m = marks[s.student_id] || { marks_obtained: '', is_absent: false, remarks: '' };
                    const obtained = m.is_absent ? 0 : (parseFloat(m.marks_obtained) || 0);
                    const pct = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;
                    const { grade, color } = m.marks_obtained !== '' && !m.is_absent ? calcGrade(pct) : { grade: '-', color: '#94a3b8' };
                    const pass = !m.is_absent && obtained >= (schedule.passing_marks || 33);

                    return (
                      <TableRow key={s.student_id} hover sx={{
                        bgcolor: m.is_absent ? alpha('#ef4444', 0.04) : undefined,
                        opacity: m.is_absent ? 0.7 : 1,
                      }}>
                        <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                              {(s.student_name || '?')[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600} noWrap>{s.student_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{s.admission_no}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{s.roll_no || '-'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <TextField size="small" type="number"
                            disabled={m.is_absent}
                            sx={{ width: 80, '& input': { textAlign: 'center', py: 0.5, fontWeight: 700 } }}
                            inputProps={{ min: 0, max: maxMarks }}
                            value={m.marks_obtained}
                            onChange={e => setMarks({
                              ...marks,
                              [s.student_id]: { ...m, marks_obtained: e.target.value }
                            })}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 700, color }}>
                          {m.marks_obtained !== '' && !m.is_absent ? `${pct}%` : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {m.marks_obtained !== '' || m.is_absent ? (
                            <Chip label={m.is_absent ? 'AB' : grade} size="small"
                              sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha(color, 0.12), color, minWidth: 35 }} />
                          ) : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {m.marks_obtained !== '' || m.is_absent ? (
                            <Chip label={m.is_absent ? 'Fail' : pass ? 'Pass' : 'Fail'} size="small"
                              color={m.is_absent ? 'error' : pass ? 'success' : 'error'}
                              sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
                          ) : '-'}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Checkbox size="small" checked={m.is_absent}
                            onChange={e => setMarks({
                              ...marks,
                              [s.student_id]: { ...m, is_absent: e.target.checked, marks_obtained: e.target.checked ? '' : m.marks_obtained }
                            })}
                            sx={{ p: 0 }} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" placeholder="..."
                            sx={{ width: 120, '& input': { py: 0.3, fontSize: '0.75rem' } }}
                            value={m.remarks}
                            onChange={e => setMarks({
                              ...marks,
                              [s.student_id]: { ...m, remarks: e.target.value }
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setDetailStudent(s)}
                            sx={{ color: PRIMARY }}>
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {schedule && students.length === 0 && !marksLoading && (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          No students found for this class/section. Check if students are assigned to this class.
        </Alert>
      )}

      {!schedule && !marksLoading && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Assessment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Select Exam Details Above</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose exam, class, section and subject to load the marks entry sheet.
          </Typography>
        </Paper>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!detailStudent} onClose={() => setDetailStudent(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Student Details</Typography>
            <IconButton onClick={() => setDetailStudent(null)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailStudent && (
            <Box>
              {/* Profile */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 3, bgcolor: alpha(PRIMARY, 0.04) }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(PRIMARY, 0.15), color: PRIMARY, fontWeight: 700, fontSize: '1.2rem' }}>
                  {(detailStudent.student_name || '?')[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{detailStudent.student_name}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip icon={<Person sx={{ fontSize: 14 }} />} label={`Roll: ${detailStudent.roll_no || '-'}`} size="small" />
                    <Chip icon={<School sx={{ fontSize: 14 }} />} label={`Adm: ${detailStudent.admission_no || '-'}`} size="small" />
                  </Stack>
                </Box>
              </Box>

              {/* Current Marks */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Current Entry</Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                {(() => {
                  const m = marks[detailStudent.student_id] || {};
                  const obtained = m.is_absent ? 0 : (parseFloat(m.marks_obtained) || 0);
                  const pct = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;
                  const { grade, color } = m.marks_obtained !== '' ? calcGrade(pct) : { grade: '-', color: '#94a3b8' };
                  return (
                    <Grid container spacing={2}>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={800} color="primary">{m.is_absent ? 'AB' : (m.marks_obtained || '-')}</Typography>
                        <Typography variant="caption" color="text.secondary">Marks / {maxMarks}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={800} sx={{ color }}>{m.is_absent ? '0' : pct}%</Typography>
                        <Typography variant="caption" color="text.secondary">Percentage</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Chip label={m.is_absent ? 'Absent' : grade} sx={{ fontWeight: 800, fontSize: '1rem', height: 36, bgcolor: alpha(color, 0.12), color }} />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {m.is_absent ? 'Fail' : obtained >= (schedule?.passing_marks || 33) ? 'PASS' : 'FAIL'}
                        </Typography>
                      </Grid>
                    </Grid>
                  );
                })()}
              </Paper>

              {/* All subjects marks if available */}
              {detailStudent.subjects && detailStudent.subjects.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>All Subjects (This Exam)</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Max</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Obtained</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailStudent.subjects.map((sub, i) => {
                          const sp = sub.max_marks > 0 ? Math.round((sub.marks_obtained || 0) / sub.max_marks * 100) : 0;
                          const sg = calcGrade(sp);
                          return (
                            <TableRow key={i}>
                              <TableCell>{sub.subject_name || '-'}</TableCell>
                              <TableCell>{sub.max_marks || '-'}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{sub.marks_obtained ?? '-'}</TableCell>
                              <TableCell><Chip label={sub.marks_obtained != null ? sg.grade : '-'} size="small" sx={{ bgcolor: alpha(sg.color, 0.12), color: sg.color, fontWeight: 700 }} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
