import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid
} from '@mui/material';
import {
  Description, CheckCircle, HourglassEmpty, ThumbDown, ThumbUp,
  Refresh, Close
} from '@mui/icons-material';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function QuestionPaperTracker({ exam }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const theme = useTheme();

  const loadPapers = () => {
    if (!exam) return;
    setLoading(true);
    examMgmtAPI.listQuestionPapers(exam.id)
      .then(res => setPapers(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPapers(); }, [exam?.id]);

  const handleApprove = async (status) => {
    if (!selectedPaper) return;
    setReviewing(true);
    try {
      await examMgmtAPI.approveQuestionPaper(selectedPaper.id, {
        status,
        remarks: reviewRemarks,
      });
      toast.success(status === 'rejected' ? 'Paper rejected' : 'Paper approved');
      setReviewOpen(false);
      setSelectedPaper(null);
      setReviewRemarks('');
      loadPapers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setReviewing(false); }
  };

  const handleCollect = async (paperId) => {
    try {
      await examMgmtAPI.approveQuestionPaper(paperId, { status: 'collected' });
      toast.success('Paper marked as collected');
      loadPapers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusConfig = {
    submitted: { color: '#f59e0b', label: 'Submitted' },
    hod_approved: { color: '#3b82f6', label: 'HOD Approved' },
    collected: { color: '#10b981', label: 'Collected' },
    final_approved: { color: '#8b5cf6', label: 'Final Approved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
  };

  if (!exam) return <Alert severity="info">Pehle exam select karo</Alert>;
  if (loading) return <LinearProgress />;

  const submitted = papers.filter(p => p.status === 'submitted').length;
  const approved = papers.filter(p => ['hod_approved', 'collected', 'final_approved'].includes(p.status)).length;
  const rejected = papers.filter(p => p.status === 'rejected').length;

  return (
    <Box>
      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #f59e0b' }}>
            <Typography variant="h5" fontWeight={800} color="#f59e0b">{submitted}</Typography>
            <Typography variant="caption" color="text.secondary">Pending Review</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #10b981' }}>
            <Typography variant="h5" fontWeight={800} color="#10b981">{approved}</Typography>
            <Typography variant="caption" color="text.secondary">Approved/Collected</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #ef4444' }}>
            <Typography variant="h5" fontWeight={800} color="#ef4444">{rejected}</Typography>
            <Typography variant="caption" color="text.secondary">Rejected</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Papers Table */}
      {papers.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Description sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Koi question paper upload nahi hua</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Teachers apne portal se question papers upload karenge. Yahan unka status track hoga.
          </Typography>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2, textAlign: 'left', maxWidth: 450, mx: 'auto' }}>
            <strong>Flow:</strong> Teacher uploads PDF → Status "Submitted" → You review & approve → Mark as "Collected"
          </Alert>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2" fontWeight={700}>Question Papers ({papers.length})</Typography>
            <IconButton size="small" onClick={loadPapers}><Refresh fontSize="small" /></IconButton>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Set</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Max Marks</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {papers.map(paper => {
                const sc = statusConfig[paper.status] || statusConfig.submitted;
                return (
                  <TableRow key={paper.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{paper.subject_name || '-'}</Typography></TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{paper.class_name || '-'}</TableCell>
                    <TableCell><Chip label={paper.set_name || 'A'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{paper.max_marks}</TableCell>
                    <TableCell>{paper.duration_minutes} min</TableCell>
                    <TableCell>
                      <Chip label={sc.label} size="small"
                        sx={{ fontWeight: 600, bgcolor: alpha(sc.color, 0.12), color: sc.color, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      {paper.status === 'submitted' && (
                        <Button size="small" variant="outlined" color="primary"
                          onClick={() => { setSelectedPaper(paper); setReviewOpen(true); }}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 2 }}>
                          Review
                        </Button>
                      )}
                      {paper.status === 'hod_approved' && (
                        <Button size="small" variant="outlined" color="success"
                          onClick={() => handleCollect(paper.id)}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 2 }}>
                          Mark Collected
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Review Question Paper</Typography>
            <IconButton onClick={() => setReviewOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPaper && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2"><strong>Subject:</strong> {selectedPaper.subject_name}</Typography>
              <Typography variant="body2"><strong>Class:</strong> {selectedPaper.class_name}</Typography>
              <Typography variant="body2"><strong>Set:</strong> {selectedPaper.set_name}</Typography>
              <Typography variant="body2"><strong>Max Marks:</strong> {selectedPaper.max_marks}</Typography>
              <Typography variant="body2"><strong>Duration:</strong> {selectedPaper.duration_minutes} min</Typography>
              <TextField fullWidth multiline rows={3} label="Remarks (required for rejection)" sx={{ mt: 2 }}
                value={reviewRemarks} onChange={e => setReviewRemarks(e.target.value)} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={() => handleApprove('rejected')}
            disabled={reviewing || !reviewRemarks} startIcon={<ThumbDown />}
            sx={{ borderRadius: 2, textTransform: 'none' }}>Reject</Button>
          <Button variant="contained" color="success" onClick={() => handleApprove('hod_approved')}
            disabled={reviewing} startIcon={<ThumbUp />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {reviewing ? 'Processing...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
