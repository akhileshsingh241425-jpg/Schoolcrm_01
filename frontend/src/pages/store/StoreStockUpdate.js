import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, Autocomplete, CircularProgress, alpha, Tabs, Tab, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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

  const load = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        storeAPI.listItems({ per_page: 200 }),
        storeAPI.listCategories(),
      ]);
      setItems(itemsRes.data.data?.items || []);
      setCategories(catsRes.data.data || []);
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

  const colSx = { '& .MuiOutlinedInput-root': { borderRadius: 2.5 } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Stock Entry (Store Room)</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, borderRadius: '8px 8px 0 0' } }}>
        <Tab label="Add New Item" />
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
