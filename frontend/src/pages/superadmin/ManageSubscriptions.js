import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, MenuItem, Select, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { Add, Receipt } from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

export default function ManageSubscriptions() {
  const [subscriptions, setSubs] = useState([]);
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    school_id: '', plan_id: '', billing_cycle: 'yearly',
    end_date: '', payment_status: 'paid', amount: ''
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
      setDialog(false);
      fetchData();
    } catch { }
    setSaving(false);
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
                  <TableCell>School</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map(sub => (
                  <TableRow key={sub.id} hover>
                    <TableCell>{getSchoolName(sub.school_id)}</TableCell>
                    <TableCell><Chip label={sub.plan?.name} size="small" color="primary" /></TableCell>
                    <TableCell>{sub.billing_cycle}</TableCell>
                    <TableCell>₹{sub.amount?.toLocaleString()}</TableCell>
                    <TableCell>{sub.start_date}</TableCell>
                    <TableCell>{sub.end_date}</TableCell>
                    <TableCell>
                      <Chip label={sub.payment_status} size="small"
                        color={sub.payment_status === 'paid' ? 'success' : sub.payment_status === 'pending' ? 'warning' : 'error'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!subscriptions.length && (
                  <TableRow><TableCell colSpan={7} align="center">No subscriptions found</TableCell></TableRow>
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
    </Box>
  );
}
