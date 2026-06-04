import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, Autocomplete, CircularProgress, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StoreReturns() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    item_id: '', quantity: 1, returned_by: '',
    return_date: new Date().toISOString().split('T')[0], remarks: '',
  });

  useEffect(() => {
    Promise.all([
      storeAPI.listItems({ per_page: 200 }),
      storeAPI.getTransactions({ type: 'return', per_page: 50 }),
    ]).then(([i, t]) => {
      setItems(i.data.data?.items || []);
      setTransactions(t.data.data?.items || []);
    }).catch(err => toast.error(err.response?.data?.message || 'Failed to load data'))
    .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!form.item_id) { toast.error('Select an item'); return; }
    if (form.quantity < 1) { toast.error('Quantity must be at least 1'); return; }
    setSubmitting(true);
    try {
      const res = await storeAPI.returnItem(form);
      toast.success(res.data.message);
      setForm(f => ({ ...f, quantity: 1, returned_by: '', remarks: '' }));
      // Refresh items list to reflect updated quantity
      const [itemsRes, txnRes] = await Promise.all([
        storeAPI.listItems({ per_page: 200 }),
        storeAPI.getTransactions({ type: 'return', per_page: 50 }),
      ]);
      setItems(itemsRes.data.data?.items || []);
      setTransactions(txnRes.data.data?.items || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Return failed'); }
    setSubmitting(false);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Receive Returns (Store Room)</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Receive Return</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete options={items} getOptionLabel={o => `${o.name} (Qty: ${o.quantity})`}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(_, v) => setForm(f => ({ ...f, item_id: v?.id || '' }))}
                  renderInput={p => <TextField {...p} label="Item" size="small" />} />
                <TextField label="Quantity" type="number" size="small" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  inputProps={{ min: 1 }} />
                <TextField label="Returned By" size="small" value={form.returned_by}
                  onChange={e => setForm(f => ({ ...f, returned_by: e.target.value }))} />
                <TextField label="Return Date" type="date" size="small" value={form.return_date}
                  onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Receive Return'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Return History</Typography>
              {loading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box> : (
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Returned By</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Return Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Note</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map(t => (
                        <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{t.item_name}</TableCell>
                          <TableCell>{t.issued_to || '-'}</TableCell>
                          <TableCell><Chip label={t.quantity} size="small" sx={{ fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#10b981' }} /></TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>{t.return_date || (t.created_at ? new Date(t.created_at).toLocaleDateString() : '-')}</TableCell>
                          <TableCell sx={{ color: '#94a3b8', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', color: '#94a3b8' }}>No returns yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
