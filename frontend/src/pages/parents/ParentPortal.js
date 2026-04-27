import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Skeleton, alpha, useTheme, useMediaQuery,
  Divider, Stack, IconButton, Collapse, Alert,
  TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Badge
} from '@mui/material';
import {
  School, CalendarMonth, AttachMoney, MenuBook, Assignment, Schedule,
  LocalLibrary, DirectionsBus, HealthAndSafety, EmojiEvents,
  CheckCircle, Cancel, AccessTime, ExpandMore, ExpandLess,
  Person, Class as ClassIcon, TrendingUp, Warning,
  Chat, Send, Phone, Email, Close, Payment
} from '@mui/icons-material';
import { parentAPI, communicationAPI } from '../../services/api';
import OnlinePaymentModal from '../../components/OnlinePaymentModal';
import toast from 'react-hot-toast';

// ---- Reusable Components ----
const InfoChip = ({ icon, label, color = 'primary' }) => (
  <Chip icon={icon} label={label} size="small" color={color}
    sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
);

const SectionTitle = ({ icon, title, count }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    {icon}
    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.1rem' } }}>{title}</Typography>
    {count !== undefined && (
      <Chip label={count} size="small" color="primary" sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
    )}
  </Box>
);

const StatMini = ({ label, value, color, icon }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      textAlign: 'center', p: { xs: 1.5, sm: 2 }, borderRadius: 3,
      bgcolor: alpha(color || theme.palette.primary.main, 0.08),
      border: `1px solid ${alpha(color || theme.palette.primary.main, 0.15)}`,
    }}>
      {icon && <Box sx={{ color: color || theme.palette.primary.main, mb: 0.5 }}>{icon}</Box>}
      <Typography variant="h5" sx={{ fontWeight: 800, color: color || theme.palette.primary.main, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
    </Box>
  );
};

