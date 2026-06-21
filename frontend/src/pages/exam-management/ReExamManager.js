import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid
} from '@mui/material';
import { Replay, Refresh, Add, Close } from '@mui/icons-material';
import { validateForm } from '../../components/Validation';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function ReExamManager({ exam }) {
  const [reExams, setReExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    re_exam_type: 'compartment', new_exam_date: '', start_time: '09:00',
    end_time: '11:00', class_id: '', subject_id: '', reason: '', max_marks: 100
  });
  const [creating, setCreating] = useState(false);
  const theme = useTheme();

  const loadReExams = () => {
    if (!exam) return;
    setLoading(true);
    examMgmtAPI.listReExams(exam.id)
      .then(res => setReExams(res.data?.data || []))
      .catch(() => toast.error('Failed to load re-exams'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReExams(); }, [exam?.id]);

  const handleCreate = async () => {
    const errs = validateForm(form, { new_exam_date: ['required'], re_exam_type: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    setCreating(true);
    try {
      await examMgmtAPI.createReExam(exam.id, {
        re_exam_type: form.re_exam_type,
        new_exam_date: form.new_exam_date,
        start_time: form.start_time,
        end_time: form.end_time,
        class_id: form.class_id ? parseInt(form.class_id) : undefined,
        subject_id: form.subject_id ? parseInt(form.subject_id) : undefined,
        reason: form.reason,
        max_marks: parseInt(form.max_marks) || 100,
      });
      toast.success('Re-exam created');
      setCreateOpen(false);
      setForm({ re_exam_type: 'compartment', new_exam_date: '', start_time: '09:00', end_time: '11:00', class_id: '', subject_id: '', reason: '', max_marks: 100 });
      loadReExams();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const typeConfig = {
    compartment: { color: '#f59e0b', label: 'Compartment' },
    supplementary: { color: '#3b82f6', label: 'Supplementary' },
    improvement: { color: '#10b981', label: 'Improvement' },
    rescheduled: { color: '#8b5cf6', label: 'Rescheduled' },
  };

  if (!exam) return <Alert severity="info">Pehle exam select karo</Alert>;
  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Re-Examinations: {exam.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Create Re-Exam
          </Button>
          <IconButton onClick={loadReExams}><Refresh /></IconButton>
        </Box>
      </Box>

      {reExams.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Replay sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No re-examinations scheduled for this exam.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reExams.map(re => {
                const tc = typeConfig[re.re_exam_type] || typeConfig.compartment;
                return (
                  <TableRow key={re.id} hover>
                    <TableCell>
                      <Chip label={tc.label} size="small"
                        sx={{ fontWeight: 600, bgcolor: alpha(tc.color, 0.12), color: tc.color, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{re.subject_name || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{re.class_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{re.new_exam_date || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {re.start_time?.slice(0, 5)} - {re.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 150 }}>
                      <Typography variant="body2" noWrap>{re.reason || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={re.status || 'scheduled'} size="small" color="primary" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Re-Exam Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Create Re-Examination</Typography>
            <IconButton onClick={() => setCreateOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Re-Exam Type" value={form.re_exam_type}
                onChange={e => setForm({ ...form, re_exam_type: e.target.value })}>
                <MenuItem value="compartment">Compartment</MenuItem>
                <MenuItem value="supplementary">Supplementary</MenuItem>
                <MenuItem value="improvement">Improvement</MenuItem>
                <MenuItem value="rescheduled">Rescheduled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="date" label="Exam Date" InputLabelProps={{ shrink: true }}
                value={form.new_exam_date} onChange={e => setForm({ ...form, new_exam_date: e.target.value })} />
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
              <TextField fullWidth label="Class ID (optional)" value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Reason"
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason for re-examination..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}
            startIcon={<Add />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
