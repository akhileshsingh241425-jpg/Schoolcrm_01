import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Stack, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, CircularProgress, Alert, LinearProgress, Avatar, alpha,
  Tooltip, TablePagination, Divider, Menu, ListItemIcon
} from '@mui/material';
import {
  Add, Edit, Delete, Search, Person, FilterList, CalendarMonth,
  AttachMoney, CheckCircle, Cancel, PendingActions, Today,
  Badge, MoreVert, Download, Visibility, ArrowUpward, ArrowDownward,
  Group, HowToReg, AssignmentLate, Payments, EventBusy
} from '@mui/icons-material';
import { platformStaffAPI } from '../../services/api';

const TAB_LABELS = ['Dashboard', 'Staff List', 'Attendance', 'Payroll', 'Leaves'];
const STAFF_TYPES = ['admin', 'technical', 'support', 'management'];
const LEAVE_TYPES = ['CL', 'EL', 'SL', 'ML', 'LWP'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function StaffManagement() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard
  const [dashStats, setDashStats] = useState(null);

  // Staff List
  const [staffList, setStaffList] = useState([]);
  const [staffTotal, setStaffTotal] = useState(0);
  const [staffPage, setStaffPage] = useState(0);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatus, setStaffStatus] = useState('');

  // Form dialogs
  const [staffDialog, setStaffDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', gender: '',
    date_of_birth: '', qualification: '', designation: '', department: '',
    date_of_joining: '', salary: '', address: '', city: '', state: '',
    employee_id: '', staff_type: 'admin', contract_type: 'permanent',
    aadhar_no: '', pan_no: '', bank_name: '', bank_account_no: '', ifsc_code: '',
    pf_number: '', emergency_contact: '', emergency_person: '', blood_group: '',
    experience_years: '',
  });

  // Attendance
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attRecords, setAttRecords] = useState([]);
  const [attReport, setAttReport] = useState([]);
  const [attViewMode, setAttViewMode] = useState('mark'); // 'mark' or 'report'
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());

  // Payroll
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payrollList, setPayrollList] = useState([]);
  const [payrollStatus, setPayrollStatus] = useState('');

  // Leave
  const [leaveList, setLeaveList] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('');
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    staff_id: '', leave_type: 'CL', from_date: '', to_date: '', reason: ''
  });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPayrollId, setMenuPayrollId] = useState(null);

  // ── Fetch Dashboard ──
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await platformStaffAPI.dashboard();
      setDashStats(res.data.data);
    } catch {}
  }, []);

  // ── Fetch Staff List ──
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformStaffAPI.list({
        search: staffSearch, status: staffStatus,
        page: staffPage + 1, per_page: 20
      });
      const d = res.data.data;
      setStaffList(d.items || []);
      setStaffTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  }, [staffSearch, staffStatus, staffPage]);

  // ── Fetch Attendance ──
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformStaffAPI.listAttendance({ date: attDate });
      setAttRecords(res.data.data || []);
    } catch {} finally { setLoading(false); }
  }, [attDate]);

  const fetchAttReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformStaffAPI.attendanceReport({ month: attMonth, year: attYear });
      setAttReport(res.data.data || []);
    } catch {} finally { setLoading(false); }
  }, [attMonth, attYear]);

  // ── Fetch Payroll ──
  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformStaffAPI.listPayroll({
        month: payMonth, year: payYear, status: payrollStatus
      });
      setPayrollList(res.data.data || []);
    } catch {} finally { setLoading(false); }
  }, [payMonth, payYear, payrollStatus]);

  // ── Fetch Leaves ──
  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await platformStaffAPI.listLeaves({ status: leaveFilter });
      setLeaveList(res.data.data || []);
    } catch {} finally { setLoading(false); }
  }, [leaveFilter]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { if (tab === 1) fetchStaff(); }, [tab, fetchStaff]);
  useEffect(() => { if (tab === 2 && attViewMode === 'mark') fetchAttendance(); }, [tab, attViewMode, fetchAttendance]);
  useEffect(() => { if (tab === 2 && attViewMode === 'report') fetchAttReport(); }, [tab, attViewMode, fetchAttReport]);
  useEffect(() => { if (tab === 3) fetchPayroll(); }, [tab, fetchPayroll]);
  useEffect(() => { if (tab === 4) fetchLeaves(); }, [tab, fetchLeaves]);

  // ── Staff CRUD ──
  const openStaffForm = (staff = null) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffForm({
        first_name: staff.first_name || '', last_name: staff.last_name || '',
        email: staff.email || '', phone: staff.phone || '', gender: staff.gender || '',
        date_of_birth: staff.date_of_birth || '', qualification: staff.qualification || '',
        designation: staff.designation || '', department: staff.department || '',
        date_of_joining: staff.date_of_joining || '', salary: staff.salary || '',
        address: staff.address || '', city: staff.city || '', state: staff.state || '',
        employee_id: staff.employee_id || '', staff_type: staff.staff_type || 'admin',
        contract_type: staff.contract_type || 'permanent',
        aadhar_no: staff.aadhar_no || '', pan_no: staff.pan_no || '',
        bank_name: staff.bank_name || '', bank_account_no: staff.bank_account_no || '',
        ifsc_code: staff.ifsc_code || '', pf_number: staff.pf_number || '',
        emergency_contact: staff.emergency_contact || '',
        emergency_person: staff.emergency_person || '',
        blood_group: staff.blood_group || '', experience_years: staff.experience_years || '',
      });
    } else {
      setEditingStaff(null);
      setStaffForm({
        first_name: '', last_name: '', email: '', phone: '', gender: '',
        date_of_birth: '', qualification: '', designation: '', department: '',
        date_of_joining: '', salary: '', address: '', city: '', state: '',
        employee_id: '', staff_type: 'admin', contract_type: 'permanent',
        aadhar_no: '', pan_no: '', bank_name: '', bank_account_no: '', ifsc_code: '',
        pf_number: '', emergency_contact: '', emergency_person: '', blood_group: '',
        experience_years: '',
      });
    }
    setStaffDialog(true);
  };

  const saveStaff = async () => {
    setLoading(true);
    setError('');
    try {
      if (editingStaff) {
        await platformStaffAPI.update(editingStaff.id, staffForm);
        setSuccess('Staff updated');
      } else {
        await platformStaffAPI.create(staffForm);
        setSuccess('Staff created');
      }
      setStaffDialog(false);
      fetchStaff();
      fetchDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save staff');
    } finally { setLoading(false); }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Deactivate this staff member?')) return;
    try {
      await platformStaffAPI.delete(id);
      setSuccess('Staff deactivated');
      fetchStaff();
      fetchDashboard();
    } catch { setError('Failed to deactivate'); }
  };

  // ── Mark Attendance ──
  const markAttendance = async (staffId, status) => {
    try {
      await platformStaffAPI.markAttendance({
        staff_id: staffId, date: attDate, status
      });
      setSuccess('Attendance marked');
      fetchAttendance();
    } catch { setError('Failed to mark attendance'); }
  };

  // ── Payroll Actions ──
  const generatePayroll = async () => {
    if (!window.confirm(`Generate payroll for ${MONTHS[payMonth-1]} ${payYear}?`)) return;
    try {
      await platformStaffAPI.generatePayroll({ month: payMonth, year: payYear });
      setSuccess('Payroll generated');
      fetchPayroll();
    } catch { setError('Failed to generate payroll'); }
  };

  const updatePayrollStatus = async (id, status) => {
    try {
      await platformStaffAPI.updatePayroll(id, { payment_status: status });
      setSuccess('Payroll updated');
      fetchPayroll();
    } catch { setError('Failed to update payroll'); }
  };

  // ── Leave Actions ──
  const applyLeave = async () => {
    if (!leaveForm.staff_id || !leaveForm.from_date || !leaveForm.to_date) {
      setError('All fields required'); return;
    }
    try {
      await platformStaffAPI.applyLeave(leaveForm);
      setSuccess('Leave applied');
      setLeaveDialog(false);
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply leave');
    }
  };

  const approveLeave = async (id, status) => {
    try {
      await platformStaffAPI.approveLeave(id, { status });
      setSuccess(`Leave ${status}`);
      fetchLeaves();
    } catch { setError('Failed to update leave'); }
  };

  // ── Render ──
  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={1.5}>
          <Group sx={{ color: '#6366f1', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Staff Management</Typography>
            <Typography variant="body2" color="text.secondary">Manage platform staff, attendance, payroll &amp; leaves</Typography>
          </Box>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        {TAB_LABELS.map(l => <Tab key={l} label={l} />)}
      </Tabs>

      {/* ═══ DASHBOARD ═══ */}
      {tab === 0 && (
        <Grid container spacing={2}>
          {[
            { label: 'Total Staff', value: dashStats?.total || 0, icon: <Group />, color: '#6366f1' },
            { label: 'Active', value: dashStats?.active || 0, icon: <HowToReg />, color: '#10b981' },
            { label: 'Present Today', value: dashStats?.present_today || 0, icon: <Today />, color: '#3b82f6' },
            { label: 'Pending Payroll', value: dashStats?.pending_payroll || 0, icon: <Payments />, color: '#f59e0b' },
            { label: 'Pending Leaves', value: dashStats?.pending_leaves || 0, icon: <EventBusy />, color: '#ef4444' },
          ].map((s, i) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
              <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: 2, mx: 'auto', mb: 1,
                  bgcolor: alpha(s.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  {s.icon}
                </Box>
                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ═══ STAFF LIST ═══ */}
      {tab === 1 && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
              <TextField size="small" placeholder="Search staff..." value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: 250 }} />
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={staffStatus} onChange={e => setStaffStatus(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Box flex={1} />
              <Button variant="contained" startIcon={<Add />} onClick={() => openStaffForm()}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                Add Staff
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell><Chip label={s.employee_id || '-'} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#6366f1' }}>
                            {s.first_name?.[0]}
                          </Avatar>
                          {s.full_name}
                        </Box>
                      </TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.designation || '-'}</TableCell>
                      <TableCell><Chip label={s.staff_type} size="small" color="info" variant="outlined" /></TableCell>
                      <TableCell>
                        <Chip label={s.status} size="small"
                          color={s.status === 'active' ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openStaffForm(s)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deleteStaff(s.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staffList.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={7} align="center">No staff found</TableCell></TableRow>
                  )}
                  {loading && (
                    <TableRow><TableCell colSpan={7}><LinearProgress /></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={staffTotal} page={staffPage}
              onPageChange={(_, p) => setStaffPage(p)} rowsPerPage={20}
              rowsPerPageOptions={[20]} />
          </CardContent>
        </Card>
      )}

      {/* ═══ ATTENDANCE ═══ */}
      {tab === 2 && (
        <Box>
          <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
            <Button variant={attViewMode === 'mark' ? 'contained' : 'outlined'}
              size="small" onClick={() => setAttViewMode('mark')}
              sx={attViewMode === 'mark' ? { bgcolor: '#6366f1' } : {}}>Mark Attendance</Button>
            <Button variant={attViewMode === 'report' ? 'contained' : 'outlined'}
              size="small" onClick={() => setAttViewMode('report')}
              sx={attViewMode === 'report' ? { bgcolor: '#6366f1' } : {}}>Attendance Report</Button>
          </Box>

          {attViewMode === 'mark' ? (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" gap={2} mb={2} alignItems="center">
                  <TextField type="date" size="small" label="Date" value={attDate}
                    onChange={e => setAttDate(e.target.value)}
                    InputLabelProps={{ shrink: true }} />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Staff</TableCell>
                        <TableCell>Designation</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Mark</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {staffList.filter(s => s.status === 'active').map(s => {
                        const existing = attRecords.find(r => r.staff_id === s.id);
                        return (
                          <TableRow key={s.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Avatar sx={{ width: 26, height: 26, fontSize: 11, bgcolor: '#6366f1' }}>
                                  {s.first_name?.[0]}</Avatar>
                                {s.full_name}
                              </Box>
                            </TableCell>
                            <TableCell>{s.designation || '-'}</TableCell>
                            <TableCell>
                              <Chip label={existing?.status || '—'} size="small"
                                color={existing?.status === 'present' ? 'success' : existing?.status === 'absent' ? 'error' : existing?.status === 'late' ? 'warning' : 'default'} />
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                {['present', 'absent', 'late', 'half_day'].map(st => (
                                  <Chip key={st} label={st} size="small" clickable
                                    color={existing?.status === st ? 'primary' : 'default'}
                                    variant={existing?.status === st ? 'filled' : 'outlined'}
                                    onClick={() => markAttendance(s.id, st)} />
                                ))}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" gap={2} mb={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Month</InputLabel>
                    <Select label="Month" value={attMonth} onChange={e => setAttMonth(e.target.value)}>
                      {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select label="Year" value={attYear} onChange={e => setAttYear(e.target.value)}>
                      {[2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Staff</TableCell>
                        <TableCell align="center">Total Days</TableCell>
                        <TableCell align="center" sx={{ color: 'success.main' }}>Present</TableCell>
                        <TableCell align="center" sx={{ color: 'error.main' }}>Absent</TableCell>
                        <TableCell align="center" sx={{ color: 'warning.main' }}>Late</TableCell>
                        <TableCell align="center">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attReport.map(r => (
                        <TableRow key={r.staff_id} hover>
                          <TableCell>{r.name}</TableCell>
                          <TableCell align="center">{r.total_days}</TableCell>
                          <TableCell align="center">{r.present}</TableCell>
                          <TableCell align="center">{r.absent}</TableCell>
                          <TableCell align="center">{r.late}</TableCell>
                          <TableCell align="center">
                            <Chip label={`${r.attendance_pct}%`} size="small"
                              color={r.attendance_pct >= 90 ? 'success' : r.attendance_pct >= 75 ? 'warning' : 'error'} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {attReport.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ═══ PAYROLL ═══ */}
      {tab === 3 && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select label="Month" value={payMonth} onChange={e => setPayMonth(e.target.value)}>
                  {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select label="Year" value={payYear} onChange={e => setPayYear(e.target.value)}>
                  {[2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={payrollStatus} onChange={e => setPayrollStatus(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="hold">Hold</MenuItem>
                </Select>
              </FormControl>
              <Box flex={1} />
              <Button variant="contained" startIcon={<AttachMoney />} onClick={generatePayroll}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                Generate Payroll
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Staff</TableCell>
                    <TableCell align="right">Basic</TableCell>
                    <TableCell align="right">Allowances</TableCell>
                    <TableCell align="right">Deductions</TableCell>
                    <TableCell align="right">Overtime</TableCell>
                    <TableCell align="right">Net</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payrollList.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.staff_name || `Staff #${p.staff_id}`}</TableCell>
                      <TableCell align="right">₹{p.basic_salary?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">₹{p.allowances?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">₹{p.deductions?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right">₹{p.overtime_amount?.toLocaleString() || 0}</TableCell>
                      <TableCell align="right"><strong>₹{p.net_salary?.toLocaleString() || 0}</strong></TableCell>
                      <TableCell>
                        <Chip label={p.payment_status} size="small"
                          color={p.payment_status === 'paid' ? 'success' : p.payment_status === 'hold' ? 'warning' : 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={0.5} justifyContent="flex-end">
                          {p.payment_status !== 'paid' && (
                            <Chip label="Mark Paid" size="small" color="success" clickable
                              onClick={() => updatePayrollStatus(p.id, 'paid')} />
                          )}
                          {p.payment_status === 'paid' && (
                            <Chip label="Pending" size="small" clickable
                              onClick={() => updatePayrollStatus(p.id, 'pending')} />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payrollList.length === 0 && (
                    <TableRow><TableCell colSpan={8} align="center">No payroll records</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ LEAVES ═══ */}
      {tab === 4 && (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={leaveFilter} onChange={e => setLeaveFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <Box flex={1} />
              <Button variant="contained" startIcon={<Add />} onClick={() => setLeaveDialog(true)}
                sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                Apply Leave
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Staff</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaveList.map(l => (
                    <TableRow key={l.id} hover>
                      <TableCell>{l.staff_name || `Staff #${l.staff_id}`}</TableCell>
                      <TableCell><Chip label={l.leave_type} size="small" variant="outlined" /></TableCell>
                      <TableCell>{l.from_date}</TableCell>
                      <TableCell>{l.to_date}</TableCell>
                      <TableCell>{l.days}</TableCell>
                      <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason}</TableCell>
                      <TableCell>
                        <Chip label={l.status} size="small"
                          color={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'warning'} />
                      </TableCell>
                      <TableCell align="right">
                        {l.status === 'pending' && (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Chip label="Approve" size="small" color="success" clickable
                              onClick={() => approveLeave(l.id, 'approved')} />
                            <Chip label="Reject" size="small" color="error" clickable
                              onClick={() => approveLeave(l.id, 'rejected')} />
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaveList.length === 0 && (
                    <TableRow><TableCell colSpan={8} align="center">No leave records</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* ═══ STAFF FORM DIALOG ═══ */}
      <Dialog open={staffDialog} onClose={() => setStaffDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={6}><TextField fullWidth label="First Name" value={staffForm.first_name}
              onChange={e => setStaffForm({...staffForm, first_name: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Last Name" value={staffForm.last_name}
              onChange={e => setStaffForm({...staffForm, last_name: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={staffForm.email}
              onChange={e => setStaffForm({...staffForm, email: e.target.value})} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={staffForm.phone}
              onChange={e => setStaffForm({...staffForm, phone: e.target.value})} /></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select label="Gender" value={staffForm.gender} onChange={e => setStaffForm({...staffForm, gender: e.target.value})}>
                  <MenuItem value="male">Male</MenuItem><MenuItem value="female">Female</MenuItem><MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField fullWidth type="date" label="DOB" value={staffForm.date_of_birth}
              InputLabelProps={{ shrink: true }} onChange={e => setStaffForm({...staffForm, date_of_birth: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth type="date" label="Date of Joining" value={staffForm.date_of_joining}
              InputLabelProps={{ shrink: true }} onChange={e => setStaffForm({...staffForm, date_of_joining: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Employee ID" value={staffForm.employee_id}
              onChange={e => setStaffForm({...staffForm, employee_id: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Designation" value={staffForm.designation}
              onChange={e => setStaffForm({...staffForm, designation: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Department" value={staffForm.department}
              onChange={e => setStaffForm({...staffForm, department: e.target.value})} /></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Staff Type</InputLabel>
                <Select label="Staff Type" value={staffForm.staff_type}
                  onChange={e => setStaffForm({...staffForm, staff_type: e.target.value})}>
                  {STAFF_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Contract</InputLabel>
                <Select label="Contract" value={staffForm.contract_type}
                  onChange={e => setStaffForm({...staffForm, contract_type: e.target.value})}>
                  <MenuItem value="permanent">Permanent</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="probation">Probation</MenuItem>
                  <MenuItem value="part_time">Part Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField fullWidth type="number" label="Experience (yrs)" value={staffForm.experience_years}
              onChange={e => setStaffForm({...staffForm, experience_years: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth type="number" label="Salary" value={staffForm.salary}
              onChange={e => setStaffForm({...staffForm, salary: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Qualification" value={staffForm.qualification}
              onChange={e => setStaffForm({...staffForm, qualification: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="PF Number" value={staffForm.pf_number}
              onChange={e => setStaffForm({...staffForm, pf_number: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Blood Group" value={staffForm.blood_group}
              onChange={e => setStaffForm({...staffForm, blood_group: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Emergency Person" value={staffForm.emergency_person}
              onChange={e => setStaffForm({...staffForm, emergency_person: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Emergency Contact" value={staffForm.emergency_contact}
              onChange={e => setStaffForm({...staffForm, emergency_contact: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" value={staffForm.address}
              onChange={e => setStaffForm({...staffForm, address: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="City" value={staffForm.city}
              onChange={e => setStaffForm({...staffForm, city: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="State" value={staffForm.state}
              onChange={e => setStaffForm({...staffForm, state: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Aadhar No." value={staffForm.aadhar_no}
              onChange={e => setStaffForm({...staffForm, aadhar_no: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="PAN No." value={staffForm.pan_no}
              onChange={e => setStaffForm({...staffForm, pan_no: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Bank Name" value={staffForm.bank_name}
              onChange={e => setStaffForm({...staffForm, bank_name: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Account No." value={staffForm.bank_account_no}
              onChange={e => setStaffForm({...staffForm, bank_account_no: e.target.value})} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="IFSC Code" value={staffForm.ifsc_code}
              onChange={e => setStaffForm({...staffForm, ifsc_code: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveStaff} disabled={loading}
            sx={{ bgcolor: '#6366f1' }}>{loading ? 'Saving...' : editingStaff ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* ═══ LEAVE FORM DIALOG ═══ */}
      <Dialog open={leaveDialog} onClose={() => setLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Leave</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Staff</InputLabel>
              <Select label="Staff" value={leaveForm.staff_id}
                onChange={e => setLeaveForm({...leaveForm, staff_id: e.target.value})}>
                {staffList.filter(s => s.status === 'active').map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.full_name} ({s.designation || '—'})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Leave Type</InputLabel>
              <Select label="Leave Type" value={leaveForm.leave_type}
                onChange={e => setLeaveForm({...leaveForm, leave_type: e.target.value})}>
                {LEAVE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField type="date" label="From Date" value={leaveForm.from_date}
              InputLabelProps={{ shrink: true }}
              onChange={e => setLeaveForm({...leaveForm, from_date: e.target.value})} />
            <TextField type="date" label="To Date" value={leaveForm.to_date}
              InputLabelProps={{ shrink: true }}
              onChange={e => setLeaveForm({...leaveForm, to_date: e.target.value})} />
            <TextField label="Reason" multiline rows={2} value={leaveForm.reason}
              onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={applyLeave}
            sx={{ bgcolor: '#6366f1' }}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
