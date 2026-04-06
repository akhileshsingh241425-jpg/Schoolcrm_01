import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, TablePagination, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Snackbar, Alert, Tabs, Tab, Card, CardContent, IconButton, Tooltip, Divider,
  Stepper, Step, StepLabel, LinearProgress, Badge, Menu, ListItemIcon, ListItemText,
  Collapse, List, ListItem, ListItemButton, Avatar, Stack, Switch, FormControlLabel,
  CircularProgress, Accordion, AccordionSummary, AccordionDetails, TableSortLabel
} from '@mui/material';
import {
  Add, Search, FilterList, Visibility, Edit, Delete, CheckCircle, Cancel,
  PersonAdd, FileUpload, FileDownload, MoreVert, School, EventSeat, Assignment,
  Description, ExpandMore, Refresh, TrendingUp, People, HourglassEmpty,
  ThumbDown, LocationOn, Phone, Email, CalendarMonth, Upload, Verified,
  Close, ArrowForward, Print, Timeline
} from '@mui/icons-material';
import { admissionsAPI, studentsAPI } from '../../services/api';

const STATUS_CONFIG = {
  applied: { color: 'info', label: 'Applied', icon: <Description fontSize="small" /> },
  document_pending: { color: 'warning', label: 'Doc Pending', icon: <FileUpload fontSize="small" /> },
  document_verified: { color: 'secondary', label: 'Doc Verified', icon: <Verified fontSize="small" /> },
  test_scheduled: { color: 'info', label: 'Test Scheduled', icon: <Assignment fontSize="small" /> },
  test_completed: { color: 'secondary', label: 'Test Done', icon: <CheckCircle fontSize="small" /> },
  under_review: { color: 'warning', label: 'Under Review', icon: <HourglassEmpty fontSize="small" /> },
  approved: { color: 'success', label: 'Approved', icon: <CheckCircle fontSize="small" /> },
  rejected: { color: 'error', label: 'Rejected', icon: <ThumbDown fontSize="small" /> },
  fee_pending: { color: 'warning', label: 'Fee Pending', icon: <HourglassEmpty fontSize="small" /> },
  enrolled: { color: 'success', label: 'Enrolled', icon: <School fontSize="small" /> },
  cancelled: { color: 'default', label: 'Cancelled', icon: <Cancel fontSize="small" /> },
  waitlisted: { color: 'default', label: 'Waitlisted', icon: <HourglassEmpty fontSize="small" /> },
};

const SOURCE_OPTIONS = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'online', label: 'Online' },
  { value: 'referral', label: 'Referral' },
  { value: 'lead', label: 'From Lead' },
  { value: 'campaign', label: 'Campaign' },
];

const DOC_TYPES = [
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'photo', label: 'Passport Photo' },
  { value: 'tc', label: 'Transfer Certificate' },
  { value: 'marksheet', label: 'Previous Marksheet' },
  { value: 'medical', label: 'Medical Certificate' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'other', label: 'Other' },
];

const FORM_STEPS = ['Student Info', 'Parent Info', 'Academic Info', 'Additional Info'];

const initialForm = {
  student_name: '', date_of_birth: '', gender: '', blood_group: '', religion: '', category: '',
  nationality: 'Indian', aadhar_no: '', address: '', city: '', state: '', pincode: '',
  father_name: '', father_phone: '', father_email: '', father_occupation: '', father_income: '',
  mother_name: '', mother_phone: '', mother_email: '', mother_occupation: '',
  guardian_name: '', guardian_phone: '', guardian_relation: '',
  phone: '', email: '', emergency_contact: '',
  class_applied: '', academic_year_id: '', previous_school: '', previous_class: '', previous_percentage: '', tc_number: '',
  has_sibling: false, sibling_admission_no: '', sibling_name: '',
  transport_required: false, pickup_address: '', medical_conditions: '', allergies: '', disability: '',
  application_source: 'walk_in', priority: 'normal', remarks: '',
};

