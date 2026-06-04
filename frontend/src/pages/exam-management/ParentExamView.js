import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, Grid, Card, CardContent, Tabs, Tab, TextField, MenuItem,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  Assessment, CalendarMonth, EmojiEvents, Report, Close, Add, Send
} from '@mui/icons-material';
import { academicsAPI, parentAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

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

export default function ParentExamView() {
  const [tab, setTab] = useState(0);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [dateSheet, setDateSheet] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [gForm, setGForm] = useState({ exam_schedule_id: '', student_id: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    Promise.all([
      academicsAPI.listExams({}).catch(() => ({ data: { data: { items: [] } } })),
      examMgmtAPI.listGrievances({}).catch(() => ({ data: { data: [] } })),
    ]).then(([exRes, gRes]) => {
      const ed = exRes.data?.data;
      setExams(Array.isArray(ed) ? ed : ed?.items || []);
      const gd = gRes.data?.data;
      setGrievances(Array.isArray(gd) ? gd : gd?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const loadDateSheet = (examId) => {
    examMgmtAPI.getDateSheet(examId)
      .then(res => {
        const ds = res.data?.data;
        if (ds?.status === 'approved') {
          setDateSheet(ds.schedules || []);
        } else {
          setDateSheet([]);
        }
      })
      .catch(() => setDateSheet([]));
  };

  const loadResults = (examId) => {
    academicsAPI.getStudentResults(0, { exam_id: examId })
      .then(res => setResults(res.data?.data || []))
      .catch(() => setResults([]));
  };

  const handleGrievance = async () => {
    if (!gForm.reason || !gForm.exam_schedule_id) {
      toast.error('Select subject and provide reason');
      return;
    }
    setSubmitting(true);
    try {
      await examMgmtAPI.createGrievance({
        exam_schedule_id: parseInt(gForm.exam_schedule_id),
        student_id: gForm.student_id ? parseInt(gForm.student_id) : undefined,
        reason: gForm.reason,
      });
      toast.success('Grievance submitted successfully');
      setGrievanceOpen(false);
      setGForm({ exam_schedule_id: '', student_id: '', reason: '' });
      // Reload grievances
      examMgmtAPI.listGrievances({}).then(res => {
        const gd = res.data?.data;
        setGrievances(Array.isArray(gd) ? gd : gd?.items || []);
      });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const publishedExams = exams.filter(e => e.status === 'results_published');
  const upcomingExams = exams.filter(e => ['upcoming', 'ongoing'].includes(e.status));

  const statusConfig = {
    pending: { color: '#f59e0b', label: 'Pending' },
    under_review: { color: '#3b82f6', label: 'Under Review' },
    resolved: { color: '#10b981', label: 'Resolved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Exam Results & Grievances</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3,
        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab icon={<CalendarMonth sx={{ fontSize: 18 }} />} iconPosition="start" label="Date Sheet" />
        <Tab icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" label="Results" />
        <Tab icon={<Report sx={{ fontSize: 18 }} />} iconPosition="start" label="Grievances" />
      </Tabs>

      {/* Date Sheet */}
      {tab === 0 && (
        <Box>
          {upcomingExams.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No upcoming exams.</Alert>
          ) : (
            upcomingExams.map(exam => (
              <Paper key={exam.id} sx={{ borderRadius: 3, mb: 2, cursor: 'pointer' }}
                onClick={() => loadDateSheet(exam.id)}>
                <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{exam.start_date} → {exam.end_date}</Typography>
                  </Box>
                  <Chip label="View Schedule" size="small" color="primary" />
                </Box>
              </Paper>
            ))
          )}
          {dateSheet.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 3, mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max Marks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dateSheet.map(s => (
                    <TableRow key={s.id}>
                      <TableCell><Chip label={s.exam_date} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} /></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{s.subject?.name || s.subject_name || '-'}</Typography></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</TableCell>
                      <TableCell>{s.max_marks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Results */}
      {tab === 1 && (
        <Box>
          {publishedExams.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No published results yet.</Alert>
          ) : (
            publishedExams.map(exam => (
              <Paper key={exam.id} sx={{ borderRadius: 3, mb: 2, cursor: 'pointer' }}
                onClick={() => loadResults(exam.id)}>
                <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{exam.start_date} → {exam.end_date}</Typography>
                  </Box>
                  <Chip icon={<EmojiEvents sx={{ fontSize: 14 }} />} label="View" size="small" color="success" />
                </Box>
              </Paper>
            ))
          )}
          {results.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 3, mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Obtained</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r, idx) => {
                    const pct = r.max_marks > 0 ? Math.round((r.marks_obtained || 0) / r.max_marks * 100) : 0;
                    const { grade, color } = calcGrade(pct);
                    const pass = (r.marks_obtained || 0) >= (r.passing_marks || 33);
                    return (
                      <TableRow key={idx}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{r.subject_name || '-'}</Typography></TableCell>
                        <TableCell>{r.max_marks}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{r.is_absent ? 'AB' : r.marks_obtained}</TableCell>
                        <TableCell>
                          <Chip label={r.is_absent ? 'AB' : grade} size="small"
                            sx={{ fontWeight: 700, bgcolor: alpha(color, 0.12), color, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={r.is_absent ? 'Absent' : pass ? 'Pass' : 'Fail'} size="small"
                            color={pass && !r.is_absent ? 'success' : 'error'} sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Grievances */}
      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setGrievanceOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              Raise Grievance
            </Button>
          </Box>

          {grievances.length > 0 ? (
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Resolution</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grievances.map(g => {
                    const sc = statusConfig[g.status] || statusConfig.pending;
                    return (
                      <TableRow key={g.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{g.subject_name || '-'}</Typography></TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                          <Typography variant="body2" noWrap>{g.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={sc.label} size="small"
                            sx={{ fontWeight: 600, bgcolor: alpha(sc.color, 0.12), color: sc.color, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {g.resolution_remarks || '-'}
                          {g.corrected_marks && <Chip label={`New: ${g.corrected_marks}`} size="small" color="success" sx={{ ml: 0.5, fontSize: '0.65rem' }} />}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {g.created_at ? new Date(g.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No grievances raised yet.</Alert>
          )}
        </Box>
      )}

      {/* Grievance Dialog */}
      <Dialog open={grievanceOpen} onClose={() => setGrievanceOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Raise Grievance</Typography>
            <IconButton onClick={() => setGrievanceOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Exam Schedule ID (Subject)" value={gForm.exam_schedule_id}
                onChange={e => setGForm({ ...gForm, exam_schedule_id: e.target.value })}
                helperText="Enter the schedule ID for the subject you want to raise grievance about" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Student ID (optional)" value={gForm.student_id}
                onChange={e => setGForm({ ...gForm, student_id: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Reason for Grievance"
                value={gForm.reason} onChange={e => setGForm({ ...gForm, reason: e.target.value })}
                placeholder="Explain why you believe the marks need rechecking..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGrievanceOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleGrievance} disabled={submitting || !gForm.reason}
            startIcon={<Send />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {submitting ? 'Submitting...' : 'Submit Grievance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
