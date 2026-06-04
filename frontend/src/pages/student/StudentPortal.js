import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Skeleton, alpha, useTheme, useMediaQuery,
  Stack, Alert, Divider, Paper, IconButton
} from '@mui/material';
import {
  School, CalendarMonth, AttachMoney, Assignment, Schedule,
  EmojiEvents, TrendingUp, Warning, Person, Class as ClassIcon,
  Announcement as AnnouncementIcon, Phone, Email, AccessTime,
  CheckCircle, MenuBook, Refresh, DirectionsBus
} from '@mui/icons-material';
import { studentPortalAPI, transportAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ── Reusable bits ──────────────────────────────────────────────────

const StatTile = ({ label, value, color, icon, sub }) => (
  <Card variant="outlined" sx={{
    borderRadius: 3, height: '100%',
    borderColor: alpha(color, 0.25),
    bgcolor: alpha(color, 0.05),
  }}>
    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          bgcolor: alpha(color, 0.15), color, width: 40, height: 40,
        }}>{icon}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{
            color: 'text.secondary', textTransform: 'uppercase',
            fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em',
            display: 'block',
          }}>{label}</Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.2 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {sub}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const SectionTitle = ({ icon, title, count }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
    {icon}
    <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
    {count !== undefined && (
      <Chip label={count} size="small" color="primary"
        sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
    )}
  </Box>
);

