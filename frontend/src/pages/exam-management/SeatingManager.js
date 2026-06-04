import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem
} from '@mui/material';
import {
  EventSeat, Refresh, PlayArrow, Close, Shuffle
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function SeatingManager({ exam }) {
  const [schedules, setSchedules] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [mode, setMode] = useState('roll_number');
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [generating, setGenerating] = useState(false);
  const theme = useTheme();

  const loadData = () => {
    if (!exam) return;
    setLoading(true);
    Promise.all([
      academicsAPI.listSchedules(exam.id).catch(() => ({ data: { data: [] } })),
      academicsAPI.listExamHalls().catch(() => ({ data: { data: [] } })),
    ]).then(([schRes, hallRes]) => {
      setSchedules(schRes.data?.data || []);
      const h = hallRes.data?.data;
      setHalls(Array.isArray(h) ? h : h?.items || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [exam?.id]);

  const handleGenerate = async () => {
    if (!selectedSchedule) return;
    setGenerating(true);
    try {
      await examMgmtAPI.generateSeating(selectedSchedule.id, {
        mode,
        hall_ids: selectedHalls.length > 0 ? selectedHalls : undefined,
      });
      toast.success('Seating arrangement generated');
      setGenOpen(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate seating'); }
    finally { setGenerating(false); }
  };

  if (!exam) return <Alert severity="info">Pehle exam select karo</Alert>;
  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Seating Arrangement: {exam.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {halls.length} hall(s) available • {schedules.length} schedule(s)
          </Typography>
        </Box>
        <IconButton onClick={loadData}><Refresh /></IconButton>
      </Paper>

      {/* Halls Overview */}
      {halls.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {halls.map(hall => (
            <Grid item xs={6} sm={3} key={hall.id}>
              <Paper sx={{ p: 1.5, borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={600}>{hall.name}</Typography>
                <Typography variant="caption" color="text.secondary">Capacity: {hall.capacity}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Schedules with Seating Actions */}
      {schedules.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <EventSeat sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No schedules found. Add schedules in Date Sheet tab first.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Seating</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{s.subject?.name || s.subject_name || '-'}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>
                    {s.class_name || '-'}{s.section_name ? ` - ${s.section_name}` : ''}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{s.exam_date || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.seating_count ? `${s.seating_count} seats` : 'Not Generated'}
                      size="small"
                      color={s.seating_count ? 'success' : 'default'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" startIcon={<Shuffle sx={{ fontSize: 14 }} />}
                      onClick={() => { setSelectedSchedule(s); setGenOpen(true); }}
                      sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 2 }}>
                      {s.seating_count ? 'Regenerate' : 'Generate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Generate Seating Dialog */}
      <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Generate Seating</Typography>
            <IconButton onClick={() => setGenOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>{selectedSchedule.subject?.name || selectedSchedule.subject_name}</strong> — {selectedSchedule.exam_date}
              </Typography>
              <TextField fullWidth select label="Seating Mode" value={mode}
                onChange={e => setMode(e.target.value)} sx={{ mb: 2 }}>
                <MenuItem value="roll_number">Roll Number Order</MenuItem>
                <MenuItem value="random">Random Shuffle</MenuItem>
                <MenuItem value="mixed">Mixed Classes (Interleaved)</MenuItem>
              </TextField>
              <TextField fullWidth select label="Select Halls" value={selectedHalls}
                onChange={e => setSelectedHalls(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                SelectProps={{ multiple: true }}
                helperText="Leave empty to use all available halls">
                {halls.map(h => (
                  <MenuItem key={h.id} value={h.id}>{h.name} (Cap: {h.capacity})</MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGenOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerate} disabled={generating}
            startIcon={<PlayArrow />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {generating ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
