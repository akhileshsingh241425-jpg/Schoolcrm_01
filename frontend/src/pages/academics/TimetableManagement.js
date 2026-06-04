import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Skeleton, alpha, useTheme, IconButton, Tooltip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox,
  Tabs, Tab, Grid, Alert, CircularProgress
} from '@mui/material';
import {
  Refresh, Add, Edit, Delete, Warning, AutoFixHigh, ContentCopy,
  AccessTime, School
} from '@mui/icons-material';
import { academicsAPI, studentsAPI, staffAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday'
};
const PERIOD_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PERIOD_COLORS[Math.abs(hash) % PERIOD_COLORS.length];
}

const DEFAULT_PERIODS = [
  { period_number: 1, start_time: '08:00', end_time: '08:45', is_break: false },
  { period_number: 2, start_time: '08:45', end_time: '09:30', is_break: false },
  { period_number: 3, start_time: '09:30', end_time: '10:15', is_break: false },
  { period_number: 4, start_time: '10:15', end_time: '10:30', is_break: true },
  { period_number: 5, start_time: '10:30', end_time: '11:15', is_break: false },
  { period_number: 6, start_time: '11:15', end_time: '12:00', is_break: false },
  { period_number: 7, start_time: '12:00', end_time: '12:45', is_break: true },
  { period_number: 8, start_time: '12:45', end_time: '13:30', is_break: false },
];