const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="rounded" height={120} sx={{ mb: 2, borderRadius: 4 }} />
    <Grid container spacing={2}>
      {[1, 2, 3, 4].map(i => (
        <Grid item xs={6} sm={3} key={i}>
          <Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

const formatMonth = (key) => {
  // "2026-05" -> "May 2026"
  if (!key) return '';
  const [y, m] = key.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

// ── Tabs ───────────────────────────────────────────────────────────

function OverviewTab({ data, theme }) {
  const PRIMARY = theme.palette.primary.main;
  const [transport, setTransport] = useState(null);
  useEffect(() => {
    transportAPI.myTransport().then(r => setTransport(r.data?.data || null)).catch(() => setTransport(null));
  }, []);
  if (!data) return null;
  const att = data.attendance || {};
  const fees = data.fees || {};
  const upcoming = data.upcoming_exams || [];
  const hw = data.pending_homework || [];
  const today = data.today_timetable || [];

  return (
    <Box>
      {/* Stat tiles */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatTile
            label="Attendance" value={`${att.percentage || 0}%`}
            color="#10b981" icon={<CalendarMonth fontSize="small" />}
            sub={`${att.present || 0}/${att.total_days || 0} days`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile
            label="Pending Homework" value={hw.length}
            color="#3b82f6" icon={<Assignment fontSize="small" />}
            sub={hw.length ? 'Due soon' : 'All caught up'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile
            label="Upcoming Exams" value={upcoming.length}
            color="#f59e0b" icon={<EmojiEvents fontSize="small" />}
            sub="Next 14 days"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile
            label="Fees Pending"
            value={`\u20B9${(fees.pending || 0).toLocaleString()}`}
            color={fees.overdue_count > 0 ? '#ef4444' : '#8b5cf6'}
            icon={<AttachMoney fontSize="small" />}
            sub={fees.overdue_count ? `${fees.overdue_count} overdue` : 'On track'}
          />
        </Grid>
      </Grid>

      {/* My Transport / Bus details */}
      {transport?.has_transport && (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2, borderColor: alpha('#f97316', 0.3), bgcolor: alpha('#f97316', 0.04) }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <SectionTitle icon={<DirectionsBus sx={{ color: '#f97316' }} fontSize="small" />} title="My Bus / Transport" />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.62rem' }}>Bus Number</Typography>
                <Typography variant="body1" fontWeight={700}>{transport.bus_number || '-'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.62rem' }}>Driver</Typography>
                <Typography variant="body1" fontWeight={700}>{transport.driver_name || '-'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.62rem' }}>Driver Phone</Typography>
                <Typography variant="body1" fontWeight={700}>
                  {transport.driver_phone ? <a href={`tel:${transport.driver_phone}`} style={{ color: '#f97316', textDecoration: 'none' }}>{transport.driver_phone}</a> : '-'}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', fontWeight: 700, fontSize: '0.62rem' }}>Route / Stop</Typography>
                <Typography variant="body2" fontWeight={700}>{transport.route_name || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">{transport.stop_name || ''}{transport.pickup_time ? ` • ${transport.pickup_time?.slice(0,5)}` : ''}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {/* Today's classes */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <SectionTitle
                icon={<Schedule color="primary" fontSize="small" />}
                title="Today's Classes"
                count={today.length}
              />
              {today.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No classes scheduled for today.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {today.map((p, i) => (
                    <Box key={i} sx={{
                      p: 1.25, borderRadius: 2,
                      bgcolor: p.is_break ? alpha('#f59e0b', 0.08) : alpha(PRIMARY, 0.05),
                      border: `1px solid ${alpha(p.is_break ? '#f59e0b' : PRIMARY, 0.15)}`,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                      <Box sx={{
                        width: 38, textAlign: 'center', flexShrink: 0,
                        py: 0.5, borderRadius: 1.5,
                        bgcolor: 'background.paper',
                        border: `1px solid ${alpha(PRIMARY, 0.2)}`,
                      }}>
                        <Typography variant="caption" fontWeight={800} color="primary"
                          sx={{ display: 'block', fontSize: '0.65rem' }}>P{p.period_number || i + 1}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {p.is_break ? 'Break' : (p.subject_name || 'Subject')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.start_time} - {p.end_time}
                          {p.teacher_name && ` • ${p.teacher_name}`}
                          {p.room_no && ` • Room ${p.room_no}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Homework */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <SectionTitle
                icon={<Assignment color="info" fontSize="small" />}
                title="Pending Homework"
                count={hw.length}
              />
              {hw.length === 0 ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  No pending homework.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {hw.slice(0, 5).map((h, i) => (
                    <Box key={i} sx={{
                      p: 1.25, borderRadius: 2,
                      bgcolor: alpha(PRIMARY, 0.04),
                      border: `1px solid ${alpha(PRIMARY, 0.08)}`,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {h.title || h.subject_name || 'Homework'}
                        </Typography>
                        {h.due_date && (
                          <Chip label={`Due: ${h.due_date}`} size="small" color="warning" variant="outlined"
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                        )}
                      </Box>
                      {h.subject_name && (
                        <Typography variant="caption" color="text.secondary">
                          {h.subject_name}{h.teacher_name ? ` • ${h.teacher_name}` : ''}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming exams */}
        {upcoming.length > 0 && (
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <SectionTitle
                  icon={<EmojiEvents color="warning" fontSize="small" />}
                  title="Upcoming Exams"
                  count={upcoming.length}
                />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Exam</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Max</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcoming.slice(0, 8).map((e, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 600 }}>{e.exam_name || '-'}</TableCell>
                          <TableCell>{e.subject?.name || e.subject_name || '-'}</TableCell>
                          <TableCell>
                            <Chip label={e.exam_date} size="small" color="warning" variant="outlined"
                              sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{e.start_time || '-'}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{e.max_marks || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

function AttendanceTab({ theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.attendance()
      .then(r => setData(r.data?.data))
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (!data) return <Alert severity="info">No attendance data</Alert>;

  const s = data.summary || {};
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatTile label="Total Days" value={s.total_days || 0} color="#6366f1" icon={<CalendarMonth fontSize="small" />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Present" value={s.present || 0} color="#10b981" icon={<CheckCircle fontSize="small" />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Absent" value={s.absent || 0} color="#ef4444" icon={<Warning fontSize="small" />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Late" value={s.late || 0} color="#f59e0b" icon={<AccessTime fontSize="small" />} />
        </Grid>
      </Grid>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={700}>Overall Attendance</Typography>
            <Typography variant="h6" fontWeight={800}
              color={s.percentage >= 75 ? 'success.main' : 'error.main'}>
              {s.percentage || 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(s.percentage || 0, 100)}
            sx={{
              height: 10, borderRadius: 5,
              bgcolor: alpha('#e5e7eb', 0.5),
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: s.percentage >= 75
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
              },
            }}
          />
          {s.percentage < 75 && s.total_days > 0 && (
            <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
              Attendance below 75%. Please regularize.
            </Alert>
          )}
        </CardContent>
      </Card>

      {(data.monthly || []).length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <SectionTitle icon={<CalendarMonth color="primary" fontSize="small" />} title="Monthly Breakdown" />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Present</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Absent</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Late</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.monthly.map((m, i) => {
                    const pct = m.total > 0 ? Math.round(m.present / m.total * 100) : 0;
                    return (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{formatMonth(m.month)}</TableCell>
                        <TableCell><Chip label={m.present} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell><Chip label={m.absent} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{m.late || 0}</TableCell>
                        <TableCell>
                          <Chip label={`${pct}%`} size="small"
                            color={pct >= 75 ? 'success' : 'error'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {(data.recent || []).length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <SectionTitle icon={<AccessTime color="primary" fontSize="small" />} title="Recent Days" />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {data.recent.slice(0, 30).map((r, i) => {
                const color =
                  r.status === 'present' ? '#10b981' :
                  r.status === 'late' ? '#f59e0b' :
                  r.status === 'absent' ? '#ef4444' : '#94a3b8';
                return (
                  <Chip
                    key={i}
                    label={`${r.date} • ${r.status}`}
                    size="small"
                    sx={{
                      bgcolor: alpha(color, 0.12),
                      color, fontWeight: 600, fontSize: '0.7rem',
                      textTransform: 'capitalize',
                    }}
                  />
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function TimetableTab({ theme }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    studentPortalAPI.timetable()
      .then(r => setData(r.data?.data || []))
      .catch(() => toast.error('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (data.length === 0) return <Alert severity="info" sx={{ borderRadius: 3 }}>No timetable available yet.</Alert>;

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const grouped = {};
  data.forEach(t => {
    const k = (t.day_of_week || '').toLowerCase();
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(t);
  });

  return (
    <Stack spacing={2}>
      {days.map(day => {
        const periods = grouped[day] || [];
        if (periods.length === 0) return null;
        return (
          <Card key={day} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary"
                sx={{ mb: 1, textTransform: 'capitalize' }}>{day}</Typography>
              <Grid container spacing={1}>
                {periods.sort((a, b) =>
                  (a.start_time || '').localeCompare(b.start_time || '')
                ).map((p, i) => (
                  <Grid item xs={6} sm={4} md={3} key={i}>
                    <Box sx={{
                      p: 1, borderRadius: 2, textAlign: 'center',
                      bgcolor: p.is_break ? alpha('#f59e0b', 0.08) : alpha(PRIMARY, 0.06),
                      border: `1px solid ${alpha(p.is_break ? '#f59e0b' : PRIMARY, 0.15)}`,
                    }}>
                      <Typography variant="caption" fontWeight={700} color="primary">
                        P{p.period_number || i + 1}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {p.is_break ? 'Break' : (p.subject_name || '-')}
                      </Typography>
                      {p.teacher_name && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {p.teacher_name}
                        </Typography>
                      )}
                      {p.start_time && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                          {p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

function HomeworkTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.homework()
      .then(r => setData(r.data?.data || []))
      .catch(() => toast.error('Failed to load homework'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (data.length === 0) return <Alert severity="info" sx={{ borderRadius: 3 }}>No homework assigned.</Alert>;

  return (
    <Stack spacing={1.5}>
      {data.map((h, i) => (
        <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight={700}>
                  {h.title || 'Homework'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {h.subject_name && `${h.subject_name} • `}
                  {h.teacher_name && `By ${h.teacher_name}`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                {h.due_date && (
                  <Chip label={`Due: ${h.due_date}`} size="small" color="warning" variant="outlined"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                )}
                {h.status && (
                  <Chip label={h.status} size="small"
                    color={h.status === 'completed' ? 'success' : 'default'}
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                )}
              </Stack>
            </Box>
            {h.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {h.description}
              </Typography>
            )}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function ExamsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.exams()
      .then(r => setData(r.data?.data))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (!data) return <Alert severity="info">No exam data</Alert>;

  const upcoming = data.upcoming || [];
  const results = data.results_by_exam || [];

  return (
    <Box>
      {upcoming.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <SectionTitle icon={<Schedule color="warning" fontSize="small" />} title="Upcoming Exams" count={upcoming.length} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Exam</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Max</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcoming.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontWeight: 600 }}>{e.exam_name || '-'}</TableCell>
                      <TableCell>{e.subject?.name || e.subject_name || '-'}</TableCell>
                      <TableCell>
                        <Chip label={e.exam_date} size="small" color="warning" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{e.start_time || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{e.max_marks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {results.length > 0 ? (
        <Stack spacing={1.5}>
          {results.map((r, i) => (
            <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="body1" fontWeight={700}>{r.exam}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.subjects?.length || 0} subjects • {r.obtained}/{r.total_marks}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${r.percentage}%`} size="medium"
                    color={r.percentage >= 60 ? 'success' : r.percentage >= 33 ? 'warning' : 'error'}
                    sx={{ fontWeight: 800, fontSize: '0.85rem' }}
                  />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                        <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Max</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(r.subjects || []).map((s, si) => (
                        <TableRow key={si}>
                          <TableCell>{s.subject_name || s.schedule?.subject?.name || '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>{s.marks_obtained ?? '-'}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {s.max_marks || s.schedule?.max_marks || '-'}
                          </TableCell>
                          <TableCell>
                            {s.grade && (
                              <Chip label={s.grade} size="small" color="primary" variant="outlined"
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 3 }}>No exam results published yet.</Alert>
      )}
    </Box>
  );
}

function FeesTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.fees()
      .then(r => setData(r.data?.data))
      .catch(() => toast.error('Failed to load fees'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (!data) return <Alert severity="info">No fee data</Alert>;

  const s = data.summary || {};
  const installments = data.installments || [];
  const payments = data.recent_payments || [];

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatTile label="Total Fee" value={`\u20B9${(s.total || 0).toLocaleString()}`}
            color="#6366f1" icon={<AttachMoney fontSize="small" />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Paid" value={`\u20B9${(s.paid || 0).toLocaleString()}`}
            color="#10b981" icon={<CheckCircle fontSize="small" />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Pending" value={`\u20B9${(s.pending || 0).toLocaleString()}`}
            color="#f59e0b" icon={<Warning fontSize="small" />} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatTile label="Overdue" value={s.overdue_count || 0}
            color="#ef4444" icon={<Warning fontSize="small" />} />
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
        Fees can only be paid by your parent or guardian via the parent portal.
      </Alert>

      {installments.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <SectionTitle icon={<AttachMoney color="primary" fontSize="small" />} title="Fee Installments" />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Due</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {installments.map((i, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{i.description || `Installment ${i.installment_no || idx + 1}`}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>₹{parseFloat(i.amount || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{i.due_date || '-'}</TableCell>
                      <TableCell>
                        <Chip label={i.status || 'pending'} size="small"
                          color={i.status === 'paid' ? 'success' : i.status === 'overdue' ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <SectionTitle icon={<CheckCircle color="success" fontSize="small" />} title="Recent Payments" />
            <Stack spacing={1}>
              {payments.map((p, i) => (
                <Box key={i} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  p: 1.25, borderRadius: 2, bgcolor: alpha('#10b981', 0.06),
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>
                      ₹{parseFloat(p.amount_paid || p.amount || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.payment_mode || 'Cash'} • {p.receipt_no || '-'}
                    </Typography>
                  </Box>
                  <Chip label={p.payment_date || '-'} size="small" variant="outlined"
                    sx={{ fontSize: '0.7rem' }} />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function LecturesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.lectures({})
      .then(r => {
        const d = r.data?.data;
        setData(Array.isArray(d) ? d : d?.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (data.length === 0) return <Alert severity="info" sx={{ borderRadius: 3 }}>No study materials / lectures uploaded yet.</Alert>;

  return (
    <Stack spacing={1.5}>
      {data.map((m, i) => (
        <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#8b5cf6', 0.12), color: '#8b5cf6' }}>
                    <MenuBook sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Typography variant="body1" fontWeight={700}>{m.title || 'Study Material'}</Typography>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ mb: 0.5, flexWrap: 'wrap' }}>
                  {m.subject_name && <Chip label={m.subject_name} size="small" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />}
                  {m.class_name && <Chip label={m.class_name} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />}
                  {m.material_type && <Chip label={m.material_type} size="small" sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} />}
                </Stack>
                {m.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{m.description}</Typography>
                )}
              </Box>
              {m.file_url && (
                <Chip label="Download" size="small" color="secondary" clickable component="a" href={m.file_url} target="_blank"
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              )}
              {m.video_url && (
                <Chip label="Watch" size="small" color="info" clickable component="a" href={m.video_url} target="_blank"
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

function AnnouncementsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.announcements()
      .then(r => setData(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;
  if (data.length === 0) return <Alert severity="info" sx={{ borderRadius: 3 }}>No announcements.</Alert>;

  return (
    <Stack spacing={1.5}>
      {data.map((a, i) => (
        <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'flex-start' }}>
              <Typography variant="body1" fontWeight={700}>{a.title}</Typography>
              {a.published_at && (
                <Chip label={new Date(a.published_at).toLocaleDateString('en-IN')} size="small"
                  variant="outlined" sx={{ fontSize: '0.7rem' }} />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {a.message}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}

// ── Main ───────────────────────────────────────────────────────────

export default function StudentPortal() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      studentPortalAPI.me().then(r => r.data?.data),
      studentPortalAPI.dashboard().then(r => r.data?.data),
    ])
      .then(([me, dash]) => {
        setProfile(me);
        setDashboardData(dash);
      })
      .catch(err => {
        const msg = err?.response?.data?.message || 'Failed to load student portal';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return <LoadingSkeleton />;

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: alpha(PRIMARY, 0.1) }}>
          <Person sx={{ fontSize: 40, color: PRIMARY }} />
        </Avatar>
        <Typography variant="h5" fontWeight={700} gutterBottom>Profile not linked</Typography>
        <Typography color="text.secondary">
          Your account is not linked to any student record yet.
          Please contact the school office.
        </Typography>
      </Box>
    );
  }

  const tabItems = [
    { label: 'Overview', icon: <TrendingUp /> },
    { label: 'Attendance', icon: <CalendarMonth /> },
    { label: 'Timetable', icon: <Schedule /> },
    { label: 'Homework', icon: <Assignment /> },
    { label: 'Exams', icon: <EmojiEvents /> },
    { label: 'Lectures', icon: <MenuBook /> },
    { label: 'Fees', icon: <AttachMoney /> },
    { label: 'Announcements', icon: <AnnouncementIcon /> },
  ];

  return (
    <Box>
      {/* Profile header */}
      <Card sx={{
        borderRadius: 4, mb: 3, overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(PRIMARY, 0.08)} 0%, ${alpha(SECONDARY, 0.08)} 100%)`,
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs="auto">
              <Avatar src={profile.photo_url || undefined} sx={{
                width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 },
                background: profile.photo_url
                  ? undefined
                  : `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                fontWeight: 800, fontSize: { xs: '1.4rem', sm: '1.8rem' },
              }}>
                {profile.first_name?.[0]}{profile.last_name?.[0] || ''}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.15rem', sm: '1.4rem' } }}>
                {profile.full_name}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {profile.current_class?.name && (
                  <Chip icon={<ClassIcon sx={{ fontSize: 14 }} />}
                    label={`${profile.current_class.name}${profile.current_section?.name ? ' - ' + profile.current_section.name : ''}`}
                    size="small" color="primary"
                    sx={{ fontWeight: 600 }} />
                )}
                {profile.roll_no && (
                  <Chip icon={<Person sx={{ fontSize: 14 }} />}
                    label={`Roll: ${profile.roll_no}`} size="small" color="secondary"
                    sx={{ fontWeight: 600 }} />
                )}
                {profile.admission_no && (
                  <Chip icon={<School sx={{ fontSize: 14 }} />}
                    label={`Adm: ${profile.admission_no}`} size="small"
                    sx={{ fontWeight: 600 }} />
                )}
              </Stack>
            </Grid>
            <Grid item xs="auto">
              <IconButton onClick={loadAll} title="Refresh">
                <Refresh />
              </IconButton>
            </Grid>
          </Grid>

          {/* Class teacher contact */}
          {profile.class_teacher && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.15), color: PRIMARY, width: 36, height: 36 }}>
                  {profile.class_teacher.name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>
                    Class Teacher: {profile.class_teacher.name}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
                    {profile.class_teacher.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">{profile.class_teacher.phone}</Typography>
                      </Box>
                    )}
                    {profile.class_teacher.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">{profile.class_teacher.email}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44, fontSize: '0.85rem' }
        }}
      >
        {tabItems.map((t, i) => (
          <Tab key={i} label={t.label} icon={isMobile ? undefined : t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {tab === 0 && <OverviewTab data={dashboardData} theme={theme} />}
      {tab === 1 && <AttendanceTab theme={theme} />}
      {tab === 2 && <TimetableTab theme={theme} />}
      {tab === 3 && <HomeworkTab />}
      {tab === 4 && <ExamsTab />}
      {tab === 5 && <LecturesTab />}
      {tab === 6 && <FeesTab />}
      {tab === 7 && <AnnouncementsTab />}
    </Box>
  );
}
