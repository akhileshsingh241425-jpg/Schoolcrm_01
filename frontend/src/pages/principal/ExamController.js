import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Paper, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, alpha, useTheme, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, Checkbox, FormControlLabel, Stepper, Step, StepLabel,
  Avatar
} from '@mui/material';
import {
  Add, Close, Refresh, CheckCircle, EventNote, CalendarMonth,
  Description, ArrowForward, School, Schedule, EmojiEvents, Print, Edit, Delete
} from '@mui/icons-material';
import { validateForm } from '../../components/Validation';
import { academicsAPI, studentsAPI, staffAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

// Wikipedia/Sarkari style — global table styles
const wikiTableSx = {
  '& table': { borderCollapse: 'collapse', width: '100%' },
  '& th, & td': { border: '1px solid #a2a9b1', padding: '8px 12px', fontSize: '0.9rem', verticalAlign: 'top' },
  '& th': { bgcolor: '#f8f9fa', fontWeight: 700, textAlign: 'left' },
  '& tr:hover td': { bgcolor: '#f8f9fa' },
};
const wikiPaper = { borderRadius: 0, border: '1px solid #a2a9b1', boxShadow: 'none', mb: 2 };
const wikiBtn = { borderRadius: 0, textTransform: 'none', fontWeight: 600, boxShadow: 'none' };

// ─── Print Helper ───
const handlePrint = (title, contentId) => {
  const content = document.getElementById(contentId);
  if (!content) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { font-size: 18px; text-align: center; margin-bottom: 5px; }
      h2 { font-size: 14px; text-align: center; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #333; padding: 6px 10px; font-size: 12px; text-align: left; }
      th { background: #f0f0f0; font-weight: bold; }
      .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
      .school-name { font-size: 20px; font-weight: bold; }
      .exam-name { font-size: 16px; color: #333; }
      @media print { body { padding: 0; } }
    </style></head><body>
    ${content.innerHTML}
    </body></html>
  `);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
};

export default function ExamController() {
  const theme = useTheme();
  const P = theme.palette.primary.main;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examTypes, setExamTypes] = useState([]);
  const [classes, setClasses] = useState([]);

  // Today's date in local format (YYYY-MM-DD) — allows today, blocks past
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // View state: 'list' | 'datesheet' | 'papers'
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setViewState] = useState(searchParams.get('view') || 'list');
  const setView = (v) => { setViewState(v); setSearchParams(v && v !== 'list' ? { view: v } : {}); };

  useEffect(() => {
    const v = searchParams.get('view');
    if (v && v !== view) setViewState(v);
  }, [searchParams]);
  const [selectedExam, setSelectedExam] = useState(null);

  // Create exam
  const [createOpen, setCreateOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    name: '', start_date: '', end_date: '', description: '',
    exam_type_id: '', selectedClasses: []
  });
  const [creating, setCreating] = useState(false);

  // Date sheet
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedForm, setSchedForm] = useState({
    class_id: '', section_id: '', subject_id: '',
    exam_date: '', start_time: '09:00', end_time: '12:00',
    max_marks: 100, passing_marks: 33
  });
  const [addingSched, setAddingSched] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [dateSheetStatus, setDateSheetStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);

  // Question papers
  const [papers, setPapers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSubject, setAssignSubject] = useState(null);
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [paperAssignments, setPaperAssignments] = useState({});

  // Exam Duty (Invigilation)
  const [dutyAssignments, setDutyAssignments] = useState({}); // key: schedule_id -> { chief: teacherId, assistant: teacherId }
  const [dutyOpen, setDutyOpen] = useState(false);
  const [dutySchedule, setDutySchedule] = useState(null);
  const [dutyRole, setDutyRole] = useState('chief'); // 'chief' or 'assistant'
  const [dutyTeacherId, setDutyTeacherId] = useState('');
  const [dutyHallId, setDutyHallId] = useState('');
  const [halls, setHalls] = useState([]);

  // ─── Load ───
  const loadAll = () => {
    setLoading(true);
    Promise.all([
      academicsAPI.listExams({}).catch(() => ({ data: { data: [] } })),
      academicsAPI.listExamTypes().catch(() => ({ data: { data: [] } })),
      studentsAPI.listClasses().catch(() => ({ data: { data: [] } })),
      academicsAPI.listSubjects({}).catch(() => ({ data: { data: [] } })),
      staffAPI.list({ role: 'teacher', limit: 200 }).catch(() => ({ data: { data: [] } })),
      academicsAPI.listExamHalls().catch(() => ({ data: { data: [] } })),
    ]).then(([exRes, etRes, clRes, subRes, staffRes, hallRes]) => {
      const ed = exRes.data?.data;
      setExams(Array.isArray(ed) ? ed : ed?.items || []);
      setExamTypes(Array.isArray(etRes.data?.data) ? etRes.data.data : []);
      const cl = clRes.data?.data;
      setClasses(Array.isArray(cl) ? cl : cl?.items || []);
      const su = subRes.data?.data;
      setSubjects((Array.isArray(su) ? su : su?.items || []).filter(s => s.is_active !== false));
      const st = staffRes.data?.data;
      setTeachers(Array.isArray(st) ? st : st?.items || []);
      const h = hallRes.data?.data;
      setHalls(Array.isArray(h) ? h : h?.items || []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  // Open exam detail
  const openExam = (exam) => {
    setSelectedExam(exam);
    setView('datesheet');
    // Load schedules
    academicsAPI.listSchedules(exam.id)
      .then(res => setSchedules(res.data?.data || []))
      .catch(() => setSchedules([]));
    // Load date sheet status
    examMgmtAPI.getDateSheet(exam.id)
      .then(res => setDateSheetStatus(res.data?.data?.status || 'draft'))
      .catch(() => setDateSheetStatus('draft'));
    // Load papers
    examMgmtAPI.listQuestionPapers(exam.id)
      .then(res => setPapers(res.data?.data || []))
      .catch(() => setPapers([]));
  };

  // ─── Create Exam ───
  const handleCreate = async () => {
    const errs = validateForm(examForm, { name: ['required'], start_date: ['required'], end_date: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    setCreating(true);
    try {
      const res = await academicsAPI.createExam({
        name: examForm.name, start_date: examForm.start_date,
        end_date: examForm.end_date, description: examForm.description,
        exam_type_id: examForm.exam_type_id || null,
        class_ids: examForm.selectedClasses,
      });
      toast.success('Exam created! Ab Date Sheet banao.');
      const newExam = res.data?.data;
      setCreateOpen(false);
      setExamForm({ name: '', start_date: '', end_date: '', description: '', exam_type_id: '', selectedClasses: [] });
      loadAll();
      if (newExam) openExam(newExam);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  // ─── Add Schedule ───
  const handleAddSchedule = async () => {
    const errs = validateForm(schedForm, { class_id: ['required'], subject_id: ['required'], exam_date: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    // Validate date is within exam range
    if (selectedExam?.start_date && schedForm.exam_date < selectedExam.start_date) {
      toast.error(`Date cannot be before exam start date (${selectedExam.start_date})`); return;
    }
    if (selectedExam?.end_date && schedForm.exam_date > selectedExam.end_date) {
      toast.error(`Date cannot be after exam end date (${selectedExam.end_date})`); return;
    }
    setAddingSched(true);
    try {
      await academicsAPI.addExamSchedule(selectedExam.id, {
        class_id: parseInt(schedForm.class_id),
        section_id: schedForm.section_id ? parseInt(schedForm.section_id) : null,
        subject_id: parseInt(schedForm.subject_id),
        exam_date: schedForm.exam_date,
        start_time: schedForm.start_time, end_time: schedForm.end_time,
        max_marks: parseInt(schedForm.max_marks) || 100,
        passing_marks: parseInt(schedForm.passing_marks) || 33,
      });
      toast.success('Added!');
      setSchedForm({ ...schedForm, subject_id: '', exam_date: '' });
      // Reset class filter to show all schedules including newly added
      setSelectedClass('');
      academicsAPI.listSchedules(selectedExam.id)
        .then(res => setSchedules(res.data?.data || []));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAddingSched(false); }
  };

  // ─── Edit Schedule ───
  const handleEditSchedule = (schedule) => {
    setSchedForm({
      class_id: String(schedule.class_id || ''),
      section_id: String(schedule.section_id || ''),
      subject_id: String(schedule.subject_id || schedule.subject?.id || ''),
      exam_date: schedule.exam_date || '',
      start_time: schedule.start_time?.slice(0, 5) || '09:00',
      end_time: schedule.end_time?.slice(0, 5) || '12:00',
      max_marks: schedule.max_marks || 100,
      passing_marks: schedule.passing_marks || 33,
    });
    setEditingScheduleId(schedule.id);
    setSchedOpen(true);
  };

  // ─── Update Schedule ───
  const handleUpdateSchedule = async () => {
    if (!editingScheduleId) return;
    setAddingSched(true);
    try {
      await academicsAPI.updateSchedule(editingScheduleId, {
        class_id: parseInt(schedForm.class_id),
        section_id: schedForm.section_id ? parseInt(schedForm.section_id) : null,
        subject_id: parseInt(schedForm.subject_id),
        exam_date: schedForm.exam_date,
        start_time: schedForm.start_time,
        end_time: schedForm.end_time,
        max_marks: parseInt(schedForm.max_marks) || 100,
        passing_marks: parseInt(schedForm.passing_marks) || 33,
      });
      toast.success('Schedule updated! Date sheet needs re-approval.');
      setSchedOpen(false);
      setEditingScheduleId(null);
      // Reset status to draft after edit (needs re-approval)
      if (dateSheetStatus === 'approved' || dateSheetStatus === 'pending_approval') {
        setDateSheetStatus('draft');
      }
      academicsAPI.listSchedules(selectedExam.id)
        .then(res => setSchedules(res.data?.data || []));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setAddingSched(false); }
  };

  // ─── Delete Schedule ───
  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule entry?')) return;
    try {
      await academicsAPI.deleteSchedule(scheduleId);
      toast.success('Deleted');
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  // ─── Submit for approval + send request to teachers ───
  const handleSubmitDateSheet = async () => {
    if (schedules.length === 0) { toast.error('Pehle subjects add karo'); return; }
    setSubmitting(true);
    try {
      await examMgmtAPI.submitDateSheet(selectedExam.id);
      toast.success('Date Sheet submitted! Teachers ko question paper request bheji gayi.');
      setDateSheetStatus('pending_approval');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  // ─── Approve paper ───
  const handleApprovePaper = async (paperId, status) => {
    try {
      await examMgmtAPI.approveQuestionPaper(paperId, { status });
      toast.success(status === 'collected' ? 'Paper collected!' : status === 'final_approved' ? 'Paper finalized!' : 'Paper approved!');
      examMgmtAPI.listQuestionPapers(selectedExam.id)
        .then(res => setPapers(res.data?.data || []));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ─── Assign teacher for paper ───
  const handleAssignTeacher = () => {
    if (!assignTeacherId || !assignSubject) {
      toast.error('Select a teacher'); return;
    }
    const key = `${assignSubject.subject_id}_${assignSubject.class_id}`;
    const current = paperAssignments[key] || [];
    if (current.includes(parseInt(assignTeacherId))) {
      toast.error('Teacher already assigned'); return;
    }
    setPaperAssignments({ ...paperAssignments, [key]: [...current, parseInt(assignTeacherId)] });
    const teacher = teachers.find(t => t.id === parseInt(assignTeacherId));
    toast.success(`${teacher?.first_name || 'Teacher'} assigned for ${assignSubject.subject_name} (${assignSubject.class_name})`);
    setAssignOpen(false);
    setAssignTeacherId('');
  };

  // ─── Assign exam duty (multiple teachers per room) ───
  const handleAssignDuty = () => {
    if (!dutyTeacherId || !dutySchedule) {
      toast.error('Select a teacher'); return;
    }
    if (!dutyHallId) {
      toast.error('Select a room/hall'); return;
    }
    const key = dutySchedule.id;
    const current = dutyAssignments[key] || { hall_id: null, teachers: [] };
    const teacherId = parseInt(dutyTeacherId);
    
    // Check duplicate
    if (current.teachers?.includes(teacherId)) {
      toast.error('Teacher already assigned to this room'); return;
    }
    
    const updated = {
      hall_id: parseInt(dutyHallId),
      teachers: [...(current.teachers || []), teacherId]
    };
    setDutyAssignments({ ...dutyAssignments, [key]: updated });
    const teacher = teachers.find(t => t.id === teacherId);
    const hall = halls.find(h => h.id === parseInt(dutyHallId));
    toast.success(`${teacher?.first_name || 'Teacher'} assigned to ${hall?.name || 'Room'}`);
    setDutyOpen(false);
    setDutyTeacherId('');
  };

  // ─── Computed ───
  const upcoming = exams.filter(e => e.status === 'upcoming').length;
  const ongoing = exams.filter(e => e.status === 'ongoing').length;
  const published = exams.filter(e => e.status === 'results_published').length;

  // ─── Class-wise grouping (must be before any return) ───
  const [selectedClass, setSelectedClass] = useState('');
  const classWiseSchedules = useMemo(() => {
    const map = {};
    schedules.forEach(s => {
      const key = s.class_name || s.class_id || 'Unknown';
      if (!map[key]) map[key] = { class_name: key, class_id: s.class_id, items: [] };
      map[key].items.push(s);
    });
    return Object.values(map);
  }, [schedules]);

  const filteredSchedules = selectedClass
    ? schedules.filter(s => String(s.class_id) === String(selectedClass))
    : schedules;

  if (loading) return <Box sx={{ p: 4 }}><LinearProgress sx={{ borderRadius: 2 }} /></Box>;

  // ═══════════════════════════════════════════════════════════
  // VIEW: EXAM LIST (Main Dashboard)
  // ═══════════════════════════════════════════════════════════
  if (view === 'list') return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Exam Management</Typography>
          <Typography variant="body2" color="text.secondary">Create exams, manage date sheets, collect question papers</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3 }}>
          + Create New Exam
        </Button>
      </Box>

      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Exams', value: exams.length, color: P, icon: <EventNote /> },
          { label: 'Upcoming', value: upcoming, color: '#f59e0b', icon: <Schedule /> },
          { label: 'Ongoing', value: ongoing, color: '#3b82f6', icon: <School /> },
          { label: 'Published', value: published, color: '#10b981', icon: <EmojiEvents /> },
        ].map((k, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Card sx={{ borderRadius: 3, border: `1px solid ${alpha(k.color, 0.2)}` }}>
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, '&:last-child': { pb: 2 } }}>
                <Avatar sx={{ bgcolor: alpha(k.color, 0.12), color: k.color, width: 40, height: 40 }}>{k.icon}</Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} color={k.color}>{k.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{k.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pending Date Sheet Alerts */}
      {exams.filter(e => e.status === 'upcoming').length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: alpha('#f59e0b', 0.3), bgcolor: alpha('#f59e0b', 0.03) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.15), color: '#f59e0b', width: 28, height: 28 }}>
              <CalendarMonth sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography variant="subtitle2" fontWeight={700} color="#b45309">
              Notifications — Date Sheet Pending
            </Typography>
          </Box>
          {exams.filter(e => e.status === 'upcoming').map(exam => (
            <Box key={exam.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, px: 1, mb: 0.5, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: 'divider' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>{exam.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  📅 {exam.start_date} → {exam.end_date} &nbsp;|&nbsp; 
                  📝 {exam.schedule_count || 0} subjects added
                </Typography>
              </Box>
              <Button size="small" variant="contained" color="warning" onClick={() => openExam(exam)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {exam.schedule_count > 0 ? 'Manage →' : '+ Create Date Sheet'}
              </Button>
            </Box>
          ))}
        </Paper>
      )}

      {/* Exam List */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>All Exams</Typography>
        </Box>
        {exams.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <EventNote sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No exams yet. Click "Create New Exam" to start.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(P, 0.03) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Exam Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subjects</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exams.map(exam => {
                  const colors = { upcoming: '#f59e0b', ongoing: '#3b82f6', completed: '#10b981', results_published: '#8b5cf6' };
                  return (
                    <TableRow key={exam.id} hover>
                      <TableCell><Typography fontWeight={600}>{exam.name}</Typography></TableCell>
                      <TableCell>{exam.exam_type?.name || '-'}</TableCell>
                      <TableCell>{exam.start_date}</TableCell>
                      <TableCell>{exam.end_date}</TableCell>
                      <TableCell><Chip label={exam.schedule_count || 0} size="small" /></TableCell>
                      <TableCell>
                        <Chip label={exam.status?.replace('_',' ')} size="small"
                          sx={{ fontWeight: 600, bgcolor: alpha(colors[exam.status] || '#94a3b8', 0.12), color: colors[exam.status] || '#94a3b8', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="contained" onClick={() => openExam(exam)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                          Manage →
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Exam Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Create New Exam</Typography>
            <IconButton onClick={() => setCreateOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Exam Name *" placeholder="e.g. Mid Term Examination 2026"
                value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth select label="Exam Type" value={examForm.exam_type_id}
                onChange={e => setExamForm({ ...examForm, exam_type_id: e.target.value })}>
                <MenuItem value="">Select</MenuItem>
                {examTypes.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="date" label="Start Date *" InputLabelProps={{ shrink: true }}
                value={examForm.start_date} onChange={e => setExamForm({ ...examForm, start_date: e.target.value })}
                inputProps={{ min: todayStr }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="date" label="End Date *" InputLabelProps={{ shrink: true }}
                value={examForm.end_date} onChange={e => setExamForm({ ...examForm, end_date: e.target.value })}
                inputProps={{ min: examForm.start_date || todayStr }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={examForm.description}
                onChange={e => setExamForm({ ...examForm, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Participating Classes * (select which classes will appear in this exam)
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxHeight: 200, overflow: 'auto' }}>
                <Grid container spacing={0}>
                  {classes.map(cls => (
                    <Grid item xs={4} sm={3} key={cls.id}>
                      <FormControlLabel
                        control={
                          <Checkbox size="small" checked={examForm.selectedClasses.includes(cls.id)}
                            onChange={e => {
                              const sc = examForm.selectedClasses;
                              setExamForm({
                                ...examForm,
                                selectedClasses: e.target.checked ? [...sc, cls.id] : sc.filter(id => id !== cls.id)
                              });
                            }} />
                        }
                        label={<Typography variant="body2">{cls.name}</Typography>}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
              {examForm.selectedClasses.length > 0 && (
                <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                  {examForm.selectedClasses.length} class(es) selected
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            {creating ? 'Creating...' : 'Create Exam →'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════
  // VIEW: DATE SHEET (CLASS-WISE)
  // ═══════════════════════════════════════════════════════════
  if (view === 'datesheet') return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Button size="small" onClick={() => { setView('list'); setSelectedClass(''); }} sx={{ textTransform: 'none', mb: 0.5 }}>
            ← Back to Exams
          </Button>
          <Typography variant="h5" fontWeight={800}>{selectedExam.name} — Date Sheet</Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            {selectedExam.start_date} → {selectedExam.end_date} • 
            Status: <Chip label={dateSheetStatus.replace('_',' ')} size="small" sx={{ ml: 0.5, fontWeight: 600, textTransform: 'capitalize',
              bgcolor: alpha(dateSheetStatus === 'approved' ? '#10b981' : dateSheetStatus === 'pending_approval' ? '#f59e0b' : dateSheetStatus === 'rejected' ? '#ef4444' : '#94a3b8', 0.12),
              color: dateSheetStatus === 'approved' ? '#10b981' : dateSheetStatus === 'pending_approval' ? '#f59e0b' : dateSheetStatus === 'rejected' ? '#ef4444' : '#94a3b8'
            }} />
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {(dateSheetStatus === 'draft' || dateSheetStatus === 'rejected') && (
            <>
              <Button variant="contained" startIcon={<Add />} onClick={() => setSchedOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                + Add Subject
              </Button>
              {schedules.length > 0 && (
                <Button variant="contained" color="warning" onClick={handleSubmitDateSheet}
                  disabled={submitting}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                  {submitting ? 'Submitting...' : 'Submit & Send Paper Request →'}
                </Button>
              )}
            </>
          )}
          {dateSheetStatus === 'pending_approval' && (
            <Chip label="⏳ Principal Approval Pending" color="warning" sx={{ fontWeight: 600 }} />
          )}
          {dateSheetStatus === 'approved' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="success" onClick={() => setView('papers')}
                endIcon={<ArrowForward />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Question Papers
              </Button>
              <Button variant="outlined" onClick={() => setView('duty')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Exam Duty
              </Button>
            </Box>
          )}
          {schedules.length > 0 && (
            <Button variant="outlined" startIcon={<Print />}
              onClick={() => handlePrint('Date Sheet - ' + selectedExam.name, 'printable-datesheet')}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              Print
            </Button>
          )}
        </Box>
      </Box>

      {/* Rejection alert */}
      {dateSheetStatus === 'rejected' && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          Principal ne reject kiya. Edit karke dobara submit karo.
        </Alert>
      )}

      {/* Class-wise Tabs */}
      {schedules.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, borderRadius: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 1 }}>CLASS:</Typography>
          <Chip label="All" size="small" onClick={() => setSelectedClass('')}
            sx={{ fontWeight: 600, cursor: 'pointer',
              bgcolor: !selectedClass ? P : 'transparent', color: !selectedClass ? '#fff' : 'text.primary',
              border: !selectedClass ? 'none' : '1px solid', borderColor: 'divider' }} />
          {classWiseSchedules.map(cg => (
            <Chip key={cg.class_id} label={`${cg.class_name} (${cg.items.length})`} size="small"
              onClick={() => setSelectedClass(cg.class_id)}
              sx={{ fontWeight: 600, cursor: 'pointer',
                bgcolor: String(selectedClass) === String(cg.class_id) ? P : 'transparent',
                color: String(selectedClass) === String(cg.class_id) ? '#fff' : 'text.primary',
                border: String(selectedClass) === String(cg.class_id) ? 'none' : '1px solid', borderColor: 'divider' }} />
          ))}
        </Paper>
      )}

      {/* Date Sheet Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>

        {/* Hidden printable content */}
        <Box id="printable-datesheet" sx={{ display: 'none' }}>
          <div className="header">
            <div className="school-name">Dream International School</div>
            <div className="exam-name">{selectedExam?.name} — Date Sheet</div>
            <div>{selectedExam?.start_date} to {selectedExam?.end_date}</div>
          </div>
          <table>
            <thead><tr><th>#</th><th>Date</th><th>Subject</th><th>Class</th><th>Time</th><th>Max Marks</th><th>Pass Marks</th></tr></thead>
            <tbody>
              {filteredSchedules.map((s, i) => (
                <tr key={s.id}>
                  <td>{i+1}</td>
                  <td>{s.exam_date}</td>
                  <td>{s.subject?.name || s.subject_name || '-'}</td>
                  <td>{s.class_name || '-'}{s.section_name ? ` - ${s.section_name}` : ''}</td>
                  <td>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</td>
                  <td>{s.max_marks}</td>
                  <td>{s.passing_marks || 33}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {selectedClass ? `${classWiseSchedules.find(c => String(c.class_id) === String(selectedClass))?.class_name || ''} — ` : ''}
            Date Sheet ({filteredSchedules.length} subjects)
          </Typography>
          <IconButton size="small" onClick={() => openExam(selectedExam)}><Refresh /></IconButton>
        </Box>
        {filteredSchedules.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">
              {schedules.length === 0 ? 'Date Sheet Empty' : 'No subjects for this class'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              "Add Subject" click karo — class select karo, subject, date, time, marks fill karo.
            </Typography>
            {schedules.length === 0 && (
              <Button variant="outlined" startIcon={<Add />} onClick={() => setSchedOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none' }}>Add First Subject</Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(P, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                  {!selectedClass && <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Max Marks</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pass Marks</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchedules.map((s, i) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ color: 'text.secondary' }}>{i+1}</TableCell>
                    <TableCell>
                      <Chip label={s.exam_date} size="small" icon={<CalendarMonth sx={{ fontSize: 14 }} />}
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{s.subject?.name || s.subject_name || '-'}</Typography>
                    </TableCell>
                    {!selectedClass && <TableCell>{s.class_name || '-'}{s.section_name ? ` - ${s.section_name}` : ''}</TableCell>}
                    <TableCell>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.max_marks}</TableCell>
                    <TableCell>{s.passing_marks || 33}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditSchedule(s)} sx={{ color: '#1976d2' }}>
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteSchedule(s.id)} sx={{ color: '#dc3545' }}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={schedOpen} onClose={() => { setSchedOpen(false); setEditingScheduleId(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{editingScheduleId ? 'Edit Schedule' : 'Add Subject to Date Sheet'}</Typography>
              <Typography variant="caption" color="text.secondary">{selectedExam?.name}{editingScheduleId ? ' — Editing will require re-approval' : ''}</Typography>
            </Box>
            <IconButton onClick={() => setSchedOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth select label="Class *" value={schedForm.class_id}
                onChange={e => {
                  setSchedForm({ ...schedForm, class_id: e.target.value, section_id: '' });
                  studentsAPI.listSections(e.target.value).then(r => {
                    const d = r.data?.data;
                    setSections(Array.isArray(d) ? d : d?.items || []);
                  }).catch(() => setSections([]));
                }}>
                {(selectedExam?.class_ids?.length > 0
                  ? classes.filter(c => selectedExam.class_ids.includes(c.id))
                  : classes
                ).map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Section" value={schedForm.section_id}
                onChange={e => setSchedForm({ ...schedForm, section_id: e.target.value })}>
                <MenuItem value="">All Sections</MenuItem>
                {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Subject *" value={schedForm.subject_id}
                onChange={e => setSchedForm({ ...schedForm, subject_id: e.target.value })}>
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="date" label="Exam Date *" InputLabelProps={{ shrink: true }}
                value={schedForm.exam_date} onChange={e => setSchedForm({ ...schedForm, exam_date: e.target.value })}
                inputProps={{ min: selectedExam?.start_date || todayStr, max: selectedExam?.end_date }}
                helperText={selectedExam ? `Allowed: ${selectedExam.start_date} to ${selectedExam.end_date}` : ''} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="time" label="Start Time" InputLabelProps={{ shrink: true }}
                value={schedForm.start_time} onChange={e => setSchedForm({ ...schedForm, start_time: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="time" label="End Time" InputLabelProps={{ shrink: true }}
                value={schedForm.end_time} onChange={e => setSchedForm({ ...schedForm, end_time: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Max Marks" value={schedForm.max_marks}
                onChange={e => setSchedForm({ ...schedForm, max_marks: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Passing Marks" value={schedForm.passing_marks}
                onChange={e => setSchedForm({ ...schedForm, passing_marks: e.target.value })} />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Ek ek subject add karo. Dialog open rahega — multiple subjects add kar sakte ho.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSchedOpen(false); setEditingScheduleId(null); }} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={editingScheduleId ? handleUpdateSchedule : handleAddSchedule} disabled={addingSched}
            startIcon={editingScheduleId ? <Edit /> : <Add />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            {addingSched ? 'Saving...' : editingScheduleId ? 'Update Schedule' : 'Add Subject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════
  // VIEW: QUESTION PAPERS — Class-wise, Table, Assign Teachers
  // ═══════════════════════════════════════════════════════════
  if (view === 'papers') {
    // Group schedules by class
    const classGroups = {};
    schedules.forEach(s => {
      const cName = s.class_name || `Class ${s.class_id}`;
      if (!classGroups[s.class_id]) classGroups[s.class_id] = { class_id: s.class_id, class_name: cName, subjects: [] };
      classGroups[s.class_id].subjects.push(s);
    });
    const classArr = Object.values(classGroups);

    // Map papers to subjects
    const getPapersFor = (subjectId, classId) => papers.filter(p => p.subject_id === subjectId && p.class_id === classId);
    const getFinal = (subjectId, classId) => papers.find(p => p.subject_id === subjectId && p.class_id === classId && p.status === 'final_approved');

    const totalSubjects = schedules.length;
    const finalizedCount = schedules.filter(s => getFinal(s.subject_id, s.class_id)).length;
    const pendingCount = totalSubjects - finalizedCount;

    // Selected class filter
    const paperClassFilter = selectedClass;
    const setPaperClassFilter = setSelectedClass;
    const filteredClasses = paperClassFilter ? classArr.filter(c => String(c.class_id) === String(paperClassFilter)) : classArr;

    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Button size="small" onClick={() => setView('datesheet')} sx={{ textTransform: 'none', mb: 0.5, fontSize: '0.9rem' }}>
              ← Back to Date Sheet
            </Button>
            <Typography variant="h4" fontWeight={800}>Question Papers</Typography>
            <Typography variant="body1" color="text.secondary">{selectedExam.name}</Typography>
          </Box>
          <IconButton onClick={() => {
            examMgmtAPI.listQuestionPapers(selectedExam.id).then(res => setPapers(res.data?.data || []));
          }}><Refresh /></IconButton>
        </Box>

        {/* Status Summary - Wiki Style */}
        <Paper sx={wikiPaper}>
          <Table size="small" sx={{ '& th, & td': { border: '1px solid #a2a9b1', py: 1.5, px: 2, fontSize: '0.95rem' } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total Subjects</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Finalized</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pending</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalSubjects}</TableCell>
                <TableCell sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#006400' }}>{finalizedCount}</TableCell>
                <TableCell sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#8b0000' }}>{pendingCount}</TableCell>
                <TableCell sx={{ fontWeight: 700, color: pendingCount === 0 ? '#006400' : '#8b0000' }}>
                  {pendingCount === 0 ? '✓ All papers finalized' : `⚠ ${pendingCount} papers pending`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        {/* Class Filter - Wiki Style */}
        <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={700} sx={{ mr: 1 }}>Class:</Typography>
          <Button size="small" variant={!paperClassFilter ? 'contained' : 'text'}
            onClick={() => setPaperClassFilter('')}
            sx={{ ...wikiBtn, bgcolor: !paperClassFilter ? '#36c' : 'transparent', color: !paperClassFilter ? '#fff' : '#36c', '&:hover': { bgcolor: !paperClassFilter ? '#2a4b8d' : '#f8f9fa' } }}>
            All
          </Button>
          {classArr.map(cg => (
            <Button key={cg.class_id} size="small"
              variant={String(paperClassFilter) === String(cg.class_id) ? 'contained' : 'text'}
              onClick={() => setPaperClassFilter(cg.class_id)}
              sx={{ ...wikiBtn, bgcolor: String(paperClassFilter) === String(cg.class_id) ? '#36c' : 'transparent',
                color: String(paperClassFilter) === String(cg.class_id) ? '#fff' : '#36c',
                '&:hover': { bgcolor: String(paperClassFilter) === String(cg.class_id) ? '#2a4b8d' : '#f8f9fa' } }}>
              {cg.class_name}
            </Button>
          ))}
        </Box>

        {/* Class-wise Tables */}
        {filteredClasses.map(cg => (
          <Paper key={cg.class_id} sx={{ ...wikiPaper, mb: 3 }}>
            <Box sx={{ px: 2, py: 1, bgcolor: '#f8f9fa', borderBottom: '1px solid #a2a9b1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" fontWeight={700}>{cg.class_name}</Typography>
              <Typography variant="body2" color="text.secondary">{cg.subjects.length} subjects</Typography>
            </Box>
            <TableContainer>
              <Table size="medium" sx={{ '& th, & td': { border: '1px solid #a2a9b1', py: 1, px: 1.5, fontSize: '0.9rem' } }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                    <TableCell sx={{ fontWeight: 700, width: '20%' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '18%' }}>Teacher</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '8%', textAlign: 'center' }}>Set</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '14%', textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '10%', textAlign: 'center' }}>View</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '30%' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cg.subjects.map(s => {
                    const subPapers = getPapersFor(s.subject_id, s.class_id);
                    const final = getFinal(s.subject_id, s.class_id);
                    
                    if (subPapers.length > 0) {
                      return subPapers.map((p, pi) => (
                        <TableRow key={`${s.subject_id}_${p.id}`}
                          sx={{ bgcolor: p.status === 'final_approved' ? '#f0fff0' : undefined }}>
                          {pi === 0 && (
                            <TableCell rowSpan={subPapers.length} sx={{ fontWeight: 600, verticalAlign: 'top' }}>
                              {s.subject?.name || s.subject_name || '-'}
                            </TableCell>
                          )}
                          <TableCell>{p.uploaded_by_name || 'Teacher'}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600 }}>{p.set_name || 'A'}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 600,
                            color: p.status === 'submitted' ? '#b7791f' :
                              p.status === 'hod_approved' ? '#2b6cb0' :
                              p.status === 'final_approved' ? '#276749' :
                              p.status === 'rejected' ? '#9b2c2c' : '#000' }}>
                            {p.status === 'submitted' ? 'Uploaded' :
                             p.status === 'hod_approved' ? 'Approved' :
                             p.status === 'final_approved' ? '★ Final' :
                             p.status === 'rejected' ? 'Rejected' : p.status}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Typography component="a" href="#" onClick={(e) => { e.preventDefault(); window.open(`http://localhost:5000${p.file_path}`, '_blank'); }}
                              sx={{ color: '#36c', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem' }}>
                              View PDF
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {p.status === 'submitted' && (
                              <Button size="small" variant="contained"
                                onClick={() => handleApprovePaper(p.id, 'hod_approved')}
                                sx={{ ...wikiBtn, bgcolor: '#36c', '&:hover': { bgcolor: '#2a4b8d' } }}>
                                Approve
                              </Button>
                            )}
                            {p.status === 'hod_approved' && !final && (
                              <Button size="small" variant="contained"
                                onClick={() => handleApprovePaper(p.id, 'final_approved')}
                                sx={{ ...wikiBtn, bgcolor: '#006400', '&:hover': { bgcolor: '#004d00' } }}>
                                ★ Final Select
                              </Button>
                            )}
                            {p.status === 'final_approved' && (
                              <Typography fontWeight={700} color="#006400">✓ Selected</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    }
                    
                    return (
                      <TableRow key={`${s.subject_id}_${s.class_id}`} sx={{ bgcolor: '#fff8f0' }}>
                        <TableCell sx={{ fontWeight: 600 }}>{s.subject?.name || s.subject_name || '-'}</TableCell>
                        <TableCell>
                          {(() => {
                            const key = `${s.subject_id}_${s.class_id}`;
                            const assignedIds = paperAssignments[key] || [];
                            if (assignedIds.length === 0) return <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>No teacher assigned</Typography>;
                            return assignedIds.map(tid => {
                              const t = teachers.find(tc => tc.id === tid);
                              return <Chip key={tid} label={t ? `${t.first_name} ${t.last_name || ''}`.trim() : `Teacher #${tid}`} size="small" sx={{ mr: 0.5, mb: 0.3, fontWeight: 500 }} />;
                            });
                          })()}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No paper uploaded</TableCell>
                        <TableCell sx={{ textAlign: 'center', fontWeight: 600, color: '#9b2c2c' }}>Pending</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>—</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined"
                            onClick={() => { setAssignSubject({ subject_id: s.subject_id, class_id: s.class_id, subject_name: s.subject?.name || s.subject_name, class_name: cg.class_name }); setAssignOpen(true); }}
                            sx={{ ...wikiBtn, borderColor: '#36c', color: '#36c' }}>
                            + Assign Teacher
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
        {/* Assign Teacher Dialog */}
        <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Assign Teacher</Typography>
                <Typography variant="caption" color="text.secondary">
                  {assignSubject?.subject_name} — {assignSubject?.class_name}
                </Typography>
              </Box>
              <IconButton onClick={() => setAssignOpen(false)}><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField fullWidth select label="Select Teacher" value={assignTeacherId}
              onChange={e => setAssignTeacherId(e.target.value)} sx={{ mt: 1 }}>
              {(() => {
                const key = assignSubject ? `${assignSubject.subject_id}_${assignSubject.class_id}` : '';
                const alreadyAssigned = paperAssignments[key] || [];
                return teachers.map(t => (
                  <MenuItem key={t.id} value={t.id} disabled={alreadyAssigned.includes(t.id)}>
                    {t.first_name} {t.last_name || ''} {t.designation ? `(${t.designation})` : ''}
                    {alreadyAssigned.includes(t.id) ? ' — Already Assigned' : ''}
                  </MenuItem>
                ));
              })()}
            </TextField>
            {(() => {
              const key = assignSubject ? `${assignSubject.subject_id}_${assignSubject.class_id}` : '';
              const assignedIds = paperAssignments[key] || [];
              if (assignedIds.length === 0) return null;
              return (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Already Assigned:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {assignedIds.map(tid => {
                      const t = teachers.find(tc => tc.id === tid);
                      return <Chip key={tid} label={t ? `${t.first_name} ${t.last_name || ''}`.trim() : `#${tid}`} size="small" color="primary" variant="outlined" />;
                    })}
                  </Box>
                </Box>
              );
            })()}
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Same teacher cannot be assigned twice for the same subject & class.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setAssignOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignTeacher} disabled={!assignTeacherId}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              Assign
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW: EXAM DUTY — Room-wise Invigilator Dashboard
  // ═══════════════════════════════════════════════════════════
  if (view === 'duty') {
    // Group schedules by date
    const dateGroups = {};
    schedules.forEach(s => {
      const d = s.exam_date || 'Unknown';
      if (!dateGroups[d]) dateGroups[d] = [];
      dateGroups[d].push(s);
    });
    const sortedDates = Object.keys(dateGroups).sort();

    const getTeacherName = (id) => {
      if (!id) return '';
      const t = teachers.find(x => x.id === id);
      return t ? `${t.first_name} ${t.last_name || ''}`.trim() : `ID:${id}`;
    };

    // dutyAssignments structure: { schedule_id: { hall_id, teachers: [id1, id2, ...] } }
    // Get all assigned teacher IDs for a specific date
    const getAssignedOnDate = (dateStr) => {
      const ids = new Set();
      (dateGroups[dateStr] || []).forEach(s => {
        const duty = dutyAssignments[s.id];
        if (duty?.teachers) duty.teachers.forEach(tid => ids.add(tid));
      });
      return ids;
    };

    // Stats
    const totalSlots = schedules.length;
    const assignedSlots = Object.values(dutyAssignments).filter(d => d.hall_id && d.teachers?.length > 0).length;

    // Room-wise summary
    const roomSummary = {};
    Object.entries(dutyAssignments).forEach(([schedId, duty]) => {
      if (!duty.hall_id) return;
      const hall = halls.find(h => h.id === duty.hall_id);
      const hallName = hall?.name || `Room ${duty.hall_id}`;
      if (!roomSummary[hallName]) roomSummary[hallName] = { hall, teachers: new Set(), schedules: [] };
      (duty.teachers || []).forEach(tid => roomSummary[hallName].teachers.add(tid));
      const sched = schedules.find(s => s.id === parseInt(schedId));
      if (sched) roomSummary[hallName].schedules.push(sched);
    });

    return (
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Button size="small" onClick={() => setView('datesheet')} sx={{ textTransform: 'none', mb: 0.5 }}>
              ← Back to Date Sheet
            </Button>
            <Typography variant="h5" fontWeight={800}>🏫 Invigilator Duty Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedExam.name} — Assign multiple teachers per room
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${assignedSlots}/${totalSlots} assigned`} color={assignedSlots === totalSlots ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
            {assignedSlots > 0 && (
              <Button variant="outlined" startIcon={<Print />} size="small"
                onClick={() => handlePrint('Invigilator Duty - ' + selectedExam.name, 'printable-duty')}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Print Duty Chart
              </Button>
            )}
          </Box>
        </Box>

        {/* Room-wise Summary Cards */}
        {Object.keys(roomSummary).length > 0 && (
          <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: alpha(P, 0.02) }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>📋 Room-wise Summary</Typography>
            <Grid container spacing={1.5}>
              {Object.entries(roomSummary).map(([hallName, info]) => (
                <Grid item xs={6} md={3} key={hallName}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight={700}>{hallName}</Typography>
                    <Typography variant="caption" color="text.secondary">Cap: {info.hall?.capacity || '-'}</Typography>
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.3, justifyContent: 'center' }}>
                      {[...info.teachers].map(tid => (
                        <Chip key={tid} label={getTeacherName(tid)} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#6b7280' }}>
                      {info.teachers.size} teacher(s) • {info.schedules.length} slot(s)
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Hidden printable */}
        <Box id="printable-duty" sx={{ display: 'none' }}>
          <div className="header">
            <div className="school-name">Dream International School</div>
            <div className="exam-name">{selectedExam?.name} — Invigilator Duty Chart</div>
          </div>
          {sortedDates.map(dateStr => (
            <div key={dateStr}>
              <h2 style={{textAlign:'left', marginTop:'15px'}}>Date: {dateStr}</h2>
              <table>
                <thead><tr><th>Room</th><th>Class</th><th>Subject</th><th>Time</th><th>Invigilators</th></tr></thead>
                <tbody>
                  {dateGroups[dateStr].map(s => {
                    const duty = dutyAssignments[s.id] || {};
                    const hallName = duty.hall_id ? (halls.find(h => h.id === duty.hall_id)?.name || '-') : '-';
                    return (
                      <tr key={s.id}>
                        <td>{hallName}</td>
                        <td>{s.class_name || '-'}</td>
                        <td>{s.subject?.name || s.subject_name || '-'}</td>
                        <td>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</td>
                        <td>{(duty.teachers || []).map(tid => getTeacherName(tid)).join(', ') || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </Box>

        {/* Date-wise Assignment Tables */}
        {sortedDates.map(dateStr => (
          <Paper key={dateStr} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(P, 0.04), borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>📅 {dateStr}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dateGroups[dateStr].length} exams • {getAssignedOnDate(dateStr).size} teachers on duty
                </Typography>
              </Box>
              <Chip label={`${dateGroups[dateStr].filter(s => dutyAssignments[s.id]?.teachers?.length > 0).length}/${dateGroups[dateStr].length} assigned`}
                size="small" color={dateGroups[dateStr].every(s => dutyAssignments[s.id]?.teachers?.length > 0) ? 'success' : 'default'} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Invigilators</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dateGroups[dateStr].map(s => {
                    const duty = dutyAssignments[s.id] || {};
                    const hallName = duty.hall_id ? (halls.find(h => h.id === duty.hall_id)?.name || 'Room') : '';
                    const hasTeachers = duty.teachers?.length > 0;
                    return (
                      <TableRow key={s.id} hover sx={{ bgcolor: hasTeachers ? alpha('#10b981', 0.03) : undefined }}>
                        <TableCell>
                          {hallName ? <Chip label={hallName} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} /> : <Typography variant="caption" color="error.main">Not set</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{s.class_name || '-'}</TableCell>
                        <TableCell>{s.subject?.name || s.subject_name || '-'}</TableCell>
                        <TableCell>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</TableCell>
                        <TableCell>
                          {hasTeachers ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                              {duty.teachers.map((tid, idx) => (
                                <Chip key={tid} label={`${idx === 0 ? '👑 ' : ''}${getTeacherName(tid)}`} size="small"
                                  color={idx === 0 ? 'primary' : 'default'}
                                  onDelete={() => {
                                    const updated = { ...duty, teachers: duty.teachers.filter(id => id !== tid) };
                                    setDutyAssignments({ ...dutyAssignments, [s.id]: updated });
                                  }}
                                  sx={{ fontWeight: 500, fontSize: '0.7rem' }} />
                              ))}
                            </Box>
                          ) : <Typography variant="caption" color="text.secondary">No invigilator assigned</Typography>}
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant={hasTeachers ? 'outlined' : 'contained'}
                            onClick={() => { setDutySchedule(s); setDutyOpen(true); setDutyHallId(duty.hall_id || ''); }}
                            sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.7rem' }}>
                            {hasTeachers ? '+ Add More' : 'Assign'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}

        {/* Assign Duty Dialog — Room + Multiple Teachers */}
        <Dialog open={dutyOpen} onClose={() => setDutyOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Assign Invigilator</Typography>
                <Typography variant="caption" color="text.secondary">
                  {dutySchedule?.subject?.name || dutySchedule?.subject_name} — {dutySchedule?.class_name} — {dutySchedule?.exam_date}
                </Typography>
              </Box>
              <IconButton onClick={() => setDutyOpen(false)}><Close /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField fullWidth select label="Room / Hall *" value={dutyHallId}
              onChange={e => setDutyHallId(e.target.value)} sx={{ mt: 1 }}>
              {halls.map(h => (
                <MenuItem key={h.id} value={h.id}>{h.name} (Capacity: {h.capacity})</MenuItem>
              ))}
            </TextField>

            {/* Currently assigned teachers for this slot */}
            {dutySchedule && (dutyAssignments[dutySchedule.id]?.teachers?.length > 0) && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">Currently Assigned:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {(dutyAssignments[dutySchedule.id]?.teachers || []).map(tid => (
                    <Chip key={tid} label={getTeacherName(tid)} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            <TextField fullWidth select label="Add Teacher *"
              value={dutyTeacherId} onChange={e => setDutyTeacherId(e.target.value)} sx={{ mt: 2 }}>
              {teachers.map(t => {
                const currentTeachers = dutySchedule ? (dutyAssignments[dutySchedule.id]?.teachers || []) : [];
                const alreadyInSlot = currentTeachers.includes(t.id);
                const assignedOnDate = dutySchedule ? getAssignedOnDate(dutySchedule.exam_date) : new Set();
                const busyElsewhere = assignedOnDate.has(t.id) && !alreadyInSlot;
                return (
                  <MenuItem key={t.id} value={t.id} disabled={alreadyInSlot || busyElsewhere}
                    sx={{ opacity: (alreadyInSlot || busyElsewhere) ? 0.5 : 1 }}>
                    {t.first_name} {t.last_name || ''} {t.designation ? `(${t.designation})` : ''}
                    {alreadyInSlot && ' — Already in this room'}
                    {busyElsewhere && ' — Busy in another room'}
                  </MenuItem>
                );
              })}
            </TextField>

            {dutySchedule && (() => {
              const assignedOnDate = getAssignedOnDate(dutySchedule.exam_date);
              return assignedOnDate.size > 0 ? (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  <strong>{assignedOnDate.size} teacher(s)</strong> already on duty on {dutySchedule.exam_date}.
                  Same teacher can be in only one room per time slot.
                </Alert>
              ) : null;
            })()}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDutyOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
            <Button variant="contained" onClick={handleAssignDuty} disabled={!dutyTeacherId || !dutyHallId}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
              Add Invigilator
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return null;
}
