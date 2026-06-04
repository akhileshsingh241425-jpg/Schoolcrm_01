import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';
import {
  Upload, Description, CheckCircle, HourglassEmpty, ThumbDown,
  Refresh, Close, CloudUpload
} from '@mui/icons-material';
import { academicsAPI, dashboardAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function TeacherQuestionPaper() {
  const [exams, setExams] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedExam, setSelectedExam] = useState('');
  const [form, setForm] = useState({
    exam_id: '', class_id: '', subject_id: '', set_name: 'A',
    max_marks: 100, duration_minutes: 180, instructions: ''
  });
  const [file, setFile] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    Promise.all([
      academicsAPI.listExams({}).catch(() => ({ data: { data: { items: [] } } })),
      dashboardAPI.getTeacher().catch(() => ({ data: { data: {} } })),
    ]).then(([exRes, dashRes]) => {
      const ed = exRes.data?.data;
      setExams(Array.isArray(ed) ? ed : ed?.items || []);
      setMySubjects(dashRes.data?.data?.my_subjects || []);
    }).finally(() => setLoading(false));
  }, []);

  const loadPapers = (examId) => {
    if (!examId) return;
    examMgmtAPI.listQuestionPapers(examId)
      .then(res => setPapers(res.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => { if (selectedExam) loadPapers(selectedExam); }, [selectedExam]);

  const handleUpload = async () => {
    if (!file || !form.exam_id || !form.class_id || !form.subject_id) {
      toast.error('Select exam, class, subject and file');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB limit');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('class_id', form.class_id);
      formData.append('subject_id', form.subject_id);
      formData.append('set_name', form.set_name);
      formData.append('max_marks', form.max_marks);
      formData.append('duration_minutes', form.duration_minutes);
      formData.append('instructions', form.instructions);

      await examMgmtAPI.uploadQuestionPaper(form.exam_id, formData);
      toast.success('Question paper uploaded successfully');
      setUploadOpen(false);
      setFile(null);
      setForm({ ...form, instructions: '' });
      if (selectedExam) loadPapers(selectedExam);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const statusConfig = {
    submitted: { color: '#f59e0b', label: 'Submitted' },
    hod_approved: { color: '#3b82f6', label: 'HOD Approved' },
    collected: { color: '#10b981', label: 'Collected' },
    final_approved: { color: '#8b5cf6', label: 'Final Approved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
  };

  const uniqueClasses = [...new Map(mySubjects.map(s => [s.class_id, { id: s.class_id, name: s.class_name }])).values()];
  const uniqueSubjects = [...new Map(mySubjects.filter(s => !form.class_id || s.class_id === parseInt(form.class_id)).map(s => [s.subject_id, { id: s.subject_id, name: s.subject_name }])).values()];

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Question Paper Upload</Typography>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={() => setUploadOpen(true)}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Upload Paper
        </Button>
      </Box>

      {/* Exam Selector */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField select size="small" label="Select Exam" value={selectedExam}
          onChange={e => setSelectedExam(e.target.value)} sx={{ minWidth: 250 }}>
          {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>
      </Paper>

      {/* My Papers */}
      {papers.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>My Uploaded Papers</Typography>
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
                <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {papers.map(p => {
                const sc = statusConfig[p.status] || statusConfig.submitted;
                return (
                  <TableRow key={p.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{p.subject_name || '-'}</Typography></TableCell>
                    <TableCell>{p.class_name || '-'}</TableCell>
                    <TableCell><Chip label={p.set_name || 'A'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{p.max_marks}</TableCell>
                    <TableCell>{p.duration_minutes} min</TableCell>
                    <TableCell>
                      <Chip label={sc.label} size="small"
                        sx={{ fontWeight: 600, bgcolor: alpha(sc.color, 0.12), color: sc.color, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 150 }}>
                      {p.review_remarks || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : selectedExam ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No papers uploaded for this exam yet.</Typography>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 3 }}>Select an exam to view your uploaded papers.</Alert>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Upload Question Paper</Typography>
            <IconButton onClick={() => setUploadOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Exam" value={form.exam_id}
                onChange={e => setForm({ ...form, exam_id: e.target.value })}>
                {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Class" value={form.class_id}
                onChange={e => setForm({ ...form, class_id: e.target.value })}>
                {uniqueClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Subject" value={form.subject_id}
                onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                {uniqueSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Set Name" value={form.set_name}
                onChange={e => setForm({ ...form, set_name: e.target.value })} placeholder="A" />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="number" label="Max Marks" value={form.max_marks}
                onChange={e => setForm({ ...form, max_marks: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="number" label="Duration (min)" value={form.duration_minutes}
                onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Instructions (optional)"
                value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth startIcon={<Upload />}
                sx={{ borderRadius: 2, textTransform: 'none', py: 1.5, borderStyle: 'dashed' }}>
                {file ? file.name : 'Choose PDF File (max 5MB)'}
                <input type="file" hidden accept=".pdf" onChange={e => setFile(e.target.files[0])} />
              </Button>
              {file && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !file}
            startIcon={<CloudUpload />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
