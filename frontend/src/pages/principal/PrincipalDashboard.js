import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper, Chip, Avatar, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, alpha, useTheme, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Alert, Stack, Divider, Rating, Tabs, Tab
} from '@mui/material';
import {
  People, School, AttachMoney, CalendarMonth, TrendingUp, Warning,
  CheckCircle, Gavel, PersonOff, Assignment, Refresh, Visibility,
  ThumbUp, ThumbDown, Schedule, Star, Assessment
} from '@mui/icons-material';
import { principalAPI, studentsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import { academicsAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const toArr = (d) => Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : []);

// ─── Report Cards Section (all students' results) ───
function ReportCardsSection() {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(toArr(r.data?.data))).catch(() => {});
    academicsAPI.listExams({}).then(r => setExams(toArr(r.data?.data))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!classId) { setSections([]); setSectionId(''); return; }
    studentsAPI.listSections(classId).then(r => setSections(toArr(r.data?.data))).catch(() => setSections([]));
  }, [classId]);

  const load = () => {
    setLoading(true);
    const params = {};
    if (classId) params.class_id = classId;
    if (sectionId) params.section_id = sectionId;
    if (examId) params.exam_id = examId;
    principalAPI.reportCards(params)
      .then(r => setRows(toArr(r.data?.data)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [classId, sectionId, examId]);

  const gradeColor = (g) => ['A+', 'A'].includes(g) ? '#10b981' : ['B+', 'B'].includes(g) ? '#3b82f6'
    : ['C+', 'C'].includes(g) ? '#f59e0b' : '#ef4444';

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField select size="small" label="Class" value={classId} onChange={e => { setClassId(e.target.value); setSectionId(''); }} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Classes</MenuItem>
          {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Section" value={sectionId} onChange={e => setSectionId(e.target.value)} sx={{ minWidth: 140 }} disabled={!classId}>
          <MenuItem value="">All Sections</MenuItem>
          {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Exam" value={examId} onChange={e => setExamId(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All Exams</MenuItem>
          {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<Refresh />} onClick={load} sx={{ textTransform: 'none' }}>Refresh</Button>
      </Stack>

      {loading ? <LinearProgress /> : rows.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No published report cards found for this filter.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Roll</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>%</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((s, idx) => (
                <React.Fragment key={s.student_id}>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 700, color: idx < 3 ? '#f59e0b' : 'text.secondary' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{s.student_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.admission_no}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.class_name}{s.section_name ? ` - ${s.section_name}` : ''}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.roll_no || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.total_obtained}/{s.total_max}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.percentage}%</TableCell>
                    <TableCell>
                      <Chip label={s.overall_grade} size="small"
                        sx={{ fontWeight: 800, bgcolor: alpha(gradeColor(s.overall_grade), 0.12), color: gradeColor(s.overall_grade), minWidth: 38 }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setExpanded(expanded === s.student_id ? null : s.student_id)}
                        sx={{ textTransform: 'none', minWidth: 0 }}>
                        {expanded === s.student_id ? 'Hide' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded === s.student_id && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ bgcolor: alpha('#000', 0.015), py: 1.5 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Subject</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Marks</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem' }}>%</TableCell>
                              <TableCell sx={{ fontWeight: 600, fontSize: '0.72rem' }}>Grade</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(s.subjects || []).map((sub, i) => (
                              <TableRow key={i}>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{sub.subject_name || '-'}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{sub.marks_obtained}/{sub.max_marks}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{sub.percentage != null ? `${sub.percentage}%` : '-'}</TableCell>
                                <TableCell sx={{ fontSize: '0.75rem' }}>{sub.grade || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── All Timetables Section (every class-section) ───
function AllTimetablesSection() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    principalAPI.timetables()
      .then(r => setGroups(toArr(r.data?.data)))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (groups.length === 0) return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography color="text.secondary">No timetables created yet.</Typography>
    </Box>
  );

  const g = groups[selected] || groups[0];
  // Build grid: periods (rows) x days (cols). day_of_week is a lowercase string enum.
  const periods = [...new Set((g.entries || []).map(e => e.period_number).filter(p => p != null))].sort((a, b) => a - b);
  const cell = (dayLower, period) => (g.entries || []).find(e =>
    String(e.day_of_week || '').toLowerCase() === dayLower && e.period_number === period);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {groups.map((grp, i) => (
          <Chip key={`${grp.class_id}_${grp.section_id}`}
            label={`${grp.class_name || 'Class'}${grp.section_name ? ' - ' + grp.section_name : ''}`}
            onClick={() => setSelected(i)} color={i === selected ? 'primary' : 'default'}
            variant={i === selected ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }} />
        ))}
      </Stack>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha('#000', 0.03) }}>
              <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
              {DAYS.slice(0, 6).map(d => <TableCell key={d} sx={{ fontWeight: 700 }}>{d}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.map(p => (
              <TableRow key={p}>
                <TableCell sx={{ fontWeight: 700, bgcolor: alpha('#000', 0.02) }}>P{p}</TableCell>
                {DAYS.slice(0, 6).map((d, di) => {
                  const c = cell(d.toLowerCase(), p);
                  return (
                    <TableCell key={d} sx={{ minWidth: 120 }}>
                      {c ? (
                        <Box>
                          <Typography variant="caption" fontWeight={700} sx={{ display: 'block' }}>
                            {c.subject_name || c.subject?.name || (c.is_break ? 'Break' : '-')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {c.teacher_name || c.teacher?.name || ''}
                          </Typography>
                        </Box>
                      ) : <Typography variant="caption" color="text.disabled">-</Typography>}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Exam Approval Section ───
function ExamApprovalSection() {
  const [pendingExams, setPendingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState({});
  const theme = useTheme();

  useEffect(() => {
    academicsAPI.listExams({}).then(res => {
      const exams = Array.isArray(res.data?.data) ? res.data.data : res.data?.data?.items || [];
      // For each exam, check date sheet status
      const checks = exams.map(exam =>
        examMgmtAPI.getDateSheet(exam.id)
          .then(r => ({ exam, status: r.data?.data?.status, schedules: r.data?.data?.schedules || [] }))
          .catch(() => ({ exam, status: 'draft', schedules: [] }))
      );
      Promise.all(checks).then(results => {
        const pending = results.filter(r => r.status === 'pending_approval');
        setPendingExams(pending);
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (examId) => {
    try {
      await examMgmtAPI.approveDateSheet(examId);
      toast.success('Date Sheet Approved! Students & Parents ko visible ho gayi.');
      setPendingExams(prev => prev.filter(p => p.exam.id !== examId));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReject = async (examId) => {
    const remarks = prompt('Rejection reason:');
    if (!remarks) return;
    try {
      await examMgmtAPI.rejectDateSheet(examId, { remarks });
      toast.success('Date Sheet Rejected. Exam Controller ko wapas bheji gayi.');
      setPendingExams(prev => prev.filter(p => p.exam.id !== examId));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading || pendingExams.length === 0) return null;

  return (
    <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '2px solid', borderColor: alpha('#f59e0b', 0.4), bgcolor: alpha('#f59e0b', 0.02) }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.15), color: '#f59e0b', width: 32, height: 32 }}>
          <CalendarMonth sx={{ fontSize: 18 }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Exam Date Sheet — Approval Required</Typography>
          <Typography variant="caption" color="text.secondary">{pendingExams.length} date sheet(s) waiting for your approval</Typography>
        </Box>
      </Box>

      {pendingExams.map(({ exam, schedules: scheds }) => (
        <Paper key={exam.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box>
              <Typography variant="body1" fontWeight={700}>{exam.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                📅 {exam.start_date} → {exam.end_date} &nbsp;|&nbsp; 📝 {scheds.length} subjects
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" color="success" size="small" startIcon={<ThumbUp sx={{ fontSize: 16 }} />}
                onClick={() => handleApprove(exam.id)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Approve
              </Button>
              <Button variant="outlined" color="error" size="small" startIcon={<ThumbDown sx={{ fontSize: 16 }} />}
                onClick={() => handleReject(exam.id)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                Reject
              </Button>
            </Box>
          </Box>

          {/* Show first few schedules as preview */}
          {scheds.length > 0 && (
            <TableContainer sx={{ maxHeight: 150 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Marks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scheds.slice(0, 5).map((s, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{s.exam_date}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{s.subject?.name || s.subject_name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{s.class_name || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{s.max_marks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {scheds.length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block', textAlign: 'center' }}>
                  + {scheds.length - 5} more subjects...
                </Typography>
              )}
            </TableContainer>
          )}
        </Paper>
      ))}
    </Paper>
  );
}

const MetricCard = ({ title, value, icon, color, sub }) => (
  <Card sx={{ borderRadius: 3, borderTop: `3px solid ${color}`, height: '100%' }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.2, mt: 0.3 }}>{value}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 40, height: 40 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

export default function PrincipalDashboard() {
  const [data, setData] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const { user, school } = useAuthStore();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      principalAPI.dashboard().catch(() => ({ data: { data: {} } })),
      principalAPI.teacherPerformance().catch(() => ({ data: { data: [] } })),
      principalAPI.pendingLeaves().catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, teachRes, leaveRes]) => {
      setData(dashRes.data?.data || {});
      const td = teachRes.data?.data;
      setTeachers(Array.isArray(td) ? td : []);
      const ld = leaveRes.data?.data;
      setPendingLeaves(Array.isArray(ld) ? ld : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleLeaveAction = async (leaveId, action) => {
    try {
      await principalAPI.approveLeave(leaveId, { action });
      toast.success(`Leave ${action}!`);
      loadAll();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <LinearProgress />;

  const m = data?.metrics || {};
  const alerts = data?.alerts || [];
  const absentTeachers = data?.absent_teachers || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box>
      {/* Welcome Banner */}
      <Box sx={{
        background: `linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3b7dbd 100%)`,
        borderRadius: 4, p: { xs: 2.5, md: 3.5 }, mb: 3, position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
              {greeting}, {user?.first_name || 'Principal'}!
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {school?.name} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
          <Tooltip title="Refresh"><IconButton onClick={loadAll} sx={{ color: '#fff' }}><Refresh /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <MetricCard title="Student Attendance" value={`${m.student_attendance_pct || 0}%`}
            icon={<People sx={{ fontSize: 20 }} />} color="#10b981"
            sub={`${m.student_present_today || 0} present today`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <MetricCard title="Staff Attendance" value={`${m.staff_attendance_pct || 0}%`}
            icon={<School sx={{ fontSize: 20 }} />} color="#3b82f6"
            sub={`${m.staff_present_today || 0}/${m.total_staff || 0} present`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <MetricCard title="Fee Collection" value={`${m.fee_collection_pct || 0}%`}
            icon={<AttachMoney sx={{ fontSize: 20 }} />} color="#8b5cf6"
            sub={`₹${(m.monthly_collection || 0).toLocaleString()} this month`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <MetricCard title="Avg Marks" value={m.avg_marks || 0}
            icon={<Assessment sx={{ fontSize: 20 }} />} color="#f59e0b"
            sub={`${m.top_performers || 0} toppers, ${m.weak_students || 0} weak`} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <MetricCard title="Discipline Cases" value={m.open_discipline_cases || 0}
            icon={<Gavel sx={{ fontSize: 20 }} />} color="#ef4444"
            sub={`${m.pending_leaves || 0} leaves pending`} />
        </Grid>
      </Grid>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ fontSize: 18, color: '#f59e0b' }} /> Alerts & Action Required
          </Typography>
          <Stack spacing={1}>
            {alerts.map((a, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2,
                bgcolor: alpha(a.type === 'danger' ? '#ef4444' : a.type === 'warning' ? '#f59e0b' : '#3b82f6', 0.06),
                border: `1px solid ${alpha(a.type === 'danger' ? '#ef4444' : a.type === 'warning' ? '#f59e0b' : '#3b82f6', 0.15)}`,
              }}>
                <Chip label={a.type === 'danger' ? '🔴' : a.type === 'warning' ? '🟡' : '🔵'} size="small" sx={{ minWidth: 30 }} />
                <Typography variant="body2" fontWeight={600}>{a.message}</Typography>
                <Chip label={a.category} size="small" variant="outlined" sx={{ ml: 'auto', fontSize: '0.65rem' }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Tabs: Approvals | Teachers | Absent Staff */}
      <ExamApprovalSection />

      {/* Tabs: Leaves | Teachers | Absent */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Pending Leaves (${pendingLeaves.length})`} />
          <Tab label={`Teacher Performance (${teachers.length})`} />
          <Tab label={`Absent Today (${absentTeachers.length})`} />
          <Tab label="Report Cards" />
          <Tab label="All Timetables" />
        </Tabs>

        {/* Tab 0: Pending Leaves */}
        {tab === 0 && (
          <Box>
            {pendingLeaves.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                <Typography color="text.secondary">No pending leave requests!</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Staff</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingLeaves.map(l => (
                      <TableRow key={l.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{l.staff_name}</Typography></TableCell>
                        <TableCell><Chip label={l.leave_type} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{l.from_date}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{l.to_date}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{l.days}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', maxWidth: 150 }}>{l.reason || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Approve">
                              <IconButton size="small" onClick={() => handleLeaveAction(l.id, 'approved')}
                                sx={{ color: '#10b981', bgcolor: alpha('#10b981', 0.08) }}>
                                <ThumbUp sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" onClick={() => handleLeaveAction(l.id, 'rejected')}
                                sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08) }}>
                                <ThumbDown sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 1: Teacher Performance */}
        {tab === 1 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subjects</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Homework</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((t, idx) => {
                  const gradeColor = t.grade === 'A+' || t.grade === 'A' ? '#10b981' :
                    t.grade === 'B+' || t.grade === 'B' ? '#3b82f6' : '#f59e0b';
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}>
                            {t.name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{t.designation || 'Teacher'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{t.department || '-'}</TableCell>
                      <TableCell>
                        <Chip label={`${t.attendance_pct}%`} size="small"
                          sx={{ fontWeight: 700, bgcolor: alpha(t.attendance_pct >= 90 ? '#10b981' : '#f59e0b', 0.12),
                            color: t.attendance_pct >= 90 ? '#10b981' : '#f59e0b' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{t.subjects_count}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{t.homework_given}</TableCell>
                      <TableCell>
                        <Chip label={t.grade} size="small"
                          sx={{ fontWeight: 800, bgcolor: alpha(gradeColor, 0.12), color: gradeColor, minWidth: 35 }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress variant="determinate" value={Math.min(t.total_score, 100)}
                            sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: alpha(gradeColor, 0.15),
                              '& .MuiLinearProgress-bar': { bgcolor: gradeColor, borderRadius: 3 } }} />
                          <Typography variant="caption" fontWeight={700} sx={{ color: gradeColor, minWidth: 30 }}>
                            {Math.round(t.total_score)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {teachers.length === 0 && (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">No teaching staff data</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tab 2: Absent Today */}
        {tab === 2 && (
          <Box sx={{ p: 2 }}>
            {absentTeachers.length === 0 ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>All staff present today! 🎉</Alert>
            ) : (
              <Stack spacing={1}>
                {absentTeachers.map((t, i) => (
                  <Box key={i} sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2,
                    bgcolor: alpha('#ef4444', 0.05), border: `1px solid ${alpha('#ef4444', 0.15)}`,
                  }}>
                    <Avatar sx={{ bgcolor: alpha('#ef4444', 0.12), color: '#ef4444', width: 36, height: 36 }}>
                      <PersonOff sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.department || 'Teaching Staff'}</Typography>
                    </Box>
                    <Chip label="Absent" size="small" color="error" sx={{ ml: 'auto' }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Tab 3: Report Cards */}
        {tab === 3 && <ReportCardsSection />}

        {/* Tab 4: All Timetables */}
        {tab === 4 && <AllTimetablesSection />}
      </Paper>
    </Box>
  );
}
