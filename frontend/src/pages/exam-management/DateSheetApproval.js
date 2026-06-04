import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, TextField, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';
import {
  CheckCircle, Cancel, Refresh, Close, CalendarMonth, ThumbUp, ThumbDown
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function DateSheetApproval() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [dateSheet, setDateSheet] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [dsLoading, setDsLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    academicsAPI.listExams({})
      .then(res => {
        const ed = res.data?.data;
        setExams(Array.isArray(ed) ? ed : ed?.items || []);
      })
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const loadDateSheet = (exam) => {
    setSelectedExam(exam);
    setDsLoading(true);
    examMgmtAPI.getDateSheet(exam.id)
      .then(res => {
        const ds = res.data?.data;
        setDateSheet(ds);
        setSchedules(ds?.schedules || []);
      })
      .catch(() => toast.error('Failed to load date sheet'))
      .finally(() => setDsLoading(false));
  };

  const handleApprove = async () => {
    if (!selectedExam) return;
    setProcessing(true);
    try {
      await examMgmtAPI.approveDateSheet(selectedExam.id);
      toast.success('Date sheet approved and published');
      loadDateSheet(selectedExam);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!selectedExam || !remarks) {
      toast.error('Please provide rejection remarks');
      return;
    }
    setProcessing(true);
    try {
      await examMgmtAPI.rejectDateSheet(selectedExam.id, { remarks });
      toast.success('Date sheet rejected');
      setRejectOpen(false);
      setRemarks('');
      loadDateSheet(selectedExam);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  };

  const pendingExams = exams.filter(e => e.status === 'upcoming' || e.status === 'ongoing');

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Date Sheet Approval</Typography>

      {/* Exam List */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700}>Select Exam to Review</Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 200 }}>
          <Table size="small">
            <TableBody>
              {pendingExams.map(exam => (
                <TableRow key={exam.id} hover sx={{ cursor: 'pointer',
                  bgcolor: selectedExam?.id === exam.id ? alpha(theme.palette.primary.main, 0.06) : undefined }}
                  onClick={() => loadDateSheet(exam)}>
                  <TableCell><Typography variant="body2" fontWeight={600}>{exam.name}</Typography></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{exam.start_date} → {exam.end_date}</TableCell>
                  <TableCell>
                    <Chip label={exam.status} size="small" sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} />
                  </TableCell>
                </TableRow>
              ))}
              {pendingExams.length === 0 && (
                <TableRow><TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">No pending exams</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Date Sheet Review */}
      {selectedExam && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{selectedExam.name} — Date Sheet</Typography>
              <Chip
                label={dateSheet?.status?.replace('_', ' ')?.toUpperCase() || 'DRAFT'}
                size="small"
                sx={{ mt: 0.5, fontWeight: 600, fontSize: '0.7rem',
                  bgcolor: alpha(dateSheet?.status === 'approved' ? '#10b981' : dateSheet?.status === 'pending_approval' ? '#f59e0b' : '#94a3b8', 0.12),
                  color: dateSheet?.status === 'approved' ? '#10b981' : dateSheet?.status === 'pending_approval' ? '#f59e0b' : '#94a3b8'
                }}
              />
            </Box>
            {dateSheet?.status === 'pending_approval' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" color="success" startIcon={<ThumbUp />}
                  onClick={handleApprove} disabled={processing}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                  Approve
                </Button>
                <Button variant="outlined" color="error" startIcon={<ThumbDown />}
                  onClick={() => setRejectOpen(true)} disabled={processing}
                  sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Reject
                </Button>
              </Box>
            )}
          </Box>

          {dsLoading ? <LinearProgress /> : schedules.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No schedules in this date sheet yet.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max Marks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((s, idx) => (
                    <TableRow key={s.id} hover>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{s.subject?.name || s.subject_name || '-'}</Typography></TableCell>
                      <TableCell>{s.class_name || '-'}{s.section_name ? ` - ${s.section_name}` : ''}</TableCell>
                      <TableCell><Chip label={s.exam_date} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.max_marks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Reject Date Sheet</Typography>
            <IconButton onClick={() => setRejectOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={4} label="Rejection Remarks" sx={{ mt: 1 }}
            value={remarks} onChange={e => setRemarks(e.target.value)}
            placeholder="Explain why the date sheet is being rejected..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={processing || !remarks}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {processing ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
