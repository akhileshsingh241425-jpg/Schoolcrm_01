import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid
} from '@mui/material';
import {
  Report, Refresh, Close, CheckCircle, HourglassEmpty, Cancel
} from '@mui/icons-material';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function GrievanceManager() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [resolveForm, setResolveForm] = useState({ resolution_remarks: '', corrected_marks: '' });
  const [resolving, setResolving] = useState(false);
  const [filter, setFilter] = useState('');
  const theme = useTheme();

  const loadGrievances = () => {
    setLoading(true);
    examMgmtAPI.listGrievances(filter ? { status: filter } : {})
      .then(res => {
        const d = res.data?.data;
        setGrievances(Array.isArray(d) ? d : d?.items || []);
      })
      .catch(() => toast.error('Failed to load grievances'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGrievances(); }, [filter]);

  const handleResolve = async () => {
    if (!selected || !resolveForm.resolution_remarks) {
      toast.error('Resolution remarks required');
      return;
    }
    setResolving(true);
    try {
      await examMgmtAPI.updateGrievance(selected.id, {
        status: 'resolved',
        resolution_remarks: resolveForm.resolution_remarks,
        corrected_marks: resolveForm.corrected_marks ? parseFloat(resolveForm.corrected_marks) : undefined,
      });
      toast.success('Grievance resolved');
      setResolveOpen(false);
      setSelected(null);
      setResolveForm({ resolution_remarks: '', corrected_marks: '' });
      loadGrievances();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResolving(false); }
  };

  const handleReject = async (id) => {
    try {
      await examMgmtAPI.updateGrievance(id, { status: 'rejected' });
      toast.success('Grievance rejected');
      loadGrievances();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const statusConfig = {
    pending: { color: '#f59e0b', label: 'Pending' },
    under_review: { color: '#3b82f6', label: 'Under Review' },
    resolved: { color: '#10b981', label: 'Resolved' },
    rejected: { color: '#ef4444', label: 'Rejected' },
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Filter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Exam Grievances</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField select size="small" value={filter} onChange={e => setFilter(e.target.value)}
            sx={{ minWidth: 150 }} label="Status Filter">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="under_review">Under Review</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
          <IconButton onClick={loadGrievances}><Refresh /></IconButton>
        </Box>
      </Box>

      {grievances.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Report sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No grievances found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Original Marks</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grievances.map(g => {
                const sc = statusConfig[g.status] || statusConfig.pending;
                return (
                  <TableRow key={g.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{g.student_name || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{g.subject_name || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>{g.reason}</Typography>
                    </TableCell>
                    <TableCell>{g.original_marks || '-'}</TableCell>
                    <TableCell>
                      <Chip label={sc.label} size="small"
                        sx={{ fontWeight: 600, bgcolor: alpha(sc.color, 0.12), color: sc.color, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {g.created_at ? new Date(g.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {g.status === 'pending' || g.status === 'under_review' ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button size="small" variant="outlined" color="success"
                            onClick={() => { setSelected(g); setResolveOpen(true); }}
                            sx={{ textTransform: 'none', fontSize: '0.65rem', borderRadius: 2 }}>
                            Resolve
                          </Button>
                          <Button size="small" variant="outlined" color="error"
                            onClick={() => handleReject(g.id)}
                            sx={{ textTransform: 'none', fontSize: '0.65rem', borderRadius: 2 }}>
                            Reject
                          </Button>
                        </Box>
                      ) : g.status === 'resolved' ? (
                        <Typography variant="caption" color="success.main">
                          {g.corrected_marks ? `Corrected: ${g.corrected_marks}` : 'Resolved'}
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Resolve Dialog */}
      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Resolve Grievance</Typography>
            <IconButton onClick={() => setResolveOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2"><strong>Student:</strong> {selected.student_name}</Typography>
              <Typography variant="body2"><strong>Reason:</strong> {selected.reason}</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}><strong>Original Marks:</strong> {selected.original_marks || 'N/A'}</Typography>
              <TextField fullWidth multiline rows={3} label="Resolution Remarks" sx={{ mb: 2 }}
                value={resolveForm.resolution_remarks}
                onChange={e => setResolveForm({ ...resolveForm, resolution_remarks: e.target.value })}
                placeholder="Explain the resolution..." />
              <TextField fullWidth type="number" label="Corrected Marks (if applicable)"
                value={resolveForm.corrected_marks}
                onChange={e => setResolveForm({ ...resolveForm, corrected_marks: e.target.value })}
                helperText="Leave empty if no marks correction needed" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResolveOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleResolve} disabled={resolving}
            startIcon={<CheckCircle />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {resolving ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
