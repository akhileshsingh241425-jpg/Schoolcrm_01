import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Avatar, Chip, Button,
  alpha, useTheme, LinearProgress, Alert, Stack, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Collapse
} from '@mui/material';
import {
  Book, School, People, Schedule, MenuBook, TrendingUp, Edit,
  ExpandMore, ExpandLess, Refresh, CheckCircle
} from '@mui/icons-material';
import { dashboardAPI, academicsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherSubjects() {
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState(null); // {class_id, subject_id}
  const [syllabus, setSyllabus] = useState([]);
  const [sylLoading, setSylLoading] = useState(false);
  const [progressDialog, setProgressDialog] = useState(null);
  const [progressForm, setProgressForm] = useState({ topics_covered: '', date: new Date().toISOString().split('T')[0], percentage: 0 });
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  useEffect(() => {
    dashboardAPI.getTeacher()
      .then(res => setMySubjects(res.data?.data?.my_subjects || []))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  }, []);

  const toggleSyllabus = (subj) => {
    const key = `${subj.class_id}_${subj.subject_id}`;
    if (expandedSubject === key) {
      setExpandedSubject(null);
      setSyllabus([]);
      return;
    }
    setExpandedSubject(key);
    setSylLoading(true);
    academicsAPI.listSyllabus({ class_id: subj.class_id, subject_id: subj.subject_id })
      .then(res => {
        const data = res.data?.data;
        setSyllabus(Array.isArray(data) ? data : data?.items || []);
      })
      .catch(() => setSyllabus([]))
      .finally(() => setSylLoading(false));
  };

  const handleAddProgress = async () => {
    if (!progressDialog) return;
    try {
      await academicsAPI.addSyllabusProgress(progressDialog.id, {
        topics_covered: progressForm.topics_covered,
        date: progressForm.date,
        percentage: parseInt(progressForm.percentage) || 0,
      });
      toast.success('Progress updated!');
      setProgressDialog(null);
      setProgressForm({ topics_covered: '', date: new Date().toISOString().split('T')[0], percentage: 0 });
      // Reload syllabus for current expanded
      if (expandedSubject) {
        const [cid, sid] = expandedSubject.split('_');
        academicsAPI.listSyllabus({ class_id: cid, subject_id: sid })
          .then(res => {
            const data = res.data?.data;
            setSyllabus(Array.isArray(data) ? data : data?.items || []);
          });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  // Group subjects by subject_id for display
  const grouped = {};
  mySubjects.forEach(s => {
    const key = s.subject_id;
    if (!grouped[key]) {
      grouped[key] = { subject_id: s.subject_id, subject_name: s.subject_name, classes: [] };
    }
    grouped[key].classes.push(s);
  });

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Subjects & Syllabus</Typography>
        <Chip label={`${Object.keys(grouped).length} subjects`} color="primary" size="small" sx={{ fontWeight: 600 }} />
      </Box>

      {Object.keys(grouped).length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>No subjects assigned yet.</Alert>
      ) : (
        <Stack spacing={2}>
          {Object.values(grouped).map(group => (
            <Card key={group.subject_id} sx={{ borderRadius: 3, overflow: 'visible' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                {/* Subject Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 44, height: 44 }}>
                    <Book />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>{group.subject_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {group.classes.length} class{group.classes.length > 1 ? 'es' : ''} assigned
                    </Typography>
                  </Box>
                </Box>

                {/* Classes for this subject */}
                <Grid container spacing={1.5}>
                  {group.classes.map(cls => {
                    const key = `${cls.class_id}_${cls.subject_id}`;
                    const isExpanded = expandedSubject === key;
                    return (
                      <Grid item xs={12} key={key}>
                        <Paper variant="outlined" sx={{
                          borderRadius: 2.5, overflow: 'hidden',
                          border: isExpanded ? `2px solid ${PRIMARY}` : undefined,
                        }}>
                          {/* Class row */}
                          <Box sx={{
                            p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer', '&:hover': { bgcolor: alpha(PRIMARY, 0.03) },
                          }} onClick={() => toggleSyllabus(cls)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Chip icon={<School sx={{ fontSize: 14 }} />}
                                label={`${cls.class_name}${cls.section_name ? ' - ' + cls.section_name : ''}`}
                                size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                              {cls.periods_per_week && (
                                <Chip icon={<Schedule sx={{ fontSize: 12 }} />}
                                  label={`${cls.periods_per_week} periods/wk`}
                                  size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Tooltip title="View Syllabus & Progress">
                                <Chip icon={<MenuBook sx={{ fontSize: 14 }} />}
                                  label="Syllabus" size="small" clickable
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                              </Tooltip>
                              {isExpanded ? <ExpandLess sx={{ fontSize: 20, color: 'text.secondary' }} /> : <ExpandMore sx={{ fontSize: 20, color: 'text.secondary' }} />}
                            </Box>
                          </Box>

                          {/* Syllabus Collapse */}
                          <Collapse in={isExpanded}>
                            <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                              {sylLoading ? <LinearProgress sx={{ my: 2 }} /> : syllabus.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2, mt: 1 }}>
                                  No syllabus chapters defined for this class/subject. Ask admin to add.
                                </Alert>
                              ) : (
                                <>
                                  {/* Progress overview */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, mt: 1 }}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                                      Overall: {Math.round(syllabus.reduce((s, c) => s + (c.completion_percentage || 0), 0) / syllabus.length)}%
                                    </Typography>
                                    <LinearProgress variant="determinate"
                                      value={Math.round(syllabus.reduce((s, c) => s + (c.completion_percentage || 0), 0) / syllabus.length)}
                                      sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(PRIMARY, 0.12),
                                        '& .MuiLinearProgress-bar': { bgcolor: PRIMARY, borderRadius: 3 } }} />
                                    <Chip label={`${syllabus.filter(s => s.completion_percentage >= 100).length}/${syllabus.length} done`}
                                      size="small" color="success" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
                                  </Box>

                                  {/* Chapter list */}
                                  <Stack spacing={1}>
                                    {syllabus.map((ch, idx) => {
                                      const pct = ch.completion_percentage || 0;
                                      const color = pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct > 0 ? '#f59e0b' : '#94a3b8';
                                      return (
                                        <Box key={ch.id} sx={{
                                          display: 'flex', alignItems: 'center', gap: 1.5,
                                          p: 1.25, borderRadius: 2, bgcolor: alpha(color, 0.04),
                                          border: `1px solid ${alpha(color, 0.15)}`,
                                        }}>
                                          <Chip label={`${ch.chapter_number || idx + 1}`} size="small"
                                            sx={{ fontWeight: 800, minWidth: 30, bgcolor: alpha(color, 0.15), color }} />
                                          <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                              {ch.chapter_name || ch.title}
                                            </Typography>
                                            {ch.topics && (
                                              <Typography variant="caption" color="text.secondary" noWrap>
                                                {typeof ch.topics === 'string' ? ch.topics.substring(0, 60) : ''}
                                              </Typography>
                                            )}
                                          </Box>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                            <Box sx={{ width: 60 }}>
                                              <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                                sx={{ height: 5, borderRadius: 3, bgcolor: alpha(color, 0.2),
                                                  '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                                            </Box>
                                            <Typography variant="caption" fontWeight={700} sx={{ color, minWidth: 30 }}>
                                              {pct}%
                                            </Typography>
                                            <Tooltip title="Update Progress">
                                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setProgressDialog(ch); }}
                                                sx={{ width: 26, height: 26, color: PRIMARY, bgcolor: alpha(PRIMARY, 0.08) }}>
                                                <Edit sx={{ fontSize: 14 }} />
                                              </IconButton>
                                            </Tooltip>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                </>
                              )}
                            </Box>
                          </Collapse>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Progress Update Dialog */}
      <Dialog open={!!progressDialog} onClose={() => setProgressDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Update Progress</Typography></DialogTitle>
        <DialogContent>
          {progressDialog && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 2 }}>
                Chapter {progressDialog.chapter_number}: {progressDialog.chapter_name || progressDialog.title}
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
                    onChange={e => setProgressForm({ ...progressForm, percentage: e.target.value })} />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProgressDialog(null)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddProgress} sx={{ borderRadius: 2, textTransform: 'none' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
