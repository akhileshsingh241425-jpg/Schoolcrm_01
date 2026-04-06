import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Button, TextField,
  MenuItem, Chip, IconButton, Avatar, Card, CardContent, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment, Tooltip,
  LinearProgress, Divider, Alert, FormControl, InputLabel, Select,
  List, ListItem, ListItemAvatar, ListItemText, Badge, useTheme, alpha
} from '@mui/material';
import {
  Add, Search, Visibility, Edit, Delete, School, People, TrendingUp,
  EmojiEvents, FilterList, FileDownload, Upload, Badge as BadgeIcon,
  SwapVert, Groups, PersonSearch, Psychology, MedicalServices, Timeline,
  Star, Warning, CheckCircle, Cancel
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { studentsAPI } from '../../services/api';

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

const statusColors = { active: 'success', inactive: 'default', graduated: 'info', transferred: 'warning', dropout: 'error' };

// ==================== TAB 0: STUDENT LIST ====================
function StudentList({ navigate }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState({ search: '', class_id: '', section_id: '', status: '', gender: '' });
  const [loading, setLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, per_page: rowsPerPage };
      if (filters.search) params.search = filters.search;
      if (filters.class_id) params.class_id = filters.class_id;
      if (filters.section_id) params.section_id = filters.section_id;
      if (filters.status) params.status = filters.status;
      if (filters.gender) params.gender = filters.gender;
      const res = await studentsAPI.list(params);
      setStudents(res.data.data?.items || res.data.data || []);
      setTotal(res.data.data?.total || 0);
    } catch { toast.error('Failed to load students'); }
    setLoading(false);
  }, [page, rowsPerPage, filters]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {});
  }, []);

  const selectedClass = classes.find(c => c.id === filters.class_id);

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    try {
      await studentsAPI.delete(id);
      toast.success('Student deactivated');
      fetchStudents();
    } catch { toast.error('Failed'); }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth size="small" placeholder="Search name, adm no, roll..."
              value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField fullWidth size="small" select label="Class" value={filters.class_id}
              onChange={e => setFilters({ ...filters, class_id: e.target.value, section_id: '' })}>
              <MenuItem value="">All</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField fullWidth size="small" select label="Section" value={filters.section_id}
              onChange={e => setFilters({ ...filters, section_id: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              {(selectedClass?.sections || []).map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField fullWidth size="small" select label="Status" value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              {['active', 'inactive', 'graduated', 'transferred', 'dropout'].map(s =>
                <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField fullWidth size="small" select label="Gender" value={filters.gender}
              onChange={e => setFilters({ ...filters, gender: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={1}>
            <Button size="small" onClick={() => setFilters({ search: '', class_id: '', section_id: '', status: '', gender: '' })}>Clear</Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 1 }} />}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['', 'Adm No', 'Name', 'Class', 'Section', 'Roll', 'Gender', 'Status', 'Actions'].map(h =>
                <TableCell key={h}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center">No students found</TableCell></TableRow>
            ) : students.map(s => (
              <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
                <TableCell>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: s.gender === 'female' ? 'secondary.main' : 'primary.main', fontSize: 14 }}>
                    {s.first_name?.[0]}{s.last_name?.[0]}
                  </Avatar>
                </TableCell>
                <TableCell>{s.admission_no || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{s.full_name || `${s.first_name} ${s.last_name || ''}`}</TableCell>
                <TableCell>{s.current_class?.name || '-'}</TableCell>
                <TableCell>{s.current_section?.name || '-'}</TableCell>
                <TableCell>{s.roll_no || '-'}</TableCell>
                <TableCell>{s.gender || '-'}</TableCell>
                <TableCell><Chip label={s.status || 'active'} color={statusColors[s.status] || 'default'} size="small" /></TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Tooltip title="View"><IconButton size="small" onClick={() => navigate(`/students/${s.id}`)}><Visibility /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/students/${s.id}/edit`)}><Edit /></IconButton></Tooltip>
                  <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => handleDelete(s.id)}><Delete /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>
    </Box>
  );
}

// ==================== TAB 1: DASHBOARD ====================
function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsAPI.dashboard().then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (!data) return <Alert severity="error">Failed to load dashboard</Alert>;

  const theme = useTheme();
  const P = theme.palette.primary.main;

  const genderData = {
    labels: ['Male', 'Female'],
    datasets: [{ data: [data.male, data.female], backgroundColor: [P, '#ec4899'] }]
  };

  const statusData = {
    labels: ['Active', 'Inactive', 'Graduated', 'Transferred'],
    datasets: [{ data: [data.active, data.inactive, data.graduated, data.transferred], backgroundColor: ['#10b981', '#94a3b8', '#3b82f6', '#f59e0b'] }]
  };

  const classData = {
    labels: (data.class_distribution || []).map(c => c.class),
    datasets: [{ label: 'Students', data: (data.class_distribution || []).map(c => c.count), backgroundColor: P, borderRadius: 6 }]
  };

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Students', value: data.total, icon: <People />, color: P },
          { label: 'Active', value: data.active, icon: <CheckCircle />, color: '#10b981' },
          { label: 'Graduated', value: data.graduated, icon: <School />, color: '#3b82f6' },
          { label: 'Transferred', value: data.transferred, icon: <SwapVert />, color: '#f59e0b' },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha(stat.color, 0.25)}` } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: alpha(stat.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1, color: stat.color }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value || 0}</Typography>
                <Typography color="text.secondary" variant="body2">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Gender Distribution</Typography>
            <Box sx={{ height: 250 }}><Pie data={genderData} options={{ maintainAspectRatio: false }} /></Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Status Distribution</Typography>
            <Box sx={{ height: 250 }}><Pie data={statusData} options={{ maintainAspectRatio: false }} /></Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Class Wise</Typography>
            <Box sx={{ height: 250 }}><Bar data={classData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }} /></Box>
          </Paper>
        </Grid>
      </Grid>

      {/* House Distribution */}
      {data.house_distribution?.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>House Distribution</Typography>
          <Grid container spacing={2}>
            {data.house_distribution.map(h => (
              <Grid item xs={6} sm={3} key={h.house}>
                <Card variant="outlined"><CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>{h.count}</Typography>
                  <Typography color="text.secondary">{h.house}</Typography>
                </CardContent></Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom><EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />Recent Achievements</Typography>
            {(data.recent_achievements || []).length === 0 ? <Typography color="text.secondary">No achievements yet</Typography> :
              <List dense>
                {data.recent_achievements.map(a => (
                  <ListItem key={a.id}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: 'warning.main' }}><Star /></Avatar></ListItemAvatar>
                    <ListItemText primary={a.title} secondary={`${a.category} - ${a.level} level`} />
                  </ListItem>
                ))}
              </List>
            }
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom><Warning sx={{ mr: 1, verticalAlign: 'middle', color: 'error.main' }} />Recent Behavior Issues</Typography>
            {(data.recent_behavior || []).length === 0 ? <Typography color="text.secondary">No issues</Typography> :
              <List dense>
                {data.recent_behavior.map(b => (
                  <ListItem key={b.id}>
                    <ListItemAvatar><Avatar sx={{ bgcolor: 'error.main' }}><Warning /></Avatar></ListItemAvatar>
                    <ListItemText primary={b.title} secondary={`Points: -${b.points}`} />
                  </ListItem>
                ))}
              </List>
            }
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// ==================== TAB 2: PROMOTIONS ====================
function Promotions() {
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    from_class_id: '', to_class_id: '', from_academic_year_id: '', to_academic_year_id: '', promotion_type: 'promoted'
  });

  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data.data || []));
    studentsAPI.listAcademicYears().then(r => setAcademicYears(r.data.data || []));
    studentsAPI.listPromotions({}).then(r => setPromotions(r.data.data?.items || r.data.data || [])).catch(() => {});
  }, []);

  const handleBulkPromote = async () => {
    if (!bulkForm.from_class_id || !bulkForm.to_class_id || !bulkForm.from_academic_year_id || !bulkForm.to_academic_year_id) {
      toast.error('Fill all fields'); return;
    }
    setLoading(true);
    try {
      const res = await studentsAPI.bulkPromote(bulkForm);
      toast.success(res.data.message || 'Students promoted');
      setBulkOpen(false);
      studentsAPI.listPromotions({}).then(r => setPromotions(r.data.data?.items || r.data.data || []));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Promotion History</Typography>
        <Button variant="contained" startIcon={<TrendingUp />} onClick={() => setBulkOpen(true)}>Bulk Promote</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              {['Student ID', 'From Class', 'To Class', 'Type', 'Result %', 'Remarks', 'Date'].map(h =>
                <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {promotions.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No promotions yet</TableCell></TableRow>
            ) : promotions.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.student_id}</TableCell>
                <TableCell>{p.from_class}</TableCell>
                <TableCell>{p.to_class}</TableCell>
                <TableCell><Chip label={p.promotion_type} size="small" color={p.promotion_type === 'promoted' ? 'success' : p.promotion_type === 'detained' ? 'error' : 'info'} /></TableCell>
                <TableCell>{p.result_percentage || '-'}</TableCell>
                <TableCell>{p.remarks || '-'}</TableCell>
                <TableCell>{p.promoted_at?.split('T')[0]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Bulk Promote Dialog */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Promote Students</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="From Class" value={bulkForm.from_class_id}
                onChange={e => setBulkForm({ ...bulkForm, from_class_id: e.target.value })}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="To Class" value={bulkForm.to_class_id}
                onChange={e => setBulkForm({ ...bulkForm, to_class_id: e.target.value })}>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="From Academic Year" value={bulkForm.from_academic_year_id}
                onChange={e => setBulkForm({ ...bulkForm, from_academic_year_id: e.target.value })}>
                {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="To Academic Year" value={bulkForm.to_academic_year_id}
                onChange={e => setBulkForm({ ...bulkForm, to_academic_year_id: e.target.value })}>
                {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Type" value={bulkForm.promotion_type}
                onChange={e => setBulkForm({ ...bulkForm, promotion_type: e.target.value })}>
                <MenuItem value="promoted">Promoted</MenuItem>
                <MenuItem value="detained">Detained</MenuItem>
                <MenuItem value="graduated">Graduated</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkPromote} disabled={loading}>Promote All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ==================== TAB 3: ALUMNI ====================
function AlumniTab() {
  const [alumni, setAlumni] = useState([]);
  const [search, setSearch] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', batch_year: '', passing_class: '', phone: '', email: '', current_occupation: '', current_organization: '', higher_education: '', achievements_after: '', is_mentor: false });

  const fetchAlumni = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (batchYear) params.batch_year = batchYear;
    studentsAPI.listAlumni(params).then(r => setAlumni(r.data.data?.items || r.data.data || [])).catch(() => {});
  }, [search, batchYear]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    try {
      await studentsAPI.createAlumni(form);
      toast.success('Alumni added');
      setDialogOpen(false);
      setForm({ name: '', batch_year: '', passing_class: '', phone: '', email: '', current_occupation: '', current_organization: '', higher_education: '', achievements_after: '', is_mentor: false });
      fetchAlumni();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField size="small" placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <TextField size="small" label="Batch Year" value={batchYear} onChange={e => setBatchYear(e.target.value)} sx={{ width: 120 }} />
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)} size="small">Add Alumni</Button>
      </Box>

      <Grid container spacing={2}>
        {alumni.length === 0 ? (
          <Grid item xs={12}><Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No alumni records</Typography></Paper></Grid>
        ) : alumni.map(a => (
          <Grid item xs={12} sm={6} md={4} key={a.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>{a.name?.[0]}</Avatar>
                  <Box>
                    <Typography fontWeight={600}>{a.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Batch: {a.batch_year || 'N/A'}</Typography>
                  </Box>
                  {a.is_mentor && <Chip label="Mentor" color="success" size="small" sx={{ ml: 'auto' }} />}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2"><strong>Class:</strong> {a.passing_class || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Occupation:</strong> {a.current_occupation || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Organization:</strong> {a.current_organization || 'N/A'}</Typography>
                <Typography variant="body2"><strong>Higher Ed:</strong> {a.higher_education || 'N/A'}</Typography>
                {a.achievements_after && <Typography variant="body2" sx={{ mt: 1 }}><strong>Achievements:</strong> {a.achievements_after}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Alumni Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Alumni</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              ['name', 'Full Name', 6], ['batch_year', 'Batch Year', 3], ['passing_class', 'Passing Class', 3],
              ['phone', 'Phone', 6], ['email', 'Email', 6],
              ['current_occupation', 'Current Occupation', 6], ['current_organization', 'Organization', 6],
              ['higher_education', 'Higher Education', 12], ['achievements_after', 'Achievements After School', 12],
            ].map(([field, label, size]) => (
              <Grid item xs={12} sm={size} key={field}>
                <TextField fullWidth label={label} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                  multiline={size === 12 && field !== 'higher_education'} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ==================== TAB 4: HOUSES ====================
function HousesTab() {
  const [houses, setHouses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', color: '', motto: '' });

  const fetchHouses = () => studentsAPI.listHouses().then(r => setHouses(r.data.data || [])).catch(() => {});
  useEffect(() => { fetchHouses(); }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    try {
      await studentsAPI.createHouse(form);
      toast.success('House created');
      setDialogOpen(false);
      setForm({ name: '', color: '', motto: '' });
      fetchHouses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAutoAssign = async () => {
    try {
      const res = await studentsAPI.autoAssignHouses();
      toast.success(res.data.message || 'Houses assigned');
      fetchHouses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h6">House System</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" onClick={handleAutoAssign}>Auto Assign</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>Create House</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {houses.length === 0 ? (
          <Grid item xs={12}><Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">No houses created. Create houses and assign students.</Typography></Paper></Grid>
        ) : houses.map(h => (
          <Grid item xs={12} sm={6} md={3} key={h.id}>
            <Card sx={{ borderTop: `4px solid ${h.color || P}`, borderRadius: 4 }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: h.color || P, mx: 'auto', mb: 1, width: 56, height: 56, fontSize: 24 }}>{h.name?.[0]}</Avatar>
                <Typography variant="h6" fontWeight={700}>{h.name}</Typography>
                {h.motto && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>"{h.motto}"</Typography>}
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="h5" fontWeight={700} color="primary">{h.member_count || 0}</Typography>
                    <Typography variant="caption">Members</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h5" fontWeight={700} color="warning.main">{h.total_points || 0}</Typography>
                    <Typography variant="caption">Points</Typography>
                  </Grid>
                </Grid>
                {h.captain && <Typography variant="body2" sx={{ mt: 1 }}>Captain: {h.captain.full_name}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create House</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="House Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Color (hex)" placeholder="#ff5722" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Motto" value={form.motto} onChange={e => setForm({ ...form, motto: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ==================== TAB 5: SIBLINGS ====================
function SiblingsTab() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchStudents = () => {
    const params = { per_page: 50 };
    if (search) params.search = search;
    studentsAPI.list(params).then(r => setStudents(r.data.data?.items || r.data.data || [])).catch(() => {});
  };

  useEffect(() => { fetchStudents(); }, [search]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleLink = async () => {
    if (selected.length < 2) { toast.error('Select at least 2 students'); return; }
    setLoading(true);
    try {
      await studentsAPI.linkSiblings({ student_ids: selected });
      toast.success('Siblings linked');
      setSelected([]);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField size="small" placeholder="Search students to link..." value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <Button variant="contained" disabled={selected.length < 2 || loading} onClick={handleLink} startIcon={<Groups />}>
          Link {selected.length} as Siblings
        </Button>
      </Box>

      {selected.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Selected {selected.length} students: {students.filter(s => selected.includes(s.id)).map(s => s.full_name || s.first_name).join(', ')}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell></TableCell>
              {['Name', 'Adm No', 'Class', 'Sibling Group'].map(h => <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(s => (
              <TableRow key={s.id} hover selected={selected.includes(s.id)} onClick={() => toggleSelect(s.id)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => {}} />
                </TableCell>
                <TableCell>{s.full_name || s.first_name}</TableCell>
                <TableCell>{s.admission_no || '-'}</TableCell>
                <TableCell>{s.current_class?.name || '-'}</TableCell>
                <TableCell>{s.sibling_group_id ? <Chip label={`Group: ${s.sibling_group_id}`} size="small" color="primary" /> : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ==================== TAB 6: ID CARDS ====================
function IdCardsTab() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data.data || []));
  }, []);

  useEffect(() => {
    if (classId) {
      studentsAPI.list({ class_id: classId, per_page: 100, status: 'active' })
        .then(r => setStudents(r.data.data?.items || r.data.data || []));
    }
  }, [classId]);

  const handleBulkGenerate = async () => {
    if (selected.length === 0) { toast.error('Select students'); return; }
    try {
      const res = await studentsAPI.bulkIdCards({ student_ids: selected });
      toast.success(res.data.message || 'ID Cards generated');
      if (classId) {
        studentsAPI.list({ class_id: classId, per_page: 100, status: 'active' })
          .then(r => setStudents(r.data.data?.items || r.data.data || []));
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const selectAll = () => setSelected(students.map(s => s.id));

  return (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <TextField size="small" select label="Select Class" value={classId} onChange={e => { setClassId(e.target.value); setSelected([]); }} sx={{ minWidth: { xs: '100%', sm: 200 } }}>
          {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <Button size="small" onClick={selectAll}>Select All</Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<BadgeIcon />} disabled={selected.length === 0} onClick={handleBulkGenerate}>
          Generate ID Cards ({selected.length})
        </Button>
      </Box>

      {!classId ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}><Typography color="text.secondary">Select a class to load students</Typography></Paper>
      ) : (
        <Grid container spacing={2}>
          {students.map(s => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
              <Card
                variant={selected.includes(s.id) ? 'elevation' : 'outlined'}
                sx={{ cursor: 'pointer', border: selected.includes(s.id) ? '2px solid' : undefined, borderColor: selected.includes(s.id) ? 'primary.main' : undefined }}
                onClick={() => setSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
              >
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: 'primary.main' }}>{s.first_name?.[0]}</Avatar>
                  <Typography fontWeight={600} variant="body2">{s.full_name || s.first_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.admission_no}</Typography>
                  <Box sx={{ mt: 1 }}>
                    {s.id_card_issued ?
                      <Chip label="ID Issued" color="success" size="small" icon={<CheckCircle />} /> :
                      <Chip label="Not Issued" size="small" variant="outlined" />
                    }
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// ==================== MAIN COMPONENT ====================
export default function Students() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight={700}>Student Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/students/new')} size="small">Add Student</Button>
      </Box>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<People />} label="Students" iconPosition="start" />
        <Tab icon={<TrendingUp />} label="Dashboard" iconPosition="start" />
        <Tab icon={<SwapVert />} label="Promotions" iconPosition="start" />
        <Tab icon={<School />} label="Alumni" iconPosition="start" />
        <Tab icon={<Groups />} label="Houses" iconPosition="start" />
        <Tab icon={<People />} label="Siblings" iconPosition="start" />
        <Tab icon={<BadgeIcon />} label="ID Cards" iconPosition="start" />
      </Tabs>

      {tab === 0 && <StudentList navigate={navigate} />}
      {tab === 1 && <StudentDashboard />}
      {tab === 2 && <Promotions />}
      {tab === 3 && <AlumniTab />}
      {tab === 4 && <HousesTab />}
      {tab === 5 && <SiblingsTab />}
      {tab === 6 && <IdCardsTab />}
    </Box>
  );
}
