import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, IconButton, Tooltip, TextField, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch,
  Skeleton, alpha, useTheme, Stack, CircularProgress
} from '@mui/material';
import {
  Assignment, CheckCircle, HourglassEmpty, Block, Lock, LockOpen,
  Schedule, Warning, Refresh, GroupAdd, Timer, FilterList
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { marksEntryAPI, academicsAPI, studentsAPI, staffAPI } from '../../services/api';

// Normalize various API response shapes into a plain array.
// Handles: res.data.data.items (paginated), res.data.data (array), res.data (array)
function toList(res) {
  const d = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.items)) return d.items;
  return [];
}

// Status chip color mapping
const STATUS_CONFIG = {
  completed: { color: 'success', label: 'Completed' },
  in_progress: { color: 'info', label: 'In Progress' },
  not_started: { color: 'default', label: 'Not Started' },
  locked: { color: 'secondary', label: 'Locked' },
  overdue: { color: 'error', label: 'Overdue' },
};

// Summary card config
const SUMMARY_CARDS = [
  { key: 'total_schedules', label: 'Total Schedules', icon: Assignment, color: '#3b82f6' },
  { key: 'completed', label: 'Completed', icon: CheckCircle, color: '#10b981' },
  { key: 'in_progress', label: 'In Progress', icon: HourglassEmpty, color: '#3b82f6' },
  { key: 'not_started', label: 'Not Started', icon: Block, color: '#6b7280' },
  { key: 'locked', label: 'Locked', icon: Lock, color: '#8b5cf6' },
  { key: 'overdue', label: 'Overdue', icon: Warning, color: '#ef4444' },
];

