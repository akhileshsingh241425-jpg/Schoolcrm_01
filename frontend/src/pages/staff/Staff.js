import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, TablePagination, InputAdornment,
  Tabs, Tab, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, IconButton, Avatar, Rating, LinearProgress, Tooltip,
  FormControl, InputLabel, Select, Alert
} from '@mui/material';
import {
  Add, Search, Person, Payment, EventNote, Star, Work, School, Assignment,
  Description, Edit, Delete, Check, Close, Visibility, Download, Upload,
  Business, Group, TrendingUp, Warning, AccessTime, CalendarMonth
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';

// ─── Stat Card ────────────
function StatCard({ title, value, icon, color = '#6366f1' }) {
  return (
    <Card sx={{ borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px rgba(0,0,0,0.12)` } }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: `${color}18`, color: color, width: 52, height: 52, borderRadius: 3 }}>{icon}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">{value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Dashboard Tab ────────
function DashboardTab() {
  const [data, setData] = useState(null);
  useEffect(() => {
    staffAPI.dashboard().then(r => setData(r.data.data)).catch(() => {});
  }, []);
  if (!data) return <Typography>Loading...</Typography>;
  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}><StatCard title="Total Staff" value={data.total_staff} icon={<Group />} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Active" value={data.active_staff} icon={<Person />} color="#4caf50" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Teaching" value={data.teaching_staff} icon={<School />} color="#ff9800" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Non-Teaching" value={data.non_teaching_staff} icon={<Business />} color="#9c27b0" /></Grid>
      </Grid>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}><StatCard title="Pending Leaves" value={data.pending_leaves} icon={<EventNote />} color="#f44336" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Pending Payroll" value={data.pending_payroll} icon={<Payment />} color="#e91e63" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Open Positions" value={data.open_positions} icon={<Work />} color="#00bcd4" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Contracts Expiring" value={data.contracts_expiring} icon={<Warning />} color="#ff5722" /></Grid>
      </Grid>
      {data.department_wise?.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Department-wise Staff</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Department</TableCell><TableCell align="right">Count</TableCell></TableRow></TableHead>
            <TableBody>
              {data.department_wise.map((d, i) => (
                <TableRow key={i}><TableCell>{d.department}</TableCell><TableCell align="right"><strong>{d.count}</strong></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

// ─── Staff List Tab ───────
function StaffListTab() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', department: '', staff_type: '' });
  const navigate = useNavigate();

  const load = useCallback(() => {
    staffAPI.list({ page: page + 1, per_page: 20, search, ...filters })
      .then(r => setData(r.data.data)).catch(() => {});
  }, [page, search, filters]);
  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" gap={1} flexWrap="wrap" sx={{ flex: 1, minWidth: 0 }}>
          <TextField size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} sx={{ minWidth: { xs: '100%', sm: 200 } }} />
          <TextField select size="small" label="Status" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} sx={{ minWidth: { xs: '45%', sm: 120 } }}>
            <MenuItem value="">All</MenuItem><MenuItem value="active">Active</MenuItem>
            <MenuItem value="on_notice">On Notice</MenuItem><MenuItem value="resigned">Resigned</MenuItem>
          </TextField>
          <TextField select size="small" label="Type" value={filters.staff_type} onChange={e => setFilters({...filters, staff_type: e.target.value})} sx={{ minWidth: { xs: '45%', sm: 120 } }}>
            <MenuItem value="">All</MenuItem><MenuItem value="teaching">Teaching</MenuItem>
            <MenuItem value="non_teaching">Non-Teaching</MenuItem><MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/staff/new')}>Add Staff</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Emp ID</TableCell><TableCell>Name</TableCell><TableCell>Type</TableCell>
              <TableCell>Designation</TableCell><TableCell>Department</TableCell>
              <TableCell>Phone</TableCell><TableCell>Contract</TableCell><TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items?.map(s => (
              <TableRow key={s.id} hover>
                <TableCell>{s.employee_id || '-'}</TableCell>
                <TableCell><strong>{s.full_name}</strong></TableCell>
                <TableCell><Chip label={s.staff_type || 'teaching'} size="small" variant="outlined" /></TableCell>
                <TableCell>{s.designation || '-'}</TableCell>
                <TableCell>{s.department || '-'}</TableCell>
                <TableCell>{s.phone || '-'}</TableCell>
                <TableCell><Chip label={s.contract_type || 'permanent'} size="small" /></TableCell>
                <TableCell><Chip label={s.status} size="small" color={s.status === 'active' ? 'success' : s.status === 'on_notice' ? 'warning' : 'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => navigate(`/staff/${s.id}`)}><Visibility fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.items?.length === 0 && <TableRow><TableCell colSpan={9} align="center">No staff found</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data.total || 0} page={page}
          onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );
}

// ─── Payroll Tab ──────────
function PayrollTab() {
  const [payrolls, setPayrolls] = useState({ items: [], total: 0 });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    staffAPI.listPayroll({ month, year, per_page: 100 }).then(r => setPayrolls(r.data.data)).catch(() => {});
  }, [month, year]);
  useEffect(() => { load(); }, [load]);

  const generatePayroll = async () => {
    setGenerating(true);
    try {
      const r = await staffAPI.generatePayroll({ month, year });
      toast.success(r.data.message);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setGenerating(false);
  };

  const markPaid = async (id) => {
    try {
      await staffAPI.updatePayroll(id, { payment_status: 'paid', payment_date: new Date().toISOString().split('T')[0] });
      toast.success('Marked as paid'); load();
    } catch (err) { toast.error('Error'); }
  };

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <TextField select size="small" label="Month" value={month} onChange={e => setMonth(e.target.value)} sx={{ width: { xs: '48%', sm: 120 } }}>
          {[...Array(12)].map((_, i) => <MenuItem key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</MenuItem>)}
        </TextField>
        <TextField size="small" label="Year" type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} sx={{ width: { xs: 80, sm: 100 } }} />
        <Button variant="contained" onClick={generatePayroll} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Payroll'}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell><TableCell>Department</TableCell>
              <TableCell align="right">Basic</TableCell><TableCell align="right">Gross</TableCell>
              <TableCell align="right">Deductions</TableCell><TableCell align="right">Net Salary</TableCell>
              <TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls.items?.map(p => (
              <TableRow key={p.id}>
                <TableCell><strong>{p.staff_name}</strong><br/><Typography variant="caption">{p.employee_id}</Typography></TableCell>
                <TableCell>{p.department}</TableCell>
                <TableCell align="right">₹{p.basic_salary?.toLocaleString()}</TableCell>
                <TableCell align="right">₹{p.gross_salary?.toLocaleString()}</TableCell>
                <TableCell align="right">₹{p.total_deductions?.toLocaleString()}</TableCell>
                <TableCell align="right"><strong>₹{p.net_salary?.toLocaleString()}</strong></TableCell>
                <TableCell><Chip label={p.payment_status} size="small" color={p.payment_status === 'paid' ? 'success' : 'warning'} /></TableCell>
                <TableCell>
                  {p.payment_status === 'pending' && (
                    <Button size="small" onClick={() => markPaid(p.id)}>Mark Paid</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {payrolls.items?.length === 0 && <TableRow><TableCell colSpan={8} align="center">No payroll records. Click "Generate Payroll" to create.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Leave Management Tab ─
function LeaveTab() {
  const [leaves, setLeaves] = useState({ items: [], total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ staff_id: '', leave_type: 'CL', from_date: '', to_date: '', days: 1, reason: '' });

  const load = useCallback(() => {
    staffAPI.listLeaves({ status: statusFilter || undefined, per_page: 50 }).then(r => setLeaves(r.data.data)).catch(() => {});
  }, [statusFilter]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { staffAPI.list({ per_page: 200, status: 'active' }).then(r => setStaffList(r.data.data.items || [])).catch(() => {}); }, []);

  const handleApply = async () => {
    try {
      await staffAPI.applyLeave(form);
      toast.success('Leave applied'); setDialogOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleAction = async (id, action) => {
    try {
      await staffAPI.approveLeave(id, { action });
      toast.success(`Leave ${action}`); load();
    } catch (err) { toast.error('Error'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField select size="small" label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ width: { xs: '100%', sm: 150 } }}>
          <MenuItem value="">All</MenuItem><MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem><MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Apply Leave</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell><TableCell>Type</TableCell>
              <TableCell>From</TableCell><TableCell>To</TableCell><TableCell>Days</TableCell>
              <TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.items?.map(l => (
              <TableRow key={l.id}>
                <TableCell><strong>{l.staff_name}</strong></TableCell>
                <TableCell><Chip label={l.leave_type} size="small" /></TableCell>
                <TableCell>{l.from_date}</TableCell><TableCell>{l.to_date}</TableCell>
                <TableCell>{l.days}</TableCell><TableCell>{l.reason || '-'}</TableCell>
                <TableCell><Chip label={l.status} size="small" color={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                <TableCell>
                  {l.status === 'pending' && <>
                    <IconButton size="small" color="success" onClick={() => handleAction(l.id, 'approved')}><Check /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleAction(l.id, 'rejected')}><Close /></IconButton>
                  </>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Leave</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Staff Member" value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})}>
                {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.full_name} ({s.employee_id})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Leave Type" value={form.leave_type} onChange={e => setForm({...form, leave_type: e.target.value})}>
                <MenuItem value="CL">Casual Leave</MenuItem><MenuItem value="EL">Earned Leave</MenuItem>
                <MenuItem value="SL">Sick Leave</MenuItem><MenuItem value="ML">Medical Leave</MenuItem>
                <MenuItem value="LWP">Leave Without Pay</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Days" type="number" value={form.days} onChange={e => setForm({...form, days: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="From" type="date" InputLabelProps={{ shrink: true }} value={form.from_date} onChange={e => setForm({...form, from_date: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="To" type="date" InputLabelProps={{ shrink: true }} value={form.to_date} onChange={e => setForm({...form, to_date: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Reason" multiline rows={2} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleApply}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Performance Reviews Tab
function PerformanceTab() {
  const [reviews, setReviews] = useState({ items: [], total: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    staff_id: '', review_period: '', review_type: 'annual',
    teaching_rating: 0, punctuality_rating: 0, communication_rating: 0,
    knowledge_rating: 0, teamwork_rating: 0,
    strengths: '', improvements: '', goals: '', comments: ''
  });

  const load = useCallback(() => {
    staffAPI.listReviews({ per_page: 50 }).then(r => setReviews(r.data.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { staffAPI.list({ per_page: 200, status: 'active' }).then(r => setStaffList(r.data.data.items || [])).catch(() => {}); }, []);

  const handleSubmit = async () => {
    try {
      await staffAPI.createReview(form);
      toast.success('Review submitted'); setDialogOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>New Review</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell><TableCell>Period</TableCell><TableCell>Type</TableCell>
              <TableCell>Teaching</TableCell><TableCell>Punctuality</TableCell><TableCell>Communication</TableCell>
              <TableCell>Overall</TableCell><TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.items?.map(r => (
              <TableRow key={r.id}>
                <TableCell><strong>{r.staff_name}</strong></TableCell>
                <TableCell>{r.review_period}</TableCell>
                <TableCell><Chip label={r.review_type} size="small" /></TableCell>
                <TableCell><Rating value={r.teaching_rating} size="small" readOnly /></TableCell>
                <TableCell><Rating value={r.punctuality_rating} size="small" readOnly /></TableCell>
                <TableCell><Rating value={r.communication_rating} size="small" readOnly /></TableCell>
                <TableCell><Chip label={r.overall_rating?.toFixed(1)} size="small" color="primary" /></TableCell>
                <TableCell><Chip label={r.status} size="small" color={r.status === 'acknowledged' ? 'success' : 'default'} /></TableCell>
              </TableRow>
            ))}
            {reviews.items?.length === 0 && <TableRow><TableCell colSpan={8} align="center">No reviews yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Performance Review</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth label="Staff" value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})}>
                {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.full_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="Review Period" value={form.review_period} onChange={e => setForm({...form, review_period: e.target.value})} placeholder="2025-26" /></Grid>
            <Grid item xs={6} sm={3}>
              <TextField select fullWidth label="Type" value={form.review_type} onChange={e => setForm({...form, review_type: e.target.value})}>
                <MenuItem value="annual">Annual</MenuItem><MenuItem value="self">Self</MenuItem>
                <MenuItem value="peer">Peer</MenuItem><MenuItem value="principal">Principal</MenuItem>
              </TextField>
            </Grid>
            {['teaching_rating', 'punctuality_rating', 'communication_rating', 'knowledge_rating', 'teamwork_rating'].map(f => (
              <Grid item xs={12} sm={6} md={4} key={f}>
                <Typography variant="body2" gutterBottom>{f.replace('_rating', '').replace('_', ' ').toUpperCase()}</Typography>
                <Rating value={form[f]} onChange={(e, v) => setForm({...form, [f]: v})} />
              </Grid>
            ))}
            <Grid item xs={12}><TextField fullWidth label="Strengths" multiline rows={2} value={form.strengths} onChange={e => setForm({...form, strengths: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Areas of Improvement" multiline rows={2} value={form.improvements} onChange={e => setForm({...form, improvements: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Goals" multiline rows={2} value={form.goals} onChange={e => setForm({...form, goals: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Submit Review</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Recruitment Tab ──────
function RecruitmentTab() {
  const [jobs, setJobs] = useState({ items: [], total: 0 });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState({ items: [], total: 0 });
  const [jobDialog, setJobDialog] = useState(false);
  const [appDialog, setAppDialog] = useState(false);
  const [jobForm, setJobForm] = useState({ job_title: '', department: '', designation: '', vacancies: 1, description: '', requirements: '', salary_range: '', application_deadline: '' });
  const [appForm, setAppForm] = useState({ applicant_name: '', email: '', phone: '', qualification: '', experience_years: '' });

  const loadJobs = useCallback(() => {
    staffAPI.listRecruitment({ per_page: 50 }).then(r => setJobs(r.data.data)).catch(() => {});
  }, []);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  const loadApps = (jobId) => {
    staffAPI.listApplications(jobId, { per_page: 50 }).then(r => { setApplications(r.data.data); setSelectedJob(jobId); }).catch(() => {});
  };

  const handleCreateJob = async () => {
    try {
      await staffAPI.createRecruitment(jobForm);
      toast.success('Job posted'); setJobDialog(false); loadJobs();
    } catch (err) { toast.error('Error'); }
  };

  const handleAddApp = async () => {
    try {
      await staffAPI.addApplication(selectedJob, appForm);
      toast.success('Application added'); setAppDialog(false); loadApps(selectedJob);
    } catch (err) { toast.error('Error'); }
  };

  const updateAppStatus = async (appId, status) => {
    try {
      await staffAPI.updateApplication(appId, { status });
      toast.success('Status updated'); loadApps(selectedJob);
    } catch (err) { toast.error('Error'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6">{selectedJob ? 'Applications' : 'Job Postings'}</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {selectedJob && <Button variant="outlined" onClick={() => setSelectedJob(null)}>Back to Jobs</Button>}
          {selectedJob ? (
            <Button variant="contained" startIcon={<Add />} onClick={() => setAppDialog(true)}>Add Applicant</Button>
          ) : (
            <Button variant="contained" startIcon={<Add />} onClick={() => setJobDialog(true)}>Post Job</Button>
          )}
        </Box>
      </Box>

      {!selectedJob ? (
        <Grid container spacing={2}>
          {jobs.items?.map(j => (
            <Grid item xs={12} md={6} key={j.id}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => loadApps(j.id)}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="h6">{j.job_title}</Typography>
                    <Chip label={j.status} size="small" color={j.status === 'open' ? 'success' : 'default'} />
                  </Box>
                  <Typography color="text.secondary">{j.department} • {j.designation}</Typography>
                  <Typography variant="body2">Vacancies: {j.vacancies} | Salary: {j.salary_range || 'N/A'}</Typography>
                  {j.application_deadline && <Typography variant="caption" color="error">Deadline: {j.application_deadline}</Typography>}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {jobs.items?.length === 0 && <Grid item xs={12}><Alert severity="info">No job postings. Click "Post Job" to create one.</Alert></Grid>}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell>
                <TableCell>Qualification</TableCell><TableCell>Experience</TableCell>
                <TableCell>Rating</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.items?.map(a => (
                <TableRow key={a.id}>
                  <TableCell><strong>{a.applicant_name}</strong></TableCell>
                  <TableCell>{a.email}</TableCell><TableCell>{a.phone}</TableCell>
                  <TableCell>{a.qualification}</TableCell><TableCell>{a.experience_years} yrs</TableCell>
                  <TableCell><Rating value={a.rating} size="small" readOnly /></TableCell>
                  <TableCell><Chip label={a.status} size="small" color={a.status === 'selected' ? 'success' : a.status === 'rejected' ? 'error' : 'default'} /></TableCell>
                  <TableCell>
                    <TextField select size="small" value={a.status} onChange={e => updateAppStatus(a.id, e.target.value)} sx={{ minWidth: 100 }}>
                      {['applied','shortlisted','interview','selected','rejected','offer_sent','joined'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
              {applications.items?.length === 0 && <TableRow><TableCell colSpan={8} align="center">No applications</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Job Dialog */}
      <Dialog open={jobDialog} onClose={() => setJobDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post New Job</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Job Title" required value={jobForm.job_title} onChange={e => setJobForm({...jobForm, job_title: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Department" value={jobForm.department} onChange={e => setJobForm({...jobForm, department: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Designation" value={jobForm.designation} onChange={e => setJobForm({...jobForm, designation: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Vacancies" type="number" value={jobForm.vacancies} onChange={e => setJobForm({...jobForm, vacancies: parseInt(e.target.value)})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Salary Range" value={jobForm.salary_range} onChange={e => setJobForm({...jobForm, salary_range: e.target.value})} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Deadline" type="date" InputLabelProps={{ shrink: true }} value={jobForm.application_deadline} onChange={e => setJobForm({...jobForm, application_deadline: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={3} value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Requirements" multiline rows={2} value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setJobDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleCreateJob}>Post</Button></DialogActions>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={appDialog} onClose={() => setAppDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Applicant</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" required value={appForm.applicant_name} onChange={e => setAppForm({...appForm, applicant_name: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" value={appForm.email} onChange={e => setAppForm({...appForm, email: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={appForm.phone} onChange={e => setAppForm({...appForm, phone: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Qualification" value={appForm.qualification} onChange={e => setAppForm({...appForm, qualification: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Experience (years)" type="number" value={appForm.experience_years} onChange={e => setAppForm({...appForm, experience_years: parseInt(e.target.value)})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setAppDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleAddApp}>Add</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Training Tab ─────────
function TrainingTab() {
  const [trainings, setTrainings] = useState({ items: [], total: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ staff_id: '', training_name: '', training_type: 'workshop', provider: '', start_date: '', end_date: '', hours: '', cpd_points: 0, status: 'upcoming' });

  const load = useCallback(() => {
    staffAPI.listTrainings({ per_page: 50 }).then(r => setTrainings(r.data.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { staffAPI.list({ per_page: 200, status: 'active' }).then(r => setStaffList(r.data.data.items || [])).catch(() => {}); }, []);

  const handleCreate = async () => {
    try {
      await staffAPI.createTraining(form);
      toast.success('Training record added'); setDialogOpen(false); load();
    } catch (err) { toast.error('Error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await staffAPI.updateTraining(id, { status });
      toast.success('Updated'); load();
    } catch (err) { toast.error('Error'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Add Training</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell><TableCell>Training</TableCell><TableCell>Type</TableCell>
              <TableCell>Provider</TableCell><TableCell>Dates</TableCell><TableCell>Hours</TableCell>
              <TableCell>CPD Points</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trainings.items?.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.staff_name}</TableCell>
                <TableCell><strong>{t.training_name}</strong></TableCell>
                <TableCell><Chip label={t.training_type} size="small" /></TableCell>
                <TableCell>{t.provider || '-'}</TableCell>
                <TableCell>{t.start_date} - {t.end_date || '?'}</TableCell>
                <TableCell>{t.hours}</TableCell>
                <TableCell>{t.cpd_points}</TableCell>
                <TableCell><Chip label={t.status} size="small" color={t.status === 'completed' ? 'success' : t.status === 'ongoing' ? 'info' : 'default'} /></TableCell>
                <TableCell>
                  <TextField select size="small" value={t.status} onChange={e => updateStatus(t.id, e.target.value)} sx={{ minWidth: 100 }}>
                    {['upcoming','ongoing','completed','cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </TextField>
                </TableCell>
              </TableRow>
            ))}
            {trainings.items?.length === 0 && <TableRow><TableCell colSpan={9} align="center">No training records</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Training Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Staff" value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})}>
                {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.full_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Training Name" value={form.training_name} onChange={e => setForm({...form, training_name: e.target.value})} /></Grid>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Type" value={form.training_type} onChange={e => setForm({...form, training_type: e.target.value})}>
                <MenuItem value="workshop">Workshop</MenuItem><MenuItem value="seminar">Seminar</MenuItem>
                <MenuItem value="online">Online</MenuItem><MenuItem value="certification">Certification</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Provider" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} /></Grid>
            <Grid item xs={6} sm={2}><TextField fullWidth label="Hours" type="number" value={form.hours} onChange={e => setForm({...form, hours: e.target.value})} /></Grid>
            <Grid item xs={6} sm={2}><TextField fullWidth label="CPD Pts" type="number" value={form.cpd_points} onChange={e => setForm({...form, cpd_points: parseInt(e.target.value)})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate}>Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Duty Roster Tab ──────
function DutyRosterTab() {
  const [duties, setDuties] = useState({ items: [], total: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ staff_id: '', duty_type: 'assembly', duty_date: '', start_time: '', end_time: '', location: '', notes: '' });

  const load = useCallback(() => {
    staffAPI.listDuties({ per_page: 50 }).then(r => setDuties(r.data.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { staffAPI.list({ per_page: 200, status: 'active' }).then(r => setStaffList(r.data.data.items || [])).catch(() => {}); }, []);

  const handleCreate = async () => {
    try {
      await staffAPI.createDuty(form);
      toast.success('Duty assigned'); setDialogOpen(false); load();
    } catch (err) { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    try {
      await staffAPI.deleteDuty(id);
      toast.success('Duty deleted'); load();
    } catch (err) { toast.error('Error'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Assign Duty</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Staff</TableCell><TableCell>Duty Type</TableCell><TableCell>Date</TableCell>
              <TableCell>Time</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duties.items?.map(d => (
              <TableRow key={d.id}>
                <TableCell><strong>{d.staff_name}</strong></TableCell>
                <TableCell><Chip label={d.duty_type} size="small" /></TableCell>
                <TableCell>{d.duty_date}</TableCell>
                <TableCell>{d.start_time ? `${d.start_time} - ${d.end_time || ''}` : '-'}</TableCell>
                <TableCell>{d.location || '-'}</TableCell>
                <TableCell><Chip label={d.status} size="small" color={d.status === 'completed' ? 'success' : d.status === 'absent' ? 'error' : 'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => handleDelete(d.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {duties.items?.length === 0 && <TableRow><TableCell colSpan={7} align="center">No duties assigned</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Duty</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField select fullWidth label="Staff" value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})}>
                {staffList.map(s => <MenuItem key={s.id} value={s.id}>{s.full_name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth label="Duty Type" value={form.duty_type} onChange={e => setForm({...form, duty_type: e.target.value})}>
                <MenuItem value="exam_duty">Exam Duty</MenuItem><MenuItem value="assembly">Assembly</MenuItem>
                <MenuItem value="gate_duty">Gate Duty</MenuItem><MenuItem value="event">Event</MenuItem>
                <MenuItem value="bus_duty">Bus Duty</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.duty_date} onChange={e => setForm({...form, duty_date: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Start Time" type="time" InputLabelProps={{ shrink: true }} value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="End Time" type="time" InputLabelProps={{ shrink: true }} value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleCreate}>Assign</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Workload Tab ─────────
function WorkloadTab() {
  const [data, setData] = useState([]);
  useEffect(() => {
    staffAPI.getWorkload().then(r => setData(r.data.data || [])).catch(() => {});
  }, []);
  const maxPeriods = Math.max(...data.map(d => d.periods_per_week), 1);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Teacher Workload Dashboard</Typography>
      {data.length === 0 ? (
        <Alert severity="info">No teaching staff or timetable data found.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Teacher</TableCell><TableCell>Designation</TableCell><TableCell>Department</TableCell>
                <TableCell>Periods/Week</TableCell><TableCell>Subjects</TableCell><TableCell>Load</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(d => (
                <TableRow key={d.staff_id}>
                  <TableCell><strong>{d.name}</strong></TableCell>
                  <TableCell>{d.designation || '-'}</TableCell>
                  <TableCell>{d.department || '-'}</TableCell>
                  <TableCell>{d.periods_per_week}</TableCell>
                  <TableCell>{d.subjects_count}</TableCell>
                  <TableCell sx={{ minWidth: { xs: 120, sm: 200 } }}>
                    <LinearProgress variant="determinate" value={Math.min((d.periods_per_week / maxPeriods) * 100, 100)}
                      color={d.periods_per_week > 30 ? 'error' : d.periods_per_week > 20 ? 'warning' : 'primary'}
                      sx={{ height: 10, borderRadius: 5 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ─── Main Component ───────
export default function Staff() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>HR & Staff Management</Typography>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<TrendingUp />} label="Dashboard" iconPosition="start" />
          <Tab icon={<Group />} label="Staff" iconPosition="start" />
          <Tab icon={<Payment />} label="Payroll" iconPosition="start" />
          <Tab icon={<EventNote />} label="Leaves" iconPosition="start" />
          <Tab icon={<Star />} label="Performance" iconPosition="start" />
          <Tab icon={<Work />} label="Recruitment" iconPosition="start" />
          <Tab icon={<School />} label="Training" iconPosition="start" />
          <Tab icon={<Assignment />} label="Duty Roster" iconPosition="start" />
          <Tab icon={<AccessTime />} label="Workload" iconPosition="start" />
        </Tabs>
      </Paper>
      <Box>
        {tab === 0 && <DashboardTab />}
        {tab === 1 && <StaffListTab />}
        {tab === 2 && <PayrollTab />}
        {tab === 3 && <LeaveTab />}
        {tab === 4 && <PerformanceTab />}
        {tab === 5 && <RecruitmentTab />}
        {tab === 6 && <TrainingTab />}
        {tab === 7 && <DutyRosterTab />}
        {tab === 8 && <WorkloadTab />}
      </Box>
    </Box>
  );
}
