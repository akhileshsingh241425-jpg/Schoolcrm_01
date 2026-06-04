import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid
} from '@mui/material';
import {
  Send, CheckCircle, Cancel, Download, Refresh, Schedule, Add, Close,
  Delete, Edit
} from '@mui/icons-material';
import { academicsAPI, studentsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function DateSheetManager({ exam }) {
  const [schedules, setSchedules] = useState([]);
  const [dateSheetStatus, setDateSheetStatus] = useState('draft');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();

  // Add schedule dialog
  const [addOpen, setAddOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    class_id: '', section_id: '', subject_id: '',
    exam_date: '', start_time: '09:00', end_time: '11:00',
    max_marks: 100, passing_marks: 33
  });
  const [adding, setAdding] = useState(false);

  const loadSchedules = useCallback(() => {
    if (!exam) return;
    setLoading(true);
    // Load schedules from academics API (this always works)
    // Also try to get date sheet status from exam-mgmt API
    Promise.all([
      academicsAPI.listSchedules(exam.id).catch(() => ({ data: { data: [] } })),
      examMgmtAPI.getDateSheet(exam.id).catch(() => ({ data: { data: {} } })),
      studentsAPI.listClasses().catch(() => ({ data: { data: [] } })),
      academicsAPI.listSubjects({}).catch(() => ({ data: { data: [] } })),
    ]).then(([schedRes, dsRes, clRes, subRes]) => {
      setSchedules(schedRes.data?.data || []);
      
      const ds = dsRes.data?.data;
      setDateSheetStatus(ds?.status || 'draft');
      setRejectionRemarks(ds?.rejection_remarks || '');

      const cl = clRes.data?.data;
      setClasses(Array.isArray(cl) ? cl : cl?.items || []);
      const su = subRes.data?.data;
      setSubjects(Array.isArray(su) ? su : su?.items || []);
    }).finally(() => setLoading(false));
  }, [exam]);

  useEffect(() => { loadSchedules(); }, [loadSchedules]);

  const loadSections = (classId) => {
    studentsAPI.listSections(classId)
      .then(res => {
        const d = res.data?.data;
        setSections(Array.isArray(d) ? d : d?.items || []);
      }).catch(() => setSections([]));
  };

  const handleAddSchedule = async () => {
    if (!form.class_id || !form.subject_id || !form.exam_date) {
      toast.error('Class, Subject aur Date select karo');
      return;
    }
    setAdding(true);
    try {
      await academicsAPI.addExamSchedule(exam.id, {
        class_id: parseInt(form.class_id),
        section_id: form.section_id ? parseInt(form.section_id) : null,
        subject_id: parseInt(form.subject_id),
        exam_date: form.exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        max_marks: parseInt(form.max_marks) || 100,
        passing_marks: parseInt(form.passing_marks) || 33,
      });
      toast.success('Schedule added!');
      // Reset only subject and date for quick multi-add
      setForm({ ...form, subject_id: '', exam_date: '' });
      loadSchedules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add schedule'); }
    finally { setAdding(false); }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await academicsAPI.deleteSchedule(scheduleId);
      toast.success('Schedule deleted');
      loadSchedules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSubmitForApproval = async () => {
    if (schedules.length === 0) {
      toast.error('Pehle schedules add karo, phir submit karo');
      return;
    }
    setSubmitting(true);
    try {
      await examMgmtAPI.submitDateSheet(exam.id);
      toast.success('Date sheet Principal ko approval ke liye bhej di gayi!');
      loadSchedules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const statusColor = {
    draft: '#94a3b8', pending_approval: '#f59e0b', approved: '#10b981', rejected: '#ef4444'
  };
  const statusLabel = {
    draft: 'Draft', pending_approval: 'Pending Approval', approved: 'Approved', rejected: 'Rejected'
  };

  if (!exam) return <Alert severity="info">Pehle ek exam select karo</Alert>;
  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Status + Actions Bar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Date Sheet — {exam.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
              <Chip
                label={statusLabel[dateSheetStatus] || 'Draft'}
                size="small"
                sx={{ fontWeight: 600, bgcolor: alpha(statusColor[dateSheetStatus] || '#94a3b8', 0.15), color: statusColor[dateSheetStatus] }}
              />
              <Typography variant="caption" color="text.secondary">
                {schedules.length} subject schedule(s)
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}
              disabled={dateSheetStatus === 'approved' || dateSheetStatus === 'pending_approval'}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              Add Subject
            </Button>
            {(dateSheetStatus === 'draft' || dateSheetStatus === 'rejected') && schedules.length > 0 && (
              <Button variant="contained" color="warning" startIcon={<Send />}
                onClick={handleSubmitForApproval} disabled={submitting}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                {submitting ? 'Submitting...' : 'Submit for Principal Approval'}
              </Button>
            )}
            <IconButton onClick={loadSchedules} size="small"><Refresh /></IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Rejection Alert */}
      {dateSheetStatus === 'rejected' && rejectionRemarks && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          <strong>Principal ne reject kiya:</strong> {rejectionRemarks}<br />
          <Typography variant="caption">Schedules edit karo aur dobara submit karo.</Typography>
        </Alert>
      )}

      {/* Approved Alert */}
      {dateSheetStatus === 'approved' && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          Date sheet approved! Students aur parents ko ab ye visible hai.
        </Alert>
      )}

      {/* Pending Alert */}
      {dateSheetStatus === 'pending_approval' && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Principal ke approval ka wait karo. Jab tak approve nahi hoti, students ko nahi dikhegi.
        </Alert>
      )}

      {/* Schedules Table */}
      {schedules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Schedule sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Koi schedule nahi hai</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            "Add Subject" button click karo aur har subject ke liye date, time, marks set karo.
          </Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setAddOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Add First Subject Schedule
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Max Marks</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pass Marks</TableCell>
                {dateSheetStatus === 'draft' && <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((s, idx) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Chip label={s.subject?.name || s.subject_name || '-'} size="small"
                      sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    {s.class_name || s.class_ref?.name || '-'}{s.section_name ? ` - ${s.section_name}` : ''}
                  </TableCell>
                  <TableCell>
                    <Chip label={s.exam_date} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{s.max_marks}</TableCell>
                  <TableCell>{s.passing_marks || 33}</TableCell>
                  {dateSheetStatus === 'draft' && (
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => handleDeleteSchedule(s.id)}>
                        <Delete sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Schedule Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Add Subject Schedule</Typography>
              <Typography variant="caption" color="text.secondary">Exam: {exam.name}</Typography>
            </Box>
            <IconButton onClick={() => setAddOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth select label="Class *" value={form.class_id}
                onChange={e => { setForm({ ...form, class_id: e.target.value, section_id: '' }); loadSections(e.target.value); }}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Section (optional)" value={form.section_id}
                onChange={e => setForm({ ...form, section_id: e.target.value })}>
                <MenuItem value="">All Sections</MenuItem>
                {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Subject *" value={form.subject_id}
                onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="date" label="Exam Date *" InputLabelProps={{ shrink: true }}
                value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })}
                inputProps={{ min: exam.start_date, max: exam.end_date }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="time" label="Start Time" InputLabelProps={{ shrink: true }}
                value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="time" label="End Time" InputLabelProps={{ shrink: true }}
                value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Max Marks" value={form.max_marks}
                onChange={e => setForm({ ...form, max_marks: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Passing Marks" value={form.passing_marks}
                onChange={e => setForm({ ...form, passing_marks: e.target.value })} />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Ek ek subject add karo. Same class ke liye multiple subjects add kar sakte ho.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Close</Button>
          <Button variant="contained" onClick={handleAddSchedule} disabled={adding}
            startIcon={<Add />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {adding ? 'Adding...' : 'Add Subject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
