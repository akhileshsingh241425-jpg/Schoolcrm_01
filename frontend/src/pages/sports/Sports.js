import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Grid, Card, CardContent,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, MenuItem, Alert, Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Refresh, SportsBasketball, Groups, EmojiEvents, Event as EventIcon, MeetingRoom, FitnessCenter, WorkspacePremium, SportsSoccer } from '@mui/icons-material';
import { sportsAPI } from '../../services/api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

export default function Sports() {
  const [tab, setTab] = useState(0);
  const [dashboard, setDashboard] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { loadDashboard(); }, []);
  const loadDashboard = async () => {
    try { const r = await sportsAPI.getDashboard(); setDashboard(r.data.data || {}); } catch(e) {}
  };
  const showMsg = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const stats = [
    { label: 'Sports', value: dashboard.total_sports || 0, icon: <SportsBasketball />, color: '#e91e63' },
    { label: 'Teams', value: dashboard.total_teams || 0, icon: <Groups />, color: '#9c27b0' },
    { label: 'Upcoming Tournaments', value: dashboard.upcoming_tournaments || 0, icon: <EmojiEvents />, color: '#2196f3' },
    { label: 'Ongoing Tournaments', value: dashboard.ongoing_tournaments || 0, icon: <EmojiEvents />, color: '#ff9800' },
    { label: 'Clubs', value: dashboard.total_clubs || 0, icon: <Groups />, color: '#4caf50' },
    { label: 'Club Members', value: dashboard.total_members || 0, icon: <Groups />, color: '#00bcd4' },
    { label: 'Upcoming Events', value: dashboard.upcoming_events || 0, icon: <EventIcon />, color: '#f44336' },
    { label: 'Pending Bookings', value: dashboard.pending_bookings || 0, icon: <MeetingRoom />, color: '#607d8b' },
    { label: 'Certificates', value: dashboard.total_certificates || 0, icon: <WorkspacePremium />, color: '#795548' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>Sports & Extra-Curricular</Typography>
      <Grid container spacing={2} mb={3}>
        {stats.map((s, i) => (
          <Grid item xs={6} sm={3} md={2.4} key={i}>
            <Card sx={{ background: `linear-gradient(135deg, ${s.color}15, ${s.color}30)`, border: `1px solid ${s.color}40`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${s.color}30` } }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1, color: s.color }}>{s.icon}</Box>
                <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Sports" icon={<SportsSoccer />} iconPosition="start" />
          <Tab label="Teams" icon={<Groups />} iconPosition="start" />
          <Tab label="Tournaments" icon={<EmojiEvents />} iconPosition="start" />
          <Tab label="Clubs" icon={<Groups />} iconPosition="start" />
          <Tab label="Events" icon={<EventIcon />} iconPosition="start" />
          <Tab label="Bookings" icon={<MeetingRoom />} iconPosition="start" />
          <Tab label="Fitness" icon={<FitnessCenter />} iconPosition="start" />
          <Tab label="Certificates" icon={<WorkspacePremium />} iconPosition="start" />
        </Tabs>
      </Paper>
      <TabPanel value={tab} index={0}><SportsTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={1}><TeamsTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={2}><TournamentsTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={3}><ClubsTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={4}><EventsTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={5}><BookingsTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={6}><FitnessTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={7}><CertificatesTab showMsg={showMsg} /></TabPanel>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== SPORTS TAB ====================
function SportsTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listSports(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateSport(editing, form); showMsg('Sport updated'); }
      else { await sportsAPI.createSport(form); showMsg('Sport created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteSport(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Sports</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Sport</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Season</TableCell>
        <TableCell>Max Team Size</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.name}</TableCell>
          <TableCell><Chip label={i.category || 'N/A'} size="small" /></TableCell>
          <TableCell>{i.season || '-'}</TableCell>
          <TableCell>{i.max_team_size}</TableCell>
          <TableCell><Chip label={i.is_active ? 'Active' : 'Inactive'} color={i.is_active ? 'success' : 'default'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={6} align="center">No sports</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Sport' : 'Add Sport'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField fullWidth label="Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Category" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})}>
            {['indoor', 'outdoor', 'water', 'athletics'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Season" value={form.season || ''} onChange={e => setForm({...form, season: e.target.value})}>
            {['summer', 'winter', 'year-round'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Max Team Size" type="number" value={form.max_team_size || '15'} onChange={e => setForm({...form, max_team_size: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Practice Schedule" value={form.practice_schedule || ''} onChange={e => setForm({...form, practice_schedule: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== TEAMS TAB ====================
function TeamsTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listTeams(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateTeam(editing, form); showMsg('Team updated'); }
      else { await sportsAPI.createTeam(form); showMsg('Team created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteTeam(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Teams</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Team</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Name</TableCell><TableCell>Sport</TableCell><TableCell>Age Group</TableCell>
        <TableCell>Year</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.name}</TableCell><TableCell>{i.sport_id || '-'}</TableCell>
          <TableCell>{i.age_group || '-'}</TableCell><TableCell>{i.academic_year || '-'}</TableCell>
          <TableCell><Chip label={i.is_active ? 'Active' : 'Inactive'} color={i.is_active ? 'success' : 'default'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={6} align="center">No teams</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Team' : 'Add Team'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField fullWidth label="Team Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Sport ID" type="number" value={form.sport_id || ''} onChange={e => setForm({...form, sport_id: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Age Group" value={form.age_group || ''} onChange={e => setForm({...form, age_group: e.target.value})}>
            {['U-10', 'U-14', 'U-17', 'Senior'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Academic Year" value={form.academic_year || ''} onChange={e => setForm({...form, academic_year: e.target.value})} placeholder="2025-26" /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Captain ID" type="number" value={form.captain_id || ''} onChange={e => setForm({...form, captain_id: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Coach ID" type="number" value={form.coach_id || ''} onChange={e => setForm({...form, coach_id: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Achievements" multiline rows={2} value={form.achievements || ''} onChange={e => setForm({...form, achievements: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== TOURNAMENTS TAB ====================
function TournamentsTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listTournaments(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateTournament(editing, form); showMsg('Tournament updated'); }
      else { await sportsAPI.createTournament(form); showMsg('Tournament created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteTournament(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };
  const statusColors = { upcoming: 'info', ongoing: 'warning', completed: 'success', cancelled: 'error' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Tournaments</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Tournament</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Dates</TableCell>
        <TableCell>Venue</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.name}</TableCell>
          <TableCell><Chip label={i.tournament_type || 'N/A'} size="small" /></TableCell>
          <TableCell>{i.start_date} - {i.end_date || '...'}</TableCell>
          <TableCell>{i.venue || '-'}</TableCell>
          <TableCell><Chip label={i.status} color={statusColors[i.status] || 'default'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={6} align="center">No tournaments</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Tournament' : 'Add Tournament'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField fullWidth label="Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Type" value={form.tournament_type || ''} onChange={e => setForm({...form, tournament_type: e.target.value})}>
            {['inter-school', 'intra-school', 'district', 'state', 'national'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Venue" value={form.venue || ''} onChange={e => setForm({...form, venue: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Organizer" value={form.organizer || ''} onChange={e => setForm({...form, organizer: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Status" value={form.status || 'upcoming'} onChange={e => setForm({...form, status: e.target.value})}>
            {['upcoming', 'ongoing', 'completed', 'cancelled'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={12}><TextField fullWidth label="Remarks" multiline rows={2} value={form.remarks || ''} onChange={e => setForm({...form, remarks: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== CLUBS TAB ====================
function ClubsTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listClubs(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateClub(editing, form); showMsg('Club updated'); }
      else { await sportsAPI.createClub(form); showMsg('Club created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteClub(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Clubs & Activities</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Club</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Schedule</TableCell>
        <TableCell>Max Members</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.name}</TableCell>
          <TableCell><Chip label={i.category || 'N/A'} size="small" /></TableCell>
          <TableCell>{i.meeting_schedule || '-'}</TableCell>
          <TableCell>{i.max_members}</TableCell>
          <TableCell><Chip label={i.is_active ? 'Active' : 'Inactive'} color={i.is_active ? 'success' : 'default'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={6} align="center">No clubs</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Club' : 'Add Club'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField fullWidth label="Club Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Category" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})}>
            {['literary', 'science', 'arts', 'cultural', 'social'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Advisor ID" type="number" value={form.advisor_id || ''} onChange={e => setForm({...form, advisor_id: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Max Members" type="number" value={form.max_members || '50'} onChange={e => setForm({...form, max_members: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Meeting Schedule" value={form.meeting_schedule || ''} onChange={e => setForm({...form, meeting_schedule: e.target.value})} placeholder="e.g. Every Wednesday 3-4 PM" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== EVENTS TAB ====================
function EventsTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listEvents(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateEvent(editing, form); showMsg('Event updated'); }
      else { await sportsAPI.createEvent(form); showMsg('Event created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteEvent(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };
  const statusColors = { planning: 'info', approved: 'primary', ongoing: 'warning', completed: 'success', cancelled: 'error' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Events</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Event</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Dates</TableCell>
        <TableCell>Venue</TableCell><TableCell>Budget</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.name}</TableCell>
          <TableCell><Chip label={i.event_type || 'N/A'} size="small" /></TableCell>
          <TableCell>{i.start_date} - {i.end_date || '...'}</TableCell>
          <TableCell>{i.venue || '-'}</TableCell>
          <TableCell>₹{i.budget || 0}</TableCell>
          <TableCell><Chip label={i.status} color={statusColors[i.status] || 'default'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={7} align="center">No events</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Event' : 'Add Event'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField fullWidth label="Event Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Type" value={form.event_type || ''} onChange={e => setForm({...form, event_type: e.target.value})}>
            {['academic', 'cultural', 'sports', 'social', 'annual'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={form.start_date || ''} onChange={e => setForm({...form, start_date: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={form.end_date || ''} onChange={e => setForm({...form, end_date: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Venue" value={form.venue || ''} onChange={e => setForm({...form, venue: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Budget" type="number" value={form.budget || ''} onChange={e => setForm({...form, budget: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== BOOKINGS TAB ====================
function BookingsTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listBookings(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateBooking(editing, form); showMsg('Booking updated'); }
      else { await sportsAPI.createBooking(form); showMsg('Booking created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteBooking(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };
  const statusColors = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Facility Bookings</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Book Facility</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Facility</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell>
        <TableCell>Time</TableCell><TableCell>Purpose</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.facility_name}</TableCell>
          <TableCell><Chip label={i.facility_type || 'N/A'} size="small" /></TableCell>
          <TableCell>{i.booking_date}</TableCell>
          <TableCell>{i.start_time} - {i.end_time}</TableCell>
          <TableCell>{i.purpose || '-'}</TableCell>
          <TableCell><Chip label={i.status} color={statusColors[i.status] || 'default'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={7} align="center">No bookings</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Booking' : 'Book Facility'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Facility Name" value={form.facility_name || ''} onChange={e => setForm({...form, facility_name: e.target.value})} required /></Grid>
          <Grid item xs={12} sm={6}><TextField select fullWidth label="Facility Type" value={form.facility_type || ''} onChange={e => setForm({...form, facility_type: e.target.value})}>
            {['court', 'pool', 'lab', 'hall', 'ground', 'auditorium'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.booking_date || ''} onChange={e => setForm({...form, booking_date: e.target.value})} required /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Start Time" value={form.start_time || ''} onChange={e => setForm({...form, start_time: e.target.value})} placeholder="09:00 AM" /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="End Time" value={form.end_time || ''} onChange={e => setForm({...form, end_time: e.target.value})} placeholder="10:00 AM" /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Purpose" value={form.purpose || ''} onChange={e => setForm({...form, purpose: e.target.value})} /></Grid>
          {editing && <Grid item xs={6}><TextField select fullWidth label="Status" value={form.status || 'pending'} onChange={e => setForm({...form, status: e.target.value})}>
            {['pending', 'approved', 'rejected', 'cancelled'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>}
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== FITNESS TAB ====================
function FitnessTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listFitness(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateFitness(editing, form); showMsg('Record updated'); }
      else { await sportsAPI.createFitness(form); showMsg('Record created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteFitness(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Fitness Records</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Record</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Student</TableCell><TableCell>Test Date</TableCell><TableCell>Height</TableCell>
        <TableCell>Weight</TableCell><TableCell>BMI</TableCell><TableCell>50m Sprint</TableCell><TableCell>Grade</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.student_id}</TableCell>
          <TableCell>{i.test_date || '-'}</TableCell>
          <TableCell>{i.height || '-'}</TableCell>
          <TableCell>{i.weight || '-'}</TableCell>
          <TableCell>{i.bmi || '-'}</TableCell>
          <TableCell>{i.sprint_50m || '-'}</TableCell>
          <TableCell><Chip label={i.overall_grade || 'N/A'} color={['A', 'B'].includes(i.overall_grade) ? 'success' : 'warning'} size="small" /></TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={8} align="center">No records</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Fitness Record' : 'Add Fitness Record'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Student ID" type="number" value={form.student_id || ''} onChange={e => setForm({...form, student_id: e.target.value})} required /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Test Date" type="date" InputLabelProps={{ shrink: true }} value={form.test_date || ''} onChange={e => setForm({...form, test_date: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Height (cm)" type="number" value={form.height || ''} onChange={e => setForm({...form, height: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Weight (kg)" type="number" value={form.weight || ''} onChange={e => setForm({...form, weight: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="BMI" type="number" value={form.bmi || ''} onChange={e => setForm({...form, bmi: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="50m Sprint" value={form.sprint_50m || ''} onChange={e => setForm({...form, sprint_50m: e.target.value})} placeholder="e.g. 8.5s" /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Long Jump" value={form.long_jump || ''} onChange={e => setForm({...form, long_jump: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Flexibility" value={form.flexibility || ''} onChange={e => setForm({...form, flexibility: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Endurance" value={form.endurance || ''} onChange={e => setForm({...form, endurance: e.target.value})} /></Grid>
          <Grid item xs={6} sm={4}><TextField select fullWidth label="Overall Grade" value={form.overall_grade || ''} onChange={e => setForm({...form, overall_grade: e.target.value})}>
            {['A', 'B', 'C', 'D'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Academic Year" value={form.academic_year || ''} onChange={e => setForm({...form, academic_year: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Remarks" multiline rows={2} value={form.remarks || ''} onChange={e => setForm({...form, remarks: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== CERTIFICATES TAB ====================
function CertificatesTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => { try { const r = await sportsAPI.listCertificates(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {} };
  const handleSave = async () => {
    try {
      if (editing) { await sportsAPI.updateCertificate(editing, form); showMsg('Certificate updated'); }
      else { await sportsAPI.createCertificate(form); showMsg('Certificate created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await sportsAPI.deleteCertificate(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); } };
  const posColors = { '1st': 'warning', '2nd': 'info', '3rd': 'success', participant: 'default' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Certificates</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Issue Certificate</Button></Box>
      </Box>
      <TableContainer component={Paper}><Table><TableHead><TableRow>
        <TableCell>Student</TableCell><TableCell>Type</TableCell><TableCell>Event</TableCell>
        <TableCell>Position</TableCell><TableCell>Date</TableCell><TableCell>Actions</TableCell>
      </TableRow></TableHead><TableBody>
        {items.map(i => (<TableRow key={i.id}>
          <TableCell>{i.student_id}</TableCell>
          <TableCell><Chip label={i.certificate_type || 'N/A'} size="small" /></TableCell>
          <TableCell>{i.event_name || '-'}</TableCell>
          <TableCell><Chip label={i.position || 'N/A'} color={posColors[i.position] || 'default'} size="small" /></TableCell>
          <TableCell>{i.issued_date || '-'}</TableCell>
          <TableCell>
            <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
            <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
          </TableCell>
        </TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={6} align="center">No certificates</TableCell></TableRow>}
      </TableBody></Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Certificate' : 'Issue Certificate'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}><TextField fullWidth label="Student ID" type="number" value={form.student_id || ''} onChange={e => setForm({...form, student_id: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Type" value={form.certificate_type || ''} onChange={e => setForm({...form, certificate_type: e.target.value})}>
            {['participation', 'winner', 'merit', 'appreciation'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Event Name" value={form.event_name || ''} onChange={e => setForm({...form, event_name: e.target.value})} /></Grid>
          <Grid item xs={6}><TextField select fullWidth label="Position" value={form.position || ''} onChange={e => setForm({...form, position: e.target.value})}>
            {['1st', '2nd', '3rd', 'participant'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField></Grid>
          <Grid item xs={6}><TextField fullWidth label="Issued Date" type="date" InputLabelProps={{ shrink: true }} value={form.issued_date || ''} onChange={e => setForm({...form, issued_date: e.target.value})} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}