export default function MarksEntryDashboard() {
  const theme = useTheme();

  // State
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(false);
  const [examsLoading, setExamsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Filters
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  // Dialogs
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignResult, setBulkAssignResult] = useState(null);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);

  const [manualAssignOpen, setManualAssignOpen] = useState(false);
  const [manualAssignSchedule, setManualAssignSchedule] = useState(null);
  const [manualAssignTeacher, setManualAssignTeacher] = useState('');
  const [manualAssignLoading, setManualAssignLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(null);
  const [deadlineAutoLock, setDeadlineAutoLock] = useState(false);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState([]);

  const [lockLoading, setLockLoading] = useState({});

  // Load exams on mount
  useEffect(() => {
    loadExams();
    loadFilters();
  }, []);

  const loadExams = async () => {
    setExamsLoading(true);
    try {
      const res = await academicsAPI.listExams();
      setExams(toList(res));
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setExamsLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [classRes, subjectRes] = await Promise.all([
        studentsAPI.listClasses(),
        academicsAPI.listSubjects(),
      ]);
      setClasses(toList(classRes));
      setSubjects(toList(subjectRes));
    } catch (err) {
      // Filters are non-critical
    }
  };

  // Load sections when class changes
  useEffect(() => {
    if (filterClass) {
      studentsAPI.listSections(filterClass).then(res => {
        setSections(toList(res));
      }).catch(() => setSections([]));
    } else {
      setSections([]);
      setFilterSection('');
    }
  }, [filterClass]);

  // Load dashboard data when exam or filters change
  useEffect(() => {
    if (selectedExam) {
      loadDashboard();
    }
  }, [selectedExam, filterClass, filterSection, filterSubject]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const params = { exam_id: selectedExam };
      if (filterClass) params.class_id = filterClass;
      if (filterSection) params.section_id = filterSection;
      if (filterSubject) params.subject_id = filterSubject;

      const res = await marksEntryAPI.getDashboard(params);
      const data = res.data.data || res.data;
      setSummary(data.summary || {});
      setSchedules(data.schedules || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
      setSummary(null);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Assign
  const handleBulkAssign = async () => {
    setBulkAssignLoading(true);
    setBulkAssignResult(null);
    try {
      const res = await marksEntryAPI.bulkAssign({ exam_id: selectedExam });
      const data = res.data.data || res.data;
      setBulkAssignResult(data);
      toast.success(`Assigned ${data.assigned || 0} schedules`);
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk assignment failed');
    } finally {
      setBulkAssignLoading(false);
    }
  };

  // Manual Assign
  const openManualAssign = async (schedule) => {
    setManualAssignSchedule(schedule);
    setManualAssignTeacher('');
    setManualAssignOpen(true);
    try {
      const res = await staffAPI.list({ role: 'teacher', limit: 200 });
      setTeachers(toList(res));
    } catch (err) {
      toast.error('Failed to load teachers');
    }
  };

  const handleManualAssign = async () => {
    if (!manualAssignTeacher || !manualAssignSchedule) return;
    setManualAssignLoading(true);
    try {
      await marksEntryAPI.manualAssign({
        exam_schedule_id: manualAssignSchedule.exam_schedule_id,
        teacher_id: manualAssignTeacher,
        reassign: true,
      });
      toast.success('Teacher assigned successfully');
      setManualAssignOpen(false);
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    } finally {
      setManualAssignLoading(false);
    }
  };

  // Deadline
  const openDeadlineDialog = (scheduleIds) => {
    setSelectedSchedules(scheduleIds);
    setDeadlineDate(null);
    setDeadlineAutoLock(false);
    setDeadlineOpen(true);
  };

  const handleSetDeadlines = async () => {
    if (!deadlineDate || selectedSchedules.length === 0) return;
    setDeadlineLoading(true);
    try {
      const deadlines = selectedSchedules.map(id => ({
        exam_schedule_id: id,
        deadline_date: deadlineDate.toISOString(),
        auto_lock: deadlineAutoLock,
      }));
      await marksEntryAPI.setDeadlines({ deadlines });
      toast.success('Deadlines set successfully');
      setDeadlineOpen(false);
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set deadlines');
    } finally {
      setDeadlineLoading(false);
    }
  };

  // Lock/Unlock toggle
  const handleToggleLock = async (schedule) => {
    const id = schedule.exam_schedule_id;
    setLockLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (schedule.is_marks_locked) {
        await academicsAPI.unlockMarks({ exam_schedule_id: id });
        toast.success('Marks unlocked');
      } else {
        await academicsAPI.lockMarks({ exam_schedule_id: id });
        toast.success('Marks locked');
      }
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lock/unlock failed');
    } finally {
      setLockLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Check expired deadlines
  const handleCheckExpired = async () => {
    try {
      const res = await marksEntryAPI.checkExpiredDeadlines();
      const data = res.data.data || res.data;
      toast.success(`Checked: ${data.checked || 0}, Auto-locked: ${data.auto_locked || 0}`);
      loadDashboard();
    } catch (err) {
      toast.error('Failed to check deadlines');
    }
  };

  // Unique filter values from schedules
  const filterOptions = useMemo(() => {
    const classSet = new Set();
    const sectionSet = new Set();
    const subjectSet = new Set();
    schedules.forEach(s => {
      if (s.class_name) classSet.add(s.class_name);
      if (s.section_name) sectionSet.add(s.section_name);
      if (s.subject_name) subjectSet.add(s.subject_name);
    });
    return {
      classes: [...classSet],
      sections: [...sectionSet],
      subjects: [...subjectSet],
    };
  }, [schedules]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>Marks Entry Dashboard</Typography>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            select
            size="small"
            label="Select Exam"
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            sx={{ minWidth: 220 }}
            disabled={examsLoading}
          >
            {exams.map(exam => (
              <MenuItem key={exam.id} value={exam.id}>
                {exam.name}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<GroupAdd />}
            onClick={() => setBulkAssignOpen(true)}
            disabled={!selectedExam}
            size="small"
          >
            Assign All
          </Button>
          <Button
            variant="outlined"
            startIcon={<Timer />}
            onClick={handleCheckExpired}
            disabled={!selectedExam}
            size="small"
          >
            Check Deadlines
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={loadDashboard} disabled={!selectedExam}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Summary Cards */}
      {loading ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {SUMMARY_CARDS.map(c => (
            <Grid item xs={6} sm={4} md={2} key={c.key}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : summary ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {SUMMARY_CARDS.map(({ key, label, icon: Icon, color }) => (
            <Grid item xs={6} sm={4} md={2} key={key}>
              <Card sx={{
                borderRadius: 3,
                background: alpha(color, 0.06),
                border: `1px solid ${alpha(color, 0.15)}`,
                boxShadow: 'none',
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Icon sx={{ color, fontSize: 20 }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} sx={{ color }}>
                    {summary[key] ?? 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 3, borderRadius: 3 }}>
          <Typography color="text.secondary">Select an exam to view dashboard</Typography>
        </Paper>
      )}

      {/* Filter Bar */}
      {selectedExam && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterList sx={{ color: 'text.secondary' }} />
          <TextField
            select
            size="small"
            label="Class"
            value={filterClass}
            onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All Classes</MenuItem>
            {classes.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Section"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            sx={{ minWidth: 140 }}
            disabled={!filterClass}
          >
            <MenuItem value="">All Sections</MenuItem>
            {sections.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Subject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Subjects</MenuItem>
            {subjects.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
          <Button
            size="small"
            onClick={() => { setFilterClass(''); setFilterSection(''); setFilterSubject(''); }}
          >
            Clear
          </Button>
        </Paper>
      )}

      {/* Progress Table */}
      {selectedExam && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned Teacher</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Lock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Deadline</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No schedules found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => {
                  const pct = schedule.completion_percentage ?? 0;
                  const statusConf = STATUS_CONFIG[schedule.status] || STATUS_CONFIG.not_started;
                  return (
                    <TableRow key={schedule.exam_schedule_id} hover>
                      <TableCell>{schedule.class_name}</TableCell>
                      <TableCell>{schedule.section_name}</TableCell>
                      <TableCell>{schedule.subject_name}</TableCell>
                      <TableCell>
                        {schedule.teacher_name ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {schedule.teacher_name}
                            </Typography>
                            <Tooltip title="Reassign">
                              <IconButton size="small" onClick={() => openManualAssign(schedule)}>
                                <GroupAdd sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="text"
                            color="warning"
                            onClick={() => openManualAssign(schedule)}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              flex: 1, height: 8, borderRadius: 4,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                bgcolor: pct === 100 ? '#10b981' : theme.palette.primary.main,
                              }
                            }}
                          />
                          <Typography variant="caption" fontWeight={600} sx={{ minWidth: 36 }}>
                            {Math.round(pct)}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {schedule.marks_entered}/{schedule.total_students}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConf.label}
                          color={statusConf.color}
                          size="small"
                          variant={schedule.status === 'locked' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={schedule.is_marks_locked ? 'Unlock Marks' : 'Lock Marks'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleLock(schedule)}
                              disabled={lockLoading[schedule.exam_schedule_id]}
                              sx={{
                                color: schedule.is_marks_locked
                                  ? '#8b5cf6'
                                  : 'text.secondary',
                              }}
                            >
                              {lockLoading[schedule.exam_schedule_id] ? (
                                <CircularProgress size={18} />
                              ) : schedule.is_marks_locked ? (
                                <Lock fontSize="small" />
                              ) : (
                                <LockOpen fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {schedule.deadline ? (
                          <Box>
                            <Typography variant="caption">
                              {dayjs(schedule.deadline).format('DD MMM YYYY')}
                            </Typography>
                            {schedule.is_overdue && (
                              <Chip label="Overdue" color="error" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Set Deadline">
                          <IconButton
                            size="small"
                            onClick={() => openDeadlineDialog([schedule.exam_schedule_id])}
                          >
                            <Schedule fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ─── Bulk Assign Dialog ─── */}
      <Dialog open={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Assign Teachers</DialogTitle>
        <DialogContent>
          {bulkAssignResult ? (
            <Box sx={{ mt: 1 }}>
              <Typography gutterBottom>
                <strong>Assigned:</strong> {bulkAssignResult.assigned}
              </Typography>
              <Typography gutterBottom>
                <strong>Already Assigned:</strong> {bulkAssignResult.already_assigned}
              </Typography>
              {bulkAssignResult.unassigned?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography fontWeight={600} gutterBottom>Unassigned Schedules:</Typography>
                  <TableContainer sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Class</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkAssignResult.unassigned.map((u, i) => (
                          <TableRow key={i}>
                            <TableCell>{u.class_name}</TableCell>
                            <TableCell>{u.subject_name}</TableCell>
                            <TableCell>
                              <Chip label={u.reason?.replace(/_/g, ' ')} size="small" color="warning" variant="outlined" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <Typography>
                This will automatically assign teachers to all exam schedules based on their
                existing Teacher-Subject allocations.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Schedules without a matching teacher allocation will be listed for manual assignment.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBulkAssignOpen(false); setBulkAssignResult(null); }}>
            Close
          </Button>
          {!bulkAssignResult && (
            <Button
              variant="contained"
              onClick={handleBulkAssign}
              disabled={bulkAssignLoading || !selectedExam}
              startIcon={bulkAssignLoading ? <CircularProgress size={16} /> : <GroupAdd />}
            >
              {bulkAssignLoading ? 'Assigning...' : 'Assign All'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ─── Manual Assign Dialog ─── */}
      <Dialog open={manualAssignOpen} onClose={() => setManualAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Teacher</DialogTitle>
        <DialogContent>
          {manualAssignSchedule && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {manualAssignSchedule.class_name} - {manualAssignSchedule.section_name} | {manualAssignSchedule.subject_name}
              </Typography>
              <TextField
                select
                fullWidth
                label="Select Teacher"
                value={manualAssignTeacher}
                onChange={(e) => setManualAssignTeacher(e.target.value)}
                sx={{ mt: 2 }}
                size="small"
              >
                {teachers.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualAssignOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleManualAssign}
            disabled={!manualAssignTeacher || manualAssignLoading}
          >
            {manualAssignLoading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Deadline Dialog ─── */}
      <Dialog open={deadlineOpen} onClose={() => setDeadlineOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Deadline</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Setting deadline for {selectedSchedules.length} schedule(s)
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Deadline Date"
                value={deadlineDate}
                onChange={(val) => setDeadlineDate(val)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                minDate={dayjs()}
              />
            </LocalizationProvider>
            <FormControlLabel
              control={
                <Switch
                  checked={deadlineAutoLock}
                  onChange={(e) => setDeadlineAutoLock(e.target.checked)}
                />
              }
              label="Auto-lock marks after deadline"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeadlineOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSetDeadlines}
            disabled={!deadlineDate || deadlineLoading}
          >
            {deadlineLoading ? 'Saving...' : 'Set Deadline'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
