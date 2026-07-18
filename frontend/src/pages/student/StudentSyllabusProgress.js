import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, LinearProgress, Avatar, alpha, useTheme, IconButton,
  Collapse, Skeleton, Tooltip
} from '@mui/material';
import {
  MenuBook, ExpandLess, ExpandMore, Refresh, School, FiberManualRecord,
  PersonOutline, Book, Assignment
} from '@mui/icons-material';
import { studentPortalAPI } from '../../services/api';

export default function StudentSyllabusProgress() {
  const theme = useTheme();
  const P = theme.palette.primary.main;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const loadData = () => {
    setLoading(true);
    studentPortalAPI.mySyllabus()
      .then(r => setData(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <Box>
      <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
      {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />)}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(P, 0.1), color: P, width: 44, height: 44 }}>
            <MenuBook />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>My Syllabus Progress</Typography>
            <Typography variant="body2" color="text.secondary">View your subject-wise syllabus completion</Typography>
          </Box>
        </Box>
        <IconButton onClick={loadData} size="small"><Refresh /></IconButton>
      </Box>

      {data.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <School sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No syllabus data available for your class</Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(P, 0.04) }}>
                  <TableCell sx={{ width: 44, py: 1.5 }} />
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Book</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, textAlign: 'center' }}>Chapters</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5, minWidth: 150 }}>Completion</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((group) => {
                  const key = `${group.class_id}_${group.subject_id}`;
                  const isOpen = expanded[key];
                  const total = group.total_chapters || 0;
                  const pct = group.completion_pct || 0;
                  const chapters = group.chapters || [];
                  const hasTeacher = !!group.teacher_name;
                  const hasBook = !!group.book_name;
                  const hasChapters = chapters.length > 0 || total > 0;

                  let status, statusColor;
                  if (!hasBook && !hasChapters) {
                    status = 'Not Assigned';
                    statusColor = 'default';
                  } else {
                    status = pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started';
                    statusColor = status === 'Completed' ? 'success' : status === 'In Progress' ? 'primary' : 'default';
                  }

                  return (
                    <React.Fragment key={key}>
                      {/* Subject Row */}
                      <TableRow
                        hover
                        sx={{
                          cursor: hasChapters ? 'pointer' : 'default',
                          bgcolor: hasTeacher ? alpha(P, 0.02) : alpha('#f59e0b', 0.02),
                          '&:hover': { bgcolor: hasTeacher ? alpha(P, 0.05) : alpha('#f59e0b', 0.05) }
                        }}
                        onClick={hasChapters ? () => toggle(key) : undefined}
                      >
                        <TableCell sx={{ pl: 1, py: 1.5 }}>
                          {hasChapters ? (
                            <IconButton size="small" sx={{ p: 0.25, color: P }}>
                              {isOpen ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          ) : (
                            <FiberManualRecord sx={{ fontSize: 8, color: 'text.disabled', mx: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(P, 0.08), color: P }}>
                              <Assignment sx={{ fontSize: 14 }} />
                            </Avatar>
                            <Typography variant="body2" fontWeight={700}>{group.subject_name || '-'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {hasTeacher ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <PersonOutline sx={{ fontSize: 16, color: '#10b981' }} />
                              <Typography variant="body2" fontWeight={600} color="#10b981">{group.teacher_name}</Typography>
                            </Box>
                          ) : (
                            <Chip label="Not Assigned" size="small" variant="outlined"
                              sx={{ fontSize: '0.65rem', color: '#f59e0b', borderColor: alpha('#f59e0b', 0.4), bgcolor: alpha('#f59e0b', 0.04) }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {hasBook ? (
                            <Tooltip title={group.book_name} arrow placement="top">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                <Book sx={{ fontSize: 16, color: P }} />
                                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {group.book_name}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5, textAlign: 'center' }}>
                          {hasChapters || hasBook ? (
                            <Chip label={total ? `${chapters.length} / ${total}` : `${chapters.length}`}
                              size="small" color={chapters.length > 0 ? 'primary' : 'default'}
                              sx={{ fontWeight: 600, minWidth: 52 }} />
                          ) : (
                            <Typography variant="caption" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {(hasChapters || hasBook) ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress variant="determinate" value={Math.min(pct, 100)}
                                sx={{ flex: 1, height: 8, borderRadius: '4px',
                                  '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#10b981' : pct >= 50 ? P : '#f59e0b' }
                                }} />
                              <Typography variant="caption" fontWeight={700} sx={{ minWidth: 32, textAlign: 'right' }}>{Math.round(pct)}%</Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip label={status} size="small" color={statusColor}
                            variant={!hasBook && !hasChapters ? 'outlined' : 'filled'}
                            sx={{ fontWeight: 600, ...((!hasBook && !hasChapters) && { color: '#f59e0b', borderColor: alpha('#f59e0b', 0.4) }) }} />
                        </TableCell>
                      </TableRow>

                      {/* Chapter Rows */}
                      {isOpen && chapters.map((ch) => {
                        const chPct = ch.completion_percentage || 0;
                        const chStatus = chPct >= 100 ? 'Completed' : chPct >= 50 ? 'In Progress' : chPct > 0 ? 'Started' : 'Not Started';
                        const chColor = chPct >= 100 ? 'success' : chPct >= 50 ? 'primary' : chPct > 0 ? 'warning' : 'default';
                        return (
                          <TableRow key={ch.id} hover sx={{ bgcolor: alpha('#fafafa', 0.5) }}>
                            <TableCell sx={{ pl: 1 }} />
                            <TableCell sx={{ pl: 5, py: 1.2 }}>
                              <Chip icon={<FiberManualRecord sx={{ fontSize: 8 }} />}
                                label={`Ch ${ch.chapter_number}`}
                                size="small" variant="outlined"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                            </TableCell>
                            <TableCell />
                            <TableCell>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ch.chapter_name || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell />
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress variant="determinate" value={Math.min(chPct, 100)}
                                  sx={{ flex: 1, height: 6, borderRadius: '3px' }} />
                                <Typography variant="caption" fontWeight={600} sx={{ minWidth: 32, textAlign: 'right' }}>{Math.round(chPct)}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={chStatus} size="small" color={chColor} sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {isOpen && chapters.length === 0 && (
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell colSpan={7} sx={{ textAlign: 'center', py: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.secondary' }}>
                              <MenuBook sx={{ fontSize: 16 }} />
                              <Typography variant="caption">No chapters added yet. Syllabus will appear here once assigned by your teacher.</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
