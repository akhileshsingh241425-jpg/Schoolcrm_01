import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Avatar, IconButton,
  alpha, useTheme, LinearProgress, Alert, Tooltip, Checkbox, FormControlLabel,
  Card, CardContent, CardActionArea, Skeleton, Divider
} from '@mui/material';
import {
  Save, CheckCircle, Lock, Warning, AccessTime, School, Person
} from '@mui/icons-material';
import { academicsAPI, marksEntryAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Helper: determine deadline status using API flags with client-side fallback
function getDeadlineStatus(assignment) {
  // Use API-provided flags if available
  if (assignment?.is_overdue) return { label: 'Overdue', color: 'error', status: 'overdue' };
  if (assignment?.deadline_approaching) return { label: 'Deadline Approaching', color: 'warning', status: 'approaching' };

  // Fallback to client-side calculation from deadline field
  const deadline = assignment?.deadline;
  if (!deadline) return { label: 'No deadline', color: 'default', status: 'none' };
  const now = new Date();
  const dl = new Date(deadline);
  const hoursLeft = (dl - now) / (1000 * 60 * 60);
  if (hoursLeft < 0) return { label: 'Overdue', color: 'error', status: 'overdue' };
  if (hoursLeft <= 24) return { label: 'Deadline Approaching', color: 'warning', status: 'approaching' };
  return { label: `Due ${dl.toLocaleDateString()}`, color: 'success', status: 'ok' };
}

// Helper: calculate pass/fail based on passing_marks from ExamSchedule
function getPassFail(marks, passingMarks) {
  if (marks === null || marks === undefined || marks === '') return null;
  const m = parseFloat(marks);
  if (isNaN(m)) return null;
  if (passingMarks === null || passingMarks === undefined) return null;
  return m >= passingMarks ? 'pass' : 'fail';
}

// Helper: calculate grade from percentage
function calculateGrade(marks, maxMarks) {
  if (marks === null || marks === undefined || marks === '') return null;
  const m = parseFloat(marks);
  if (isNaN(m) || !maxMarks) return null;
  const percentage = (m / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export default function TeacherMarksEntry() {
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  // State: assignments
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // State: marks sheet
  const [marksSheet, setMarksSheet] = useState(null);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marks, setMarks] = useState({});
  const [absentMap, setAbsentMap] = useState({});
  const [saving, setSaving] = useState(false);

  // Load assignments on mount
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const res = await marksEntryAPI.myAssignments();
      const data = res.data?.data || res.data || [];
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Group assignments by exam
  const groupedAssignments = useMemo(() => {
    const groups = {};
    assignments.forEach(a => {
      const key = a.exam_id || 'unknown';
      if (!groups[key]) {
        groups[key] = { exam_name: a.exam_name || 'Exam', items: [] };
      }
      groups[key].items.push(a);
    });
    return groups;
  }, [assignments]);

  // Load marks sheet when assignment selected
  const handleSelectAssignment = async (assignment) => {
    setSelectedAssignment(assignment);
    setMarksSheet(null);
    setMarks({});
    setAbsentMap({});
    setMarksLoading(true);
    try {
      const res = await academicsAPI.getMarksSheet({
        exam_schedule_id: assignment.exam_schedule_id,
      });
      const data = res.data?.data;
      setMarksSheet(data);
      // Pre-fill existing marks and absent status
      const existingMarks = {};
      const existingAbsent = {};
      (data?.students || []).forEach(s => {
        const subjectData = (s.subjects || []).find(
          sub => sub.schedule_id === assignment.exam_schedule_id
        ) || (s.subjects || [])[0];
        if (subjectData) {
          const key = s.student_id;
          if (subjectData.is_absent) {
            existingAbsent[key] = true;
          } else if (subjectData.marks_obtained !== null && subjectData.marks_obtained !== undefined) {
            existingMarks[key] = subjectData.marks_obtained;
          }
        }
      });
      setMarks(existingMarks);
      setAbsentMap(existingAbsent);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load marks sheet');
    } finally {
      setMarksLoading(false);
    }
  };

  // Handle marks change
  const handleMarksChange = (studentId, value) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  // Handle absent toggle
  const handleAbsentToggle = (studentId) => {
    setAbsentMap(prev => {
      const newMap = { ...prev };
      if (newMap[studentId]) {
        delete newMap[studentId];
      } else {
        newMap[studentId] = true;
        // Clear marks when marking absent
        setMarks(prevMarks => {
          const updated = { ...prevMarks };
          delete updated[studentId];
          return updated;
        });
      }
      return newMap;
    });
  };

  // Save marks
  const handleSave = async () => {
    if (!selectedAssignment || !marksSheet) return;
    setSaving(true);
    try {
      const entries = [];
      (marksSheet.students || []).forEach(student => {
        const studentId = student.student_id;
        const isAbsent = !!absentMap[studentId];
        const marksValue = marks[studentId];

        if (isAbsent) {
          entries.push({
            student_id: studentId,
            marks_obtained: null,
            is_absent: true,
          });
        } else if (marksValue !== undefined && marksValue !== '') {
          entries.push({
            student_id: studentId,
            marks_obtained: parseFloat(marksValue),
            is_absent: false,
          });
        }
      });

      if (entries.length === 0) {
        toast.error('No marks to save');
        setSaving(false);
        return;
      }

      await academicsAPI.bulkMarksEntry({
        exam_schedule_id: selectedAssignment.exam_schedule_id,
        entries,
      });

      toast.success('Marks saved successfully!');
      // Refresh assignments to update progress
      loadAssignments();
      // Reload marks sheet
      handleSelectAssignment(selectedAssignment);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Determine if current assignment is locked
  const isLocked = selectedAssignment?.is_marks_locked === true;
  const maxMarks = selectedAssignment?.max_marks || marksSheet?.schedules?.[0]?.max_marks || 100;
  const passingMarks = selectedAssignment?.passing_marks ?? marksSheet?.schedules?.[0]?.passing_marks ?? null;

  // Loading state
  if (assignmentsLoading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Enter Marks</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Enter Marks</Typography>

      {/* Locked Alert */}
      {isLocked && (
        <Alert severity="error" icon={<Lock />} sx={{ mb: 2, borderRadius: 2 }}>
          Marks are locked for this assignment. You cannot make changes.
        </Alert>
      )}

      {/* Assignment Cards */}
      {!selectedAssignment && (
        <>
          {assignments.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No marks entry assignments found. Please contact the Exam Controller.
            </Alert>
          ) : (
            Object.entries(groupedAssignments).map(([examId, group]) => (
              <Box key={examId} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary' }}>
                  {group.exam_name}
                </Typography>
                <Grid container spacing={2}>
                  {group.items.map(assignment => {
                    const deadlineInfo = getDeadlineStatus(assignment);
                    const progress = assignment.total_students > 0
                      ? (assignment.marks_entered / assignment.total_students) * 100
                      : 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={assignment.assignment_id || assignment.exam_schedule_id}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            border: 1,
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: PRIMARY,
                              boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.15)}`,
                            },
                            opacity: assignment.is_marks_locked ? 0.8 : 1,
                          }}
                        >
                          <CardActionArea onClick={() => handleSelectAssignment(assignment)}>
                            <CardContent sx={{ p: 2.5 }}>
                              {/* Subject & Class */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <School sx={{ fontSize: 18, color: PRIMARY }} />
                                <Typography variant="subtitle2" fontWeight={700} noWrap>
                                  {assignment.subject_name}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                {assignment.class_name} - {assignment.section_name}
                              </Typography>

                              {/* Progress */}
                              <Box sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Progress
                                  </Typography>
                                  <Typography variant="caption" fontWeight={600}>
                                    {assignment.marks_entered || 0}/{assignment.total_students || 0} entered
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={progress}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: alpha(PRIMARY, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 3,
                                      bgcolor: progress === 100 ? 'success.main' : PRIMARY,
                                    },
                                  }}
                                />
                              </Box>

                              {/* Chips: Deadline + Lock + Overdue */}
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {deadlineInfo.status === 'approaching' && (
                                  <Chip
                                    size="small"
                                    icon={<AccessTime />}
                                    label="Deadline Approaching"
                                    color="warning"
                                    variant="filled"
                                  />
                                )}
                                {deadlineInfo.status === 'overdue' && (
                                  <Chip
                                    size="small"
                                    icon={<Warning />}
                                    label="Overdue"
                                    color="error"
                                    variant="filled"
                                  />
                                )}
                                {deadlineInfo.status === 'ok' && (
                                  <Chip
                                    size="small"
                                    icon={<AccessTime />}
                                    label={deadlineInfo.label}
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                {assignment.is_marks_locked && (
                                  <Chip
                                    size="small"
                                    icon={<Lock />}
                                    label="Locked"
                                    color="error"
                                    variant="filled"
                                  />
                                )}
                              </Box>
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ))
          )}
        </>
      )}

      {/* Marks Entry Table */}
      {selectedAssignment && (
        <>
          {/* Back button + assignment info */}
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => { setSelectedAssignment(null); setMarksSheet(null); }}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  ← Back
                </Button>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {selectedAssignment.subject_name} — {selectedAssignment.class_name}-{selectedAssignment.section_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedAssignment.exam_name} • Max Marks: {maxMarks}
                    {passingMarks !== null && ` • Passing: ${passingMarks}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {(() => {
                  const dlInfo = getDeadlineStatus(selectedAssignment);
                  return (
                    <>
                      {dlInfo.status === 'approaching' && (
                        <Chip
                          size="small"
                          icon={<AccessTime />}
                          label="Deadline Approaching"
                          color="warning"
                          variant="filled"
                        />
                      )}
                      {dlInfo.status === 'overdue' && (
                        <Chip
                          size="small"
                          icon={<Warning />}
                          label="Overdue"
                          color="error"
                          variant="filled"
                        />
                      )}
                      {dlInfo.status === 'ok' && (
                        <Chip
                          size="small"
                          icon={<AccessTime />}
                          label={dlInfo.label}
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </>
                  );
                })()}
                {isLocked && (
                  <Chip size="small" icon={<Lock />} label="Locked" color="error" variant="filled" />
                )}
              </Box>
            </Box>
          </Paper>

          {marksLoading ? (
            <Box sx={{ py: 4 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Loading marks sheet...
              </Typography>
            </Box>
          ) : marksSheet ? (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  {marksSheet.students?.length || 0} Students
                </Typography>
                <Chip label={`Max: ${maxMarks}`} size="small" color="primary" />
              </Box>
              <TableContainer sx={{ maxHeight: 500 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, minWidth: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 70 }}>Roll No</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 100, textAlign: 'center' }}>Marks</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 80, textAlign: 'center' }}>Absent</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 80, textAlign: 'center' }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 80, textAlign: 'center' }}>Pass/Fail</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(marksSheet.students || []).map((student, idx) => {
                      const studentId = student.student_id;
                      const isAbsent = !!absentMap[studentId];
                      const currentMarks = marks[studentId] ?? '';
                      const passFail = getPassFail(currentMarks, passingMarks);

                      // Get existing grade from result data
                      const subjectData = (student.subjects || []).find(
                        sub => sub.schedule_id === selectedAssignment.exam_schedule_id
                      ) || (student.subjects || [])[0];
                      const existingGrade = subjectData?.grade_name || subjectData?.grade || '';

                      return (
                        <TableRow key={studentId} hover sx={{ opacity: isAbsent ? 0.6 : 1 }}>
                          <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {student.roll_no || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 28, height: 28, fontSize: '0.7rem',
                                  bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY,
                                }}
                              >
                                {student.student_name?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {student.student_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {student.admission_no}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <TextField
                              size="small"
                              type="number"
                              sx={{ width: 80, '& input': { textAlign: 'center', py: 0.5 } }}
                              inputProps={{ min: 0, max: maxMarks, step: 0.5 }}
                              value={isAbsent ? '' : currentMarks}
                              onChange={e => handleMarksChange(studentId, e.target.value)}
                              disabled={isLocked || isAbsent}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Checkbox
                              size="small"
                              checked={isAbsent}
                              onChange={() => handleAbsentToggle(studentId)}
                              disabled={isLocked}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              {isAbsent ? '—' : (existingGrade || calculateGrade(currentMarks, maxMarks) || '—')}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            {isAbsent ? (
                              <Chip label="Absent" size="small" color="default" variant="outlined" />
                            ) : passFail === 'pass' ? (
                              <Chip label="Pass" size="small" color="success" variant="filled" />
                            ) : passFail === 'fail' ? (
                              <Chip label="Fail" size="small" color="error" variant="filled" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Save Button */}
              {!isLocked && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 4 }}
                  >
                    {saving ? 'Saving...' : 'Save Marks'}
                  </Button>
                </Box>
              )}
            </Paper>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              Failed to load marks sheet. Please try again.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
