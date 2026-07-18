import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, Card, CardContent, Collapse, IconButton, Stack, Avatar, CircularProgress,
  Button
} from '@mui/material';
import {
  CalendarMonth, School, ExpandMore, ExpandLess,
  AccessTime, CheckCircle, Cancel, Schedule, EventBusy, EventSeat
} from '@mui/icons-material';
import { studentPortalAPI } from '../../services/api';
import toast from 'react-hot-toast';

const statusConfig = {
  upcoming:  { color: '#f59e0b', label: 'Upcoming',  icon: <Schedule sx={{ fontSize: 14 }} /> },
  ongoing:   { color: '#3b82f6', label: 'Ongoing',   icon: <AccessTime sx={{ fontSize: 14 }} /> },
  completed: { color: '#10b981', label: 'Completed', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  cancelled: { color: '#ef4444', label: 'Cancelled', icon: <Cancel sx={{ fontSize: 14 }} /> },
  postponed: { color: '#8b5cf6', label: 'Postponed', icon: <EventBusy sx={{ fontSize: 14 }} /> },
};

const paperStatusConfig = {
  scheduled: { color: '#f59e0b', label: 'Scheduled' },
  today:     { color: '#3b82f6', label: 'Today' },
  completed: { color: '#10b981', label: 'Done' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
  postponed: { color: '#8b5cf6', label: 'Postponed' },
  upcoming:  { color: '#f59e0b', label: 'Upcoming' },
};

export default function StudentExamView() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState(null);
  const [datesheets, setDatesheets] = useState({});
  const [seatings, setSeatings] = useState({});
  const [loadingDs, setLoadingDs] = useState(null);
  const [loadingSeat, setLoadingSeat] = useState(null);
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    studentPortalAPI.examsList()
      .then(res => {
        const data = res.data?.data;
        setExams(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  const toggleDatesheet = useCallback((examId) => {
    if (expandedExam === examId) {
      setExpandedExam(null);
      return;
    }
    if (datesheets[examId]) {
      setExpandedExam(examId);
      return;
    }
    setLoadingDs(examId);
    studentPortalAPI.examDatesheet(examId)
      .then(res => {
        setDatesheets(prev => ({ ...prev, [examId]: res.data?.data?.schedules || [] }));
        setExpandedExam(examId);
      })
      .catch(() => toast.error('Failed to load datesheet'))
      .finally(() => setLoadingDs(null));
  }, [datesheets, expandedExam]);

  const toggleSeating = useCallback((examId) => {
    if (seatings[examId]) {
      setSeatings(prev => { const n = { ...prev }; delete n[examId]; return n; });
      return;
    }
    setLoadingSeat(examId);
    studentPortalAPI.examSeating(examId)
      .then(res => {
        setSeatings(prev => ({ ...prev, [examId]: res.data?.data || {} }));
      })
      .catch(() => toast.error('Failed to load seating'))
      .finally(() => setLoadingSeat(null));
  }, [seatings]);

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 44, height: 44 }}>
          <School />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Exams</Typography>
          <Typography variant="body2" color="text.secondary">
            {exams.length} exam{exams.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {exams.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>No exams scheduled yet.</Alert>
      ) : (
        <Stack spacing={1.5}>
          {exams.map(exam => {
            const sc = statusConfig[exam.status] || statusConfig.upcoming;
            const isExpanded = expandedExam === exam.id;
            const ds = datesheets[exam.id] || [];
            const seat = seatings[exam.id];
            const isLoading = loadingDs === exam.id;
            const isLoadingS = loadingSeat === exam.id;

            return (
              <Card key={exam.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box
                  sx={{ px: 2.5, py: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    '&:hover': { bgcolor: alpha(sc.color, 0.03) },
                    transition: 'background 0.2s',
                    borderBottom: isExpanded || seat ? `1px solid ${theme.palette.divider}` : 'none',
                  }}
                  onClick={() => toggleDatesheet(exam.id)}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                      <Chip icon={sc.icon} label={sc.label} size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize',
                          bgcolor: alpha(sc.color, 0.1), color: sc.color,
                          border: `1px solid ${alpha(sc.color, 0.3)}`,
                          height: 22, fontSize: '0.65rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {exam.start_date && (
                        <Typography variant="caption" color="text.secondary">
                          <CalendarMonth sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.3 }} />
                          {exam.start_date}{exam.end_date ? ` → ${exam.end_date}` : ''}
                        </Typography>
                      )}
                      {exam.exam_type && (
                        <Typography variant="caption" color="text.secondary">{exam.exam_type}</Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {exam.total_papers} paper{exam.total_papers !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={e => e.stopPropagation()}>
                    <Button size="small" variant="outlined" startIcon={<EventSeat sx={{ fontSize: 14 }} />}
                      onClick={() => toggleSeating(exam.id)}
                      disabled={isLoadingS}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.7rem', borderRadius: 2, px: 1.5 }}>
                      {isLoadingS ? '...' : 'Seating'}
                    </Button>
                    <IconButton size="small" onClick={() => toggleDatesheet(exam.id)}>
                      {isLoading ? <CircularProgress size={18} /> :
                        isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={isExpanded} timeout="auto">
                  {ds.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Subject</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Time</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Max Marks</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Passing</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ds.map(s => {
                            const ps = paperStatusConfig[s.paper_status] || paperStatusConfig.scheduled;
                            return (
                              <TableRow key={s.id} hover sx={{
                                bgcolor: s.paper_status === 'cancelled' ? alpha('#ef4444', 0.03) :
                                  s.paper_status === 'postponed' ? alpha('#8b5cf6', 0.03) : 'transparent'
                              }}>
                                <TableCell>
                                  <Chip label={s.exam_date} size="small" variant="outlined"
                                    sx={{ fontSize: '0.7rem' }} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>
                                    {s.subject?.name || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>
                                  {s.start_time?.slice(0, 5) || '-'} - {s.end_time?.slice(0, 5) || '-'}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{s.max_marks || '-'}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>{s.passing_marks || '-'}</TableCell>
                                <TableCell>
                                  <Chip label={ps.label} size="small"
                                    sx={{ fontWeight: 600, textTransform: 'capitalize',
                                      bgcolor: alpha(ps.color, 0.1), color: ps.color,
                                      border: `1px solid ${alpha(ps.color, 0.3)}`,
                                      height: 20, fontSize: '0.6rem' }} />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {isLoading ? 'Loading datesheet...' : 'No datesheet available'}
                      </Typography>
                    </Box>
                  )}
                </Collapse>

                {seat && (
                  <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                    {seat.my_seat && seat.room ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          <EventSeat sx={{ color: PRIMARY, fontSize: 18 }} />
                          <Typography variant="subtitle2" fontWeight={700}>
                            {seat.room.hall || seat.room.title || 'Room'} — Seat {seat.my_seat.row}-{seat.my_seat.column}
                          </Typography>
                          {seat.room.date && (
                            <Chip label={seat.room.date} size="small" variant="outlined" sx={{ ml: 1, fontSize: '0.65rem' }} />
                          )}
                          {seat.room.start_time && (
                            <Chip label={seat.room.start_time.slice(0, 5)} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                          )}
                        </Box>
                        {seat.grid && seat.grid.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {(() => {
                              const maxCol = Math.max(...seat.grid.map(s => s.column));
                              const maxRow = Math.max(...seat.grid.map(s => s.row));
                              const rows = [];
                              for (let r = 1; r <= maxRow; r++) {
                                const cols = [];
                                for (let c = 1; c <= maxCol; c++) {
                                  const cell = seat.grid.find(s => s.row === r && s.column === c);
                                  const isMe = cell?.is_me;
                                  const isEmpty = !cell || !cell.roll_no;
                                  cols.push(
                                    <Paper key={`${r}-${c}`} elevation={isMe ? 3 : 0} sx={{
                                      width: 52, height: 52, display: 'flex', flexDirection: 'column',
                                      alignItems: 'center', justifyContent: 'center',
                                      border: isMe ? `2px solid ${PRIMARY}` : isEmpty ? '1px dashed #ccc' : '1px solid',
                                      borderColor: isMe ? PRIMARY : isEmpty ? '#ccc' : alpha('#666', 0.2),
                                      bgcolor: isMe ? alpha(PRIMARY, 0.1) : isEmpty ? 'grey.50' : '#fff',
                                      borderRadius: 1, fontSize: '0.55rem',
                                    }}>
                                      {isEmpty ? (
                                        <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>Empty</Typography>
                                      ) : (
                                        <>
                                          <Typography sx={{ fontSize: '0.5rem', color: 'text.secondary', lineHeight: 1 }}>
                                            {cell.class_section || ''}
                                          </Typography>
                                          <Typography sx={{ fontSize: '0.6rem', fontWeight: isMe ? 800 : 600, color: isMe ? PRIMARY : 'text.primary', lineHeight: 1.3 }}>
                                            {cell.roll_no || ''}
                                          </Typography>
                                          {isMe && <Typography sx={{ fontSize: '0.45rem', color: PRIMARY, fontWeight: 700, lineHeight: 1 }}>YOU</Typography>}
                                        </>
                                      )}
                                    </Paper>
                                  );
                                }
                                rows.push(
                                  <Box key={r} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                                    <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', width: 16, textAlign: 'center', alignSelf: 'center', fontWeight: 600 }}>
                                      R{r}
                                    </Typography>
                                    {cols}
                                  </Box>
                                );
                              }
                              return (
                                <Box>
                                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, ml: '16px' }}>
                                    {Array.from({ length: maxCol }).map((_, ci) => (
                                      <Typography key={ci} sx={{ width: 52, textAlign: 'center', fontSize: '0.5rem', color: 'text.disabled', fontWeight: 600 }}>
                                        C{ci + 1}
                                      </Typography>
                                    ))}
                                  </Box>
                                  {rows}
                                </Box>
                              );
                            })()}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 1 }}>
                        <EventSeat sx={{ fontSize: 24, color: 'text.disabled', mb: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">Seating not yet assigned</Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
