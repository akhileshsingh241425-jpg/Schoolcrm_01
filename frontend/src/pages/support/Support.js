import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress
} from '@mui/material';
import { Add, Support as SupportIcon, CheckCircle } from '@mui/icons-material';
import { supportAPI } from '../../services/api';

const STATUS_COLORS = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'default' };
const PRIORITY_COLORS = { low: 'default', medium: 'info', high: 'warning', critical: 'error' };

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', category: 'general', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [viewTicket, setViewTicket] = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    supportAPI.listTickets()
      .then(r => setTickets(r.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSaving(true);
    try {
      await supportAPI.createTicket(form);
      setDialog(false);
      setForm({ subject: '', message: '', category: 'general', priority: 'medium' });
      fetch();
    } catch {}
    setSaving(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Support & Queries</Typography>
          <Typography variant="body2" color="text.secondary">Submit queries or view responses from support team</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>
          New Query
        </Button>
      </Box>

      {loading ? <CircularProgress /> : tickets.length === 0 ? (
        <Alert severity="info">No queries yet. Click "New Query" to submit one.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Ticket #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Response</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map(t => (
                <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => setViewTicket(t)}>
                  <TableCell><Typography variant="body2" fontWeight={600}>{t.ticket_no}</Typography></TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell><Chip label={t.category} size="small" variant="outlined" /></TableCell>
                  <TableCell><Chip label={t.priority} size="small" color={PRIORITY_COLORS[t.priority]} /></TableCell>
                  <TableCell><Chip label={t.status.replace('_', ' ')} size="small" color={STATUS_COLORS[t.status]} /></TableCell>
                  <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{t.response ? <CheckCircle color="success" fontSize="small" /> : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit New Query</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Subject *" value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="Brief description of your issue" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Category" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="technical">Technical Issue</MenuItem>
                <MenuItem value="billing">Billing</MenuItem>
                <MenuItem value="feature_request">Feature Request</MenuItem>
                <MenuItem value="bug">Bug Report</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Priority" value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Message *" value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue in detail..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Query'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={Boolean(viewTicket)} onClose={() => setViewTicket(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Ticket: {viewTicket?.ticket_no}</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
            <Typography fontWeight={600}>{viewTicket?.subject}</Typography>
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">Your Message</Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Typography variant="body2">{viewTicket?.message}</Typography>
            </Paper>
          </Box>
          <Box display="flex" gap={1} mb={2}>
            <Chip label={viewTicket?.status?.replace('_', ' ')} color={STATUS_COLORS[viewTicket?.status]} />
            <Chip label={viewTicket?.priority} color={PRIORITY_COLORS[viewTicket?.priority]} variant="outlined" />
            <Chip label={viewTicket?.category} variant="outlined" />
          </Box>
          {viewTicket?.response && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Response from Support</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#e8f5e9', borderColor: '#a5d6a7' }}>
                <Typography variant="body2">{viewTicket.response}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  — {viewTicket.responded_by_name} • {viewTicket.responded_at ? new Date(viewTicket.responded_at).toLocaleString() : ''}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewTicket(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