export default function Admissions() {
  // State
  const [tab, setTab] = useState(0);
  const [admissions, setAdmissions] = useState({ items: [], total: 0, pages: 0 });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', class_id: '', source: '', priority: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Dialogs
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({ ...initialForm });

  const [openDetail, setOpenDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  const [openEnroll, setOpenEnroll] = useState(null);
  const [enrollForm, setEnrollForm] = useState({ admission_no: '', roll_no: '', section_id: '' });
  const [sections, setSections] = useState([]);

  const [openStatusDialog, setOpenStatusDialog] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '', rejection_reason: '' });

  const [dashboard, setDashboard] = useState(null);

  // Seat Matrix
  const [seatMatrix, setSeatMatrix] = useState([]);
  const [openSeatForm, setOpenSeatForm] = useState(false);
  const [seatForm, setSeatForm] = useState({ class_id: '', total_seats: 40, general_seats: 0, rte_seats: 0, management_seats: 0, academic_year_id: '' });

  // Tests
  const [tests, setTests] = useState([]);
  const [openTestForm, setOpenTestForm] = useState(false);
  const [testForm, setTestForm] = useState({ name: '', class_id: '', test_date: '', duration_minutes: 60, total_marks: 100, passing_marks: 40, venue: '', instructions: '' });
  const [testResults, setTestResults] = useState(null);
  const [openTestResultDialog, setOpenTestResultDialog] = useState(null);

  // TC
  const [transferCerts, setTransferCerts] = useState([]);
  const [openTCForm, setOpenTCForm] = useState(false);
  const [tcForm, setTcForm] = useState({ student_id: '', reason: 'leaving', leaving_date: '', conduct: 'Good', fee_cleared: false, library_cleared: false, remarks: '' });

  // Document upload
  const [openDocUpload, setOpenDocUpload] = useState(null);
  const [docType, setDocType] = useState('birth_certificate');

  // Action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAdmission, setMenuAdmission] = useState(null);

  // Settings
  const [settings, setSettings] = useState(null);
  const [openSettings, setOpenSettings] = useState(false);

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  // ============ DATA FETCHING ============

  const fetchAdmissions = useCallback(() => {
    setLoading(true);
    const params = {
      page: page + 1, per_page: perPage, search: search || undefined,
      status: filters.status || undefined, class_id: filters.class_id || undefined,
      source: filters.source || undefined, priority: filters.priority || undefined,
      sort: sortBy, order: sortOrder,
    };
    admissionsAPI.list(params)
      .then(res => setAdmissions(res.data.data))
      .catch(() => showSnack('Failed to load admissions', 'error'))
      .finally(() => setLoading(false));
  }, [page, perPage, search, filters, sortBy, sortOrder]);

  useEffect(() => { fetchAdmissions(); }, [fetchAdmissions]);

  useEffect(() => {
    studentsAPI.listClasses().then(res => setClasses(res.data.data || [])).catch(() => {});
    studentsAPI.listAcademicYears().then(res => setAcademicYears(res.data.data || [])).catch(() => {});
  }, []);

  const fetchDashboard = () => {
    admissionsAPI.getDashboard().then(res => setDashboard(res.data.data)).catch(() => {});
  };

  const fetchSeatMatrix = () => {
    admissionsAPI.getSeatMatrix().then(res => setSeatMatrix(res.data.data || [])).catch(() => {});
  };

  const fetchTests = () => {
    admissionsAPI.listTests().then(res => setTests(res.data.data || [])).catch(() => {});
  };

  const fetchTC = () => {
    admissionsAPI.listTC().then(res => setTransferCerts(res.data.data || [])).catch(() => {});
  };

  useEffect(() => {
    if (tab === 1) fetchDashboard();
    if (tab === 2) fetchSeatMatrix();
    if (tab === 3) fetchTests();
    if (tab === 4) fetchTC();
  }, [tab]);

  // ============ HANDLERS ============

  const handleCreate = () => {
    const api = editingId ? admissionsAPI.update(editingId, form) : admissionsAPI.create(form);
    api.then(res => {
      showSnack(res.data.message);
      setOpenForm(false);
      setEditingId(null);
      setForm({ ...initialForm });
      setActiveStep(0);
      fetchAdmissions();
    }).catch(err => showSnack(err.response?.data?.message || 'Failed', 'error'));
  };

  const handleEdit = (admission) => {
    setForm({
      student_name: admission.student_name || '', date_of_birth: admission.date_of_birth || '',
      gender: admission.gender || '', blood_group: admission.blood_group || '',
      religion: admission.religion || '', category: admission.category || '',
      nationality: admission.nationality || 'Indian', aadhar_no: admission.aadhar_no || '',
      address: admission.address || '', city: admission.city || '', state: admission.state || '', pincode: admission.pincode || '',
      father_name: admission.father_name || '', father_phone: admission.father_phone || '',
      father_email: admission.father_email || '', father_occupation: admission.father_occupation || '',
      father_income: admission.father_income || '',
      mother_name: admission.mother_name || '', mother_phone: admission.mother_phone || '',
      mother_email: admission.mother_email || '', mother_occupation: admission.mother_occupation || '',
      guardian_name: admission.guardian_name || '', guardian_phone: admission.guardian_phone || '',
      guardian_relation: admission.guardian_relation || '',
      phone: admission.phone || '', email: admission.email || '', emergency_contact: admission.emergency_contact || '',
      class_applied: admission.class_applied_id || '', academic_year_id: admission.academic_year_id || '',
      previous_school: admission.previous_school || '', previous_class: admission.previous_class || '',
      previous_percentage: admission.previous_percentage || '', tc_number: admission.tc_number || '',
      has_sibling: admission.has_sibling || false, sibling_admission_no: admission.sibling_admission_no || '',
      sibling_name: admission.sibling_name || '',
      transport_required: admission.transport_required || false, pickup_address: admission.pickup_address || '',
      medical_conditions: admission.medical_conditions || '', allergies: admission.allergies || '',
      disability: admission.disability || '',
      application_source: admission.application_source || 'walk_in', priority: admission.priority || 'normal',
      remarks: admission.remarks || '',
    });
    setEditingId(admission.id);
    setActiveStep(0);
    setOpenForm(true);
  };

  const handleViewDetail = (id) => {
    setDetailLoading(true);
    setOpenDetail(id);
    setDetailTab(0);
    admissionsAPI.get(id).then(res => setDetailData(res.data.data)).catch(() => showSnack('Failed to load details', 'error')).finally(() => setDetailLoading(false));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    admissionsAPI.delete(id).then(() => { showSnack('Deleted'); fetchAdmissions(); }).catch(e => showSnack(e.response?.data?.message || 'Failed', 'error'));
  };

  const handleStatusUpdate = () => {
    admissionsAPI.updateStatus(openStatusDialog, statusForm)
      .then(res => { showSnack(res.data.message); setOpenStatusDialog(null); fetchAdmissions(); })
      .catch(e => showSnack(e.response?.data?.message || 'Invalid transition', 'error'));
  };

  const handleEnroll = () => {
    admissionsAPI.enroll(openEnroll, enrollForm)
      .then(res => { showSnack('Student enrolled successfully!'); setOpenEnroll(null); fetchAdmissions(); })
      .catch(e => showSnack(e.response?.data?.message || 'Enrollment failed', 'error'));
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('document_type', docType);
    admissionsAPI.uploadDocument(openDocUpload, fd)
      .then(() => { showSnack('Document uploaded'); handleViewDetail(openDocUpload); setOpenDocUpload(null); })
      .catch(e => showSnack(e.response?.data?.message || 'Upload failed', 'error'));
  };

  const handleVerifyDoc = (admId, docId, verified) => {
    admissionsAPI.verifyDocument(admId, docId, { verified })
      .then(() => { showSnack(verified ? 'Document verified' : 'Document rejected'); handleViewDetail(admId); })
      .catch(() => showSnack('Failed', 'error'));
  };

  const handleSort = (col) => {
    setSortOrder(sortBy === col && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortBy(col);
  };

  // Seat matrix
  const handleCreateSeat = () => {
    admissionsAPI.createSeatMatrix(seatForm)
      .then(() => { showSnack('Seat matrix created'); setOpenSeatForm(false); fetchSeatMatrix(); })
      .catch(e => showSnack(e.response?.data?.message || 'Failed', 'error'));
  };

  // Tests
  const handleCreateTest = () => {
    admissionsAPI.createTest(testForm)
      .then(() => { showSnack('Test created'); setOpenTestForm(false); fetchTests(); })
      .catch(e => showSnack(e.response?.data?.message || 'Failed', 'error'));
  };

  // TC
  const handleCreateTC = () => {
    admissionsAPI.generateTC(tcForm)
      .then(() => { showSnack('TC generated'); setOpenTCForm(false); fetchTC(); })
      .catch(e => showSnack(e.response?.data?.message || 'Failed', 'error'));
  };

  const handleApproveTC = (id) => {
    admissionsAPI.approveTC(id).then(() => { showSnack('TC approved'); fetchTC(); }).catch(() => showSnack('Failed', 'error'));
  };

  const loadSections = (classId) => {
    const cls = classes.find(c => c.id === classId);
    setSections(cls?.sections || []);
  };

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // ============ RENDER HELPERS ============

  const renderStatusChip = (status) => {
    const cfg = STATUS_CONFIG[status] || { color: 'default', label: status };
    return <Chip icon={cfg.icon} label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ flex: 1, minWidth: 150, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 } }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>{icon}</Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">{value ?? '-'}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // ============ STEPPER FORM CONTENT ============

  const renderFormStep = () => {
    switch (activeStep) {
      case 0: return (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth required label="Student Name" value={form.student_name} onChange={e => f('student_name', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="date" label="Date of Birth" value={form.date_of_birth} onChange={e => f('date_of_birth', e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth><InputLabel>Gender</InputLabel>
              <Select value={form.gender} label="Gender" onChange={e => f('gender', e.target.value)}>
                <MenuItem value="male">Male</MenuItem><MenuItem value="female">Female</MenuItem><MenuItem value="other">Other</MenuItem>
              </Select></FormControl>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Blood Group" value={form.blood_group} onChange={e => f('blood_group', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Religion" value={form.religion} onChange={e => f('religion', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth><InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category" onChange={e => f('category', e.target.value)}>
                {['general', 'obc', 'sc', 'st', 'ews'].map(c => <MenuItem key={c} value={c}>{c.toUpperCase()}</MenuItem>)}
              </Select></FormControl>
          </Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Aadhaar No" value={form.aadhar_no} onChange={e => f('aadhar_no', e.target.value)} inputProps={{ maxLength: 12 }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={form.address} onChange={e => f('address', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="City" value={form.city} onChange={e => f('city', e.target.value)} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="State" value={form.state} onChange={e => f('state', e.target.value)} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Pincode" value={form.pincode} onChange={e => f('pincode', e.target.value)} /></Grid>
        </Grid>
      );
      case 1: return (
        <Grid container spacing={2}>
          <Grid item xs={12}><Typography variant="subtitle2" color="primary">Father's Details</Typography></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Father's Name" value={form.father_name} onChange={e => f('father_name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Father's Phone" value={form.father_phone} onChange={e => f('father_phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Father's Email" value={form.father_email} onChange={e => f('father_email', e.target.value)} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Occupation" value={form.father_occupation} onChange={e => f('father_occupation', e.target.value)} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Annual Income" value={form.father_income} onChange={e => f('father_income', e.target.value)} /></Grid>
          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Mother's Details</Typography></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Mother's Name" value={form.mother_name} onChange={e => f('mother_name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Mother's Phone" value={form.mother_phone} onChange={e => f('mother_phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Mother's Email" value={form.mother_email} onChange={e => f('mother_email', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Occupation" value={form.mother_occupation} onChange={e => f('mother_occupation', e.target.value)} /></Grid>
          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Guardian (if applicable)</Typography></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Guardian Name" value={form.guardian_name} onChange={e => f('guardian_name', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Guardian Phone" value={form.guardian_phone} onChange={e => f('guardian_phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Relation" value={form.guardian_relation} onChange={e => f('guardian_relation', e.target.value)} /></Grid>
          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Contact</Typography></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Primary Phone" value={form.phone} onChange={e => f('phone', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Primary Email" value={form.email} onChange={e => f('email', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Emergency Contact" value={form.emergency_contact} onChange={e => f('emergency_contact', e.target.value)} /></Grid>
        </Grid>
      );
      case 2: return (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl fullWidth><InputLabel>Class Applied For *</InputLabel>
              <Select value={form.class_applied} label="Class Applied For *" onChange={e => f('class_applied', e.target.value)}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select></FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth><InputLabel>Academic Year</InputLabel>
              <Select value={form.academic_year_id} label="Academic Year" onChange={e => f('academic_year_id', e.target.value)}>
                {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </Select></FormControl>
          </Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Previous School" value={form.previous_school} onChange={e => f('previous_school', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Previous Class" value={form.previous_class} onChange={e => f('previous_class', e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth label="Previous %" type="number" value={form.previous_percentage} onChange={e => f('previous_percentage', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="TC Number" value={form.tc_number} onChange={e => f('tc_number', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel control={<Switch checked={form.has_sibling} onChange={e => f('has_sibling', e.target.checked)} />} label="Has Sibling in School?" />
          </Grid>
          {form.has_sibling && <>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Sibling Name" value={form.sibling_name} onChange={e => f('sibling_name', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Sibling Admission No" value={form.sibling_admission_no} onChange={e => f('sibling_admission_no', e.target.value)} /></Grid>
          </>}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth><InputLabel>Application Source</InputLabel>
              <Select value={form.application_source} label="Application Source" onChange={e => f('application_source', e.target.value)}>
                {SOURCE_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select></FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth><InputLabel>Priority</InputLabel>
              <Select value={form.priority} label="Priority" onChange={e => f('priority', e.target.value)}>
                <MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem><MenuItem value="urgent">Urgent</MenuItem>
              </Select></FormControl>
          </Grid>
        </Grid>
      );
      case 3: return (
        <Grid container spacing={2}>
          <Grid item xs={12}><Typography variant="subtitle2" color="primary">Transport</Typography></Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel control={<Switch checked={form.transport_required} onChange={e => f('transport_required', e.target.checked)} />} label="Transport Required?" />
          </Grid>
          {form.transport_required && <Grid item xs={12} sm={8}><TextField fullWidth label="Pickup Address" value={form.pickup_address} onChange={e => f('pickup_address', e.target.value)} /></Grid>}
          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Medical</Typography></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Medical Conditions" multiline rows={2} value={form.medical_conditions} onChange={e => f('medical_conditions', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Allergies" multiline rows={2} value={form.allergies} onChange={e => f('allergies', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Disability (if any)" value={form.disability} onChange={e => f('disability', e.target.value)} /></Grid>
          <Grid item xs={12}><Divider /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Remarks / Notes" multiline rows={3} value={form.remarks} onChange={e => f('remarks', e.target.value)} /></Grid>
        </Grid>
      );
      default: return null;
    }
  };

  // ============ MAIN TAB VIEWS ============

  const renderApplicationsList = () => (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField size="small" placeholder="Search name, phone, app no..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: { xs: '100%', sm: 280 } }} />
          <FormControl size="small" sx={{ minWidth: { xs: '45%', sm: 140 } }}>
            <InputLabel>Status</InputLabel>
            <Select value={filters.status} label="Status" onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(0); }}>
              <MenuItem value="">All Status</MenuItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Class</InputLabel>
            <Select value={filters.class_id} label="Class" onChange={e => { setFilters(p => ({ ...p, class_id: e.target.value })); setPage(0); }}>
              <MenuItem value="">All Classes</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Source</InputLabel>
            <Select value={filters.source} label="Source" onChange={e => { setFilters(p => ({ ...p, source: e.target.value })); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {SOURCE_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Button size="small" onClick={() => { setFilters({ status: '', class_id: '', source: '', priority: '' }); setSearch(''); setPage(0); }}>Clear</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ ...initialForm }); setEditingId(null); setActiveStep(0); setOpenForm(true); }}>
            New Application
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      {loading && <LinearProgress sx={{ mb: 1 }} />}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.50' } }}>
              <TableCell><TableSortLabel active={sortBy === 'application_no'} direction={sortOrder} onClick={() => handleSort('application_no')}>App No</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={sortBy === 'student_name'} direction={sortOrder} onClick={() => handleSort('student_name')}>Student Name</TableSortLabel></TableCell>
              <TableCell>Father</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Source</TableCell>
              <TableCell><TableSortLabel active={sortBy === 'application_date'} direction={sortOrder} onClick={() => handleSort('application_date')}>Date</TableSortLabel></TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admissions.items?.map(a => (
              <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(a.id)}>
                <TableCell><Typography variant="body2" fontWeight="bold" color="primary">{a.application_no || '-'}</Typography></TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 30, height: 30, fontSize: 14, bgcolor: a.gender === 'female' ? 'pink' : 'lightblue' }}>
                      {a.student_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="500">{a.student_name}</Typography>
                      {a.has_sibling && <Chip label="Sibling" size="small" sx={{ height: 16, fontSize: 10 }} color="info" />}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2">{a.father_name || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{a.phone || '-'}</Typography></TableCell>
                <TableCell><Typography variant="body2">{a.class_applied?.name || '-'}</Typography></TableCell>
                <TableCell><Chip label={a.application_source || '-'} size="small" variant="outlined" /></TableCell>
                <TableCell><Typography variant="body2">{a.application_date || '-'}</Typography></TableCell>
                <TableCell>{renderStatusChip(a.status)}</TableCell>
                <TableCell align="center" onClick={e => e.stopPropagation()}>
                  <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setMenuAdmission(a); }}><MoreVert fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && admissions.items?.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No applications found</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={admissions.total || 0} page={page} onPageChange={(e, p) => setPage(p)}
          rowsPerPage={perPage} onRowsPerPageChange={e => { setPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]} />
      </TableContainer>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { handleViewDetail(menuAdmission?.id); setAnchorEl(null); }}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon><ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEdit(menuAdmission); setAnchorEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon><ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setOpenDocUpload(menuAdmission?.id); setAnchorEl(null); }}>
          <ListItemIcon><Upload fontSize="small" /></ListItemIcon><ListItemText>Upload Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setStatusForm({ status: '', remarks: '', rejection_reason: '' }); setOpenStatusDialog(menuAdmission?.id); setAnchorEl(null); }}>
          <ListItemIcon><ArrowForward fontSize="small" /></ListItemIcon><ListItemText>Change Status</ListItemText>
        </MenuItem>
        {menuAdmission?.status === 'approved' && (
          <MenuItem onClick={() => { setOpenEnroll(menuAdmission?.id); loadSections(menuAdmission?.class_applied_id); setAnchorEl(null); }}>
            <ListItemIcon><School fontSize="small" /></ListItemIcon><ListItemText>Enroll Student</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { handleDelete(menuAdmission?.id); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );

  const renderDashboard = () => {
    if (!dashboard) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
    const d = dashboard;
    return (
      <Box>
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <StatCard title="Total Applications" value={d.total_applications} icon={<Description />} color="primary" />
          <StatCard title="Enrolled" value={d.enrolled_count} icon={<School />} color="success" />
          <StatCard title="Pending" value={d.pending_count} icon={<HourglassEmpty />} color="warning" />
          <StatCard title="Rejected" value={d.rejected_count} icon={<ThumbDown />} color="error" />
          <StatCard title="Waitlisted" value={d.waitlisted_count} icon={<EventSeat />} />
          <StatCard title="Conversion Rate" value={`${d.conversion_rate}%`} icon={<TrendingUp />} color="success" />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>By Status</Typography>
              {d.by_status && Object.entries(d.by_status).map(([status, count]) => (
                <Box key={status} display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                  {renderStatusChip(status)}
                  <Typography fontWeight="bold">{count}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>By Source</Typography>
              {d.by_source && Object.entries(d.by_source).map(([source, count]) => (
                <Box key={source} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2" textTransform="capitalize">{source.replace('_', ' ')}</Typography>
                  <Chip label={count} size="small" />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>By Class</Typography>
              {d.by_class && Object.entries(d.by_class).map(([cls, count]) => (
                <Box key={cls} display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="body2">{cls}</Typography>
                  <Chip label={count} size="small" color="primary" />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>Recent Applications</Typography>
              {d.recent_applications?.slice(0, 5).map(a => (
                <Box key={a.id} display="flex" justifyContent="space-between" alignItems="center" py={0.5} sx={{ cursor: 'pointer' }} onClick={() => handleViewDetail(a.id)}>
                  <Box>
                    <Typography variant="body2" fontWeight="500">{a.student_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.application_no}</Typography>
                  </Box>
                  {renderStatusChip(a.status)}
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderSeatMatrix = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6">Seat Matrix</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenSeatForm(true)}>Add Seat Configuration</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.50' } }}>
              <TableCell>Class</TableCell><TableCell>Section</TableCell><TableCell align="center">Total</TableCell>
              <TableCell align="center">General</TableCell><TableCell align="center">RTE</TableCell>
              <TableCell align="center">Mgmt</TableCell><TableCell align="center">Filled</TableCell>
              <TableCell align="center">Available</TableCell><TableCell align="center">Waitlist</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seatMatrix.map(s => (
              <TableRow key={s.id} hover>
                <TableCell>{s.class?.name || '-'}</TableCell>
                <TableCell>{s.section?.name || 'All'}</TableCell>
                <TableCell align="center"><strong>{s.total_seats}</strong></TableCell>
                <TableCell align="center">{s.general_seats}</TableCell>
                <TableCell align="center">{s.rte_seats}</TableCell>
                <TableCell align="center">{s.management_seats}</TableCell>
                <TableCell align="center"><Chip label={s.filled_seats} size="small" color="primary" /></TableCell>
                <TableCell align="center">
                  <Chip label={s.available_seats} size="small" color={s.available_seats > 0 ? 'success' : 'error'} />
                </TableCell>
                <TableCell align="center">{s.waitlist_count || 0}</TableCell>
              </TableRow>
            ))}
            {seatMatrix.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}>No seat configuration found. Add one to track availability.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderTests = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6">Entrance Tests</Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setOpenTestForm(true)}>Create Test</Button>
      </Box>
      <Grid container spacing={2}>
        {tests.map(t => (
          <Grid item xs={12} md={6} lg={4} key={t.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">{t.name}</Typography>
                <Typography variant="body2" color="text.secondary">{t.class?.name || 'All classes'}</Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Date: {t.test_date ? new Date(t.test_date).toLocaleDateString() : 'TBD'}</Typography>
                  <Chip label={t.status} size="small" color={t.status === 'completed' ? 'success' : t.status === 'scheduled' ? 'info' : 'default'} />
                </Box>
                <Box display="flex" gap={2} mt={1}>
                  <Typography variant="body2">Total: {t.total_marks}</Typography>
                  <Typography variant="body2">Pass: {t.passing_marks}</Typography>
                  <Typography variant="body2">Duration: {t.duration_minutes}m</Typography>
                </Box>
                <Typography variant="body2" mt={1}>Applicants: {t.applicant_count}</Typography>
                {t.venue && <Typography variant="body2" color="text.secondary">Venue: {t.venue}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
        {tests.length === 0 && <Grid item xs={12}><Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No entrance tests created.</Typography></Paper></Grid>}
      </Grid>
    </Box>
  );

  const renderTC = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Transfer Certificates</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenTCForm(true)}>Generate TC</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: 'grey.50' } }}>
              <TableCell>TC No</TableCell><TableCell>Student</TableCell><TableCell>Adm No</TableCell>
              <TableCell>Issue Date</TableCell><TableCell>Reason</TableCell><TableCell>Conduct</TableCell>
              <TableCell>Fee Cleared</TableCell><TableCell>Approved</TableCell><TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transferCerts.map(tc => (
              <TableRow key={tc.id} hover>
                <TableCell><strong>{tc.tc_number}</strong></TableCell>
                <TableCell>{tc.student_name}</TableCell>
                <TableCell>{tc.admission_no || '-'}</TableCell>
                <TableCell>{tc.issue_date}</TableCell>
                <TableCell><Chip label={tc.reason} size="small" /></TableCell>
                <TableCell>{tc.conduct}</TableCell>
                <TableCell>{tc.fee_cleared ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="error" fontSize="small" />}</TableCell>
                <TableCell>{tc.approved ? <Chip label="Approved" size="small" color="success" /> : <Chip label="Pending" size="small" color="warning" />}</TableCell>
                <TableCell>
                  {!tc.approved && <Button size="small" onClick={() => handleApproveTC(tc.id)}>Approve</Button>}
                </TableCell>
              </TableRow>
            ))}
            {transferCerts.length === 0 && <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}>No transfer certificates.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  // ============ DETAIL DIALOG ============

  const renderDetailDialog = () => {
    if (!detailData) return null;
    const d = detailData;
    return (
      <Dialog open={!!openDetail} onClose={() => { setOpenDetail(null); setDetailData(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{d.student_name}</Typography>
            <Typography variant="caption" color="text.secondary">Application: {d.application_no}</Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            {renderStatusChip(d.status)}
            <IconButton onClick={() => { setOpenDetail(null); setDetailData(null); }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? <Box textAlign="center" py={3}><CircularProgress /></Box> : (
            <>
              <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ mb: 2 }}>
                <Tab label="Student Info" /><Tab label="Parent Info" /><Tab label="Academic" />
                <Tab label={`Documents (${d.documents?.length || 0})`} /><Tab label="History" />
              </Tabs>

              {detailTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{d.student_name}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">DOB</Typography><Typography>{d.date_of_birth || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Gender</Typography><Typography sx={{ textTransform: 'capitalize' }}>{d.gender || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Blood Group</Typography><Typography>{d.blood_group || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Category</Typography><Typography sx={{ textTransform: 'uppercase' }}>{d.category || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Aadhaar</Typography><Typography>{d.aadhar_no || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{d.phone || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{d.email || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Religion</Typography><Typography>{d.religion || '-'}</Typography></Grid>
                  <Grid item xs={12}><Typography variant="caption" color="text.secondary">Address</Typography><Typography>{[d.address, d.city, d.state, d.pincode].filter(Boolean).join(', ') || '-'}</Typography></Grid>
                  {d.medical_conditions && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Medical</Typography><Typography>{d.medical_conditions}</Typography></Grid>}
                  {d.allergies && <Grid item xs={6}><Typography variant="caption" color="text.secondary">Allergies</Typography><Typography>{d.allergies}</Typography></Grid>}
                </Grid>
              )}

              {detailTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}><Typography variant="subtitle2" color="primary">Father</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{d.father_name || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{d.father_phone || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{d.father_email || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Occupation</Typography><Typography>{d.father_occupation || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Income</Typography><Typography>{d.father_income || '-'}</Typography></Grid>
                  <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Mother</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{d.mother_name || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{d.mother_phone || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Email</Typography><Typography>{d.mother_email || '-'}</Typography></Grid>
                  {d.guardian_name && <>
                    <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Guardian</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{d.guardian_name}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography>{d.guardian_phone || '-'}</Typography></Grid>
                    <Grid item xs={6} sm={4}><Typography variant="caption" color="text.secondary">Relation</Typography><Typography>{d.guardian_relation || '-'}</Typography></Grid>
                  </>}
                </Grid>
              )}

              {detailTab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Class Applied</Typography><Typography>{d.class_applied?.name || '-'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Academic Year</Typography><Typography>{d.academic_year?.name || '-'}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Previous School</Typography><Typography>{d.previous_school || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Previous Class</Typography><Typography>{d.previous_class || '-'}</Typography></Grid>
                  <Grid item xs={6} sm={3}><Typography variant="caption" color="text.secondary">Previous %</Typography><Typography>{d.previous_percentage || '-'}%</Typography></Grid>
                  {d.test_score != null && <>
                    <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Entrance Test</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Score</Typography><Typography fontWeight="bold">{d.test_score}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Result</Typography><Typography>{d.test_result}</Typography></Grid>
                    <Grid item xs={4}><Typography variant="caption" color="text.secondary">Merit Rank</Typography><Typography fontWeight="bold">#{d.merit_rank || '-'}</Typography></Grid>
                  </>}
                  {d.has_sibling && <>
                    <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" sx={{ mt: 1 }}>Sibling</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography>{d.sibling_name}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="caption" color="text.secondary">Admission No</Typography><Typography>{d.sibling_admission_no}</Typography></Grid>
                  </>}
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Source</Typography><Typography sx={{ textTransform: 'capitalize' }}>{(d.application_source || '').replace('_', ' ')}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="caption" color="text.secondary">Priority</Typography><Typography sx={{ textTransform: 'capitalize' }}>{d.priority}</Typography></Grid>
                  {d.remarks && <Grid item xs={12}><Typography variant="caption" color="text.secondary">Remarks</Typography><Typography>{d.remarks}</Typography></Grid>}
                </Grid>
              )}

              {detailTab === 3 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle2">Uploaded Documents</Typography>
                    <Button size="small" startIcon={<Upload />} onClick={() => setOpenDocUpload(d.id)}>Upload</Button>
                  </Box>
                  {d.documents?.length > 0 ? (
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Name</TableCell><TableCell>Verified</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                      <TableBody>
                        {d.documents.map(doc => (
                          <TableRow key={doc.id}>
                            <TableCell><Chip label={doc.document_type.replace('_', ' ')} size="small" sx={{ textTransform: 'capitalize' }} /></TableCell>
                            <TableCell>{doc.document_name}</TableCell>
                            <TableCell>{doc.verified ? <Chip label="Verified" size="small" color="success" icon={<Verified />} /> : <Chip label="Pending" size="small" color="warning" />}</TableCell>
                            <TableCell>
                              {!doc.verified && <>
                                <Button size="small" color="success" onClick={() => handleVerifyDoc(d.id, doc.id, true)}>Verify</Button>
                                <Button size="small" color="error" onClick={() => handleVerifyDoc(d.id, doc.id, false)}>Reject</Button>
                              </>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={2}>No documents uploaded yet</Typography>
                  )}
                </Box>
              )}

              {detailTab === 4 && (
                <Box>
                  <Typography variant="subtitle2" mb={2}>Status Change History</Typography>
                  {d.status_history?.length > 0 ? d.status_history.map((h, i) => (
                    <Box key={h.id} display="flex" gap={2} mb={1.5} alignItems="flex-start">
                      <Timeline color="primary" fontSize="small" sx={{ mt: 0.5 }} />
                      <Box>
                        <Box display="flex" gap={1} alignItems="center">
                          {h.from_status && <Chip label={h.from_status} size="small" variant="outlined" />}
                          {h.from_status && <ArrowForward fontSize="small" color="action" />}
                          {renderStatusChip(h.to_status)}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {h.changed_by} &bull; {new Date(h.created_at).toLocaleString()}
                          {h.remarks && ` — ${h.remarks}`}
                        </Typography>
                      </Box>
                    </Box>
                  )) : <Typography color="text.secondary">No history yet</Typography>}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { handleEdit(d); setOpenDetail(null); }} startIcon={<Edit />}>Edit</Button>
          {d.status === 'approved' && <Button variant="contained" color="success" startIcon={<School />}
            onClick={() => { setOpenEnroll(d.id); loadSections(d.class_applied_id); setOpenDetail(null); }}>Enroll</Button>}
          <Button onClick={() => { setOpenDetail(null); setDetailData(null); }}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // ============ MAIN RENDER ============

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Admission Management</Typography>
      </Box>        

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<Description />} iconPosition="start" label="Applications" />
        <Tab icon={<TrendingUp />} iconPosition="start" label="Dashboard" />
        <Tab icon={<EventSeat />} iconPosition="start" label="Seat Matrix" />
        <Tab icon={<Assignment />} iconPosition="start" label="Entrance Tests" />
        <Tab icon={<Print />} iconPosition="start" label="Transfer Certificates" />
      </Tabs>

      {tab === 0 && renderApplicationsList()}
      {tab === 1 && renderDashboard()}
      {tab === 2 && renderSeatMatrix()}
      {tab === 3 && renderTests()}
      {tab === 4 && renderTC()}

      {/* ========== CREATE / EDIT FORM ========== */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Edit Application' : 'New Admission Application'}</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ my: 2 }}>
            {FORM_STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          <Box sx={{ mt: 2 }}>{renderFormStep()}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          {activeStep > 0 && <Button onClick={() => setActiveStep(s => s - 1)}>Back</Button>}
          {activeStep < FORM_STEPS.length - 1 ? (
            <Button variant="contained" onClick={() => setActiveStep(s => s + 1)}>Next</Button>
          ) : (
            <Button variant="contained" color="success" onClick={handleCreate}>{editingId ? 'Update' : 'Submit Application'}</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ========== ENROLL DIALOG ========== */}
      <Dialog open={!!openEnroll} onClose={() => setOpenEnroll(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Enroll Student</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Admission Number *" value={enrollForm.admission_no} onChange={e => setEnrollForm(p => ({ ...p, admission_no: e.target.value }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Roll Number" value={enrollForm.roll_no} onChange={e => setEnrollForm(p => ({ ...p, roll_no: e.target.value }))} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Section</InputLabel>
                <Select value={enrollForm.section_id} label="Section" onChange={e => setEnrollForm(p => ({ ...p, section_id: e.target.value }))}>
                  {sections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select></FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEnroll(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleEnroll} startIcon={<School />}>Enroll</Button>
        </DialogActions>
      </Dialog>

      {/* ========== STATUS CHANGE ========== */}
      <Dialog open={!!openStatusDialog} onClose={() => setOpenStatusDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Application Status</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>New Status</InputLabel>
                <Select value={statusForm.status} label="New Status" onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select></FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Remarks" value={statusForm.remarks} onChange={e => setStatusForm(p => ({ ...p, remarks: e.target.value }))} /></Grid>
            {statusForm.status === 'rejected' && (
              <Grid item xs={12}><TextField fullWidth label="Rejection Reason" value={statusForm.rejection_reason} onChange={e => setStatusForm(p => ({ ...p, rejection_reason: e.target.value }))} /></Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate}>Update Status</Button>
        </DialogActions>
      </Dialog>

      {/* ========== DOCUMENT UPLOAD ========== */}
      <Dialog open={!!openDocUpload} onClose={() => setOpenDocUpload(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}><InputLabel>Document Type</InputLabel>
            <Select value={docType} label="Document Type" onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </Select></FormControl>
          <Button variant="outlined" component="label" fullWidth startIcon={<Upload />}>
            Choose File <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocUpload} />
          </Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenDocUpload(null)}>Cancel</Button></DialogActions>
      </Dialog>

      {/* ========== SEAT MATRIX FORM ========== */}
      <Dialog open={openSeatForm} onClose={() => setOpenSeatForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Seat Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Class *</InputLabel>
                <Select value={seatForm.class_id} label="Class *" onChange={e => setSeatForm(p => ({ ...p, class_id: e.target.value }))}>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select></FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth><InputLabel>Academic Year *</InputLabel>
                <Select value={seatForm.academic_year_id} label="Academic Year *" onChange={e => setSeatForm(p => ({ ...p, academic_year_id: e.target.value }))}>
                  {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
                </Select></FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Total Seats" value={seatForm.total_seats} onChange={e => setSeatForm(p => ({ ...p, total_seats: parseInt(e.target.value) || 0 }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="General Seats" value={seatForm.general_seats} onChange={e => setSeatForm(p => ({ ...p, general_seats: parseInt(e.target.value) || 0 }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="RTE Seats" value={seatForm.rte_seats} onChange={e => setSeatForm(p => ({ ...p, rte_seats: parseInt(e.target.value) || 0 }))} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Management Seats" value={seatForm.management_seats} onChange={e => setSeatForm(p => ({ ...p, management_seats: parseInt(e.target.value) || 0 }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSeatForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSeat}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* ========== TEST FORM ========== */}
      <Dialog open={openTestForm} onClose={() => setOpenTestForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Entrance Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}><TextField fullWidth required label="Test Name" value={testForm.name} onChange={e => setTestForm(p => ({ ...p, name: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth><InputLabel>Class</InputLabel>
                <Select value={testForm.class_id} label="Class" onChange={e => setTestForm(p => ({ ...p, class_id: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select></FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="datetime-local" label="Test Date/Time" value={testForm.test_date}
              onChange={e => setTestForm(p => ({ ...p, test_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Duration (min)" value={testForm.duration_minutes}
              onChange={e => setTestForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Total Marks" value={testForm.total_marks}
              onChange={e => setTestForm(p => ({ ...p, total_marks: parseInt(e.target.value) || 100 }))} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth type="number" label="Passing Marks" value={testForm.passing_marks}
              onChange={e => setTestForm(p => ({ ...p, passing_marks: parseInt(e.target.value) || 40 }))} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Venue" value={testForm.venue} onChange={e => setTestForm(p => ({ ...p, venue: e.target.value }))} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Instructions" value={testForm.instructions}
              onChange={e => setTestForm(p => ({ ...p, instructions: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTest}>Create Test</Button>
        </DialogActions>
      </Dialog>

      {/* ========== TC FORM ========== */}
      <Dialog open={openTCForm} onClose={() => setOpenTCForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Transfer Certificate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Student ID *" value={tcForm.student_id} onChange={e => setTcForm(p => ({ ...p, student_id: e.target.value }))} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Reason</InputLabel>
                <Select value={tcForm.reason} label="Reason" onChange={e => setTcForm(p => ({ ...p, reason: e.target.value }))}>
                  <MenuItem value="transfer">Transfer</MenuItem><MenuItem value="leaving">Leaving</MenuItem>
                  <MenuItem value="graduated">Graduated</MenuItem><MenuItem value="other">Other</MenuItem>
                </Select></FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Leaving Date" value={tcForm.leaving_date}
              onChange={e => setTcForm(p => ({ ...p, leaving_date: e.target.value }))} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Conduct" value={tcForm.conduct} onChange={e => setTcForm(p => ({ ...p, conduct: e.target.value }))} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={tcForm.fee_cleared} onChange={e => setTcForm(p => ({ ...p, fee_cleared: e.target.checked }))} />} label="Fee Cleared" /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={tcForm.library_cleared} onChange={e => setTcForm(p => ({ ...p, library_cleared: e.target.checked }))} />} label="Library Cleared" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Remarks" value={tcForm.remarks} onChange={e => setTcForm(p => ({ ...p, remarks: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTCForm(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTC}>Generate TC</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      {renderDetailDialog()}

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
