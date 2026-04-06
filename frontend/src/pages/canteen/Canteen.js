import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Grid, Card, CardContent,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, MenuItem, Alert, Snackbar, FormControlLabel, Switch
} from '@mui/material';
import { Add, Edit, Delete, Refresh, AccountBalanceWallet, Restaurant, ShoppingCart, Inventory2, Store, ListAlt } from '@mui/icons-material';
import { canteenAPI } from '../../services/api';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

export default function Canteen() {
  const [tab, setTab] = useState(0);
  const [dashboard, setDashboard] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { loadDashboard(); }, []);
  const loadDashboard = async () => {
    try { const r = await canteenAPI.getDashboard(); setDashboard(r.data.data || {}); } catch(e) {}
  };
  const showMsg = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const stats = [
    { label: 'Menu Items', value: dashboard.total_items || 0, icon: <Restaurant />, color: '#e91e63' },
    { label: 'Active Wallets', value: dashboard.total_wallets || 0, icon: <AccountBalanceWallet />, color: '#9c27b0' },
    { label: 'Total Balance', value: `₹${dashboard.total_balance || 0}`, icon: <AccountBalanceWallet />, color: '#2196f3' },
    { label: "Today's Transactions", value: dashboard.today_transactions || 0, icon: <ShoppingCart />, color: '#ff9800' },
    { label: "Today's Revenue", value: `₹${dashboard.today_revenue || 0}`, icon: <ShoppingCart />, color: '#4caf50' },
    { label: 'Pending Pre-orders', value: dashboard.pending_preorders || 0, icon: <ListAlt />, color: '#f44336' },
    { label: 'Low Stock Items', value: dashboard.low_stock || 0, icon: <Inventory2 />, color: '#ff5722' },
    { label: 'Vendors', value: dashboard.total_vendors || 0, icon: <Store />, color: '#607d8b' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>Canteen Management</Typography>
      <Grid container spacing={2} mb={3}>
        {stats.map((s, i) => (
          <Grid item xs={6} sm={3} key={i}>
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
          <Tab label="Menu" icon={<Restaurant />} iconPosition="start" />
          <Tab label="Wallets" icon={<AccountBalanceWallet />} iconPosition="start" />
          <Tab label="Transactions" icon={<ShoppingCart />} iconPosition="start" />
          <Tab label="Inventory" icon={<Inventory2 />} iconPosition="start" />
          <Tab label="Vendors" icon={<Store />} iconPosition="start" />
          <Tab label="Pre-orders" icon={<ListAlt />} iconPosition="start" />
        </Tabs>
      </Paper>
      <TabPanel value={tab} index={0}><MenuTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={1}><WalletTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={2}><TransactionTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={3}><InventoryTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={4}><VendorTab showMsg={showMsg} /></TabPanel>
      <TabPanel value={tab} index={5}><PreorderTab showMsg={showMsg} /></TabPanel>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ==================== MENU TAB ====================
function MenuTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await canteenAPI.listMenu(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {}
  };
  const handleSave = async () => {
    try {
      if (editing) { await canteenAPI.updateMenuItem(editing, form); showMsg('Menu item updated'); }
      else { await canteenAPI.createMenuItem(form); showMsg('Menu item created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg(e.response?.data?.message || 'Error', 'error'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await canteenAPI.deleteMenuItem(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Menu Items</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Item</Button></Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Price</TableCell>
            <TableCell>Calories</TableCell><TableCell>Veg</TableCell><TableCell>Available</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id}>
                <TableCell>{i.name}</TableCell>
                <TableCell><Chip label={i.category || 'N/A'} size="small" /></TableCell>
                <TableCell>₹{i.price}</TableCell>
                <TableCell>{i.calories || '-'}</TableCell>
                <TableCell><Chip label={i.is_vegetarian ? 'Veg' : 'Non-Veg'} color={i.is_vegetarian ? 'success' : 'error'} size="small" /></TableCell>
                <TableCell><Chip label={i.is_available ? 'Yes' : 'No'} color={i.is_available ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={7} align="center">No menu items</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
            <Grid item xs={12} sm={6}><TextField select fullWidth label="Category" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})}>
              {['snacks', 'beverages', 'meals', 'desserts'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Price" type="number" value={form.price || ''} onChange={e => setForm({...form, price: e.target.value})} required /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Calories" type="number" value={form.calories || ''} onChange={e => setForm({...form, calories: e.target.value})} /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Allergens" value={form.allergens || ''} onChange={e => setForm({...form, allergens: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={form.is_vegetarian !== false} onChange={e => setForm({...form, is_vegetarian: e.target.checked})} />} label="Vegetarian" /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={form.is_available !== false} onChange={e => setForm({...form, is_available: e.target.checked})} />} label="Available" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== WALLET TAB ====================
function WalletTab({ showMsg }) {
  const [wallets, setWallets] = useState([]);
  const [open, setOpen] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);
  const [form, setForm] = useState({});
  const [topupForm, setTopupForm] = useState({});

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await canteenAPI.listWallets(); setWallets(r.data.data?.items || r.data.data || []); } catch(e) {}
  };
  const handleSave = async () => {
    try { await canteenAPI.createWallet(form); showMsg('Wallet created'); setOpen(false); setForm({}); load(); }
    catch(e) { showMsg(e.response?.data?.message || 'Error', 'error'); }
  };
  const handleTopup = async () => {
    try { await canteenAPI.topupWallet(topupForm.wallet_id, topupForm); showMsg('Wallet topped up'); setTopupOpen(false); setTopupForm({}); load(); }
    catch(e) { showMsg(e.response?.data?.message || 'Error', 'error'); }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Student Wallets</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setOpen(true); }}>Create Wallet</Button></Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Student</TableCell><TableCell>Balance</TableCell><TableCell>Daily Limit</TableCell>
            <TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {wallets.map(w => (
              <TableRow key={w.id}>
                <TableCell>{w.student_name || `Student #${w.student_id}`}</TableCell>
                <TableCell>₹{w.balance}</TableCell>
                <TableCell>₹{w.daily_limit}</TableCell>
                <TableCell><Chip label={w.is_active ? 'Active' : 'Inactive'} color={w.is_active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => { setTopupForm({ wallet_id: w.id }); setTopupOpen(true); }}>Top Up</Button>
                </TableCell>
              </TableRow>
            ))}
            {wallets.length === 0 && <TableRow><TableCell colSpan={5} align="center">No wallets</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Wallet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Student ID" type="number" value={form.student_id || ''} onChange={e => setForm({...form, student_id: e.target.value})} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Initial Balance" type="number" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Daily Limit" type="number" value={form.daily_limit || '200'} onChange={e => setForm({...form, daily_limit: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Create</Button></DialogActions>
      </Dialog>
      <Dialog open={topupOpen} onClose={() => setTopupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Top Up Wallet</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Amount" type="number" value={topupForm.amount || ''} onChange={e => setTopupForm({...topupForm, amount: e.target.value})} required /></Grid>
            <Grid item xs={12}><TextField select fullWidth label="Payment Method" value={topupForm.payment_method || 'cash'} onChange={e => setTopupForm({...topupForm, payment_method: e.target.value})}>
              {['cash', 'card', 'upi', 'bank_transfer'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField></Grid>
            <Grid item xs={12}><TextField fullWidth label="Reference No" value={topupForm.reference_no || ''} onChange={e => setTopupForm({...topupForm, reference_no: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setTopupOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleTopup}>Top Up</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== TRANSACTION TAB ====================
function TransactionTab({ showMsg }) {
  const [txns, setTxns] = useState([]);
  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await canteenAPI.listTransactions(); setTxns(r.data.data?.items || r.data.data || []); } catch(e) {}
  };
  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Transactions</Typography>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Date</TableCell><TableCell>Student</TableCell><TableCell>Type</TableCell>
            <TableCell>Item</TableCell><TableCell>Qty</TableCell><TableCell>Amount</TableCell><TableCell>Payment</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {txns.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{t.student_name || `#${t.student_id}`}</TableCell>
                <TableCell><Chip label={t.transaction_type} color={t.transaction_type === 'topup' ? 'success' : t.transaction_type === 'refund' ? 'warning' : 'primary'} size="small" /></TableCell>
                <TableCell>{t.item_name || '-'}</TableCell>
                <TableCell>{t.quantity}</TableCell>
                <TableCell>₹{t.amount}</TableCell>
                <TableCell>{t.payment_method}</TableCell>
              </TableRow>
            ))}
            {txns.length === 0 && <TableRow><TableCell colSpan={7} align="center">No transactions</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ==================== INVENTORY TAB ====================
function InventoryTab({ showMsg }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await canteenAPI.listInventory(); setItems(r.data.data?.items || r.data.data || []); } catch(e) {}
  };
  const handleSave = async () => {
    try {
      if (editing) { await canteenAPI.updateInventory(editing, form); showMsg('Updated'); }
      else { await canteenAPI.createInventory(form); showMsg('Created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await canteenAPI.deleteInventory(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Canteen Inventory</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Item</Button></Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Item</TableCell><TableCell>Category</TableCell><TableCell>Qty</TableCell>
            <TableCell>Unit</TableCell><TableCell>Unit Price</TableCell><TableCell>Min Stock</TableCell><TableCell>Expiry</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {items.map(i => (
              <TableRow key={i.id} sx={{ bgcolor: i.quantity <= i.min_stock ? '#fff3e0' : 'inherit' }}>
                <TableCell>{i.item_name}</TableCell>
                <TableCell>{i.category || '-'}</TableCell>
                <TableCell><Chip label={i.quantity} color={i.quantity <= i.min_stock ? 'warning' : 'success'} size="small" /></TableCell>
                <TableCell>{i.unit || '-'}</TableCell>
                <TableCell>₹{i.unit_price}</TableCell>
                <TableCell>{i.min_stock}</TableCell>
                <TableCell>{i.expiry_date || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(i); setEditing(i.id); setOpen(true); }}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(i.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={8} align="center">No inventory items</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Item Name" value={form.item_name || ''} onChange={e => setForm({...form, item_name: e.target.value})} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Category" value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Quantity" type="number" value={form.quantity || ''} onChange={e => setForm({...form, quantity: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Unit" value={form.unit || ''} onChange={e => setForm({...form, unit: e.target.value})} placeholder="kg, litre, pieces" /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Unit Price" type="number" value={form.unit_price || ''} onChange={e => setForm({...form, unit_price: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Min Stock" type="number" value={form.min_stock || ''} onChange={e => setForm({...form, min_stock: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Supplier" value={form.supplier || ''} onChange={e => setForm({...form, supplier: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Expiry Date" type="date" InputLabelProps={{ shrink: true }} value={form.expiry_date || ''} onChange={e => setForm({...form, expiry_date: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== VENDOR TAB ====================
function VendorTab({ showMsg }) {
  const [vendors, setVendors] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await canteenAPI.listVendors(); setVendors(r.data.data?.items || r.data.data || []); } catch(e) {}
  };
  const handleSave = async () => {
    try {
      if (editing) { await canteenAPI.updateVendor(editing, form); showMsg('Vendor updated'); }
      else { await canteenAPI.createVendor(form); showMsg('Vendor created'); }
      setOpen(false); setForm({}); setEditing(null); load();
    } catch(e) { showMsg('Error', 'error'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await canteenAPI.deleteVendor(id); showMsg('Deleted'); load(); } catch(e) { showMsg('Error', 'error'); }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Vendors</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setEditing(null); setOpen(true); }}>Add Vendor</Button></Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Name</TableCell><TableCell>Contact</TableCell><TableCell>Phone</TableCell>
            <TableCell>FSSAI</TableCell><TableCell>Rating</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {vendors.map(v => (
              <TableRow key={v.id}>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.contact_person || '-'}</TableCell>
                <TableCell>{v.phone || '-'}</TableCell>
                <TableCell>{v.fssai_license || '-'}</TableCell>
                <TableCell>{v.rating ? '⭐'.repeat(v.rating) : '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(v); setEditing(v.id); setOpen(true); }}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(v.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {vendors.length === 0 && <TableRow><TableCell colSpan={6} align="center">No vendors</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Person" value={form.contact_person || ''} onChange={e => setForm({...form, contact_person: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="FSSAI License" value={form.fssai_license || ''} onChange={e => setForm({...form, fssai_license: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Rating (1-5)" type="number" inputProps={{ min: 1, max: 5 }} value={form.rating || ''} onChange={e => setForm({...form, rating: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Supply Items" value={form.supply_items || ''} onChange={e => setForm({...form, supply_items: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Save</Button></DialogActions>
      </Dialog>
    </>
  );
}

// ==================== PREORDER TAB ====================
function PreorderTab({ showMsg }) {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await canteenAPI.listPreorders(); setOrders(r.data.data?.items || r.data.data || []); } catch(e) {}
  };
  const handleSave = async () => {
    try { await canteenAPI.createPreorder(form); showMsg('Pre-order created'); setOpen(false); setForm({}); load(); }
    catch(e) { showMsg('Error', 'error'); }
  };
  const handleStatus = async (id, status) => {
    try { await canteenAPI.updatePreorder(id, { status }); showMsg(`Status updated to ${status}`); load(); }
    catch(e) { showMsg('Error', 'error'); }
  };

  const statusColors = { pending: 'warning', confirmed: 'info', ready: 'primary', picked_up: 'success', cancelled: 'error' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Pre-orders</Typography>
        <Box><Button startIcon={<Refresh />} onClick={load} sx={{ mr: 1 }}>Refresh</Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({}); setOpen(true); }}>New Pre-order</Button></Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead><TableRow>
            <TableCell>Date</TableCell><TableCell>Student</TableCell><TableCell>Item</TableCell>
            <TableCell>Qty</TableCell><TableCell>Amount</TableCell><TableCell>Pickup</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell>{o.order_date}</TableCell>
                <TableCell>{o.student_name || `#${o.student_id}`}</TableCell>
                <TableCell>{o.item_name || `#${o.item_id}`}</TableCell>
                <TableCell>{o.quantity}</TableCell>
                <TableCell>₹{o.total_amount}</TableCell>
                <TableCell>{o.pickup_time || '-'}</TableCell>
                <TableCell><Chip label={o.status} color={statusColors[o.status] || 'default'} size="small" /></TableCell>
                <TableCell>
                  {o.status === 'pending' && <Button size="small" onClick={() => handleStatus(o.id, 'confirmed')}>Confirm</Button>}
                  {o.status === 'confirmed' && <Button size="small" onClick={() => handleStatus(o.id, 'ready')}>Ready</Button>}
                  {o.status === 'ready' && <Button size="small" onClick={() => handleStatus(o.id, 'picked_up')}>Picked Up</Button>}
                  {['pending', 'confirmed'].includes(o.status) && <Button size="small" color="error" onClick={() => handleStatus(o.id, 'cancelled')}>Cancel</Button>}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && <TableRow><TableCell colSpan={8} align="center">No pre-orders</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Pre-order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Student ID" type="number" value={form.student_id || ''} onChange={e => setForm({...form, student_id: e.target.value})} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Menu Item ID" type="number" value={form.item_id || ''} onChange={e => setForm({...form, item_id: e.target.value})} required /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Quantity" type="number" value={form.quantity || '1'} onChange={e => setForm({...form, quantity: e.target.value})} /></Grid>
            <Grid item xs={6} sm={4}><TextField fullWidth label="Order Date" type="date" InputLabelProps={{ shrink: true }} value={form.order_date || ''} onChange={e => setForm({...form, order_date: e.target.value})} required /></Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth label="Pickup Time" value={form.pickup_time || ''} onChange={e => setForm({...form, pickup_time: e.target.value})} placeholder="e.g. 12:30 PM" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Remarks" value={form.remarks || ''} onChange={e => setForm({...form, remarks: e.target.value})} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSave}>Create</Button></DialogActions>
      </Dialog>
    </>
  );
}
