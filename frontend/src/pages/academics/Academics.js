import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Snackbar, Alert, TablePagination,
  Card, CardContent, IconButton, Tooltip, LinearProgress, Divider, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails, Badge
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Lock, LockOpen, Assessment, School, EventNote,
  MeetingRoom, ExpandMore, Assignment, Print, CheckCircle, Cancel, BarChart,
  EmojiEvents, Warning, Schedule, Grade as GradeIcon, MenuBook, CalendarMonth,
  CloudUpload, People, LibraryBooks, PersonOutline, SupervisorAccount, SwapHoriz
} from '@mui/icons-material';
import { academicsAPI, studentsAPI, staffAPI } from '../../services/api';
import { SyllabusTab, HomeworkTab, LessonPlansTab, CalendarTab, MaterialsTab } from './CurriculumTabs';

const TABS = ['Dashboard', 'Exams', 'Marks Entry', 'Report Cards', 'Subjects', 'Timetable', 'Grading', 'Halls', 'Class Teachers', 'Syllabus', 'Homework', 'Lesson Plans', 'Calendar', 'Materials', 'Settings'];

export default function Academics() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  // Shared data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [gradingSystems, setGradingSystems] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {});
    academicsAPI.listSubjects().then(r => setSubjects(r.data.data || [])).catch(() => {});
    academicsAPI.listExamTypes().then(r => setExamTypes(r.data.data || [])).catch(() => {});
    academicsAPI.listGradingSystems().then(r => setGradingSystems(r.data.data || [])).catch(() => {});
    studentsAPI.listAcademicYears().then(r => setAcademicYears(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <Box>
      <Typography variant="h5" mb={1} fontWeight="bold">Academics & Curriculum</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((t, i) => <Tab key={i} label={t} />)}
      </Tabs>

      {tab === 0 && <DashboardTab classes={classes} showSnack={showSnack} />}
      {tab === 1 && <ExamsTab classes={classes} subjects={subjects} examTypes={examTypes} gradingSystems={gradingSystems} academicYears={academicYears} showSnack={showSnack} />}
      {tab === 2 && <MarksEntryTab classes={classes} showSnack={showSnack} />}
      {tab === 3 && <ReportCardsTab classes={classes} showSnack={showSnack} />}
      {tab === 4 && <SubjectsTab subjects={subjects} setSubjects={setSubjects} showSnack={showSnack} />}
      {tab === 5 && <TimetableTab classes={classes} subjects={subjects} showSnack={showSnack} />}
      {tab === 6 && <GradingTab gradingSystems={gradingSystems} setGradingSystems={setGradingSystems} showSnack={showSnack} />}
      {tab === 7 && <HallsTab showSnack={showSnack} />}
      {tab === 8 && <ClassTeachersTab classes={classes} showSnack={showSnack} />}
      {tab === 9 && <SyllabusTab classes={classes} subjects={subjects} academicYears={academicYears} showSnack={showSnack} />}
      {tab === 10 && <HomeworkTab classes={classes} subjects={subjects} showSnack={showSnack} />}
      {tab === 11 && <LessonPlansTab classes={classes} subjects={subjects} showSnack={showSnack} />}
      {tab === 12 && <CalendarTab classes={classes} showSnack={showSnack} />}
      {tab === 13 && <MaterialsTab classes={classes} subjects={subjects} showSnack={showSnack} />}
      {tab === 14 && <SettingsTab examTypes={examTypes} setExamTypes={setExamTypes} showSnack={showSnack} />}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ============================================================
// DASHBOARD TAB
// ============================================================
function DashboardTab({ showSnack }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    academicsAPI.getExamDashboard().then(r => setData(r.data.data)).catch(() => showSnack('Failed to load dashboard', 'error'));
  }, []);

  if (!data) return <LinearProgress />;

  const stats = data.stats;
  const statCards = [
    { label: 'Total Exams', value: stats.total_exams, icon: <EventNote />, color: '#6366f1' },
    { label: 'Upcoming', value: stats.upcoming, icon: <Schedule />, color: '#ed6c02' },
    { label: 'Ongoing', value: stats.ongoing, icon: <Assignment />, color: '#2e7d32' },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle />, color: '#9c27b0' },
    { label: 'Results Published', value: stats.results_published, icon: <BarChart />, color: '#0288d1' },
    { label: 'Subjects', value: stats.total_subjects, icon: <School />, color: '#d32f2f' },
    { label: 'Exam Halls', value: stats.total_halls, icon: <MeetingRoom />, color: '#7b1fa2' },
    { label: 'Report Cards', value: stats.total_report_cards, icon: <Assessment />, color: '#388e3c' },
  ];

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        {statCards.map((sc, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ background: `linear-gradient(135deg, ${sc.color}15, ${sc.color}30)`, border: `1px solid ${sc.color}40`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${sc.color}30` } }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${sc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color }}>{sc.icon}</Box>
                <Box>
                  <Typography variant="h5" fontWeight="bold">{sc.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{sc.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" mb={2}>Recent Exams</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Exam Name</TableCell><TableCell>Type</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {data.recent_exams?.map(e => (
                <TableRow key={e.id}>
                  <TableCell><strong>{e.name}</strong></TableCell>
                  <TableCell>{e.exam_type?.name || '-'}</TableCell>
                  <TableCell>{e.start_date || '-'}</TableCell>
                  <TableCell>{e.end_date || '-'}</TableCell>
                  <TableCell><Chip label={e.status} size="small" color={e.status === 'completed' ? 'success' : e.status === 'ongoing' ? 'warning' : 'info'} /></TableCell>
                </TableRow>
              ))}
              {!data.recent_exams?.length && <TableRow><TableCell colSpan={5} align="center">No exams yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// ============================================================
// EXAMS TAB
// ============================================================
function ExamsTab({ classes, subjects, examTypes, gradingSystems, academicYears, showSnack }) {
  const [exams, setExams] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [openExam, setOpenExam] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', exam_type_id: '', grading_system_id: '', academic_year_id: '', start_date: '', end_date: '', description: '', instructions: '' });
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ class_id: '', subject_id: '', exam_date: '', start_time: '', end_time: '', max_marks: '', passing_marks: '', duration_minutes: '' });

  const loadExams = useCallback(() => {
    const params = { page: page + 1, per_page: 20 };
    if (statusFilter) params.status = statusFilter;
    academicsAPI.listExams(params).then(r => setExams(r.data.data || { items: [], total: 0 })).catch(() => {});
  }, [page, statusFilter]);

  useEffect(() => { loadExams(); }, [loadExams]);

  const saveExam = () => {
    const fn = editingExam ? academicsAPI.updateExam(editingExam.id, examForm) : academicsAPI.createExam(examForm);
    fn.then(() => {
      showSnack(editingExam ? 'Exam updated' : 'Exam created');
      setOpenExam(false); setEditingExam(null);
      setExamForm({ name: '', exam_type_id: '', grading_system_id: '', academic_year_id: '', start_date: '', end_date: '', description: '', instructions: '' });
      loadExams();
    }).catch(() => showSnack('Failed', 'error'));
  };

  const deleteExam = (id) => {
    if (!window.confirm('Delete this exam?')) return;
    academicsAPI.deleteExam(id).then(() => { showSnack('Deleted'); loadExams(); }).catch(() => showSnack('Failed', 'error'));
  };

  const viewExam = (exam) => {
    academicsAPI.getExam(exam.id).then(r => setSelectedExam(r.data.data)).catch(() => showSnack('Failed to load', 'error'));
  };

  const editExam = (exam) => {
    setEditingExam(exam);
    setExamForm({
      name: exam.name, exam_type_id: exam.exam_type_id || '', grading_system_id: exam.grading_system_id || '',
      academic_year_id: exam.academic_year_id || '', start_date: exam.start_date || '', end_date: exam.end_date || '',
      description: exam.description || '', instructions: exam.instructions || '',
    });
    setOpenExam(true);
  };

  const addSchedule = () => {
    academicsAPI.addExamSchedule(selectedExam.id, scheduleForm).then(() => {
      showSnack('Schedule added');
      setOpenSchedule(false);
      setScheduleForm({ class_id: '', subject_id: '', exam_date: '', start_time: '', end_time: '', max_marks: '', passing_marks: '', duration_minutes: '' });
      viewExam(selectedExam);
    }).catch(() => showSnack('Failed', 'error'));
  };

  const deleteSchedule = (id) => {
    academicsAPI.deleteSchedule(id).then(() => { showSnack('Deleted'); viewExam(selectedExam); }).catch(() => showSnack('Failed', 'error'));
  };

  const updateStatus = (examId, status) => {
    academicsAPI.updateExamStatus(examId, { status }).then(() => { showSnack('Status updated'); loadExams(); if (selectedExam) viewExam(selectedExam); }).catch(() => showSnack('Failed', 'error'));
  };

  return (
    <Box>
      {!selectedExam ? (
        <>
          <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="results_published">Published</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEditingExam(null); setExamForm({ name: '', exam_type_id: '', grading_system_id: '', academic_year_id: '', start_date: '', end_date: '', description: '', instructions: '' }); setOpenExam(true); }}>Create Exam</Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Academic Year</TableCell><TableCell>Dates</TableCell><TableCell>Schedules</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {exams.items?.map(e => (
                  <TableRow key={e.id} hover>
                    <TableCell><strong>{e.name}</strong></TableCell>
                    <TableCell>{e.exam_type?.name || '-'}</TableCell>
                    <TableCell>{e.academic_year || '-'}</TableCell>
                    <TableCell>{e.start_date || '-'} → {e.end_date || '-'}</TableCell>
                    <TableCell><Chip label={e.schedule_count} size="small" /></TableCell>
                    <TableCell><Chip label={e.status} size="small" color={e.status === 'completed' ? 'success' : e.status === 'ongoing' ? 'warning' : e.status === 'results_published' ? 'primary' : 'default'} /></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => viewExam(e)}><Visibility fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => editExam(e)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteExam(e.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!exams.items?.length && <TableRow><TableCell colSpan={7} align="center">No exams found</TableCell></TableRow>}
              </TableBody>
            </Table>
            <TablePagination component="div" count={exams.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </TableContainer>
        </>
      ) : (
        /* Exam Detail View */
        <Box>
          <Button onClick={() => setSelectedExam(null)} sx={{ mb: 2 }}>← Back to Exams</Button>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h5" fontWeight="bold">{selectedExam.name}</Typography>
                <Typography color="text.secondary">{selectedExam.description || ''}</Typography>
              </Box>
              <Box display="flex" gap={1}>
                {selectedExam.status === 'upcoming' && <Button variant="outlined" color="warning" onClick={() => updateStatus(selectedExam.id, 'ongoing')}>Start Exam</Button>}
                {selectedExam.status === 'ongoing' && <Button variant="outlined" color="success" onClick={() => updateStatus(selectedExam.id, 'completed')}>Complete</Button>}
                {selectedExam.status === 'completed' && <Button variant="outlined" color="primary" onClick={() => updateStatus(selectedExam.id, 'results_published')}>Publish Results</Button>}
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="text.secondary">Type</Typography><Typography>{selectedExam.exam_type?.name || '-'}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="text.secondary">Academic Year</Typography><Typography>{selectedExam.academic_year || '-'}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="text.secondary">Start Date</Typography><Typography>{selectedExam.start_date || '-'}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="text.secondary">Status</Typography><Chip label={selectedExam.status} color="primary" size="small" /></Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Exam Schedule ({selectedExam.schedules?.length || 0})</Typography>
              <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenSchedule(true)}>Add Schedule</Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Subject</TableCell><TableCell>Class</TableCell><TableCell>Date</TableCell><TableCell>Time</TableCell><TableCell>Max Marks</TableCell><TableCell>Pass Marks</TableCell><TableCell>Locked</TableCell><TableCell>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {selectedExam.schedules?.map(s => (
                    <TableRow key={s.id}>
                      <TableCell><strong>{s.subject?.name}</strong></TableCell>
                      <TableCell>{s.class_name}</TableCell>
                      <TableCell>{s.exam_date}</TableCell>
                      <TableCell>{s.start_time || '-'} - {s.end_time || '-'}</TableCell>
                      <TableCell>{s.max_marks}</TableCell>
                      <TableCell>{s.passing_marks || '-'}</TableCell>
                      <TableCell>{s.is_marks_locked ? <Lock color="error" fontSize="small" /> : <LockOpen color="success" fontSize="small" />}</TableCell>
                      <TableCell><IconButton size="small" color="error" onClick={() => deleteSchedule(s.id)}><Delete fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {!selectedExam.schedules?.length && <TableRow><TableCell colSpan={8} align="center">No schedules</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Create/Edit Exam Dialog */}
      <Dialog open={openExam} onClose={() => setOpenExam(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingExam ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Exam Name" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Exam Type</InputLabel>
                <Select value={examForm.exam_type_id} label="Exam Type" onChange={e => setExamForm({ ...examForm, exam_type_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {examTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Grading System</InputLabel>
                <Select value={examForm.grading_system_id} label="Grading System" onChange={e => setExamForm({ ...examForm, grading_system_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {gradingSystems.map(gs => <MenuItem key={gs.id} value={gs.id}>{gs.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Academic Year</InputLabel>
                <Select value={examForm.academic_year_id} label="Academic Year" onChange={e => setExamForm({ ...examForm, academic_year_id: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {academicYears.map(ay => <MenuItem key={ay.id} value={ay.id}>{ay.year}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="Start Date" value={examForm.start_date} onChange={e => setExamForm({ ...examForm, start_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="End Date" value={examForm.end_date} onChange={e => setExamForm({ ...examForm, end_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Instructions" value={examForm.instructions} onChange={e => setExamForm({ ...examForm, instructions: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenExam(false)}>Cancel</Button><Button variant="contained" onClick={saveExam}>{editingExam ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      {/* Add Schedule Dialog */}
      <Dialog open={openSchedule} onClose={() => setOpenSchedule(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Exam Schedule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Class</InputLabel>
                <Select value={scheduleForm.class_id} label="Class" onChange={e => setScheduleForm({ ...scheduleForm, class_id: e.target.value })}>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Subject</InputLabel>
                <Select value={scheduleForm.subject_id} label="Subject" onChange={e => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}>
                  {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="date" label="Exam Date" value={scheduleForm.exam_date} onChange={e => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="time" label="Start Time" value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="time" label="End Time" value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Max Marks" value={scheduleForm.max_marks} onChange={e => setScheduleForm({ ...scheduleForm, max_marks: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Passing Marks" value={scheduleForm.passing_marks} onChange={e => setScheduleForm({ ...scheduleForm, passing_marks: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Duration (min)" value={scheduleForm.duration_minutes} onChange={e => setScheduleForm({ ...scheduleForm, duration_minutes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenSchedule(false)}>Cancel</Button><Button variant="contained" onClick={addSchedule}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// MARKS ENTRY TAB
// ============================================================
function MarksEntryTab({ classes, showSnack }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [marksSheet, setMarksSheet] = useState(null);
  const [editMarks, setEditMarks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    academicsAPI.listExams({ per_page: 100 }).then(r => setExams(r.data.data?.items || [])).catch(() => {});
  }, []);

  const loadMarksSheet = () => {
    if (!selectedExamId || !selectedClassId) return;
    academicsAPI.getMarksSheet({ exam_id: selectedExamId, class_id: selectedClassId })
      .then(r => {
        setMarksSheet(r.data.data);
        // Init edit marks
        const marks = {};
        r.data.data?.marks?.forEach(m => {
          m.subjects.forEach(s => {
            marks[`${m.student_id}_${s.schedule_id}`] = {
              marks_obtained: s.marks_obtained ?? '',
              is_absent: s.is_absent || false,
            };
          });
        });
        setEditMarks(marks);
      })
      .catch(() => showSnack('Failed to load marks', 'error'));
  };

  const saveMarks = (scheduleId) => {
    const entries = [];
    marksSheet.marks.forEach(m => {
      const key = `${m.student_id}_${scheduleId}`;
      const val = editMarks[key];
      if (val) {
        entries.push({
          student_id: m.student_id,
          marks_obtained: val.is_absent ? null : (val.marks_obtained !== '' ? parseFloat(val.marks_obtained) : null),
          is_absent: val.is_absent,
        });
      }
    });
    setSaving(true);
    academicsAPI.bulkMarksEntry({ exam_schedule_id: scheduleId, entries })
      .then(() => { showSnack('Marks saved'); loadMarksSheet(); })
      .catch(() => showSnack('Failed to save', 'error'))
      .finally(() => setSaving(false));
  };

  const lockMarks = (scheduleId, lock) => {
    const fn = lock ? academicsAPI.lockMarks : academicsAPI.unlockMarks;
    fn({ exam_schedule_id: scheduleId }).then(() => { showSnack(lock ? 'Locked' : 'Unlocked'); loadMarksSheet(); }).catch(() => showSnack('Failed', 'error'));
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small"><InputLabel>Exam</InputLabel>
              <Select value={selectedExamId} label="Exam" onChange={e => setSelectedExamId(e.target.value)}>
                {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small"><InputLabel>Class</InputLabel>
              <Select value={selectedClassId} label="Class" onChange={e => setSelectedClassId(e.target.value)}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" onClick={loadMarksSheet} disabled={!selectedExamId || !selectedClassId}>Load Marks Sheet</Button>
          </Grid>
        </Grid>
      </Paper>

      {saving && <LinearProgress sx={{ mb: 1 }} />}

      {marksSheet && marksSheet.schedules?.map(schedule => (
        <Accordion key={schedule.id} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Typography fontWeight="bold">{schedule.subject?.name}</Typography>
              <Chip label={`Max: ${schedule.max_marks}`} size="small" />
              <Chip label={`Pass: ${schedule.passing_marks || '-'}`} size="small" />
              <Chip label={schedule.exam_date} size="small" variant="outlined" />
              {schedule.is_marks_locked && <Lock color="error" fontSize="small" />}
              <Box sx={{ ml: 'auto', mr: 2 }}>
                <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); saveMarks(schedule.id); }} disabled={schedule.is_marks_locked}>Save</Button>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); lockMarks(schedule.id, !schedule.is_marks_locked); }}>
                  {schedule.is_marks_locked ? <LockOpen fontSize="small" /> : <Lock fontSize="small" />}
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>#</TableCell><TableCell>Student</TableCell><TableCell>Adm No</TableCell><TableCell>Marks ({schedule.max_marks})</TableCell><TableCell>Absent</TableCell><TableCell>Grade</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {marksSheet.marks?.map((m, idx) => {
                    const key = `${m.student_id}_${schedule.id}`;
                    const subj = m.subjects.find(s => s.schedule_id === schedule.id);
                    const val = editMarks[key] || { marks_obtained: '', is_absent: false };
                    return (
                      <TableRow key={m.student_id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{m.student_name}</TableCell>
                        <TableCell>{m.admission_no || '-'}</TableCell>
                        <TableCell>
                          <TextField
                            size="small" type="number" sx={{ width: 100 }}
                            value={val.marks_obtained} disabled={val.is_absent || schedule.is_marks_locked}
                            onChange={e => setEditMarks({ ...editMarks, [key]: { ...val, marks_obtained: e.target.value } })}
                            inputProps={{ min: 0, max: schedule.max_marks, step: 0.5 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch size="small" checked={val.is_absent} disabled={schedule.is_marks_locked}
                            onChange={e => setEditMarks({ ...editMarks, [key]: { ...val, is_absent: e.target.checked, marks_obtained: e.target.checked ? '' : val.marks_obtained } })} />
                        </TableCell>
                        <TableCell>{subj?.grade || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {marksSheet && !marksSheet.schedules?.length && <Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No schedules found for this exam & class</Typography></Paper>}
    </Box>
  );
}

// ============================================================
// REPORT CARDS TAB
// ============================================================
function ReportCardsTab({ classes, showSnack }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [reportCards, setReportCards] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    academicsAPI.listExams({ per_page: 100 }).then(r => setExams(r.data.data?.items || [])).catch(() => {});
  }, []);

  const loadCards = useCallback(() => {
    const params = { page: page + 1, per_page: 20 };
    if (selectedExamId) params.exam_id = selectedExamId;
    if (selectedClassId) params.class_id = selectedClassId;
    academicsAPI.listReportCards(params).then(r => setReportCards(r.data.data || { items: [], total: 0 })).catch(() => {});
  }, [page, selectedExamId, selectedClassId]);

  useEffect(() => { if (selectedExamId) loadCards(); }, [loadCards, selectedExamId]);

  const generateCards = () => {
    if (!selectedExamId || !selectedClassId) { showSnack('Select exam and class', 'warning'); return; }
    academicsAPI.generateReportCards({ exam_id: selectedExamId, class_id: selectedClassId })
      .then(r => { showSnack(`${r.data.data?.length || 0} report cards generated`); loadCards(); })
      .catch(() => showSnack('Failed', 'error'));
  };

  const publishCards = () => {
    academicsAPI.publishReportCards({ exam_id: selectedExamId, class_id: selectedClassId || undefined })
      .then(r => { showSnack(r.data.message); loadCards(); })
      .catch(() => showSnack('Failed', 'error'));
  };

  const viewCard = (id) => {
    academicsAPI.getReportCard(id).then(r => setSelectedCard(r.data.data)).catch(() => showSnack('Failed', 'error'));
  };

  const downloadPDF = async (rcId, studentName) => {
    try {
      const res = await academicsAPI.downloadReportCardPDF(rcId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ReportCard_${studentName || 'student'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnack('PDF downloaded!');
    } catch { showSnack('PDF download failed', 'error'); }
  };

  const downloadSamplePDF = async () => {
    try {
      const res = await academicsAPI.downloadSampleReportCard();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Sample_ReportCard_ClassX.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnack('Sample PDF downloaded!');
    } catch { showSnack('Download failed', 'error'); }
  };

  if (selectedCard) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Button onClick={() => setSelectedCard(null)}>← Back</Button>
          <Button variant="contained" color="error" startIcon={<Print />}
            onClick={() => downloadPDF(selectedCard.id, selectedCard.student_name)}
            sx={{ background: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)', borderRadius: 2 }}>
            Download PDF
          </Button>
        </Box>
        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight="bold">{selectedCard.student_name}</Typography>
              <Typography color="text.secondary">Adm No: {selectedCard.admission_no} | Class: {selectedCard.class_name} | {selectedCard.exam_name}</Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="h4" color="primary" fontWeight="bold">{selectedCard.percentage}%</Typography>
              <Chip label={`Grade: ${selectedCard.grade || '-'}`} color="primary" />
              <Chip label={`Rank: ${selectedCard.rank_in_class}/${selectedCard.total_students}`} sx={{ ml: 1 }} />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" mb={1}>Subject-wise Results</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Subject</TableCell><TableCell align="center">Max Marks</TableCell><TableCell align="center">Marks Obtained</TableCell><TableCell align="center">Grade</TableCell><TableCell align="center">Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {selectedCard.subjects?.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell><strong>{s.subject}</strong></TableCell>
                    <TableCell align="center">{s.max_marks}</TableCell>
                    <TableCell align="center">{s.is_absent ? 'AB' : s.marks_obtained}</TableCell>
                    <TableCell align="center">{s.grade || '-'}</TableCell>
                    <TableCell align="center">
                      {s.is_absent ? <Chip label="Absent" size="small" color="error" /> :
                        s.marks_obtained >= (s.max_marks * 0.33) ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Total</strong></TableCell>
                  <TableCell align="center"><strong>{selectedCard.total_max_marks}</strong></TableCell>
                  <TableCell align="center"><strong>{selectedCard.total_marks}</strong></TableCell>
                  <TableCell align="center"><strong>{selectedCard.grade}</strong></TableCell>
                  <TableCell align="center"><Chip label={selectedCard.result_status?.toUpperCase()} size="small" color={selectedCard.result_status === 'pass' ? 'success' : 'error'} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {(selectedCard.teacher_remarks || selectedCard.principal_remarks) && (
            <Box mt={2}>
              {selectedCard.teacher_remarks && <Typography><strong>Teacher Remarks:</strong> {selectedCard.teacher_remarks}</Typography>}
              {selectedCard.principal_remarks && <Typography><strong>Principal Remarks:</strong> {selectedCard.principal_remarks}</Typography>}
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small"><InputLabel>Exam</InputLabel>
              <Select value={selectedExamId} label="Exam" onChange={e => { setSelectedExamId(e.target.value); setPage(0); }}>
                {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small"><InputLabel>Class</InputLabel>
              <Select value={selectedClassId} label="Class" onChange={e => { setSelectedClassId(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} display="flex" gap={1} flexWrap="wrap">
            <Button variant="contained" onClick={generateCards} startIcon={<Assessment />}>Generate</Button>
            <Button variant="outlined" color="success" onClick={publishCards} startIcon={<CheckCircle />}>Publish</Button>
            <Button variant="outlined" color="error" onClick={downloadSamplePDF} startIcon={<Print />}>
              Sample PDF (10th)
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Rank</TableCell><TableCell>Student</TableCell><TableCell>Adm No</TableCell><TableCell>Class</TableCell><TableCell>Total</TableCell><TableCell>%</TableCell><TableCell>Grade</TableCell><TableCell>Result</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {reportCards.items?.map(rc => (
              <TableRow key={rc.id} hover>
                <TableCell><EmojiEvents fontSize="small" sx={{ color: rc.rank_in_class <= 3 ? '#ffc107' : '#ccc', mr: 0.5 }} />{rc.rank_in_class}</TableCell>
                <TableCell><strong>{rc.student_name}</strong></TableCell>
                <TableCell>{rc.admission_no}</TableCell>
                <TableCell>{rc.class_name}</TableCell>
                <TableCell>{rc.total_marks}/{rc.total_max_marks}</TableCell>
                <TableCell><strong>{rc.percentage}%</strong></TableCell>
                <TableCell>{rc.grade || '-'}</TableCell>
                <TableCell><Chip label={rc.result_status} size="small" color={rc.result_status === 'pass' ? 'success' : 'error'} /></TableCell>
                <TableCell><Chip label={rc.status} size="small" variant="outlined" /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => viewCard(rc.id)}><Visibility fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => downloadPDF(rc.id, rc.student_name)}><Print fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!reportCards.items?.length && <TableRow><TableCell colSpan={10} align="center">No report cards</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={reportCards.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );
}

// ============================================================
// SUBJECTS TAB
// ============================================================
function SubjectsTab({ subjects, setSubjects, showSnack }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'theory', description: '', credit_hours: '', is_elective: false });
  const [editing, setEditing] = useState(null);

  const reload = () => academicsAPI.listSubjects().then(r => setSubjects(r.data.data || [])).catch(() => {});

  const save = () => {
    const fn = editing ? academicsAPI.updateSubject(editing.id, form) : academicsAPI.createSubject(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const del = (id) => {
    if (!window.confirm('Delete?')) return;
    academicsAPI.deleteSubject(id).then(() => { showSnack('Deleted'); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const edit = (s) => {
    setEditing(s);
    setForm({ name: s.name, code: s.code || '', type: s.type || 'theory', description: s.description || '', credit_hours: s.credit_hours || '', is_elective: s.is_elective || false });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ name: '', code: '', type: 'theory', description: '', credit_hours: '', is_elective: false }); setOpenDialog(true); }}>Add Subject</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Credits</TableCell><TableCell>Elective</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {subjects.map(s => (
              <TableRow key={s.id}>
                <TableCell><Chip label={s.code || '-'} size="small" /></TableCell>
                <TableCell><strong>{s.name}</strong></TableCell>
                <TableCell><Chip label={s.type} size="small" variant="outlined" /></TableCell>
                <TableCell>{s.credit_hours || '-'}</TableCell>
                <TableCell>{s.is_elective ? <CheckCircle color="info" fontSize="small" /> : '-'}</TableCell>
                <TableCell>{s.is_active !== false ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => edit(s)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => del(s.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!subjects.length && <TableRow><TableCell colSpan={7} align="center">No subjects</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type" onChange={e => setForm({ ...form, type: e.target.value })}>
                  <MenuItem value="theory">Theory</MenuItem><MenuItem value="practical">Practical</MenuItem><MenuItem value="both">Both</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Credit Hours" value={form.credit_hours} onChange={e => setForm({ ...form, credit_hours: e.target.value })} /></Grid>
            <Grid item xs={6} sm={3}><FormControlLabel control={<Switch checked={form.is_elective} onChange={e => setForm({ ...form, is_elective: e.target.checked })} />} label="Elective" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// TIMETABLE TAB
// ============================================================
function TimetableTab({ classes, subjects, showSnack }) {
  const [timetable, setTimetable] = useState([]);
  const [classId, setClassId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ class_id: '', section_id: '', subject_id: '', day_of_week: '', start_time: '', end_time: '', room_no: '' });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  useEffect(() => {
    if (classId) academicsAPI.getTimetable({ class_id: classId }).then(r => setTimetable(r.data.data || [])).catch(() => {});
  }, [classId]);

  const save = () => {
    academicsAPI.createTimetable({ ...form, class_id: form.class_id || classId }).then(() => {
      showSnack('Added'); setOpenDialog(false);
      if (classId) academicsAPI.getTimetable({ class_id: classId }).then(r => setTimetable(r.data.data || []));
    }).catch(() => showSnack('Failed', 'error'));
  };

  const del = (id) => {
    academicsAPI.deleteTimetable(id).then(() => {
      showSnack('Deleted');
      if (classId) academicsAPI.getTimetable({ class_id: classId }).then(r => setTimetable(r.data.data || []));
    }).catch(() => showSnack('Failed', 'error'));
  };

  // Group by day
  const grouped = {};
  days.forEach(d => { grouped[d] = timetable.filter(t => t.day_of_week === d).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')); });

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classId} label="Class" onChange={e => setClassId(e.target.value)}>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ class_id: classId, section_id: '', subject_id: '', day_of_week: '', start_time: '', end_time: '', room_no: '' }); setOpenDialog(true); }}>Add Period</Button>
      </Box>

      {classId && days.map(day => (
        <Box key={day} mb={2}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ textTransform: 'capitalize', mb: 1 }}>{day}</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {grouped[day].length > 0 ? grouped[day].map(t => (
              <Paper key={t.id} sx={{ p: 1.5, minWidth: 160, position: 'relative' }}>
                <Typography fontWeight="bold" fontSize={14}>{t.subject?.name || t.subject_name}</Typography>
                <Typography variant="caption" color="text.secondary">{t.start_time} - {t.end_time}</Typography>
                <br /><Typography variant="caption">{t.teacher_name || t.teacher?.name || '-'}</Typography>
                {t.room_no && <Typography variant="caption" display="block">Room: {t.room_no}</Typography>}
                <IconButton size="small" sx={{ position: 'absolute', top: 2, right: 2 }} onClick={() => del(t.id)}><Delete fontSize="small" /></IconButton>
              </Paper>
            )) : <Typography variant="caption" color="text.secondary">No periods</Typography>}
          </Box>
        </Box>
      ))}

      {!classId && <Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Select a class to view timetable</Typography></Paper>}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Period</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Class</InputLabel>
                <Select value={form.class_id} label="Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Subject</InputLabel>
                <Select value={form.subject_id} label="Subject" onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Day</InputLabel>
                <Select value={form.day_of_week} label="Day" onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
                  {days.map(d => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="time" label="Start" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="time" label="End" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Room No" value={form.room_no} onChange={e => setForm({ ...form, room_no: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// GRADING TAB
// ============================================================
function GradingTab({ gradingSystems, setGradingSystems, showSnack }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'percentage', description: '', is_default: false, grades: [] });
  const [gradeForm, setGradeForm] = useState({ name: '', min_marks: '', max_marks: '', grade_point: '', description: '', is_passing: true });
  const [openGrade, setOpenGrade] = useState(null);

  const reload = () => academicsAPI.listGradingSystems().then(r => setGradingSystems(r.data.data || [])).catch(() => {});

  const save = () => {
    academicsAPI.createGradingSystem(form).then(() => {
      showSnack('Created'); setOpenDialog(false); reload();
    }).catch(() => showSnack('Failed', 'error'));
  };

  const del = (id) => {
    if (!window.confirm('Delete grading system?')) return;
    academicsAPI.deleteGradingSystem(id).then(() => { showSnack('Deleted'); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const addGrade = (gsId) => {
    academicsAPI.addGrade(gsId, gradeForm).then(() => {
      showSnack('Grade added'); setOpenGrade(null);
      setGradeForm({ name: '', min_marks: '', max_marks: '', grade_point: '', description: '', is_passing: true });
      reload();
    }).catch(() => showSnack('Failed', 'error'));
  };

  const deleteGrade = (gradeId) => {
    academicsAPI.deleteGrade(gradeId).then(() => { showSnack('Deleted'); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ name: '', type: 'percentage', description: '', is_default: false, grades: [] }); setOpenDialog(true); }}>Add Grading System</Button>
      </Box>

      {gradingSystems.map(gs => (
        <Accordion key={gs.id} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <GradeIcon color="primary" />
              <Typography fontWeight="bold">{gs.name}</Typography>
              <Chip label={gs.type} size="small" variant="outlined" />
              {gs.is_default && <Chip label="Default" size="small" color="primary" />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">{gs.description || 'No description'}</Typography>
              <Box>
                <Button size="small" onClick={() => setOpenGrade(gs.id)} startIcon={<Add />}>Add Grade</Button>
                <IconButton size="small" color="error" onClick={() => del(gs.id)}><Delete fontSize="small" /></IconButton>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Grade</TableCell><TableCell>Min %</TableCell><TableCell>Max %</TableCell><TableCell>Grade Point</TableCell><TableCell>Description</TableCell><TableCell>Passing</TableCell><TableCell></TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {gs.grades?.map(g => (
                    <TableRow key={g.id}>
                      <TableCell><strong>{g.name}</strong></TableCell>
                      <TableCell>{g.min_marks}</TableCell>
                      <TableCell>{g.max_marks}</TableCell>
                      <TableCell>{g.grade_point || '-'}</TableCell>
                      <TableCell>{g.description || '-'}</TableCell>
                      <TableCell>{g.is_passing ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}</TableCell>
                      <TableCell><IconButton size="small" onClick={() => deleteGrade(g.id)}><Delete fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {!gs.grades?.length && <TableRow><TableCell colSpan={7} align="center">No grades defined</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {!gradingSystems.length && <Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No grading systems</Typography></Paper>}

      {/* Create Grading System Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Grading System</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.type} label="Type" onChange={e => setForm({ ...form, type: e.target.value })}>
                  <MenuItem value="percentage">Percentage</MenuItem><MenuItem value="gpa">GPA</MenuItem><MenuItem value="cgpa">CGPA</MenuItem><MenuItem value="letter">Letter</MenuItem><MenuItem value="marks">Marks</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={9}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12} sm={3}><FormControlLabel control={<Switch checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} />} label="Default" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>

      {/* Add Grade Dialog */}
      <Dialog open={!!openGrade} onClose={() => setOpenGrade(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Grade</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Grade Name" value={gradeForm.name} onChange={e => setGradeForm({ ...gradeForm, name: e.target.value })} placeholder="A+" required /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Min Marks %" value={gradeForm.min_marks} onChange={e => setGradeForm({ ...gradeForm, min_marks: e.target.value })} required /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Max Marks %" value={gradeForm.max_marks} onChange={e => setGradeForm({ ...gradeForm, max_marks: e.target.value })} required /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Grade Point" value={gradeForm.grade_point} onChange={e => setGradeForm({ ...gradeForm, grade_point: e.target.value })} inputProps={{ step: 0.1 }} /></Grid>
            <Grid item xs={12} sm={5}><TextField fullWidth label="Description" value={gradeForm.description} onChange={e => setGradeForm({ ...gradeForm, description: e.target.value })} placeholder="Outstanding" /></Grid>
            <Grid item xs={6} sm={3}><FormControlLabel control={<Switch checked={gradeForm.is_passing} onChange={e => setGradeForm({ ...gradeForm, is_passing: e.target.checked })} />} label="Passing" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenGrade(null)}>Cancel</Button><Button variant="contained" onClick={() => addGrade(openGrade)}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// HALLS TAB
// ============================================================
function HallsTab({ showSnack }) {
  const [halls, setHalls] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ name: '', building: '', floor: '', capacity: '', rows: '', columns: '', has_cctv: false });
  const [editing, setEditing] = useState(null);

  const reload = () => academicsAPI.listExamHalls().then(r => setHalls(r.data.data || [])).catch(() => {});
  useEffect(() => { reload(); }, []);

  const save = () => {
    const fn = editing ? academicsAPI.updateExamHall(editing.id, form) : academicsAPI.createExamHall(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const del = (id) => {
    if (!window.confirm('Delete?')) return;
    academicsAPI.deleteExamHall(id).then(() => { showSnack('Deleted'); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const edit = (h) => {
    setEditing(h);
    setForm({ name: h.name, building: h.building || '', floor: h.floor || '', capacity: h.capacity, rows: h.rows || '', columns: h.columns || '', has_cctv: h.has_cctv || false });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ name: '', building: '', floor: '', capacity: '', rows: '', columns: '', has_cctv: false }); setOpenDialog(true); }}>Add Hall</Button>
      </Box>

      <Grid container spacing={2}>
        {halls.map(h => (
          <Grid item xs={12} md={4} key={h.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <MeetingRoom color="primary" />
                    <Typography variant="h6">{h.name}</Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => edit(h)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => del(h.id)}><Delete fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2"><strong>Building:</strong> {h.building || '-'}</Typography>
                <Typography variant="body2"><strong>Floor:</strong> {h.floor || '-'}</Typography>
                <Typography variant="body2"><strong>Capacity:</strong> {h.capacity} students</Typography>
                {h.rows && <Typography variant="body2"><strong>Layout:</strong> {h.rows} × {h.columns} seats</Typography>}
                <Box mt={1}>
                  {h.has_cctv && <Chip label="CCTV" size="small" color="success" icon={<CheckCircle />} />}
                  <Chip label={h.is_active !== false ? 'Active' : 'Inactive'} size="small" sx={{ ml: 0.5 }} color={h.is_active !== false ? 'primary' : 'default'} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!halls.length && <Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No exam halls</Typography></Paper>}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Hall' : 'Add Exam Hall'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Hall Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Building" value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Floor" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={form.has_cctv} onChange={e => setForm({ ...form, has_cctv: e.target.checked })} />} label="CCTV" /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Rows" value={form.rows} onChange={e => setForm({ ...form, rows: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Columns" value={form.columns} onChange={e => setForm({ ...form, columns: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// CLASS TEACHERS TAB
// ============================================================
function ClassTeachersTab({ classes, showSnack }) {
  const [assignments, setAssignments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [form, setForm] = useState({ class_teacher_id: '', co_class_teacher_id: '' });
  const [responsibilities, setResponsibilities] = useState(null);
  const [showResp, setShowResp] = useState(null); // 'ct' or 'cct'

  const loadData = useCallback(() => {
    const params = {};
    if (filterClass) params.class_id = filterClass;
    academicsAPI.getClassTeachers(params).then(r => setAssignments(r.data.data || [])).catch(() => {});
  }, [filterClass]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    staffAPI.list({ per_page: 500, status: 'active' }).then(r => setStaffList(r.data.data?.items || r.data.data || [])).catch(() => {});
    academicsAPI.getClassTeacherResponsibilities().then(r => setResponsibilities(r.data.data)).catch(() => {});
  }, []);

  const teachingStaff = staffList.filter(s => s.staff_type === 'teaching' || !s.staff_type);

  const openAssign = (section) => {
    setSelectedSection(section);
    setForm({
      class_teacher_id: section.class_teacher_id || '',
      co_class_teacher_id: section.co_class_teacher_id || ''
    });
    setAssignDialog(true);
  };

  const saveAssignment = () => {
    if (form.class_teacher_id && form.co_class_teacher_id && form.class_teacher_id === form.co_class_teacher_id) {
      showSnack('Class Teacher aur Co-Class Teacher same nahi ho sakte', 'error');
      return;
    }
    academicsAPI.assignClassTeacher({
      section_id: selectedSection.section_id,
      class_teacher_id: form.class_teacher_id || null,
      co_class_teacher_id: form.co_class_teacher_id || null
    }).then(() => {
      showSnack('Class Teacher assigned successfully!');
      setAssignDialog(false);
      loadData();
    }).catch(err => showSnack(err.response?.data?.message || 'Failed', 'error'));
  };

  const totalSections = assignments.length;
  const assigned = assignments.filter(a => a.class_teacher_id).length;
  const unassigned = totalSections - assigned;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <People fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{totalSections}</Typography>
                  <Typography variant="body2">Total Sections</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{assigned}</Typography>
                  <Typography variant="body2">Class Teacher Assigned</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Warning fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">{unassigned}</Typography>
                  <Typography variant="body2">Unassigned Sections</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter + Responsibility Buttons */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Class</InputLabel>
              <Select value={filterClass} label="Filter by Class" onChange={e => setFilterClass(e.target.value)}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={8} display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
            <Button variant="outlined" startIcon={<Assignment />} onClick={() => setShowResp('ct')}
              sx={{ borderColor: '#1565c0', color: '#1565c0' }}>
              CT Responsibilities
            </Button>
            <Button variant="outlined" startIcon={<Assignment />} onClick={() => setShowResp('cct')}
              sx={{ borderColor: '#7b1fa2', color: '#7b1fa2' }}>
              Co-CT Responsibilities
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(135deg, #263238 0%, #455a64 100%)' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Class - Section</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Students</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Class Teacher</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Co-Class Teacher</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map(a => (
              <TableRow key={a.section_id} hover sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <School color="primary" />
                    <Typography fontWeight="bold">{a.class_name} - {a.section_name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={`${a.student_count} students`} size="small"
                    icon={<People />} sx={{ bgcolor: '#e3f2fd' }} />
                </TableCell>
                <TableCell>
                  {a.class_teacher ? (
                    <Chip
                      icon={<PersonOutline />}
                      label={a.class_teacher.full_name}
                      color="primary" variant="filled" size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  ) : (
                    <Chip label="Not Assigned" size="small" color="warning" variant="outlined" icon={<Warning />} />
                  )}
                </TableCell>
                <TableCell>
                  {a.co_class_teacher ? (
                    <Chip
                      icon={<SupervisorAccount />}
                      label={a.co_class_teacher.full_name}
                      color="secondary" variant="filled" size="small"
                    />
                  ) : (
                    <Chip label="Not Assigned" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Assign / Change Teachers">
                    <IconButton color="primary" onClick={() => openAssign(a)}>
                      <SwapHoriz />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!assignments.length && (
              <TableRow><TableCell colSpan={5} align="center">
                <Typography color="text.secondary" py={3}>No sections found. Create classes and sections first.</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Assign Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <School />
            Assign Teachers — {selectedSection?.class_name} - {selectedSection?.section_name}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom fontWeight="bold">
                <PersonOutline sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Class Teacher (CT)
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Select Class Teacher</InputLabel>
                <Select value={form.class_teacher_id} label="Select Class Teacher"
                  onChange={e => setForm({ ...form, class_teacher_id: e.target.value })}>
                  <MenuItem value="">— None —</MenuItem>
                  {teachingStaff.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.full_name} {s.designation ? `(${s.designation})` : ''} {s.department ? `- ${s.department}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="secondary" gutterBottom fontWeight="bold">
                <SupervisorAccount sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Co-Class Teacher (Co-CT)
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Select Co-Class Teacher</InputLabel>
                <Select value={form.co_class_teacher_id} label="Select Co-Class Teacher"
                  onChange={e => setForm({ ...form, co_class_teacher_id: e.target.value })}>
                  <MenuItem value="">— None —</MenuItem>
                  {teachingStaff.filter(s => s.id !== form.class_teacher_id).map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.full_name} {s.designation ? `(${s.designation})` : ''} {s.department ? `- ${s.department}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveAssignment}
            sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)' }}>
            Save Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Responsibilities Dialog */}
      <Dialog open={!!showResp} onClose={() => setShowResp(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: showResp === 'ct'
            ? 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)'
            : 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
          color: 'white'
        }}>
          {showResp === 'ct' ? 'Class Teacher Responsibilities' : 'Co-Class Teacher Responsibilities'}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {responsibilities && (showResp === 'ct' ? responsibilities.class_teacher : responsibilities.co_class_teacher)?.map((r, i) => (
            <Accordion key={r.key} defaultExpanded={i === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color={showResp === 'ct' ? 'primary' : 'secondary'} fontSize="small" />
                  <Typography fontWeight="bold">{r.label}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">{r.description}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResp(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// SETTINGS TAB (Exam Types)
// ============================================================
function SettingsTab({ examTypes, setExamTypes, showSnack }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', weightage: 100 });
  const [editing, setEditing] = useState(null);

  const reload = () => academicsAPI.listExamTypes().then(r => setExamTypes(r.data.data || [])).catch(() => {});

  const save = () => {
    const fn = editing ? academicsAPI.updateExamType(editing.id, form) : academicsAPI.createExamType(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const del = (id) => {
    if (!window.confirm('Delete?')) return;
    academicsAPI.deleteExamType(id).then(() => { showSnack('Deleted'); reload(); }).catch(() => showSnack('Failed', 'error'));
  };

  const edit = (et) => {
    setEditing(et);
    setForm({ name: et.name, code: et.code || '', description: et.description || '', weightage: et.weightage || 100 });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>Exam Types Configuration</Typography>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ name: '', code: '', description: '', weightage: 100 }); setOpenDialog(true); }}>Add Exam Type</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Description</TableCell><TableCell>Weightage</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {examTypes.map(et => (
              <TableRow key={et.id}>
                <TableCell><Chip label={et.code || '-'} size="small" /></TableCell>
                <TableCell><strong>{et.name}</strong></TableCell>
                <TableCell>{et.description || '-'}</TableCell>
                <TableCell>{et.weightage}%</TableCell>
                <TableCell>{et.is_active ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => edit(et)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => del(et.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!examTypes.length && <TableRow><TableCell colSpan={6} align="center">No exam types. Add some to get started.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Exam Type' : 'Add Exam Type'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Unit Test 1" /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="UT1" /></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Weightage %" value={form.weightage} onChange={e => setForm({ ...form, weightage: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
