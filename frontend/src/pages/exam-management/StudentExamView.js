import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, Grid, Card, CardContent, Tabs, Tab
} from '@mui/material';
import {
  CalendarMonth, Assessment, EmojiEvents, EventSeat, School
} from '@mui/icons-material';
import { academicsAPI } from '../../services/api';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

const calcGrade = (pct) => {
  if (pct >= 91) return { grade: 'A+', color: '#10b981' };
  if (pct >= 81) return { grade: 'A', color: '#10b981' };
  if (pct >= 71) return { grade: 'B+', color: '#3b82f6' };
  if (pct >= 61) return { grade: 'B', color: '#3b82f6' };
  if (pct >= 51) return { grade: 'C+', color: '#f59e0b' };
  if (pct >= 41) return { grade: 'C', color: '#f59e0b' };
  if (pct >= 33) return { grade: 'D', color: '#ef4444' };
  return { grade: 'F', color: '#ef4444' };
};

export default function StudentExamView() {
  const [tab, setTab] = useState(0);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [dateSheet, setDateSheet] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    academicsAPI.listExams({})
      .then(res => {
        const ed = res.data?.data;
        setExams(Array.isArray(ed) ? ed : ed?.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadDateSheet = (examId) => {
    examMgmtAPI.getDateSheet(examId)
      .then(res => {
        const ds = res.data?.data;
        if (ds?.status === 'approved') {
          setDateSheet(ds.schedules || []);
        } else {
          setDateSheet([]);
          toast('Date sheet not yet approved');
        }
      })
      .catch(() => setDateSheet([]));
  };

  const loadResults = (examId) => {
    academicsAPI.getStudentResults(0, { exam_id: examId })
      .then(res => setResults(res.data?.data || []))
      .catch(() => setResults([]));
  };

  const publishedExams = exams.filter(e => e.status === 'results_published');
  const upcomingExams = exams.filter(e => ['upcoming', 'ongoing'].includes(e.status));

  if (loading) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Exams</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3,
        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab icon={<CalendarMonth sx={{ fontSize: 18 }} />} iconPosition="start" label="Date Sheet" />
        <Tab icon={<Assessment sx={{ fontSize: 18 }} />} iconPosition="start" label="Results" />
      </Tabs>

      {/* Date Sheet Tab */}
      {tab === 0 && (
        <Box>
          {upcomingExams.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No upcoming exams scheduled.</Alert>
          ) : (
            upcomingExams.map(exam => (
              <Paper key={exam.id} sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => loadDateSheet(exam.id)}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exam.start_date} → {exam.end_date}
                    </Typography>
                  </Box>
                  <Chip label={exam.status} size="small" sx={{ textTransform: 'capitalize' }} />
                </Box>
              </Paper>
            ))
          )}

          {dateSheet.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 3, mt: 2 }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700}>Exam Schedule</Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max Marks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dateSheet.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Chip icon={<CalendarMonth sx={{ fontSize: 14 }} />} label={s.exam_date}
                          size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{s.subject?.name || s.subject_name || '-'}</Typography></TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{s.max_marks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Results Tab */}
      {tab === 1 && (
        <Box>
          {publishedExams.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No published results available yet.</Alert>
          ) : (
            publishedExams.map(exam => (
              <Paper key={exam.id} sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => loadResults(exam.id)}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{exam.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exam.start_date} → {exam.end_date}
                    </Typography>
                  </Box>
                  <Chip icon={<EmojiEvents sx={{ fontSize: 14 }} />} label="View Results" size="small" color="success" />
                </Box>
              </Paper>
            ))
          )}

          {results.length > 0 && (
            <TableContainer component={Paper} sx={{ borderRadius: 3, mt: 2 }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700}>My Results</Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Max</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Obtained</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>%</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((r, idx) => {
                    const pct = r.max_marks > 0 ? Math.round((r.marks_obtained || 0) / r.max_marks * 100) : 0;
                    const { grade, color } = calcGrade(pct);
                    const pass = (r.marks_obtained || 0) >= (r.passing_marks || 33);
                    return (
                      <TableRow key={idx} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{r.subject_name || '-'}</Typography></TableCell>
                        <TableCell>{r.max_marks}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{r.is_absent ? 'AB' : r.marks_obtained}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color }}>{r.is_absent ? '0' : pct}%</TableCell>
                        <TableCell>
                          <Chip label={r.is_absent ? 'AB' : grade} size="small"
                            sx={{ fontWeight: 700, bgcolor: alpha(color, 0.12), color, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={r.is_absent ? 'Absent' : pass ? 'Pass' : 'Fail'} size="small"
                            color={r.is_absent ? 'error' : pass ? 'success' : 'error'}
                            sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  );
}
