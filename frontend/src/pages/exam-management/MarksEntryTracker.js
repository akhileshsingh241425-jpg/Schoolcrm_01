import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Tooltip, Grid, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem
} from '@mui/material';
import {
  Lock, LockOpen, Send, Refresh, Warning, CheckCircle,
  Schedule, Close, Add
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function MarksEntryTracker({ exam }) {
  const [statusList, setStatusList] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [dlForm, setDlForm] = useState({ class_id: '', subject_id: '', deadline_date: '', auto_lock: true });
  const [settingDl, setSettingDl] = useState(false);
  const theme = useTheme();

  const loadData = () => {
    if (!exam) return;
    setLoading(true);
    Promise.all([
      examMgmtAPI.getMarksStatus(exam.id).catch(() => ({ data: { data: [] } })),
      examMgmtAPI.getDeadlines(exam.id).catch(() => ({ data: { data: [] } })),
    ]).then(([msRes, dlRes]) => {
      setStatusList(msRes.data?.data || []);
      setDeadlines(dlRes.data?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [exam?.id]);

  const handleLock = async (scheduleId, lock) => {
    try {
      if (lock) await academicsAPI.lockMarks({ exam_schedule_id: scheduleId });
      else await academicsAPI.unlockMarks({ exam_schedule_id: scheduleId });
      toast.success(lock ? 'Marks locked' : 'Marks unlocked');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSetDeadline = async () => {
    if (!dlForm.class_id || !dlForm.subject_id || !dlForm.deadline_date) {
      toast.error('All fields required');
      return;
    }
    setSettingDl(true);
    try {
      await examMgmtAPI.setDeadline(exam.id, {
        class_id: parseInt(dlForm.class_id),
        subject_id: parseInt(dlForm.subject_id),
        deadline_date: dlForm.deadline_date,
        auto_lock: dlForm.auto_lock,
      });
      toast.success('Deadline set');
      setDeadlineOpen(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSettingDl(false); }
  };

  if (!exam) return <Alert severity="info">Pehle exam select karo</Alert>;
  if (loading) return <LinearProgress />;

  const totalSubjects = statusList.length;
  const completed = statusList.filter(s => s.percentage_done === 100).length;
  const locked = statusList.filter(s => s.is_locked).length;
  const overdue = statusList.filter(s => {
    const dl = deadlines.find(d => d.subject_id === s.subject_id && d.class_id === s.class_id);
    return dl && new Date(dl.deadline_date) < new Date() && s.percentage_done < 100;
  }).length;

  return (
    <Box>
      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #3b82f6' }}>
            <Typography variant="h4" fontWeight={800} color="#3b82f6">{totalSubjects}</Typography>
            <Typography variant="caption" color="text.secondary">Total Subjects</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #10b981' }}>
            <Typography variant="h4" fontWeight={800} color="#10b981">{completed}</Typography>
            <Typography variant="caption" color="text.secondary">Completed</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #8b5cf6' }}>
            <Typography variant="h4" fontWeight={800} color="#8b5cf6">{locked}</Typography>
            <Typography variant="caption" color="text.secondary">Locked</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper sx={{ p: 2, borderRadius: 3, textAlign: 'center', borderTop: '3px solid #ef4444' }}>
            <Typography variant="h4" fontWeight={800} color="#ef4444">{overdue}</Typography>
            <Typography variant="caption" color="text.secondary">Overdue</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Button variant="outlined" startIcon={<Add />} onClick={() => setDeadlineOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none' }}>Set Deadline</Button>
        <IconButton onClick={loadData}><Refresh /></IconButton>
      </Box>

      {/* Status Table */}
      {statusList.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary" fontWeight={600}>Koi marks data nahi mila</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Pehle Date Sheet tab mein subjects add karo. Phir teachers marks enter karenge aur yahan status dikhega.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entered</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Pending</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Lock</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statusList.map(s => {
                const isComplete = s.percentage_done === 100;
                const dl = deadlines.find(d => d.subject_id === s.subject_id);
                const isOverdue = dl && new Date(dl.deadline_date) < new Date() && !isComplete;
                return (
                  <TableRow key={s.schedule_id} hover sx={{ bgcolor: isOverdue ? alpha('#ef4444', 0.03) : undefined }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{s.subject_name || '-'}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      {s.class_name}{s.section_name ? ` - ${s.section_name}` : ''}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{s.exam_date || '-'}</TableCell>
                    <TableCell>{s.total_students}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#10b981' }}>{s.marks_entered}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: s.pending > 0 ? '#ef4444' : '#10b981' }}>{s.pending}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={s.percentage_done}
                          sx={{ flex: 1, height: 6, borderRadius: 3,
                            bgcolor: alpha('#000', 0.06),
                            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: isComplete ? '#10b981' : '#3b82f6' }
                          }}
                        />
                        <Typography variant="caption" fontWeight={600}>{s.percentage_done}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {s.is_locked ? (
                        <Chip icon={<Lock sx={{ fontSize: 12 }} />} label="Locked" size="small" color="success" sx={{ fontSize: '0.65rem' }} />
                      ) : isOverdue ? (
                        <Chip icon={<Warning sx={{ fontSize: 12 }} />} label="Overdue" size="small" color="error" sx={{ fontSize: '0.65rem' }} />
                      ) : isComplete ? (
                        <Chip icon={<CheckCircle sx={{ fontSize: 12 }} />} label="Done" size="small" color="success" sx={{ fontSize: '0.65rem' }} />
                      ) : (
                        <Chip icon={<Schedule sx={{ fontSize: 12 }} />} label="Pending" size="small" color="warning" sx={{ fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={s.is_locked ? 'Unlock marks' : 'Lock marks'}>
                        <IconButton size="small" onClick={() => handleLock(s.schedule_id, !s.is_locked)}
                          sx={{ color: s.is_locked ? '#10b981' : '#ef4444', bgcolor: alpha(s.is_locked ? '#10b981' : '#ef4444', 0.08) }}>
                          {s.is_locked ? <LockOpen sx={{ fontSize: 16 }} /> : <Lock sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Set Deadline Dialog */}
      <Dialog open={deadlineOpen} onClose={() => setDeadlineOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Set Marks Deadline</Typography>
            <IconButton onClick={() => setDeadlineOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Subject (Schedule)" value={dlForm.subject_id}
                onChange={e => setDlForm({ ...dlForm, subject_id: e.target.value })}>
                {statusList.map(s => (
                  <MenuItem key={s.schedule_id} value={s.subject_id || s.schedule_id}>
                    {s.subject_name} - {s.class_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="date" label="Deadline Date" InputLabelProps={{ shrink: true }}
                value={dlForm.deadline_date} onChange={e => setDlForm({ ...dlForm, deadline_date: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select label="Auto Lock on Deadline" value={dlForm.auto_lock ? 'yes' : 'no'}
                onChange={e => setDlForm({ ...dlForm, auto_lock: e.target.value === 'yes' })}>
                <MenuItem value="yes">Yes - Auto lock marks</MenuItem>
                <MenuItem value="no">No - Manual lock only</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeadlineOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSetDeadline} disabled={settingDl}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {settingDl ? 'Setting...' : 'Set Deadline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