// ---- Loading Skeleton ----
const LoadingSkeleton = () => (
  <Box>
    <Skeleton variant="rounded" height={36} width={280} sx={{ mb: 1, borderRadius: 2 }} />
    <Skeleton variant="rounded" height={18} width={200} sx={{ mb: 3 }} />
    <Grid container spacing={3}>
      {[1, 2].map(i => (
        <Grid item xs={12} key={i}>
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: 4 }} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

// ---- Child Detail Tabs ----
function ChildDetailView({ child, theme }) {
  const [tab, setTab] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const PRIMARY = theme.palette.primary.main;

  const att = child.attendance || {};
  const fees = child.fees || {};
  const [onlinePayOpen, setOnlinePayOpen] = useState(false);
  const [onlinePayData, setOnlinePayData] = useState({});
  const exams = child.exams || {};
  const upcoming = child.upcoming_exams || [];
  const homework = child.homework || [];
  const timetable = child.timetable || [];
  const library = child.library || [];
  const transport = child.transport;

  const tabItems = [
    { label: 'Overview', icon: <TrendingUp /> },
    { label: 'Attendance', icon: <CalendarMonth /> },
    { label: 'Exams & Marks', icon: <EmojiEvents /> },
    { label: 'Fees', icon: <AttachMoney /> },
    { label: 'Homework', icon: <Assignment /> },
    { label: 'Timetable', icon: <Schedule /> },
    { label: 'Contact Teacher', icon: <Chat /> },
    { label: 'More', icon: <MenuBook /> },
  ];

  return (
    <Box>
      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44, fontSize: '0.85rem' }
        }}
      >
        {tabItems.map((t, i) => (
          <Tab key={i} label={isMobile ? t.label : t.label} icon={isMobile ? undefined : t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {/* TAB 0: Overview */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <StatMini label="Attendance" value={`${att.percentage || 0}%`} color="#10b981"
              icon={<CalendarMonth fontSize="small" />} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatMini label="Exams Taken" value={exams.total_exams || 0} color="#3b82f6"
              icon={<EmojiEvents fontSize="small" />} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatMini label="Fee Paid" value={`₹${(fees.total_paid || 0).toLocaleString()}`} color="#8b5cf6"
              icon={<AttachMoney fontSize="small" />} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatMini label="Fee Pending" value={`₹${(fees.total_pending || 0).toLocaleString()}`}
              color={fees.total_pending > 0 ? '#ef4444' : '#10b981'}
              icon={<Warning fontSize="small" />} />
          </Grid>

          {/* Upcoming Exams */}
          {upcoming.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
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
                          <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Max Marks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {upcoming.slice(0, 5).map((e, i) => (
                          <TableRow key={i}>
                            <TableCell>{e.exam_name}</TableCell>
                            <TableCell>{e.subject?.name || '-'}</TableCell>
                            <TableCell>
                              <Chip label={e.exam_date} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              {e.start_time ? `${e.start_time}` : '-'}
                            </TableCell>
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

          {/* Recent Homework */}
          {homework.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <SectionTitle icon={<Assignment color="info" fontSize="small" />} title="Recent Homework" count={homework.length} />
                  <Stack spacing={1}>
                    {homework.slice(0, 5).map((hw, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(PRIMARY, 0.04), border: `1px solid ${alpha(PRIMARY, 0.08)}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{hw.title || hw.subject_name || 'Homework'}</Typography>
                          <Chip label={hw.due_date || 'No date'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </Box>
                        {hw.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {hw.description?.substring(0, 100)}{hw.description?.length > 100 ? '...' : ''}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* TAB 1: Attendance */}
      {tab === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <StatMini label="Total Days" value={att.total_days || 0} color="#6366f1" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatMini label="Present" value={att.present || 0} color="#10b981" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatMini label="Absent" value={att.absent || 0} color="#ef4444" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatMini label="Late" value={att.late || 0} color="#f59e0b" />
            </Grid>
          </Grid>

          {/* Attendance Percentage Bar */}
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={700}>Overall Attendance</Typography>
                <Typography variant="h6" fontWeight={800} color={att.percentage >= 75 ? 'success.main' : 'error.main'}>
                  {att.percentage || 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={att.percentage || 0}
                sx={{
                  height: 10, borderRadius: 5,
                  bgcolor: alpha('#e5e7eb', 0.5),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: att.percentage >= 75
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : 'linear-gradient(90deg, #ef4444, #f87171)',
                  },
                }}
              />
              {att.percentage < 75 && (
                <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                  Attendance below 75%. Please ensure regular attendance.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Monthly Breakdown */}
          {att.monthly && att.monthly.length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
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
                      {att.monthly.map((m, i) => {
                        const pct = m.total > 0 ? Math.round(m.present / m.total * 100) : 0;
                        return (
                          <TableRow key={i}>
                            <TableCell sx={{ fontWeight: 600 }}>{m.month}</TableCell>
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
        </Box>
      )}

      {/* TAB 2: Exams & Marks */}
      {tab === 2 && (
        <Box>
          {/* Upcoming Exams */}
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
                        <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Max Marks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {upcoming.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 600 }}>{e.exam_name}</TableCell>
                          <TableCell>{e.subject?.name || '-'}</TableCell>
                          <TableCell>
                            <Chip label={e.exam_date} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
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

          {/* Exam Results */}
          {(exams.results_by_exam || []).length > 0 ? (
            (exams.results_by_exam || []).map((exam, ei) => (
              <ExamResultCard key={ei} exam={exam} theme={theme} />
            ))
          ) : (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No exam results available yet.</Alert>
          )}
        </Box>
      )}

      {/* TAB 3: Fees */}
      {tab === 3 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <StatMini label="Total Fee" value={`₹${(fees.total_fee || 0).toLocaleString()}`} color="#6366f1" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatMini label="Paid" value={`₹${(fees.total_paid || 0).toLocaleString()}`} color="#10b981" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatMini label="Pending" value={`₹${(fees.total_pending || 0).toLocaleString()}`} color="#f59e0b" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatMini label="Overdue" value={fees.overdue_count || 0} color="#ef4444" />
            </Grid>
          </Grid>

          {fees.total_fee > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={700}>Payment Progress</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {fees.total_fee > 0 ? Math.round(fees.total_paid / fees.total_fee * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={fees.total_fee > 0 ? Math.min(fees.total_paid / fees.total_fee * 100, 100) : 0}
                  sx={{
                    height: 10, borderRadius: 5, bgcolor: alpha('#e5e7eb', 0.5),
                    '& .MuiLinearProgress-bar': { borderRadius: 5, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Installments */}
          {(fees.installments || []).length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <SectionTitle icon={<AttachMoney color="primary" fontSize="small" />} title="Fee Installments" />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fees.installments.map((inst, i) => (
                        <TableRow key={i}>
                          <TableCell>{inst.description || inst.fee_type || `Installment ${i + 1}`}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>₹{parseFloat(inst.amount || 0).toLocaleString()}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{inst.due_date || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={inst.status || 'pending'}
                              size="small"
                              color={inst.status === 'paid' ? 'success' : inst.status === 'overdue' ? 'error' : 'warning'}
                              sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            {inst.status !== 'paid' && (
                              <Button
                                size="small" variant="contained" color="success"
                                startIcon={<Payment />}
                                sx={{ fontSize: '0.7rem', textTransform: 'none', borderRadius: 2 }}
                                onClick={() => {
                                  setOnlinePayData({
                                    student_id: child.student?.id || child.id,
                                    student_name: `${child.student?.first_name || ''} ${child.student?.last_name || ''}`.trim(),
                                    fee_structure_id: inst.fee_structure_id || inst.structure_id,
                                    installment_id: inst.id,
                                    amount: parseFloat(inst.amount || 0) - parseFloat(inst.paid_amount || 0),
                                    email: child.student?.email || '',
                                  });
                                  setOnlinePayOpen(true);
                                }}
                              >
                                Pay ₹{(parseFloat(inst.amount || 0) - parseFloat(inst.paid_amount || 0)).toLocaleString()}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Online Payment Modal */}
          <OnlinePaymentModal
            open={onlinePayOpen}
            onClose={() => { setOnlinePayOpen(false); setOnlinePayData({}); }}
            paymentData={onlinePayData}
            onSuccess={() => { toast.success('Payment successful! Receipt generated.'); setOnlinePayOpen(false); setOnlinePayData({}); }}
          />

          {/* Recent Payments */}
          {(fees.recent_payments || []).length > 0 && (
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <SectionTitle icon={<CheckCircle color="success" fontSize="small" />} title="Recent Payments" />
                <Stack spacing={1}>
                  {fees.recent_payments.map((p, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: alpha('#10b981', 0.06) }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>₹{parseFloat(p.amount || 0).toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.payment_mode || 'Cash'} • {p.receipt_no || '-'}</Typography>
                      </Box>
                      <Chip label={p.payment_date || '-'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* TAB 4: Homework */}
      {tab === 4 && (
        <Box>
          {homework.length > 0 ? (
            <Stack spacing={1.5}>
              {homework.map((hw, i) => (
                <Card key={i} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={700}>{hw.title || 'Homework'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {hw.subject_name && `${hw.subject_name} • `}
                          {hw.teacher_name && `By ${hw.teacher_name}`}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        {hw.due_date && <Chip label={`Due: ${hw.due_date}`} size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />}
                        {hw.status && <Chip label={hw.status} size="small" color={hw.status === 'completed' ? 'success' : 'default'} sx={{ fontSize: '0.7rem', fontWeight: 600 }} />}
                      </Stack>
                    </Box>
                    {hw.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {hw.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No homework assigned yet.</Alert>
          )}
        </Box>
      )}

      {/* TAB 5: Timetable */}
      {tab === 5 && (
        <Box>
          {timetable.length > 0 ? (
            <TimetableView timetable={timetable} theme={theme} />
          ) : (
            <Alert severity="info" sx={{ borderRadius: 3 }}>No timetable available.</Alert>
          )}
        </Box>
      )}

      {/* TAB 6: Contact Class Teacher */}
      {tab === 6 && (
        <ContactTeacher child={child} theme={theme} />
      )}

      {/* TAB 7: More (Library, Transport, Health) */}
      {tab === 7 && (
        <Grid container spacing={2}>
          {/* Library */}
          <Grid item xs={12} sm={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <SectionTitle icon={<LocalLibrary color="primary" fontSize="small" />} title="Library" count={library.length} />
                {library.length > 0 ? (
                  <Stack spacing={1}>
                    {library.slice(0, 5).map((li, i) => (
                      <Box key={i} sx={{ p: 1, borderRadius: 2, bgcolor: alpha(PRIMARY, 0.04) }}>
                        <Typography variant="body2" fontWeight={700}>{li.book_title || li.book?.title || 'Book'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Issued: {li.issue_date || '-'}
                          {li.due_date && ` • Due: ${li.due_date}`}
                          {li.return_date && ` • Returned: ${li.return_date}`}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No library records</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Transport */}
          <Grid item xs={12} sm={6}>
            <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <SectionTitle icon={<DirectionsBus color="warning" fontSize="small" />} title="Transport" />
                {transport ? (
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.06) }}>
                    <Typography variant="body2" fontWeight={700}>
                      Route: {transport.route_name || transport.route?.name || '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stop: {transport.stop_name || transport.stop?.name || '-'}
                      {transport.vehicle_no && ` • Vehicle: ${transport.vehicle_no}`}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No transport assigned</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Health */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <SectionTitle icon={<HealthAndSafety color="error" fontSize="small" />} title="Health Records" count={(child.health || []).length} />
                {(child.health || []).length > 0 ? (
                  <Stack spacing={1}>
                    {child.health.slice(0, 5).map((h, i) => (
                      <Box key={i} sx={{ p: 1, borderRadius: 2, bgcolor: alpha('#ef4444', 0.04) }}>
                        <Typography variant="body2" fontWeight={700}>{h.record_type || h.title || 'Health Record'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {h.record_date || h.date || '-'} {h.description && ` • ${h.description.substring(0, 80)}`}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No health records</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

// ---- Contact Class Teacher ----
function ContactTeacher({ child, theme }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [calling, setCalling] = useState(false);
  const [whatsapping, setWhatsapping] = useState(false);
  const messagesEndRef = useRef(null);
  const PRIMARY = theme.palette.primary.main;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const teacher = child.class_teacher;
  const coTeacher = child.co_class_teacher;

  useEffect(() => {
    if (teacher) {
      parentAPI.listMessages({ student_id: child.id, teacher_id: teacher.id })
        .then(res => {
          const items = res.data?.data?.items || res.data?.data || [];
          setMessages(Array.isArray(items) ? items.reverse() : []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [child.id, teacher]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!msgText.trim() || !teacher) return;
    setSending(true);
    try {
      await parentAPI.sendMessage({
        receiver_type: 'teacher',
        receiver_id: teacher.id,
        student_id: child.id,
        subject: subject || `Message from parent`,
        message: msgText.trim(),
      });
      setMsgText('');
      // Refresh messages
      const res = await parentAPI.listMessages({ student_id: child.id, teacher_id: teacher.id });
      const items = res.data?.data?.items || res.data?.data || [];
      setMessages(Array.isArray(items) ? items.reverse() : []);
      toast.success('Message sent!');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleWhatsApp = async (teacherObj) => {
    if (!teacherObj?.phone) return toast.error('Teacher phone not available');
    setWhatsapping(true);
    try {
      await communicationAPI.sendWhatsApp({
        phone: teacherObj.phone,
        message: `Hello ${teacherObj.name}, I am the parent of ${child.first_name} ${child.last_name || ''}. I would like to discuss regarding my child.`,
        recipient_name: teacherObj.name,
        student_id: child.id,
        subject: `Parent enquiry - ${child.first_name}`,
      });
      toast.success('WhatsApp message sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send WhatsApp. Check GREEN-API config.');
    } finally {
      setWhatsapping(false);
    }
  };

  const handleIVRCall = async (teacherObj) => {
    if (!teacherObj?.phone) return toast.error('Teacher phone not available');
    setCalling(true);
    try {
      await communicationAPI.initiateCall({
        phone: teacherObj.phone,
        recipient_name: teacherObj.name,
        student_id: child.id,
      });
      toast.success('Call initiated! You will receive a call shortly.');
    } catch {
      toast.error('Failed to initiate call');
    } finally {
      setCalling(false);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Teacher Info Cards */}
      <Grid item xs={12} sm={teacher && coTeacher ? 6 : 12}>
        {teacher ? (
          <Card variant="outlined" sx={{ borderRadius: 3, border: `2px solid ${alpha(PRIMARY, 0.2)}` }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{
                  width: 56, height: 56,
                  background: `linear-gradient(135deg, ${PRIMARY}, ${theme.palette.secondary.main})`,
                  fontWeight: 700, fontSize: '1.2rem',
                }}>
                  {teacher.name?.[0] || 'T'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={800}>{teacher.name}</Typography>
                  <Chip label="Class Teacher" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem', mt: 0.3 }} />
                  {teacher.designation && (
                    <Typography variant="caption" display="block" color="text.secondary">{teacher.designation}</Typography>
                  )}
                </Box>
              </Box>
              <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                {teacher.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{teacher.phone}</Typography>
                  </Box>
                )}
                {teacher.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{teacher.email}</Typography>
                  </Box>
                )}
              </Stack>
              {/* WhatsApp & IVR Call Buttons */}
              {teacher.phone && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    size="small" variant="contained"
                    onClick={() => handleWhatsApp(teacher)}
                    disabled={whatsapping}
                    sx={{
                      bgcolor: '#25D366', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1,
                      '&:hover': { bgcolor: '#1da851' },
                    }}
                    startIcon={<Chat />}
                  >
                    {whatsapping ? 'Sending...' : 'WhatsApp'}
                  </Button>
                  <Button
                    size="small" variant="contained"
                    onClick={() => handleIVRCall(teacher)}
                    disabled={calling}
                    sx={{
                      bgcolor: '#1976d2', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1,
                      '&:hover': { bgcolor: '#1565c0' },
                    }}
                    startIcon={<Phone />}
                  >
                    {calling ? 'Calling...' : 'Call'}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 3 }}>No class teacher assigned yet.</Alert>
        )}
      </Grid>

      {coTeacher && (
        <Grid item xs={12} sm={6}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: alpha(PRIMARY, 0.15), color: PRIMARY, fontWeight: 700 }}>
                  {coTeacher.name?.[0] || 'T'}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={700}>{coTeacher.name}</Typography>
                  <Chip label="Co-Class Teacher" size="small" variant="outlined" color="primary" sx={{ fontWeight: 600, fontSize: '0.65rem', mt: 0.3 }} />
                </Box>
              </Box>
              <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                {coTeacher.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{coTeacher.phone}</Typography>
                  </Box>
                )}
                {coTeacher.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{coTeacher.email}</Typography>
                  </Box>
                )}
              </Stack>
              {coTeacher.phone && (
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button size="small" variant="contained"
                    onClick={() => handleWhatsApp(coTeacher)} disabled={whatsapping}
                    sx={{ bgcolor: '#25D366', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { bgcolor: '#1da851' } }}
                    startIcon={<Chat />}
                  >WhatsApp</Button>
                  <Button size="small" variant="contained"
                    onClick={() => handleIVRCall(coTeacher)} disabled={calling}
                    sx={{ bgcolor: '#1976d2', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 700, flex: 1, '&:hover': { bgcolor: '#1565c0' } }}
                    startIcon={<Phone />}
                  >Call</Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Chat / Messages */}
      {teacher && (
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chat color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>Messages with {teacher.name}</Typography>
                <Chip label={messages.length} size="small" sx={{ ml: 'auto', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Box>

              {/* Messages Area */}
              <Box sx={{
                maxHeight: 400, minHeight: 200, overflowY: 'auto', p: 2,
                bgcolor: alpha('#f1f5f9', 0.5),
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: alpha(PRIMARY, 0.2), borderRadius: 2 },
              }}>
                {loading ? (
                  <Box textAlign="center" py={4}><LinearProgress sx={{ maxWidth: 200, mx: 'auto', borderRadius: 5 }} /></Box>
                ) : messages.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Chat sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No messages yet. Start a conversation with the class teacher.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_type === 'parent';
                      return (
                        <Box key={i} sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          <Box sx={{
                            maxWidth: '75%',
                            p: 1.5, borderRadius: 2.5,
                            bgcolor: isMe ? PRIMARY : '#fff',
                            color: isMe ? '#fff' : 'text.primary',
                            boxShadow: isMe ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                            borderBottomRightRadius: isMe ? 4 : 20,
                            borderBottomLeftRadius: isMe ? 20 : 4,
                          }}>
                            {msg.subject && (
                              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.85, display: 'block', mb: 0.3 }}>
                                {msg.subject}
                              </Typography>
                            )}
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {msg.message}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', textAlign: 'right', mt: 0.5, fontSize: '0.6rem' }}>
                              {msg.created_at ? new Date(msg.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </Stack>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth size="small" multiline maxRows={3}
                  placeholder="Type your message..."
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fff' } }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={sending || !msgText.trim()}
                  sx={{
                    bgcolor: PRIMARY, color: '#fff', borderRadius: 2.5,
                    width: 42, height: 42,
                    '&:hover': { bgcolor: alpha(PRIMARY, 0.85) },
                    '&:disabled': { bgcolor: alpha(PRIMARY, 0.3), color: '#fff' },
                  }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}

// ---- Exam Result Card ----
function ExamResultCard({ exam, theme }) {
  const [open, setOpen] = useState(false);
  const PRIMARY = theme.palette.primary.main;

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
          <Box>
            <Typography variant="body1" fontWeight={700}>{exam.exam}</Typography>
            <Typography variant="caption" color="text.secondary">
              {exam.subjects?.length || 0} subjects • Total: {exam.obtained}/{exam.total_marks}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${exam.percentage}%`}
              size="small"
              color={exam.percentage >= 60 ? 'success' : exam.percentage >= 33 ? 'warning' : 'error'}
              sx={{ fontWeight: 700, fontSize: '0.8rem' }}
            />
            <IconButton size="small">{open ? <ExpandLess /> : <ExpandMore />}</IconButton>
          </Box>
        </Box>
        <Collapse in={open}>
          <TableContainer sx={{ mt: 1.5 }}>
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
                {(exam.subjects || []).map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.subject_name || s.schedule?.subject?.name || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{s.marks_obtained ?? '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{s.max_marks || s.schedule?.max_marks || '-'}</TableCell>
                    <TableCell>
                      {s.grade && <Chip label={s.grade} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </CardContent>
    </Card>
  );
}

// ---- Timetable View ----
function TimetableView({ timetable, theme }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMap = {};
  timetable.forEach(t => {
    const day = t.day_of_week || t.day || 0;
    if (!dayMap[day]) dayMap[day] = [];
    dayMap[day].push(t);
  });

  return (
    <Stack spacing={2}>
      {days.map((dayName, dayIndex) => {
        const periods = dayMap[dayIndex] || dayMap[dayIndex + 1] || [];
        if (periods.length === 0) return null;
        return (
          <Card key={dayIndex} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1 }}>{dayName}</Typography>
              <Grid container spacing={1}>
                {periods.sort((a, b) => (a.period_no || 0) - (b.period_no || 0)).map((p, i) => (
                  <Grid item xs={6} sm={4} md={3} key={i}>
                    <Box sx={{
                      p: 1, borderRadius: 2, textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}>
                      <Typography variant="caption" fontWeight={700} color="primary">P{p.period_no || i + 1}</Typography>
                      <Typography variant="body2" fontWeight={600} noWrap>{p.subject_name || p.subject?.name || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{p.teacher_name || ''}</Typography>
                      {p.start_time && (
                        <Typography variant="caption" display="block" color="text.secondary">{p.start_time}-{p.end_time}</Typography>
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

// ---- Main Parent Portal ----
export default function ParentPortal() {
  const [children, setChildren] = useState([]);
  const [childDetails, setChildDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  useEffect(() => {
    parentAPI.listMyChildren()
      .then(res => {
        const list = res.data?.data || [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedChild(list[0].id);
          loadChildDetail(list[0].id);
        }
      })
      .catch(() => toast.error('Failed to load children data'))
      .finally(() => setLoading(false));
  }, []);

  const loadChildDetail = (studentId) => {
    if (childDetails[studentId]) return;
    setLoadingDetail(true);
    parentAPI.getChildOverview(studentId)
      .then(res => {
        setChildDetails(prev => ({ ...prev, [studentId]: res.data?.data }));
      })
      .catch(() => toast.error('Failed to load child details'))
      .finally(() => setLoadingDetail(false));
  };

  const handleSelectChild = (id) => {
    setSelectedChild(id);
    loadChildDetail(id);
  };

  if (loading) return <LoadingSkeleton />;

  if (children.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: alpha(PRIMARY, 0.1) }}>
          <Person sx={{ fontSize: 40, color: PRIMARY }} />
        </Avatar>
        <Typography variant="h5" fontWeight={700} gutterBottom>No Children Linked</Typography>
        <Typography color="text.secondary">
          Your account is not linked to any student yet. Please contact the school administration.
        </Typography>
      </Box>
    );
  }

  const currentChild = childDetails[selectedChild];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', sm: '1.5rem' } }}>
          My Children
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View your child's academic progress, attendance, fees and more
        </Typography>
      </Box>

      {/* Child Selector - Cards */}
      {children.length > 1 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {children.map(child => (
            <Grid item xs={12} sm={6} md={4} key={child.id}>
              <Card
                onClick={() => handleSelectChild(child.id)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: selectedChild === child.id ? `2px solid ${PRIMARY}` : '2px solid transparent',
                  bgcolor: selectedChild === child.id ? alpha(PRIMARY, 0.04) : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: PRIMARY, transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${alpha(PRIMARY, 0.15)}` },
                }}
              >
                <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    width: 48, height: 48,
                    background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                    fontWeight: 700, fontSize: '1.1rem',
                  }}>
                    {child.name?.[0] || 'S'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" fontWeight={700} noWrap>{child.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {child.class_name && `${child.class_name}`}{child.section_name && ` - ${child.section_name}`}
                      {child.roll_no && ` • Roll: ${child.roll_no}`}
                    </Typography>
                  </Box>
                  {selectedChild === child.id && <CheckCircle color="primary" fontSize="small" />}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Selected Child Profile Card */}
      {currentChild && (
        <Card sx={{
          borderRadius: 4, mb: 3, overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha(PRIMARY, 0.05)} 0%, ${alpha(SECONDARY, 0.05)} 100%)`,
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm="auto">
                <Avatar sx={{
                  width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 },
                  background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                  fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem' },
                  mx: { xs: 'auto', sm: 0 },
                }}>
                  {currentChild.first_name?.[0] || currentChild.name?.[0] || 'S'}
                </Avatar>
              </Grid>
              <Grid item xs={12} sm>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                    {currentChild.first_name} {currentChild.last_name || ''}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap', gap: 0.5 }}>
                    {currentChild.class_name && <InfoChip icon={<ClassIcon sx={{ fontSize: 16 }} />} label={`${currentChild.class_name}${currentChild.section_name ? ' - ' + currentChild.section_name : ''}`} />}
                    {currentChild.roll_no && <InfoChip icon={<Person sx={{ fontSize: 16 }} />} label={`Roll: ${currentChild.roll_no}`} color="secondary" />}
                    {currentChild.admission_no && <InfoChip icon={<School sx={{ fontSize: 16 }} />} label={`Adm: ${currentChild.admission_no}`} color="default" />}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Child Detail Tabs */}
      {loadingDetail && !currentChild ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto', borderRadius: 5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading details...</Typography>
        </Box>
      ) : currentChild ? (
        <ChildDetailView child={currentChild} theme={theme} />
      ) : null}
    </Box>
  );
}
