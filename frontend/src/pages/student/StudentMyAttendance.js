import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, IconButton, alpha, useTheme, LinearProgress, Avatar, Stack
} from '@mui/material';
import {
  CalendarMonth, ChevronLeft, ChevronRight, Person, Refresh,
  CheckCircle, Cancel, EventBusy
} from '@mui/icons-material';
import { studentPortalAPI } from '../../services/api';

export default function StudentMyAttendance() {
  const theme = useTheme();
  const P = theme.palette.primary.main;

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentPortalAPI.myAttendanceMonthly(month);
      const d = res.data?.data || {};
      setRecords(d.records || []);
      setSummary(d.summary || null);
    } catch {
      setRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const changeMonth = (delta) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthName = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]) - 1)
    .toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const statusConfig = {
    present: { color: '#10b981', label: 'Present', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    late: { color: '#10b981', label: 'Present', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    half_day: { color: '#10b981', label: 'Present', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
    absent: { color: '#ef4444', label: 'Absent', icon: <Cancel sx={{ fontSize: 14 }} /> },
    leave: { color: '#8b5cf6', label: 'Leave', icon: <EventBusy sx={{ fontSize: 14 }} /> },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(P, 0.1), color: P, width: 44, height: 44 }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Attendance</Typography>
            <Typography variant="body2" color="text.secondary">{monthName}</Typography>
          </Box>
        </Box>
        <IconButton onClick={loadRecords} size="small"><Refresh /></IconButton>
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
          <IconButton onClick={() => changeMonth(-1)} size="small"><ChevronLeft /></IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ minWidth: 200, textAlign: 'center' }}>{monthName}</Typography>
          <IconButton onClick={() => changeMonth(1)} size="small"><ChevronRight /></IconButton>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Working Days', value: summary.total_days || 0, color: P, bg: alpha(P, 0.08) },
            { label: 'Present', value: summary.present || 0, color: '#10b981', bg: alpha('#10b981', 0.08) },
            { label: 'Absent', value: summary.absent || 0, color: '#ef4444', bg: alpha('#ef4444', 0.08) },
            { label: 'Leave', value: summary.leave || 0, color: '#8b5cf6', bg: alpha('#8b5cf6', 0.08) },
            { label: 'Attendance %', value: `${summary.percentage || 0}%`, color: '#8b5cf6', bg: alpha('#8b5cf6', 0.08) },
          ].map((item) => (
            <Paper key={item.label} sx={{ p: 2, borderRadius: 3, flex: '1 1 140px', minWidth: 140, bgcolor: item.bg, border: '1px solid', borderColor: alpha(item.color, 0.15) }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{item.label}</Typography>
              <Typography variant="h5" sx={{ color: item.color, fontWeight: 800, mt: 0.5 }}>{item.value}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth sx={{ color: P, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700}>Records</Typography>
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
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((rec, idx) => {
                  const sc = statusConfig[rec.status] || statusConfig.absent;
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
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
