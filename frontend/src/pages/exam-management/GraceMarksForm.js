import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, TextField, MenuItem, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';
import { Add, Refresh, Close, History } from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function GraceMarksForm() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [graceHistory, setGraceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({
    level: 'class', class_id: '', subject_id: '', student_id: '',
    marks_value: '', reason: ''
  });
  const theme = useTheme();

  useEffect(() => {
    academicsAPI.listExams({})
      .then(res => {
        const ed = res.data?.data;
        setExams(Array.isArray(ed) ? ed : ed?.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadHistory = (examId) => {
    setSelectedExam(examId);
    examMgmtAPI.getGraceMarks(examId)
      .then(res => setGraceHistory(res.data?.data || []))
      .catch(() => {});
  };

  const handleApply = async () => {
    if (!selectedExam || !form.marks_value || !form.reason) {
      toast.error('Marks value and reason required');
      return;
    }
    setApplying(true);
    try {
      await examMgmtAPI.applyGraceMarks(selectedExam, {
        level: form.level,
        class_id: form.class_id ? parseInt(form.class_id) : undefined,
        subject_id: form.subject_id ? parseInt(form.subject_id) : undefined,
        student_id: form.student_id ? parseInt(form.student_id) : undefined,
        marks_value: parseFloat(form.marks_value),
        reason: form.reason,
      });
      toast.success('Grace marks applied successfully');
      setApplyOpen(false);
      setForm({ level: 'class', class_id: '', subject_id: '', student_id: '', marks_value: '', reason: '' });
      loadHistory(selectedExam);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setApplying(false); }
  };

  const levelConfig = {
    class: { color: '#3b82f6', label: 'Class-wide' },
    subject: { color: '#f59e0b', label: 'Subject-specific' },
    individual: { color: '#8b5cf6', label: 'Individual' },
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Grace Marks</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setApplyOpen(true)}
          disabled={!selectedExam}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Apply Grace Marks
        </Button>
      </Box>

      {/* Select Exam */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField select size="small" label="Select Exam" value={selectedExam} sx={{ minWidth: 250 }}
          onChange={e => loadHistory(e.target.value)}>
          {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>
      </Paper>

      {/* Grace Marks History */}
      {selectedExam && (
        graceHistory.length > 0 ? (
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
              <History sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={700}>Grace Marks History ({graceHistory.length})</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Applied At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {graceHistory.map(g => {
                    const lc = levelConfig[g.level] || levelConfig.class;
                    return (
                      <TableRow key={g.id} hover>
                        <TableCell>
                          <Chip label={lc.label} size="small"
                            sx={{ fontWeight: 600, bgcolor: alpha(lc.color, 0.12), color: lc.color, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#10b981' }}>+{g.marks_value}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                          <Typography variant="body2" noWrap>{g.reason}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{g.class_name || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{g.subject_name || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{g.student_name || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {g.applied_at ? new Date(g.applied_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            No grace marks applied for this exam yet.
          </Alert>
        )
      )}

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Apply Grace Marks</Typography>
            <IconButton onClick={() => setApplyOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Level" value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}>
                <MenuItem value="class">Class-wide (all students in class)</MenuItem>
                <MenuItem value="subject">Subject-specific (all students in subject)</MenuItem>
                <MenuItem value="individual">Individual Student</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Grace Marks Value" value={form.marks_value}
                onChange={e => setForm({ ...form, marks_value: e.target.value })}
                helperText="Marks to add (e.g. 2, 5)" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Class ID (optional)" value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })} />
            </Grid>
            {form.level !== 'class' && (
              <Grid item xs={6}>
                <TextField fullWidth label="Subject ID" value={form.subject_id}
                  onChange={e => setForm({ ...form, subject_id: e.target.value })} />
              </Grid>
            )}
            {form.level === 'individual' && (
              <Grid item xs={6}>
                <TextField fullWidth label="Student ID" value={form.student_id}
                  onChange={e => setForm({ ...form, student_id: e.target.value })} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Reason"
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason for applying grace marks..." />
            </Grid>
          </Grid>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
            Grace marks will be added to existing marks. Ensure total does not exceed max marks.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApplyOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleApply} disabled={applying || !form.marks_value || !form.reason}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {applying ? 'Applying...' : 'Apply Grace Marks'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
