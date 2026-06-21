import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, LinearProgress, Alert, Stack,
  Checkbox, FormControlLabel, CircularProgress, Divider, InputAdornment
} from '@mui/material';
import {
  Add, Edit, Delete, Refresh, Warning, Assignment, MenuBook,
  CalendarMonth, SwapHoriz, Search, ThumbUp, ThumbDown, Undo, ArrowForward
} from '@mui/icons-material';
import { validateForm } from '../../components/Validation';
import { academicsAPI, studentsAPI, staffAPI } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ============================================================
// Academic Controller API (uses authenticated api instance)
// ============================================================
const acAPI = {
  getDashboard: () => api.get('/academic-controller/dashboard'),
  getNotifications: () => api.get('/academic-controller/dashboard/notifications'),
  listTerms: (params) => api.get('/academic-controller/terms', { params }),
  createTerm: (data) => api.post('/academic-controller/terms', data),
  updateTerm: (id, data) => api.put(`/academic-controller/terms/${id}`, data),
  deleteTerm: (id) => api.delete(`/academic-controller/terms/${id}`),
  listSubstitutions: (params) => api.get('/academic-controller/substitutions', { params }),
  createSubstitution: (data) => api.post('/academic-controller/substitutions', data),
  updateSubstitution: (id, data) => api.put(`/academic-controller/substitutions/${id}`, data),
  deleteSubstitution: (id) => api.delete(`/academic-controller/substitutions/${id}`),
  getTeacherWorkload: () => api.get('/academic-controller/teacher-workload'),
  getTeacherWorkloadById: (id) => api.get(`/academic-controller/teacher-workload/${id}`),
  getPendingLessonPlans: (params) => api.get('/academic-controller/lesson-plans/pending', { params }),
  approveLessonPlan: (id) => api.put(`/academic-controller/lesson-plans/${id}/approve`),
  rejectLessonPlan: (id, data) => api.put(`/academic-controller/lesson-plans/${id}/reject`, data),
  revisionLessonPlan: (id, data) => api.put(`/academic-controller/lesson-plans/${id}/revision`, data),
  getLessonPlanStats: () => api.get('/academic-controller/lesson-plans/stats'),
  getHomeworkOverview: (params) => api.get('/academic-controller/homework/overview', { params }),
  getHomeworkAnalytics: () => api.get('/academic-controller/homework/analytics'),
  getHomeworkFrequency: (params) => api.get('/academic-controller/homework/frequency', { params }),
  getHomeworkWorkloadAlerts: () => api.get('/academic-controller/homework/workload-alerts'),
  getPromotionCriteria: (params) => api.get('/academic-controller/promotions/criteria', { params }),
  createPromotionCriteria: (data) => api.post('/academic-controller/promotions/criteria', data),
  updatePromotionCriteria: (id, data) => api.put(`/academic-controller/promotions/criteria/${id}`, data),
  evaluatePromotions: (classId, data) => api.post(`/academic-controller/promotions/evaluate/${classId}`, data),
  overridePromotion: (id, data) => api.put(`/academic-controller/promotions/override/${id}`, data),
  confirmPromotions: (classId) => api.post(`/academic-controller/promotions/confirm/${classId}`),
  getPromotionSummary: (classId) => api.get(`/academic-controller/promotions/summary/${classId}`),
  listPolicies: (params) => api.get('/academic-controller/policies', { params }),
  createPolicy: (data) => api.post('/academic-controller/policies', data),
  updatePolicy: (id, data) => api.put(`/academic-controller/policies/${id}`, data),
  getWorkingDays: () => api.get('/academic-controller/policies/working-days'),
  updateWorkingDays: (data) => api.put('/academic-controller/policies/working-days', data),
  getClassPerformance: (params) => api.get('/academic-controller/reports/class-performance', { params }),
  getTeacherPerformance: (params) => api.get('/academic-controller/reports/teacher-performance', { params }),
  getCrossSectionReport: (params) => api.get('/academic-controller/reports/cross-section', { params }),
  getTrends: (params) => api.get('/academic-controller/reports/trends', { params }),
};

// ============================================================
// Shared styles
// ============================================================
const fontFamily = "'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif";

const tableStyles = {
  '& .MuiTable-root': { borderCollapse: 'collapse' },
  '& .MuiTableCell-root': { border: '1px solid #dee2e6', py: 1.2, px: 2, fontSize: '0.875rem', fontFamily, lineHeight: 1.5 },
  '& .MuiTableHead-root .MuiTableCell-root': { bgcolor: '#f1f3f5', fontWeight: 600, fontSize: '0.8rem', color: '#495057', textTransform: 'uppercase', letterSpacing: '0.3px' },
  '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: '#f8f9fa' },
};

const cardStyle = { border: '1px solid #dee2e6', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } };
const dialogPaperProps = { sx: { borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } };

const sectionTitle = { fontSize: '1.15rem', fontWeight: 600, fontFamily, color: '#212529', borderBottom: '2px solid #e9ecef', pb: 0.8, mb: 2 };
const chipStyle = { borderRadius: '4px', fontSize: '0.75rem', fontWeight: 500, fontFamily };
const btnStyle = { borderRadius: '6px', textTransform: 'none', fontFamily, fontWeight: 500, px: 2 };
const inputStyle = { '& .MuiOutlinedInput-root': { borderRadius: '6px', fontFamily }, '& .MuiInputLabel-root': { fontFamily } };
const selectStyle = { borderRadius: '6px', fontFamily };

// ============================================================
// TAB NAMES
// ============================================================
const TAB_NAMES = [
  'Dashboard', 'Subjects', 'Teacher Assignment', 'Class Teachers', 'Timetable',
  'Substitutions',
  'Syllabus Progress', 'Promotions', 'Calendar', 'Reports'
];

const TAB_MAP = {
  '': 0, 'dashboard': 0, 'subjects': 1, 'teachers': 2, 'class-teachers': 3,
  'timetable': 4, 'substitutions': 5, 'syllabus': 6, 'promotions': 7,
  'calendar': 8, 'reports': 9,
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AcademicController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || '';
  const [tab, setTab] = useState(TAB_MAP[tabParam] || 0);

  useEffect(() => {
    const idx = TAB_MAP[tabParam];
    if (idx !== undefined && idx !== tab) setTab(idx);
  }, [tabParam]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data?.data || [])).catch(() => {});
    staffAPI.list().then(r => { const d = r.data?.data; setStaff(Array.isArray(d) ? d : d?.items || []); }).catch(() => {});
    academicsAPI.listSubjects().then(r => setSubjects(r.data?.data || [])).catch(() => {});
  }, []);

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', p: 0, fontFamily }}>
      <Typography variant="h1" sx={{ fontSize: '1.75rem', fontWeight: 700, fontFamily, color: '#1a1a2e', borderBottom: '2px solid #e9ecef', pb: 1, mb: 2.5 }}>
        Academic Controller
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); const key = Object.keys(TAB_MAP).find(k => TAB_MAP[k] === v); setSearchParams(key ? { tab: key } : {}); }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: '2px solid #e9ecef',
          '& .MuiTab-root': { textTransform: 'none', minHeight: 40, fontSize: '0.875rem', fontFamily, fontWeight: 500, py: 1, color: '#6c757d' },
          '& .Mui-selected': { fontWeight: 600, color: '#1976d2' },
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
        }}
      >
        {TAB_NAMES.map((t, i) => <Tab key={i} label={t} />)}
      </Tabs>

      {tab === 0 && <DashboardTab />}
      {tab === 1 && <SubjectsTab subjects={subjects} setSubjects={setSubjects} classes={classes} />}
      {tab === 2 && <TeacherAssignmentTab classes={classes} staff={staff} subjects={subjects} />}
      {tab === 3 && <ClassTeachersTab classes={classes} staff={staff} />}
      {tab === 4 && <TimetableTab classes={classes} subjects={subjects} staff={staff} />}
      {tab === 5 && <SubstitutionsTab staff={staff} classes={classes} />}
      {tab === 6 && <SyllabusProgressTab classes={classes} subjects={subjects} />}
      {tab === 7 && <PromotionsTab classes={classes} />}
      {tab === 8 && <CalendarTab classes={classes} />}
      {tab === 9 && <ReportsTab classes={classes} />}
    </Box>
  );
}