export default function TimetableManagement() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [conflicts, setConflicts] = useState([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    subject_id: '', teacher_id: '', room_no: '',
    start_time: '', end_time: '', period_number: 1,
    day_of_week: 'monday', is_break: false
  });
  const [saving, setSaving] = useState(false);

  // Bulk create state
  const [bulkEntries, setBulkEntries] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Auto-generate state
  const [autoGenerating, setAutoGenerating] = useState(false);

  // Period management dialog
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);

  // Load classes on mount
  useEffect(() => {
    studentsAPI.listClasses().then(res => {
      const data = res.data.data || res.data || [];
      setClasses(Array.isArray(data) ? data : []);
    }).catch(() => toast.error('Failed to load classes'));
  }, []);

  // Load sections when class changes
  useEffect(() => {
    if (!selectedClass) { setSections([]); setSelectedSection(''); return; }
    studentsAPI.listSections(selectedClass).then(res => {
      const data = res.data.data || res.data || [];
      setSections(Array.isArray(data) ? data : []);
    }).catch(() => setSections([]));
  }, [selectedClass]);

  // Load subjects and teachers
  useEffect(() => {
    academicsAPI.listSubjects({ limit: 200 }).then(res => {
      const data = res.data.data || res.data || [];
      setSubjects(Array.isArray(data) ? data : []);
    }).catch(() => {});
    staffAPI.list({ role: 'teacher', limit: 200 }).then(res => {
      const data = res.data.data || res.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  // Load timetable
  const loadTimetable = useCallback(() => {
    if (!selectedClass) return;
    setLoading(true);
    const params = { class_id: selectedClass };
    if (selectedSection) params.section_id = selectedSection;
    academicsAPI.getTimetable(params)
      .then(res => {
        const entries = res.data.data || res.data || [];
        const byDay = {};
        DAYS.forEach(d => byDay[d] = []);
        (Array.isArray(entries) ? entries : []).forEach(e => {
          if (byDay[e.day_of_week]) byDay[e.day_of_week].push(e);
        });
        DAYS.forEach(d => byDay[d].sort((a, b) => (a.period_number || 0) - (b.period_number || 0)));
        setTimetable(byDay);
      })
      .catch(() => toast.error('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSection]);

  useEffect(() => { loadTimetable(); }, [loadTimetable]);

  // Check conflicts
  const checkConflicts = async (data) => {
    try {
      const res = await academicsAPI.checkTimetableConflicts(data);
      const conflictData = res.data.data || res.data || [];
      setConflicts(Array.isArray(conflictData) ? conflictData : []);
      return Array.isArray(conflictData) ? conflictData : [];
    } catch {
      return [];
    }
  };

  // Open add dialog
  const handleAddEntry = (day, periodNum) => {
    const period = periods.find(p => p.period_number === periodNum) || {};
    setEditingEntry(null);
    setFormData({
      subject_id: '', teacher_id: '', room_no: '',
      start_time: period.start_time || '', end_time: period.end_time || '',
      period_number: periodNum, day_of_week: day, is_break: false
    });
    setConflicts([]);
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      subject_id: entry.subject_id || '',
      teacher_id: entry.teacher_id || '',
      room_no: entry.room_no || '',
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      period_number: entry.period_number || 1,
      day_of_week: entry.day_of_week || 'monday',
      is_break: entry.is_break || false
    });
    setConflicts([]);
    setDialogOpen(true);
  };

  // Save entry (create or update)
  const handleSaveEntry = async () => {
    if (!formData.is_break && !formData.subject_id) {
      toast.error('Please select a subject');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        class_id: selectedClass,
        section_id: selectedSection || undefined
      };

      // Check conflicts before saving
      if (!formData.is_break) {
        const foundConflicts = await checkConflicts(payload);
        if (foundConflicts.length > 0) {
          toast.error('Conflicts detected! Please resolve before saving.');
          setSaving(false);
          return;
        }
      }

      if (editingEntry) {
        await academicsAPI.updateTimetable(editingEntry.id, payload);
        toast.success('Timetable entry updated');
      } else {
        await academicsAPI.createTimetableEntry(payload);
        toast.success('Timetable entry created');
      }
      setDialogOpen(false);
      loadTimetable();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this timetable entry?')) return;
    try {
      await academicsAPI.deleteTimetableEntry(id);
      toast.success('Entry deleted');
      loadTimetable();
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  // Bulk create
  const handleBulkCreate = async () => {
    if (bulkEntries.length === 0) {
      toast.error('No entries to create');
      return;
    }
    setBulkSaving(true);
    try {
      const payload = {
        class_id: selectedClass,
        section_id: selectedSection || undefined,
        entries: bulkEntries
      };
      await academicsAPI.bulkCreateTimetable(payload);
      toast.success(`${bulkEntries.length} entries created successfully`);
      setBulkEntries([]);
      setActiveTab(0);
      loadTimetable();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bulk create failed');
    } finally {
      setBulkSaving(false);
    }
  };

  // Auto-generate timetable
  const handleAutoGenerate = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    if (!window.confirm('This will auto-generate a timetable based on teacher-subject allocations. Existing entries may be overwritten. Continue?')) return;
    setAutoGenerating(true);
    try {
      const payload = {
        class_id: selectedClass,
        section_id: selectedSection || undefined,
        periods: periods
      };
      await academicsAPI.autoGenerateTimetable(payload);
      toast.success('Timetable auto-generated successfully');
      loadTimetable();
      setActiveTab(0);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Auto-generation failed');
    } finally {
      setAutoGenerating(false);
    }
  };

  // Add bulk entry row
  const addBulkRow = () => {
    setBulkEntries(prev => [...prev, {
      day_of_week: 'monday', period_number: 1, subject_id: '',
      teacher_id: '', room_no: '', start_time: '08:00', end_time: '08:45', is_break: false
    }]);
  };

  const updateBulkEntry = (index, field, value) => {
    setBulkEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const removeBulkEntry = (index) => {
    setBulkEntries(prev => prev.filter((_, i) => i !== index));
  };

  // Get max periods from timetable data
  const getMaxPeriods = () => {
    const allNums = DAYS.reduce((acc, d) => {
      const nums = (timetable[d] || []).map(e => e.period_number || 0);
      return [...acc, ...nums];
    }, []);
    const periodNums = periods.map(p => p.period_number);
    const combined = [...new Set([...allNums, ...periodNums])];
    return Math.max(...combined, 8);
  };

  // Render top bar
  const renderTopBar = () => (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Class</InputLabel>
          <Select value={selectedClass} label="Class"
            onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
            <MenuItem value="">-- Select --</MenuItem>
            {classes.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Section</InputLabel>
          <Select value={selectedSection} label="Section"
            onChange={e => setSelectedSection(e.target.value)} disabled={!selectedClass}>
            <MenuItem value="">All Sections</MenuItem>
            {sections.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button size="small" variant="outlined" startIcon={<AccessTime />}
          onClick={() => setPeriodDialogOpen(true)}>
          Manage Periods
        </Button>

        <Tooltip title="Refresh">
          <IconButton onClick={loadTimetable} sx={{ color: PRIMARY }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );

  // Render weekly grid view
  const renderWeeklyView = () => {
    if (!selectedClass) {
      return (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <School sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">Select a class to view timetable</Typography>
        </Paper>
      );
    }

    if (loading) {
      return <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />;
    }

    const maxPeriods = getMaxPeriods();

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, bgcolor: alpha(PRIMARY, 0.06), minWidth: 80, position: 'sticky', left: 0, zIndex: 2 }}>
                Period
              </TableCell>
              {DAYS.map(day => (
                <TableCell key={day} align="center"
                  sx={{ fontWeight: 700, bgcolor: alpha(PRIMARY, 0.06), minWidth: 140,
                    borderLeft: '1px solid', borderColor: 'divider' }}>
                  {DAY_LABELS[day]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: maxPeriods }, (_, i) => i + 1).map(periodNum => {
              const periodDef = periods.find(p => p.period_number === periodNum);
              const isBreakPeriod = periodDef?.is_break;

              return (
                <TableRow key={periodNum} sx={{
                  bgcolor: isBreakPeriod ? alpha('#f59e0b', 0.04) : (periodNum % 2 === 0 ? alpha('#000', 0.01) : 'transparent')
                }}>
                  <TableCell sx={{
                    fontWeight: 600, fontSize: '0.78rem', color: 'text.secondary',
                    position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1
                  }}>
                    <Box>
                      <Typography variant="caption" fontWeight={700}>
                        {isBreakPeriod ? 'Break' : `Period ${periodNum}`}
                      </Typography>
                      {periodDef && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                          {periodDef.start_time} - {periodDef.end_time}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {DAYS.map(day => {
                    const entries = (timetable[day] || []).filter(e => e.period_number === periodNum);
                    const entry = entries[0];

                    if (isBreakPeriod || entry?.is_break) {
                      return (
                        <TableCell key={day} align="center" sx={{
                          borderLeft: '1px solid', borderColor: 'divider',
                          bgcolor: alpha('#f59e0b', 0.05)
                        }}>
                          <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                            BREAK
                          </Typography>
                        </TableCell>
                      );
                    }

                    if (entry) {
                      const color = getColor(entry.subject_name);
                      return (
                        <TableCell key={day} align="center" sx={{
                          borderLeft: '1px solid', borderColor: 'divider',
                          bgcolor: alpha(color, 0.04), position: 'relative', cursor: 'pointer',
                          '&:hover': { bgcolor: alpha(color, 0.1) },
                          '&:hover .entry-actions': { opacity: 1 }
                        }} onClick={() => handleEditEntry(entry)}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color, fontSize: '0.78rem' }}>
                              {entry.subject_name}
                            </Typography>
                            {entry.teacher_name && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                {entry.teacher_name}
                              </Typography>
                            )}
                            {entry.room_no && (
                              <Chip label={`R-${entry.room_no}`} size="small"
                                sx={{ height: 16, fontSize: '0.58rem' }} />
                            )}
                          </Box>
                          <Box className="entry-actions" sx={{
                            position: 'absolute', top: 2, right: 2, opacity: 0,
                            transition: 'opacity 0.2s', display: 'flex', gap: 0.2
                          }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                              sx={{ p: 0.3, color: 'error.main', fontSize: '0.7rem' }}>
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      );
                    }

                    // Empty cell - show add button
                    return (
                      <TableCell key={day} align="center" sx={{
                        borderLeft: '1px solid', borderColor: 'divider', cursor: 'pointer',
                        '&:hover': { bgcolor: alpha(PRIMARY, 0.04) },
                        '&:hover .add-btn': { opacity: 1 }
                      }} onClick={() => handleAddEntry(day, periodNum)}>
                        <IconButton className="add-btn" size="small"
                          sx={{ opacity: 0.3, transition: 'opacity 0.2s', color: PRIMARY }}>
                          <Add sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render bulk create tab
  const renderBulkCreate = () => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Bulk Create Entries</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<Add />} onClick={addBulkRow}>Add Row</Button>
          <Button size="small" variant="contained" startIcon={<ContentCopy />}
            onClick={handleBulkCreate} disabled={bulkSaving || bulkEntries.length === 0}>
            {bulkSaving ? <CircularProgress size={18} /> : `Create ${bulkEntries.length} Entries`}
          </Button>
        </Box>
      </Box>

      {!selectedClass && (
        <Alert severity="warning" sx={{ mb: 2 }}>Please select a class first</Alert>
      )}

      {bulkEntries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Click "Add Row" to start building entries</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {bulkEntries.map((entry, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} sm={1.5}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Day</InputLabel>
                    <Select value={entry.day_of_week} label="Day"
                      onChange={e => updateBulkEntry(idx, 'day_of_week', e.target.value)}>
                      {DAYS.map(d => <MenuItem key={d} value={d}>{DAY_LABELS[d]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={1}>
                  <TextField size="small" label="Period" type="number" fullWidth
                    value={entry.period_number}
                    onChange={e => updateBulkEntry(idx, 'period_number', parseInt(e.target.value) || 1)} />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Subject</InputLabel>
                    <Select value={entry.subject_id} label="Subject"
                      onChange={e => updateBulkEntry(idx, 'subject_id', e.target.value)}>
                      {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Teacher</InputLabel>
                    <Select value={entry.teacher_id} label="Teacher"
                      onChange={e => updateBulkEntry(idx, 'teacher_id', e.target.value)}>
                      {teachers.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={1}>
                  <TextField size="small" label="Room" fullWidth value={entry.room_no}
                    onChange={e => updateBulkEntry(idx, 'room_no', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField size="small" label="Start" type="time" fullWidth
                    value={entry.start_time} InputLabelProps={{ shrink: true }}
                    onChange={e => updateBulkEntry(idx, 'start_time', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField size="small" label="End" type="time" fullWidth
                    value={entry.end_time} InputLabelProps={{ shrink: true }}
                    onChange={e => updateBulkEntry(idx, 'end_time', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={1}>
                  <FormControlLabel control={
                    <Checkbox size="small" checked={entry.is_break}
                      onChange={e => updateBulkEntry(idx, 'is_break', e.target.checked)} />
                  } label="Break" sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }} />
                </Grid>
                <Grid item xs={6} sm={0.5}>
                  <IconButton size="small" color="error" onClick={() => removeBulkEntry(idx)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      )}
    </Paper>
  );

  // Render auto-generate tab
  const renderAutoGenerate = () => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Auto-Generate Timetable</Typography>

      {!selectedClass && (
        <Alert severity="warning" sx={{ mb: 2 }}>Please select a class first</Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Auto-generation will create a timetable based on teacher-subject allocations for the selected class.
        It will distribute subjects evenly across the week while avoiding teacher conflicts.
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Period Configuration</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The following period slots will be used for generation:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {periods.map(p => (
            <Chip key={p.period_number}
              label={p.is_break ? `Break (${p.start_time}-${p.end_time})` : `P${p.period_number}: ${p.start_time}-${p.end_time}`}
              size="small" color={p.is_break ? 'warning' : 'default'}
              variant={p.is_break ? 'filled' : 'outlined'} />
          ))}
        </Box>
      </Box>

      <Button variant="contained" size="large" startIcon={<AutoFixHigh />}
        onClick={handleAutoGenerate} disabled={autoGenerating || !selectedClass}>
        {autoGenerating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
        {autoGenerating ? 'Generating...' : 'Auto-Generate Timetable'}
      </Button>
    </Paper>
  );

  // Render add/edit dialog
  const renderEntryDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {conflicts.length > 0 && (
            <Alert severity="warning" icon={<Warning />}>
              <Typography variant="body2" fontWeight={600}>Conflicts Detected:</Typography>
              {conflicts.map((c, i) => (
                <Typography key={i} variant="caption" display="block">
                  • {c.message || c.conflict_type || 'Schedule conflict'}
                </Typography>
              ))}
            </Alert>
          )}

          <FormControl size="small" fullWidth>
            <InputLabel>Day</InputLabel>
            <Select value={formData.day_of_week} label="Day"
              onChange={e => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}>
              {DAYS.map(d => <MenuItem key={d} value={d}>{DAY_LABELS[d]}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField size="small" label="Period Number" type="number" fullWidth
            value={formData.period_number}
            onChange={e => setFormData(prev => ({ ...prev, period_number: parseInt(e.target.value) || 1 }))} />

          <FormControlLabel control={
            <Checkbox checked={formData.is_break}
              onChange={e => setFormData(prev => ({ ...prev, is_break: e.target.checked }))} />
          } label="Mark as Break Period" />

          {!formData.is_break && (
            <>
              <FormControl size="small" fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select value={formData.subject_id} label="Subject"
                  onChange={e => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}>
                  {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Teacher</InputLabel>
                <Select value={formData.teacher_id} label="Teacher"
                  onChange={e => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}>
                  <MenuItem value="">-- None --</MenuItem>
                  {teachers.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField size="small" label="Room No" fullWidth value={formData.room_no}
                onChange={e => setFormData(prev => ({ ...prev, room_no: e.target.value }))} />
            </>
          )}

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField size="small" label="Start Time" type="time" fullWidth
                value={formData.start_time} InputLabelProps={{ shrink: true }}
                onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField size="small" label="End Time" type="time" fullWidth
                value={formData.end_time} InputLabelProps={{ shrink: true }}
                onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSaveEntry} disabled={saving}>
          {saving ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          {editingEntry ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Render period management dialog
  const renderPeriodDialog = () => (
    <Dialog open={periodDialogOpen} onClose={() => setPeriodDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Manage Period Slots</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
          {periods.map((period, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={2}>
                  <TextField size="small" label="P#" type="number" fullWidth
                    value={period.period_number}
                    onChange={e => {
                      const updated = [...periods];
                      updated[idx] = { ...updated[idx], period_number: parseInt(e.target.value) || 1 };
                      setPeriods(updated);
                    }} />
                </Grid>
                <Grid item xs={3}>
                  <TextField size="small" label="Start" type="time" fullWidth
                    value={period.start_time} InputLabelProps={{ shrink: true }}
                    onChange={e => {
                      const updated = [...periods];
                      updated[idx] = { ...updated[idx], start_time: e.target.value };
                      setPeriods(updated);
                    }} />
                </Grid>
                <Grid item xs={3}>
                  <TextField size="small" label="End" type="time" fullWidth
                    value={period.end_time} InputLabelProps={{ shrink: true }}
                    onChange={e => {
                      const updated = [...periods];
                      updated[idx] = { ...updated[idx], end_time: e.target.value };
                      setPeriods(updated);
                    }} />
                </Grid>
                <Grid item xs={2.5}>
                  <FormControlLabel control={
                    <Checkbox size="small" checked={period.is_break}
                      onChange={e => {
                        const updated = [...periods];
                        updated[idx] = { ...updated[idx], is_break: e.target.checked };
                        setPeriods(updated);
                      }} />
                  } label="Break" sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }} />
                </Grid>
                <Grid item xs={1.5}>
                  <IconButton size="small" color="error"
                    onClick={() => setPeriods(prev => prev.filter((_, i) => i !== idx))}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Button size="small" startIcon={<Add />} onClick={() => {
            const nextNum = periods.length > 0 ? Math.max(...periods.map(p => p.period_number)) + 1 : 1;
            setPeriods(prev => [...prev, { period_number: nextNum, start_time: '', end_time: '', is_break: false }]);
          }}>
            Add Period Slot
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setPeriodDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Timetable Management</Typography>
      </Box>

      {/* Top Bar - Class/Section Selector */}
      {renderTopBar()}

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label="Weekly View" />
          <Tab label="Bulk Create" />
          <Tab label="Auto Generate" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && renderWeeklyView()}
      {activeTab === 1 && renderBulkCreate()}
      {activeTab === 2 && renderAutoGenerate()}

      {/* Dialogs */}
      {renderEntryDialog()}
      {renderPeriodDialog()}
    </Box>
  );
}
