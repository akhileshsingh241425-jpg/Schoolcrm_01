import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, FormControl, InputLabel, Select, MenuItem, Tabs, Tab, Chip, Snackbar, Alert, TextField,
  Grid, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, LinearProgress, Tooltip, Switch, FormControlLabel, Divider
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, PersonOff, AccessTime, EventNote,
  Warning, CheckCircle, Cancel, Schedule, Refresh, Add, Delete, Edit, Visibility,
  SwapHoriz, PersonSearch
} from '@mui/icons-material';
import { attendanceAPI, studentsAPI, staffAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const TABS = [
  'Dashboard', 'Student Attendance', 'Staff Attendance', 'Period-wise',
  'Leave Management', 'Late Arrivals', 'Substitutions', 'Rules & Settings', 'Reports'
];

const statusColors = { present: 'success', absent: 'error', late: 'warning', half_day: 'info', leave: 'secondary' };

// =====================================================
// STAT CARD
// =====================================================
function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2">{title}</Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// =====================================================
// DASHBOARD TAB
// =====================================================
function DashboardTab({ snack, setSnack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    attendanceAPI.dashboard().then(res => setData(res.data.data))
      .catch(() => setSnack({ open: true, message: 'Failed to load dashboard', severity: 'error' }))
      .finally(() => setLoading(false));
  }, [setSnack]);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <LinearProgress />;
  const { today, staff, pending_leaves, late_arrivals_today, weekly_trend } = data;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Today's Overview</Typography>
        <Button startIcon={<Refresh />} onClick={load} size="small">Refresh</Button>
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Students Present" value={today.present} icon={<People fontSize="large" />}
            color="success" subtitle={`${today.percentage}% of ${today.total_students}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Students Absent" value={today.absent} icon={<PersonOff fontSize="large" />}
            color="error" subtitle={`${today.on_leave} on leave`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Staff Present" value={staff.present} icon={<CheckCircle fontSize="large" />}
            color="primary" subtitle={`${staff.percentage}% of ${staff.total}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending Leaves" value={pending_leaves} icon={<EventNote fontSize="large" />}
            color="warning" subtitle={`${late_arrivals_today} late today`} />
        </Grid>
      </Grid>

      {today.unmarked > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>{today.unmarked}</strong> students have not been marked yet today.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" mb={2}>Weekly Attendance Trend</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {weekly_trend.map(d => <TableCell key={d.date} align="center">{d.day}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekly_trend.map(d => (
                  <TableCell key={d.date} align="center">
                    <Typography fontWeight="bold" color={d.percentage >= 75 ? 'success.main' : 'error.main'}>
                      {d.percentage}%
                    </Typography>
                    <Typography variant="caption">{d.present}/{d.total}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

// =====================================================
// STUDENT ATTENDANCE TAB
// =====================================================
function StudentTab({ snack, setSnack }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const isAdmin = useAuthStore(s => s.hasRole('school_admin', 'super_admin', 'principal'));

  // Load classes — teachers get only their assigned classes, admins get all
  useEffect(() => {
    attendanceAPI.getMyClasses().then(r => {
      const data = r.data.data || [];
      setClasses(data);
      // Auto-select if teacher has only one class
      if (data.length === 1) {
        setClassId(data[0].id);
        if (data[0].sections?.length === 1) {
          setSectionId(data[0].sections[0].id);
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (classId) {
      const cls = classes.find(c => c.id === classId);
      if (cls?.sections) {
        setSections(cls.sections);
      } else {
        studentsAPI.listSections(classId).then(r => setSections(r.data.data || [])).catch(() => {});
      }
    }
  }, [classId, classes]);

  useEffect(() => {
    if (classId) {
      const params = { class_id: classId, per_page: 200 };
      if (sectionId) params.section_id = sectionId;
      studentsAPI.list(params).then(r => setStudents(r.data.data?.items || [])).catch(() => {});
      attendanceAPI.getStudent({ date, class_id: classId, ...(sectionId && { section_id: sectionId }) })
        .then(r => {
          const map = {};
          (r.data.data || []).forEach(a => { map[a.student_id] = a.status; });
          setAttendance(map);
        }).catch(() => {});
    }
  }, [classId, sectionId, date]);

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  };

  const save = () => {
    const records = Object.entries(attendance).map(([student_id, status]) => ({
      student_id: parseInt(student_id), status
    }));
    if (records.length === 0) return;
    attendanceAPI.markStudent({ date, attendance: records })
      .then(() => setSnack({ open: true, message: 'Attendance saved!', severity: 'success' }))
      .catch(() => setSnack({ open: true, message: 'Failed to save', severity: 'error' }));
  };

  const summary = {
    total: students.length,
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    half_day: Object.values(attendance).filter(s => s === 'half_day').length,
    unmarked: students.length - Object.keys(attendance).length
  };

  return (
    <Box>
      {!isAdmin && classes.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are not assigned as Class Teacher or Co-Class Teacher of any section. Please contact admin.
        </Alert>
      )}
      {!isAdmin && classes.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing only your assigned classes/sections. You can mark attendance for sections where you are Class Teacher or Co-Class Teacher.
        </Alert>
      )}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField type="date" size="small" label="Date" value={date}
            onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Class</InputLabel>
            <Select value={classId} label="Class" onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 150 } }}>
            <InputLabel>Section</InputLabel>
            <Select value={sectionId} label="Section" onChange={(e) => setSectionId(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box flex={1} />
          <Button size="small" color="success" variant="outlined" onClick={() => markAll('present')}>All Present</Button>
          <Button size="small" color="error" variant="outlined" onClick={() => markAll('absent')}>All Absent</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </Box>
      </Paper>

      {students.length > 0 && (
        <Grid container spacing={1} mb={2}>
          <Grid item xs><Chip label={`Total: ${summary.total}`} /></Grid>
          <Grid item xs><Chip label={`Present: ${summary.present}`} color="success" /></Grid>
          <Grid item xs><Chip label={`Absent: ${summary.absent}`} color="error" /></Grid>
          <Grid item xs><Chip label={`Late: ${summary.late}`} color="warning" /></Grid>
          <Grid item xs><Chip label={`Unmarked: ${summary.unmarked}`} /></Grid>
        </Grid>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Roll No</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Quick Mark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s, i) => (
              <TableRow key={s.id} sx={attendance[s.id] === 'absent' ? { bgcolor: 'error.50' } : {}}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{s.admission_no || '-'}</TableCell>
                <TableCell>{s.full_name}</TableCell>
                <TableCell>
                  <Chip label={attendance[s.id] || 'Not marked'} size="small"
                    color={statusColors[attendance[s.id]] || 'default'} />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    {['present', 'absent', 'late', 'half_day', 'leave'].map(st => (
                      <Button key={st} size="small"
                        variant={attendance[s.id] === st ? 'contained' : 'outlined'}
                        color={statusColors[st] || 'primary'}
                        onClick={() => setAttendance(prev => ({ ...prev, [s.id]: st }))}>
                        {st === 'half_day' ? 'HD' : st === 'leave' ? 'Lv' : st.charAt(0).toUpperCase()}
                      </Button>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!classId && <TableRow><TableCell colSpan={5} align="center">Select a class to mark attendance</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// =====================================================
// STAFF ATTENDANCE TAB
// =====================================================
function StaffTab({ snack, setSnack }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [staffList, setStaffList] = useState([]);
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    staffAPI.list({ per_page: 200 }).then(r => setStaffList(r.data.data?.items || [])).catch(() => {});
    attendanceAPI.getStaff({ date }).then(r => {
      const map = {};
      (r.data.data || []).forEach(a => { map[a.staff_id] = a.status; });
      setAttendance(map);
    }).catch(() => {});
  }, [date]);

  const save = () => {
    const records = Object.entries(attendance).map(([staff_id, status]) => ({
      staff_id: parseInt(staff_id), status
    }));
    attendanceAPI.markStaff({ date, attendance: records })
      .then(() => setSnack({ open: true, message: 'Staff attendance saved!', severity: 'success' }))
      .catch(() => setSnack({ open: true, message: 'Failed to save', severity: 'error' }));
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField type="date" size="small" label="Date" value={date}
            onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={save}>Save</Button>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Quick Mark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffList.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{s.employee_id || '-'}</TableCell>
                <TableCell>{s.full_name || s.name}</TableCell>
                <TableCell>{s.department || '-'}</TableCell>
                <TableCell>
                  <Chip label={attendance[s.id] || 'Not marked'} size="small"
                    color={statusColors[attendance[s.id]] || 'default'} />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    {['present', 'absent', 'late', 'half_day', 'leave'].map(st => (
                      <Button key={st} size="small"
                        variant={attendance[s.id] === st ? 'contained' : 'outlined'}
                        color={statusColors[st] || 'primary'}
                        onClick={() => setAttendance(prev => ({ ...prev, [s.id]: st }))}>
                        {st === 'half_day' ? 'HD' : st === 'leave' ? 'Lv' : st.charAt(0).toUpperCase()}
                      </Button>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {staffList.length === 0 && <TableRow><TableCell colSpan={6} align="center">No staff found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// =====================================================
// PERIOD-WISE TAB
// =====================================================
function PeriodTab({ snack, setSnack }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [period, setPeriod] = useState(1);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const isAdmin = useAuthStore(s => s.hasRole('school_admin', 'super_admin', 'principal'));

  // Load classes — teachers get only their assigned classes
  useEffect(() => {
    attendanceAPI.getMyClasses().then(r => {
      const data = r.data.data || [];
      setClasses(data);
      if (data.length === 1) setClassId(data[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (classId) {
      studentsAPI.list({ class_id: classId, per_page: 200 }).then(r => setStudents(r.data.data?.items || [])).catch(() => {});
      attendanceAPI.getPeriod({ date, class_id: classId, period }).then(r => {
        const map = {};
        (r.data.data || []).forEach(a => { map[a.student_id] = a.status; });
        setAttendance(map);
      }).catch(() => {});
    }
  }, [classId, date, period]);

  const save = () => {
    const records = Object.entries(attendance).map(([student_id, status]) => ({
      student_id: parseInt(student_id), status
    }));
    attendanceAPI.markPeriod({ date, period, attendance: records })
      .then(() => setSnack({ open: true, message: `Period ${period} attendance saved!`, severity: 'success' }))
      .catch(() => setSnack({ open: true, message: 'Failed to save', severity: 'error' }));
  };

  return (
    <Box>
      {!isAdmin && classes.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are not assigned as Class Teacher or Co-Class Teacher of any section.
        </Alert>
      )}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField type="date" size="small" label="Date" value={date}
            onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Class</InputLabel>
            <Select value={classId} label="Class" onChange={(e) => setClassId(e.target.value)}>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 120 } }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
              {[1,2,3,4,5,6,7,8].map(p => <MenuItem key={p} value={p}>Period {p}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={save}>Save</Button>
        </Box>
      </Paper>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{s.full_name}</TableCell>
                <TableCell>
                  <Chip label={attendance[s.id] || 'Not marked'} size="small"
                    color={statusColors[attendance[s.id]] || 'default'} />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={0.5}>
                    {['present', 'absent'].map(st => (
                      <Button key={st} size="small"
                        variant={attendance[s.id] === st ? 'contained' : 'outlined'}
                        color={statusColors[st]}
                        onClick={() => setAttendance(prev => ({ ...prev, [s.id]: st }))}>
                        {st.charAt(0).toUpperCase()}
                      </Button>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// =====================================================
// LEAVE MANAGEMENT TAB
// =====================================================
function LeaveTab({ snack, setSnack }) {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialog, setDialog] = useState(false);
  const [typeDialog, setTypeDialog] = useState(false);
  const [form, setForm] = useState({
    applicant_type: 'student', applicant_id: '', leave_type_id: '',
    from_date: '', to_date: '', reason: ''
  });
  const [typeForm, setTypeForm] = useState({ name: '', code: '', applies_to: 'both', max_days_per_year: 0 });

  const load = useCallback(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.applicant_type = typeFilter;
    attendanceAPI.getLeaves(params).then(r => setLeaves(r.data.data || [])).catch(() => {});
    attendanceAPI.getLeaveTypes().then(r => setLeaveTypes(r.data.data || [])).catch(() => {});
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const applyLeave = () => {
    attendanceAPI.applyLeave(form).then(() => {
      setDialog(false);
      setSnack({ open: true, message: 'Leave applied!', severity: 'success' });
      load();
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  const approveReject = (id, action, rejection_reason = '') => {
    attendanceAPI.approveRejectLeave(id, { action, rejection_reason }).then(() => {
      setSnack({ open: true, message: `Leave ${action}d`, severity: 'success' });
      load();
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  const createLeaveType = () => {
    attendanceAPI.createLeaveType(typeForm).then(() => {
      setTypeDialog(false);
      setSnack({ open: true, message: 'Leave type created', severity: 'success' });
      load();
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  const statusChipColor = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" gap={1} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 130 } }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {['pending', 'approved', 'rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 130 } }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Add />} onClick={() => setTypeDialog(true)}>Add Leave Type</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>Apply Leave</Button>
        </Box>
      </Box>

      {/* Leave Types chips */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {leaveTypes.map(lt => (
          <Chip key={lt.id} label={`${lt.name} (${lt.code})`} variant="outlined"
            onDelete={() => attendanceAPI.deleteLeaveType(lt.id).then(load)} />
        ))}
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Applicant</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Days</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map(l => (
              <TableRow key={l.id}>
                <TableCell>{l.id}</TableCell>
                <TableCell>{l.applicant_name}</TableCell>
                <TableCell><Chip label={l.applicant_type} size="small" /></TableCell>
                <TableCell>{l.leave_type_name || '-'}</TableCell>
                <TableCell>{l.from_date}</TableCell>
                <TableCell>{l.to_date}</TableCell>
                <TableCell>{l.days}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>{l.reason}</TableCell>
                <TableCell>
                  <Chip label={l.status} size="small" color={statusChipColor[l.status] || 'default'} />
                </TableCell>
                <TableCell>
                  {l.status === 'pending' && (
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Approve">
                        <IconButton size="small" color="success" onClick={() => approveReject(l.id, 'approve')}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton size="small" color="error" onClick={() => approveReject(l.id, 'reject')}>
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {leaves.length === 0 && <TableRow><TableCell colSpan={10} align="center">No leave applications</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Apply Leave Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Leave</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Applicant Type</InputLabel>
                <Select value={form.applicant_type} label="Applicant Type"
                  onChange={(e) => setForm({ ...form, applicant_type: e.target.value })}>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Applicant ID" type="number"
                value={form.applicant_id} onChange={(e) => setForm({ ...form, applicant_id: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Leave Type</InputLabel>
                <Select value={form.leave_type_id} label="Leave Type"
                  onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}>
                  {leaveTypes.map(lt => <MenuItem key={lt.id} value={lt.id}>{lt.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="From Date" type="date"
                value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="To Date" type="date"
                value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Reason" multiline rows={2}
                value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyLeave}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Add Leave Type Dialog */}
      <Dialog open={typeDialog} onClose={() => setTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Leave Type</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="Name" value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Code" value={typeForm.code}
                onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Applies To</InputLabel>
                <Select value={typeForm.applies_to} label="Applies To"
                  onChange={(e) => setTypeForm({ ...typeForm, applies_to: e.target.value })}>
                  <MenuItem value="both">Both</MenuItem>
                  <MenuItem value="students">Students</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Max Days/Year" type="number"
                value={typeForm.max_days_per_year}
                onChange={(e) => setTypeForm({ ...typeForm, max_days_per_year: parseInt(e.target.value) || 0 })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={createLeaveType}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =====================================================
// LATE ARRIVALS TAB
// =====================================================
function LateArrivalsTab({ snack, setSnack }) {
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({
    person_type: 'student', person_id: '', arrival_time: '', reason: ''
  });

  const load = useCallback(() => {
    attendanceAPI.getLateArrivals({ date }).then(r => setRecords(r.data.data || [])).catch(() => {});
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    attendanceAPI.recordLateArrival({ ...form, date }).then(() => {
      setDialog(false);
      setSnack({ open: true, message: 'Late arrival recorded', severity: 'success' });
      load();
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField type="date" size="small" label="Date" value={date}
          onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>Record Late Arrival</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Expected</TableCell>
              <TableCell>Arrival</TableCell>
              <TableCell>Late By</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Notified</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map(r => (
              <TableRow key={r.id}>
                <TableCell><Chip label={r.person_type} size="small" /></TableCell>
                <TableCell>{r.person_name}</TableCell>
                <TableCell>{r.expected_time || '-'}</TableCell>
                <TableCell>{r.arrival_time}</TableCell>
                <TableCell>{r.late_by_minutes ? `${r.late_by_minutes} min` : '-'}</TableCell>
                <TableCell>{r.reason || '-'}</TableCell>
                <TableCell>{r.parent_notified ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}</TableCell>
              </TableRow>
            ))}
            {records.length === 0 && <TableRow><TableCell colSpan={7} align="center">No late arrivals on this date</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Late Arrival</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Person Type</InputLabel>
                <Select value={form.person_type} label="Person Type"
                  onChange={(e) => setForm({ ...form, person_type: e.target.value })}>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Person ID" type="number"
                value={form.person_id} onChange={(e) => setForm({ ...form, person_id: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Arrival Time" type="time"
                value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Late By (min)" type="number"
                value={form.late_by_minutes || ''} onChange={(e) => setForm({ ...form, late_by_minutes: parseInt(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Reason"
                value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =====================================================
// RULES & SETTINGS TAB
// =====================================================
function RulesTab({ snack, setSnack }) {
  const [rules, setRules] = useState({
    minimum_percentage: 75, alert_threshold: 80,
    late_arrival_minutes: 15, half_day_minutes: 120,
    school_start_time: '08:00', school_end_time: '14:00',
    periods_per_day: 8, period_duration_minutes: 40,
    auto_notify_parent: true, notify_on_absent: true, notify_on_late: true,
    working_days: 'mon,tue,wed,thu,fri,sat'
  });
  const [devices, setDevices] = useState([]);
  const [deviceDialog, setDeviceDialog] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ device_name: '', device_type: 'biometric', location: '' });

  useEffect(() => {
    attendanceAPI.getRules().then(r => { if (r.data.data) setRules(r.data.data); }).catch(() => {});
    attendanceAPI.getDevices().then(r => setDevices(r.data.data || [])).catch(() => {});
  }, []);

  const saveRules = () => {
    attendanceAPI.saveRules(rules)
      .then(() => setSnack({ open: true, message: 'Rules saved!', severity: 'success' }))
      .catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  const addDevice = () => {
    attendanceAPI.addDevice(deviceForm).then(r => {
      setDevices([...devices, r.data.data]);
      setDeviceDialog(false);
      setSnack({ open: true, message: 'Device added', severity: 'success' });
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  return (
    <Box>
      <Typography variant="h6" mb={2}>Attendance Rules</Typography>
      <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Minimum Attendance %" type="number"
              value={rules.minimum_percentage}
              onChange={(e) => setRules({ ...rules, minimum_percentage: parseFloat(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Alert Threshold %" type="number"
              value={rules.alert_threshold}
              onChange={(e) => setRules({ ...rules, alert_threshold: parseFloat(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Late After (min)" type="number"
              value={rules.late_arrival_minutes}
              onChange={(e) => setRules({ ...rules, late_arrival_minutes: parseInt(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Half Day After (min)" type="number"
              value={rules.half_day_minutes}
              onChange={(e) => setRules({ ...rules, half_day_minutes: parseInt(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="School Start Time" type="time"
              value={rules.school_start_time || ''}
              onChange={(e) => setRules({ ...rules, school_start_time: e.target.value })}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="School End Time" type="time"
              value={rules.school_end_time || ''}
              onChange={(e) => setRules({ ...rules, school_end_time: e.target.value })}
              InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Periods Per Day" type="number"
              value={rules.periods_per_day}
              onChange={(e) => setRules({ ...rules, periods_per_day: parseInt(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Period Duration (min)" type="number"
              value={rules.period_duration_minutes}
              onChange={(e) => setRules({ ...rules, period_duration_minutes: parseInt(e.target.value) })} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField fullWidth size="small" label="Working Days"
              value={rules.working_days}
              onChange={(e) => setRules({ ...rules, working_days: e.target.value })}
              helperText="Comma separated: mon,tue,wed..." />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={
              <Switch checked={rules.auto_notify_parent}
                onChange={(e) => setRules({ ...rules, auto_notify_parent: e.target.checked })} />
            } label="Auto Notify Parent" />
            <FormControlLabel control={
              <Switch checked={rules.notify_on_absent}
                onChange={(e) => setRules({ ...rules, notify_on_absent: e.target.checked })} />
            } label="Notify on Absent" />
            <FormControlLabel control={
              <Switch checked={rules.notify_on_late}
                onChange={(e) => setRules({ ...rules, notify_on_late: e.target.checked })} />
            } label="Notify on Late" />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={saveRules}>Save Rules</Button>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Attendance Devices</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDeviceDialog(true)}>Add Device</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Device Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Sync</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map(d => (
              <TableRow key={d.id}>
                <TableCell>{d.device_name}</TableCell>
                <TableCell>{d.device_type}</TableCell>
                <TableCell>{d.location || '-'}</TableCell>
                <TableCell><Chip label={d.status} size="small" color={d.status === 'active' ? 'success' : 'default'} /></TableCell>
                <TableCell>{d.last_sync || 'Never'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="error"
                    onClick={() => attendanceAPI.deleteDevice(d.id).then(() => setDevices(devices.filter(x => x.id !== d.id)))}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {devices.length === 0 && <TableRow><TableCell colSpan={6} align="center">No devices configured</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deviceDialog} onClose={() => setDeviceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Device</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Device Name" value={deviceForm.device_name}
                onChange={(e) => setDeviceForm({ ...deviceForm, device_name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={deviceForm.device_type} label="Type"
                  onChange={(e) => setDeviceForm({ ...deviceForm, device_type: e.target.value })}>
                  {['biometric', 'rfid', 'qr_scanner', 'face_recognition', 'gps'].map(t =>
                    <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Location" value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addDevice}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =====================================================
// REPORTS TAB
// =====================================================
function ReportsTab({ snack, setSnack }) {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('analytics');

  useEffect(() => { studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {}); }, []);

  const loadAnalytics = () => {
    const params = { from_date: fromDate, to_date: toDate };
    if (classId) params.class_id = classId;
    attendanceAPI.analytics(params).then(r => setAnalytics(r.data.data)).catch(() => {});
  };

  const loadAlerts = () => {
    const params = {};
    if (classId) params.class_id = classId;
    attendanceAPI.alerts(params).then(r => setAlerts(r.data.data?.alerts || [])).catch(() => {});
  };

  useEffect(() => {
    if (view === 'analytics') loadAnalytics();
    else loadAlerts();
  }, [view, classId, fromDate, toDate]);

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <Button variant={view === 'analytics' ? 'contained' : 'outlined'} onClick={() => setView('analytics')}>
          <TrendingUp sx={{ mr: 1 }} /> Analytics
        </Button>
        <Button variant={view === 'alerts' ? 'contained' : 'outlined'} color="warning" onClick={() => setView('alerts')}>
          <Warning sx={{ mr: 1 }} /> Low Attendance Alerts
        </Button>
        <Box flex={1} />
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
          <InputLabel>Class</InputLabel>
          <Select value={classId} label="Class" onChange={(e) => setClassId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        {view === 'analytics' && (
          <>
            <TextField type="date" size="small" label="From" value={fromDate}
              onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField type="date" size="small" label="To" value={toDate}
              onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </>
        )}
      </Box>

      {view === 'analytics' && analytics && (
        <Box>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} md={3}>
              <StatCard title="Total Records" value={analytics.overall.total_records} icon={<People />} />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard title="Present" value={analytics.overall.present} icon={<CheckCircle />} color="success" />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard title="Absent" value={analytics.overall.absent} icon={<Cancel />} color="error" />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard title="Overall %" value={`${analytics.overall.percentage}%`}
                icon={analytics.overall.percentage >= 75 ? <TrendingUp /> : <TrendingDown />}
                color={analytics.overall.percentage >= 75 ? 'success' : 'error'} />
            </Grid>
          </Grid>

          {Object.keys(analytics.class_summary).length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" mb={1}>Class-wise Summary</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Class</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Present</TableCell>
                      <TableCell>Absent</TableCell>
                      <TableCell>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(analytics.class_summary).map(([cid, s]) => (
                      <TableRow key={cid}>
                        <TableCell>Class {cid}</TableCell>
                        <TableCell>{s.total}</TableCell>
                        <TableCell>{s.present}</TableCell>
                        <TableCell>{s.absent}</TableCell>
                        <TableCell>
                          <Chip size="small" label={`${s.total > 0 ? Math.round(s.present / s.total * 100) : 0}%`}
                            color={s.total > 0 && (s.present / s.total * 100) >= 75 ? 'success' : 'error'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      )}

      {view === 'alerts' && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Total Days</TableCell>
                <TableCell>Present</TableCell>
                <TableCell>Attendance %</TableCell>
                <TableCell>Deficit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map(a => (
                <TableRow key={a.student_id} sx={{ bgcolor: a.percentage < 60 ? 'error.50' : 'warning.50' }}>
                  <TableCell>{a.student_name}</TableCell>
                  <TableCell>{a.total_days}</TableCell>
                  <TableCell>{a.present}</TableCell>
                  <TableCell>
                    <Chip size="small" label={`${a.percentage}%`}
                      color={a.percentage < 60 ? 'error' : 'warning'} />
                  </TableCell>
                  <TableCell>{a.deficit}%</TableCell>
                </TableRow>
              ))}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box py={2}>
                      <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography>All students are above the threshold!</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// =====================================================
// SUBSTITUTION TAB
// =====================================================
function SubstitutionTab({ snack, setSnack }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [absentTeachers, setAbsentTeachers] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [dialog, setDialog] = useState({ open: false, period: null, teacher: null });
  const [selectedSub, setSelectedSub] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [abRes, subRes] = await Promise.all([
        attendanceAPI.getAbsentTeachers({ date }),
        attendanceAPI.getSubstitutions({ date })
      ]);
      setAbsentTeachers(abRes.data?.data || []);
      setSubstitutions(subRes.data?.data || []);
    } catch (err) {
      setSnack({ open: true, message: 'Failed to load data', severity: 'error' });
    }
    setLoading(false);
  }, [date, setSnack]);

  useEffect(() => { loadData(); }, [loadData]);

  const openAssignDialog = async (teacher, period) => {
    setDialog({ open: true, period, teacher });
    setSelectedSub('');
    try {
      const res = await attendanceAPI.getAvailableTeachers({ date, period_number: period.period_number });
      setAvailableTeachers(res.data?.data || []);
    } catch {
      setAvailableTeachers([]);
    }
  };

  const assignSubstitute = async () => {
    if (!selectedSub) return;
    const { teacher, period } = dialog;
    try {
      await attendanceAPI.createSubstitution({
        date,
        absent_teacher_id: teacher.staff_id,
        substitute_teacher_id: selectedSub,
        timetable_id: period.timetable_id,
        class_id: period.class_id,
        section_id: period.section_id,
        period_number: period.period_number,
        subject_id: period.subject_id,
        reason: `${teacher.teacher_name} is ${teacher.absence_status}`
      });
      setSnack({ open: true, message: 'Substitute assigned successfully!', severity: 'success' });
      setDialog({ open: false, period: null, teacher: null });
      loadData();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to assign', severity: 'error' });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await attendanceAPI.updateSubstitution(id, { status });
      setSnack({ open: true, message: `Substitution ${status}`, severity: 'success' });
      loadData();
    } catch {
      setSnack({ open: true, message: 'Failed to update', severity: 'error' });
    }
  };

  const deleteSub = async (id) => {
    try {
      await attendanceAPI.deleteSubstitution(id);
      setSnack({ open: true, message: 'Substitution removed', severity: 'success' });
      loadData();
    } catch {
      setSnack({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  const statusChipColor = { assigned: 'warning', accepted: 'info', completed: 'success', declined: 'error', cancelled: 'default' };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <TextField type="date" label="Date" value={date} onChange={e => setDate(e.target.value)}
          size="small" InputLabelProps={{ shrink: true }} />
        <Button startIcon={<Refresh />} onClick={loadData} variant="outlined">Refresh</Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Absent Teachers & Their Periods */}
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonOff color="error" /> Absent Teachers ({absentTeachers.length})
      </Typography>

      {absentTeachers.length === 0 && !loading && (
        <Alert severity="success" sx={{ mb: 3 }}>No teachers are absent today!</Alert>
      )}

      {absentTeachers.map(teacher => (
        <Paper key={teacher.staff_id} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box>
              <Typography fontWeight="bold">{teacher.teacher_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {teacher.designation} &bull; Status: <Chip label={teacher.absence_status} size="small" color="error" sx={{ ml: 0.5 }} />
              </Typography>
            </Box>
            <Chip label={`${teacher.assigned_count}/${teacher.total_periods} assigned`}
              color={teacher.assigned_count === teacher.total_periods ? 'success' : 'warning'} size="small" />
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teacher.periods.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{p.period_number}</TableCell>
                    <TableCell>{p.class_name} - {p.section_name}</TableCell>
                    <TableCell>{p.subject_name || '-'}</TableCell>
                    <TableCell>{p.start_time} - {p.end_time}</TableCell>
                    <TableCell>
                      {p.already_assigned
                        ? <Chip label="Assigned" size="small" color="success" icon={<CheckCircle />} />
                        : <Chip label="Pending" size="small" color="warning" icon={<Warning />} />
                      }
                    </TableCell>
                    <TableCell>
                      {!p.already_assigned && (
                        <Button size="small" variant="contained" startIcon={<SwapHoriz />}
                          onClick={() => openAssignDialog(teacher, p)}>
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      {/* Today's Substitutions */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHoriz color="primary" /> Substitution Assignments ({substitutions.length})
      </Typography>

      {substitutions.length === 0 && !loading && (
        <Alert severity="info">No substitutions for this date.</Alert>
      )}

      {substitutions.length > 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Absent Teacher</TableCell>
                <TableCell>Substitute</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {substitutions.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.period_number}</TableCell>
                  <TableCell>{s.class_name} - {s.section_name}</TableCell>
                  <TableCell>{s.subject_name || '-'}</TableCell>
                  <TableCell>{s.absent_teacher_name}</TableCell>
                  <TableCell>{s.substitute_teacher_name}</TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" color={statusChipColor[s.status] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {s.status === 'assigned' && (
                        <Tooltip title="Mark Completed">
                          <IconButton size="small" color="success" onClick={() => updateStatus(s.id, 'completed')}>
                            <CheckCircle fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {s.status === 'assigned' && (
                        <Tooltip title="Cancel">
                          <IconButton size="small" color="warning" onClick={() => updateStatus(s.id, 'cancelled')}>
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => deleteSub(s.id)}>
                          <Delete fontSize="small" />
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

      {/* Assign Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, period: null, teacher: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHoriz /> Assign Substitute Teacher
        </DialogTitle>
        <DialogContent>
          {dialog.teacher && dialog.period && (
            <Box sx={{ mb: 2, mt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>{dialog.teacher.teacher_name}</strong> is absent. Assign substitute for
                Period {dialog.period.period_number} — {dialog.period.class_name} {dialog.period.section_name}
                {dialog.period.subject_name ? ` (${dialog.period.subject_name})` : ''}
              </Alert>
              <FormControl fullWidth size="small">
                <InputLabel>Select Substitute Teacher</InputLabel>
                <Select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} label="Select Substitute Teacher">
                  {availableTeachers.length === 0 && (
                    <MenuItem disabled>No free teachers available</MenuItem>
                  )}
                  {availableTeachers.map(t => (
                    <MenuItem key={t.staff_id} value={t.staff_id}>
                      {t.name} {t.designation ? `(${t.designation})` : ''} {t.department ? `— ${t.department}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, period: null, teacher: null })}>Cancel</Button>
          <Button variant="contained" onClick={assignSubstitute} disabled={!selectedSub}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// =====================================================
// MAIN COMPONENT
// =====================================================
export default function Attendance() {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  return (
    <Box>
      <Typography variant="h5" mb={2}>Attendance Management</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map((t, i) => <Tab key={i} label={t} />)}
      </Tabs>

      {tab === 0 && <DashboardTab snack={snack} setSnack={setSnack} />}
      {tab === 1 && <StudentTab snack={snack} setSnack={setSnack} />}
      {tab === 2 && <StaffTab snack={snack} setSnack={setSnack} />}
      {tab === 3 && <PeriodTab snack={snack} setSnack={setSnack} />}
      {tab === 4 && <LeaveTab snack={snack} setSnack={setSnack} />}
      {tab === 5 && <LateArrivalsTab snack={snack} setSnack={setSnack} />}
      {tab === 6 && <SubstitutionTab snack={snack} setSnack={setSnack} />}
      {tab === 7 && <RulesTab snack={snack} setSnack={setSnack} />}
      {tab === 8 && <ReportsTab snack={snack} setSnack={setSnack} />}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
