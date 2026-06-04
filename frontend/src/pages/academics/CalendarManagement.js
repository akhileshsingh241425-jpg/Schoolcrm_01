import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, IconButton, Grid, Tabs, Tab, FormControlLabel, Checkbox,
  alpha, useTheme, Tooltip, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, Add, Edit, Delete, Event,
  CalendarMonth, ViewList, FilterList
} from '@mui/icons-material';
import { academicsAPI, studentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// Event type color mapping
const EVENT_TYPE_COLORS = {
  holiday: '#ef4444',
  exam: '#f59e0b',
  ptm: '#8b5cf6',
  event: '#3b82f6',
  cultural: '#ec4899',
  sports: '#10b981',
  meeting: '#06b6d4',
  deadline: '#f97316',
  vacation: '#6366f1',
};

const EVENT_TYPE_LABELS = {
  holiday: 'Holiday',
  exam: 'Exam',
  ptm: 'PTM',
  event: 'Event',
  cultural: 'Cultural',
  sports: 'Sports',
  meeting: 'Meeting',
  deadline: 'Deadline',
  vacation: 'Vacation',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_FORM = {
  title: '',
  description: '',
  event_type: 'event',
  start_date: '',
  end_date: '',
  class_id: '',
  is_holiday: false,
  color: '#3b82f6',
};

export default function CalendarManagement() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  // State
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeFilters, setActiveFilters] = useState([]);
  const [classes, setClasses] = useState([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);

  // Load classes on mount
  useEffect(() => {
    studentsAPI.listClasses().then(res => {
      const data = res.data.data || res.data || [];
      setClasses(data);
    }).catch(() => {});
  }, []);

  // Load events when month changes
  const loadEvents = useCallback(() => {
    setLoading(true);
    const params = {
      month: currentMonth.month() + 1,
      year: currentMonth.year(),
    };
    academicsAPI.getCalendar(params)
      .then(res => {
        const data = res.data.data || res.data || [];
        setEvents(data);
      })
      .catch(() => toast.error('Failed to load calendar events'))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Navigation
  const goToPrevMonth = () => setCurrentMonth(prev => prev.subtract(1, 'month'));
  const goToNextMonth = () => setCurrentMonth(prev => prev.add(1, 'month'));
  const goToToday = () => setCurrentMonth(dayjs());

  // Filter toggle
  const toggleFilter = (type) => {
    setActiveFilters(prev =>
      prev.includes(type) ? prev.filter(f => f !== type) : [...prev, type]
    );
  };

  // Filtered events
  const filteredEvents = activeFilters.length > 0
    ? events.filter(e => activeFilters.includes(e.event_type))
    : events;

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return filteredEvents.filter(e => {
      const start = dayjs(e.start_date).format('YYYY-MM-DD');
      const end = e.end_date ? dayjs(e.end_date).format('YYYY-MM-DD') : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Check if date is a holiday
  const isHoliday = (date) => {
    const dateEvents = getEventsForDate(date);
    return dateEvents.some(e => e.is_holiday || e.event_type === 'holiday');
  };

  // Calendar grid generation
  const generateCalendarDays = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day(); // 0 = Sunday
    const daysInMonth = endOfMonth.date();

    const days = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(currentMonth.date(d));
    }

    return days;
  };

  // Dialog handlers
  const openAddDialog = () => {
    setEditingEvent(null);
    setFormData({
      ...DEFAULT_FORM,
      start_date: currentMonth.format('YYYY-MM-DD'),
      end_date: currentMonth.format('YYYY-MM-DD'),
    });
    setDialogOpen(true);
  };

  const openEditDialog = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || 'event',
      start_date: event.start_date ? dayjs(event.start_date).format('YYYY-MM-DD') : '',
      end_date: event.end_date ? dayjs(event.end_date).format('YYYY-MM-DD') : '',
      class_id: event.class_id || '',
      is_holiday: event.is_holiday || false,
      color: event.color || EVENT_TYPE_COLORS[event.event_type] || '#3b82f6',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingEvent(null);
    setFormData({ ...DEFAULT_FORM });
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-update color when event type changes
      if (field === 'event_type') {
        updated.color = EVENT_TYPE_COLORS[value] || '#3b82f6';
        if (value === 'holiday' || value === 'vacation') {
          updated.is_holiday = true;
        }
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.start_date) {
      toast.error('Start date is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        class_id: formData.class_id || null,
      };

      if (editingEvent) {
        await academicsAPI.updateCalendarEvent(editingEvent.id, payload);
        toast.success('Event updated successfully');
      } else {
        await academicsAPI.createCalendarEvent(payload);
        toast.success('Event created successfully');
      }
      closeDialog();
      loadEvents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save event';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (event) => {
    setDeletingEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    try {
      await academicsAPI.deleteCalendarEvent(deletingEvent.id);
      toast.success('Event deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingEvent(null);
      loadEvents();
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  // Render month view
  const renderMonthView = () => {
    const days = generateCalendarDays();
    const today = dayjs().format('YYYY-MM-DD');

    return (
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        {/* Day headers */}
        <Grid container spacing={0}>
          {DAYS_OF_WEEK.map(day => (
            <Grid item xs key={day} sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar grid */}
        <Grid container spacing={0}>
          {days.map((date, idx) => {
            if (!date) {
              return (
                <Grid item xs key={`empty-${idx}`} sx={{ minHeight: 100, borderTop: '1px solid', borderColor: 'divider' }} />
              );
            }

            const dateStr = date.format('YYYY-MM-DD');
            const dayEvents = getEventsForDate(date);
            const isToday = dateStr === today;
            const holiday = isHoliday(date);

            return (
              <Grid item xs key={dateStr} sx={{
                minHeight: 100,
                borderTop: '1px solid',
                borderColor: 'divider',
                p: 0.5,
                backgroundColor: holiday
                  ? alpha(EVENT_TYPE_COLORS.holiday, 0.05)
                  : isToday
                    ? alpha(PRIMARY, 0.04)
                    : 'transparent',
                '&:hover': { backgroundColor: alpha(PRIMARY, 0.06) },
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}>
                <Typography
                  variant="body2"
                  fontWeight={isToday ? 700 : 400}
                  sx={{
                    width: 24,
                    height: 24,
                    lineHeight: '24px',
                    textAlign: 'center',
                    borderRadius: '50%',
                    backgroundColor: isToday ? PRIMARY : 'transparent',
                    color: isToday ? '#fff' : holiday ? EVENT_TYPE_COLORS.holiday : 'text.primary',
                    mb: 0.5,
                  }}
                >
                  {date.date()}
                </Typography>

                {/* Event chips */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                  {dayEvents.slice(0, 3).map((evt, i) => (
                    <Chip
                      key={evt.id || i}
                      label={evt.title}
                      size="small"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(evt); }}
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 500,
                        backgroundColor: alpha(evt.color || EVENT_TYPE_COLORS[evt.event_type] || '#3b82f6', 0.15),
                        color: evt.color || EVENT_TYPE_COLORS[evt.event_type] || '#3b82f6',
                        border: `1px solid ${alpha(evt.color || EVENT_TYPE_COLORS[evt.event_type] || '#3b82f6', 0.3)}`,
                        '& .MuiChip-label': { px: 0.5 },
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', pl: 0.5 }}>
                      +{dayEvents.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    );
  };

  // Render list view
  const renderListView = () => {
    const sortedEvents = [...filteredEvents].sort((a, b) =>
      dayjs(a.start_date).diff(dayjs(b.start_date))
    );

    if (sortedEvents.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Event sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No events found for this month</Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Holiday</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEvents.map(evt => {
              const color = evt.color || EVENT_TYPE_COLORS[evt.event_type] || '#3b82f6';
              const className = classes.find(c => c.id === evt.class_id);
              return (
                <TableRow key={evt.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={500}>{evt.title}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={EVENT_TYPE_LABELS[evt.event_type] || evt.event_type}
                      size="small"
                      sx={{
                        backgroundColor: alpha(color, 0.12),
                        color: color,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{dayjs(evt.start_date).format('DD MMM YYYY')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {evt.end_date ? dayjs(evt.end_date).format('DD MMM YYYY') : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {className ? `${className.name} ${className.section || ''}`.trim() : 'All'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {evt.is_holiday && (
                      <Chip label="Holiday" size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditDialog(evt)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => openDeleteDialog(evt)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render event dialog
  const renderEventDialog = () => (
    <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {editingEvent ? 'Edit Event' : 'Add New Event'}
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={e => handleFormChange('title', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={e => handleFormChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.event_type}
                label="Event Type"
                onChange={e => handleFormChange('event_type', e.target.value)}
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: EVENT_TYPE_COLORS[key] }} />
                      {label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Class (Optional)</InputLabel>
              <Select
                value={formData.class_id}
                label="Class (Optional)"
                onChange={e => handleFormChange('class_id', e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.start_date}
              onChange={e => handleFormChange('start_date', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.end_date}
              onChange={e => handleFormChange('end_date', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Color"
              type="color"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.color}
              onChange={e => handleFormChange('color', e.target.value)}
              sx={{ '& input': { height: 40, cursor: 'pointer' } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_holiday}
                  onChange={e => handleFormChange('is_holiday', e.target.checked)}
                />
              }
              label="Mark as Holiday"
              sx={{ mt: 1 }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {editingEvent && (
          <Button
            color="error"
            onClick={() => { closeDialog(); openDeleteDialog(editingEvent); }}
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        <Button onClick={closeDialog}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : editingEvent ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render delete confirmation dialog
  const renderDeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Delete Event</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "<strong>{deletingEvent?.title}</strong>"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            Calendar Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage school events, holidays, and academic calendar
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openAddDialog}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Add Event
        </Button>
      </Box>

      {/* Month Navigation */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goToPrevMonth} size="small">
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ minWidth: 160, textAlign: 'center' }}>
            {currentMonth.format('MMMM YYYY')}
          </Typography>
          <IconButton onClick={goToNextMonth} size="small">
            <ChevronRight />
          </IconButton>
          <Button size="small" onClick={goToToday} sx={{ ml: 1, textTransform: 'none' }}>
            Today
          </Button>
        </Box>

        {/* Filter chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <FilterList sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <Chip
              key={key}
              label={label}
              size="small"
              onClick={() => toggleFilter(key)}
              sx={{
                fontSize: '0.7rem',
                fontWeight: 500,
                backgroundColor: activeFilters.includes(key)
                  ? alpha(EVENT_TYPE_COLORS[key], 0.2)
                  : alpha(EVENT_TYPE_COLORS[key], 0.08),
                color: EVENT_TYPE_COLORS[key],
                border: activeFilters.includes(key)
                  ? `1.5px solid ${EVENT_TYPE_COLORS[key]}`
                  : '1.5px solid transparent',
                '&:hover': { backgroundColor: alpha(EVENT_TYPE_COLORS[key], 0.2) },
              }}
            />
          ))}
          {activeFilters.length > 0 && (
            <Chip
              label="Clear"
              size="small"
              variant="outlined"
              onClick={() => setActiveFilters([])}
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 42 },
            '& .MuiTabs-indicator': { borderRadius: 2 },
          }}
        >
          <Tab icon={<CalendarMonth sx={{ fontSize: 18 }} />} iconPosition="start" label="Month View" />
          <Tab icon={<ViewList sx={{ fontSize: 18 }} />} iconPosition="start" label="List View" />
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderMonthView()}
          {activeTab === 1 && renderListView()}
        </>
      )}

      {/* Dialogs */}
      {renderEventDialog()}
      {renderDeleteDialog()}
    </Box>
  );
}
