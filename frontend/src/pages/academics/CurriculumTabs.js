import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Tooltip, LinearProgress,
  Divider, Switch, FormControlLabel, Card, CardContent, Badge, Alert
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Assignment, CheckCircle, Cancel, Warning,
  MenuBook, CloudUpload
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';

// ============================================================
// SYLLABUS TAB
// ============================================================
export function SyllabusTab({ classes, subjects, academicYears, showSnack }) {
  const [syllabus, setSyllabus] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ class_id: '', subject_id: '', academic_year_id: '', chapter_number: '', chapter_name: '', topics: '', learning_objectives: '', estimated_hours: '', term: 'term1', resources: '' });
  const [progressDialog, setProgressDialog] = useState(null);
  const [progressForm, setProgressForm] = useState({ teacher_id: '', date: '', topics_covered: '', hours_spent: '', percentage_covered: '', teaching_method: 'lecture', remarks: '' });
  const [overview, setOverview] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (classFilter) params.class_id = classFilter;
    if (subjectFilter) params.subject_id = subjectFilter;
    academicsAPI.listSyllabus(params).then(r => setSyllabus(r.data.data || [])).catch(() => showSnack('Failed to load', 'error'));
    academicsAPI.getSyllabusOverview(params).then(r => setOverview(r.data.data)).catch(() => {});
  }, [classFilter, subjectFilter, showSnack]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    const fn = editing ? academicsAPI.updateSyllabus(editing.id, form) : academicsAPI.createSyllabus(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); load(); }).catch(() => showSnack('Error', 'error'));
  };

  const del = (id) => { academicsAPI.deleteSyllabus(id).then(() => { showSnack('Deleted'); load(); }).catch(() => showSnack('Error', 'error')); };

  const openEdit = (s) => { setEditing(s); setForm({ class_id: s.class_id, subject_id: s.subject_id, academic_year_id: s.academic_year_id || '', chapter_number: s.chapter_number, chapter_name: s.chapter_name, topics: s.topics || '', learning_objectives: s.learning_objectives || '', estimated_hours: s.estimated_hours || '', term: s.term, resources: s.resources || '' }); setOpenDialog(true); };

  const saveProgress = () => {
    academicsAPI.addSyllabusProgress(progressDialog.id, progressForm).then(() => { showSnack('Progress logged'); setProgressDialog(null); load(); }).catch(() => showSnack('Error', 'error'));
  };

  return (
    <Box>
      {overview && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total Chapters', value: overview.total_chapters, color: '#6366f1' },
            { label: 'Completed', value: overview.completed, color: '#2e7d32' },
            { label: 'In Progress', value: overview.in_progress, color: '#ed6c02' },
            { label: 'Not Started', value: overview.not_started, color: '#d32f2f' },
          ].map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ borderLeft: `4px solid ${s.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${s.color}22` } }}>
                <CardContent sx={{ py: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MenuBook />
                  </Box>
                  <Box><Typography variant="h5" fontWeight="bold" color={s.color}>{s.value}</Typography><Typography variant="body2" color="text.secondary">{s.label}</Typography></Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classFilter} label="Class" onChange={e => setClassFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
          <InputLabel>Subject</InputLabel>
          <Select value={subjectFilter} label="Subject" onChange={e => setSubjectFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ class_id: '', subject_id: '', academic_year_id: '', chapter_number: '', chapter_name: '', topics: '', learning_objectives: '', estimated_hours: '', term: 'term1', resources: '' }); setOpenDialog(true); }}>Add Chapter</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Ch#</TableCell><TableCell>Chapter Name</TableCell><TableCell>Class</TableCell><TableCell>Subject</TableCell><TableCell>Term</TableCell><TableCell>Hours</TableCell><TableCell>Progress</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {syllabus.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.chapter_number}</TableCell>
                <TableCell><strong>{s.chapter_name}</strong></TableCell>
                <TableCell>{s.class_name}</TableCell>
                <TableCell>{s.subject_name}</TableCell>
                <TableCell><Chip label={s.term} size="small" /></TableCell>
                <TableCell>{s.estimated_hours || '-'}</TableCell>
                <TableCell sx={{ minWidth: 120 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress variant="determinate" value={s.completion_percentage || 0} sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                    <Typography variant="caption">{s.completion_percentage || 0}%</Typography>
                  </Box>
                </TableCell>
                <TableCell><Chip label={s.status?.replace('_', ' ')} size="small" color={s.status === 'completed' ? 'success' : s.status === 'in_progress' ? 'warning' : 'default'} /></TableCell>
                <TableCell>
                  <Tooltip title="Log Progress"><IconButton size="small" color="primary" onClick={() => { setProgressDialog(s); setProgressForm({ teacher_id: '', date: new Date().toISOString().slice(0, 10), topics_covered: '', hours_spent: '', percentage_covered: '', teaching_method: 'lecture', remarks: '' }); }}><Assignment fontSize="small" /></IconButton></Tooltip>
                  <IconButton size="small" onClick={() => openEdit(s)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => del(s.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!syllabus.length && <TableRow><TableCell colSpan={9} align="center">No syllabus chapters. Add chapters to track progress.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Chapter' : 'Add Chapter'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={form.class_id} label="Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Subject</InputLabel><Select value={form.subject_id} label="Subject" onChange={e => setForm({ ...form, subject_id: e.target.value })}>{subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Term</InputLabel><Select value={form.term} label="Term" onChange={e => setForm({ ...form, term: e.target.value })}><MenuItem value="term1">Term 1</MenuItem><MenuItem value="term2">Term 2</MenuItem><MenuItem value="term3">Term 3</MenuItem><MenuItem value="annual">Annual</MenuItem></Select></FormControl></Grid>
            <Grid item xs={4} sm={3}><TextField fullWidth type="number" label="Chapter #" value={form.chapter_number} onChange={e => setForm({ ...form, chapter_number: e.target.value })} /></Grid>
            <Grid item xs={8} sm={6}><TextField fullWidth label="Chapter Name" value={form.chapter_name} onChange={e => setForm({ ...form, chapter_name: e.target.value })} /></Grid>
            <Grid item xs={4} sm={3}><TextField fullWidth type="number" label="Est. Hours" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Topics (comma separated)" value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Learning Objectives" value={form.learning_objectives} onChange={e => setForm({ ...form, learning_objectives: e.target.value })} multiline rows={2} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!progressDialog} onClose={() => setProgressDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Syllabus Progress - {progressDialog?.chapter_name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth type="date" label="Date" value={progressForm.date} onChange={e => setProgressForm({ ...progressForm, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Method</InputLabel><Select value={progressForm.teaching_method} label="Method" onChange={e => setProgressForm({ ...progressForm, teaching_method: e.target.value })}><MenuItem value="lecture">Lecture</MenuItem><MenuItem value="discussion">Discussion</MenuItem><MenuItem value="practical">Practical</MenuItem><MenuItem value="project">Project</MenuItem><MenuItem value="demonstration">Demonstration</MenuItem><MenuItem value="online">Online</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Topics Covered" value={progressForm.topics_covered} onChange={e => setProgressForm({ ...progressForm, topics_covered: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Hours Spent" value={progressForm.hours_spent} onChange={e => setProgressForm({ ...progressForm, hours_spent: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="% Covered" value={progressForm.percentage_covered} onChange={e => setProgressForm({ ...progressForm, percentage_covered: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" value={progressForm.remarks} onChange={e => setProgressForm({ ...progressForm, remarks: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setProgressDialog(null)}>Cancel</Button><Button variant="contained" onClick={saveProgress}>Log Progress</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// HOMEWORK TAB
// ============================================================
export function HomeworkTab({ classes, subjects, showSnack }) {
  const [homework, setHomework] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ teacher_id: '', class_id: '', subject_id: '', title: '', description: '', instructions: '', homework_type: 'assignment', due_date: '', max_marks: '', allow_late_submission: false });
  const [detailDialog, setDetailDialog] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (classFilter) params.class_id = classFilter;
    if (statusFilter) params.status = statusFilter;
    academicsAPI.listHomework(params).then(r => setHomework(r.data.data || [])).catch(() => showSnack('Failed to load', 'error'));
  }, [classFilter, statusFilter, showSnack]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    const fn = editing ? academicsAPI.updateHomework(editing.id, form) : academicsAPI.createHomework(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); load(); }).catch(() => showSnack('Error', 'error'));
  };

  const del = (id) => { academicsAPI.deleteHomework(id).then(() => { showSnack('Deleted'); load(); }).catch(() => showSnack('Error', 'error')); };

  const viewDetail = (hw) => {
    academicsAPI.getHomework(hw.id).then(r => setDetailDialog(r.data.data)).catch(() => showSnack('Error', 'error'));
  };

  const openEdit = (h) => { setEditing(h); setForm({ teacher_id: h.teacher_id, class_id: h.class_id, subject_id: h.subject_id, title: h.title, description: h.description || '', instructions: h.instructions || '', homework_type: h.homework_type, due_date: h.due_date, max_marks: h.max_marks || '', allow_late_submission: h.allow_late_submission }); setOpenDialog(true); };

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classFilter} label="Class" onChange={e => setClassFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 120 } }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ teacher_id: '', class_id: '', subject_id: '', title: '', description: '', instructions: '', homework_type: 'assignment', due_date: '', max_marks: '', allow_late_submission: false }); setOpenDialog(true); }}>Assign Homework</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Title</TableCell><TableCell>Class</TableCell><TableCell>Subject</TableCell><TableCell>Type</TableCell><TableCell>Due Date</TableCell><TableCell>Marks</TableCell><TableCell>Submissions</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {homework.map(h => (
              <TableRow key={h.id}>
                <TableCell><strong>{h.title}</strong></TableCell>
                <TableCell>{h.class_name}</TableCell>
                <TableCell>{h.subject_name}</TableCell>
                <TableCell><Chip label={h.homework_type} size="small" variant="outlined" /></TableCell>
                <TableCell>{h.due_date}</TableCell>
                <TableCell>{h.max_marks || '-'}</TableCell>
                <TableCell><Badge badgeContent={h.total_submissions} color="primary"><Assignment /></Badge></TableCell>
                <TableCell><Chip label={h.status} size="small" color={h.status === 'published' ? 'success' : h.status === 'closed' ? 'error' : 'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => viewDetail(h)}><Visibility fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => openEdit(h)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => del(h.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!homework.length && <TableRow><TableCell colSpan={9} align="center">No homework assigned yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Homework' : 'Assign Homework'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={form.class_id} label="Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Subject</InputLabel><Select value={form.subject_id} label="Subject" onChange={e => setForm({ ...form, subject_id: e.target.value })}>{subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={form.homework_type} label="Type" onChange={e => setForm({ ...form, homework_type: e.target.value })}><MenuItem value="assignment">Assignment</MenuItem><MenuItem value="project">Project</MenuItem><MenuItem value="worksheet">Worksheet</MenuItem><MenuItem value="practice">Practice</MenuItem><MenuItem value="reading">Reading</MenuItem><MenuItem value="research">Research</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth type="date" label="Due Date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Instructions" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Max Marks" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} /></Grid>
            <Grid item xs={6} sm={4}><FormControlLabel control={<Switch checked={form.allow_late_submission} onChange={e => setForm({ ...form, allow_late_submission: e.target.checked })} />} label="Allow Late Submission" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Assign'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Homework: {detailDialog?.title}</DialogTitle>
        <DialogContent>
          {detailDialog && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={4}><Typography variant="body2" color="textSecondary">Class</Typography><Typography>{detailDialog.class_name}</Typography></Grid>
                <Grid item xs={12} sm={4}><Typography variant="body2" color="textSecondary">Subject</Typography><Typography>{detailDialog.subject_name}</Typography></Grid>
                <Grid item xs={12} sm={4}><Typography variant="body2" color="textSecondary">Due Date</Typography><Typography>{detailDialog.due_date}</Typography></Grid>
              </Grid>
              {detailDialog.description && <Typography mb={2}>{detailDialog.description}</Typography>}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" mb={1}>Submissions ({detailDialog.submissions?.length || 0})</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell>Student</TableCell><TableCell>Submitted</TableCell><TableCell>Late</TableCell><TableCell>Marks</TableCell><TableCell>Grade</TableCell><TableCell>Status</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {detailDialog.submissions?.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.student_name}</TableCell>
                        <TableCell>{s.submitted_at?.slice(0, 10)}</TableCell>
                        <TableCell>{s.is_late ? <Warning color="warning" fontSize="small" /> : <CheckCircle color="success" fontSize="small" />}</TableCell>
                        <TableCell>{s.marks_obtained ?? '-'}</TableCell>
                        <TableCell>{s.grade || '-'}</TableCell>
                        <TableCell><Chip label={s.status} size="small" /></TableCell>
                      </TableRow>
                    ))}
                    {!detailDialog.submissions?.length && <TableRow><TableCell colSpan={6} align="center">No submissions yet</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// LESSON PLANS TAB
// ============================================================
export function LessonPlansTab({ classes, subjects, showSnack }) {
  const [plans, setPlans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ teacher_id: '', class_id: '', subject_id: '', title: '', date: '', period_number: '', duration_minutes: 40, topic: '', objectives: '', teaching_methodology: '', teaching_aids: '', student_activities: '', homework_given: '', learning_outcomes: '' });
  const [detailDialog, setDetailDialog] = useState(null);

  const load = useCallback(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (classFilter) params.class_id = classFilter;
    academicsAPI.listLessonPlans(params).then(r => setPlans(r.data.data || [])).catch(() => showSnack('Failed to load', 'error'));
  }, [statusFilter, classFilter, showSnack]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    const fn = editing ? academicsAPI.updateLessonPlan(editing.id, form) : academicsAPI.createLessonPlan(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); load(); }).catch(() => showSnack('Error', 'error'));
  };

  const del = (id) => { academicsAPI.deleteLessonPlan(id).then(() => { showSnack('Deleted'); load(); }).catch(() => showSnack('Error', 'error')); };

  const approve = (id, action, reason) => {
    academicsAPI.approveLessonPlan(id, { action, reason }).then(() => { showSnack(`Plan ${action}d`); load(); }).catch(() => showSnack('Error', 'error'));
  };

  const viewDetail = (p) => {
    academicsAPI.getLessonPlan(p.id).then(r => setDetailDialog(r.data.data)).catch(() => showSnack('Error', 'error'));
  };

  const openEdit = (p) => { setEditing(p); setForm({ teacher_id: p.teacher_id, class_id: p.class_id, subject_id: p.subject_id, title: p.title, date: p.date, period_number: p.period_number || '', duration_minutes: p.duration_minutes, topic: p.topic, objectives: p.objectives || '', teaching_methodology: p.teaching_methodology || '', teaching_aids: p.teaching_aids || '', student_activities: p.student_activities || '', homework_given: p.homework_given || '', learning_outcomes: p.learning_outcomes || '' }); setOpenDialog(true); };

  const statusColor = (s) => s === 'approved' ? 'success' : s === 'rejected' ? 'error' : s === 'submitted' ? 'info' : s === 'revision_needed' ? 'warning' : 'default';

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classFilter} label="Class" onChange={e => setClassFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 130 } }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="revision_needed">Revision Needed</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ teacher_id: '', class_id: '', subject_id: '', title: '', date: '', period_number: '', duration_minutes: 40, topic: '', objectives: '', teaching_methodology: '', teaching_aids: '', student_activities: '', homework_given: '', learning_outcomes: '' }); setOpenDialog(true); }}>Create Plan</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Title</TableCell><TableCell>Teacher</TableCell><TableCell>Class</TableCell><TableCell>Subject</TableCell><TableCell>Date</TableCell><TableCell>Period</TableCell><TableCell>Topic</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {plans.map(p => (
              <TableRow key={p.id}>
                <TableCell><strong>{p.title}</strong></TableCell>
                <TableCell>{p.teacher_name}</TableCell>
                <TableCell>{p.class_name}</TableCell>
                <TableCell>{p.subject_name}</TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell>{p.period_number || '-'}</TableCell>
                <TableCell>{p.topic}</TableCell>
                <TableCell><Chip label={p.status?.replace('_', ' ')} size="small" color={statusColor(p.status)} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => viewDetail(p)}><Visibility fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                  {p.status === 'submitted' && (
                    <>
                      <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => approve(p.id, 'approve')}><CheckCircle fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => approve(p.id, 'reject', 'Needs improvement')}><Cancel fontSize="small" /></IconButton></Tooltip>
                    </>
                  )}
                  <IconButton size="small" color="error" onClick={() => del(p.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!plans.length && <TableRow><TableCell colSpan={9} align="center">No lesson plans yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Lesson Plan' : 'Create Lesson Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={form.class_id} label="Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Subject</InputLabel><Select value={form.subject_id} label="Subject" onChange={e => setForm({ ...form, subject_id: e.target.value })}>{subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth type="date" label="Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Grid>
            <Grid item xs={6} sm={2}><TextField fullWidth type="number" label="Period" value={form.period_number} onChange={e => setForm({ ...form, period_number: e.target.value })} /></Grid>
            <Grid item xs={6} sm={2}><TextField fullWidth type="number" label="Duration (min)" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Topic" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Objectives" value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Teaching Methodology" value={form.teaching_methodology} onChange={e => setForm({ ...form, teaching_methodology: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Teaching Aids" value={form.teaching_aids} onChange={e => setForm({ ...form, teaching_aids: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Student Activities" value={form.student_activities} onChange={e => setForm({ ...form, student_activities: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Homework Given" value={form.homework_given} onChange={e => setForm({ ...form, homework_given: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Learning Outcomes" value={form.learning_outcomes} onChange={e => setForm({ ...form, learning_outcomes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>

      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>{detailDialog?.title}</DialogTitle>
        <DialogContent>
          {detailDialog && (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="textSecondary">Teacher</Typography><Typography>{detailDialog.teacher_name}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="textSecondary">Class</Typography><Typography>{detailDialog.class_name}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="textSecondary">Subject</Typography><Typography>{detailDialog.subject_name}</Typography></Grid>
              <Grid item xs={6} sm={3}><Typography variant="body2" color="textSecondary">Date</Typography><Typography>{detailDialog.date}</Typography></Grid>
              <Grid item xs={12}><Divider /></Grid>
              <Grid item xs={12}><Typography variant="body2" color="textSecondary">Topic</Typography><Typography fontWeight="bold">{detailDialog.topic}</Typography></Grid>
              {detailDialog.objectives && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Objectives</Typography><Typography>{detailDialog.objectives}</Typography></Grid>}
              {detailDialog.teaching_methodology && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Methodology</Typography><Typography>{detailDialog.teaching_methodology}</Typography></Grid>}
              {detailDialog.teaching_aids && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Teaching Aids</Typography><Typography>{detailDialog.teaching_aids}</Typography></Grid>}
              {detailDialog.student_activities && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Student Activities</Typography><Typography>{detailDialog.student_activities}</Typography></Grid>}
              {detailDialog.homework_given && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Homework</Typography><Typography>{detailDialog.homework_given}</Typography></Grid>}
              {detailDialog.learning_outcomes && <Grid item xs={6}><Typography variant="body2" color="textSecondary">Learning Outcomes</Typography><Typography>{detailDialog.learning_outcomes}</Typography></Grid>}
              {detailDialog.reflection && <Grid item xs={12}><Typography variant="body2" color="textSecondary">Reflection</Typography><Typography>{detailDialog.reflection}</Typography></Grid>}
              {detailDialog.rejection_reason && <Grid item xs={12}><Alert severity="warning">Feedback: {detailDialog.rejection_reason}</Alert></Grid>}
            </Grid>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailDialog(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// ACADEMIC CALENDAR TAB - Class-wise Monthly Calendar View
// ============================================================
export function CalendarTab({ classes = [], showSnack }) {
  const [events, setEvents] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'event', start_date: '', end_date: '', is_holiday: false, applies_to: 'all', class_id: '', color: '#1976d2', notify_parents: false });
  const [selectedDay, setSelectedDay] = useState(null);

  const eventColors = { holiday: '#d32f2f', exam: '#ed6c02', ptm: '#9c27b0', event: '#1976d2', cultural: '#e91e63', sports: '#2e7d32', meeting: '#0288d1', deadline: '#f44336', vacation: '#ff9800', other: '#757575' };

  const load = useCallback(() => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    if (typeFilter) params.event_type = typeFilter;
    if (classFilter) params.class_id = classFilter;
    academicsAPI.getCalendar(params).then(r => setEvents(r.data.data || [])).catch(() => showSnack('Failed to load', 'error'));
  }, [month, year, typeFilter, classFilter, showSnack]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    const payload = { ...form };
    if (payload.applies_to !== 'specific_class') payload.class_id = null;
    const fn = editing ? academicsAPI.updateCalendarEvent(editing.id, payload) : academicsAPI.createCalendarEvent(payload);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Created'); setOpenDialog(false); setEditing(null); load(); }).catch(() => showSnack('Error', 'error'));
  };

  const del = (id) => { academicsAPI.deleteCalendarEvent(id).then(() => { showSnack('Deleted'); load(); }).catch(() => showSnack('Error', 'error')); };

  const openEdit = (e) => { setEditing(e); setForm({ title: e.title, description: e.description || '', event_type: e.event_type, start_date: e.start_date, end_date: e.end_date || '', is_holiday: e.is_holiday, applies_to: e.applies_to || 'all', class_id: e.class_id || '', color: e.color || '#1976d2', notify_parents: e.notify_parents }); setOpenDialog(true); };

  const openAddForDate = (dateStr) => {
    setEditing(null);
    setForm({ title: '', description: '', event_type: 'event', start_date: dateStr, end_date: '', is_holiday: false, applies_to: classFilter ? 'specific_class' : 'all', class_id: classFilter || '', color: '#1976d2', notify_parents: false });
    setOpenDialog(true);
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === d;

  // Map events to dates
  const eventsByDate = {};
  events.forEach(ev => {
    const start = new Date(ev.start_date);
    const end = ev.end_date ? new Date(ev.end_date) : start;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() + 1 === month && d.getFullYear() === year) {
        const key = d.getDate();
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(ev);
      }
    }
  });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  // Stats
  const holidays = events.filter(e => e.is_holiday).length;
  const exams = events.filter(e => e.event_type === 'exam').length;
  const ptms = events.filter(e => e.event_type === 'ptm').length;
  const others = events.length - holidays - exams - ptms;

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Events', value: events.length, color: '#6366f1', icon: '📅' },
          { label: 'Holidays', value: holidays, color: '#d32f2f', icon: '🏖️' },
          { label: 'Exams', value: exams, color: '#ed6c02', icon: '📝' },
          { label: 'PTMs', value: ptms, color: '#9c27b0', icon: '👨‍👩‍👧' },
          { label: 'Other Events', value: others, color: '#2e7d32', icon: '🎯' },
        ].map((s, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={i}>
            <Card sx={{ borderLeft: `4px solid ${s.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${s.color}22` } }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontSize={24}>{s.icon}</Typography>
                <Box><Typography variant="h6" fontWeight="bold" color={s.color}>{s.value}</Typography><Typography variant="caption" color="text.secondary">{s.label}</Typography></Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 160 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classFilter} label="Class" onChange={e => setClassFilter(e.target.value)}>
            <MenuItem value="">All Classes</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 130 } }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">All Types</MenuItem>
            {Object.keys(eventColors).map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setForm({ title: '', description: '', event_type: 'event', start_date: '', end_date: '', is_holiday: false, applies_to: classFilter ? 'specific_class' : 'all', class_id: classFilter || '', color: '#1976d2', notify_parents: false }); setOpenDialog(true); }}>Add Event</Button>
      </Box>

      {/* Calendar Navigation */}
      <Paper sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5} bgcolor="#f5f5f5" borderRadius="4px 4px 0 0">
          <Button size="small" onClick={prevMonth}>&lt; Prev</Button>
          <Typography variant="h6" fontWeight="bold">{months[month - 1]} {year}</Typography>
          <Button size="small" onClick={nextMonth}>Next &gt;</Button>
        </Box>

        {/* Day Headers */}
        <Grid container sx={{ borderBottom: '2px solid #e0e0e0' }}>
          {dayNames.map(d => (
            <Grid item xs key={d} sx={{ textAlign: 'center', py: 1, fontWeight: 'bold', bgcolor: d === 'Sun' ? '#fff3f3' : 'transparent' }}>
              <Typography variant="body2" fontWeight="bold" color={d === 'Sun' ? 'error' : 'textPrimary'}>{d}</Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Grid */}
        <Grid container>
          {/* Empty cells for days before 1st */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <Grid item xs key={`empty-${i}`} sx={{ minHeight: 100, borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }} />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayOfWeek = (firstDay + i) % 7;
            const isSunday = dayOfWeek === 0;
            const dayEvents = eventsByDate[day] || [];
            const hasHoliday = dayEvents.some(e => e.is_holiday);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <Grid item xs key={day} sx={{
                minHeight: 100, borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', p: 0.5, cursor: 'pointer',
                bgcolor: isToday(day) ? '#e3f2fd' : hasHoliday ? '#ffebee' : isSunday ? '#fff8f8' : 'white',
                '&:hover': { bgcolor: '#f5f5f5' }, position: 'relative', overflow: 'hidden'
              }} onClick={() => setSelectedDay({ day, date: dateStr, events: dayEvents })}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" fontWeight={isToday(day) ? 'bold' : 'normal'}
                    sx={{ color: isSunday ? '#d32f2f' : isToday(day) ? '#1976d2' : 'inherit',
                      ...(isToday(day) && { bgcolor: '#1976d2', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 })
                    }}>
                    {day}
                  </Typography>
                  {dayEvents.length > 0 && <Chip label={dayEvents.length} size="small" sx={{ height: 18, fontSize: 10, minWidth: 20 }} color="primary" />}
                </Box>
                {dayEvents.slice(0, 3).map((ev, idx) => (
                  <Box key={idx} sx={{ bgcolor: ev.color || eventColors[ev.event_type] || '#1976d2', color: '#fff', borderRadius: 1, px: 0.5, py: 0.2, mb: 0.3, fontSize: 10, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </Box>
                ))}
                {dayEvents.length > 3 && <Typography variant="caption" color="primary" sx={{ fontSize: 10 }}>+{dayEvents.length - 3} more</Typography>}
              </Grid>
            );
          })}
        </Grid>

        {/* Legend */}
        <Box display="flex" gap={2} p={1.5} flexWrap="wrap" borderTop="1px solid #e0e0e0">
          {Object.entries(eventColors).map(([type, color]) => (
            <Box key={type} display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 12, height: 12, bgcolor: color, borderRadius: 1 }} />
              <Typography variant="caption">{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Events list below calendar */}
      {events.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" mb={1} fontWeight="bold">Events this Month</Typography>
          <Divider sx={{ mb: 1.5 }} />
          <Grid container spacing={1.5}>
            {events.map(e => (
              <Grid item xs={12} md={6} key={e.id}>
                <Card variant="outlined" sx={{ borderLeft: `4px solid ${e.color || eventColors[e.event_type] || '#1976d2'}` }}>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography fontWeight="bold" fontSize={14}>{e.title}</Typography>
                          {e.is_holiday && <Chip label="Holiday" size="small" color="error" sx={{ height: 20, fontSize: 10 }} />}
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {e.start_date}{e.end_date && e.end_date !== e.start_date ? ` to ${e.end_date}` : ''}
                          {e.class_name ? ` • ${e.class_name}` : e.applies_to === 'all' ? ' • All Classes' : ` • ${e.applies_to}`}
                        </Typography>
                        {e.description && <Typography variant="body2" fontSize={12} mt={0.3}>{e.description}</Typography>}
                      </Box>
                      <Box display="flex" gap={0.5}>
                        <Chip label={e.event_type} size="small" sx={{ bgcolor: eventColors[e.event_type] || '#1976d2', color: '#fff', height: 22, fontSize: 10 }} />
                        <IconButton size="small" onClick={() => openEdit(e)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => del(e.id)}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDay} onClose={() => setSelectedDay(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{selectedDay && `${months[month - 1]} ${selectedDay.day}, ${year}`}</Typography>
          <Button size="small" variant="contained" startIcon={<Add />} onClick={() => { setSelectedDay(null); openAddForDate(selectedDay?.date); }}>Add Event</Button>
        </DialogTitle>
        <DialogContent>
          {selectedDay?.events?.length ? selectedDay.events.map((ev, i) => (
            <Card key={i} variant="outlined" sx={{ mb: 1, borderLeft: `4px solid ${ev.color || eventColors[ev.event_type]}` }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography fontWeight="bold">{ev.title}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {ev.event_type.toUpperCase()}{ev.class_name ? ` • ${ev.class_name}` : ev.applies_to === 'all' ? ' • All' : ''}
                    </Typography>
                    {ev.description && <Typography variant="body2" fontSize={12}>{ev.description}</Typography>}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => { setSelectedDay(null); openEdit(ev); }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => { del(ev.id); setSelectedDay(null); }}><Delete fontSize="small" /></IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )) : <Typography color="textSecondary" textAlign="center" py={3}>No events on this day</Typography>}
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedDay(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Add/Edit Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Event Type</InputLabel>
                <Select value={form.event_type} label="Event Type" onChange={e => setForm({ ...form, event_type: e.target.value, color: eventColors[e.target.value] || '#1976d2' })}>
                  {Object.keys(eventColors).map(t => <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Applies To</InputLabel>
                <Select value={form.applies_to} label="Applies To" onChange={e => setForm({ ...form, applies_to: e.target.value, class_id: e.target.value !== 'specific_class' ? '' : form.class_id })}>
                  <MenuItem value="all">All Classes</MenuItem>
                  <MenuItem value="students">All Students</MenuItem>
                  <MenuItem value="staff">Staff Only</MenuItem>
                  <MenuItem value="specific_class">Specific Class</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {form.applies_to === 'specific_class' && (
              <Grid item xs={12}>
                <FormControl fullWidth><InputLabel>Select Class</InputLabel>
                  <Select value={form.class_id} label="Select Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>
                    {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={6}><TextField fullWidth type="date" label="Start Date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} InputLabelProps={{ shrink: true }} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="End Date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={form.is_holiday} onChange={e => setForm({ ...form, is_holiday: e.target.checked })} />} label="Holiday" /></Grid>
            <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={form.notify_parents} onChange={e => setForm({ ...form, notify_parents: e.target.checked })} />} label="Notify Parents" /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth type="color" label="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// STUDY MATERIALS TAB
// ============================================================
export function MaterialsTab({ classes, subjects, showSnack }) {
  const [materials, setMaterials] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ class_id: '', subject_id: '', uploaded_by: '', title: '', description: '', material_type: 'pdf', file_url: '', external_link: '', tags: '', is_downloadable: true });

  const typeIcons = { pdf: '📄', video: '🎬', link: '🔗', image: '🖼️', document: '📝', presentation: '📊', audio: '🎵' };

  const load = useCallback(() => {
    const params = {};
    if (classFilter) params.class_id = classFilter;
    if (subjectFilter) params.subject_id = subjectFilter;
    if (typeFilter) params.material_type = typeFilter;
    academicsAPI.listStudyMaterials(params).then(r => setMaterials(r.data.data || [])).catch(() => showSnack('Failed to load', 'error'));
  }, [classFilter, subjectFilter, typeFilter, showSnack]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    const fn = editing ? academicsAPI.updateStudyMaterial(editing.id, form) : academicsAPI.createStudyMaterial(form);
    fn.then(() => { showSnack(editing ? 'Updated' : 'Uploaded'); setOpenDialog(false); setEditing(null); load(); }).catch(() => showSnack('Error', 'error'));
  };

  const del = (id) => { academicsAPI.deleteStudyMaterial(id).then(() => { showSnack('Deleted'); load(); }).catch(() => showSnack('Error', 'error')); };

  const openEdit = (m) => { setEditing(m); setForm({ class_id: m.class_id, subject_id: m.subject_id, uploaded_by: m.uploaded_by, title: m.title, description: m.description || '', material_type: m.material_type, file_url: m.file_url || '', external_link: m.external_link || '', tags: m.tags || '', is_downloadable: m.is_downloadable }); setOpenDialog(true); };

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classFilter} label="Class" onChange={e => setClassFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
          <InputLabel>Subject</InputLabel>
          <Select value={subjectFilter} label="Subject" onChange={e => setSubjectFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 120 } }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="video">Video</MenuItem>
            <MenuItem value="link">Link</MenuItem>
            <MenuItem value="document">Document</MenuItem>
            <MenuItem value="presentation">Presentation</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => { setEditing(null); setForm({ class_id: '', subject_id: '', uploaded_by: '', title: '', description: '', material_type: 'pdf', file_url: '', external_link: '', tags: '', is_downloadable: true }); setOpenDialog(true); }}>Upload Material</Button>
      </Box>

      <Grid container spacing={2}>
        {materials.map(m => (
          <Grid item xs={12} md={6} lg={4} key={m.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" fontSize="1rem">{typeIcons[m.material_type] || '📎'} {m.title}</Typography>
                    <Typography variant="body2" color="textSecondary">{m.class_name} • {m.subject_name}</Typography>
                    {m.description && <Typography variant="body2" mt={0.5}>{m.description}</Typography>}
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => del(m.id)}><Delete fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                  <Box display="flex" gap={1}>
                    <Chip label={m.material_type} size="small" variant="outlined" />
                    {m.tags && m.tags.split(',').slice(0, 3).map((t, i) => <Chip key={i} label={t.trim()} size="small" />)}
                  </Box>
                  <Typography variant="caption" color="textSecondary">Views: {m.view_count} | Downloads: {m.download_count}</Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" display="block" mt={0.5}>By {m.uploader_name} | {m.created_at?.slice(0, 10)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {!materials.length && <Grid item xs={12}><Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}><Typography color="textSecondary">No study materials. Upload resources to share with students.</Typography></Paper></Grid>}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Material' : 'Upload Study Material'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={form.class_id} label="Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Subject</InputLabel><Select value={form.subject_id} label="Subject" onChange={e => setForm({ ...form, subject_id: e.target.value })}>{subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={4}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={form.material_type} label="Type" onChange={e => setForm({ ...form, material_type: e.target.value })}><MenuItem value="pdf">PDF</MenuItem><MenuItem value="video">Video</MenuItem><MenuItem value="link">Link</MenuItem><MenuItem value="image">Image</MenuItem><MenuItem value="document">Document</MenuItem><MenuItem value="presentation">Presentation</MenuItem><MenuItem value="audio">Audio</MenuItem></Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} multiline rows={2} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="File URL" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="External Link" value={form.external_link} onChange={e => setForm({ ...form, external_link: e.target.value })} /></Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} /></Grid>
            <Grid item xs={12} sm={4}><FormControlLabel control={<Switch checked={form.is_downloadable} onChange={e => setForm({ ...form, is_downloadable: e.target.checked })} />} label="Downloadable" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDialog(false)}>Cancel</Button><Button variant="contained" onClick={save}>{editing ? 'Update' : 'Upload'}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
