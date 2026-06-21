import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem, Autocomplete, CircularProgress, alpha, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ReturnChip = ({ returned }) => {
  if (returned === true) {
    return <Chip label="Returned" size="small" sx={{ fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#10b981' }} />;
  }
  if (returned === false) {
    return <Chip label="Not Returned" size="small" sx={{ fontWeight: 700, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }} />;
  }
  return <Chip label="Pending" size="small" variant="outlined" sx={{ fontWeight: 700, color: '#94a3b8' }} />;
};

export default function StoreAllocation() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({
    item_id: '', quantity: 1, recipient_type: 'staff',
    recipient_id: '', issued_to: '',
    issue_date: new Date().toISOString().split('T')[0],
    expected_return_date: '', remarks: '',
  });

  useEffect(() => {
    Promise.all([
      storeAPI.listItems({ per_page: 200 }),
      storeAPI.listCategories(),
      storeAPI.getStaffList(),
      storeAPI.getStudentList(),
      storeAPI.getTransactions({ type: 'out', per_page: 50 }),
    ]).then(([i, c, s, st, t]) => {
      setItems(i.data.data?.items || []);
      setCategories(c.data.data || []);
      setStaffList(s.data.data || []);
      setStudentList(st.data.data || []);
      setTransactions(t.data.data?.items || []);
    }).catch(err => toast.error(err.response?.data?.message || 'Failed to load data'))
    .finally(() => setLoading(false));
  }, []);

  const selectedItem = items.find(i => i.id === form.item_id);

  const handleSubmit = async () => {
    if (!form.item_id) { toast.error('Select an item'); return; }
    if (form.quantity < 1) { toast.error('Quantity must be at least 1'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (form.recipient_type === 'staff' && form.recipient_id) {
        const s = staffList.find(st => st.id === form.recipient_id);
        payload.issued_to = s?.name || '';
      } else if (form.recipient_type === 'student' && form.recipient_id) {
        const s = studentList.find(st => st.id === form.recipient_id);
        payload.issued_to = s?.name || '';
      }
      const res = await storeAPI.allocate(payload);
      toast.success(res.data.message);
      setForm(f => ({ ...f, quantity: 1, recipient_id: '', issued_to: '', remarks: '', expected_return_date: '' }));
      const [itemsRes, txnRes] = await Promise.all([
        storeAPI.listItems({ per_page: 200 }),
        storeAPI.getTransactions({ type: 'out', per_page: 50 }),
      ]);
      setItems(itemsRes.data.data?.items || []);
      setTransactions(txnRes.data.data?.items || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Allocation failed'); }
    setSubmitting(false);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Issue Items (Store Room)</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Issue Item</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Autocomplete options={items} getOptionLabel={o => `${o.name} (Qty: ${o.quantity})`}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  onChange={(_, v) => setForm(f => ({ ...f, item_id: v?.id || '' }))}
                  renderInput={p => <TextField {...p} label="Item" size="small" />} />
                {selectedItem && (
                  <Box sx={{ px: 1.5, py: 0.8, borderRadius: 2, bgcolor: alpha('#6366f1', 0.06), display: 'flex', gap: 2, fontSize: '0.85rem' }}>
                    <span><strong>Available:</strong> {selectedItem.quantity}</span>
                    {selectedItem.min_stock_level > 0 && <span><strong>Min:</strong> {selectedItem.min_stock_level}</span>}
                  </Box>
                )}
                <TextField label="Quantity" type="number" size="small" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                  inputProps={{ min: 1, max: selectedItem?.quantity || 1 }} />
                <TextField select label="Recipient Type" size="small" value={form.recipient_type}
                  onChange={e => setForm(f => ({ ...f, recipient_type: e.target.value, recipient_id: '' }))}>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
                {form.recipient_type === 'staff' ? (
                  <Autocomplete options={staffList} getOptionLabel={o => `${o.name} (${o.employee_id || ''})`}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    onChange={(_, v) => setForm(f => ({ ...f, recipient_id: v?.id || '' }))}
                    renderInput={p => <TextField {...p} label="Staff Member" size="small" />} />
                ) : form.recipient_type === 'student' ? (
                  <Autocomplete options={studentList} getOptionLabel={o => `${o.name} (${o.admission_no || ''})`}
                    isOptionEqualToValue={(option, value) => option.id === value?.id}
                    onChange={(_, v) => setForm(f => ({ ...f, recipient_id: v?.id || '' }))}
                    renderInput={p => <TextField {...p} label="Student" size="small" />} />
                ) : (
                  <TextField label="Recipient Name" size="small" value={form.issued_to}
                    onChange={e => setForm(f => ({ ...f, issued_to: e.target.value }))} />
                )}
                <TextField label="Issue Date" type="date" size="small" value={form.issue_date}
                  onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="Expected Return Date" type="date" size="small" value={form.expected_return_date}
                  onChange={e => setForm(f => ({ ...f, expected_return_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="Remarks" size="small" multiline rows={2} value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, py: 1.2 }}>
                  {submitting ? <CircularProgress size={20} color="inherit" /> : 'Issue Item'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Issue History</Typography>
              {loading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box> : (
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Issued To</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Issue Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Expected Return</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748b' }}>Return Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map(t => (
                        <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{t.item_name}</TableCell>
                          <TableCell>{t.issued_to || '-'}</TableCell>
                          <TableCell><Chip label={t.quantity} size="small" sx={{ fontWeight: 700, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }} /></TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>{t.issue_date || (t.created_at ? new Date(t.created_at).toLocaleDateString() : '-')}</TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>{t.expected_return_date || '-'}</TableCell>
                          <TableCell>
                            <ReturnChip returned={t.is_returned} />
                            {t.returned_qty > 0 && t.returned_qty < t.quantity && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#f59e0b', fontSize: '0.65rem' }}>
                                ({t.returned_qty}/{t.quantity} returned)
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', color: '#94a3b8' }}>No allocations yet</TableCell></TableRow>
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