// ============================================================
// 1. DASHBOARD TAB
// ============================================================
function DashboardTab() {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      acAPI.getDashboard().catch(() => ({ data: { data: {} } })),
      acAPI.getNotifications().catch(() => ({ data: { data: [] } })),
    ]).then(([dashRes, notifRes]) => {
      setData(dashRes.data?.data || {});
      setNotifications(notifRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;

  const stats = [
    { label: 'Pending Approvals', value: data?.pending_approvals || 0, color: '#d33', icon: <Assignment /> },
    { label: 'At-Risk Syllabus', value: data?.at_risk_syllabus || 0, color: '#ac6600', icon: <Warning /> },
    { label: 'Upcoming Events', value: data?.upcoming_events || 0, color: '#36c', icon: <CalendarMonth /> },
    { label: 'Substitutions Today', value: data?.substitutions_today || 0, color: '#14866d', icon: <SwapHoriz /> },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ ...cardStyle, borderTop: `3px solid ${s.color}` }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: s.color }}>{s.icon}</Box>
                  <Typography variant="caption" sx={{ fontFamily, color: '#6c757d', fontWeight: 500 }}>{s.label}</Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: s.color, fontFamily }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h2" sx={sectionTitle}>
        Quick Links
      </Typography>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {['Review Lesson Plans', 'Manage Substitutions', 'View Reports', 'Syllabus Tracker'].map((link, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Button variant="outlined" fullWidth size="small" sx={{ ...btnStyle, borderColor: '#dee2e6', color: '#1976d2', '&:hover': { borderColor: '#1976d2', bgcolor: '#f0f7ff' } }}>
              {link} <ArrowForward sx={{ ml: 0.5, fontSize: 14 }} />
            </Button>
          </Grid>
        ))}
      </Grid>

      {notifications.length > 0 && (
        <>
          <Typography variant="h2" sx={sectionTitle}>
            Recent Notifications
          </Typography>
          <TableContainer sx={tableStyles}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Message</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.slice(0, 10).map((n, i) => (
                  <TableRow key={i}>
                    <TableCell>{n.message}</TableCell>
                    <TableCell><Chip label={n.type || 'info'} size="small" sx={chipStyle} /></TableCell>
                    <TableCell>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

// ============================================================
// 2. TEACHER ASSIGNMENT TAB
// ============================================================
function TeacherAssignmentTab({ classes, staff, subjects }) {
  const [assignments, setAssignments] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ teacher_id: '', subject_id: '', class_id: '', section_id: '', periods_per_week: '' });
  const [sections, setSections] = useState([]);
  const [search, setSearch] = useState('');
  // Multiple class-section targets (for assigning one teacher+subject to many at once)
  const [targets, setTargets] = useState([]); // [{class_id, class_name, section_id, section_name}]
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      academicsAPI.listTeacherSubjects().catch(() => ({ data: { data: [] } })),
      acAPI.getTeacherWorkload().catch(() => ({ data: { data: [] } })),
    ]).then(([aRes, wRes]) => {
      setAssignments(aRes.data?.data || []);
      setWorkload(wRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (form.class_id) {
      studentsAPI.listSections(form.class_id).then(r => {
        const secs = r.data?.data || [];
        setSections(secs);
        if (form.section_id && !secs.some(s => String(s.id) === String(form.section_id))) {
          setForm(f => ({ ...f, section_id: '' }));
        }
      }).catch(() => setSections([]));
    } else {
      setSections([]);
    }
  }, [form.class_id]);

  // Add the currently-selected class+section into the targets list
  const addTarget = () => {
    if (!form.class_id) { toast.error('Select a class first'); return; }
    const cls = classes.find(c => String(c.id) === String(form.class_id));
    const sec = sections.find(s => String(s.id) === String(form.section_id));
    const key = `${form.class_id}_${form.section_id || 'all'}`;
    if (targets.some(t => `${t.class_id}_${t.section_id || 'all'}` === key)) {
      toast.error('This class-section is already added'); return;
    }
    setTargets(prev => [...prev, {
      class_id: form.class_id,
      class_name: cls?.name || form.class_id,
      section_id: form.section_id || '',
      section_name: sec?.name || (form.section_id ? form.section_id : 'All'),
    }]);
    setForm(f => ({ ...f, section_id: '' }));
  };

  const removeTarget = (idx) => setTargets(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const errs = validateForm(form, { teacher_id: ['required'], subject_id: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }

    // Edit mode: single record update (keeps existing behaviour)
    if (editItem) {
      setSaving(true);
      try {
        await academicsAPI.updateTeacherSubject(editItem.id, {
          teacher_id: form.teacher_id, subject_id: form.subject_id,
          class_id: form.class_id, section_id: form.section_id || null,
          periods_per_week: form.periods_per_week || 0,
        });
        toast.success('Assignment updated');
        closeDialog();
        loadData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to save');
      } finally { setSaving(false); }
      return;
    }

    // Create mode: build list of targets. Use added targets, else the single class selection.
    let list = targets;
    if (list.length === 0) {
      if (!form.class_id) { toast.error('Add at least one class'); return; }
      const cls = classes.find(c => String(c.id) === String(form.class_id));
      const sec = sections.find(s => String(s.id) === String(form.section_id));
      list = [{ class_id: form.class_id, class_name: cls?.name, section_id: form.section_id || '', section_name: sec?.name }];
    }

    setSaving(true);
    let ok = 0, skipped = 0;
    for (const t of list) {
      try {
        await academicsAPI.createTeacherSubject({
          teacher_id: form.teacher_id,
          subject_id: form.subject_id,
          class_id: t.class_id,
          section_id: t.section_id || null,
          periods_per_week: form.periods_per_week || 0,
        });
        ok++;
      } catch (err) {
        skipped++;
      }
    }
    setSaving(false);
    if (ok > 0) toast.success(`${ok} assignment(s) created${skipped ? `, ${skipped} skipped (duplicate)` : ''}`);
    else toast.error('No assignments created (all duplicates or failed)');
    closeDialog();
    loadData();
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    setForm({ teacher_id: '', subject_id: '', class_id: '', section_id: '', periods_per_week: '' });
    setTargets([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;
    try {
      await academicsAPI.deleteTeacherSubject(id);
      toast.success('Removed');
      loadData();
    } catch { toast.error('Failed to remove'); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setTargets([]);
    const validTeacherId = staff.some(s => String(s.id) === String(item.teacher_id)) ? item.teacher_id : '';
    const validSubjectId = subjects.some(s => String(s.id) === String(item.subject_id)) ? item.subject_id : '';
    const validClassId = classes.some(c => String(c.id) === String(item.class_id)) ? item.class_id : '';
    setForm({ teacher_id: validTeacherId, subject_id: validSubjectId, class_id: validClassId, section_id: item.section_id || '', periods_per_week: item.periods_per_week || '' });
    if (item.class_id) {
      studentsAPI.listSections(item.class_id).then(r => {
        const secs = r.data?.data || [];
        setSections(secs);
        if (item.section_id && !secs.some(s => String(s.id) === String(item.section_id))) {
          setForm(f => ({ ...f, section_id: '' }));
        }
      }).catch(() => setSections([]));
    }
    setDialogOpen(true);
  };

  const filtered = assignments.filter(a =>
    !search || (a.teacher_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.class_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <TextField
          size="small" placeholder="Search assignments..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#6c757d' }} /></InputAdornment> }}
          sx={{ width: 300, ...inputStyle }}
        />
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setEditItem(null); setForm({ teacher_id: '', subject_id: '', class_id: '', section_id: '', periods_per_week: '' }); setTargets([]); setDialogOpen(true); }}
          sx={btnStyle}>
          Add Assignment
        </Button>
      </Box>

      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Teacher</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ color: '#6c757d', py: 3 }}>No assignments found</TableCell></TableRow>
            ) : filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell sx={{ fontWeight: 500 }}>{a.teacher_name || a.teacher_id}</TableCell>
                <TableCell>{a.subject_name || a.subject_id}</TableCell>
                <TableCell>{a.class_name || a.class_id}</TableCell>
                <TableCell>{a.section_name || a.section_id || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(a)} sx={{ color: '#1976d2' }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(a.id)} sx={{ color: '#dc3545' }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {workload.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h3" sx={sectionTitle}>Teacher Workload</Typography>
          <TableContainer sx={tableStyles}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Periods/Week</TableCell>
                  <TableCell>Subjects</TableCell>
                  <TableCell>Classes</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workload.map((w, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontWeight: 500 }}>{w.teacher_name}</TableCell>
                    <TableCell>{w.periods_per_week || 0}</TableCell>
                    <TableCell>{w.subject_count || 0}</TableCell>
                    <TableCell>{w.class_count || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={(w.periods_per_week || 0) > 30 ? 'Overloaded' : (w.periods_per_week || 0) > 20 ? 'Heavy' : 'Normal'}
                        size="small"
                        sx={chipStyle}
                        color={(w.periods_per_week || 0) > 30 ? 'error' : (w.periods_per_week || 0) > 20 ? 'warning' : 'success'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef', fontFamily, fontWeight: 600 }}>{editItem ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Teacher</InputLabel>
              <Select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} label="Teacher" sx={selectStyle}>
                {staff.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher')).map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Subject</InputLabel>
              <Select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} label="Subject" sx={selectStyle}>
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Periods / Week" type="number" value={form.periods_per_week}
              onChange={e => setForm({ ...form, periods_per_week: e.target.value })} sx={inputStyle} />

            <Divider />
            {!editItem && (
              <Typography variant="caption" sx={{ color: '#6c757d' }}>
                Add one or more class-sections. The same teacher &amp; subject will be assigned to each.
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily }}>Class</InputLabel>
                <Select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value, section_id: '' })} label="Class" sx={selectStyle}>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontFamily }}>Section</InputLabel>
                <Select value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })} label="Section" sx={selectStyle}>
                  <MenuItem value="">All Sections</MenuItem>
                  {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
              {!editItem && (
                <Button variant="outlined" size="small" startIcon={<Add />} onClick={addTarget}
                  sx={{ ...btnStyle, whiteSpace: 'nowrap', minWidth: 90 }}>
                  Add
                </Button>
              )}
            </Box>

            {/* Selected class-section chips */}
            {!editItem && targets.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {targets.map((t, i) => (
                  <Chip key={i}
                    label={`${t.class_name}${t.section_name && t.section_name !== 'All' ? ' - ' + t.section_name : ' (All)'}`}
                    onDelete={() => removeTarget(i)} size="small" sx={chipStyle} color="primary" />
                ))}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={closeDialog} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={btnStyle}>
            {saving ? 'Saving...' : (editItem ? 'Update' : `Assign${targets.length > 1 ? ` (${targets.length})` : ''}`)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// 3. CLASS TEACHERS TAB
// ============================================================
function ClassTeachersTab({ classes, staff }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ class_id: '', section_id: '', teacher_id: '', co_teacher_id: '' });
  const [sections, setSections] = useState([]);

  const loadData = useCallback(() => {
    setLoading(true);
    academicsAPI.getClassTeachers()
      .then(r => setAssignments(r.data?.data || []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (form.class_id) {
      studentsAPI.listSections(form.class_id).then(r => setSections(r.data?.data || [])).catch(() => setSections([]));
    }
  }, [form.class_id]);

  const handleAssign = async () => {
    const errs = validateForm(form, { section_id: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    if (form.teacher_id && form.co_teacher_id && form.teacher_id === form.co_teacher_id) {
      toast.error('Class Teacher and Co-Class Teacher cannot be the same person');
      return;
    }
    try {
      const payload = { section_id: form.section_id };
      if (form.teacher_id) payload.class_teacher_id = form.teacher_id;
      if (form.co_teacher_id) payload.co_class_teacher_id = form.co_teacher_id;
      await academicsAPI.assignClassTeacher(payload);
      toast.success('Class teacher assigned successfully');
      setDialogOpen(false);
      setForm({ class_id: '', section_id: '', teacher_id: '', co_teacher_id: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    }
  };

  // Open dialog with pre-filled data for editing
  const openEditDialog = (a) => {
    const validClassId = classes.some(c => String(c.id) === String(a.class_id)) ? a.class_id : '';
    const validTeacherId = teachers.some(t => String(t.id) === String(a.class_teacher_id)) ? a.class_teacher_id : '';
    const validCoTeacherId = teachers.some(t => String(t.id) === String(a.co_class_teacher_id)) ? a.co_class_teacher_id : '';
    setForm({
      class_id: validClassId,
      section_id: a.section_id || '',
      teacher_id: validTeacherId,
      co_teacher_id: validCoTeacherId
    });
    if (a.class_id) {
      studentsAPI.listSections(a.class_id).then(r => {
        const secs = r.data?.data || [];
        setSections(secs);
        if (a.section_id && !secs.some(s => String(s.id) === String(a.section_id))) {
          setForm(f => ({ ...f, section_id: '' }));
        }
      }).catch(() => setSections([]));
    }
    setDialogOpen(true);
  };

  // Helper to get teacher name from assignment
  const getTeacherName = (a) => {
    if (a.class_teacher) {
      return `${a.class_teacher.first_name || ''} ${a.class_teacher.last_name || ''}`.trim();
    }
    return a.class_teacher_name || a.teacher_name || '-';
  };

  const getCoTeacherName = (a) => {
    if (a.co_class_teacher) {
      return `${a.co_class_teacher.first_name || ''} ${a.co_class_teacher.last_name || ''}`.trim();
    }
    return a.co_class_teacher_name || '-';
  };

  const teachers = staff.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher'));

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => { setForm({ class_id: '', section_id: '', teacher_id: '', co_teacher_id: '' }); setDialogOpen(true); }}
          sx={btnStyle}>
          Assign Class Teacher
        </Button>
      </Box>

      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Class</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Class Teacher</TableCell>
              <TableCell>Co-Class Teacher</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: '#6c757d', py: 3 }}>No class teacher assignments</TableCell></TableRow>
            ) : assignments.map((a, i) => (
              <TableRow key={a.section_id || i}>
                <TableCell>{a.class_name || '-'}</TableCell>
                <TableCell>{a.section_name || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {getTeacherName(a) !== '-' ? getTeacherName(a) : <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Not assigned</span>}
                </TableCell>
                <TableCell>
                  {getCoTeacherName(a) !== '-' ? getCoTeacherName(a) : <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Not assigned</span>}
                </TableCell>
                <TableCell>{a.student_count || 0}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEditDialog(a)} sx={{ color: '#1976d2' }}>
                    <Edit sx={{ fontSize: 16 }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef', fontFamily, fontWeight: 600 }}>Assign Class Teacher</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Class</InputLabel>
              <Select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value, section_id: '' })} label="Class" sx={selectStyle}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Section</InputLabel>
              <Select value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })} label="Section" sx={selectStyle}>
                {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Divider sx={{ my: 1 }} />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Class Teacher</InputLabel>
              <Select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} label="Class Teacher" sx={selectStyle}>
                <MenuItem value="">— None —</MenuItem>
                {teachers.map(s => (
                  <MenuItem key={s.id} value={s.id} disabled={s.id === form.co_teacher_id}>{s.first_name} {s.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Co-Class Teacher (Optional)</InputLabel>
              <Select value={form.co_teacher_id} onChange={e => setForm({ ...form, co_teacher_id: e.target.value })} label="Co-Class Teacher (Optional)" sx={selectStyle}>
                <MenuItem value="">— None —</MenuItem>
                {teachers.map(s => (
                  <MenuItem key={s.id} value={s.id} disabled={s.id === form.teacher_id}>{s.first_name} {s.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} sx={btnStyle}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


// ============================================================
// 4. TIMETABLE TAB
// ============================================================
function TimetableTab({ classes, subjects, staff }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [sections, setSections] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [form, setForm] = useState({ day: '', period: '', subject_id: '', teacher_id: '', start_time: '', end_time: '' });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
  const periods = Array.from({ length: 8 }, (_, i) => i + 1);

  useEffect(() => {
    if (selectedClass) {
      studentsAPI.listSections(selectedClass).then(r => {
        const secs = r.data?.data || r.data || [];
        const validSecs = Array.isArray(secs) ? secs : [];
        setSections(validSecs);
        // Auto-select first section if available
        if (validSecs.length > 0) {
          setSelectedSection(String(validSecs[0].id));
        }
      }).catch((err) => { console.error('Failed to load sections:', err); setSections([]); });
    } else {
      setSections([]);
      setSelectedSection('');
    }
  }, [selectedClass]);

  const loadTimetable = useCallback(() => {
    if (!selectedClass) return;
    setLoading(true);
    academicsAPI.getTimetable({ class_id: selectedClass, section_id: selectedSection || undefined })
      .then(r => setEntries(r.data?.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSection]);

  useEffect(() => { loadTimetable(); }, [loadTimetable]);

  const handleCreate = async () => {
    const errs = validateForm(form, { day: ['required'], period: ['required'], subject_id: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    try {
      await academicsAPI.createTimetableEntry({
        class_id: selectedClass,
        section_id: selectedSection || undefined,
        subject_id: form.subject_id,
        teacher_id: form.teacher_id || undefined,
        day_of_week: form.day,
        period_number: form.period,
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined,
      });
      toast.success('Timetable entry created');
      setDialogOpen(false);
      setForm({ day: '', period: '', subject_id: '', teacher_id: '', start_time: '', end_time: '' });
      loadTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create entry');
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedClass || !selectedSection) {
      toast.error('Please select both Class and Section to auto-generate');
      return;
    }
    if (!window.confirm('This will replace the existing timetable for this class/section. Continue?')) return;
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await academicsAPI.autoGenerateTimetable({
        class_id: selectedClass,
        section_id: selectedSection,
        periods_per_day: 8,
        days: days,
      });
      const data = res.data?.data;
      setGenResult(data);
      toast.success(`Timetable generated: ${data?.entries_created || 0} periods created`);
      if (data?.class_teacher_note && data.class_teacher_note.includes('not reserved')) {
        toast(data.class_teacher_note, { icon: '⚠️', duration: 6000 });
      }
      loadTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to auto-generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await academicsAPI.deleteTimetableEntry(id);
      toast.success('Entry deleted');
      loadTimetable();
    } catch { toast.error('Failed to delete'); }
  };

  const getEntry = (day, period) => entries.find(e => e.day_of_week === day && e.period_number === period);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily }}>Class</InputLabel>
          <Select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }} label="Class" sx={selectStyle}>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontFamily }}>Section</InputLabel>
          <Select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} label="Section" sx={selectStyle}>
            {sections.length === 0 ? (
              <MenuItem value="" disabled>No sections found</MenuItem>
            ) : sections.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name || `Section ${s.id}`}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" size="small" onClick={handleAutoGenerate}
          disabled={!selectedClass || !selectedSection || generating}
          sx={{ ...btnStyle, borderColor: generating ? '#ccc' : '#14866d', color: generating ? '#999' : '#14866d', '&:hover': { borderColor: '#0d6b56', bgcolor: '#e8f5e9' }, '&.Mui-disabled': { borderColor: '#dee2e6', color: '#adb5bd' } }}>
          {generating ? <CircularProgress size={16} sx={{ mr: 1 }} /> : <SwapHoriz sx={{ mr: 0.5, fontSize: 18 }} />}
          {generating ? 'Generating...' : '⚡ Auto-Generate'}
        </Button>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          disabled={!selectedClass} sx={btnStyle}>
          Add Entry
        </Button>
      </Box>

      {/* Auto-generate result info */}
      {genResult && genResult.warnings && genResult.warnings.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: '6px', mb: 2, fontFamily }}>
          <strong>Some subjects could not be fully placed:</strong>
          {genResult.warnings.map((w, i) => (
            <span key={i}> {w.subject} ({w.placed}/{w.needed} periods){i < genResult.warnings.length - 1 ? ',' : ''}</span>
          ))}
        </Alert>
      )}

      {!selectedClass ? (
        <Alert severity="info" sx={{ borderRadius: '6px', fontFamily }}>Select a class to view timetable</Alert>
      ) : loading ? <LinearProgress /> : (
        <TableContainer sx={{ ...tableStyles, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 90 }}>Day / Period</TableCell>
                {periods.map(p => <TableCell key={p} align="center" sx={{ minWidth: 110 }}>Period {p}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {days.map(day => (
                <TableRow key={day}>
                  <TableCell sx={{ fontWeight: 700, fontFamily }}>{dayLabels[day]}</TableCell>
                  {periods.map(p => {
                    const entry = getEntry(day, p);
                    return (
                      <TableCell key={p} align="center" sx={{ fontSize: '0.75rem', p: 0.5, position: 'relative', cursor: entry ? 'pointer' : 'default', '&:hover .del-btn': { opacity: 1 } }}>
                        {entry ? (
                          <Box>
                            <Typography variant="caption" display="block" sx={{ fontWeight: 600, fontFamily, color: '#212529' }}>{entry.subject_name || '-'}</Typography>
                            <Typography variant="caption" display="block" sx={{ color: '#6c757d', fontFamily }}>{entry.teacher_name || ''}</Typography>
                            <IconButton className="del-btn" size="small" onClick={() => handleDeleteEntry(entry.id)}
                              sx={{ position: 'absolute', top: 0, right: 0, opacity: 0, transition: 'opacity 0.2s', p: 0.2 }}>
                              <Delete sx={{ fontSize: 12, color: '#dc3545' }} />
                            </IconButton>
                          </Box>
                        ) : <span style={{ color: '#dee2e6' }}>—</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Summary below timetable */}
      {selectedClass && !loading && entries.length > 0 && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
          <Typography variant="caption" sx={{ fontFamily, color: '#6c757d' }}>
            Total periods: {entries.length} | Empty slots: {(periods.length * days.length) - entries.length} | 
            Subjects: {[...new Set(entries.map(e => e.subject_name))].filter(Boolean).length}
          </Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef', fontFamily, fontWeight: 600 }}>Add Timetable Entry</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Day</InputLabel>
              <Select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} label="Day" sx={selectStyle}>
                {days.map(d => <MenuItem key={d} value={d}>{dayLabels[d]}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Period</InputLabel>
              <Select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} label="Period" sx={selectStyle}>
                {periods.map(p => <MenuItem key={p} value={p}>Period {p}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Subject</InputLabel>
              <Select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} label="Subject" sx={selectStyle}>
                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Teacher</InputLabel>
              <Select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} label="Teacher" sx={selectStyle}>
                <MenuItem value="">— None —</MenuItem>
                {staff.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher')).map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.first_name} {s.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Start Time" type="time" value={form.start_time}
              onChange={e => setForm({ ...form, start_time: e.target.value })}
              InputLabelProps={{ shrink: true }} sx={inputStyle} />
            <TextField size="small" label="End Time" type="time" value={form.end_time}
              onChange={e => setForm({ ...form, end_time: e.target.value })}
              InputLabelProps={{ shrink: true }} sx={inputStyle} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={btnStyle}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// 5. SUBSTITUTIONS TAB
// ============================================================
function SubstitutionsTab({ staff, classes }) {
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: '', original_teacher_id: '', substitute_teacher_id: '', class_id: '', period: '', reason: '' });
  // Original teacher's timetable slots — used to resolve timetable_id behind the scenes
  const [teacherSlots, setTeacherSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    acAPI.listSubstitutions()
      .then(r => setSubstitutions(r.data?.data || []))
      .catch(() => setSubstitutions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Load the original teacher's timetable slots so we can map class+period -> timetable_id
  useEffect(() => {
    if (!form.original_teacher_id) { setTeacherSlots([]); return; }
    academicsAPI.getTimetable({ teacher_id: form.original_teacher_id })
      .then(r => {
        const d = r.data?.data;
        setTeacherSlots((Array.isArray(d) ? d : (d?.items || [])).filter(s => !s.is_break));
      })
      .catch(() => setTeacherSlots([]));
  }, [form.original_teacher_id]);

  const handleCreate = async () => {
    const errs = validateForm(form, { date: ['required'], original_teacher_id: ['required'], substitute_teacher_id: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    if (String(form.original_teacher_id) === String(form.substitute_teacher_id)) {
      toast.error('Substitute must be different from the original teacher'); return;
    }
    // Resolve timetable_id from the teacher's slots matching class + period
    const match = teacherSlots.find(s =>
      String(s.class_id) === String(form.class_id) &&
      String(s.period_number) === String(form.period)
    ) || teacherSlots.find(s => String(s.period_number) === String(form.period));

    if (!match) {
      toast.error('No timetable period found for this teacher with the selected class & period. Please ensure the timetable is set.');
      return;
    }
    setSaving(true);
    try {
      await acAPI.createSubstitution({
        timetable_id: match.id,
        substitute_teacher_id: form.substitute_teacher_id,
        date: form.date,
        reason: form.reason,
      });
      toast.success('Substitution created');
      setDialogOpen(false);
      setForm({ date: '', original_teacher_id: '', substitute_teacher_id: '', class_id: '', period: '', reason: '' });
      setTeacherSlots([]);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this substitution?')) return;
    try {
      await acAPI.deleteSubstitution(id);
      toast.success('Deleted');
      loadData();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <LinearProgress />;

  const teachers = staff.filter(s => s.role === 'teacher' || s.designation?.toLowerCase().includes('teacher'));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={btnStyle}>
          Create Substitution
        </Button>
      </Box>

      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Original Teacher</TableCell>
              <TableCell>Substitute</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {substitutions.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No substitutions</TableCell></TableRow>
            ) : substitutions.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.date}</TableCell>
                <TableCell>{s.original_teacher_name || s.original_teacher_id}</TableCell>
                <TableCell>{s.substitute_teacher_name || s.substitute_teacher_id}</TableCell>
                <TableCell>{s.class_name || s.class_id}</TableCell>
                <TableCell>{s.period}</TableCell>
                <TableCell>{s.reason || '-'}</TableCell>
                <TableCell>
                  <Chip label={s.status || 'active'} size="small" sx={chipStyle}
                    color={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'error' : 'primary'} />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleDelete(s.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef' }}>Create Substitution</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" label="Date" type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }} sx={inputStyle} />
            <FormControl fullWidth size="small">
              <InputLabel>Original Teacher</InputLabel>
              <Select value={form.original_teacher_id} onChange={e => setForm({ ...form, original_teacher_id: e.target.value })} label="Original Teacher" sx={selectStyle}>
                {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Substitute Teacher</InputLabel>
              <Select value={form.substitute_teacher_id} onChange={e => setForm({ ...form, substitute_teacher_id: e.target.value })} label="Substitute Teacher" sx={selectStyle}>
                {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} label="Class" sx={selectStyle}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Period" type="number" value={form.period}
              onChange={e => setForm({ ...form, period: e.target.value })}
              sx={inputStyle} />
            <TextField size="small" label="Reason" multiline rows={2} value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              sx={inputStyle} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving} sx={btnStyle}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


// ============================================================
// 6. SUBJECTS TAB
// ============================================================
function SubjectsTab({ subjects, setSubjects, classes }) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'theory', is_active: true, description: '', class_ids: [] });
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classSubjectsMap, setClassSubjectsMap] = useState({});
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSubjectIds, setAssignSubjectIds] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadSubjects = useCallback(() => {
    setLoading(true);
    academicsAPI.listSubjects()
      .then(r => setSubjects(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setSubjects]);

  // Load class-subject mappings for all classes
  const loadClassSubjects = useCallback(() => {
    if (classes.length === 0) return;
    const promises = classes.map(c =>
      academicsAPI.getClassSubjects(c.id).then(r => ({ classId: c.id, subjects: r.data?.data || [] })).catch(() => ({ classId: c.id, subjects: [] }))
    );
    Promise.all(promises).then(results => {
      const map = {};
      results.forEach(r => { map[r.classId] = r.subjects; });
      setClassSubjectsMap(map);
    });
  }, [classes]);

  useEffect(() => { loadClassSubjects(); }, [loadClassSubjects]);

  const validateSubjectForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Subject name is required';
    if (!form.code.trim()) errors.code = 'Subject code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSubjectForm()) return;
    setSaving(true);
    try {
      if (editItem) {
        await academicsAPI.updateSubject(editItem.id, form);
        toast.success('Subject updated successfully');
      } else {
        await academicsAPI.createSubject(form);
        toast.success('Subject created successfully');
      }
      setDialogOpen(false);
      setEditItem(null);
      setForm({ name: '', code: '', type: 'theory', is_active: true, description: '', class_ids: [] });
      setFormErrors({});
      loadSubjects();
      loadClassSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject? This will also remove all class assignments.')) return;
    try {
      await academicsAPI.deleteSubject(id);
      toast.success('Subject deleted');
      loadSubjects();
      loadClassSubjects();
    } catch { toast.error('Failed to delete'); }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, code: item.code || '', type: item.type || 'theory', is_active: item.is_active !== false, description: item.description || '', class_ids: item.class_ids || [] });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Handle bulk assign subjects to a class
  const handleAssignSubjects = async () => {
    if (!assignClassId) { toast.error('Please select a class'); return; }
    if (assignSubjectIds.length === 0) { toast.error('Please select at least one subject'); return; }
    setAssignLoading(true);
    try {
      const existingSubjectIds = (classSubjectsMap[assignClassId] || []).map(cs => cs.subject?.id);
      const newSubjectIds = assignSubjectIds.filter(id => !existingSubjectIds.includes(id));
      if (newSubjectIds.length === 0) {
        toast.info('All selected subjects are already assigned to this class');
        setAssignLoading(false);
        return;
      }
      await Promise.all(newSubjectIds.map(subjectId =>
        academicsAPI.assignSubject({ class_id: assignClassId, subject_id: subjectId })
      ));
      toast.success(`${newSubjectIds.length} subject(s) assigned to class`);
      setAssignDialogOpen(false);
      setAssignClassId('');
      setAssignSubjectIds([]);
      loadClassSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign subjects');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveClassSubject = async (csId) => {
    if (!window.confirm('Remove this subject from the class?')) return;
    try {
      await academicsAPI.removeClassSubject(csId);
      toast.success('Subject removed from class');
      loadClassSubjects();
    } catch { toast.error('Failed to remove'); }
  };

  // Get assigned classes for a subject
  const getAssignedClasses = (subjectId) => {
    const assignedClasses = [];
    Object.entries(classSubjectsMap).forEach(([classId, csItems]) => {
      csItems.forEach(cs => {
        if (cs.subject?.id === subjectId) {
          const cls = classes.find(c => c.id === parseInt(classId));
          if (cls) assignedClasses.push({ csId: cs.id, className: cls.name, teacherName: cs.teacher ? `${cs.teacher.first_name} ${cs.teacher.last_name || ''}`.trim() : null });
        }
      });
    });
    return assignedClasses;
  };

  // Filter subjects by class
  const filtered = subjects.filter(s => {
    const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (!classFilter) return true;
    const assignedClasses = getAssignedClasses(s.id);
    return assignedClasses.some(ac => ac.className === classes.find(c => c.id === parseInt(classFilter))?.name);
  });

  return (
    <Box>
      {/* Header with Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h2" sx={{ ...sectionTitle, borderBottom: 'none', mb: 0, pb: 0 }}>
          📚 Subjects Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<Assignment />}
            onClick={() => { setAssignDialogOpen(true); setAssignClassId(''); setAssignSubjectIds([]); }}
            sx={btnStyle}>
            Assign to Class
          </Button>
          <Button variant="contained" size="small" startIcon={<Add />}
            onClick={() => { setEditItem(null); setForm({ name: '', code: '', type: 'theory', is_active: true, description: '', class_ids: [] }); setFormErrors({}); setDialogOpen(true); }}
            sx={btnStyle}>
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Two-column layout: Left = All Subjects, Right = Class-wise view */}
      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* Left: All Subjects List */}
        <Grid item xs={12} md={classFilter ? 7 : 12}>
          {/* Search + Filter Bar */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small" placeholder="Search subjects..."
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#6c757d' }} /></InputAdornment> }}
              sx={{ width: 240, ...inputStyle }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel sx={{ fontFamily }}>Filter by Class</InputLabel>
              <Select value={classFilter} onChange={e => setClassFilter(e.target.value)} label="Filter by Class" sx={selectStyle}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            {classFilter && (
              <Chip label={`Showing: ${classes.find(c => c.id === parseInt(classFilter))?.name}`} onDelete={() => setClassFilter('')} size="small" sx={{ ...chipStyle, bgcolor: '#e3f2fd', color: '#1565c0' }} />
            )}
          </Box>

          {/* Subjects Table */}
          {loading ? <LinearProgress /> : (
            <TableContainer sx={tableStyles}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Assigned Classes</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ color: '#6c757d', py: 3 }}>No subjects found{classFilter ? ' for selected class' : ''}</TableCell></TableRow>
                  ) : filtered.map(s => {
                    const assignedClasses = getAssignedClasses(s.id);
                    return (
                      <TableRow key={s.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                        <TableCell sx={{ fontFamily: "'Fira Code', monospace", fontSize: '0.8rem', color: '#6c757d' }}>{s.code || '-'}</TableCell>
                        <TableCell><Chip label={s.type || 'theory'} size="small" sx={{ ...chipStyle, textTransform: 'capitalize' }} color={s.type === 'practical' ? 'secondary' : s.type === 'both' ? 'info' : 'default'} /></TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          {assignedClasses.length === 0 ? (
                            <Typography variant="caption" sx={{ color: '#adb5bd', fontStyle: 'italic' }}>Not assigned</Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {assignedClasses.map((ac, i) => (
                                <Tooltip key={i} title={ac.teacherName ? `Teacher: ${ac.teacherName}` : 'No teacher assigned'}>
                                  <Chip label={ac.className} size="small" variant="outlined"
                                    onDelete={() => handleRemoveClassSubject(ac.csId)}
                                    sx={{ ...chipStyle, height: 22, borderColor: '#90caf9' }} />
                                </Tooltip>
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={s.is_active !== false ? 'Active' : 'Inactive'} size="small" sx={chipStyle}
                            color={s.is_active !== false ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => openEdit(s)} sx={{ color: '#1976d2' }}><Edit sx={{ fontSize: 16 }} /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(s.id)} sx={{ color: '#dc3545' }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>

        {/* Right: Class-wise Subject Panel (shows when class is selected) */}
        {classFilter && (
          <Grid item xs={12} md={5} sx={{ position: 'sticky', top: 16 }}>
            <Box sx={{ p: 2, border: '1px solid #dee2e6', borderRadius: '8px', bgcolor: '#f8f9fa', mt: '52px' }}>
              <Typography variant="h3" sx={{ fontSize: '1rem', fontWeight: 600, fontFamily, color: '#212529', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBook sx={{ fontSize: 20, color: '#1976d2' }} />
                {classes.find(c => c.id === parseInt(classFilter))?.name} — Subjects
              </Typography>
              {(classSubjectsMap[classFilter] || []).length === 0 ? (
                <Typography variant="body2" sx={{ color: '#6c757d', fontStyle: 'italic', fontFamily }}>No subjects assigned to this class yet.</Typography>
              ) : (
                <TableContainer sx={{ ...tableStyles, '& .MuiTableCell-root': { border: '1px solid #dee2e6', py: 1, px: 1.5, fontSize: '0.82rem', fontFamily } }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Teacher</TableCell>
                        <TableCell width={40}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(classSubjectsMap[classFilter] || []).map(cs => (
                        <TableRow key={cs.id}>
                          <TableCell sx={{ fontWeight: 500 }}>{cs.subject?.name || '-'}</TableCell>
                          <TableCell sx={{ fontFamily: "'Fira Code', monospace", fontSize: '0.75rem', color: '#6c757d' }}>{cs.subject?.code || '-'}</TableCell>
                          <TableCell>{cs.teacher ? `${cs.teacher.first_name} ${cs.teacher.last_name || ''}`.trim() : <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Not assigned</span>}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleRemoveClassSubject(cs.id)} sx={{ color: '#dc3545' }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#6c757d', fontFamily }}>
                Total: {(classSubjectsMap[classFilter] || []).length} subject(s) assigned
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Add/Edit Subject Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef', fontFamily, fontWeight: 600 }}>{editItem ? 'Edit Subject' : 'New Subject'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField size="small" label="Name" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors({ ...formErrors, name: '' }); }}
              error={!!formErrors.name} helperText={formErrors.name}
              sx={inputStyle} />
            <TextField size="small" label="Code" value={form.code} onChange={e => { setForm({ ...form, code: e.target.value }); setFormErrors({ ...formErrors, code: '' }); }}
              error={!!formErrors.code} helperText={formErrors.code} placeholder="e.g. MATH-01"
              sx={inputStyle} />
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Type</InputLabel>
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} label="Type" sx={selectStyle}>
                <MenuItem value="theory">Theory</MenuItem>
                <MenuItem value="practical">Practical</MenuItem>
                <MenuItem value="both">Both (Theory + Practical)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Assign to Classes</InputLabel>
              <Select multiple value={form.class_ids} onChange={e => setForm({ ...form, class_ids: e.target.value })} label="Assign to Classes" sx={selectStyle}
                renderValue={(selected) => classes.filter(c => selected.includes(c.id)).map(c => c.name).join(', ')}>
                {classes.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    <Checkbox checked={form.class_ids.includes(c.id)} size="small" />
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Description" multiline rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              sx={inputStyle} />
            <FormControlLabel
              control={<Checkbox checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} size="small" />}
              label={<Typography sx={{ fontFamily, fontSize: '0.875rem' }}>Active</Typography>}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={btnStyle}>
            {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Subjects to Class Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef', fontFamily, fontWeight: 600 }}>Assign Subjects to Class</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Select Class</InputLabel>
              <Select value={assignClassId} onChange={e => { setAssignClassId(e.target.value); setAssignSubjectIds([]); }} label="Select Class" sx={selectStyle}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            {assignClassId && (
              <>
                <Typography variant="caption" sx={{ color: '#6c757d', fontFamily }}>
                  Select subjects to assign. Already assigned subjects are pre-checked.
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #dee2e6', borderRadius: '6px', p: 1.5 }}>
                  {subjects.filter(s => s.is_active !== false).map(s => {
                    const alreadyAssigned = (classSubjectsMap[assignClassId] || []).some(cs => cs.subject?.id === s.id);
                    return (
                      <FormControlLabel key={s.id}
                        control={
                          <Checkbox size="small"
                            checked={assignSubjectIds.includes(s.id) || alreadyAssigned}
                            disabled={alreadyAssigned}
                            onChange={e => {
                              if (e.target.checked) setAssignSubjectIds([...assignSubjectIds, s.id]);
                              else setAssignSubjectIds(assignSubjectIds.filter(id => id !== s.id));
                            }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontFamily }}>{s.name} ({s.code || 'N/A'}) {alreadyAssigned ? <Chip label="Assigned" size="small" sx={{ ml: 1, ...chipStyle, height: 18 }} color="info" /> : ''}</Typography>}
                        sx={{ display: 'block', mb: 0.5 }}
                      />
                    );
                  })}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSubjects} disabled={assignLoading || !assignClassId || assignSubjectIds.length === 0}
            sx={btnStyle}>
            {assignLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            {assignLoading ? 'Assigning...' : `Assign ${assignSubjectIds.length} Subject(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// 7. LESSON PLANS TAB
// ============================================================
function LessonPlansTab() {
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', plan: null });
  const [feedback, setFeedback] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      acAPI.getPendingLessonPlans().catch(() => ({ data: { data: [] } })),
      acAPI.getLessonPlanStats().catch(() => ({ data: { data: {} } })),
    ]).then(([plansRes, statsRes]) => {
      setPlans(plansRes.data?.data || []);
      setStats(statsRes.data?.data || {});
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async () => {
    const { type, plan } = actionDialog;
    try {
      if (type === 'approve') {
        await acAPI.approveLessonPlan(plan.id);
        toast.success('Lesson plan approved');
      } else if (type === 'reject') {
        await acAPI.rejectLessonPlan(plan.id, { feedback });
        toast.success('Lesson plan rejected');
      } else if (type === 'revision') {
        await acAPI.revisionLessonPlan(plan.id, { feedback });
        toast.success('Revision requested');
      }
      setActionDialog({ open: false, type: '', plan: null });
      setFeedback('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Pending', value: stats.pending || 0, color: '#ac6600' },
          { label: 'Approved', value: stats.approved || 0, color: '#14866d' },
          { label: 'Rejected', value: stats.rejected || 0, color: '#d33' },
          { label: 'In Revision', value: stats.in_revision || 0, color: '#36c' },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ ...cardStyle, borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h3" sx={{ ...sectionTitle }}>Pending Lesson Plans</Typography>

      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No pending lesson plans</TableCell></TableRow>
            ) : plans.map(p => (
              <TableRow key={p.id}>
                <TableCell><strong>{p.title}</strong></TableCell>
                <TableCell>{p.teacher_name || '-'}</TableCell>
                <TableCell>{p.subject_name || '-'}</TableCell>
                <TableCell>{p.class_name || '-'}</TableCell>
                <TableCell>{p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Tooltip title="Approve">
                    <IconButton size="small" color="success" onClick={() => setActionDialog({ open: true, type: 'approve', plan: p })}>
                      <ThumbUp sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <IconButton size="small" color="error" onClick={() => setActionDialog({ open: true, type: 'reject', plan: p })}>
                      <ThumbDown sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Request Revision">
                    <IconButton size="small" color="warning" onClick={() => setActionDialog({ open: true, type: 'revision', plan: p })}>
                      <Undo sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', plan: null })} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef', textTransform: 'capitalize' }}>
          {actionDialog.type} Lesson Plan: {actionDialog.plan?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {actionDialog.type === 'approve' ? (
            <Alert severity="success" sx={{ borderRadius: '6px', mt: 1 }}>This will approve the lesson plan and notify the teacher.</Alert>
          ) : (
            <TextField
              fullWidth size="small" label="Feedback / Reason" multiline rows={3}
              value={feedback} onChange={e => setFeedback(e.target.value)}
              sx={{ mt: 1, ...inputStyle }}
              placeholder={actionDialog.type === 'reject' ? 'Reason for rejection...' : 'What needs to be revised...'}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setActionDialog({ open: false, type: '', plan: null })} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleAction}
            color={actionDialog.type === 'approve' ? 'success' : actionDialog.type === 'reject' ? 'error' : 'warning'}
            sx={btnStyle}>
            Confirm {actionDialog.type}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// 8. HOMEWORK MONITOR TAB
// ============================================================
function HomeworkMonitorTab({ classes }) {
  const [overview, setOverview] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      acAPI.getHomeworkOverview({ class_id: selectedClass || undefined }).catch(() => ({ data: { data: [] } })),
      acAPI.getHomeworkAnalytics().catch(() => ({ data: { data: {} } })),
      acAPI.getHomeworkWorkloadAlerts().catch(() => ({ data: { data: [] } })),
    ]).then(([ovRes, anRes, alRes]) => {
      setOverview(ovRes.data?.data || []);
      setAnalytics(anRes.data?.data || {});
      setAlerts(alRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, [selectedClass]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = overview.filter(h =>
    !search || (h.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.teacher_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Analytics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Homework', value: analytics.total || 0 },
          { label: 'Active', value: analytics.active || 0 },
          { label: 'Avg Submission Rate', value: `${analytics.avg_submission_rate || 0}%` },
          { label: 'Overdue', value: analytics.overdue || 0 },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Workload Alerts */}
      {alerts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {alerts.map((a, i) => (
            <Alert key={i} severity="warning" sx={{ borderRadius: '6px', mb: 1 }}>
              <strong>{a.class_name || 'Class'}:</strong> {a.message || `${a.homework_count || 0} homework items this week`}
            </Alert>
          ))}
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Class</InputLabel>
          <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} label="Class" sx={selectStyle}>
            <MenuItem value="">All Classes</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small" placeholder="Search..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
          sx={{ width: 250, ...inputStyle }}
        />
      </Box>

      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Submissions</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No homework found</TableCell></TableRow>
            ) : filtered.slice(0, 50).map(h => (
              <TableRow key={h.id}>
                <TableCell><strong>{h.title}</strong></TableCell>
                <TableCell>{h.teacher_name || '-'}</TableCell>
                <TableCell>{h.class_name || '-'}{h.section_name ? ` - ${h.section_name}` : ''}</TableCell>
                <TableCell>{h.subject_name || '-'}</TableCell>
                <TableCell>{h.due_date || '-'}</TableCell>
                <TableCell>
                  {h.total_submissions || 0}/{h.total_students || '?'}
                  {h.total_students && (
                    <LinearProgress variant="determinate"
                      value={Math.min(((h.total_submissions || 0) / h.total_students) * 100, 100)}
                      sx={{ mt: 0.5, height: 4, borderRadius: '2px' }} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={h.status || 'active'} size="small" sx={{ ...chipStyle, textTransform: 'capitalize' }}
                    color={h.status === 'published' ? 'primary' : h.status === 'closed' ? 'default' : 'warning'} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ============================================================
// 9. SYLLABUS PROGRESS TAB
// ============================================================
function SyllabusProgressTab({ classes, subjects }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    academicsAPI.getSyllabusOverview({ class_id: selectedClass || undefined, subject_id: selectedSubject || undefined })
      .then(r => {
        const d = r.data?.data;
        // Endpoint returns an object { by_subject: [...] }; fall back to array shapes
        if (Array.isArray(d)) setData(d);
        else if (Array.isArray(d?.by_subject)) setData(d.by_subject);
        else if (Array.isArray(d?.items)) setData(d.items);
        else setData([]);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSubject]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Class</InputLabel>
          <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} label="Class" sx={selectStyle}>
            <MenuItem value="">All Classes</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Subject</InputLabel>
          <Select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} label="Subject" sx={selectStyle}>
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button size="small" startIcon={<Refresh />} onClick={loadData} sx={btnStyle}>Refresh</Button>
      </Box>

      {data.length === 0 ? (
        <Alert severity="info" sx={selectStyle}>No syllabus data available for the selected filters.</Alert>
      ) : (
        <TableContainer sx={tableStyles}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Total Topics</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, i) => {
                const pct = item.completion_percentage || item.avg_completion || 0;
                const status = pct >= 80 ? 'On Track' : pct >= 50 ? 'In Progress' : pct >= 20 ? 'Behind' : 'At Risk';
                const statusColor = pct >= 80 ? 'success' : pct >= 50 ? 'primary' : pct >= 20 ? 'warning' : 'error';
                return (
                  <TableRow key={i}>
                    <TableCell><strong>{item.subject_name || '-'}</strong></TableCell>
                    <TableCell>{item.class_name || '-'}</TableCell>
                    <TableCell>{item.teacher_name || '-'}</TableCell>
                    <TableCell>{item.total_topics || 0}</TableCell>
                    <TableCell>{item.completed_topics || 0}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                          sx={{ flex: 1, height: 8, borderRadius: '4px' }} />
                        <Typography variant="caption" fontWeight={700}>{Math.round(pct)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={status} size="small" color={statusColor} sx={chipStyle} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}


// ============================================================
// 10. PROMOTIONS TAB
// ============================================================
function PromotionsTab({ classes }) {
  const [criteria, setCriteria] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [criteriaForm, setCriteriaForm] = useState({ class_id: '', min_attendance: 75, min_marks: 35, pass_all_subjects: false });
  const [evaluating, setEvaluating] = useState(false);
  const [overrideDialog, setOverrideDialog] = useState({ open: false, student: null });
  const [overrideReason, setOverrideReason] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    acAPI.getPromotionCriteria()
      .then(r => setCriteria(r.data?.data || []))
      .catch(() => setCriteria([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (selectedClass) {
      acAPI.getPromotionSummary(selectedClass)
        .then(r => setSummary(r.data?.data || null))
        .catch(() => setSummary(null));
    }
  }, [selectedClass]);

  const handleSaveCriteria = async () => {
    const errs = validateForm(criteriaForm, { class_id: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    try {
      await acAPI.createPromotionCriteria(criteriaForm);
      toast.success('Criteria saved');
      setDialogOpen(false);
      setCriteriaForm({ class_id: '', min_attendance: 75, min_marks: 35, pass_all_subjects: false });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save criteria');
    }
  };

  const handleEvaluate = async () => {
    if (!selectedClass) { toast.error('Select a class first'); return; }
    setEvaluating(true);
    try {
      await acAPI.evaluatePromotions(selectedClass, {});
      toast.success('Evaluation complete');
      acAPI.getPromotionSummary(selectedClass).then(r => setSummary(r.data?.data || null)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Evaluation failed');
    } finally { setEvaluating(false); }
  };

  const handleOverride = async () => {
    try {
      await acAPI.overridePromotion(overrideDialog.student.id, { reason: overrideReason, promoted: !overrideDialog.student.promoted });
      toast.success('Override applied');
      setOverrideDialog({ open: false, student: null });
      setOverrideReason('');
      if (selectedClass) {
        acAPI.getPromotionSummary(selectedClass).then(r => setSummary(r.data?.data || null)).catch(() => {});
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    }
  };

  const handleConfirm = async () => {
    if (!selectedClass) return;
    if (!window.confirm('Confirm all promotions for this class? This action cannot be undone.')) return;
    try {
      await acAPI.confirmPromotions(selectedClass);
      toast.success('Promotions confirmed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Criteria Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ ...sectionTitle }}>Promotion Criteria</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={btnStyle}>
          Define Criteria
        </Button>
      </Box>

      {criteria.length > 0 && (
        <TableContainer sx={{ ...tableStyles, mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Min Attendance</TableCell>
                <TableCell>Min Marks</TableCell>
                <TableCell>Pass All Subjects</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {criteria.map((c, i) => (
                <TableRow key={i}>
                  <TableCell>{c.class_name || c.class_id}</TableCell>
                  <TableCell>{c.min_attendance}%</TableCell>
                  <TableCell>{c.min_marks}%</TableCell>
                  <TableCell>{c.pass_all_subjects ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Evaluation Section */}
      <Typography variant="h3" sx={{ ...sectionTitle }}>Evaluate & Promote</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Select Class</InputLabel>
          <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} label="Select Class" sx={selectStyle}>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" onClick={handleEvaluate} disabled={!selectedClass || evaluating}
          sx={btnStyle}>
          {evaluating ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Evaluate Students
        </Button>
        <Button variant="contained" size="small" color="success" onClick={handleConfirm} disabled={!selectedClass}
          sx={btnStyle}>
          Confirm Promotions
        </Button>
      </Box>

      {summary && summary.students && (
        <TableContainer sx={tableStyles}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Roll No</TableCell>
                <TableCell>Attendance</TableCell>
                <TableCell>Avg Marks</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.students.map((s, i) => (
                <TableRow key={i}>
                  <TableCell><strong>{s.student_name}</strong></TableCell>
                  <TableCell>{s.roll_number || '-'}</TableCell>
                  <TableCell>{s.attendance || 0}%</TableCell>
                  <TableCell>{s.avg_marks || 0}%</TableCell>
                  <TableCell>
                    <Chip label={s.promoted ? 'Promoted' : 'Detained'} size="small" sx={chipStyle}
                      color={s.promoted ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => { setOverrideDialog({ open: true, student: s }); setOverrideReason(''); }}
                      sx={{ ...btnStyle, fontSize: '0.75rem' }}>
                      Override
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Criteria Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef' }}>Define Promotion Criteria</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Class</InputLabel>
              <Select value={criteriaForm.class_id} onChange={e => setCriteriaForm({ ...criteriaForm, class_id: e.target.value })} label="Class" sx={selectStyle}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Minimum Attendance (%)" type="number" value={criteriaForm.min_attendance}
              onChange={e => setCriteriaForm({ ...criteriaForm, min_attendance: Number(e.target.value) })}
              sx={inputStyle} />
            <TextField size="small" label="Minimum Marks (%)" type="number" value={criteriaForm.min_marks}
              onChange={e => setCriteriaForm({ ...criteriaForm, min_marks: Number(e.target.value) })}
              sx={inputStyle} />
            <FormControlLabel
              control={<Checkbox checked={criteriaForm.pass_all_subjects} onChange={e => setCriteriaForm({ ...criteriaForm, pass_all_subjects: e.target.checked })} size="small" />}
              label="Must pass all subjects"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCriteria} sx={btnStyle}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={overrideDialog.open} onClose={() => setOverrideDialog({ open: false, student: null })} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef' }}>Override Promotion: {overrideDialog.student?.student_name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ borderRadius: '6px', mb: 2, mt: 1 }}>
            This will {overrideDialog.student?.promoted ? 'detain' : 'promote'} the student manually.
          </Alert>
          <TextField fullWidth size="small" label="Reason for Override" multiline rows={3}
            value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
            sx={inputStyle} />
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setOverrideDialog({ open: false, student: null })} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleOverride} sx={btnStyle}>Apply Override</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// 11. CALENDAR TAB
// ============================================================
function CalendarTab({ classes }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', event_type: 'event', class_id: '' });
  const [filter, setFilter] = useState('');

  const loadData = useCallback(() => {
    setLoading(true);
    academicsAPI.getCalendar()
      .then(r => {
        const d = r.data?.data;
        setEvents(Array.isArray(d) ? d : (d?.items || d?.events || []));
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.start_date) { toast.error('Start date is required'); return; }
    try {
      const payload = {
        ...form,
        class_id: form.class_id || null,
        end_date: form.end_date || form.start_date,
      };
      await academicsAPI.createCalendarEvent(payload);
      toast.success('Event created');
      setDialogOpen(false);
      setForm({ title: '', description: '', start_date: '', end_date: '', event_type: 'event', class_id: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const filtered = events.filter(e =>
    !filter || e.event_type === filter
  );

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Event Type</InputLabel>
            <Select value={filter} onChange={e => setFilter(e.target.value)} label="Event Type" sx={selectStyle}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
              <MenuItem value="exam">Exam</MenuItem>
              <MenuItem value="ptm">PTM</MenuItem>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="cultural">Cultural</MenuItem>
              <MenuItem value="sports">Sports</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="deadline">Deadline</MenuItem>
              <MenuItem value="vacation">Vacation</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={btnStyle}>
          Add Event
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Alert severity="info" sx={selectStyle}>No calendar events found.</Alert>
      ) : (
        <TableContainer sx={tableStyles}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((e, i) => (
                <TableRow key={e.id || i}>
                  <TableCell><strong>{e.title}</strong></TableCell>
                  <TableCell>
                    <Chip label={e.event_type || 'academic'} size="small" sx={{ ...chipStyle, textTransform: 'capitalize' }}
                      color={e.event_type === 'holiday' ? 'error' : e.event_type === 'exam' ? 'warning' : 'primary'} />
                  </TableCell>
                  <TableCell>{e.start_date ? new Date(e.start_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{e.end_date ? new Date(e.end_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{e.class_name || 'All'}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ borderBottom: '1px solid #e9ecef' }}>Create Calendar Event</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              sx={inputStyle} />
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })} label="Event Type" sx={selectStyle}>
                <MenuItem value="holiday">Holiday</MenuItem>
                <MenuItem value="exam">Exam</MenuItem>
                <MenuItem value="ptm">PTM</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="cultural">Cultural</MenuItem>
                <MenuItem value="sports">Sports</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="deadline">Deadline</MenuItem>
                <MenuItem value="vacation">Vacation</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="Start Date" type="date" value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
              InputLabelProps={{ shrink: true }} sx={inputStyle} />
            <TextField size="small" label="End Date" type="date" value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }} sx={inputStyle} />
            <FormControl fullWidth size="small">
              <InputLabel>Class (optional)</InputLabel>
              <Select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} label="Class (optional)" sx={selectStyle}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Description" multiline rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              sx={inputStyle} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #e9ecef', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={btnStyle}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={btnStyle}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// 12. REPORTS TAB
// ============================================================
function ReportsTab({ classes }) {
  const [reportType, setReportType] = useState('class-performance');
  const [data, setData] = useState(null);     // raw response object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Load exams + teachers once (for the selectors)
  useEffect(() => {
    academicsAPI.listExams().then(r => {
      const d = r.data?.data;
      setExams(Array.isArray(d) ? d : (d?.items || []));
    }).catch(() => setExams([]));
    staffAPI.list({ role: 'teacher', limit: 200 }).then(r => {
      const d = r.data?.data;
      setTeachers(Array.isArray(d) ? d : (d?.items || []));
    }).catch(() => setTeachers([]));
  }, []);

  const loadReport = useCallback(() => {
    setError('');
    // Validate required inputs per report type
    if (reportType === 'class-performance' || reportType === 'cross-section') {
      if (!selectedClass) { setError('Please select a Class'); setData(null); return; }
      if (!selectedExam) { setError('Please select an Exam'); setData(null); return; }
    }
    if (reportType === 'teacher-performance' && !selectedTeacher) {
      setError('Please select a Teacher'); setData(null); return;
    }
    if (reportType === 'trends' && !selectedClass) {
      setError('Please select a Class'); setData(null); return;
    }

    setLoading(true);
    let promise;
    switch (reportType) {
      case 'class-performance':
        promise = acAPI.getClassPerformance({ class_id: selectedClass, exam_id: selectedExam });
        break;
      case 'teacher-performance':
        promise = acAPI.getTeacherPerformance({ teacher_id: selectedTeacher });
        break;
      case 'cross-section':
        promise = acAPI.getCrossSectionReport({ class_id: selectedClass, exam_id: selectedExam });
        break;
      case 'trends':
        promise = acAPI.getTrends({ class_id: selectedClass });
        break;
      default:
        promise = Promise.resolve({ data: { data: null } });
    }
    promise
      .then(r => setData(r.data?.data || null))
      .catch(err => { setData(null); setError(err.response?.data?.message || 'Failed to load report'); })
      .finally(() => setLoading(false));
  }, [reportType, selectedClass, selectedExam, selectedTeacher]);

  // Auto-load only when all required inputs are present
  useEffect(() => {
    const ready =
      (reportType === 'trends' && selectedClass) ||
      ((reportType === 'class-performance' || reportType === 'cross-section') && selectedClass && selectedExam) ||
      (reportType === 'teacher-performance' && selectedTeacher);
    if (ready) loadReport();
    else { setData(null); setError(''); }
  }, [loadReport, reportType, selectedClass, selectedExam, selectedTeacher]);

  // ── Class Performance: data = { subjects: [...], exam_name, overall_avg } ──
  const renderClassPerformance = () => {
    const subjects = data?.subjects || [];
    return (
    <TableContainer sx={tableStyles}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Subject</TableCell>
            <TableCell>Avg Marks</TableCell>
            <TableCell>Highest</TableCell>
            <TableCell>Lowest</TableCell>
            <TableCell>Students</TableCell>
            <TableCell>Pass</TableCell>
            <TableCell>Fail</TableCell>
            <TableCell>Pass %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subjects.length === 0 ? (
            <TableRow><TableCell colSpan={8} align="center">No data available for this exam</TableCell></TableRow>
          ) : subjects.map((r, i) => (
            <TableRow key={i}>
              <TableCell><strong>{r.subject_name || '-'}</strong></TableCell>
              <TableCell>{r.avg_marks != null ? `${r.avg_marks}/${r.max_marks}` : '-'}</TableCell>
              <TableCell>{r.highest_marks ?? '-'}</TableCell>
              <TableCell>{r.lowest_marks ?? '-'}</TableCell>
              <TableCell>{r.total_students || 0}</TableCell>
              <TableCell>{r.pass_count || 0}</TableCell>
              <TableCell>{r.fail_count || 0}</TableCell>
              <TableCell>
                <Chip label={r.pass_percentage != null ? `${r.pass_percentage}%` : '-'} size="small" sx={chipStyle}
                  color={(r.pass_percentage || 0) >= 80 ? 'success' : (r.pass_percentage || 0) >= 60 ? 'warning' : 'error'} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    );
  };

  // ── Teacher Performance: data = single object (metrics for one teacher) ──
  const renderTeacherPerformance = () => {
    if (!data) {
      return <Alert severity="info" sx={selectStyle}>Select a teacher to view performance.</Alert>;
    }
    const teacher = teachers.find(t => String(t.id) === String(selectedTeacher));
    const tName = teacher ? `${teacher.first_name} ${teacher.last_name || ''}`.trim() : `Teacher #${data.teacher_id}`;
    const metrics = [
      { label: 'Syllabus Completion Rate', value: `${data.syllabus_completion_rate ?? 0}%` },
      { label: 'Syllabus Entries (done/total)', value: `${data.completed_syllabus_entries ?? 0} / ${data.total_syllabus_entries ?? 0}` },
      { label: 'Lesson Plan Submission Rate', value: `${data.lesson_plan_submission_rate ?? 0}%` },
      { label: 'Lesson Plans (submitted/total)', value: `${data.submitted_or_approved_plans ?? 0} / ${data.total_lesson_plans ?? 0}` },
      { label: 'Homework per Month', value: data.homework_per_month ?? 0 },
      { label: 'Avg Student Percentage', value: `${data.avg_student_percentage ?? 0}%` },
    ];
    return (
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>{tName}</Typography>
        <TableContainer sx={tableStyles}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.map((m, i) => (
                <TableRow key={i}>
                  <TableCell><strong>{m.label}</strong></TableCell>
                  <TableCell>{m.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  // ── Cross-Section: data = { sections: [{section_name, overall_avg_percentage, subjects:[...]}] }
  const renderCrossSection = () => {
    const sections = data?.sections || [];
    if (sections.length === 0) {
      return <Alert severity="info" sx={selectStyle}>No section data available for this exam.</Alert>;
    }
    // Collect all subjects across sections
    const subjectMap = {};
    sections.forEach(sec => {
      (sec.subjects || []).forEach(sub => { subjectMap[sub.subject_id] = sub.subject_name; });
    });
    const subjectList = Object.entries(subjectMap);
    return (
      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              {sections.map(sec => <TableCell key={sec.section_id} align="center">Sec {sec.section_name}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {subjectList.map(([sid, sname]) => (
              <TableRow key={sid}>
                <TableCell><strong>{sname}</strong></TableCell>
                {sections.map(sec => {
                  const sub = (sec.subjects || []).find(s => String(s.subject_id) === String(sid));
                  return (
                    <TableCell key={sec.section_id} align="center">
                      {sub ? (
                        <Chip label={`${sub.avg_percentage}%`} size="small" sx={chipStyle}
                          color={sub.is_highlighted ? 'error' : 'default'} />
                      ) : '-'}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow>
              <TableCell><strong>Overall</strong></TableCell>
              {sections.map(sec => (
                <TableCell key={sec.section_id} align="center">
                  <strong>{sec.overall_avg_percentage}%</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ── Trends: data = { terms: [{term_name, avg_percentage, pass_percentage, total_students, has_data}] }
  const renderTrends = () => {
    const terms = data?.terms || [];
    const withData = terms.filter(t => t.has_data);
    if (withData.length === 0) {
      return <Alert severity="info" sx={selectStyle}>No term results available yet for this class.</Alert>;
    }
    return (
      <TableContainer sx={tableStyles}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Term</TableCell>
              <TableCell>Avg %</TableCell>
              <TableCell>Pass %</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Trend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terms.map((t, i) => {
              const prev = i > 0 ? terms[i - 1] : null;
              const change = prev ? Math.round((t.avg_percentage - prev.avg_percentage) * 10) / 10 : 0;
              return (
                <TableRow key={t.term_id || i}>
                  <TableCell><strong>{t.term_name}</strong></TableCell>
                  <TableCell>{t.has_data ? `${t.avg_percentage}%` : '-'}</TableCell>
                  <TableCell>{t.has_data ? `${t.pass_percentage}%` : '-'}</TableCell>
                  <TableCell>{t.total_students || 0}</TableCell>
                  <TableCell>
                    {i === 0 || !t.has_data ? '-' : (
                      <Chip label={`${change >= 0 ? '+' : ''}${change}%`} size="small" sx={chipStyle}
                        color={change >= 0 ? 'success' : 'error'} />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Report Type</InputLabel>
          <Select value={reportType} onChange={e => { setReportType(e.target.value); setData(null); setError(''); }} label="Report Type" sx={selectStyle}>
            <MenuItem value="class-performance">Class Performance</MenuItem>
            <MenuItem value="teacher-performance">Teacher Performance</MenuItem>
            <MenuItem value="cross-section">Cross-Section Comparison</MenuItem>
            <MenuItem value="trends">Trends</MenuItem>
          </Select>
        </FormControl>

        {/* Class selector — needed for class-performance, cross-section, trends */}
        {reportType !== 'teacher-performance' && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Class</InputLabel>
            <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} label="Class" sx={selectStyle}>
              <MenuItem value="">Select Class</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        {/* Exam selector — needed for class-performance, cross-section */}
        {(reportType === 'class-performance' || reportType === 'cross-section') && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Exam</InputLabel>
            <Select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} label="Exam" sx={selectStyle}>
              <MenuItem value="">Select Exam</MenuItem>
              {exams.map(ex => <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        {/* Teacher selector — needed for teacher-performance */}
        {reportType === 'teacher-performance' && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Teacher</InputLabel>
            <Select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} label="Teacher" sx={selectStyle}>
              <MenuItem value="">Select Teacher</MenuItem>
              {teachers.map(t => <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name || ''}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        <Button size="small" startIcon={<Refresh />} onClick={loadReport} sx={btnStyle}>
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? <LinearProgress /> : !error && data && (
        <>
          {reportType === 'class-performance' && renderClassPerformance()}
          {reportType === 'teacher-performance' && renderTeacherPerformance()}
          {reportType === 'cross-section' && renderCrossSection()}
          {reportType === 'trends' && renderTrends()}
        </>
      )}
    </Box>
  );
}
