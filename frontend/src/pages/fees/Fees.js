import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, TablePagination, Snackbar, Alert, Card, CardContent,
  IconButton, Tooltip, LinearProgress, Divider, Switch, FormControlLabel
} from '@mui/material';
import {
  Add, Dashboard as DashboardIcon, Category, AccountBalance, Payment, Warning,
  School, Discount, Receipt, AccountTree, Store, ShoppingCart, PieChart,
  Edit, Visibility, CheckCircle, Cancel, TrendingUp, TrendingDown, AttachMoney
} from '@mui/icons-material';
import { feesAPI, studentsAPI } from '../../services/api';

const fmt = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

// ─── Dashboard Tab ───
function FinanceDashboard({ onSnack }) {
  const [data, setData] = useState(null);
  useEffect(() => { feesAPI.dashboard().then(r => setData(r.data.data)).catch(() => onSnack('Failed to load dashboard', 'error')); }, []);
  if (!data) return <Typography>Loading...</Typography>;
  const cards = [
    { label: 'Total Collected', value: `₹${fmt(data.total_collected)}`, color: '#4caf50', icon: <TrendingUp /> },
    { label: 'Total Pending', value: `₹${fmt(data.total_pending)}`, color: '#ff9800', icon: <Warning /> },
    { label: 'Total Expenses', value: `₹${fmt(data.total_expenses)}`, color: '#f44336', icon: <TrendingDown /> },
    { label: 'Net Income', value: `₹${fmt(data.net_income)}`, color: '#2196f3', icon: <AttachMoney /> },
    { label: 'Defaulters', value: data.defaulter_count || 0, color: '#e91e63', icon: <Warning /> },
    { label: 'Pending Concessions', value: data.pending_concessions || 0, color: '#9c27b0', icon: <Discount /> },
    { label: 'Pending Refunds', value: data.pending_refunds || 0, color: '#ff5722', icon: <Receipt /> },
    { label: 'Active Scholarships', value: data.active_scholarships || 0, color: '#00bcd4', icon: <School /> },
  ];
  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        {cards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderLeft: `4px solid ${c.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px rgba(0,0,0,0.1)` } }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Box><Typography variant="body2" color="text.secondary">{c.label}</Typography><Typography variant="h5" fontWeight="bold">{c.value}</Typography></Box>
                <Box sx={{ color: c.color, opacity: 0.7 }}>{c.icon}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {data.monthly_collection?.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" mb={2}>Monthly Collection</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {data.monthly_collection.map((m, i) => (
              <Chip key={i} label={`${m.month}: ₹${fmt(m.total)}`} color="primary" variant="outlined" />
            ))}
          </Box>
        </Paper>
      )}
      {data.category_wise?.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" mb={2}>Category-wise Collection</Typography>
          <Table size="small"><TableHead><TableRow><TableCell>Category</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
            <TableBody>{data.category_wise.map((c, i) => <TableRow key={i}><TableCell>{c.category}</TableCell><TableCell align="right">₹{fmt(c.total)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}

// ─── Categories Tab ───
function CategoriesTab({ onSnack }) {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const load = () => feesAPI.listCategories().then(r => setCategories(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = () => {
    feesAPI.createCategory(form).then(() => { onSnack('Category created'); setOpen(false); setForm({ name: '', description: '' }); load(); })
      .catch(() => onSnack('Failed', 'error'));
  };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Category</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Description</TableCell></TableRow></TableHead>
        <TableBody>
          {categories.map(c => <TableRow key={c.id}><TableCell><strong>{c.name}</strong></TableCell><TableCell>{c.description || '-'}</TableCell></TableRow>)}
          {!categories.length && <TableRow><TableCell colSpan={2} align="center">No categories</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Fee Category</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Fee Structure Tab ───
function StructuresTab({ onSnack }) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category_id: '', class_id: '', amount: '', frequency: 'monthly', academic_year: '', late_fee_amount: '', late_fee_type: 'fixed', grace_period_days: '0' });
  const load = useCallback(() => feesAPI.listStructures({ page: page + 1, per_page: 20 }).then(r => setData(r.data.data || { items: [], total: 0 })).catch(() => {}), [page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    feesAPI.listCategories().then(r => setCategories(r.data.data || [])).catch(() => {});
    studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {});
  }, []);
  const save = () => {
    feesAPI.createStructure(form).then(() => { onSnack('Structure created'); setOpen(false); load(); })
      .catch(() => onSnack('Failed', 'error'));
  };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Structure</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Category</TableCell><TableCell>Class</TableCell><TableCell>Amount</TableCell><TableCell>Frequency</TableCell><TableCell>Late Fee</TableCell><TableCell>Grace Days</TableCell><TableCell>Year</TableCell><TableCell>Active</TableCell></TableRow></TableHead>
        <TableBody>
          {data.items?.map(s => (
            <TableRow key={s.id}>
              <TableCell>{s.category?.name || '-'}</TableCell><TableCell>{s.class_name || '-'}</TableCell><TableCell>₹{fmt(s.amount)}</TableCell>
              <TableCell><Chip label={s.frequency} size="small" /></TableCell>
              <TableCell>{s.late_fee_amount ? `₹${s.late_fee_amount} (${s.late_fee_type})` : '-'}</TableCell>
              <TableCell>{s.grace_period_days || 0}</TableCell><TableCell>{s.academic_year || '-'}</TableCell>
              <TableCell><Chip label={s.is_active !== false ? 'Active' : 'Inactive'} size="small" color={s.is_active !== false ? 'success' : 'default'} /></TableCell>
            </TableRow>
          ))}
          {!data.items?.length && <TableRow><TableCell colSpan={8} align="center">No structures</TableCell></TableRow>}
        </TableBody>
      </Table><TablePagination component="div" count={data.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} /></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Fee Structure</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Category</InputLabel><Select value={form.category_id} label="Category" onChange={e => setForm({ ...form, category_id: e.target.value })}>{categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={form.class_id} label="Class" onChange={e => setForm({ ...form, class_id: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Frequency</InputLabel><Select value={form.frequency} label="Frequency" onChange={e => setForm({ ...form, frequency: e.target.value })}>
            <MenuItem value="monthly">Monthly</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="yearly">Yearly</MenuItem><MenuItem value="one_time">One Time</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Academic Year" placeholder="2025-2026" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} /></Grid>
          <Grid item xs={12}><Divider><Typography variant="body2" color="text.secondary">Late Fee Settings</Typography></Divider></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Late Fee Amount" type="number" value={form.late_fee_amount} onChange={e => setForm({ ...form, late_fee_amount: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Late Fee Type</InputLabel><Select value={form.late_fee_type} label="Late Fee Type" onChange={e => setForm({ ...form, late_fee_type: e.target.value })}>
            <MenuItem value="fixed">Fixed</MenuItem><MenuItem value="percentage">Percentage</MenuItem><MenuItem value="per_day">Per Day</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Grace Period (Days)" type="number" value={form.grace_period_days} onChange={e => setForm({ ...form, grace_period_days: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Payments Tab ───
function PaymentsTab({ onSnack }) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', fee_structure_id: '', amount: '', payment_method: 'cash', transaction_id: '', cheque_no: '', bank_name: '' });
  const load = useCallback(() => feesAPI.listPayments({ page: page + 1, per_page: 20 }).then(r => setData(r.data.data || { items: [], total: 0 })).catch(() => {}), [page]);
  useEffect(() => { load(); }, [load]);
  const save = () => {
    const payload = { ...form };
    if (form.payment_method !== 'cheque') { delete payload.cheque_no; delete payload.bank_name; }
    feesAPI.recordPayment(payload).then(() => { onSnack('Payment recorded'); setOpen(false); setForm({ student_id: '', fee_structure_id: '', amount: '', payment_method: 'cash', transaction_id: '', cheque_no: '', bank_name: '' }); load(); })
      .catch(() => onSnack('Failed', 'error'));
  };
  const statusColor = { completed: 'success', pending: 'warning', failed: 'error', cancelled: 'default' };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Record Payment</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Student</TableCell><TableCell>Amount</TableCell><TableCell>Late Fee</TableCell><TableCell>Total</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
        <TableBody>
          {data.items?.map(p => (
            <TableRow key={p.id}>
              <TableCell>{p.student_name || '-'}</TableCell><TableCell>₹{fmt(p.amount)}</TableCell>
              <TableCell>{p.late_fee_paid ? `₹${fmt(p.late_fee_paid)}` : '-'}</TableCell>
              <TableCell>₹{fmt(p.total_amount || p.amount)}</TableCell>
              <TableCell>{p.payment_method}</TableCell>
              <TableCell><Chip label={p.status || 'completed'} size="small" color={statusColor[p.status] || 'success'} /></TableCell>
              <TableCell>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</TableCell>
            </TableRow>
          ))}
          {!data.items?.length && <TableRow><TableCell colSpan={7} align="center">No payments</TableCell></TableRow>}
        </TableBody>
      </Table><TablePagination component="div" count={data.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} /></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Student ID" type="number" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Fee Structure ID" type="number" value={form.fee_structure_id} onChange={e => setForm({ ...form, fee_structure_id: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Method</InputLabel><Select value={form.payment_method} label="Method" onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            <MenuItem value="cash">Cash</MenuItem><MenuItem value="online">Online</MenuItem><MenuItem value="cheque">Cheque</MenuItem><MenuItem value="dd">DD</MenuItem><MenuItem value="upi">UPI</MenuItem>
          </Select></FormControl></Grid>
          {form.payment_method === 'cheque' && <>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Cheque No" value={form.cheque_no} onChange={e => setForm({ ...form, cheque_no: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Bank Name" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></Grid>
          </>}
          <Grid item xs={12}><TextField fullWidth label="Transaction/Reference ID" value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Record</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Installments Tab ───
function InstallmentsTab({ onSnack }) {
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [structures, setStructures] = useState([]);
  const [filter, setFilter] = useState({ student_id: '', status: '' });
  const [open, setOpen] = useState(false);
  const [genForm, setGenForm] = useState({ fee_structure_id: '', class_id: '', num_installments: '3' });
  const load = () => feesAPI.listInstallments(filter).then(r => setData(r.data.data?.items || r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {});
    feesAPI.listStructures({ per_page: 100 }).then(r => setStructures(r.data.data?.items || [])).catch(() => {});
  }, []);
  const generate = () => {
    feesAPI.generateInstallments(genForm).then(r => { onSnack(`${r.data.data?.count || 0} installments generated`); setOpen(false); load(); })
      .catch(() => onSnack('Failed', 'error'));
  };
  const statusColor = { pending: 'warning', partial: 'info', paid: 'success', overdue: 'error' };
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField size="small" label="Student ID" value={filter.student_id} onChange={e => setFilter({ ...filter, student_id: e.target.value })} sx={{ width: { xs: '100%', sm: 150 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 150 } }}><InputLabel>Status</InputLabel><Select value={filter.status} label="Status" onChange={e => setFilter({ ...filter, status: e.target.value })}>
            <MenuItem value="">All</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="partial">Partial</MenuItem><MenuItem value="paid">Paid</MenuItem><MenuItem value="overdue">Overdue</MenuItem>
          </Select></FormControl>
          <Button variant="outlined" onClick={load}>Filter</Button>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)} size="small">Generate Installments</Button>
      </Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>#</TableCell><TableCell>Student</TableCell><TableCell>Amount</TableCell><TableCell>Paid</TableCell><TableCell>Balance</TableCell><TableCell>Late Fee</TableCell><TableCell>Due Date</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>
          {data.map(inst => (
            <TableRow key={inst.id}>
              <TableCell>{inst.installment_no}</TableCell><TableCell>{inst.student_id}</TableCell><TableCell>₹{fmt(inst.amount)}</TableCell>
              <TableCell>₹{fmt(inst.paid_amount)}</TableCell><TableCell sx={{ color: inst.balance > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>₹{fmt(inst.balance)}</TableCell>
              <TableCell>{inst.late_fee ? `₹${fmt(inst.late_fee)}` : '-'}</TableCell>
              <TableCell>{inst.due_date || '-'}</TableCell>
              <TableCell><Chip label={inst.status} size="small" color={statusColor[inst.status] || 'default'} /></TableCell>
            </TableRow>
          ))}
          {!data.length && <TableRow><TableCell colSpan={8} align="center">No installments</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Installments</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><FormControl fullWidth><InputLabel>Fee Structure</InputLabel><Select value={genForm.fee_structure_id} label="Fee Structure" onChange={e => setGenForm({ ...genForm, fee_structure_id: e.target.value })}>
            {structures.map(s => <MenuItem key={s.id} value={s.id}>{s.category?.name} - {s.class_name} (₹{s.amount})</MenuItem>)}
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={genForm.class_id} label="Class" onChange={e => setGenForm({ ...genForm, class_id: e.target.value })}>
            {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="No. of Installments" type="number" value={genForm.num_installments} onChange={e => setGenForm({ ...genForm, num_installments: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={generate}>Generate</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Defaulters Tab ───
function DefaultersTab({ onSnack }) {
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const load = () => feesAPI.getDefaulters(classId ? { class_id: classId } : {}).then(r => setData(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {}); }, []);
  return (
    <Box>
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 200 } }}><InputLabel>Filter by Class</InputLabel><Select value={classId} label="Filter by Class" onChange={e => setClassId(e.target.value)}>
          <MenuItem value="">All Classes</MenuItem>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </Select></FormControl>
        <Button variant="outlined" onClick={load}>Search</Button>
      </Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Student</TableCell><TableCell>Class</TableCell><TableCell>Total Due</TableCell><TableCell>Overdue Installments</TableCell></TableRow></TableHead>
        <TableBody>
          {data.map((d, i) => (
            <TableRow key={i}>
              <TableCell><strong>{d.student_name}</strong></TableCell><TableCell>{d.class_name || '-'}</TableCell>
              <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>₹{fmt(d.total_due)}</TableCell>
              <TableCell>{d.overdue_count || d.installments?.length || 0}</TableCell>
            </TableRow>
          ))}
          {!data.length && <TableRow><TableCell colSpan={4} align="center">No defaulters</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
    </Box>
  );
}

// ─── Scholarships Tab ───
function ScholarshipsTab({ onSnack }) {
  const [scholarships, setScholarships] = useState([]);
  const [awards, setAwards] = useState([]);
  const [open, setOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [form, setForm] = useState({ name: '', scholarship_type: 'merit', discount_type: 'percentage', discount_value: '', eligibility_criteria: '', max_recipients: '' });
  const [awardForm, setAwardForm] = useState({ student_id: '', amount: '', remarks: '' });
  const loadS = () => feesAPI.listScholarships().then(r => setScholarships(r.data.data || [])).catch(() => {});
  const loadA = () => feesAPI.listScholarshipAwards({}).then(r => setAwards(r.data.data || [])).catch(() => {});
  useEffect(() => { loadS(); loadA(); }, []);
  const saveScholarship = () => {
    feesAPI.createScholarship(form).then(() => { onSnack('Scholarship created'); setOpen(false); loadS(); }).catch(() => onSnack('Failed', 'error'));
  };
  const saveAward = () => {
    feesAPI.awardScholarship(selectedScholarship, awardForm).then(() => { onSnack('Scholarship awarded'); setAwardOpen(false); loadA(); }).catch(() => onSnack('Failed', 'error'));
  };
  const updateAwardStatus = (id, status) => {
    feesAPI.updateScholarshipAward(id, { status }).then(() => { onSnack(`Award ${status}`); loadA(); }).catch(() => onSnack('Failed', 'error'));
  };
  const typeColors = { merit: 'primary', need_based: 'secondary', sports: 'success', rte: 'warning', government: 'info' };
  const statusColors = { pending: 'warning', approved: 'info', active: 'success', rejected: 'error', revoked: 'default' };
  return (
    <Box>
      <Typography variant="h6" mb={2}>Scholarships</Typography>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Scholarship</Button></Box>
      <TableContainer component={Paper} sx={{ mb: 3 }}><Table>
        <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Discount</TableCell><TableCell>Max Recipients</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {scholarships.map(s => (
            <TableRow key={s.id}>
              <TableCell><strong>{s.name}</strong></TableCell>
              <TableCell><Chip label={s.scholarship_type} size="small" color={typeColors[s.scholarship_type] || 'default'} /></TableCell>
              <TableCell>{s.discount_value}{s.discount_type === 'percentage' ? '%' : ' (Fixed)'}</TableCell>
              <TableCell>{s.max_recipients || '∞'}</TableCell>
              <TableCell><Button size="small" onClick={() => { setSelectedScholarship(s.id); setAwardOpen(true); }}>Award</Button></TableCell>
            </TableRow>
          ))}
          {!scholarships.length && <TableRow><TableCell colSpan={5} align="center">No scholarships</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Typography variant="h6" mb={2}>Scholarship Awards</Typography>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Student</TableCell><TableCell>Scholarship</TableCell><TableCell>Amount</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {awards.map(a => (
            <TableRow key={a.id}>
              <TableCell>{a.student_id}</TableCell><TableCell>{a.scholarship_id}</TableCell><TableCell>₹{fmt(a.amount)}</TableCell>
              <TableCell><Chip label={a.status} size="small" color={statusColors[a.status] || 'default'} /></TableCell>
              <TableCell>
                {a.status === 'pending' && <>
                  <IconButton size="small" color="success" onClick={() => updateAwardStatus(a.id, 'approved')}><CheckCircle /></IconButton>
                  <IconButton size="small" color="error" onClick={() => updateAwardStatus(a.id, 'rejected')}><Cancel /></IconButton>
                </>}
              </TableCell>
            </TableRow>
          ))}
          {!awards.length && <TableRow><TableCell colSpan={5} align="center">No awards</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Scholarship</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={form.scholarship_type} label="Type" onChange={e => setForm({ ...form, scholarship_type: e.target.value })}>
            <MenuItem value="merit">Merit</MenuItem><MenuItem value="need_based">Need Based</MenuItem><MenuItem value="sports">Sports</MenuItem><MenuItem value="rte">RTE</MenuItem><MenuItem value="government">Government</MenuItem><MenuItem value="other">Other</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Discount Type</InputLabel><Select value={form.discount_type} label="Discount Type" onChange={e => setForm({ ...form, discount_type: e.target.value })}>
            <MenuItem value="percentage">Percentage</MenuItem><MenuItem value="fixed">Fixed Amount</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Discount Value" type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Max Recipients" type="number" value={form.max_recipients} onChange={e => setForm({ ...form, max_recipients: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Eligibility Criteria" value={form.eligibility_criteria} onChange={e => setForm({ ...form, eligibility_criteria: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveScholarship}>Create</Button></DialogActions>
      </Dialog>
      <Dialog open={awardOpen} onClose={() => setAwardOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Award Scholarship</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Student ID" type="number" value={awardForm.student_id} onChange={e => setAwardForm({ ...awardForm, student_id: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Amount" type="number" value={awardForm.amount} onChange={e => setAwardForm({ ...awardForm, amount: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Remarks" value={awardForm.remarks} onChange={e => setAwardForm({ ...awardForm, remarks: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setAwardOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveAward}>Award</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Concessions Tab ───
function ConcessionsTab({ onSnack }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', fee_category_id: '', concession_type: 'percentage', amount: '', reason: '' });
  const [categories, setCategories] = useState([]);
  const load = () => feesAPI.listConcessions({}).then(r => setData(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); feesAPI.listCategories().then(r => setCategories(r.data.data || [])).catch(() => {}); }, []);
  const save = () => {
    feesAPI.createConcession(form).then(() => { onSnack('Concession requested'); setOpen(false); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const approve = (id, status) => {
    feesAPI.approveConcession(id, { status }).then(() => { onSnack(`Concession ${status}`); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const statusColors = { pending: 'warning', reviewed: 'info', approved: 'success', rejected: 'error' };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Request Concession</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Student</TableCell><TableCell>Category</TableCell><TableCell>Type</TableCell><TableCell>Amount/Pct</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {data.map(c => (
            <TableRow key={c.id}>
              <TableCell>{c.student_id}</TableCell><TableCell>{c.fee_category_id}</TableCell>
              <TableCell>{c.concession_type}</TableCell><TableCell>{c.amount}{c.concession_type === 'percentage' ? '%' : ''}</TableCell>
              <TableCell>{c.reason || '-'}</TableCell>
              <TableCell><Chip label={c.status} size="small" color={statusColors[c.status] || 'default'} /></TableCell>
              <TableCell>
                {(c.status === 'pending' || c.status === 'reviewed') && <>
                  <IconButton size="small" color="success" onClick={() => approve(c.id, c.status === 'pending' ? 'reviewed' : 'approved')}><CheckCircle /></IconButton>
                  <IconButton size="small" color="error" onClick={() => approve(c.id, 'rejected')}><Cancel /></IconButton>
                </>}
              </TableCell>
            </TableRow>
          ))}
          {!data.length && <TableRow><TableCell colSpan={7} align="center">No concessions</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Concession</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Student ID" type="number" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Fee Category</InputLabel><Select value={form.fee_category_id} label="Fee Category" onChange={e => setForm({ ...form, fee_category_id: e.target.value })}>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={form.concession_type} label="Type" onChange={e => setForm({ ...form, concession_type: e.target.value })}>
            <MenuItem value="percentage">Percentage</MenuItem><MenuItem value="fixed">Fixed Amount</MenuItem><MenuItem value="full">Full Waiver</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Amount/Percentage" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Submit</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Expenses Tab ───
function ExpensesTab({ onSnack }) {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ expense_category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', vendor_id: '', department: '', budget_head_id: '', invoice_no: '' });
  const [vendors, setVendors] = useState([]);
  const load = useCallback(() => feesAPI.listExpenses({ page: page + 1, per_page: 20 }).then(r => setData(r.data.data || { items: [], total: 0 })).catch(() => {}), [page]);
  useEffect(() => { load(); feesAPI.listVendors({}).then(r => setVendors(r.data.data?.items || r.data.data || [])).catch(() => {}); }, [load]);
  const save = () => {
    feesAPI.createExpense(form).then(() => { onSnack('Expense created'); setOpen(false); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const updateStatus = (id, status) => {
    feesAPI.updateExpense(id, { status }).then(() => { onSnack(`Expense ${status}`); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const statusColors = { pending: 'warning', approved: 'info', paid: 'success', rejected: 'error' };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Expense</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Category</TableCell><TableCell>Description</TableCell><TableCell>Amount</TableCell><TableCell>Vendor</TableCell><TableCell>Department</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {data.items?.map(e => (
            <TableRow key={e.id}>
              <TableCell>{e.expense_date || '-'}</TableCell><TableCell>{e.expense_category}</TableCell><TableCell>{e.description}</TableCell>
              <TableCell>₹{fmt(e.amount)}</TableCell><TableCell>{e.vendor_id || '-'}</TableCell><TableCell>{e.department || '-'}</TableCell>
              <TableCell><Chip label={e.status} size="small" color={statusColors[e.status] || 'default'} /></TableCell>
              <TableCell>
                {e.status === 'pending' && <>
                  <IconButton size="small" color="success" onClick={() => updateStatus(e.id, 'approved')}><CheckCircle /></IconButton>
                  <IconButton size="small" color="error" onClick={() => updateStatus(e.id, 'rejected')}><Cancel /></IconButton>
                </>}
                {e.status === 'approved' && <Button size="small" onClick={() => updateStatus(e.id, 'paid')}>Mark Paid</Button>}
              </TableCell>
            </TableRow>
          ))}
          {!data.items?.length && <TableRow><TableCell colSpan={8} align="center">No expenses</TableCell></TableRow>}
        </TableBody>
      </Table><TablePagination component="div" count={data.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} /></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Category" value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value })} placeholder="Stationery, Maintenance..." /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Date" type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Vendor</InputLabel><Select value={form.vendor_id} label="Vendor" onChange={e => setForm({ ...form, vendor_id: e.target.value })}>
            <MenuItem value="">None</MenuItem>{vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
          </Select></FormControl></Grid>
          <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Payment Mode</InputLabel><Select value={form.payment_mode} label="Payment Mode" onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
            <MenuItem value="cash">Cash</MenuItem><MenuItem value="online">Online</MenuItem><MenuItem value="cheque">Cheque</MenuItem><MenuItem value="upi">UPI</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Invoice No" value={form.invoice_no} onChange={e => setForm({ ...form, invoice_no: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Vendors Tab ───
function VendorsTab({ onSnack }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', gst_no: '', pan_no: '', bank_name: '', account_no: '', ifsc_code: '', category: '' });
  const load = () => feesAPI.listVendors({}).then(r => setData(r.data.data?.items || r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = () => {
    feesAPI.createVendor(form).then(() => { onSnack('Vendor created'); setOpen(false); setForm({ name: '', contact_person: '', phone: '', email: '', address: '', gst_no: '', pan_no: '', bank_name: '', account_no: '', ifsc_code: '', category: '' }); load(); })
      .catch(() => onSnack('Failed', 'error'));
  };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Vendor</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Contact</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>GST No</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
        <TableBody>
          {data.map(v => (
            <TableRow key={v.id}>
              <TableCell><strong>{v.name}</strong></TableCell><TableCell>{v.contact_person || '-'}</TableCell><TableCell>{v.phone || '-'}</TableCell>
              <TableCell>{v.email || '-'}</TableCell><TableCell>{v.gst_no || '-'}</TableCell><TableCell>{v.category || '-'}</TableCell>
              <TableCell><Chip label={v.status || 'active'} size="small" color={v.status === 'active' ? 'success' : 'default'} /></TableCell>
            </TableRow>
          ))}
          {!data.length && <TableRow><TableCell colSpan={7} align="center">No vendors</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Vendor</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Person" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Stationery, IT, Food..." /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="GST No" value={form.gst_no} onChange={e => setForm({ ...form, gst_no: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="PAN No" value={form.pan_no} onChange={e => setForm({ ...form, pan_no: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Bank Name" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Account No" value={form.account_no} onChange={e => setForm({ ...form, account_no: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="IFSC Code" value={form.ifsc_code} onChange={e => setForm({ ...form, ifsc_code: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Budget Tab ───
function BudgetTab({ onSnack }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ department: '', budget_head: '', allocated_amount: '', financial_year: '' });
  const load = () => feesAPI.listBudgets({}).then(r => setData(r.data.data?.items || r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = () => {
    feesAPI.createBudget(form).then(() => { onSnack('Budget created'); setOpen(false); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const updateStatus = (id, status) => {
    feesAPI.updateBudget(id, { status }).then(() => { onSnack(`Budget ${status}`); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Budget</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Department</TableCell><TableCell>Budget Head</TableCell><TableCell>Allocated</TableCell><TableCell>Spent</TableCell><TableCell>Remaining</TableCell><TableCell>Utilization</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {data.map(b => {
            const util = b.utilization_pct || (b.allocated_amount > 0 ? ((b.spent_amount || 0) / b.allocated_amount * 100) : 0);
            return (
              <TableRow key={b.id}>
                <TableCell>{b.department}</TableCell><TableCell>{b.budget_head}</TableCell>
                <TableCell>₹{fmt(b.allocated_amount)}</TableCell><TableCell>₹{fmt(b.spent_amount)}</TableCell>
                <TableCell sx={{ color: (b.remaining_amount || b.allocated_amount - (b.spent_amount || 0)) > 0 ? 'success.main' : 'error.main' }}>₹{fmt(b.remaining_amount || b.allocated_amount - (b.spent_amount || 0))}</TableCell>
                <TableCell><Box display="flex" alignItems="center" gap={1}><LinearProgress variant="determinate" value={Math.min(util, 100)} sx={{ flex: 1, height: 8, borderRadius: 4 }} color={util > 90 ? 'error' : util > 70 ? 'warning' : 'primary'} /><Typography variant="body2">{util.toFixed(0)}%</Typography></Box></TableCell>
                <TableCell><Chip label={b.status || 'draft'} size="small" color={b.status === 'active' || b.status === 'approved' ? 'success' : 'default'} /></TableCell>
                <TableCell>{b.status === 'draft' && <Button size="small" onClick={() => updateStatus(b.id, 'approved')}>Approve</Button>}</TableCell>
              </TableRow>
            );
          })}
          {!data.length && <TableRow><TableCell colSpan={8} align="center">No budgets</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Budget</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Budget Head" value={form.budget_head} onChange={e => setForm({ ...form, budget_head: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Allocated Amount" type="number" value={form.allocated_amount} onChange={e => setForm({ ...form, allocated_amount: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Financial Year" placeholder="2025-2026" value={form.financial_year} onChange={e => setForm({ ...form, financial_year: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Accounting/Ledger Tab ───
function AccountingTab({ onSnack }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState({ start_date: '', end_date: '', entry_type: '' });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ entry_date: new Date().toISOString().split('T')[0], entry_type: 'income', account_head: '', description: '', debit: '0', credit: '0', voucher_no: '', narration: '' });
  const [pnl, setPnl] = useState(null);
  const load = () => feesAPI.listAccounting(filter).then(r => setEntries(r.data.data?.items || r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = () => {
    feesAPI.createAccountingEntry(form).then(() => { onSnack('Entry created'); setOpen(false); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const loadPnl = () => {
    feesAPI.reportPnl(filter).then(r => setPnl(r.data.data)).catch(() => onSnack('Failed to load P&L', 'error'));
  };
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField size="small" label="From" type="date" value={filter.start_date} onChange={e => setFilter({ ...filter, start_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="To" type="date" value={filter.end_date} onChange={e => setFilter({ ...filter, end_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <FormControl size="small" sx={{ width: 150 }}><InputLabel>Type</InputLabel><Select value={filter.entry_type} label="Type" onChange={e => setFilter({ ...filter, entry_type: e.target.value })}>
            <MenuItem value="">All</MenuItem><MenuItem value="income">Income</MenuItem><MenuItem value="expense">Expense</MenuItem><MenuItem value="transfer">Transfer</MenuItem>
          </Select></FormControl>
          <Button variant="outlined" onClick={load}>Filter</Button>
          <Button variant="outlined" color="secondary" onClick={loadPnl}>P&L Report</Button>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Entry</Button>
      </Box>
      {pnl && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" mb={1}>Profit & Loss Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}><Typography color="success.main" variant="h6">Income: ₹{fmt(pnl.total_income)}</Typography></Grid>
            <Grid item xs={12} sm={4}><Typography color="error.main" variant="h6">Expenses: ₹{fmt(pnl.total_expenses)}</Typography></Grid>
            <Grid item xs={12} sm={4}><Typography color={pnl.net_profit >= 0 ? 'success.main' : 'error.main'} variant="h6">Net: ₹{fmt(pnl.net_profit)}</Typography></Grid>
          </Grid>
        </Paper>
      )}
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Account Head</TableCell><TableCell>Description</TableCell><TableCell>Debit</TableCell><TableCell>Credit</TableCell><TableCell>Voucher</TableCell></TableRow></TableHead>
        <TableBody>
          {entries.map(e => (
            <TableRow key={e.id}>
              <TableCell>{e.entry_date}</TableCell>
              <TableCell><Chip label={e.entry_type} size="small" color={e.entry_type === 'income' ? 'success' : e.entry_type === 'expense' ? 'error' : 'info'} /></TableCell>
              <TableCell>{e.account_head || '-'}</TableCell><TableCell>{e.description || '-'}</TableCell>
              <TableCell>{e.debit > 0 ? `₹${fmt(e.debit)}` : '-'}</TableCell><TableCell>{e.credit > 0 ? `₹${fmt(e.credit)}` : '-'}</TableCell>
              <TableCell>{e.voucher_no || '-'}</TableCell>
            </TableRow>
          ))}
          {!entries.length && <TableRow><TableCell colSpan={7} align="center">No entries</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Accounting Entry</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Date" type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={6} sm={4}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={form.entry_type} label="Type" onChange={e => setForm({ ...form, entry_type: e.target.value })}>
            <MenuItem value="income">Income</MenuItem><MenuItem value="expense">Expense</MenuItem><MenuItem value="transfer">Transfer</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Account Head" value={form.account_head} onChange={e => setForm({ ...form, account_head: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Debit" type="number" value={form.debit} onChange={e => setForm({ ...form, debit: e.target.value })} /></Grid>
          <Grid item xs={6} sm={4}><TextField fullWidth label="Credit" type="number" value={form.credit} onChange={e => setForm({ ...form, credit: e.target.value })} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Voucher No" value={form.voucher_no} onChange={e => setForm({ ...form, voucher_no: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Narration" value={form.narration} onChange={e => setForm({ ...form, narration: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Create</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Refunds Tab ───
function RefundsTab({ onSnack }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', payment_id: '', refund_amount: '', reason: '', refund_mode: 'cash' });
  const load = () => feesAPI.listRefunds({}).then(r => setData(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = () => {
    feesAPI.createRefund(form).then(() => { onSnack('Refund requested'); setOpen(false); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const updateStatus = (id, status) => {
    feesAPI.updateRefund(id, { status }).then(() => { onSnack(`Refund ${status}`); load(); }).catch(() => onSnack('Failed', 'error'));
  };
  const statusColors = { requested: 'warning', approved: 'info', processed: 'success', rejected: 'error' };
  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}><Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Request Refund</Button></Box>
      <TableContainer component={Paper}><Table>
        <TableHead><TableRow><TableCell>Student</TableCell><TableCell>Payment ID</TableCell><TableCell>Amount</TableCell><TableCell>Reason</TableCell><TableCell>Mode</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
        <TableBody>
          {data.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.student_id}</TableCell><TableCell>{r.payment_id}</TableCell><TableCell>₹{fmt(r.refund_amount)}</TableCell>
              <TableCell>{r.reason || '-'}</TableCell><TableCell>{r.refund_mode}</TableCell>
              <TableCell><Chip label={r.status} size="small" color={statusColors[r.status] || 'default'} /></TableCell>
              <TableCell>
                {r.status === 'requested' && <>
                  <IconButton size="small" color="success" onClick={() => updateStatus(r.id, 'approved')}><CheckCircle /></IconButton>
                  <IconButton size="small" color="error" onClick={() => updateStatus(r.id, 'rejected')}><Cancel /></IconButton>
                </>}
                {r.status === 'approved' && <Button size="small" onClick={() => updateStatus(r.id, 'processed')}>Process</Button>}
              </TableCell>
            </TableRow>
          ))}
          {!data.length && <TableRow><TableCell colSpan={7} align="center">No refunds</TableCell></TableRow>}
        </TableBody>
      </Table></TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Refund</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Student ID" type="number" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Payment ID" type="number" value={form.payment_id} onChange={e => setForm({ ...form, payment_id: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Refund Amount" type="number" value={form.refund_amount} onChange={e => setForm({ ...form, refund_amount: e.target.value })} /></Grid>
          <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Mode</InputLabel><Select value={form.refund_mode} label="Mode" onChange={e => setForm({ ...form, refund_mode: e.target.value })}>
            <MenuItem value="cash">Cash</MenuItem><MenuItem value="online">Online</MenuItem><MenuItem value="cheque">Cheque</MenuItem><MenuItem value="adjustment">Adjustment</MenuItem>
          </Select></FormControl></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Grid>
        </Grid></DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={save}>Submit</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Main Component ───
export default function Fees() {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const onSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const tabs = [
    { label: 'Dashboard', icon: <DashboardIcon /> },
    { label: 'Categories', icon: <Category /> },
    { label: 'Fee Structure', icon: <AccountBalance /> },
    { label: 'Payments', icon: <Payment /> },
    { label: 'Installments', icon: <Receipt /> },
    { label: 'Defaulters', icon: <Warning /> },
    { label: 'Scholarships', icon: <School /> },
    { label: 'Concessions', icon: <Discount /> },
    { label: 'Expenses', icon: <TrendingDown /> },
    { label: 'Vendors', icon: <Store /> },
    { label: 'Budget', icon: <PieChart /> },
    { label: 'Accounting', icon: <AccountTree /> },
    { label: 'Refunds', icon: <AttachMoney /> },
  ];

  return (
    <Box>
      <Typography variant="h5" mb={3}>Finance Management</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((t, i) => <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" sx={{ minHeight: 48 }} />)}
      </Tabs>

      {tab === 0 && <FinanceDashboard onSnack={onSnack} />}
      {tab === 1 && <CategoriesTab onSnack={onSnack} />}
      {tab === 2 && <StructuresTab onSnack={onSnack} />}
      {tab === 3 && <PaymentsTab onSnack={onSnack} />}
      {tab === 4 && <InstallmentsTab onSnack={onSnack} />}
      {tab === 5 && <DefaultersTab onSnack={onSnack} />}
      {tab === 6 && <ScholarshipsTab onSnack={onSnack} />}
      {tab === 7 && <ConcessionsTab onSnack={onSnack} />}
      {tab === 8 && <ExpensesTab onSnack={onSnack} />}
      {tab === 9 && <VendorsTab onSnack={onSnack} />}
      {tab === 10 && <BudgetTab onSnack={onSnack} />}
      {tab === 11 && <AccountingTab onSnack={onSnack} />}
      {tab === 12 && <RefundsTab onSnack={onSnack} />}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}><Alert severity={snack.severity}>{snack.message}</Alert></Snackbar>
    </Box>
  );
}
