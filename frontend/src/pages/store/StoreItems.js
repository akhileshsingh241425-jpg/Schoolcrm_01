import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField, CircularProgress, alpha, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { validateForm } from '../../components/Validation';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StoreItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Debounce search — wait 300ms before triggering API
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await storeAPI.listItems({ search: debouncedSearch, per_page: 100 });
      setItems(res.data.data?.items || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load items');
    }
    setLoading(false);
  }, [debouncedSearch]);

  useEffect(() => { load() }, [load]);

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      name: item.name || '',
      sku: item.sku || '',
      unit: item.unit || '',
      quantity: item.quantity ?? 0,
      unit_price: item.unit_price ?? '',
      min_stock_level: item.min_stock_level ?? 0,
      max_stock_level: item.max_stock_level ?? '',
      reorder_quantity: item.reorder_quantity ?? '',
      location: item.location || '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    const errs = validateForm(editForm, { name: ['required'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    try {
      const payload = { ...editForm };
      if (payload.quantity !== undefined) payload.quantity = parseInt(payload.quantity) || 0;
      if (payload.unit_price === '' || payload.unit_price === null) delete payload.unit_price;
      else payload.unit_price = parseFloat(payload.unit_price);
      if (payload.min_stock_level !== undefined) payload.min_stock_level = parseInt(payload.min_stock_level) || 0;
      if (payload.max_stock_level === '' || payload.max_stock_level === null) delete payload.max_stock_level;
      else payload.max_stock_level = parseInt(payload.max_stock_level);
      if (payload.reorder_quantity === '' || payload.reorder_quantity === null) delete payload.reorder_quantity;
      else payload.reorder_quantity = parseInt(payload.reorder_quantity);
      await storeAPI.updateItem(editItem.id, payload);
      toast.success('Item updated');
      setEditOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Store Items</Typography>
        <TextField size="small" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }} />
      </Box>

      {loading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #f1f5f9' }}>
          <Typography color="text.secondary">
            {debouncedSearch ? `No items found matching "${debouncedSearch}"` : 'No items in store yet. Add items from Stock Entry page.'}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Name', 'SKU', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Location', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{item.sku || '-'}</TableCell>
                    <TableCell>{item.category_name || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.quantity} size="small"
                        sx={{ fontWeight: 700, minWidth: 40,
                          bgcolor: item.quantity <= item.min_stock_level ? alpha('#ef4444', 0.1) : alpha('#10b981', 0.1),
                          color: item.quantity <= item.min_stock_level ? '#ef4444' : '#10b981' }} />
                    </TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                    <TableCell>{item.min_stock_level}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{item.location || '-'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => openEdit(item)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Item: {editItem?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField label="Name" size="small" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="SKU" size="small" value={editForm.sku} onChange={e => setEditForm(f => ({ ...f, sku: e.target.value }))} />
            <TextField label="Unit" size="small" value={editForm.unit} onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))} />
            <TextField label="Quantity" size="small" type="number" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
            <TextField label="Unit Price" size="small" type="number" value={editForm.unit_price} onChange={e => setEditForm(f => ({ ...f, unit_price: e.target.value }))} />
            <TextField label="Min Stock Level" size="small" type="number" value={editForm.min_stock_level} onChange={e => setEditForm(f => ({ ...f, min_stock_level: parseInt(e.target.value) || 0 }))} />
            <TextField label="Max Stock Level" size="small" type="number" value={editForm.max_stock_level} onChange={e => setEditForm(f => ({ ...f, max_stock_level: parseInt(e.target.value) || '' }))} />
            <TextField label="Reorder Quantity" size="small" type="number" value={editForm.reorder_quantity} onChange={e => setEditForm(f => ({ ...f, reorder_quantity: parseInt(e.target.value) || '' }))} />
            <TextField label="Location" size="small" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', borderRadius: 2 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
