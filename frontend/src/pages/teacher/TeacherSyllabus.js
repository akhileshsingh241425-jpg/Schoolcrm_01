import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem, Chip, Avatar,
  LinearProgress, Alert, Card, CardContent, alpha, useTheme, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Tooltip,
  FormControlLabel, Switch, TableContainer, Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import {
  MenuBook, Add, CheckCircle, Schedule, Refresh, TrendingUp, Edit, FactCheck
} from '@mui/icons-material';
import { validateForm } from '../../components/Validation';
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
  const [progressForm, setProgressForm] = useState({ chapter_number: '', chapter_name: '', percentage: 0 });
  const [examDialog, setExamDialog] = useState(null);
  const [examForm, setExamForm] = useState({ include_in_exam: false, exam_weightage: '', exam_topics: '' });
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [chapterForm, setChapterForm] = useState({ chapter_number: '', chapter_name: '', topics: '', date: new Date().toISOString().split('T')[0] });
  const [chapterSaving, setChapterSaving] = useState(false);
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
    if (!progressForm.chapter_number || !progressForm.chapter_name) {
      toast.error('Chapter number and name are required');
      return;
    }
    try {
      await academicsAPI.addSyllabusProgress(progressDialog.id, {
        chapter_number: parseInt(progressForm.chapter_number),
        chapter_name: progressForm.chapter_name,
        percentage_covered: progressForm.percentage || null,
      });
      toast.success('Progress added!');
      setProgressDialog(null);
      setProgressForm({ chapter_number: '', chapter_name: '', percentage: 0 });
      loadSyllabus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleExamSetting = async () => {
    if (!examDialog) return;
    try {
      await academicsAPI.updateSyllabusExamSetting(examDialog.id, {
        include_in_exam: examForm.include_in_exam,
        exam_weightage: examForm.exam_weightage ? parseInt(examForm.exam_weightage) : null,
        exam_topics: examForm.exam_topics || null,
      });
      toast.success(examForm.include_in_exam ? 'Marked for exam' : 'Removed from exam');
      setExamDialog(null);
      setExamForm({ include_in_exam: false, exam_weightage: '', exam_topics: '' });
      loadSyllabus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update exam setting');
    }
  };

  const handleAddChapter = async () => {
    if (!chapterForm.chapter_number || !chapterForm.chapter_name) {
      toast.error('Chapter number and name are required');
      return;
    }
    setChapterSaving(true);
    try {
      await academicsAPI.createSyllabus({
        class_id: parseInt(selectedClass),
        subject_id: parseInt(selectedSubject),
        chapter_number: parseInt(chapterForm.chapter_number),
        chapter_name: chapterForm.chapter_name,
        chapter_added_date: chapterForm.date || undefined,
        topics: chapterForm.topics || undefined,
      });
      toast.success('Chapter added');
      setAddChapterOpen(false);
      setChapterForm({ chapter_number: '', chapter_name: '', topics: '', date: new Date().toISOString().split('T')[0] });
      loadSyllabus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add chapter');
    }
    setChapterSaving(false);
  };

  const handleOpenExam = (ch) => {
    setExamForm({
      include_in_exam: ch.exam_included || false,
      exam_weightage: ch.exam_weightage || '',
      exam_topics: ch.exam_topics || '',
    });
    setExamDialog(ch);
  };

  const chapters = syllabus.filter(s => s.chapter_number !== null && s.chapter_number !== undefined);
  const bookEntries = syllabus.filter(s => s.chapter_number === null || s.chapter_number === undefined);

  const uniqueClasses = [...new Map(mySubjects.map(s => [s.class_id, { id: s.class_id, name: s.class_name }])).values()];
  const uniqueSubjects = [...new Map(mySubjects.filter(s => !selectedClass || s.class_id === parseInt(selectedClass)).map(s => [s.subject_id, { id: s.subject_id, name: s.subject_name }])).values()];

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(s => s.completion_percentage >= 100).length;
  const overallProgress = totalChapters > 0 ? Math.round(chapters.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / totalChapters) : 0;

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
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={loadSyllabus} disabled={sylLoading}
                startIcon={<MenuBook />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                {sylLoading ? 'Loading...' : 'Load Syllabus'}
              </Button>
              <Button variant="outlined" onClick={() => setAddChapterOpen(true)}
                disabled={!selectedClass || !selectedSubject}
                startIcon={<Add />}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Add Chapter
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Book Info */}
      {bookEntries.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: alpha('#f8f9fa', 0.7) }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#64748b' }}>Books / Resources</Typography>
          <Grid container spacing={2}>
            {bookEntries.map((b, i) => (
              <Grid item xs={12} sm={6} key={b.id || i}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" fontWeight={600}>{b.book_name || 'Book'}</Typography>
                    {b.total_chapters && <Chip label={`${b.total_chapters} chapters`} size="small" variant="outlined" sx={{ fontWeight: 500, ml: 0.5 }} />}
                  {b.estimated_hours && (
                    <Chip label={`${b.estimated_hours} hrs`} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Overview Stats */}
      {chapters.length > 0 && (
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

      {/* Syllabus Chapters Table */}
      {chapters.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Ch #</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Chapter Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Topics</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Completion</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Exam</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chapters.map((ch, idx) => {
                const pct = ch.completion_percentage || 0;
                const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#94a3b8';
                return (
                  <TableRow key={ch.id || idx}>
                    <TableCell><Chip label={`Ch ${ch.chapter_number || idx + 1}`} size="small"
                      sx={{ fontWeight: 700, bgcolor: alpha(color, 0.12), color }} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{ch.chapter_name || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.topics || '-'}
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                          sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: alpha(color, 0.15),
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color, minWidth: 35 }}>{Math.round(pct)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {ch.exam_included ? (
                        <Chip label={`${ch.exam_weightage || '?'} marks`} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Update Progress">
                          <IconButton size="small" onClick={() => setProgressDialog(ch)}
                            sx={{ color: PRIMARY, bgcolor: alpha(PRIMARY, 0.08) }}>
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={ch.exam_included ? 'Exam Included' : 'Set Exam Content'}>
                          <IconButton size="small" onClick={() => handleOpenExam(ch)}
                            sx={{ color: ch.exam_included ? '#10b981' : '#94a3b8', bgcolor: alpha(ch.exam_included ? '#10b981' : '#94a3b8', 0.12) }}>
                            <FactCheck sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : !sylLoading && selectedClass && selectedSubject ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {bookEntries.length > 0
            ? 'No chapters added yet. Use "Add Chapter" to add chapters.'
            : 'No syllabus defined for this class/subject yet. Academic controller needs to add book first.'}
        </Alert>
      ) : null}

      {/* Progress Update Dialog — always creates new sub-section */}
      <Dialog open={!!progressDialog} onClose={() => setProgressDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Add Sub-Section Progress</Typography></DialogTitle>
        <DialogContent>
          {progressDialog && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2, color: 'text.secondary' }}>
                Book: {progressDialog.book_name || progressDialog.title}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" type="number" label="Chapter Number"
                    value={progressForm.chapter_number}
                    onChange={e => setProgressForm({ ...progressForm, chapter_number: e.target.value })}
                    sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Chapter Name"
                    value={progressForm.chapter_name}
                    onChange={e => setProgressForm({ ...progressForm, chapter_name: e.target.value })}
                    sx={{ mb: 2 }} />
                </Grid>
              </Grid>
              <TextField fullWidth size="small" type="number" label="Completion %" inputProps={{ min: 0, max: 100 }}
                value={progressForm.percentage}
                onChange={e => setProgressForm({ ...progressForm, percentage: parseInt(e.target.value) || 0 })} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProgressDialog(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProgress} sx={{ borderRadius: 2, textTransform: 'none' }}>Add Sub-Section</Button>
        </DialogActions>
      </Dialog>

      {/* Exam Setting Dialog */}
      <Dialog open={!!examDialog} onClose={() => setExamDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Exam Content Setting</Typography></DialogTitle>
        <DialogContent>
          {examDialog && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                {examDialog.chapter_name} (Ch {examDialog.chapter_number})
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <FormControlLabel
                  control={<Switch checked={examForm.include_in_exam}
                    onChange={e => setExamForm({ ...examForm, include_in_exam: e.target.checked })} />}
                  label="Include in Exam"
                />
              </FormControl>
              {examForm.include_in_exam && (
                <>
                  <TextField fullWidth size="small" type="number" label="Marks / Weightage"
                    value={examForm.exam_weightage}
                    onChange={e => setExamForm({ ...examForm, exam_weightage: e.target.value })}
                    inputProps={{ min: 0 }}
                    sx={{ mb: 2 }} />
                  <TextField fullWidth size="small" label="Topics for Exam (comma separated)"
                    value={examForm.exam_topics}
                    onChange={e => setExamForm({ ...examForm, exam_topics: e.target.value })}
                    multiline rows={2} />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExamDialog(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleExamSetting} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Save Exam Setting
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Chapter Dialog */}
      <Dialog open={addChapterOpen} onClose={() => setAddChapterOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Add Chapter</Typography></DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField fullWidth size="small" type="number" label="Chapter Number"
              value={chapterForm.chapter_number}
              onChange={e => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth size="small" label="Chapter Name"
              value={chapterForm.chapter_name}
              onChange={e => setChapterForm({ ...chapterForm, chapter_name: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth size="small" label="Date" type="date" InputLabelProps={{ shrink: true }}
              value={chapterForm.date}
              onChange={e => setChapterForm({ ...chapterForm, date: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth size="small" label="Topics (comma separated)"
              value={chapterForm.topics}
              onChange={e => setChapterForm({ ...chapterForm, topics: e.target.value })}
              multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddChapterOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddChapter} disabled={chapterSaving}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            {chapterSaving ? 'Saving...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
