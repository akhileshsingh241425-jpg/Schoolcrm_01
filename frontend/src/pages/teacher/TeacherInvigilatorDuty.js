import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, Grid, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import {
  Visibility, CalendarMonth, AccessTime, MeetingRoom, Refresh,
  Today, Person, Close, EventSeat
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import apiInstance from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherInvigilatorDuty() {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seatingDialog, setSeatingDialog] = useState(false);
  const [seatingGrid, setSeatingGrid] = useState([]);
  const [seatingInfo, setSeatingInfo] = useState(null);
  const theme = useTheme();

  const loadDuties = () => {
    setLoading(true);
    academicsAPI.listExams({})
      .then(async (exRes) => {
        const exams = Array.isArray(exRes.data?.data) ? exRes.data.data : exRes.data?.data?.items || [];
        // Load invigilator duties from all active exams
        const allDuties = [];
        for (const exam of exams.filter(e => ['upcoming', 'ongoing'].includes(e.status))) {
          try {
            const schedRes = await academicsAPI.listSchedules(exam.id);
            const schedules = schedRes.data?.data || [];
            for (const sched of schedules) {
              try {
                const invRes = await academicsAPI.listInvigilators(sched.id);
                const invs = invRes.data?.data || [];
                invs.forEach(inv => {
                  allDuties.push({
                    ...inv,
                    exam_id: exam.id,
                    exam_name: exam.name,
                    subject_name: sched.subject?.name || sched.subject_name || '-',
                    exam_date: sched.exam_date,
                    start_time: sched.start_time,
                    end_time: sched.end_time,
                    hall_id: inv.hall_id || inv.hall?.id || sched.hall_id,
                    hall_name: inv.hall_name || inv.hall?.name || '-',
                  });
                });
              } catch {}
            }
          } catch {}
        }
        setDuties(allDuties);
      })
      .catch(() => toast.error('Failed to load duties'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDuties(); }, []);

  const upcomingDuties = duties.filter(d => {
    if (!d.exam_date) return true;
    return new Date(d.exam_date) >= new Date(new Date().toDateString());
  }).sort((a, b) => (a.exam_date || '').localeCompare(b.exam_date || ''));

  const pastDuties = duties.filter(d => {
    if (!d.exam_date) return false;
    return new Date(d.exam_date) < new Date(new Date().toDateString());
  });

  const viewSeating = async (duty) => {
    const examId = duty.exam_id;
    const hallId = duty.hall_id;
    if (!examId || !hallId) { 
      toast.error('Seating info not available — exam controller has not assigned room yet'); 
      return; 
    }
    try {
      const res = await apiInstance.get(`/exam-mgmt/room-seating/${examId}/${hallId}`);
      const data = res.data?.data;
      if (data && data.grid && data.grid.length > 0) {
        setSeatingGrid(data.grid);
        setSeatingInfo({ hall: duty.hall_name || 'Room', date: duty.exam_date, time: `${duty.start_time?.slice(0,5)} - ${duty.end_time?.slice(0,5)}` });
        setSeatingDialog(true);
      } else {
        toast.error('Seating arrangement not yet created by exam controller');
      }
    } catch { toast.error('Seating not available yet'); }
  };

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Invigilator Duties</Typography>
        <IconButton onClick={loadDuties}><Refresh /></IconButton>
      </Box>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <Card sx={{ borderRadius: 3, borderTop: '3px solid #3b82f6' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="#3b82f6">{duties.length}</Typography>
              <Typography variant="caption" color="text.secondary">Total Duties</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ borderRadius: 3, borderTop: '3px solid #f59e0b' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="#f59e0b">{upcomingDuties.length}</Typography>
              <Typography variant="caption" color="text.secondary">Upcoming</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Card sx={{ borderRadius: 3, borderTop: '3px solid #10b981' }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="#10b981">{pastDuties.length}</Typography>
              <Typography variant="caption" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upcoming Duties */}
      {upcomingDuties.length > 0 ? (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: alpha('#f59e0b', 0.05) }}>
            <Typography variant="subtitle2" fontWeight={700}>Upcoming Duties</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Exam</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hall</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Seating</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingDuties.map((d, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.exam_name}</Typography></TableCell>
                    <TableCell>{d.subject_name}</TableCell>
                    <TableCell>
                      <Chip icon={<CalendarMonth sx={{ fontSize: 14 }} />} label={d.exam_date || '-'}
                        size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>
                      {d.start_time?.slice(0, 5)} - {d.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>
                      <Chip icon={<MeetingRoom sx={{ fontSize: 14 }} />} label={d.hall_name || d.hall?.name || '-'}
                        size="small" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={d.role || 'Assistant'} size="small"
                        color={d.role === 'chief' ? 'primary' : 'default'}
                        sx={{ fontWeight: 600, fontSize: '0.7rem', textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => viewSeating(d)} sx={{ color: '#3b82f6' }}>
                        <EventSeat sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 3, mb: 2 }}>
          No upcoming invigilator duties assigned to you.
        </Alert>
      )}

      {/* Past Duties */}
      {pastDuties.length > 0 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: alpha('#10b981', 0.05) }}>
            <Typography variant="subtitle2" fontWeight={700}>Completed Duties ({pastDuties.length})</Typography>
          </Box>
          <TableContainer sx={{ maxHeight: 200 }}>
            <Table size="small">
              <TableBody>
                {pastDuties.map((d, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{d.exam_name}</Typography></TableCell>
                    <TableCell>{d.subject_name}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{d.exam_date}</TableCell>
                    <TableCell>
                      <Chip label={d.hall_name || '-'} size="small" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Seating View Dialog */}
      <Dialog open={seatingDialog} onClose={() => setSeatingDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>🪑 Seating Arrangement</Typography>
              <Typography variant="caption" color="text.secondary">
                {seatingInfo?.hall} • {seatingInfo?.date} • {seatingInfo?.time}
              </Typography>
            </Box>
            <IconButton onClick={() => setSeatingDialog(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {seatingGrid.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Row</TableCell>
                    {seatingGrid.map((_, colIdx) => (
                      <TableCell key={colIdx} align="center" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }}>Col {colIdx + 1}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(seatingGrid[0] || []).map((_, rowIdx) => (
                    <TableRow key={rowIdx}>
                      <TableCell sx={{ fontWeight: 600, bgcolor: '#f8fafc' }}>R{rowIdx + 1}</TableCell>
                      {seatingGrid.map((col, colIdx) => {
                        const cell = col[rowIdx] || {};
                        return (
                          <TableCell key={colIdx} align="center" sx={{ border: '1px solid #e2e8f0', py: 0.8 }}>
                            {cell.class_name || cell.roll_no ? (
                              <Box>
                                <Typography variant="caption" display="block" fontWeight={600} color="primary">{cell.class_name}</Typography>
                                <Typography variant="caption" display="block">Roll: {cell.roll_no}</Typography>
                              </Box>
                            ) : <Typography variant="caption" color="text.disabled">Empty</Typography>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>No seating data available.</Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
