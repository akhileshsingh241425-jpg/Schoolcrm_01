import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem, Chip, Avatar,
  LinearProgress, Alert, Card, CardContent, alpha, useTheme, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Tooltip
} from '@mui/material';
import {
  MenuBook, Add, CheckCircle, Schedule, Refresh, TrendingUp, Edit
} from '@mui/icons-material';
import { academicsAPI, dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherSyllabus() {
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [syllabus, setSyllabus] = useState([]);
  const [sylLoading, setSylLoading] = useState(false);
  const [progressDialog, setProgressDialog] = useState(null);
  const [progressForm, setProgressForm] = useState({ topics_covered: '', date: new Date().toISOString().split('T')[0], percentage: 0 });
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    dashboardAPI.getTeacher()
      .then(res => setMySubjects(res.data?.data?.my_subjects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSyllabus = () => {
    if (!selectedClass || !selectedSubject) { toast.error('Select class and subject'); return; }
    setSylLoading(true);
    academicsAPI.listSyllabus({ class_id: selectedClass, subject_id: selectedSubject })
      .then(res => {
        const data = res.data?.data;
        setSyllabus(Array.isArray(data) ? data : data?.items || []);
      })
      .catch(() => toast.error('Failed to load syllabus'))
      .finally(() => setSylLoading(false));
  };

  const handleAddProgress = async () => {
    if (!progressDialog) return;
    try {
      await academicsAPI.addSyllabusProgress(progressDialog.id, {
        topics_covered: progressForm.topics_covered,
        date: progressForm.date,
        percentage: progressForm.percentage,
      });
      toast.success('Progress updated!');
      setProgressDialog(null);
      setProgressForm({ topics_covered: '', date: new Date().toISOString().split('T')[0], percentage: 0 });
      loadSyllabus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const uniqueClasses = [...new Map(mySubjects.map(s => [s.class_id, { id: s.class_id, name: s.class_name }])).values()];
  const uniqueSubjects = [...new Map(mySubjects.filter(s => !selectedClass || s.class_id === parseInt(selectedClass)).map(s => [s.subject_id, { id: s.subject_id, name: s.subject_name }])).values()];

  const totalChapters = syllabus.length;
  const completedChapters = syllabus.filter(s => s.completion_percentage >= 100).length;
  const overallProgress = totalChapters > 0 ? Math.round(syllabus.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / totalChapters) : 0;

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Syllabus & Curriculum</Typography>
        <IconButton onClick={loadSyllabus}><Refresh /></IconButton>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Class" value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}>
              {uniqueClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select size="small" label="Subject" value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}>
              {uniqueSubjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button fullWidth variant="contained" onClick={loadSyllabus} disabled={sylLoading}
              startIcon={<MenuBook />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              {sylLoading ? 'Loading...' : 'Load Syllabus'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Overview Stats */}
      {syllabus.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 3, bgcolor: alpha(PRIMARY, 0.05) }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} color="primary">{totalChapters}</Typography>
                <Typography variant="caption" color="text.secondary">Total Chapters</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 3, bgcolor: alpha('#10b981', 0.05) }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#10b981' }}>{completedChapters}</Typography>
                <Typography variant="caption" color="text.secondary">Completed</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 3, bgcolor: alpha('#f59e0b', 0.05) }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#f59e0b' }}>{totalChapters - completedChapters}</Typography>
                <Typography variant="caption" color="text.secondary">Remaining</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 3, bgcolor: alpha('#3b82f6', 0.05) }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#3b82f6' }}>{overallProgress}%</Typography>
                <Typography variant="caption" color="text.secondary">Overall Progress</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Syllabus Chapters */}
      {syllabus.length > 0 ? (
        <Stack spacing={1.5}>
          {syllabus.map((ch, idx) => {
            const pct = ch.completion_percentage || 0;
            const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#94a3b8';
            return (
              <Card key={ch.id} variant="outlined" sx={{ borderRadius: 3, borderLeft: `4px solid ${color}` }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={`Ch ${ch.chapter_number || idx + 1}`} size="small"
                          sx={{ fontWeight: 700, bgcolor: alpha(color, 0.12), color }} />
                        <Typography variant="body1" fontWeight={700}>{ch.chapter_name || ch.title || 'Chapter'}</Typography>
                      </Box>
                      {ch.topics && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Topics: {typeof ch.topics === 'string' ? ch.topics : JSON.stringify(ch.topics)}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                          sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(color, 0.15),
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color, minWidth: 35 }}>{pct}%</Typography>
                      </Box>
                    </Box>
                    <Tooltip title="Update Progress">
                      <IconButton size="small" onClick={() => setProgressDialog(ch)}
                        sx={{ color: PRIMARY, bgcolor: alpha(PRIMARY, 0.08) }}>
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : !sylLoading && selectedClass && selectedSubject ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No syllabus defined for this class/subject yet. Ask admin to add syllabus chapters.
        </Alert>
      ) : null}

      {/* Progress Update Dialog */}
      <Dialog open={!!progressDialog} onClose={() => setProgressDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Update Progress</Typography></DialogTitle>
        <DialogContent>
          {progressDialog && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                {progressDialog.chapter_name || progressDialog.title}
              </Typography>
              <TextField fullWidth size="small" label="Topics Covered Today" multiline rows={2}
                value={progressForm.topics_covered}
                onChange={e => setProgressForm({ ...progressForm, topics_covered: e.target.value })}
                sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" type="date" label="Date" InputLabelProps={{ shrink: true }}
                    value={progressForm.date}
                    onChange={e => setProgressForm({ ...progressForm, date: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" type="number" label="Completion %" inputProps={{ min: 0, max: 100 }}
                    value={progressForm.percentage}
                    onChange={e => setProgressForm({ ...progressForm, percentage: parseInt(e.target.value) || 0 })} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProgressDialog(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProgress} sx={{ borderRadius: 2, textTransform: 'none' }}>Save Progress</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
