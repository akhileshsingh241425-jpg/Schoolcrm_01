import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Skeleton, alpha, useTheme, IconButton,
  Stack, Divider, TextField, InputAdornment, Grid
} from '@mui/material';
import {
  Event, Refresh, Search, CalendarMonth, Info, Group,
  Sports, Celebration, MeetingRoom, Assignment, DateRange, FiberManualRecord
} from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';

const EVENT_COLORS = {
  holiday: '#ef4444', exam: '#8b5cf6', ptm: '#f59e0b', event: '#3b82f6',
  cultural: '#ec4899', sports: '#10b981', meeting: '#6366f1',
  deadline: '#f97316', vacation: '#06b6d4', other: '#6b7280',
};

const EVENT_ICONS = {
  holiday: <CalendarMonth />, exam: <Assignment />, ptm: <Group />,
  event: <Event />, cultural: <Celebration />, sports: <Sports />,
  meeting: <MeetingRoom />, deadline: <DateRange />, vacation: <DateRange />,
  other: <Event />,
};

export default function StaffEvents() {
  const theme = useTheme();
  const P = theme.palette.primary.main;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    attendanceAPI.staffEvents()
      .then(r => setEvents(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = events.filter(e =>
    !search || (e.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.event_type || '').toLowerCase().includes(search.toLowerCase())
  );

  const upcomingEvents = filtered.filter(e => e.is_upcoming);
  const activeEvents = filtered.filter(e => e.is_active && !e.is_upcoming);
  const pastEvents = filtered.filter(e => !e.is_active && !e.is_upcoming);

  if (loading) return (
    <Box>
      <Skeleton variant="rounded" height={60} sx={{ mb: 2 }} />
      {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={140} sx={{ mb: 1.5 }} />)}
    </Box>
  );

  const renderEventCard = (ev, status) => {
    const isPast = status === 'past';
    const color = isPast ? '#9e9e9e' : (EVENT_COLORS[ev.event_type] || '#6b7280');
    const icon = EVENT_ICONS[ev.event_type] || <Event />;
    const isHoliday = ev.is_holiday;

    const badge = (() => {
      if (ev.is_upcoming) return (
        <Chip icon={<FiberManualRecord sx={{ fontSize: 8 }} />}
          label="Upcoming" size="small"
          sx={{ fontWeight: 700, bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', fontSize: '0.65rem' }} />
      );
      if (ev.is_active) return (
        <Chip icon={<FiberManualRecord sx={{ fontSize: 8 }} />}
          label="Active" size="small"
          sx={{ fontWeight: 700, bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontSize: '0.65rem' }} />
      );
      return (
        <Chip label="Past" size="small"
          sx={{ fontWeight: 600, bgcolor: alpha('#9e9e9e', 0.1), color: '#9e9e9e', fontSize: '0.65rem' }} />
      );
    })();

    return (
      <Grid item xs={12} md={6} key={ev.id}>
        <Paper sx={{
          borderRadius: 3, overflow: 'hidden', height: '100%',
          border: '1px solid',
          borderColor: isPast ? alpha('#9e9e9e', 0.2) : alpha(color, 0.4),
          bgcolor: isPast ? alpha('#f5f5f5', 0.6) : alpha(color, 0.03),
          opacity: isPast ? 0.55 : 1,
          transition: 'all 0.2s',
          '&:hover': { borderColor: color, boxShadow: `0 4px 20px ${alpha(color, 0.12)}`, opacity: isPast ? 0.75 : 1 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
            <Box sx={{ width: 6, flexShrink: 0, bgcolor: color, opacity: isPast ? 0.3 : 1 }} />
            <Box sx={{ p: 2.5, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{
                    width: 36, height: 36,
                    bgcolor: alpha(isPast ? '#9e9e9e' : color, 0.12),
                    color: isPast ? '#9e9e9e' : color,
                  }}>
                    {React.cloneElement(icon, { sx: { fontSize: 18 } })}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, color: isPast ? 'text.secondary' : 'text.primary' }}>{ev.title}</Typography>
                    <Chip label={ev.event_type} size="small"
                      sx={{ mt: 0.3, fontWeight: 600, textTransform: 'capitalize', bgcolor: alpha(isPast ? '#9e9e9e' : color, 0.1), color: isPast ? '#9e9e9e' : color, fontSize: '0.65rem' }} />
                  </Box>
                </Box>
                {badge}
              </Box>

              {ev.description && (
                <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.5, color: isPast ? 'text.disabled' : 'text.secondary' }}>
                  {ev.description}
                </Typography>
              )}

              <Divider sx={{ my: 1.5, borderColor: isPast ? alpha('#9e9e9e', 0.15) : 'divider' }} />

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                <Chip icon={<CalendarMonth sx={{ fontSize: 14 }} />}
                  label={`${ev.start_date}${ev.end_date && ev.end_date !== ev.start_date ? ` to ${ev.end_date}` : ''}`}
                  size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                {isHoliday && (
                  <Chip icon={<Info sx={{ fontSize: 14 }} />}
                    label="Holiday" size="small"
                    sx={{ fontWeight: 600, bgcolor: alpha('#ef4444', 0.1), color: isPast ? '#9e9e9e' : '#ef4444', fontSize: '0.7rem' }} />
                )}
              </Stack>

              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.8,
                p: 1, borderRadius: 1.5,
                bgcolor: alpha(isPast ? '#9e9e9e' : color, 0.04),
                border: `1px dashed ${alpha(isPast ? '#9e9e9e' : color, 0.2)}`
              }}>
                <Group sx={{ fontSize: 14, color: isPast ? '#9e9e9e' : color, flexShrink: 0 }} />
                <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.4, color: isPast ? '#9e9e9e' : color }}>
                  {ev.audience || 'This event is for all students and staff'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(P, 0.1), color: P, width: 44, height: 44 }}>
            <Event />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>Events</Typography>
            <Typography variant="body2" color="text.secondary">All school events and activities</Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`${filtered.length} events`} size="small" sx={{ fontWeight: 600 }} />
          <IconButton onClick={load} size="small"><Refresh /></IconButton>
        </Stack>
      </Box>

      <Paper sx={{ p: 1.5, mb: 3, borderRadius: 3 }}>
        <TextField
          fullWidth size="small" placeholder="Search events..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment>,
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      {filtered.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">{events.length === 0 ? 'No events yet' : 'No events match your search'}</Typography>
        </Paper>
      ) : (
        <Box>
          {upcomingEvents.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                Upcoming Events ({upcomingEvents.length})
              </Typography>
              <Grid container spacing={2}>
                {upcomingEvents.map(ev => renderEventCard(ev, 'upcoming'))}
              </Grid>
            </Box>
          )}
          {activeEvents.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                Active Events ({activeEvents.length})
              </Typography>
              <Grid container spacing={2}>
                {activeEvents.map(ev => renderEventCard(ev, 'active'))}
              </Grid>
            </Box>
          )}
          {pastEvents.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                Past Events ({pastEvents.length})
              </Typography>
              <Grid container spacing={2}>
                {pastEvents.map(ev => renderEventCard(ev, 'past'))}
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
