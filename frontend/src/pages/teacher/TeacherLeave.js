import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, alpha, useTheme,
  LinearProgress, Alert, Stack
} from '@mui/material';
import { Add, CalendarMonth, CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import { staffAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherLeave() {
  const [balance, setBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [staffId, setStaffId] = useState(null);
  const [form, setForm] = useState({ leave_type: 'CL', from_date: '', to_date: '', reason: '' });
  const [applying, setApplying] = useState(false);
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadData = async () => {
    setLoading(true);
    try {
      // Get staff profile to find staff_id
      const profileRes = await staffAPI.list({ per_page: 1 });
      // Actually we need current user's staff - use getWorkload or profile
      // Simpler: get leaves for current user via the list endpoint
      const leavesRes = await staffAPI.listLeaves({ per_page: 50 });
      const leaveData = leavesRes.data?.data;
      const leaveItems = Array.isArray(leaveData) ? leaveData : leaveData?.items || [];
      setLeaves(leaveItems);

      // Get staff_id from first leave or from balance
      if (leaveItems.length > 0) {
        setStaffId(leaveItems[0].staff_id);
      }

      // Get balance
      const balRes = await staffAPI.getLeaveBalance({});
      const balData = balRes.data?.data;
      if (balData && !Array.isArray(balData)) {
        setBalance(balData);
        if (balData.staff_id) setStaffId(balData.staff_id);
      } else if (Array.isArray(balData) && balData.length > 0) {
        setBalance(balData[0]);
        if (balData[0].staff_id) setStaffId(balData[0].staff_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const calcDays = () => {
    if (!form.from_date || !form.to_date) return 0;
    const from = new Date(form.from_date);
    const to = new Date(form.to_date);
    const diff = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleApply = async () => {
    if (!form.from_date || !form.to_date || !form.reason) {
      toast.error('All fields are required');
      return;
    }
    const days = calcDays();
    if (days <= 0) { toast.error('To date must be after From date'); return; }
    if (!staffId) { toast.error('Staff ID not found. Contact admin.'); return; }

    setApplying(true);
    try {
      await staffAPI.applyLeave({
        staff_id: staffId,
        leave_type: form.leave_type,
        from_date: form.from_date,
        to_date: form.to_date,
        days,
        reason: form.reason,
      });
      toast.success('Leave application submitted!');
      setApplyOpen(false);
      setForm({ leave_type: 'CL', from_date: '', to_date: '', reason: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const statusColor = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default' };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Leave</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setApplyOpen(true)}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}>
          Apply Leave
        </Button>
      </Box>

      {/* Leave Balance Cards */}
      {balance && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { type: 'CL', label: 'Casual Leave', data: balance.CL, color: '#3b82f6' },
            { type: 'EL', label: 'Earned Leave', data: balance.EL, color: '#10b981' },
            { type: 'SL', label: 'Sick Leave', data: balance.SL, color: '#f59e0b' },
            { type: 'ML', label: 'Medical Leave', data: balance.ML, color: '#8b5cf6' },
          ].map(item => (
            <Grid item xs={6} sm={3} key={item.type}>
              <Card sx={{ borderRadius: 3, borderTop: `3px solid ${item.color}` }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: item.color, my: 0.5 }}>
                    {item.data?.balance ?? '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Used: {item.data?.used || 0} / {item.data?.total || 0}
                  </Typography>
                  <LinearProgress variant="determinate"
                    value={item.data?.total ? ((item.data.used || 0) / item.data.total) * 100 : 0}
                    sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha(item.color, 0.15),
                      '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 2 } }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!balance && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Leave balance not set up yet. Contact admin.
        </Alert>
      )}

      {/* Leave History */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Leave History</Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map(l => (
                <TableRow key={l.id} hover>
                  <TableCell><Chip label={l.leave_type} size="small" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{l.from_date}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{l.to_date}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{l.days}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>{l.reason || '-'}</TableCell>
                  <TableCell>
                    <Chip label={l.status} size="small" color={statusColor[l.status] || 'default'}
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem' }}>{l.remarks || '-'}</TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && (
                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No leave records</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Apply Leave Dialog */}
      <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Apply for Leave</Typography></DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select size="small" label="Leave Type" value={form.leave_type}
                onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                <MenuItem value="CL">Casual Leave (CL)</MenuItem>
                <MenuItem value="EL">Earned Leave (EL)</MenuItem>
                <MenuItem value="SL">Sick Leave (SL)</MenuItem>
                <MenuItem value="ML">Medical Leave (ML)</MenuItem>
                <MenuItem value="LWP">Leave Without Pay (LWP)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="date" label="From Date" InputLabelProps={{ shrink: true }}
                value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="date" label="To Date" InputLabelProps={{ shrink: true }}
                value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} />
            </Grid>
            {form.from_date && form.to_date && (
              <Grid item xs={12}>
                <Chip label={`${calcDays()} day(s)`} color="primary" sx={{ fontWeight: 700 }} />
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={3} label="Reason"
                value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApplyOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleApply} disabled={applying}
            sx={{ borderRadius: 2, textTransform: 'none' }}>{applying ? 'Submitting...' : 'Submit'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
