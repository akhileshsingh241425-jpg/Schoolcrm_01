import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  IconButton, Tooltip, Collapse, Alert, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { Add, Receipt, ExpandMore, Download, Payment, History } from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageSubscriptions() {
  const [subscriptions, setSubs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [payDialog, setPayDialog] = useState(false);
  const [paySubId, setPaySubId] = useState(null);
  const [payments, setPayments] = useState({});
  const [paymentsOpen, setPaymentsOpen] = useState({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    school_id: '', plan_id: '', billing_cycle: 'yearly',
    end_date: '', payment_status: 'paid', amount: ''
  });
  const [payForm, setPayForm] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'online', transaction_id: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, schoolRes, planRes] = await Promise.all([
        superAdminAPI.listSubscriptions(),
        superAdminAPI.listSchools({ per_page: 1000 }),
        superAdminAPI.listPlans(),
      ]);
      setSubs(subRes.data.data?.items || subRes.data.data || []);
      const schoolData = schoolRes.data.data;
      setSchools(schoolData?.items || schoolData || []);
      setPlans(planRes.data.data || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handlePlanChange = (planId) => {
    const plan = plans.find(p => p.id === planId);
    const cycle = form.billing_cycle;
    const amount = cycle === 'yearly' ? plan?.yearly_price : plan?.monthly_price;
    setForm({ ...form, plan_id: planId, amount: amount || '' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminAPI.createSubscription({
        ...form,
        school_id: parseInt(form.school_id),
        plan_id: parseInt(form.plan_id),
        amount: parseFloat(form.amount),
      });
      toast.success('Subscription assigned');
      setDialog(false);
      fetchData();
    } catch { toast.error('Failed to assign subscription'); }
    setSaving(false);
  };

  const loadPayments = async (subId) => {
    try {
      const res = await superAdminAPI.listSubscriptionPayments(subId);
      setPayments(prev => ({ ...prev, [subId]: res.data.data || [] }));
    } catch { toast.error('Failed to load payments'); }
  };

  const togglePayments = (subId) => {
    const open = !paymentsOpen[subId];
    setPaymentsOpen(prev => ({ ...prev, [subId]: open }));
    if (open && !payments[subId]) loadPayments(subId);
  };

  const handleRecordPayment = async () => {
    if (!payForm.amount || !payForm.payment_mode) {
      toast.error('Amount and payment mode required');
      return;
    }
    setSaving(true);
    try {
      await superAdminAPI.recordSubscriptionPayment(paySubId, {
        ...payForm,
        amount: parseFloat(payForm.amount),
      });
      toast.success('Payment recorded');
      setPayDialog(false);
      loadPayments(paySubId);
      fetchData();
    } catch { toast.error('Failed to record payment'); }
    setSaving(false);
  };

  const downloadInvoice = async (paymentId) => {
    try {
      const res = await superAdminAPI.downloadSubscriptionInvoice(paymentId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download invoice'); }
  };

  const getSchoolName = (id) => schools.find(s => s.id === id)?.name || `School #${id}`;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
          Subscriptions
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => {
          setForm({ school_id: '', plan_id: '', billing_cycle: 'yearly', end_date: '', payment_status: 'paid', amount: '' });
          setDialog(true);
        }}>Assign Subscription</Button>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>School</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Billing</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total Paid</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map(sub => (
                  <React.Fragment key={sub.id}>
                    <TableRow hover>
                      <TableCell>{getSchoolName(sub.school_id)}</TableCell>
                      <TableCell><Chip label={sub.plan?.name} size="small" color="primary" /></TableCell>
                      <TableCell>{sub.billing_cycle}</TableCell>
                      <TableCell>₹{sub.amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={`₹${(sub.total_paid || 0).toLocaleString()}`} size="small"
                          color={sub.total_paid >= sub.amount ? 'success' : 'warning'} />
                      </TableCell>
                      <TableCell>{sub.start_date}</TableCell>
                      <TableCell>{sub.end_date}</TableCell>
                      <TableCell>
                        <Chip label={sub.payment_status} size="small"
                          color={sub.payment_status === 'paid' ? 'success' : sub.payment_status === 'pending' ? 'warning' : 'error'} />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Record Payment">
                          <IconButton size="small" color="primary" onClick={() => {
                            setPaySubId(sub.id);
                            setPayForm({
                              amount: sub.amount?.toString() || '',
                              payment_date: new Date().toISOString().split('T')[0],
                              payment_mode: 'online', transaction_id: '', notes: ''
                            });
                            setPayDialog(true);
                          }}><Payment /></IconButton>
                        </Tooltip>
                        <Tooltip title="Payment History">
                          <IconButton size="small" onClick={() => togglePayments(sub.id)}>
                            <History color={paymentsOpen[sub.id] ? 'primary' : 'action'} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, border: 'none' }}>
                        <Collapse in={!!paymentsOpen[sub.id]}>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" gutterBottom>Payment History</Typography>
                            {!payments[sub.id] ? (
                              <CircularProgress size={20} />
                            ) : payments[sub.id].length === 0 ? (
                              <Alert severity="info" sx={{ mb: 1 }}>No payments recorded yet</Alert>
                            ) : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Receipt</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {payments[sub.id].map(p => (
                                    <TableRow key={p.id}>
                                      <TableCell><Chip label={p.receipt_no} size="small" variant="outlined" /></TableCell>
                                      <TableCell>{p.payment_date}</TableCell>
                                      <TableCell>₹{p.amount?.toLocaleString()}</TableCell>
                                      <TableCell>{p.payment_mode?.replace(/_/g, ' ').toUpperCase()}</TableCell>
                                      <TableCell>{p.transaction_id || '-'}</TableCell>
                                      <TableCell>
                                        <Chip label={p.status} size="small"
                                          color={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'error'} />
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip title="Download Invoice">
                                          <IconButton size="small" color="primary" onClick={() => downloadInvoice(p.id)}>
                                            <Download />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                            <Box mt={1}>
                              <Button size="small" startIcon={<Payment />} variant="outlined"
                                onClick={() => {
                                  setPaySubId(sub.id);
                                  setPayForm({
                                    amount: sub.amount?.toString() || '',
                                    payment_date: new Date().toISOString().split('T')[0],
                                    payment_mode: 'online', transaction_id: '', notes: ''
                                  });
                                  setPayDialog(true);
                                }}>Record Payment</Button>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                {!subscriptions.length && (
                  <TableRow><TableCell colSpan={9} align="center">No subscriptions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Assign Subscription Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Subscription</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>School</InputLabel>
                <Select value={form.school_id} label="School"
                  onChange={e => setForm({ ...form, school_id: e.target.value })}>
                  {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select value={form.plan_id} label="Plan"
                  onChange={e => handlePlanChange(e.target.value)}>
                  {plans.map(p => <MenuItem key={p.id} value={p.id}>{p.name} - ₹{p.yearly_price}/yr</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Cycle</InputLabel>
                <Select value={form.billing_cycle} label="Billing Cycle"
                  onChange={e => setForm({ ...form, billing_cycle: e.target.value })}>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Amount (₹)" type="number"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }}
                value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Status</InputLabel>
                <Select value={form.payment_status} label="Payment Status"
                  onChange={e => setForm({ ...form, payment_status: e.target.value })}>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Subscription Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Amount (₹)" type="number" required
                value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Payment Date" type="date" InputLabelProps={{ shrink: true }} required
                value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select value={payForm.payment_mode} label="Payment Mode" required
                  onChange={e => setPayForm({ ...payForm, payment_mode: e.target.value })}>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                  <MenuItem value="dd">Demand Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Transaction ID / Ref No."
                value={payForm.transaction_id} onChange={e => setPayForm({ ...payForm, transaction_id: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2}
                value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRecordPayment} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
