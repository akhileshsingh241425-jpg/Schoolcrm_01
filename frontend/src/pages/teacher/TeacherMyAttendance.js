import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton, alpha, useTheme, LinearProgress, Avatar, Stack, Divider
} from '@mui/material';
import {
  AccessTime, CalendarMonth, ChevronLeft, ChevronRight, Person, Refresh,
  CheckCircle, Cancel, HourglassEmpty, EventBusy
} from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherMyAttendance() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const [staffId, setStaffId] = useState(null);
  const [staffName, setStaffName] = useState('');
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    attendanceAPI.getMyProfile().then(r => {
      const s = r.data?.data;
      if (s?.id) {
        setStaffId(s.id);
        setStaffName(`${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || '');
      }
    }).catch(() => {});
  }, []);

  const loadRecords = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const res = await attendanceAPI.staffMonthly({ staff_id: staffId, month });
      const d = res.data?.data || {};
      setRecords(d.records || []);
      setSummary(d.summary || null);
    } catch (err) {
      console.error('Failed to load attendance:', err);
      setRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [staffId, month]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const changeMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthName = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const statusConfig = {
    present: { color: '#10b981', label: 'Present', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    late: { color: '#f59e0b', label: 'Late', icon: <HourglassEmpty sx={{ fontSize: 14 }} /> },
    half_day: { color: '#3b82f6', label: 'HD', icon: <AccessTime sx={{ fontSize: 14 }} /> },
    absent: { color: '#ef4444', label: 'Absent', icon: <Cancel sx={{ fontSize: 14 }} /> },
    leave: { color: '#8b5cf6', label: 'Leave', icon: <EventBusy sx={{ fontSize: 14 }} /> },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 44, height: 44 }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Attendance</Typography>
            <Typography variant="body2" color="text.secondary">{staffName || 'Loading...'}</Typography>
          </Box>
        </Box>
        <IconButton onClick={loadRecords} size="small"><Refresh /></IconButton>
      </Box>

      {/* Month Navigation */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
          <IconButton onClick={() => changeMonth(-1)} size="small"><ChevronLeft /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: 200, textAlign: 'center' }}>{monthName}</Typography>
          <IconButton onClick={() => changeMonth(1)} size="small"><ChevronRight /></IconButton>
        </Stack>
      </Paper>

      {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}

      {/* Summary Cards */}
      {summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Working Days', value: summary.total_days || 0, color: PRIMARY, bg: alpha(PRIMARY, 0.08) },
            { label: 'Present', value: summary.present || 0, color: '#10b981', bg: alpha('#10b981', 0.08) },
            { label: 'Absent', value: summary.absent || 0, color: '#ef4444', bg: alpha('#ef4444', 0.08) },
            { label: 'Late', value: summary.late || 0, color: '#f59e0b', bg: alpha('#f59e0b', 0.08) },
            { label: 'HD', value: summary.half_day || 0, color: '#3b82f6', bg: alpha('#3b82f6', 0.08) },
            { label: 'Attendance %', value: `${summary.percentage || 0}%`, color: '#8b5cf6', bg: alpha('#8b5cf6', 0.08) },
          ].map((item) => (
            <Paper key={item.label} sx={{ p: 2, borderRadius: 3, flex: '1 1 140px', minWidth: 140, bgcolor: item.bg, border: '1px solid', borderColor: alpha(item.color, 0.15) }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{item.label}</Typography>
              <Typography variant="h5" sx={{ color: item.color, fontWeight: 800, mt: 0.5 }}>{item.value}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Attendance Records Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth sx={{ color: PRIMARY, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700}>Attendance Records</Typography>
          <Chip label={records.length} size="small" sx={{ ml: 'auto' }} />
        </Box>
        {records.length > 0 ? (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Day</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 14 }} /> Check In
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 14 }} /> Check Out
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((rec, idx) => {
                  const sc = statusConfig[rec.status] || statusConfig.absent;
                  let duration = '-';
                  if (rec.check_in && rec.check_out) {
                    const [ciH, ciM] = rec.check_in.substring(0, 5).split(':').map(Number);
                    const [coH, coM] = rec.check_out.substring(0, 5).split(':').map(Number);
                    const diffMin = (coH * 60 + coM) - (ciH * 60 + ciM);
                    if (diffMin > 0) {
                      const hrs = Math.floor(diffMin / 60);
                      const mins = diffMin % 60;
                      duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                    }
                  }
                  return (
                    <TableRow key={rec.id || idx} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : alpha('#000', 0.01) }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{rec.date}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {rec.date ? new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short' }) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip icon={sc.icon} label={sc.label} size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize', bgcolor: alpha(sc.color, 0.1), color: sc.color, border: `1px solid ${alpha(sc.color, 0.3)}` }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: rec.check_in ? 'text.primary' : 'text.disabled' }}>
                          {rec.check_in ? rec.check_in.substring(0, 5) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: rec.check_out ? 'text.primary' : 'text.disabled' }}>
                          {rec.check_out ? rec.check_out.substring(0, 5) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          {duration}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={rec.capture_mode || 'manual'} size="small" variant="outlined"
                          sx={{ fontSize: '0.65rem', textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.remarks || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : !loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <EventBusy sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No attendance records for this month</Typography>
          </Box>
        ) : null}
      </Paper>
    </Box>
  );
}
