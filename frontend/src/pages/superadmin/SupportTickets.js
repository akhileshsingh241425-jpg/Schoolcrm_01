import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress,
  IconButton, Tooltip
} from '@mui/material';
import { Refresh, Reply, CheckCircle } from '@mui/icons-material';
import { supportAPI } from '../../services/api';

const STATUS_COLORS = { open: 'warning', in_progress: 'info', resolved: 'success', closed: 'default' };
const PRIORITY_COLORS = { low: 'default', medium: 'info', high: 'warning', critical: 'error' };

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [respondDialog, setRespondDialog] = useState(null);
  const [response, setResponse] = useState('');
  const [responseStatus, setResponseStatus] = useState('in_progress');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    Promise.all([
      supportAPI.adminListTickets(filter),
      supportAPI.adminDashboard()
    ]).then(([ticketRes, dashRes]) => {
      setTickets(ticketRes.data.data?.items || []);
      setStats(dashRes.data.data || {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRespond = async () => {
    if (!response.trim()) return;
    setSaving(true);
    try {
      await supportAPI.respondTicket(respondDialog.id, { response, status: responseStatus });
      setRespondDialog(null);
      setResponse('');
      fetch();
    } catch {}
    setSaving(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Support Tickets</Typography>
          <Typography variant="body2" color="text.secondary">Manage client queries and provide responses</Typography>
        </Box>
        <IconButton onClick={fetch}><Refresh /></IconButton>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total', value: stats.total, color: '#6366f1' },
          { label: 'Open', value: stats.open, color: '#f59e0b' },
          { label: 'In Progress', value: stats.in_progress, color: '#3b82f6' },
          { label: 'Resolved', value: stats.resolved, color: '#10b981' },
          { label: 'Critical', value: stats.critical, color: '#ef4444' },
        ].map((s, i) => (
          <Grid item xs={6} sm={2.4} key={i}>
            <Card sx={{ borderTop: `3px solid ${s.color}`, borderRadius: 2 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="h4" fontWeight={700} color={s.color}>{s.value || 0}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" placeholder="Search tickets..."
              value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="Status" value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" select label="Priority" value={filter.priority}
              onChange={e => setFilter({ ...filter, priority: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Tickets Table */}
      {loading ? <CircularProgress /> : tickets.length === 0 ? (
        <Alert severity="info">No tickets found.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#1e293b' }}>
                {['Ticket #', 'School', 'User', 'Subject', 'Category', 'Priority', 'Status', 'Date', 'Action'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{t.ticket_no}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{t.school_name} ({t.school_code})</Typography></TableCell>
                  <TableCell><Typography variant="body2">{t.user_name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>{t.subject}</Typography></TableCell>
                  <TableCell><Chip label={t.category} size="small" variant="outlined" /></TableCell>
                  <TableCell><Chip label={t.priority} size="small" color={PRIORITY_COLORS[t.priority]} /></TableCell>
                  <TableCell><Chip label={t.status.replace('_', ' ')} size="small" color={STATUS_COLORS[t.status]} /></TableCell>
                  <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Respond">
                      <IconButton size="small" color="primary" onClick={() => { setRespondDialog(t); setResponse(t.response || ''); setResponseStatus(t.status === 'open' ? 'in_progress' : t.status); }}>
                        {t.response ? <CheckCircle color="success" fontSize="small" /> : <Reply fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Respond Dialog */}
      <Dialog open={Boolean(respondDialog)} onClose={() => setRespondDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>Respond to: {respondDialog?.ticket_no}</DialogTitle>
        <DialogContent>
          <Box mb={2} p={2} bgcolor="#f8fafc" borderRadius={2}>
            <Typography variant="subtitle2" color="text.secondary">From: {respondDialog?.user_name} ({respondDialog?.school_name})</Typography>
            <Typography variant="h6" fontWeight={600} mt={0.5}>{respondDialog?.subject}</Typography>
            <Typography variant="body2" mt={1}>{respondDialog?.message}</Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip label={respondDialog?.priority} size="small" color={PRIORITY_COLORS[respondDialog?.priority]} />
              <Chip label={respondDialog?.category} size="small" variant="outlined" />
            </Box>
          </Box>
          <TextField fullWidth multiline rows={4} label="Your Response *" value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Type your response to the client..." sx={{ mb: 2 }} />
          <TextField fullWidth select label="Set Status" value={responseStatus}
            onChange={e => setResponseStatus(e.target.value)}>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespondDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRespond} disabled={saving}>
            {saving ? 'Sending...' : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
