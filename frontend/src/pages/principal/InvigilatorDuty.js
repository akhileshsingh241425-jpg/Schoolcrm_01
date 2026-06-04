import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Chip, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, LinearProgress, Alert,
  alpha, useTheme, FormControl, InputLabel, Select, Divider
} from '@mui/material';
import { Add, Close, Delete, Print } from '@mui/icons-material';
import { academicsAPI, staffAPI } from '../../services/api';
import { examMgmtAPI } from '../../services/examApi';
import toast from 'react-hot-toast';

export default function InvigilatorDuty() {
  const theme = useTheme();
  const P = theme.palette.primary.main;

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Duty structure: { "date|startTime|endTime": { rooms: { roomId: [teacherId1, teacherId2] } } }
  const [dutyMap, setDutyMap] = useState({});

  // Seating arrangement: { "slotKey|roomId": [[{class,roll}, ...], [...], ...] } (columns of rows)
  const [seatingMap, setSeatingMap] = useState({});
  const [seatingDialogOpen, setSeatingDialogOpen] = useState(false);
  const [seatingKey, setSeatingKey] = useState('');
  const [seatingHall, setSeatingHall] = useState(null);
  const [seatingGrid, setSeatingGrid] = useState([]); // array of columns, each column = array of cells

  // Load seating data when exam changes
  useEffect(() => {
    if (!selectedExam) return;
    examMgmtAPI.getAllRoomSeatings(selectedExam)
      .then(res => {
        const grids = res.data?.data || [];
        const map = {};
        grids.forEach(g => {
          // Store with multiple key formats for matching
          const st = (g.start_time || '09:00').slice(0, 5);
          // Try to match the seatingKey format: "date|startTime|endTime|roomId"
          // We don't have endTime from backend, so store with partial keys too
          const hallId = g.hall_id;
          // Store by all possible key patterns
          Object.keys(timeSlots).forEach(slotKey => {
            const fullKey = `${slotKey}|${hallId}`;
            const slot = timeSlots[slotKey];
            if (slot && slot.date === g.date && slot.startTime === st) {
              map[fullKey] = g.grid || [];
            }
          });
        });
        setSeatingMap(map);
      })
      .catch(() => {});
  }, [selectedExam, schedules]); // eslint-disable-line

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { date, startTime, endTime }
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Load data
  useEffect(() => {
    Promise.all([
      academicsAPI.listExams({}).catch(() => ({ data: { data: [] } })),
      staffAPI.list({ role: 'teacher', limit: 200 }).catch(() => ({ data: { data: [] } })),
      academicsAPI.listExamHalls().catch(() => ({ data: { data: [] } })),
    ]).then(([exRes, staffRes, hallRes]) => {
      const ed = exRes.data?.data;
      setExams(Array.isArray(ed) ? ed : ed?.items || []);
      const st = staffRes.data?.data;
      setTeachers(Array.isArray(st) ? st : st?.items || []);
      const h = hallRes.data?.data;
      setHalls(Array.isArray(h) ? h : h?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  // Load schedules when exam selected + load existing invigilator assignments
  useEffect(() => {
    if (!selectedExam) { setSchedules([]); setDutyMap({}); return; }
    academicsAPI.listSchedules(selectedExam)
      .then(async (r) => {
        const scheds = r.data?.data || [];
        setSchedules(scheds);
        
        // Load existing invigilator assignments for each schedule
        const newDutyMap = {};
        for (const sched of scheds) {
          try {
            const invRes = await academicsAPI.listInvigilators(sched.id);
            const invs = invRes.data?.data || [];
            if (invs.length > 0) {
              const st = (sched.start_time || '09:00').slice(0, 5);
              const et = (sched.end_time || '12:00').slice(0, 5);
              const slotKey = `${sched.exam_date}|${st}|${et}`;
              if (!newDutyMap[slotKey]) newDutyMap[slotKey] = { rooms: {} };
              invs.forEach(inv => {
                const hallId = inv.hall_id || inv.hall?.id;
                if (hallId) {
                  if (!newDutyMap[slotKey].rooms[hallId]) newDutyMap[slotKey].rooms[hallId] = [];
                  const teacherId = inv.staff_id || inv.teacher_id;
                  if (teacherId && !newDutyMap[slotKey].rooms[hallId].includes(teacherId)) {
                    newDutyMap[slotKey].rooms[hallId].push(teacherId);
                  }
                }
              });
            }
          } catch {}
        }
        setDutyMap(newDutyMap);
      })
      .catch(() => setSchedules([]));
  }, [selectedExam]);

  // Group schedules by time slot (date + time)
  const timeSlots = {};
  schedules.forEach(s => {
    const st = (s.start_time || '09:00').slice(0, 5);
    const et = (s.end_time || '12:00').slice(0, 5);
    const key = `${s.exam_date}|${st}|${et}`;
    if (!timeSlots[key]) {
      timeSlots[key] = {
        date: s.exam_date,
        startTime: st,
        endTime: et,
        classes: [],
      };
    }
    timeSlots[key].classes.push(`${s.class_name || ''}${s.section_name ? '-' + s.section_name : ''}`);
  });
  const sortedSlots = Object.entries(timeSlots).sort((a, b) => a[0].localeCompare(b[0]));

  const getTeacherName = (id) => {
    const t = teachers.find(x => x.id === id);
    return t ? `${t.first_name} ${t.last_name || ''}`.trim() : `#${id}`;
  };

  // Get all teachers assigned in a specific time slot (across all rooms)
  const getAssignedInSlot = (slotKey) => {
    const ids = new Set();
    const slotData = dutyMap[slotKey];
    if (slotData?.rooms) {
      Object.values(slotData.rooms).forEach(tids => tids.forEach(id => ids.add(id)));
    }
    return ids;
  };

  // ─── Seating Arrangement ───
  const openSeatingDialog = async (key, hall) => {
    setSeatingKey(key);
    setSeatingHall(hall);
    // key format: "slotKey|roomId" where slotKey = "date|startTime|endTime"
    const parts = key.split('|');
    const date = parts[0];
    const startTime = parts[1];
    const roomId = parts[3];
    
    // Try to load from backend
    if (selectedExam && roomId) {
      try {
        const res = await examMgmtAPI.getRoomSeating(selectedExam, roomId, { date, start_time: startTime });
        const data = res.data?.data;
        if (data && data.grid && data.grid.length > 0) {
          setSeatingGrid(data.grid);
          setSeatingDialogOpen(true);
          return;
        }
      } catch {}
    }
    // Default grid
    setSeatingGrid(Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => ({ class_name: '', roll_no: '' }))));
    setSeatingDialogOpen(true);
  };

  const addSeatingRow = () => {
    setSeatingGrid(prev => prev.map(col => [...col, { class_name: '', roll_no: '' }]));
  };

  const addSeatingColumn = () => {
    const rows = seatingGrid[0]?.length || 5;
    setSeatingGrid(prev => [...prev, Array.from({ length: rows }, () => ({ class_name: '', roll_no: '' }))]);
  };

  const updateSeatingCell = (colIdx, rowIdx, field, value) => {
    setSeatingGrid(prev => {
      const updated = prev.map(col => col.map(cell => ({ ...cell })));
      updated[colIdx][rowIdx] = { ...updated[colIdx][rowIdx], [field]: value };
      // If class_name changed, auto-fill all rows below in same column
      if (field === 'class_name') {
        for (let r = rowIdx + 1; r < updated[colIdx].length; r++) {
          updated[colIdx][r] = { ...updated[colIdx][r], class_name: value };
        }
      }
      return updated;
    });
  };

  // Handle Enter key on class field — fill below
  const handleClassKeyDown = (e, colIdx, rowIdx) => {
    if (e.key === 'Enter') {
      const value = e.target.value;
      setSeatingGrid(prev => {
        const updated = prev.map(col => col.map(cell => ({ ...cell })));
        for (let r = rowIdx; r < updated[colIdx].length; r++) {
          updated[colIdx][r] = { ...updated[colIdx][r], class_name: value };
        }
        return updated;
      });
      toast.success(`"${value}" filled in Col ${colIdx + 1} from Row ${rowIdx + 1} to end`);
    }
  };

  // Handle Enter key on roll no field — auto-increment below
  const handleRollKeyDown = (e, colIdx, rowIdx) => {
    if (e.key === 'Enter') {
      const startRoll = parseInt(e.target.value);
      if (isNaN(startRoll)) return;
      setSeatingGrid(prev => {
        const updated = prev.map(col => col.map(cell => ({ ...cell })));
        for (let r = rowIdx; r < updated[colIdx].length; r++) {
          updated[colIdx][r] = { ...updated[colIdx][r], roll_no: String(startRoll + (r - rowIdx)) };
        }
        return updated;
      });
      toast.success(`Roll ${startRoll} to ${startRoll + (seatingGrid[colIdx].length - rowIdx - 1)} filled in Col ${colIdx + 1}`);
    }
  };

  const saveSeating = async () => {
    // Save to local state
    setSeatingMap({ ...seatingMap, [seatingKey]: seatingGrid });
    
    // Parse seatingKey: "date|startTime|endTime|roomId"
    const parts = seatingKey.split('|');
    const date = parts[0] || '';
    const startTime = parts[1] || '';
    const roomId = parts[3] || parts[2] || ''; // fallback
    const examId = selectedExam;
    
    if (!examId) {
      toast.error('No exam selected. Saved locally only.');
      setSeatingDialogOpen(false);
      return;
    }
    if (!roomId) {
      toast.error('No room ID found. Saved locally only.');
      setSeatingDialogOpen(false);
      return;
    }
    
    try {
      await examMgmtAPI.saveRoomSeating(examId, roomId, {
        grid: seatingGrid,
        date: date || null,
        start_time: startTime || null,
      });
      toast.success('Seating saved! Visible to teachers & principal.');
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Server error - check backend');
    }
    setSeatingDialogOpen(false);
  };

  // Assign teacher to room in a time slot
  const handleAssign = () => {
    if (!selectedSlot || !selectedRoom || !selectedTeacher) {
      toast.error('Select room and teacher'); return;
    }
    const slotKey = `${selectedSlot.date}|${selectedSlot.startTime}|${selectedSlot.endTime}`;
    const roomId = parseInt(selectedRoom);
    const teacherId = parseInt(selectedTeacher);

    const current = dutyMap[slotKey] || { rooms: {} };
    const roomTeachers = current.rooms[roomId] || [];

    if (roomTeachers.includes(teacherId)) {
      toast.error('Teacher already assigned to this room'); return;
    }

    // Check if teacher is already in another room in same slot
    const allInSlot = getAssignedInSlot(slotKey);
    if (allInSlot.has(teacherId)) {
      toast.error('Teacher is already assigned to another room in this time slot'); return;
    }

    const updated = {
      ...current,
      rooms: { ...current.rooms, [roomId]: [...roomTeachers, teacherId] }
    };
    setDutyMap({ ...dutyMap, [slotKey]: updated });

    const teacher = teachers.find(t => t.id === teacherId);
    const hall = halls.find(h => h.id === roomId);
    toast.success(`${teacher?.first_name || 'Teacher'} → ${hall?.name || 'Room'}`);
    setSelectedTeacher('');
  };

  // Remove teacher from room
  const handleRemove = (slotKey, roomId, teacherId) => {
    const current = dutyMap[slotKey] || { rooms: {} };
    const roomTeachers = (current.rooms[roomId] || []).filter(id => id !== teacherId);
    const updatedRooms = { ...current.rooms };
    if (roomTeachers.length === 0) {
      delete updatedRooms[roomId];
    } else {
      updatedRooms[roomId] = roomTeachers;
    }
    setDutyMap({ ...dutyMap, [slotKey]: { ...current, rooms: updatedRooms } });
    toast.success('Removed');
  };

  // Stats
  const totalSlots = sortedSlots.length;
  const assignedSlots = sortedSlots.filter(([key]) => {
    const data = dutyMap[key];
    return data && Object.keys(data.rooms || {}).length > 0;
  }).length;
  const totalTeachersAssigned = new Set();
  Object.values(dutyMap).forEach(slot => {
    Object.values(slot.rooms || {}).forEach(tids => tids.forEach(id => totalTeachersAssigned.add(id)));
  });

  if (loading) return <Box sx={{ p: 4 }}><LinearProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>🏫 Invigilator Duty Assignment</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Assign teachers to rooms for each exam time slot. One teacher = one room per time slot.
      </Typography>

      {/* Exam Selector */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Select Exam</InputLabel>
          <Select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} label="Select Exam" sx={{ borderRadius: 2 }}>
            {exams.map(e => (
              <MenuItem key={e.id} value={e.id}>
                {e.name} ({e.start_date} → {e.end_date})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {!selectedExam ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>Select an exam to assign invigilator duty.</Alert>
      ) : schedules.length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>No date sheet found. Create date sheet first.</Alert>
      ) : (
        <>
          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} color="primary">{totalSlots}</Typography>
                <Typography variant="caption" color="text.secondary">Time Slots</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} color="success.main">{assignedSlots}</Typography>
                <Typography variant="caption" color="text.secondary">Slots Assigned</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700}>{totalTeachersAssigned.size}</Typography>
                <Typography variant="caption" color="text.secondary">Teachers on Duty</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700}>{halls.length}</Typography>
                <Typography variant="caption" color="text.secondary">Available Rooms</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Time Slot wise duty table */}
          {sortedSlots.map(([slotKey, slot]) => {
            const slotData = dutyMap[slotKey] || { rooms: {} };
            const assignedRooms = Object.entries(slotData.rooms || {});
            const assignedInSlot = getAssignedInSlot(slotKey);

            return (
              <Paper key={slotKey} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                {/* Slot Header */}
                <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(P, 0.05), borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                      📅 {slot.date} &nbsp;|&nbsp; 🕐 {slot.startTime} — {slot.endTime}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Classes: {[...new Set(slot.classes)].join(', ')} &nbsp;•&nbsp; {assignedInSlot.size} teacher(s) assigned
                    </Typography>
                  </Box>
                  <Button size="small" variant="contained" startIcon={<Add />}
                    onClick={() => { setSelectedSlot(slot); setSelectedRoom(''); setSelectedTeacher(''); setDialogOpen(true); }}
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                    Assign Teachers
                  </Button>
                </Box>

                {/* Room-wise assignment table */}
                {assignedRooms.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No teachers assigned yet. Click "Assign Teachers" to start.</Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, width: 180 }}>Room</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Invigilators</TableCell>
                          <TableCell sx={{ fontWeight: 700, width: 140 }}>Seating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignedRooms.map(([roomId, teacherIds]) => {
                          const hall = halls.find(h => h.id === parseInt(roomId));
                          const seatingKey = `${slotKey}|${roomId}`;
                          const hasSeating = seatingMap[seatingKey]?.length > 0;
                          return (
                            <TableRow key={roomId} hover>
                              <TableCell>
                                <Chip label={hall?.name || `Room ${roomId}`} size="small" sx={{ fontWeight: 600 }} />
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Cap: {hall?.capacity || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {teacherIds.map((tid, idx) => (
                                    <Chip key={tid}
                                      label={`${idx === 0 ? '👑 ' : ''}${getTeacherName(tid)}`}
                                      size="small"
                                      color={idx === 0 ? 'primary' : 'default'}
                                      onDelete={() => handleRemove(slotKey, parseInt(roomId), tid)}
                                      sx={{ fontWeight: 500 }} />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant={hasSeating ? 'outlined' : 'contained'}
                                  onClick={() => openSeatingDialog(seatingKey, hall)}
                                  sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.7rem' }}>
                                  {hasSeating ? `View (${seatingMap[seatingKey][0]?.length || 0}×${seatingMap[seatingKey]?.length || 0})` : '+ Seating'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            );
          })}
        </>
      )}

      {/* Assign Dialog — Pick Room + Add Multiple Teachers */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Assign Invigilators</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedSlot?.date} • {selectedSlot?.startTime} — {selectedSlot?.endTime}
              </Typography>
            </Box>
            <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Room Selection */}
          <TextField fullWidth select label="Select Room *" value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)} sx={{ mt: 1 }}>
            {halls.map(h => (
              <MenuItem key={h.id} value={h.id}>{h.name} (Capacity: {h.capacity})</MenuItem>
            ))}
          </TextField>

          {/* Show currently assigned in this slot — LIVE UPDATE */}
          {selectedSlot && (() => {
            const slotKey = `${selectedSlot.date}|${selectedSlot.startTime}|${selectedSlot.endTime}`;
            const slotData = dutyMap[slotKey] || { rooms: {} };
            const allRooms = Object.entries(slotData.rooms || {});
            if (allRooms.length === 0) return (
              <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>No teachers assigned yet for this slot.</Alert>
            );
            return (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                <Typography variant="caption" fontWeight={700} sx={{ mb: 1, display: 'block' }}>✅ Assigned in this slot:</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, py: 0.5, fontSize: '0.75rem' }}>Room</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 0.5, fontSize: '0.75rem' }}>Teachers</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allRooms.map(([rid, tids]) => {
                        const hall = halls.find(h => h.id === parseInt(rid));
                        return (
                          <TableRow key={rid}>
                            <TableCell sx={{ py: 0.5 }}>
                              <Chip label={hall?.name || 'Room'} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                                {tids.map((tid, idx) => (
                                  <Chip key={tid} label={`${idx === 0 ? '👑 ' : ''}${getTeacherName(tid)}`} size="small"
                                    color={idx === 0 ? 'primary' : 'default'}
                                    onDelete={() => handleRemove(slotKey, parseInt(rid), tid)}
                                    sx={{ fontSize: '0.65rem', height: 22 }} />
                                ))}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })()}

          <Divider sx={{ my: 2 }} />

          {/* Teacher Selection */}
          <TextField fullWidth select label="Select Teacher *" value={selectedTeacher}
            onChange={e => setSelectedTeacher(e.target.value)}>
            {teachers.map(t => {
              const slotKey = selectedSlot ? `${selectedSlot.date}|${selectedSlot.startTime}|${selectedSlot.endTime}` : '';
              const assignedInSlot = getAssignedInSlot(slotKey);
              const isBusy = assignedInSlot.has(t.id);
              return (
                <MenuItem key={t.id} value={t.id} disabled={isBusy}>
                  {t.first_name} {t.last_name || ''} {t.designation ? `(${t.designation})` : ''}
                  {isBusy && ' — Already assigned this slot'}
                </MenuItem>
              );
            })}
          </TextField>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" size="small" onClick={handleAssign}
              disabled={!selectedRoom || !selectedTeacher}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
              + Add to Room
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            You can add multiple teachers to the same room. One teacher can only be in one room per time slot.
            Keep dialog open to add more — click "Done" when finished.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Seating Arrangement Dialog */}
      <Dialog open={seatingDialogOpen} onClose={() => setSeatingDialogOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>🪑 Seating Arrangement</Typography>
              <Typography variant="caption" color="text.secondary">
                {seatingHall?.name || 'Room'} (Capacity: {seatingHall?.capacity || '-'}) — {seatingGrid.length} columns × {seatingGrid[0]?.length || 0} rows
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={addSeatingColumn} sx={{ textTransform: 'none', borderRadius: 2 }}>+ Column</Button>
              <Button size="small" variant="outlined" onClick={addSeatingRow} sx={{ textTransform: 'none', borderRadius: 2 }}>+ Row</Button>
              <IconButton onClick={() => setSeatingDialogOpen(false)}><Close /></IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ overflowX: 'auto', mt: 1 }}>
            {/* Header: Column numbers */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Box sx={{ width: 40 }} />
              {seatingGrid.map((_, colIdx) => (
                <Box key={colIdx} sx={{ width: 160, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={700} color="primary">Col {colIdx + 1}</Typography>
                </Box>
              ))}
            </Box>
            {/* Rows */}
            {(seatingGrid[0] || []).map((_, rowIdx) => (
              <Box key={rowIdx} sx={{ display: 'flex', gap: 1, mb: 0.5, alignItems: 'center' }}>
                <Box sx={{ width: 40, textAlign: 'center' }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">R{rowIdx + 1}</Typography>
                </Box>
                {seatingGrid.map((col, colIdx) => {
                  const cell = col[rowIdx] || { class_name: '', roll_no: '' };
                  return (
                    <Box key={colIdx} sx={{ width: 160, display: 'flex', gap: 0.5 }}>
                      <TextField size="small" placeholder="Class" value={cell.class_name}
                        onChange={e => updateSeatingCell(colIdx, rowIdx, 'class_name', e.target.value)}
                        onKeyDown={e => handleClassKeyDown(e, colIdx, rowIdx)}
                        sx={{ width: 55, '& input': { fontSize: '0.7rem', py: 0.5, px: 0.5 } }} />
                      <TextField size="small" placeholder="Roll No" value={cell.roll_no}
                        type="number"
                        onChange={e => updateSeatingCell(colIdx, rowIdx, 'roll_no', e.target.value)}
                        onKeyDown={e => handleRollKeyDown(e, colIdx, rowIdx)}
                        sx={{ flex: 1, '& input': { fontSize: '0.75rem', py: 0.5, px: 1 } }} />
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            Each cell = 1 student seat. Enter Class (e.g., "10-A") and Roll No.<br/>
            <strong>Tip:</strong> Class field + Enter → fills all rows below. Roll No + Enter → auto-increments (+1) below.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSeatingDialogOpen(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={saveSeating} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            Save Seating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
