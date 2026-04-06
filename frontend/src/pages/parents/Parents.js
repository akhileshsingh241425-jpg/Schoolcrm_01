import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Tabs, Tab, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Alert,
  Snackbar, MenuItem, Select, FormControl, InputLabel, Rating, FormControlLabel,
  Checkbox, Tooltip, TablePagination, Avatar, LinearProgress, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Refresh, People, EventNote,
  Feedback, Report, Description, Message, Notifications, VolunteerActivism, DirectionsCar,
  CheckCircle, Cancel, AccessTime, TrendingUp, School, ArrowBack,
  AccountBalanceWallet, MenuBook, DirectionsBus, LocalHospital, Assignment,
  CalendarMonth, EmojiEvents, LibraryBooks
} from '@mui/icons-material';
import { parentAPI } from '../../services/api';

// =================== DASHBOARD TAB ===================
function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentAPI.getDashboard().then(r => {
      setStats(r.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Typography>Loading dashboard...</Typography>;
  if (!stats) return <Alert severity="info">No data available</Alert>;

  const cards = [
    { label: 'Parent Profiles', value: stats.total_profiles, icon: <People fontSize="large" color="primary" /> },
    { label: 'Active PTM Slots', value: stats.active_ptm_slots, icon: <EventNote fontSize="large" color="secondary" /> },
    { label: 'Open Grievances', value: stats.open_grievances, icon: <Report fontSize="large" color="error" /> },
    { label: 'Active Surveys', value: stats.active_surveys, icon: <Feedback fontSize="large" color="info" /> },
    { label: 'Pending Consents', value: stats.pending_consents, icon: <Description fontSize="large" color="warning" /> },
    { label: 'Unread Messages', value: stats.unread_messages, icon: <Message fontSize="large" color="success" /> },
  ];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((c, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <Card sx={{ borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ textAlign: 'center' }}>
                {c.icon}
                <Typography variant="h4" sx={{ mt: 1 }}>{c.value}</Typography>
                <Typography variant="body2" color="text.secondary">{c.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {stats.recent_activities?.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Recent Activities</Typography>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Date</TableCell><TableCell>Type</TableCell>
              <TableCell>Title</TableCell><TableCell>Description</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {stats.recent_activities.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{a.activity_date}</TableCell>
                  <TableCell><Chip label={a.activity_type} size="small" /></TableCell>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>{a.description?.substring(0, 60)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

// =================== PROFILES TAB ===================
function ProfilesTab() {
  const [profiles, setProfiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', occupation: '' });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listProfiles({ search }).then(r => {
      const d = r.data.data;
      setProfiles(d?.items || d || []);
    }).catch(() => {});
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editId) {
        await parentAPI.updateProfile(editId, form);
        setSnack({ open: true, message: 'Profile updated', severity: 'success' });
      } else {
        await parentAPI.createProfile(form);
        setSnack({ open: true, message: 'Profile created', severity: 'success' });
      }
      setOpen(false); setEditId(null); setForm({ name: '', phone: '', email: '', address: '', occupation: '' });
      load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this profile?')) return;
    try {
      await parentAPI.deleteProfile(id);
      setSnack({ open: true, message: 'Profile deleted', severity: 'success' });
      load();
    } catch (e) {
      setSnack({ open: true, message: 'Error deleting', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search parents..." value={search}
          onChange={e => setSearch(e.target.value)} sx={{ minWidth: { xs: '100%', sm: 250 } }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'grey.500' }} /> }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm({ name: '', phone: '', email: '', address: '', occupation: '' }); setOpen(true); }}>
          Add Profile
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell>
            <TableCell>Occupation</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {profiles.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell><TableCell>{p.phone}</TableCell>
                <TableCell>{p.email}</TableCell><TableCell>{p.occupation}</TableCell>
                <TableCell><Chip label={p.is_active ? 'Active' : 'Inactive'} color={p.is_active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setEditId(p.id); setForm(p); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {profiles.length === 0 && <TableRow><TableCell colSpan={6} align="center">No parent profiles found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Profile' : 'Add Parent Profile'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Name" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Occupation" value={form.occupation || ''} onChange={e => setForm({ ...form, occupation: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Language" value={form.preferred_language || 'English'} onChange={e => setForm({ ...form, preferred_language: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Address" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== PTM TAB ===================
function PTMTab() {
  const [tab, setTab] = useState(0);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [slotOpen, setSlotOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({ title: '', ptm_date: '', start_time: '', end_time: '', slot_duration: 15, max_bookings: 1 });
  const [bookForm, setBookForm] = useState({ slot_id: '', parent_id: '', student_id: '', notes: '' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadSlots = useCallback(() => {
    parentAPI.listPTMSlots().then(r => { const d = r.data.data; setSlots(d?.items || d || []); }).catch(() => {});
  }, []);
  const loadBookings = useCallback(() => {
    parentAPI.listPTMBookings().then(r => { const d = r.data.data; setBookings(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { loadSlots(); loadBookings(); }, [loadSlots, loadBookings]);

  const saveSlot = async () => {
    try {
      await parentAPI.createPTMSlot(slotForm);
      setSnack({ open: true, message: 'PTM slot created', severity: 'success' });
      setSlotOpen(false); loadSlots();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const saveBooking = async () => {
    try {
      await parentAPI.createPTMBooking(bookForm);
      setSnack({ open: true, message: 'PTM booked', severity: 'success' });
      setBookOpen(false); loadBookings();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="PTM Slots" /><Tab label="Bookings" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setSlotOpen(true)}>New PTM Slot</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow>
                <TableCell>Title</TableCell><TableCell>Date</TableCell><TableCell>Time</TableCell>
                <TableCell>Teacher</TableCell><TableCell>Duration</TableCell><TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {slots.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.title}</TableCell><TableCell>{s.ptm_date}</TableCell>
                    <TableCell>{s.start_time} - {s.end_time}</TableCell>
                    <TableCell>{s.teacher_name}</TableCell>
                    <TableCell>{s.slot_duration} min</TableCell>
                    <TableCell><Chip label={s.status} size="small" color={s.status === 'active' ? 'success' : 'default'} /></TableCell>
                  </TableRow>
                ))}
                {slots.length === 0 && <TableRow><TableCell colSpan={6} align="center">No PTM slots</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setBookOpen(true)}>Book PTM</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow>
                <TableCell>Slot</TableCell><TableCell>Parent ID</TableCell><TableCell>Student ID</TableCell>
                <TableCell>Status</TableCell><TableCell>Notes</TableCell><TableCell>Feedback</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {bookings.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.slot?.title || b.slot_id}</TableCell>
                    <TableCell>{b.parent_id}</TableCell><TableCell>{b.student_id}</TableCell>
                    <TableCell><Chip label={b.status} size="small" color={b.status === 'booked' ? 'primary' : b.status === 'completed' ? 'success' : 'default'} /></TableCell>
                    <TableCell>{b.notes}</TableCell><TableCell>{b.feedback}</TableCell>
                  </TableRow>
                ))}
                {bookings.length === 0 && <TableRow><TableCell colSpan={6} align="center">No bookings</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* PTM Slot Dialog */}
      <Dialog open={slotOpen} onClose={() => setSlotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create PTM Slot</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={slotForm.title} onChange={e => setSlotForm({ ...slotForm, title: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Date" value={slotForm.ptm_date} onChange={e => setSlotForm({ ...slotForm, ptm_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="Start Time" type="time" value={slotForm.start_time} onChange={e => setSlotForm({ ...slotForm, start_time: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth label="End Time" type="time" value={slotForm.end_time} onChange={e => setSlotForm({ ...slotForm, end_time: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Slot Duration (min)" value={slotForm.slot_duration} onChange={e => setSlotForm({ ...slotForm, slot_duration: parseInt(e.target.value) })} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Max Bookings" value={slotForm.max_bookings} onChange={e => setSlotForm({ ...slotForm, max_bookings: parseInt(e.target.value) })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSlotOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSlot}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookOpen} onClose={() => setBookOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book PTM Slot</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Slot</InputLabel>
                <Select value={bookForm.slot_id} label="Select Slot" onChange={e => setBookForm({ ...bookForm, slot_id: e.target.value })}>
                  {slots.filter(s => s.status === 'active').map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.title} - {s.ptm_date}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Parent ID" value={bookForm.parent_id} onChange={e => setBookForm({ ...bookForm, parent_id: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Student ID" value={bookForm.student_id} onChange={e => setBookForm({ ...bookForm, student_id: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={bookForm.notes} onChange={e => setBookForm({ ...bookForm, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveBooking}>Book</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== SURVEYS TAB ===================
function SurveysTab() {
  const [surveys, setSurveys] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', survey_type: 'general', is_anonymous: false, is_active: true });
  const [editId, setEditId] = useState(null);
  const [responseOpen, setResponseOpen] = useState(false);
  const [responses, setResponses] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listSurveys().then(r => { const d = r.data.data; setSurveys(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editId) { await parentAPI.updateSurvey(editId, form); }
      else { await parentAPI.createSurvey(form); }
      setSnack({ open: true, message: editId ? 'Survey updated' : 'Survey created', severity: 'success' });
      setOpen(false); setEditId(null); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const viewResponses = async (survey) => {
    setSelectedSurvey(survey);
    try {
      const r = await parentAPI.listSurveyResponses(survey.id);
      const d = r.data.data;
      setResponses(d?.items || d || []);
      setResponseOpen(true);
    } catch { }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm({ title: '', description: '', survey_type: 'general', is_anonymous: false, is_active: true }); setOpen(true); }}>
          New Survey
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Audience</TableCell>
            <TableCell>Anonymous</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {surveys.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.title}</TableCell>
                <TableCell><Chip label={s.survey_type} size="small" /></TableCell>
                <TableCell>{s.target_audience}</TableCell>
                <TableCell>{s.is_anonymous ? 'Yes' : 'No'}</TableCell>
                <TableCell><Chip label={s.is_active ? 'Active' : 'Closed'} color={s.is_active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <Tooltip title="View Responses"><IconButton size="small" onClick={() => viewResponses(s)}><Visibility fontSize="small" /></IconButton></Tooltip>
                  <IconButton size="small" onClick={() => { setEditId(s.id); setForm(s); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {surveys.length === 0 && <TableRow><TableCell colSpan={6} align="center">No surveys</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Survey' : 'Create Survey'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={form.survey_type || 'general'} label="Type" onChange={e => setForm({ ...form, survey_type: e.target.value })}>
                  <MenuItem value="general">General</MenuItem><MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="facility">Facility</MenuItem><MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={<Checkbox checked={form.is_anonymous || false} onChange={e => setForm({ ...form, is_anonymous: e.target.checked })} />} label="Anonymous" />
            </Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="Start Date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="End Date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={responseOpen} onClose={() => setResponseOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Responses: {selectedSurvey?.title}</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Parent</TableCell><TableCell>Student</TableCell><TableCell>Rating</TableCell>
              <TableCell>Comments</TableCell><TableCell>Submitted</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {responses.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.parent_id}</TableCell><TableCell>{r.student_id}</TableCell>
                  <TableCell>{r.rating && <Rating value={r.rating} readOnly size="small" />}</TableCell>
                  <TableCell>{r.comments}</TableCell><TableCell>{r.submitted_at?.split('T')[0]}</TableCell>
                </TableRow>
              ))}
              {responses.length === 0 && <TableRow><TableCell colSpan={5} align="center">No responses yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setResponseOpen(false)}>Close</Button></DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== GRIEVANCES TAB ===================
function GrievancesTab() {
  const [grievances, setGrievances] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });
  const [editId, setEditId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    parentAPI.listGrievances(params).then(r => { const d = r.data.data; setGrievances(d?.items || d || []); }).catch(() => {});
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editId) { await parentAPI.updateGrievance(editId, form); }
      else { await parentAPI.createGrievance(form); }
      setSnack({ open: true, message: editId ? 'Grievance updated' : 'Grievance submitted', severity: 'success' });
      setOpen(false); setEditId(null); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const statusColors = { open: 'error', in_progress: 'warning', resolved: 'success', closed: 'default' };
  const priorityColors = { low: 'default', medium: 'info', high: 'warning', critical: 'error' };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem><MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem><MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm({ subject: '', description: '', category: 'general', priority: 'medium' }); setOpen(true); }}>
          New Grievance
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Ticket #</TableCell><TableCell>Subject</TableCell><TableCell>Category</TableCell>
            <TableCell>Priority</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {grievances.map(g => (
              <TableRow key={g.id}>
                <TableCell><Chip label={g.ticket_no} size="small" variant="outlined" /></TableCell>
                <TableCell>{g.subject}</TableCell>
                <TableCell>{g.category}</TableCell>
                <TableCell><Chip label={g.priority} size="small" color={priorityColors[g.priority] || 'default'} /></TableCell>
                <TableCell><Chip label={g.status} size="small" color={statusColors[g.status] || 'default'} /></TableCell>
                <TableCell>{g.created_at?.split('T')[0]}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setEditId(g.id); setForm(g); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {grievances.length === 0 && <TableRow><TableCell colSpan={7} align="center">No grievances</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Update Grievance' : 'Submit Grievance'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Subject" value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} required /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category || 'general'} label="Category" onChange={e => setForm({ ...form, category: e.target.value })}>
                  <MenuItem value="general">General</MenuItem><MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="discipline">Discipline</MenuItem><MenuItem value="facility">Facility</MenuItem>
                  <MenuItem value="transport">Transport</MenuItem><MenuItem value="fee">Fee</MenuItem>
                  <MenuItem value="food">Food</MenuItem><MenuItem value="safety">Safety</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority || 'medium'} label="Priority" onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem><MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {editId && (
              <>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={form.status || 'open'} label="Status" onChange={e => setForm({ ...form, status: e.target.value })}>
                      <MenuItem value="open">Open</MenuItem><MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="resolved">Resolved</MenuItem><MenuItem value="closed">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Resolution" value={form.resolution || ''} onChange={e => setForm({ ...form, resolution: e.target.value })} /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Update' : 'Submit'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== CONSENT TAB ===================
function ConsentTab() {
  const [forms, setForms] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', consent_type: 'general', is_mandatory: false });
  const [editId, setEditId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listConsentForms().then(r => { const d = r.data.data; setForms(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editId) { await parentAPI.updateConsentForm(editId, form); }
      else { await parentAPI.createConsentForm(form); }
      setSnack({ open: true, message: editId ? 'Updated' : 'Created', severity: 'success' });
      setOpen(false); setEditId(null); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this consent form?')) return;
    try { await parentAPI.deleteConsentForm(id); load(); } catch { }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm({ title: '', description: '', consent_type: 'general', is_mandatory: false }); setOpen(true); }}>
          New Consent Form
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Mandatory</TableCell>
            <TableCell>Deadline</TableCell><TableCell>Responses</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {forms.map(f => (
              <TableRow key={f.id}>
                <TableCell>{f.title}</TableCell>
                <TableCell><Chip label={f.consent_type} size="small" /></TableCell>
                <TableCell>{f.is_mandatory ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="disabled" fontSize="small" />}</TableCell>
                <TableCell>{f.deadline}</TableCell>
                <TableCell>{f.accepted_count}/{f.total_responses}</TableCell>
                <TableCell><Chip label={f.is_active ? 'Active' : 'Closed'} color={f.is_active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setEditId(f.id); setForm(f); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(f.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {forms.length === 0 && <TableRow><TableCell colSpan={7} align="center">No consent forms</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Consent Form' : 'Create Consent Form'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Description" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={form.consent_type || 'general'} label="Type" onChange={e => setForm({ ...form, consent_type: e.target.value })}>
                  <MenuItem value="general">General</MenuItem><MenuItem value="trip">Trip</MenuItem>
                  <MenuItem value="photo">Photo/Media</MenuItem><MenuItem value="medical">Medical</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="date" label="Deadline" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6} sm={3}>
              <FormControlLabel control={<Checkbox checked={form.is_mandatory || false} onChange={e => setForm({ ...form, is_mandatory: e.target.checked })} />} label="Mandatory" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== MESSAGES TAB ===================
function MessagesTab() {
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ receiver_id: '', subject: '', message: '', receiver_type: 'parent' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listMessages().then(r => { const d = r.data.data; setMessages(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    try {
      await parentAPI.sendMessage(form);
      setSnack({ open: true, message: 'Message sent', severity: 'success' });
      setOpen(false); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ receiver_id: '', subject: '', message: '', receiver_type: 'parent' }); setOpen(true); }}>
          New Message
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Subject</TableCell><TableCell>Sender</TableCell><TableCell>Receiver</TableCell>
            <TableCell>Read</TableCell><TableCell>Date</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {messages.map(m => (
              <TableRow key={m.id}>
                <TableCell>{m.subject}</TableCell>
                <TableCell><Chip label={m.sender_type} size="small" variant="outlined" /> #{m.sender_id}</TableCell>
                <TableCell><Chip label={m.receiver_type} size="small" variant="outlined" /> #{m.receiver_id}</TableCell>
                <TableCell>{m.is_read ? <CheckCircle color="success" fontSize="small" /> : <AccessTime color="warning" fontSize="small" />}</TableCell>
                <TableCell>{m.created_at?.split('T')[0]}</TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && <TableRow><TableCell colSpan={5} align="center">No messages</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth type="number" label="Receiver ID" value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Receiver Type</InputLabel>
                <Select value={form.receiver_type} label="Receiver Type" onChange={e => setForm({ ...form, receiver_type: e.target.value })}>
                  <MenuItem value="parent">Parent</MenuItem><MenuItem value="teacher">Teacher</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend}>Send</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== ACTIVITIES TAB ===================
function ActivitiesTab() {
  const [activities, setActivities] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', activity_type: 'general', activity_date: '' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listActivities().then(r => { const d = r.data.data; setActivities(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      await parentAPI.createActivity(form);
      setSnack({ open: true, message: 'Activity posted', severity: 'success' });
      setOpen(false); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try { await parentAPI.deleteActivity(id); load(); } catch { }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ title: '', description: '', activity_type: 'general', activity_date: '' }); setOpen(true); }}>
          Post Activity
        </Button>
      </Box>
      <Grid container spacing={2}>
        {activities.map(a => (
          <Grid item xs={12} sm={6} md={4} key={a.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={a.activity_type} size="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">{a.activity_date}</Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>{a.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{a.description}</Typography>
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}><Delete fontSize="small" /></IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {activities.length === 0 && (
          <Grid item xs={12}><Alert severity="info">No activities posted yet</Alert></Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post Activity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={form.activity_type} label="Type" onChange={e => setForm({ ...form, activity_type: e.target.value })}>
                  <MenuItem value="general">General</MenuItem><MenuItem value="classwork">Classwork</MenuItem>
                  <MenuItem value="homework">Homework</MenuItem><MenuItem value="event">Event</MenuItem>
                  <MenuItem value="sports">Sports</MenuItem><MenuItem value="art">Art</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth type="date" label="Date" value={form.activity_date} onChange={e => setForm({ ...form, activity_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Post</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== VOLUNTEERS TAB ===================
function VolunteersTab() {
  const [volunteers, setVolunteers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ parent_name: '', phone: '', event_name: '', event_date: '', role: '' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listVolunteers().then(r => { const d = r.data.data; setVolunteers(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      await parentAPI.registerVolunteer(form);
      setSnack({ open: true, message: 'Volunteer registered', severity: 'success' });
      setOpen(false); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ parent_name: '', phone: '', event_name: '', event_date: '', role: '' }); setOpen(true); }}>
          Register Volunteer
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Parent Name</TableCell><TableCell>Phone</TableCell><TableCell>Event</TableCell>
            <TableCell>Date</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {volunteers.map(v => (
              <TableRow key={v.id}>
                <TableCell>{v.parent_name}</TableCell><TableCell>{v.phone}</TableCell>
                <TableCell>{v.event_name}</TableCell><TableCell>{v.event_date}</TableCell>
                <TableCell>{v.role}</TableCell>
                <TableCell><Chip label={v.status} size="small" color={v.status === 'registered' ? 'primary' : v.status === 'confirmed' ? 'success' : 'default'} /></TableCell>
              </TableRow>
            ))}
            {volunteers.length === 0 && <TableRow><TableCell colSpan={6} align="center">No volunteers</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register Volunteer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Parent Name" value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Event Name" value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="Event Date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Register</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== PICKUP TAB ===================
function PickupTab() {
  const [pickups, setPickups] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', authorized_person: '', relation: '', phone: '', id_proof: '' });
  const [editId, setEditId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listPickupAuth().then(r => { const d = r.data.data; setPickups(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editId) { await parentAPI.updatePickupAuth(editId, form); }
      else { await parentAPI.createPickupAuth(form); }
      setSnack({ open: true, message: editId ? 'Updated' : 'Created', severity: 'success' });
      setOpen(false); setEditId(null); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this authorization?')) return;
    try { await parentAPI.deletePickupAuth(id); load(); } catch { }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setForm({ student_id: '', authorized_person: '', relation: '', phone: '', id_proof: '' }); setOpen(true); }}>
          Add Authorization
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Student ID</TableCell><TableCell>Authorized Person</TableCell><TableCell>Relation</TableCell>
            <TableCell>Phone</TableCell><TableCell>ID Proof</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {pickups.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.student_id}</TableCell><TableCell>{p.authorized_person}</TableCell>
                <TableCell>{p.relation}</TableCell><TableCell>{p.phone}</TableCell>
                <TableCell>{p.id_proof}</TableCell>
                <TableCell>{p.is_active ? <CheckCircle color="success" fontSize="small" /> : <Cancel color="disabled" fontSize="small" />}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setEditId(p.id); setForm(p); setOpen(true); }}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pickups.length === 0 && <TableRow><TableCell colSpan={7} align="center">No pickup authorizations</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Authorization' : 'Add Pickup Authorization'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth type="number" label="Student ID" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Authorized Person" value={form.authorized_person || ''} onChange={e => setForm({ ...form, authorized_person: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Relation" value={form.relation || ''} onChange={e => setForm({ ...form, relation: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth label="ID Proof" value={form.id_proof || ''} onChange={e => setForm({ ...form, id_proof: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== NOTIFICATIONS TAB ===================
function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', notification_type: 'general' });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(() => {
    parentAPI.listNotifications().then(r => { const d = r.data.data; setNotifications(d?.items || d || []); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    try {
      await parentAPI.sendNotification(form);
      setSnack({ open: true, message: 'Notification sent', severity: 'success' });
      setOpen(false); load();
    } catch (e) {
      setSnack({ open: true, message: e.response?.data?.message || 'Error', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ title: '', message: '', notification_type: 'general' }); setOpen(true); }}>
          Send Notification
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Title</TableCell><TableCell>Message</TableCell><TableCell>Type</TableCell>
            <TableCell>Channel</TableCell><TableCell>Read</TableCell><TableCell>Sent</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {notifications.map(n => (
              <TableRow key={n.id}>
                <TableCell>{n.title}</TableCell><TableCell>{n.message?.substring(0, 50)}</TableCell>
                <TableCell><Chip label={n.notification_type} size="small" /></TableCell>
                <TableCell>{n.channel}</TableCell>
                <TableCell>{n.is_read ? <CheckCircle color="success" fontSize="small" /> : <AccessTime color="warning" fontSize="small" />}</TableCell>
                <TableCell>{n.sent_at?.split('T')[0]}</TableCell>
              </TableRow>
            ))}
            {notifications.length === 0 && <TableRow><TableCell colSpan={6} align="center">No notifications</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={form.notification_type} label="Type" onChange={e => setForm({ ...form, notification_type: e.target.value })}>
                  <MenuItem value="general">General</MenuItem><MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="fee">Fee</MenuItem><MenuItem value="attendance">Attendance</MenuItem>
                  <MenuItem value="event">Event</MenuItem><MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend}>Send</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// =================== MAIN PARENTS COMPONENT ===================
// =================== MY CHILD VIEW TAB ===================
function ChildViewTab() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState('overview');

  useEffect(() => {
    parentAPI.listMyChildren({ search }).then(r => setStudents(r.data.data || [])).catch(() => {});
  }, [search]);

  const loadChild = (studentId) => {
    setLoading(true);
    parentAPI.getChildOverview(studentId).then(r => {
      setChild(r.data.data);
      setSelected(studentId);
      setSection('overview');
    }).catch(() => {}).finally(() => setLoading(false));
  };

  // Student selector
  if (!selected) {
    return (
      <Box>
        <Typography variant="h6" fontWeight="bold" mb={2}>Select Student</Typography>
        <TextField fullWidth size="small" placeholder="Search by name or admission no..."
          value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 3, maxWidth: 400 }}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} />
        <Grid container spacing={2}>
          {students.map(s => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
              <Card onClick={() => loadChild(s.id)} sx={{
                cursor: 'pointer', borderRadius: 3, transition: 'all 0.2s',
                '&:hover': { boxShadow: 6, transform: 'translateY(-3px)' },
                border: '1px solid #e0e0e0'
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1.5, fontSize: 26,
                    background: s.gender === 'male' ? 'linear-gradient(135deg, #1565c0, #42a5f5)' : 'linear-gradient(135deg, #ad1457, #ec407a)' }}>
                    {s.name?.[0]}
                  </Avatar>
                  <Typography fontWeight="bold" fontSize={16}>{s.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.admission_no}</Typography>
                  <Chip label={`${s.class_name || ''}${s.section_name ? ' - ' + s.section_name : ''}`}
                    size="small" color="primary" variant="outlined" sx={{ mt: 1 }} />
                  {s.parents?.length > 0 && (
                    <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                      {s.parents.map(p => `${p.name} (${p.relation})`).join(' • ')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
          {!students.length && <Grid item xs={12}><Typography color="text.secondary" textAlign="center" py={4}>No students found</Typography></Grid>}
        </Grid>
      </Box>
    );
  }

  if (loading) return <Box textAlign="center" py={6}><LinearProgress /><Typography mt={2}>Loading student data...</Typography></Box>;
  if (!child) return <Alert severity="error">Failed to load student data</Alert>;

  const att = child.attendance || {};
  const fees = child.fees || {};
  const exams = child.exams || {};
  const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const navItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'attendance', label: 'Attendance', icon: '✅' },
    { key: 'fees', label: 'Fees', icon: '💳' },
    { key: 'exams', label: 'Exams & Results', icon: '📝' },
    { key: 'timetable', label: 'Timetable', icon: '📅' },
    { key: 'homework', label: 'Homework', icon: '📖' },
    { key: 'library', label: 'Library', icon: '📚' },
    { key: 'health', label: 'Health', icon: '🏥' },
    { key: 'transport', label: 'Transport', icon: '🚌' },
    { key: 'activities', label: 'Activities', icon: '🎯' },
  ];

  return (
    <Box>
      {/* Back Button + Student Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => { setSelected(null); setChild(null); }}
          variant="outlined" size="small" sx={{ borderRadius: 2 }}>
          All Students
        </Button>
      </Box>

      {/* Student Profile Banner */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 50%, #7986cb 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)' }}>
            {child.first_name?.[0]}{child.last_name?.[0]}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold">{child.first_name} {child.last_name}</Typography>
            <Box display="flex" gap={2} mt={0.5} flexWrap="wrap">
              <Chip label={`Adm: ${child.admission_no || 'N/A'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label={`Roll: ${child.roll_no || 'N/A'}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label={child.class_name ? `${child.class_name}${child.section_name ? ' - ' + child.section_name : ''}` : 'No Class'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              <Chip label={child.gender || 'N/A'} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              {child.date_of_birth && <Chip label={`DOB: ${new Date(child.date_of_birth).toLocaleDateString('en-IN')}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />}
            </Box>
          </Box>
          {/* Quick Stats */}
          <Box display="flex" gap={2}>
            {[
              { label: 'Attendance', value: `${att.percentage || 0}%`, color: att.percentage >= 75 ? '#4caf50' : '#f44336' },
              { label: 'Fee Pending', value: `₹${(fees.total_pending || 0).toLocaleString()}`, color: fees.total_pending > 0 ? '#ff9800' : '#4caf50' },
              { label: 'Exams', value: exams.total_exams || 0, color: '#2196f3' }
            ].map((s, i) => (
              <Box key={i} sx={{ textAlign: 'center', bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2.5, py: 1.5, minWidth: 90 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        {/* Parents Info */}
        {child.parents?.length > 0 && (
          <Box display="flex" gap={2} mt={2} pt={2} sx={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            {child.parents.map((p, i) => (
              <Box key={i} display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'rgba(255,255,255,0.25)' }}>
                  {p.relation === 'father' ? '👨' : p.relation === 'mother' ? '👩' : '👤'}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{p.name} ({p.relation})</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>{p.phone || p.email || ''}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Section Navigation */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box display="flex" gap={0} sx={{ overflowX: 'auto' }}>
          {navItems.map(nav => (
            <Box key={nav.key} onClick={() => setSection(nav.key)} sx={{
              px: 2.5, py: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.8,
              borderBottom: section === nav.key ? '3px solid #1565c0' : '3px solid transparent',
              bgcolor: section === nav.key ? '#e3f2fd' : 'transparent',
              fontWeight: section === nav.key ? 'bold' : 'normal',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#f5f5f5' }
            }}>
              <Typography fontSize={16}>{nav.icon}</Typography>
              <Typography fontSize={13} fontWeight={section === nav.key ? 700 : 400}>{nav.label}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ======== OVERVIEW ======== */}
      {section === 'overview' && (
        <Grid container spacing={2.5}>
          {/* Attendance Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('attendance')}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CheckCircle color="success" /><Typography fontWeight="bold">Attendance</Typography>
                </Box>
                <Box textAlign="center" mb={2}>
                  <Box sx={{
                    width: 100, height: 100, borderRadius: '50%', mx: 'auto', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: `conic-gradient(${att.percentage >= 75 ? '#4caf50' : '#f44336'} ${att.percentage * 3.6}deg, #e0e0e0 0deg)`
                  }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color={att.percentage >= 75 ? 'success.main' : 'error.main'}>
                        {att.percentage || 0}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Grid container spacing={1} textAlign="center">
                  <Grid item xs={4}><Typography variant="h6" color="success.main">{att.present || 0}</Typography><Typography variant="caption">Present</Typography></Grid>
                  <Grid item xs={4}><Typography variant="h6" color="error.main">{att.absent || 0}</Typography><Typography variant="caption">Absent</Typography></Grid>
                  <Grid item xs={4}><Typography variant="h6" color="warning.main">{att.late || 0}</Typography><Typography variant="caption">Late</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Fee Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('fees')}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AccountBalanceWallet color="primary" /><Typography fontWeight="bold">Fees</Typography>
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Paid</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">₹{(fees.total_paid || 0).toLocaleString()}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={fees.total_fee ? (fees.total_paid / fees.total_fee * 100) : 0}
                    sx={{ height: 10, borderRadius: 5, mb: 1 }} color="success" />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Total: ₹{(fees.total_fee || 0).toLocaleString()}</Typography>
                    <Typography variant="caption" color={fees.total_pending > 0 ? 'error' : 'success.main'}>
                      Pending: ₹{(fees.total_pending || 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                {fees.overdue_count > 0 && (
                  <Alert severity="error" variant="outlined" sx={{ py: 0 }}>
                    {fees.overdue_count} overdue — ₹{(fees.overdue_amount || 0).toLocaleString()}
                  </Alert>
                )}
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" fontWeight="bold" color="text.secondary">Recent Payments</Typography>
                {fees.recent_payments?.slice(0, 3).map((p, i) => (
                  <Box key={i} display="flex" justifyContent="space-between" py={0.5}>
                    <Typography fontSize={12}>{new Date(p.payment_date).toLocaleDateString('en-IN')}</Typography>
                    <Typography fontSize={12} fontWeight="bold" color="success.main">₹{p.total_amount?.toLocaleString()}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Exams Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('exams')}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Assignment color="warning" /><Typography fontWeight="bold">Exam Results</Typography>
                </Box>
                {exams.results_by_exam?.length ? exams.results_by_exam.map((exam, i) => (
                  <Box key={i} mb={1.5} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography fontSize={13} fontWeight="bold">{exam.exam}</Typography>
                      <Chip label={`${exam.percentage}%`} size="small"
                        color={exam.percentage >= 60 ? 'success' : exam.percentage >= 33 ? 'warning' : 'error'} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {exam.obtained}/{exam.total_marks} marks • {exam.subjects?.length} subjects
                    </Typography>
                  </Box>
                )) : <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No exam results yet</Typography>}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Info Cards */}
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('homework')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography fontSize={32}>📖</Typography>
                <Typography variant="h5" fontWeight="bold">{child.homework?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Homework</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('library')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography fontSize={32}>📚</Typography>
                <Typography variant="h5" fontWeight="bold">{child.library?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Library Books</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('health')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography fontSize={32}>🏥</Typography>
                <Typography variant="h5" fontWeight="bold">{child.health?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Health Records</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => setSection('activities')}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography fontSize={32}>🎯</Typography>
                <Typography variant="h5" fontWeight="bold">{child.activities?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Activities</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Student Details */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography fontWeight="bold" mb={2}>Student Details</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Blood Group', value: child.blood_group },
                  { label: 'Religion', value: child.religion },
                  { label: 'Category', value: child.category },
                  { label: 'Nationality', value: child.nationality },
                  { label: 'Mother Tongue', value: child.mother_tongue },
                  { label: 'Aadhar No', value: child.aadhar_no },
                  { label: 'Address', value: [child.address, child.city, child.state, child.pincode].filter(Boolean).join(', ') },
                  { label: 'Emergency Contact', value: child.emergency_contact ? `${child.emergency_person || ''} — ${child.emergency_contact}` : null },
                  { label: 'Medical Conditions', value: child.medical_conditions },
                  { label: 'Allergies', value: child.allergies },
                  { label: 'Transport', value: child.transport_mode },
                  { label: 'Previous School', value: child.previous_school },
                ].filter(f => f.value).map((f, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Typography variant="caption" color="text.secondary">{f.label}</Typography>
                    <Typography fontSize={14} fontWeight={500}>{f.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ======== ATTENDANCE DETAIL ======== */}
      {section === 'attendance' && (
        <Box>
          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Days', value: att.total_days, bg: 'linear-gradient(135deg, #1565c0, #42a5f5)' },
              { label: 'Present', value: att.present, bg: 'linear-gradient(135deg, #2e7d32, #66bb6a)' },
              { label: 'Absent', value: att.absent, bg: 'linear-gradient(135deg, #c62828, #ef5350)' },
              { label: 'Percentage', value: `${att.percentage}%`, bg: att.percentage >= 75 ? 'linear-gradient(135deg, #2e7d32, #4caf50)' : 'linear-gradient(135deg, #c62828, #f44336)' },
            ].map((s, i) => (
              <Grid item xs={3} key={i}>
                <Paper sx={{ p: 2, borderRadius: 3, background: s.bg, color: 'white', textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold">{s.value}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {/* Monthly Breakdown */}
          <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
            <Typography fontWeight="bold" mb={2}>Monthly Breakdown</Typography>
            <Grid container spacing={1}>
              {att.monthly?.map((m, i) => (
                <Grid item xs={6} sm={4} md={3} key={i}>
                  <Box p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
                    <Typography fontWeight="bold" fontSize={13}>{new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                      <Chip label={`P: ${m.present}`} size="small" color="success" variant="outlined" />
                      <Chip label={`A: ${m.absent}`} size="small" color="error" variant="outlined" />
                      <Chip label={`${m.total > 0 ? Math.round(m.present / m.total * 100) : 0}%`} size="small" />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
          {/* Recent Records */}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#263238' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {att.recent?.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small"
                        color={r.status === 'present' ? 'success' : r.status === 'absent' ? 'error' : r.status === 'late' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell><Typography fontSize={12} color="text.secondary">{r.remarks || '-'}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ======== FEES DETAIL ======== */}
      {section === 'fees' && (
        <Box>
          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Fee', value: `₹${(fees.total_fee || 0).toLocaleString()}`, bg: 'linear-gradient(135deg, #1565c0, #42a5f5)' },
              { label: 'Paid', value: `₹${(fees.total_paid || 0).toLocaleString()}`, bg: 'linear-gradient(135deg, #2e7d32, #66bb6a)' },
              { label: 'Pending', value: `₹${(fees.total_pending || 0).toLocaleString()}`, bg: fees.total_pending > 0 ? 'linear-gradient(135deg, #e65100, #ff9800)' : 'linear-gradient(135deg, #2e7d32, #66bb6a)' },
              { label: 'Overdue', value: fees.overdue_count || 0, bg: fees.overdue_count > 0 ? 'linear-gradient(135deg, #b71c1c, #f44336)' : 'linear-gradient(135deg, #2e7d32, #66bb6a)' },
            ].map((s, i) => (
              <Grid item xs={3} key={i}>
                <Paper sx={{ p: 2, borderRadius: 3, background: s.bg, color: 'white', textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {/* Installments */}
          <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
            <Typography fontWeight="bold" mb={2}>Installments</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#263238' }}>
                    <TableCell sx={{ color: 'white' }}>#</TableCell>
                    <TableCell sx={{ color: 'white' }}>Due Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Amount</TableCell>
                    <TableCell sx={{ color: 'white' }}>Paid</TableCell>
                    <TableCell sx={{ color: 'white' }}>Balance</TableCell>
                    <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fees.installments?.map((inst, i) => (
                    <TableRow key={i} hover sx={{ bgcolor: inst.status === 'overdue' ? '#fff3e0' : inst.status === 'paid' ? '#e8f5e9' : 'inherit' }}>
                      <TableCell>{inst.installment_no}</TableCell>
                      <TableCell>{inst.due_date ? new Date(inst.due_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell fontWeight="bold">₹{inst.amount?.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'green' }}>₹{inst.paid_amount?.toLocaleString()}</TableCell>
                      <TableCell sx={{ color: inst.balance > 0 ? 'red' : 'green', fontWeight: 'bold' }}>₹{inst.balance?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={inst.status} size="small"
                          color={inst.status === 'paid' ? 'success' : inst.status === 'overdue' ? 'error' : inst.status === 'partial' ? 'warning' : 'default'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {/* Recent Payments */}
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight="bold" mb={2}>Payment History</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#263238' }}>
                    <TableCell sx={{ color: 'white' }}>Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Amount</TableCell>
                    <TableCell sx={{ color: 'white' }}>Mode</TableCell>
                    <TableCell sx={{ color: 'white' }}>Transaction ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fees.recent_payments?.map((p, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>₹{p.total_amount?.toLocaleString()}</TableCell>
                      <TableCell><Chip label={p.payment_mode} size="small" variant="outlined" /></TableCell>
                      <TableCell><Typography fontSize={12} color="text.secondary">{p.transaction_id || '-'}</Typography></TableCell>
                    </TableRow>
                  ))}
                  {!fees.recent_payments?.length && <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary" py={2}>No payments yet</Typography></TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* ======== EXAMS & RESULTS ======== */}
      {section === 'exams' && (
        <Box>
          {exams.results_by_exam?.length ? exams.results_by_exam.map((exam, i) => (
            <Paper key={i} sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmojiEvents color="warning" />
                  <Typography variant="h6" fontWeight="bold">{exam.exam}</Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">{exam.obtained}/{exam.total_marks}</Typography>
                  <Chip label={`${exam.percentage}%`} color={exam.percentage >= 60 ? 'success' : exam.percentage >= 33 ? 'warning' : 'error'} sx={{ fontWeight: 'bold' }} />
                </Box>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Marks</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Max</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>%</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exam.subjects?.map((sub, j) => (
                      <TableRow key={j} hover>
                        <TableCell fontWeight={500}>{sub.subject?.name || 'N/A'}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: sub.is_absent ? 'error.main' : 'inherit' }}>
                          {sub.is_absent ? 'AB' : sub.marks_obtained ?? '-'}
                        </TableCell>
                        <TableCell>{sub.max_marks || '-'}</TableCell>
                        <TableCell>{sub.percentage ? `${sub.percentage}%` : '-'}</TableCell>
                        <TableCell><Chip label={sub.grade || '-'} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          {sub.is_absent ? <Chip label="Absent" size="small" color="error" /> :
                           sub.marks_obtained >= sub.passing_marks ? <Chip label="Pass" size="small" color="success" /> :
                           <Chip label="Fail" size="small" color="error" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )) : <Alert severity="info">No exam results available yet</Alert>}

          {exams.report_cards?.length > 0 && (
            <Paper sx={{ p: 2, borderRadius: 3, mt: 2 }}>
              <Typography fontWeight="bold" mb={2}>Report Cards</Typography>
              <Grid container spacing={2}>
                {exams.report_cards.map((rc, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography fontWeight="bold">{rc.exam_name || rc.title || 'Report Card'}</Typography>
                        <Typography variant="body2" color="text.secondary">{rc.academic_year || ''}</Typography>
                        {rc.total_percentage && <Chip label={`${rc.total_percentage}%`} size="small" color="primary" sx={{ mt: 1 }} />}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
        </Box>
      )}

      {/* ======== TIMETABLE ======== */}
      {section === 'timetable' && (
        <Box>
          {child.timetable?.length ? (() => {
            const byDay = {};
            child.timetable.forEach(t => {
              const day = t.day_of_week || t.day;
              if (!byDay[day]) byDay[day] = [];
              byDay[day].push(t);
            });
            return (
              <Grid container spacing={2}>
                {Object.entries(byDay).sort(([a], [b]) => a - b).map(([day, periods]) => (
                  <Grid item xs={12} md={6} key={day}>
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ p: 1.5, bgcolor: '#1565c0', color: 'white' }}>
                        <Typography fontWeight="bold">{DAY_NAMES[day] || `Day ${day}`}</Typography>
                      </Box>
                      {periods.sort((a, b) => (a.period_no || 0) - (b.period_no || 0)).map((p, i) => (
                        <Box key={i} display="flex" alignItems="center" p={1.5} borderBottom="1px solid #f0f0f0">
                          <Chip label={`P${p.period_no}`} size="small" color="primary" sx={{ mr: 2, minWidth: 40 }} />
                          <Box flex={1}>
                            <Typography fontSize={14} fontWeight={600}>{p.subject_name || p.subject?.name || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">{p.teacher_name || ''} • {p.start_time || ''} - {p.end_time || ''}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            );
          })() : <Alert severity="info">No timetable available</Alert>}
        </Box>
      )}

      {/* ======== HOMEWORK ======== */}
      {section === 'homework' && (
        <Box>
          {child.homework?.length ? (
            <Grid container spacing={2}>
              {child.homework.map((hw, i) => {
                const isOverdue = hw.due_date && new Date(hw.due_date) < new Date();
                return (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card sx={{ borderRadius: 3, border: isOverdue ? '2px solid #f44336' : '1px solid #e0e0e0' }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography fontWeight="bold" fontSize={14}>{hw.title || hw.subject_name || 'Homework'}</Typography>
                          {isOverdue && <Chip label="Overdue" size="small" color="error" />}
                        </Box>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>{hw.description || ''}</Typography>
                        {hw.due_date && (
                          <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                            <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Due: {new Date(hw.due_date).toLocaleDateString('en-IN')}
                            </Typography>
                          </Box>
                        )}
                        {hw.subject_name && <Chip label={hw.subject_name} size="small" variant="outlined" sx={{ mt: 1 }} />}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : <Alert severity="info">No homework assigned</Alert>}
        </Box>
      )}

      {/* ======== LIBRARY ======== */}
      {section === 'library' && (
        <Box>
          {child.library?.length ? (
            <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#263238' }}>
                    <TableCell sx={{ color: 'white' }}>Book</TableCell>
                    <TableCell sx={{ color: 'white' }}>Issue Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Due Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Return Date</TableCell>
                    <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {child.library.map((b, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography fontWeight={500} fontSize={13}>{b.book_title || b.book?.title || 'Book'}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.book_author || b.book?.author || ''}</Typography>
                      </TableCell>
                      <TableCell>{b.issue_date ? new Date(b.issue_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell>{b.due_date ? new Date(b.due_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell>{b.return_date ? new Date(b.return_date).toLocaleDateString('en-IN') : '-'}</TableCell>
                      <TableCell>
                        <Chip label={b.status || (b.return_date ? 'Returned' : 'Issued')} size="small"
                          color={b.return_date ? 'success' : 'warning'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : <Alert severity="info">No library records</Alert>}
        </Box>
      )}

      {/* ======== HEALTH ======== */}
      {section === 'health' && (
        <Box>
          {child.medical_conditions && (
            <Alert severity="warning" sx={{ mb: 2 }}>Medical Conditions: {child.medical_conditions}</Alert>
          )}
          {child.allergies && (
            <Alert severity="error" sx={{ mb: 2 }}>Allergies: {child.allergies}</Alert>
          )}
          {child.health?.length ? (
            <Grid container spacing={2}>
              {child.health.map((h, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography fontWeight="bold" fontSize={14}>{h.record_type || h.type || 'Health Record'}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{h.description || h.notes || ''}</Typography>
                      {h.record_date && <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {new Date(h.record_date).toLocaleDateString('en-IN')}
                      </Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : <Alert severity="info">No health records available</Alert>}
        </Box>
      )}

      {/* ======== TRANSPORT ======== */}
      {section === 'transport' && (
        <Box>
          {child.transport ? (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <DirectionsBus sx={{ fontSize: 40, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">Transport Details</Typography>
              </Box>
              <Grid container spacing={2}>
                {Object.entries(child.transport).filter(([k]) => !['id', 'student_id', 'school_id'].includes(k)).map(([key, val]) => (
                  val && <Grid item xs={6} sm={4} md={3} key={key}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</Typography>
                    <Typography fontSize={14} fontWeight={500}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ) : (
            <Alert severity="info">
              Transport mode: <strong>{child.transport_mode || 'Self'}</strong> — No transport assignment found
            </Alert>
          )}
        </Box>
      )}

      {/* ======== ACTIVITIES ======== */}
      {section === 'activities' && (
        <Box>
          {child.activities?.length ? (
            <Grid container spacing={2}>
              {child.activities.map((a, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography fontWeight="bold" fontSize={14}>{a.title || a.activity_type || 'Activity'}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{a.description || ''}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {a.activity_date ? new Date(a.activity_date).toLocaleDateString('en-IN') : a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : <Alert severity="info">No activities posted yet</Alert>}
        </Box>
      )}
    </Box>
  );
}


export default function Parents() {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: 'Dashboard', icon: <TrendingUp /> },
    { label: 'My Child 360°', icon: <School /> },
    { label: 'Profiles', icon: <People /> },
    { label: 'PTM', icon: <EventNote /> },
    { label: 'Surveys', icon: <Feedback /> },
    { label: 'Grievances', icon: <Report /> },
    { label: 'Consent', icon: <Description /> },
    { label: 'Messages', icon: <Message /> },
    { label: 'Activities', icon: <Notifications /> },
    { label: 'Volunteers', icon: <VolunteerActivism /> },
    { label: 'Pickup', icon: <DirectionsCar /> },
    { label: 'Notifications', icon: <Notifications /> },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Parent Engagement
      </Typography>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {tabs.map((t, i) => (
            <Tab key={i} icon={t.icon} label={t.label} iconPosition="start" sx={{ minHeight: 48 }} />
          ))}
        </Tabs>
      </Paper>
      {tab === 0 && <DashboardTab />}
      {tab === 1 && <ChildViewTab />}
      {tab === 2 && <ProfilesTab />}
      {tab === 3 && <PTMTab />}
      {tab === 4 && <SurveysTab />}
      {tab === 5 && <GrievancesTab />}
      {tab === 6 && <ConsentTab />}
      {tab === 7 && <MessagesTab />}
      {tab === 8 && <ActivitiesTab />}
      {tab === 9 && <VolunteersTab />}
      {tab === 10 && <PickupTab />}
      {tab === 11 && <NotificationsTab />}
    </Box>
  );
}
