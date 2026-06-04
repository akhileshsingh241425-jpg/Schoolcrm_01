import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Card, CardContent, Typography, Box, Paper, List, ListItem, ListItemText,
  Chip, Avatar, ListItemAvatar, Skeleton, alpha, useTheme, IconButton, Tooltip,
  Button, Divider, LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Rating, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  School, People, CalendarMonth, Book, Class, Schedule,
  TrendingUp, ArrowForwardIos, Refresh, AccessTime, Event,
  CheckCircle, HourglassEmpty, Phone, Email, Star,
  Assignment, Grade, Assessment, BarChart, Close
} from '@mui/icons-material';
import { dashboardAPI } from '../../services/api';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

// ─── Question Paper Request Notification ───
function QuestionPaperRequests({ mySubjects }) {
  const [pendingExams, setPendingExams] = useState([]);
  const [uploadedPapers, setUploadedPapers] = useState({}); // exam_id -> [papers]
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadExam, setUploadExam] = useState(null);
  const [uploadSubject, setUploadSubject] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  const loadData = () => {
    academicsAPI.listExams({}).then(res => {
      const exams = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.items || [];
      const activeExams = exams.filter(e => ['upcoming', 'ongoing'].includes(e.status));
      
      const checks = activeExams.map(exam =>
        Promise.all([
          examMgmtAPI.getDateSheet(exam.id).catch(() => ({ data: { data: {} } })),
          examMgmtAPI.listQuestionPapers(exam.id).catch(() => ({ data: { data: [] } })),
        ]).then(([dsRes, papersRes]) => ({
          exam,
          status: dsRes.data?.data?.status || 'draft',
          schedules: dsRes.data?.data?.schedules || [],
          papers: papersRes.data?.data || [],
        }))
      );
      Promise.all(checks).then(results => {
        const needPapers = results.filter(r => r.status === 'pending_approval' || r.status === 'approved');
        setPendingExams(needPapers);
        // Store papers by exam
        const papersMap = {};
        results.forEach(r => { papersMap[r.exam.id] = r.papers; });
        setUploadedPapers(papersMap);
      });
    }).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  const handleUpload = async () => {
    if (!file || !uploadExam || !uploadSubject) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files allowed'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size max 5MB'); return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('class_id', uploadSubject.class_id || '');
      formData.append('subject_id', uploadSubject.subject_id || '');
      formData.append('set_name', 'A');
      formData.append('max_marks', uploadSubject.max_marks || 100);
      formData.append('duration_minutes', 180);
      await examMgmtAPI.uploadQuestionPaper(uploadExam.id, formData);
      toast.success('Question paper uploaded! Exam Controller ko bhej diya.');
      setUploadOpen(false);
      setFile(null);
      loadData(); // Reload to show updated status
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  // Check if paper already uploaded for a subject+class in an exam
  const isUploaded = (examId, subjectId, classId) => {
    const papers = uploadedPapers[examId] || [];
    return papers.find(p => p.subject_id === subjectId && p.class_id === classId);
  };

  if (pendingExams.length === 0) return null;

  return (
    <Paper sx={{ p: 2.5, mt: 3, mb: 0, borderRadius: 3, border: '2px solid', borderColor: alpha('#ef4444', 0.3), bgcolor: alpha('#ef4444', 0.02) }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Avatar sx={{ bgcolor: alpha('#ef4444', 0.12), color: '#ef4444', width: 32, height: 32 }}>
          <Assignment sx={{ fontSize: 18 }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#dc2626">
            📋 Question Paper Request
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Exam Controller ne question paper banane ki request bheji hai
          </Typography>
        </Box>
      </Box>

      {pendingExams.map(({ exam, schedules }) => {
        // Filter schedules for this teacher's subjects
        const mySchedules = schedules.filter(s => 
          mySubjects.some(ms => ms.subject_id === s.subject_id || ms.subject_id === s.subject?.id)
        );
        const relevantSchedules = mySchedules.length > 0 ? mySchedules : schedules.slice(0, 3);

        return (
          <Paper key={exam.id} variant="outlined" sx={{ p: 2, mb: 1, borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={700}>{exam.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              📅 {exam.start_date} → {exam.end_date}
            </Typography>
            
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5 }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relevantSchedules.map((s, i) => {
                  const uploaded = isUploaded(exam.id, s.subject_id, s.class_id);
                  return (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5, fontWeight: 600 }}>{s.subject?.name || s.subject_name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>{s.class_name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>{s.exam_date}</TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        {uploaded ? (
                          <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />}
                            label={`Uploaded (${uploaded.status})`} size="small" color="success"
                            sx={{ fontSize: '0.65rem', fontWeight: 600 }} />
                        ) : (
                          <Button size="small" variant="contained" color="error"
                            onClick={() => { setUploadExam(exam); setUploadSubject(s); setUploadOpen(true); }}
                            sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.7rem', py: 0.2 }}>
                            Upload Paper
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {relevantSchedules.length === 0 && (
              <Typography variant="caption" color="text.secondary">No subjects assigned to you for this exam.</Typography>
            )}
          </Paper>
        );
      })}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Upload Question Paper</Typography>
              <Typography variant="caption" color="text.secondary">
                {uploadExam?.name} — {uploadSubject?.subject?.name || uploadSubject?.subject_name || ''} ({uploadSubject?.class_name || ''})
              </Typography>
            </Box>
            <IconButton onClick={() => setUploadOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" component="label" fullWidth
              sx={{ borderRadius: 2, textTransform: 'none', py: 2, borderStyle: 'dashed', borderWidth: 2 }}>
              {file ? `📄 ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)` : '📎 Click to select PDF file (max 5MB)'}
              <input type="file" hidden accept=".pdf" onChange={e => setFile(e.target.files[0])} />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Only PDF format • Maximum 5MB • Paper will be sent to Exam Controller for review
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={uploading || !file}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            {uploading ? 'Uploading...' : 'Upload Paper'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StatCard = ({ title, value, icon, gradient, shadowColor, delay = 0 }) => (
  <Card sx={{ overflow: 'visible', position: 'relative', transition: 'all 0.3s ease',
    animation: `fadeUp 0.5s ease ${delay}ms both`,
    '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 12px 32px ${shadowColor}` } }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ pt: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.78rem', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.2, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ width: 50, height: 50, borderRadius: 3,
          background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 16px ${shadowColor}`, color: '#fff' }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AttendanceChip = ({ percentage }) => {
  const color = percentage >= 90 ? '#10b981' : percentage >= 75 ? '#f59e0b' : '#ef4444';
  return <Chip label={`${percentage}%`} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: alpha(color, 0.12), color }} />;
};

const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="rounded" height={120} sx={{ mb: 3, borderRadius: 4 }} />
    <Grid container spacing={2.5}>
      {[1, 2, 3, 4].map(i => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Skeleton variant="rounded" height={110} sx={{ borderRadius: 4 }} />
        </Grid>
      ))}
    </Grid>
    <Box sx={{ mt: 3 }}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} /></Box>
  </Box>
);

export default function TeacherDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, school } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  const GRADIENTS = {
    primary: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
    secondary: `linear-gradient(135deg, ${SECONDARY} 0%, ${theme.palette.primary.light} 100%)`,
    success: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    info: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    analytics: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
  };

  const loadData = () => {
    setLoading(true);
    dashboardAPI.getTeacher()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <Typography color="error">Failed to load dashboard</Typography>;

  const { teacher, my_classes, my_subjects, today_timetable, today_attendance, upcoming_exams, class_students, performance } = data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayName = DAY_NAMES[new Date().getDay()];
  const schoolLogo = school?.branding?.logo_url;

  const activeStudents = class_students?.filter(s => s.status !== 'inactive') || [];
  const avgPerformance = performance?.average || 0;
  const topperCount = performance?.toppers?.length || 0;
  const lowPerformerCount = performance?.low_performers?.length || 0;

  // Unique subjects (Hindi taught in 2 classes counts as 1 subject)
  const uniqueSubjectCount = new Set(
    (my_subjects || []).map(s => s.subject_id ?? s.subject_name)
  ).size;
  // Unique class-sections the teacher teaches (via subject allocations) + class-teacher sections
  const teachingSectionKeys = (my_subjects || []).map(s => `${s.class_id}-${s.section_id || 'all'}`);
  const classTeacherKeys = (my_classes || []).map(c => `${c.class_id}-${c.section_id || 'all'}`);
  const uniqueClassCount = new Set([...teachingSectionKeys, ...classTeacherKeys]).size;

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 50%, ${theme.palette.primary.light} 100%)`,
        borderRadius: { xs: 3, md: 4 }, p: { xs: 2.5, sm: 3, md: 4 }, mb: { xs: 2, md: 3 },
        position: 'relative', overflow: 'hidden',
        animation: 'fadeIn 0.6s ease',
        '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}>
        <Box sx={{ position: 'absolute', top: -40, right: -40, width: { xs: 120, md: 200 },
          height: { xs: 120, md: 200 }, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ width: { xs: 48, md: 56 }, height: { xs: 48, md: 56 }, borderRadius: 3,
              overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.95)', p: 0.5, flexShrink: 0,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <img src={schoolLogo || '/assets/images/logo-crm.svg'} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 0.3, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                {greeting}, {teacher?.first_name || 'Teacher'}!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.8rem', md: '0.88rem' } }}>
                {teacher?.designation ? `${teacher.designation} • ` : ''}{school?.name || ''}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="My Classes" value={uniqueClassCount} icon={<Class />} gradient={GRADIENTS.primary} shadowColor={alpha(PRIMARY, 0.25)} delay={0} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="My Subjects" value={uniqueSubjectCount} icon={<Book />} gradient={GRADIENTS.secondary} shadowColor={alpha(SECONDARY, 0.25)} delay={80} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={activeStudents.length || today_attendance?.student_count || 0} icon={<People />} gradient={GRADIENTS.info} shadowColor={alpha('#3b82f6', 0.25)} delay={160} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Attendance Today" value={`${today_attendance?.percentage || 0}%`} icon={<CalendarMonth />} gradient={GRADIENTS.success} shadowColor={alpha('#10b981', 0.25)} delay={240} />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <QuestionPaperRequests mySubjects={my_subjects || []} />

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3, mb: 3 }}>
        <Button variant="contained" startIcon={<CalendarMonth />}
          onClick={() => navigate('/attendance')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Mark Attendance
        </Button>
        <Button variant="outlined" startIcon={<Schedule />}
          onClick={() => navigate('/teacher/timetable')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          My Timetable
        </Button>
        <Button variant="outlined" startIcon={<Assignment />}
          onClick={() => navigate('/teacher/marks')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Enter Marks
        </Button>
        <Button variant="outlined" startIcon={<Grade />}
          onClick={() => navigate('/teacher/exams')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Exams Schedule
        </Button>
        <Button variant="outlined" startIcon={<Email />}
          onClick={() => navigate('/teacher/communication')}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Message Parents
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {/* Today's Timetable */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Today's Schedule</Typography>
              </Box>
              <Chip label={todayName} size="small" color="primary" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {today_timetable?.filter(t => !t.is_break)?.map((slot, idx) => (
                <ListItem key={slot.id} divider={idx < today_timetable.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 38, height: 38, fontSize: '0.75rem', fontWeight: 700 }}>
                      #{slot.period_number || idx + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{slot.subject_name}</Typography>
                        <Chip label={`${slot.class_name}${slot.section_name ? ' - ' + slot.section_name : ''}`} size="small"
                          sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(PRIMARY, 0.08), color: 'text.secondary' }} />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <AccessTime sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {slot.start_time} - {slot.end_time}
                        </Typography>
                        {slot.room_no && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • Room: {slot.room_no}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {(!today_timetable || today_timetable.filter(t => !t.is_break).length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarMonth sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No classes scheduled for today</Typography>
                    <Typography variant="caption" color="text.disabled">Enjoy your day off!</Typography>
                  </Box>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Exams */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Event sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Upcoming Exams</Typography>
              </Box>
              <Chip label={`Next 7 days`} size="small" color="warning" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {upcoming_exams?.map((exam, idx) => (
                <ListItem key={exam.id} divider={idx < upcoming_exams.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: 38, height: 38, fontSize: '0.75rem', fontWeight: 700 }}>
                      <Event sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {exam.exam_name} - {exam.subject_name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Typography variant="caption" color="text.secondary">
                          {exam.exam_date} • {exam.start_time} - {exam.end_time}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {exam.class_name}{exam.section_name ? ' - ' + exam.section_name : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {(!upcoming_exams || upcoming_exams.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 36, color: 'success.light', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No exams scheduled this week</Typography>
                  </Box>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Performance Analytics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart sx={{ color: '#8b5cf6', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Performance Overview</Typography>
              </Box>
              <Chip label={`Avg: ${avgPerformance}%`} size="small"
                sx={{ height: 22, bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6', fontWeight: 600 }} />
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 3, bgcolor: alpha('#10b981', 0.06) }}>
                    <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 800 }}>{topperCount}</Typography>
                    <Typography variant="caption" color="text.secondary">Top Performers</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, borderRadius: 3, bgcolor: alpha('#f59e0b', 0.06) }}>
                    <Typography variant="h4" sx={{ color: '#f59e0b', fontWeight: 800 }}>{lowPerformerCount}</Typography>
                    <Typography variant="caption" color="text.secondary">Need Attention</Typography>
                  </Box>
                </Grid>
              </Grid>
              {avgPerformance > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Class Average</Typography>
                    <Typography variant="caption" fontWeight={600}>{avgPerformance}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={avgPerformance}
                    sx={{ height: 8, borderRadius: 4, bgcolor: alpha('#8b5cf6', 0.12),
                      '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, #8b5cf6, #a78bfa)`, borderRadius: 4 } }} />
                </Box>
              )}
              <Button fullWidth variant="outlined" size="small"
                onClick={() => navigate('/teacher/analytics')}
                sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}>
                View Detailed Analytics
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* My Subjects */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Book sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>My Subjects</Typography>
              </Box>
              <Chip label={uniqueSubjectCount} size="small" color="secondary" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {Object.values((my_subjects || []).reduce((acc, s) => {
                const key = s.subject_id ?? s.subject_name;
                if (!acc[key]) acc[key] = { subject_name: s.subject_name, classes: [], total_periods: 0 };
                acc[key].classes.push(`${s.class_name}${s.section_name ? '-' + s.section_name : ''}`);
                acc[key].total_periods += (s.periods_per_week || 0);
                return acc;
              }, {})).map((subj, idx, arr) => (
                <ListItem key={idx} divider={idx < arr.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(SECONDARY, 0.1), color: SECONDARY, width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}>
                      {subj.subject_name?.[0] || 'S'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{subj.subject_name}</Typography>}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {subj.classes.join(', ')}
                        {subj.total_periods ? ` • ${subj.total_periods} periods/week` : ''}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {(!my_subjects || my_subjects.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No subjects assigned yet</Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* My Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Class sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>My Classes</Typography>
              </Box>
              <Chip label={my_classes?.length || 0} size="small" color="info" sx={{ height: 22 }} />
            </Box>
            <List disablePadding>
              {my_classes?.map((cls, idx) => (
                <ListItem key={cls.section_id} divider={idx < my_classes.length - 1} sx={{ px: 2.5, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', width: 38, height: 38, fontSize: '0.85rem', fontWeight: 700 }}>
                      <School sx={{ fontSize: 18 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{cls.class_name} - {cls.section_name}</Typography>
                        <Chip label={cls.role} size="small"
                          sx={{ height: 20, fontSize: '0.65rem',
                            bgcolor: cls.role === 'Class Teacher' ? alpha('#10b981', 0.1) : alpha('#3b82f6', 0.1),
                            color: cls.role === 'Class Teacher' ? '#10b981' : '#3b82f6' }} />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {cls.student_count} students
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {(!my_classes || my_classes.length === 0) && (
                <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No class assigned</Typography>
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Student List Preview */}
      {class_students && class_students.length > 0 && (
        <Paper sx={{ mt: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={700}>My Students</Typography>
            </Box>
            <Button size="small" onClick={() => navigate('/teacher/classes')}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
              View All <ArrowForwardIos sx={{ fontSize: 12, ml: 0.5 }} />
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Roll No</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Marks</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parent Contact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {class_students.slice(0, 10).map((student) => (
                  <TableRow key={student.id} hover sx={{ '&:hover': { bgcolor: alpha(PRIMARY, 0.03) }, cursor: 'pointer' }}
                    onClick={() => navigate(`/students/${student.id}`)}>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{student.roll_no || '-'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                          {student.first_name?.[0] || 'S'}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{student.first_name} {student.last_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{student.class_name} - {student.section_name}</TableCell>
                    <TableCell><AttendanceChip percentage={student.attendance_percentage || 0} /></TableCell>
                    <TableCell>
                      <Chip label={student.marks ? `${student.marks}/100` : 'N/A'} size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600,
                          bgcolor: student.marks >= 85 ? alpha('#10b981', 0.12) : student.marks >= 60 ? alpha('#f59e0b', 0.12) : alpha('#ef4444', 0.12),
                          color: student.marks >= 85 ? '#10b981' : student.marks >= 60 ? '#f59e0b' : '#ef4444' }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.08), width: 26, height: 26 }}
                          onClick={(e) => { e.stopPropagation(); window.open(`tel:${student.parent_phone}`); }}>
                          <Phone sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08), width: 26, height: 26 }}
                          onClick={(e) => { e.stopPropagation(); window.open(`mailto:${student.parent_email}`); }}>
                          <Email sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {class_students.length > 10 && (
            <Box sx={{ p: 1.5, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Button onClick={() => navigate('/teacher/classes')}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                View All {class_students.length} Students
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
