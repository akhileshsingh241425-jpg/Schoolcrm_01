import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, alpha, useTheme, Alert, Card, CardContent, Stack
} from '@mui/material';
import {
  Add, Delete, Save, CheckCircle, Cancel, Send,
  Refresh, Edit, EventNote, MeetingRoom
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function SeatingArrangement() {
  const theme = useTheme();
  const P = theme.palette.primary.main;

  const [exams, setExams] = useState([]);
  const [halls, setHalls] = useState([]);
  const [arrangements, setArrangements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ exam_id: '', hall_id: '', title: '', columns: 4, rows: 6 });

  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [grid, setGrid] = useState([]);
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(6);
  const [saving, setSaving] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      academicsAPI.listExams({}).catch(() => ({ data: { data: [] } })),
      academicsAPI.listExamHalls().catch(() => ({ data: { data: [] } })),
      examMgmtAPI.listSeatingArrangements().catch(() => ({ data: { data: [] } })),
    ]).then(([exRes, haRes, arRes]) => {
      const ed = exRes.data?.data;
      setExams(Array.isArray(ed) ? ed : ed?.items || []);
      const hd = haRes.data?.data;
      setHalls(Array.isArray(hd) ? hd : hd?.items || []);
      const ad = arRes.data?.data;
      setArrangements(Array.isArray(ad) ? ad : []);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  const openEditor = (arr) => {
    setCurrent(arr);
    const g = arr.grid && arr.grid.length ? arr.grid : [[]];
    setGrid(g);
    setColumns(arr.columns || g.length);
    setRows(arr.rows || (g[0]?.length || 1));
    setEditOpen(true);
  };

  const updateCell = (colIdx, rowIdx, field, value) => {
    const newGrid = grid.map((col, ci) =>
      col.map((cell, ri) =>
        ci === colIdx && ri === rowIdx ? { ...cell, [field]: value } : cell
      )
    );
    setGrid(newGrid);
  };

  const addColumn = () => {
    const newGrid = grid.map(col => [...col]);
    newGrid.push(Array.from({ length: rows }, () => ({ class_section: '', roll_no: '' })));
    setGrid(newGrid);
    setColumns(c => c + 1);
  };

  const removeColumn = (colIdx) => {
    if (grid.length <= 1) { toast.error('At least 1 column required'); return; }
    const newGrid = grid.filter((_, i) => i !== colIdx);
    setGrid(newGrid);
    setColumns(c => c - 1);
  };

  const addRow = () => {
    const newGrid = grid.map(col => [...col, { class_section: '', roll_no: '' }]);
    setGrid(newGrid);
    setRows(r => r + 1);
  };

  const removeRow = (rowIdx) => {
    if (rows <= 1) { toast.error('At least 1 row required'); return; }
    const newGrid = grid.map(col => col.filter((_, ri) => ri !== rowIdx));
    setGrid(newGrid);
    setRows(r => r - 1);
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await examMgmtAPI.updateSeatingArrangement(current.id, {
        grid, num_columns: columns, num_rows: rows
      });
      toast.success('Seating grid saved!');
      loadAll();
      setEditOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleSubmit = async (id) => {
    try {
      await examMgmtAPI.submitSeatingArrangement(id);
      toast.success('Submitted for principal approval');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async (id) => {
    try {
      await examMgmtAPI.approveSeatingArrangement(id);
      toast.success('Seating arrangement approved & notified to sections!');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await examMgmtAPI.rejectSeatingArrangement(rejectTarget, { reason: rejectReason || 'No reason' });
      toast.success('Seating arrangement rejected');
      setRejectOpen(false);
      setRejectTarget(null);
      setRejectReason('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleCreate = async () => {
    if (!createForm.exam_id || !createForm.hall_id) {
      toast.error('Select exam and hall'); return;
    }
    try {
      await examMgmtAPI.createSeatingArrangement({
        exam_id: parseInt(createForm.exam_id),
        hall_id: parseInt(createForm.hall_id),
        title: createForm.title,
        columns: parseInt(createForm.columns) || 4,
        rows: parseInt(createForm.rows) || 6,
      });
      toast.success('Seating arrangement created!');
      setCreateOpen(false);
      setCreateForm({ exam_id: '', hall_id: '', title: '', columns: 4, rows: 6 });
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const statusColor = (s) => {
    switch (s) {
      case 'draft': return 'default';
      case 'pending_approval': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Seating Arrangement</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={loadAll}><Refresh /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            New Arrangement
          </Button>
        </Box>
      </Box>

      {arrangements.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>No seating arrangements yet. Create one!</Alert>
      ) : (
        <Grid container spacing={2}>
          {arrangements.map(arr => (
            <Grid item xs={12} sm={6} md={4} key={arr.id}>
              <Card sx={{ borderRadius: 3, '&:hover': { boxShadow: 4 } }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>{arr.title || arr.hall_name || 'Untitled'}</Typography>
                    <Chip label={arr.status} size="small" color={statusColor(arr.status)} sx={{ fontWeight: 600 }} />
                  </Box>
                  <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      <EventNote sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-top' }} />
                      {arr.exam_name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <MeetingRoom sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-top' }} />
                      {arr.hall_name || 'N/A'} &middot; {arr.columns}c x {arr.rows}r
                    </Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" startIcon={<Edit />}
                      onClick={() => openEditor(arr)} disabled={arr.status === 'approved'}
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                      {arr.status === 'draft' ? 'Edit Grid' : 'View'}
                    </Button>
                    {arr.status === 'draft' && (
                      <Button size="small" variant="contained" color="warning"
                        startIcon={<Send />} onClick={() => handleSubmit(arr.id)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                        Submit
                      </Button>
                    )}
                    {arr.status === 'pending_approval' && (
                      <>
                        <Button size="small" variant="contained" color="success"
                          startIcon={<CheckCircle />} onClick={() => handleApprove(arr.id)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                          Approve
                        </Button>
                        <Button size="small" variant="contained" color="error"
                          startIcon={<Cancel />} onClick={() => { setRejectTarget(arr.id); setRejectReason(''); setRejectOpen(true); }}
                          sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>New Seating Arrangement</Typography></DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField select fullWidth size="small" label="Exam" value={createForm.exam_id}
              onChange={e => setCreateForm({ ...createForm, exam_id: e.target.value })}>
              {exams.map(ex => <MenuItem key={ex.id} value={ex.id}>{ex.name}</MenuItem>)}
            </TextField>
            <TextField select fullWidth size="small" label="Hall/Room" value={createForm.hall_id}
              onChange={e => setCreateForm({ ...createForm, hall_id: e.target.value })}>
              {halls.map(h => <MenuItem key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</MenuItem>)}
            </TextField>
            <TextField fullWidth size="small" label="Title (optional)" value={createForm.title}
              onChange={e => setCreateForm({ ...createForm, title: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" type="number" label="Columns" value={createForm.columns}
                  onChange={e => setCreateForm({ ...createForm, columns: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" type="number" label="Rows" value={createForm.rows}
                  onChange={e => setCreateForm({ ...createForm, rows: e.target.value })} />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, textTransform: 'none' }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Grid Editor Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>
              {current?.title || current?.hall_name || 'Seating Grid'}
              {current && <Chip label={current.status} size="small" color={statusColor(current.status)} sx={{ ml: 1, fontWeight: 600 }} />}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" startIcon={<Add />} onClick={addColumn}
                sx={{ borderRadius: 2, textTransform: 'none' }}>Add Col</Button>
              <Button size="small" startIcon={<Add />} onClick={addRow}
                sx={{ borderRadius: 2, textTransform: 'none' }}>Add Row</Button>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ overflowX: 'auto', mt: 1 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, minWidth: columns * 200 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(P, 0.05), minWidth: 80 }}>#</TableCell>
                    {Array.from({ length: columns }).map((_, ci) => (
                      <TableCell key={ci} sx={{ fontWeight: 700, bgcolor: alpha(P, 0.05), minWidth: 180, textAlign: 'center' }}>
                        Col {ci + 1}
                        {current?.status === 'draft' && (
                          <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ ml: 0.5, color: 'error.main' }}>
                            <Delete sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: rows }).map((_, ri) => (
                    <TableRow key={ri}>
                      <TableCell sx={{ fontWeight: 600, bgcolor: alpha(P, 0.03) }}>
                        Row {ri + 1}
                        {current?.status === 'draft' && (
                          <IconButton size="small" onClick={() => removeRow(ri)} sx={{ ml: 0.5, color: 'error.main' }}>
                            <Delete sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </TableCell>
                      {Array.from({ length: columns }).map((_, ci) => {
                        const cell = grid[ci]?.[ri] || { class_section: '', roll_no: '' };
                        return (
                          <TableCell key={ci} sx={{ p: 0.5 }}>
                            {current?.status === 'draft' ? (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                <TextField size="small" placeholder="Class-Section"
                                  value={cell.class_section}
                                  onChange={e => updateCell(ci, ri, 'class_section', e.target.value)}
                                  sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem', height: 32 } }} />
                                <TextField size="small" placeholder="Roll No"
                                  value={cell.roll_no}
                                  onChange={e => updateCell(ci, ri, 'roll_no', e.target.value)}
                                  sx={{ '& .MuiInputBase-root': { fontSize: '0.75rem', height: 32 } }} />
                              </Box>
                            ) : (
                              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                                <Typography variant="body2" fontWeight={600}>{cell.class_section || '—'}</Typography>
                                <Typography variant="caption" color="text.secondary">{cell.roll_no || '—'}</Typography>
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Box>
            {current?.status === 'draft' && (
              <Button color="warning" startIcon={<Send />} onClick={() => {
                handleSave().then(() => handleSubmit(current.id));
              }} sx={{ borderRadius: 2, textTransform: 'none' }}>
                Save & Submit
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setEditOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Close</Button>
            {current?.status === 'draft' && (
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle><Typography variant="h6" fontWeight={700}>Reject Seating Arrangement</Typography></DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Rejection Reason" value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}
            sx={{ borderRadius: 2, textTransform: 'none' }}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
