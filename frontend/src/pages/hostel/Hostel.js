import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Tabs, Tab, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Chip, Grid, Card,
  CardContent, TablePagination, Alert, Snackbar, Select, FormControl,
  InputLabel
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { hostelAPI } from '../../services/api';

const ex = (d) => d?.data?.data?.items || d?.data?.data || d?.data?.items || [];
const init = (fields) => fields.reduce((a, f) => ({ ...a, [f]: '' }), {});

function F({ label, name, form, setForm, ...props }) {
  return <TextField fullWidth margin="dense" size="small" label={label} value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} {...props} />;
}
function Sel({ label, name, form, setForm, options, ...props }) {
  return <TextField fullWidth margin="dense" size="small" select label={label} value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} {...props}>
    {options.map(o => <MenuItem key={o.value || o} value={o.value || o}>{o.label || o}</MenuItem>)}
  </TextField>;
}
const statColor = (s) => {
  const m = { active: 'success', available: 'success', present: 'success', approved: 'success', completed: 'success', resolved: 'success', checked_out: 'info', full: 'warning', pending: 'warning', open: 'warning', in_progress: 'info', checked_in: 'primary', vacated: 'default', rejected: 'error', closed: 'default', maintenance: 'error', urgent: 'error', high: 'error', medium: 'warning', low: 'info' };
  return m[s] || 'default';
};

