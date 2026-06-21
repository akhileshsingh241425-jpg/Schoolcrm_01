import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, Autocomplete, CircularProgress, alpha, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StoreStockUpdate() {
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '', category_id: '', sku: '', unit: '', quantity: 0,
    unit_price: '', min_stock_level: 0, max_stock_level: '',
    reorder_quantity: '', location: '', description: '',
  });

  const [stockInItem, setStockInItem] = useState(null);
  const [stockInQty, setStockInQty] = useState(1);
  const [stockInRef, setStockInRef] = useState('manual');
  const [stockInRemarks, setStockInRemarks] = useState('');
  const [stockInTxns, setStockInTxns] = useState([]);

  const load = async () => {
    try {
      const [itemsRes, catsRes, txnRes] = await Promise.all([
        storeAPI.listItems({ per_page: 200 }),
        storeAPI.listCategories(),
        storeAPI.getTransactions({ type: 'in', per_page: 50 }),
      ]);
      setItems(itemsRes.data.data?.items || []);
      setCategories(catsRes.data.data || []);
      setStockInTxns(txnRes.data.data?.items || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => { load() }, []);

  const handleAdjust = async () => {
    if (!selectedItem) { toast.error('Select an item'); return; }
    if (newQuantity === '' || parseInt(newQuantity) < 0) { toast.error('Enter a valid quantity'); return; }
    setSubmitting(true);
    try {
      const res = await storeAPI.adjustStock({ item_id: selectedItem.id, quantity: parseInt(newQuantity), remarks });
      toast.success(res.data.message);
      setSelectedItem(null); setNewQuantity(''); setRemarks('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    setSubmitting(false);
  };

  const handleCreate = async () => {
    if (!newItem.name.trim()) { toast.error('Item name is required'); return; }
    setSubmitting(true);
    try {
      const payload = { ...newItem };
      if (!payload.category_id) delete payload.category_id;
      if (payload.unit_price === '' || payload.unit_price === null) delete payload.unit_price;
      else payload.unit_price = parseFloat(payload.unit_price);
      payload.quantity = parseInt(payload.quantity) || 0;
      payload.min_stock_level = parseInt(payload.min_stock_level) || 0;
      payload.max_stock_level = (payload.max_stock_level === '' || payload.max_stock_level === null) ? null : parseInt(payload.max_stock_level);
      payload.reorder_quantity = (payload.reorder_quantity === '' || payload.reorder_quantity === null) ? null : parseInt(payload.reorder_quantity);
      const res = await storeAPI.createItem(payload);
      toast.success(res.data.message);
      setNewItem({ name: '', category_id: '', sku: '', unit: '', quantity: 0, unit_price: '', min_stock_level: 0, max_stock_level: '', reorder_quantity: '', location: '', description: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Creation failed'); }
    setSubmitting(false);
  };

  const handleCreateCategory = async () => {
    const name = prompt('Enter category name:');
    if (!name) return;
    try {
      await storeAPI.createCategory({ name });
      toast.success('Category created');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create category'); }
  };

  const handleStockIn = async () => {
    if (!stockInItem) { toast.error('Select an item'); return; }
    if (stockInQty < 1) { toast.error('Quantity must be at least 1'); return; }
    setSubmitting(true);
    try {
      const res = await storeAPI.stockIn({ item_id: stockInItem.id, quantity: stockInQty, remarks: stockInRemarks, reference: stockInRef });
      toast.success(res.data.message);
      setStockInQty(1); setStockInRemarks('');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Stock in failed'); }
    setSubmitting(false);
  };

  const colSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Stock Entry (Store Room)</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, borderRadius: '8px 8px 0 0' } }}>
        <Tab label="Add New Item" />
        <Tab label="Stock In" />
        <Tab label="Adjust Stock" />
      </Tabs>

      {tab === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>New Item</Typography>
                  <Button size="small" variant="outlined" onClick={handleCreateCategory}
                    sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>+ New Category</Button>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField label="Item Name *" size="small" required value={newItem.name}
                    onChange={e => setNewItem(f => ({ ...f, name: e.target.value }))} sx={colSx} />
                  <FormControl size="small" sx={colSx}>
                    <InputLabel>Category</InputLabel>
                    <Select value={newItem.category_id} label="Category" onChange={e => setNewItem(f => ({ ...f, category_id: e.target.value }))}>
                      <MenuItem value="">None</MenuItem>
                      {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="SKU / Code" size="small" value={newItem.sku}
                    onChange={e => setNewItem(f => ({ ...f, sku: e.target.value }))} sx={colSx} />
                  <TextField label="Unit (pcs/kg/ltr)" size="small" value={newItem.unit}
                    onChange={e => setNewItem(f => ({ ...f, unit: e.target.value }))} sx={colSx} />
                  <TextField label="Opening Quantity" type="number" size="small" value={newItem.quantity}
                    onChange={e => setNewItem(f => ({ ...f, quantity: e.target.value }))} sx={colSx} />
                  <TextField label="Unit Price (₹)" type="number" size="small" value={newItem.unit_price}
                    onChange={e => setNewItem(f => ({ ...f, unit_price: e.target.value }))} sx={colSx} />
                  <TextField label="Min Stock Level" type="number" size="small" value={newItem.min_stock_level}
                    onChange={e => setNewItem(f => ({ ...f, min_stock_level: e.target.value }))} sx={colSx} />
                  <TextField label="Max Stock Level" type="number" size="small" value={newItem.max_stock_level}
                    onChange={e => setNewItem(f => ({ ...f, max_stock_level: e.target.value }))} sx={colSx} />
                  <TextField label="Reorder Quantity" type="number" size="small" value={newItem.reorder_quantity}
                    onChange={e => setNewItem(f => ({ ...f, reorder_quantity: e.target.value }))} sx={colSx} />
                  <TextField label="Location / Rack No." size="small" value={newItem.location}
                    onChange={e => setNewItem(f => ({ ...f, location: e.target.value }))} sx={colSx} />
                  <TextField label="Description" size="small" multiline rows={2} value={newItem.description}
                    onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))}
                    sx={{ gridColumn: '1 / -1', ...colSx }} />
                </Box>
                <Button variant="contained" onClick={handleCreate} disabled={submitting}
                  sx={{ mt: 2.5, borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.2, px: 4 }}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Add Item to Stock'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : tab === 1 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Stock In</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Autocomplete options={items} getOptionLabel={o => `${o.name} (Current: ${o.quantity})`}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={stockInItem} onChange={(_, v) => { setStockInItem(v); }}
                    renderInput={p => <TextField {...p} label="Item" size="small" />} />
                  {stockInItem && (
                    <Box sx={{ px: 1.5, py: 0.8, borderRadius: 2, bgcolor: alpha('#10b981', 0.06), display: 'flex', gap: 3, fontSize: '0.85rem' }}>
                      <span><strong>Current Stock:</strong> {stockInItem.quantity}</span>
                      <span><strong>Category:</strong> {stockInItem.category_name || 'N/A'}</span>
                    </Box>
                  )}
                  <TextField label="Quantity to Add" type="number" size="small" value={stockInQty}
                    onChange={e => setStockInQty(parseInt(e.target.value) || 1)} inputProps={{ min: 1 }} />
                  <FormControl size="small">
                    <InputLabel>Reference</InputLabel>
                    <Select value={stockInRef} label="Reference" onChange={e => setStockInRef(e.target.value)}>
                      <MenuItem value="manual">Manual</MenuItem>
                      <MenuItem value="purchase">Purchase Order</MenuItem>
                      <MenuItem value="return">Return to Stock</MenuItem>
                      <MenuItem value="transfer">Transfer</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Remarks" size="small" multiline rows={2} value={stockInRemarks}
                    onChange={e => setStockInRemarks(e.target.value)} />
                  <Button variant="contained" onClick={handleStockIn} disabled={submitting}
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                    {submitting ? <CircularProgress size={20} color="inherit" /> : 'Add to Stock'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Stock In History</Typography>
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Qty Added</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Reference</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Note</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockInTxns.map(t => (
                        <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{t.item_name}</TableCell>
                          <TableCell>
                            <Chip label={`+${t.quantity}`} size="small"
                              sx={{ fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#10b981' }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={t.reference_type || 'manual'} size="small" variant="outlined"
                              sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>
                            {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell sx={{ color: '#94a3b8', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {stockInTxns.length === 0 && (
                        <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', color: '#94a3b8' }}>No stock in entries yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Adjust Existing Stock</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Autocomplete options={items} getOptionLabel={o => `${o.name} (Current: ${o.quantity})`}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    value={selectedItem} onChange={(_, v) => { setSelectedItem(v); setNewQuantity(v ? String(v.quantity) : ''); }}
                    renderInput={p => <TextField {...p} label="Item" size="small" />} />
                  {selectedItem && (
                    <Box sx={{ px: 1.5, py: 0.8, borderRadius: 2, bgcolor: alpha('#6366f1', 0.06), display: 'flex', gap: 3, fontSize: '0.85rem' }}>
                      <span><strong>Current:</strong> {selectedItem.quantity}</span>
                      <span><strong>Min:</strong> {selectedItem.min_stock_level}</span>
                      <span><strong>Max:</strong> {selectedItem.max_stock_level || 'N/A'}</span>
                    </Box>
                  )}
                  <TextField label="New Quantity" type="number" size="small" value={newQuantity}
                    onChange={e => setNewQuantity(e.target.value)} inputProps={{ min: 0 }} />
                  <TextField label="Remarks" size="small" multiline rows={2} value={remarks}
                    onChange={e => setRemarks(e.target.value)} />
                  <Button variant="contained" onClick={handleAdjust} disabled={submitting}
                    sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.2, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
                    {submitting ? <CircularProgress size={20} color="inherit" /> : 'Update Stock'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}