import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, IconButton, Tooltip,
  alpha, useTheme, Tabs, Tab, LinearProgress, Alert, Stack, Divider
} from '@mui/material';
import {
  Add, Assignment, Upload, Refresh, Visibility, Grade, Download,
  AttachFile, CheckCircle, Schedule, People, Close
} from '@mui/icons-material';
import { validateForm } from '../../components/Validation';
import { academicsAPI, dashboardAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherAssignments() {
  const [tab, setTab] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(null); // homework object
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [gradeData, setGradeData] = useState({});
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  // Create form
  const [form, setForm] = useState({
    title: '', description: '', instructions: '', class_id: '', section_id: '',
    subject_id: '', due_date: '', max_marks: 20, homework_type: 'assignment',
    allow_late_submission: true, file: null,
  });
  const [creating, setCreating] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      academicsAPI.listHomework({ teacher_id: 'me' }).catch(() => ({ data: { data: [] } })),
      dashboardAPI.getTeacher().catch(() => ({ data: { data: {} } })),
    ]).then(([hwRes, dashRes]) => {
      const hwData = hwRes.data?.data;
      setAssignments(Array.isArray(hwData) ? hwData : hwData?.items || []);
      const dash = dashRes.data?.data || {};
      setMySubjects(dash.my_subjects || []);
      setMyClasses(dash.my_classes || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    const errs = validateForm(form, { title: ['required'], class_id: ['required'], subject_id: ['required'], due_date: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    setCreating(true);
    try {
      let attachment_url = null;
      if (form.file) {
        const upRes = await uploadAPI.upload(form.file, 'homework');
        attachment_url = upRes.data?.data?.file_url;
      }
      await academicsAPI.createHomework({
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        class_id: parseInt(form.class_id),
        section_id: form.section_id ? parseInt(form.section_id) : null,
        subject_id: parseInt(form.subject_id),
        due_date: form.due_date,
        max_marks: form.max_marks || 20,
        homework_type: form.homework_type,
        allow_late_submission: form.allow_late_submission,
        attachment_url,
      });
      toast.success('Assignment created!');
      setCreateOpen(false);
      setForm({ title: '', description: '', instructions: '', class_id: '', section_id: '', subject_id: '', due_date: '', max_marks: 20, homework_type: 'assignment', allow_late_submission: true, file: null });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const viewSubmissions = async (hw) => {
    setViewOpen(hw);
    setSubLoading(true);
    try {
      const res = await academicsAPI.getHomework(hw.id);
      setSubmissions(res.data?.data?.submissions || []);
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setSubLoading(false);
    }
  };

  const handleGrade = async (hwId, submissionId) => {
    const gd = gradeData[submissionId];
    if (!gd?.marks_obtained && gd?.marks_obtained !== 0) {
      toast.error('Enter marks');
      return;
    }
    try {
      await academicsAPI.gradeHomework(hwId, {
        submission_id: submissionId,
        marks_obtained: parseFloat(gd.marks_obtained),
        grade: gd.grade || '',
        teacher_remarks: gd.teacher_remarks || '',
      });
      toast.success('Graded!');
      viewSubmissions(viewOpen);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const pending = assignments.filter(a => a.status === 'published');
  const closed = assignments.filter(a => a.status !== 'published');

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>Assignments</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
            Create Assignment
          </Button>
          <IconButton onClick={loadData}><Refresh /></IconButton>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, bgcolor: alpha(PRIMARY, 0.05) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="primary">{assignments.length}</Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, bgcolor: alpha('#10b981', 0.05) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#10b981' }}>{pending.length}</Typography>
              <Typography variant="caption" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, bgcolor: alpha('#f59e0b', 0.05) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#f59e0b' }}>
                {assignments.reduce((sum, a) => sum + (a.total_submissions || 0), 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Submissions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 3, bgcolor: alpha('#ef4444', 0.05) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#ef4444' }}>{closed.length}</Typography>
              <Typography variant="caption" color="text.secondary">Closed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assignment List */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Active (${pending.length})`} />
          <Tab label={`All (${assignments.length})`} />
        </Tabs>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Submissions</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tab === 0 ? pending : assignments).map(hw => (
                <TableRow key={hw.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assignment sx={{ fontSize: 18, color: PRIMARY }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{hw.title}</Typography>
                        {hw.attachment_url && <Chip icon={<AttachFile sx={{ fontSize: 12 }} />} label="File" size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={`${hw.class_name || '-'}${hw.section_name ? ' - ' + hw.section_name : ''}`} size="small" sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{hw.subject_name || '-'}</TableCell>
                  <TableCell><Chip label={hw.due_date || '-'} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                  <TableCell>
                    <Chip label={hw.total_submissions || 0} size="small" color="info" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Submissions">
                      <IconButton size="small" onClick={() => viewSubmissions(hw)} sx={{ color: PRIMARY }}>
                        <Visibility sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(tab === 0 ? pending : assignments).length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No assignments yet. Create one!</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Create Assignment</Typography></DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Class" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                {[...new Map(mySubjects.map(s => [s.class_id, { id: s.class_id, name: s.class_name }])).values()].map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Section" value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}>
                <MenuItem value="">All Sections</MenuItem>
                {mySubjects.filter(s => s.class_id === parseInt(form.class_id)).map(s => s.section_id ? (
                  <MenuItem key={s.section_id} value={s.section_id}>{s.section_name}</MenuItem>
                ) : null).filter(Boolean)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Subject" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                {[...new Map(mySubjects.filter(s => !form.class_id || s.class_id === parseInt(form.class_id)).map(s => [s.subject_id, { id: s.subject_id, name: s.subject_name }])).values()].map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Due Date" type="date" InputLabelProps={{ shrink: true }} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Max Marks" type="number" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Type" value={form.homework_type} onChange={e => setForm({ ...form, homework_type: e.target.value })}>
                {['assignment', 'project', 'worksheet', 'practice', 'reading', 'research'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Instructions" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} /></Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<Upload />} sx={{ borderRadius: 2, textTransform: 'none' }}>
                {form.file ? form.file.name : 'Attach File (max 3MB)'}
                <input type="file" hidden accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={e => setForm({ ...form, file: e.target.files[0] || null })} />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}
            sx={{ borderRadius: 2, textTransform: 'none' }}>{creating ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={!!viewOpen} onClose={() => setViewOpen(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{viewOpen?.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {viewOpen?.class_name} • {viewOpen?.subject_name} • Due: {viewOpen?.due_date}
              </Typography>
            </Box>
            <IconButton onClick={() => setViewOpen(null)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {subLoading ? <LinearProgress /> : submissions.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>No submissions yet.</Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Late</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>File</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{sub.student_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{sub.admission_no}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{sub.is_late ? <Chip label="Late" size="small" color="error" sx={{ height: 20 }} /> : <Chip label="On time" size="small" color="success" sx={{ height: 20 }} />}</TableCell>
                      <TableCell>
                        {sub.attachment_url ? (
                          <IconButton size="small" href={sub.attachment_url} target="_blank" sx={{ color: PRIMARY }}>
                            <Download sx={{ fontSize: 16 }} />
                          </IconButton>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'graded' ? (
                          <Chip label={`${sub.marks_obtained}/${viewOpen?.max_marks || 20}`} size="small" color="success" />
                        ) : (
                          <TextField size="small" type="number" sx={{ width: 70 }}
                            value={gradeData[sub.id]?.marks_obtained || ''}
                            onChange={e => setGradeData({ ...gradeData, [sub.id]: { ...gradeData[sub.id], marks_obtained: e.target.value } })} />
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'graded' ? (
                          <Typography variant="caption">{sub.teacher_remarks || '-'}</Typography>
                        ) : (
                          <TextField size="small" sx={{ width: 100 }} placeholder="Remarks"
                            value={gradeData[sub.id]?.teacher_remarks || ''}
                            onChange={e => setGradeData({ ...gradeData, [sub.id]: { ...gradeData[sub.id], teacher_remarks: e.target.value } })} />
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.status !== 'graded' && (
                          <Button size="small" variant="contained" onClick={() => handleGrade(viewOpen.id, sub.id)}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 2 }}>Grade</Button>
                        )}
                        {sub.status === 'graded' && <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