export default function Hostel() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState([]);
  const [dash, setDash] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const load = useCallback(async () => {
    try {
      const helpers = async () => {
        try {
          const [b, r] = await Promise.all([hostelAPI.listBlocks({ per_page: 100 }), hostelAPI.listRooms({ per_page: 100 })]);
          setBlocks(ex(b)); setRooms(ex(r));
        } catch (e) {}
      };
      if (tab === 0) {
        const r = await hostelAPI.getDashboard();
        setDash(r?.data?.data || {});
        await helpers();
      } else {
        await helpers();
        const apis = [null, hostelAPI.listBlocks, hostelAPI.listRooms, hostelAPI.listAllocations, hostelAPI.listMessMenu, hostelAPI.listMessAttendance, hostelAPI.listOutpass, hostelAPI.listVisitors, hostelAPI.listComplaints, hostelAPI.listInspections];
        if (apis[tab]) { const r = await apis[tab]({ page: page + 1 }); setData(ex(r)); }
      }
    } catch (e) { showSnack('Error loading data', 'error'); }
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (item = null) => {
    const fields = [
      [],
      ['name', 'code', 'block_type', 'warden_id', 'total_floors', 'description', 'address', 'contact_number'],
      ['block_id', 'room_number', 'floor', 'room_type', 'capacity', 'amenities', 'monthly_rent', 'status'],
      ['student_id', 'room_id', 'bed_number', 'allocation_date', 'status', 'remarks'],
      ['day_of_week', 'meal_type', 'menu_items', 'special_diet', 'calories'],
      ['student_id', 'date', 'meal_type', 'status', 'remarks'],
      ['student_id', 'outpass_type', 'reason', 'from_date', 'to_date', 'destination', 'guardian_contact', 'status'],
      ['student_id', 'visitor_name', 'relation', 'contact_number', 'id_proof_type', 'id_proof_number', 'visit_date', 'purpose', 'status'],
      ['student_id', 'complaint_type', 'subject', 'description', 'priority', 'status', 'resolution'],
      ['room_id', 'inspection_date', 'inspection_type', 'cleanliness_score', 'maintenance_score', 'discipline_score', 'overall_score', 'findings', 'action_taken', 'status'],
    ];
    if (item) { setForm(item); setEditId(item.id); }
    else { setForm(init(fields[tab])); setEditId(null); }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const apis = [null,
        { create: hostelAPI.createBlock, update: hostelAPI.updateBlock },
        { create: hostelAPI.createRoom, update: hostelAPI.updateRoom },
        { create: hostelAPI.createAllocation, update: hostelAPI.updateAllocation },
        { create: hostelAPI.createMessMenu, update: hostelAPI.updateMessMenu },
        { create: hostelAPI.createMessAttendance, update: hostelAPI.updateMessAttendance },
        { create: hostelAPI.createOutpass, update: hostelAPI.updateOutpass },
        { create: hostelAPI.createVisitor, update: hostelAPI.updateVisitor },
        { create: hostelAPI.createComplaint, update: hostelAPI.updateComplaint },
        { create: hostelAPI.createInspection, update: hostelAPI.updateInspection },
      ];
      if (editId) await apis[tab].update(editId, form);
      else await apis[tab].create(form);
      setOpen(false); load();
      showSnack(editId ? 'Updated successfully' : 'Created successfully');
    } catch (e) { showSnack(e?.response?.data?.message || 'Error saving', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const apis = [null, hostelAPI.deleteBlock, hostelAPI.deleteRoom, hostelAPI.deleteAllocation, hostelAPI.deleteMessMenu, null, hostelAPI.deleteOutpass, hostelAPI.deleteVisitor, hostelAPI.deleteComplaint, hostelAPI.deleteInspection];
      if (apis[tab]) await apis[tab](id);
      load(); showSnack('Deleted successfully');
    } catch (e) { showSnack('Error deleting', 'error'); }
  };

  const tabLabels = ['Dashboard', 'Blocks', 'Rooms', 'Allocations', 'Mess Menu', 'Mess Attendance', 'Outpass', 'Visitors', 'Complaints', 'Inspections'];

  const renderDashboard = () => {
    const stats = [
      { label: 'Total Blocks', value: dash.total_blocks, color: '#6366f1' },
      { label: 'Total Rooms', value: dash.total_rooms, color: '#388e3c' },
      { label: 'Total Beds', value: dash.total_beds, color: '#f57c00' },
      { label: 'Occupied Beds', value: dash.occupied_beds, color: '#d32f2f' },
      { label: 'Available Beds', value: dash.available_beds, color: '#7b1fa2' },
      { label: 'Pending Outpass', value: dash.pending_outpass, color: '#0288d1' },
      { label: 'Open Complaints', value: dash.open_complaints, color: '#c62828' },
      { label: 'Active Visitors', value: dash.active_visitors, color: '#00838f' },
      { label: 'Total Inspections', value: dash.total_inspections, color: '#4e342e' },
      { label: 'Menu Items', value: dash.total_menu_items, color: '#558b2f' },
    ];
    return (
      <Grid container spacing={2}>
        {stats.map((s, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={i}>
            <Card sx={{ borderLeft: `4px solid ${s.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${s.color}22` } }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color={s.color}>{s.value ?? 0}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderBlocks = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Name</TableCell><TableCell>Code</TableCell><TableCell>Type</TableCell>
          <TableCell>Floors</TableCell><TableCell>Contact</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.name}</TableCell><TableCell>{r.code}</TableCell>
            <TableCell><Chip label={r.block_type} size="small" /></TableCell>
            <TableCell>{r.total_floors}</TableCell><TableCell>{r.contact_number}</TableCell>
            <TableCell><Chip label={r.is_active ? 'Active' : 'Inactive'} color={r.is_active ? 'success' : 'default'} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderRooms = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Room #</TableCell><TableCell>Block</TableCell><TableCell>Floor</TableCell>
          <TableCell>Type</TableCell><TableCell>Capacity</TableCell><TableCell>Occupancy</TableCell>
          <TableCell>Rent</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.room_number}</TableCell><TableCell>{r.block_name}</TableCell>
            <TableCell>{r.floor}</TableCell>
            <TableCell><Chip label={r.room_type} size="small" /></TableCell>
            <TableCell>{r.capacity}</TableCell><TableCell>{r.current_occupancy || 0}</TableCell>
            <TableCell>₹{r.monthly_rent}</TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderAllocations = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Student</TableCell><TableCell>Room</TableCell><TableCell>Block</TableCell>
          <TableCell>Bed #</TableCell><TableCell>Alloc Date</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.student_name}</TableCell><TableCell>{r.room_number}</TableCell>
            <TableCell>{r.block_name}</TableCell><TableCell>{r.bed_number}</TableCell>
            <TableCell>{r.allocation_date}</TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderMessMenu = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Day</TableCell><TableCell>Meal</TableCell><TableCell>Menu Items</TableCell>
          <TableCell>Special Diet</TableCell><TableCell>Calories</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.day_of_week}</TableCell>
            <TableCell><Chip label={r.meal_type} size="small" /></TableCell>
            <TableCell>{r.menu_items}</TableCell><TableCell>{r.special_diet}</TableCell>
            <TableCell>{r.calories}</TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderMessAttendance = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Student</TableCell><TableCell>Date</TableCell><TableCell>Meal</TableCell>
          <TableCell>Status</TableCell><TableCell>Remarks</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.student_name}</TableCell><TableCell>{r.date}</TableCell>
            <TableCell><Chip label={r.meal_type} size="small" /></TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>{r.remarks}</TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderOutpass = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Student</TableCell><TableCell>Type</TableCell><TableCell>From</TableCell>
          <TableCell>To</TableCell><TableCell>Destination</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.student_name}</TableCell>
            <TableCell><Chip label={r.outpass_type} size="small" /></TableCell>
            <TableCell>{r.from_date?.slice(0, 10)}</TableCell><TableCell>{r.to_date?.slice(0, 10)}</TableCell>
            <TableCell>{r.destination}</TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderVisitors = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Visitor</TableCell><TableCell>Student</TableCell><TableCell>Relation</TableCell>
          <TableCell>Contact</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.visitor_name}</TableCell><TableCell>{r.student_name}</TableCell>
            <TableCell>{r.relation}</TableCell><TableCell>{r.contact_number}</TableCell>
            <TableCell>{r.visit_date}</TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderComplaints = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Student</TableCell><TableCell>Type</TableCell><TableCell>Subject</TableCell>
          <TableCell>Priority</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.student_name}</TableCell>
            <TableCell><Chip label={r.complaint_type} size="small" /></TableCell>
            <TableCell>{r.subject}</TableCell>
            <TableCell><Chip label={r.priority} color={statColor(r.priority)} size="small" /></TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderInspections = () => (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Room</TableCell><TableCell>Block</TableCell><TableCell>Date</TableCell>
          <TableCell>Type</TableCell><TableCell>Clean</TableCell><TableCell>Maint</TableCell>
          <TableCell>Overall</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {data.map(r => (<TableRow key={r.id}>
            <TableCell>{r.room_number}</TableCell><TableCell>{r.block_name}</TableCell>
            <TableCell>{r.inspection_date}</TableCell>
            <TableCell><Chip label={r.inspection_type} size="small" /></TableCell>
            <TableCell>{r.cleanliness_score}/10</TableCell><TableCell>{r.maintenance_score}/10</TableCell>
            <TableCell>{r.overall_score}/10</TableCell>
            <TableCell><Chip label={r.status} color={statColor(r.status)} size="small" /></TableCell>
            <TableCell>
              <IconButton size="small" onClick={() => handleOpen(r)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
            </TableCell>
          </TableRow>))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderDialog = () => {
    const blockOpts = blocks.map(b => ({ value: b.id, label: b.name }));
    const roomOpts = rooms.map(r => ({ value: r.id, label: `${r.room_number} - ${r.block_name || ''}` }));
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const meals = ['breakfast', 'lunch', 'snacks', 'dinner'];
    const titles = ['', 'Block', 'Room', 'Allocation', 'Mess Menu', 'Mess Attendance', 'Outpass', 'Visitor', 'Complaint', 'Inspection'];

    return (
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit' : 'Add'} {titles[tab]}</DialogTitle>
        <DialogContent>
          {tab === 1 && <>
            <F label="Name" name="name" form={form} setForm={setForm} required />
            <F label="Code" name="code" form={form} setForm={setForm} />
            <Sel label="Type" name="block_type" form={form} setForm={setForm} options={['boys', 'girls', 'mixed']} />
            <F label="Total Floors" name="total_floors" form={form} setForm={setForm} type="number" />
            <F label="Contact Number" name="contact_number" form={form} setForm={setForm} />
            <F label="Address" name="address" form={form} setForm={setForm} multiline rows={2} />
            <F label="Description" name="description" form={form} setForm={setForm} multiline rows={2} />
          </>}
          {tab === 2 && <>
            <Sel label="Block" name="block_id" form={form} setForm={setForm} options={blockOpts} required />
            <F label="Room Number" name="room_number" form={form} setForm={setForm} required />
            <F label="Floor" name="floor" form={form} setForm={setForm} type="number" />
            <Sel label="Room Type" name="room_type" form={form} setForm={setForm} options={['single', 'double', 'shared', 'dormitory']} />
            <F label="Capacity" name="capacity" form={form} setForm={setForm} type="number" />
            <F label="Monthly Rent" name="monthly_rent" form={form} setForm={setForm} type="number" />
            <F label="Amenities" name="amenities" form={form} setForm={setForm} multiline rows={2} />
            <Sel label="Status" name="status" form={form} setForm={setForm} options={['available', 'full', 'maintenance', 'closed']} />
          </>}
          {tab === 3 && <>
            <F label="Student ID" name="student_id" form={form} setForm={setForm} type="number" required />
            <Sel label="Room" name="room_id" form={form} setForm={setForm} options={roomOpts} required />
            <F label="Bed Number" name="bed_number" form={form} setForm={setForm} />
            <F label="Allocation Date" name="allocation_date" form={form} setForm={setForm} type="date" InputLabelProps={{ shrink: true }} required />
            {editId && <Sel label="Status" name="status" form={form} setForm={setForm} options={['active', 'vacated', 'transferred']} />}
            <F label="Remarks" name="remarks" form={form} setForm={setForm} multiline rows={2} />
          </>}
          {tab === 4 && <>
            <Sel label="Day" name="day_of_week" form={form} setForm={setForm} options={days} required />
            <Sel label="Meal Type" name="meal_type" form={form} setForm={setForm} options={meals} required />
            <F label="Menu Items" name="menu_items" form={form} setForm={setForm} multiline rows={3} required />
            <F label="Special Diet" name="special_diet" form={form} setForm={setForm} />
            <F label="Calories" name="calories" form={form} setForm={setForm} type="number" />
          </>}
          {tab === 5 && <>
            <F label="Student ID" name="student_id" form={form} setForm={setForm} type="number" required />
            <F label="Date" name="date" form={form} setForm={setForm} type="date" InputLabelProps={{ shrink: true }} required />
            <Sel label="Meal Type" name="meal_type" form={form} setForm={setForm} options={meals} required />
            <Sel label="Status" name="status" form={form} setForm={setForm} options={['present', 'absent', 'late']} />
            <F label="Remarks" name="remarks" form={form} setForm={setForm} />
          </>}
          {tab === 6 && <>
            <F label="Student ID" name="student_id" form={form} setForm={setForm} type="number" required />
            <Sel label="Outpass Type" name="outpass_type" form={form} setForm={setForm} options={['day', 'night', 'weekend', 'emergency']} />
            <F label="Reason" name="reason" form={form} setForm={setForm} multiline rows={2} required />
            <F label="From Date" name="from_date" form={form} setForm={setForm} type="datetime-local" InputLabelProps={{ shrink: true }} required />
            <F label="To Date" name="to_date" form={form} setForm={setForm} type="datetime-local" InputLabelProps={{ shrink: true }} required />
            <F label="Destination" name="destination" form={form} setForm={setForm} />
            <F label="Guardian Contact" name="guardian_contact" form={form} setForm={setForm} />
            {editId && <Sel label="Status" name="status" form={form} setForm={setForm} options={['pending', 'approved', 'rejected', 'expired', 'returned']} />}
          </>}
          {tab === 7 && <>
            <F label="Student ID" name="student_id" form={form} setForm={setForm} type="number" required />
            <F label="Visitor Name" name="visitor_name" form={form} setForm={setForm} required />
            <Sel label="Relation" name="relation" form={form} setForm={setForm} options={['Father', 'Mother', 'Guardian', 'Sibling', 'Relative', 'Other']} />
            <F label="Contact Number" name="contact_number" form={form} setForm={setForm} />
            <F label="ID Proof Type" name="id_proof_type" form={form} setForm={setForm} />
            <F label="ID Proof Number" name="id_proof_number" form={form} setForm={setForm} />
            <F label="Visit Date" name="visit_date" form={form} setForm={setForm} type="date" InputLabelProps={{ shrink: true }} required />
            <F label="Purpose" name="purpose" form={form} setForm={setForm} multiline rows={2} />
            {editId && <Sel label="Status" name="status" form={form} setForm={setForm} options={['checked_in', 'checked_out', 'cancelled']} />}
          </>}
          {tab === 8 && <>
            <F label="Student ID" name="student_id" form={form} setForm={setForm} type="number" required />
            <Sel label="Complaint Type" name="complaint_type" form={form} setForm={setForm} options={['maintenance', 'food', 'roommate', 'hygiene', 'other']} required />
            <F label="Subject" name="subject" form={form} setForm={setForm} required />
            <F label="Description" name="description" form={form} setForm={setForm} multiline rows={3} required />
            <Sel label="Priority" name="priority" form={form} setForm={setForm} options={['low', 'medium', 'high', 'urgent']} />
            {editId && <>
              <Sel label="Status" name="status" form={form} setForm={setForm} options={['open', 'in_progress', 'resolved', 'closed']} />
              <F label="Resolution" name="resolution" form={form} setForm={setForm} multiline rows={2} />
            </>}
          </>}
          {tab === 9 && <>
            <Sel label="Room" name="room_id" form={form} setForm={setForm} options={roomOpts} required />
            <F label="Inspection Date" name="inspection_date" form={form} setForm={setForm} type="date" InputLabelProps={{ shrink: true }} required />
            <Sel label="Type" name="inspection_type" form={form} setForm={setForm} options={['routine', 'surprise', 'night_round']} />
            <F label="Cleanliness Score (1-10)" name="cleanliness_score" form={form} setForm={setForm} type="number" />
            <F label="Maintenance Score (1-10)" name="maintenance_score" form={form} setForm={setForm} type="number" />
            <F label="Discipline Score (1-10)" name="discipline_score" form={form} setForm={setForm} type="number" />
            <F label="Overall Score (1-10)" name="overall_score" form={form} setForm={setForm} type="number" />
            <F label="Findings" name="findings" form={form} setForm={setForm} multiline rows={2} />
            <F label="Action Taken" name="action_taken" form={form} setForm={setForm} multiline rows={2} />
            <Sel label="Status" name="status" form={form} setForm={setForm} options={['completed', 'pending_action', 'follow_up']} />
          </>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const tabRenderers = [renderDashboard, renderBlocks, renderRooms, renderAllocations, renderMessMenu, renderMessAttendance, renderOutpass, renderVisitors, renderComplaints, renderInspections];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">Hostel Management</Typography>
        <Box>
          {tab > 0 && <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()} sx={{ mr: 1 }}>Add</Button>}
          <Button variant="outlined" startIcon={<Refresh />} onClick={load}>Refresh</Button>
        </Box>
      </Box>
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} variant="scrollable" scrollButtons="auto">
          {tabLabels.map((l, i) => <Tab key={i} label={l} />)}
        </Tabs>
      </Paper>
      {tabRenderers[tab]()}
      {tab > 0 && <TablePagination component="div" count={-1} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />}
      {renderDialog()}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
