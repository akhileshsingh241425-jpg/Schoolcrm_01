import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Skeleton, alpha, useTheme, IconButton, Tooltip
} from '@mui/material';
import { Refresh, AccessTime } from '@mui/icons-material';
import { academicsAPI } from '../../services/api';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };
const PERIOD_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PERIOD_COLORS[Math.abs(hash) % PERIOD_COLORS.length];
}

export default function TeacherTimetable() {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadData = () => {
    setLoading(true);
    academicsAPI.getTimetable({ my: true })
      .then(res => {
        const entries = res.data.data || [];
        const byDay = {};
        DAYS.forEach(d => byDay[d] = []);
        entries.forEach(e => {
          if (byDay[e.day_of_week]) byDay[e.day_of_week].push(e);
        });
        DAYS.forEach(d => byDay[d].sort((a, b) => (a.period_number || 0) - (b.period_number || 0)));
        setTimetable(byDay);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Timetable</Typography>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  if (!timetable) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error">Failed to load timetable</Typography>
      </Box>
    );
  }

  const allPeriods = DAYS.reduce((acc, d) => {
    const periods = (timetable[d] || []).filter(e => !e.is_break).map(e => e.period_number || 0);
    return [...new Set([...acc, ...periods])];
  }, []).sort((a, b) => a - b);

  const maxPeriods = allPeriods.length || 8;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>My Timetable</Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData} sx={{ color: PRIMARY }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha(PRIMARY, 0.06), minWidth: 60 }}>Period</TableCell>
              {DAYS.map(day => {
                const entries = timetable[day] || [];
                const hasBreak = entries.some(e => e.is_break);
                return (
                  <TableCell key={day} align="center"
                    sx={{ fontWeight: 700, bgcolor: alpha(PRIMARY, 0.06), textTransform: 'capitalize',
                      borderLeft: '1px solid', borderColor: 'divider' }}>
                    {DAY_LABELS[day]}
                    {hasBreak && <Chip label="Break" size="small" sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: Math.max(maxPeriods, 8) }, (_, i) => i + 1).map(periodNum => (
              <TableRow key={periodNum} sx={{ '&:nth-of-type(odd)': { bgcolor: alpha('#000', 0.02) } }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.82rem' }}>
                  Period {periodNum}
                </TableCell>
                {DAYS.map(day => {
                  const entries = (timetable[day] || []).filter(e => e.period_number === periodNum);
                  const normalEntry = entries.find(e => !e.is_break);
                  const breakEntry = entries.find(e => e.is_break);

                  if (breakEntry) {
                    return (
                      <TableCell key={day} align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider', bgcolor: alpha('#f59e0b', 0.05) }}>
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>BREAK</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {breakEntry.start_time} - {breakEntry.end_time}
                        </Typography>
                      </TableCell>
                    );
                  }

                  if (normalEntry) {
                    const color = getColor(normalEntry.subject_name);
                    return (
                      <TableCell key={day} align="center" sx={{
                        borderLeft: '1px solid', borderColor: 'divider',
                        bgcolor: alpha(color, 0.04), position: 'relative',
                        '&:hover': { bgcolor: alpha(color, 0.08) }
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color }}>
                            {normalEntry.subject_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {normalEntry.class_name}{normalEntry.section_name ? ` - ${normalEntry.section_name}` : ''}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                            <AccessTime sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                              {normalEntry.start_time}
                            </Typography>
                          </Box>
                          {normalEntry.room_no && (
                            <Chip label={`Room ${normalEntry.room_no}`} size="small"
                              sx={{ height: 18, fontSize: '0.6rem', mt: 0.2 }} />
                          )}
                        </Box>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={day} align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.disabled">--</Typography>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
