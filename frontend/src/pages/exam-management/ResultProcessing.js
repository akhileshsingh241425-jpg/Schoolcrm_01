import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress, alpha, useTheme,
  Alert, IconButton, Grid, Card, CardContent
} from '@mui/material';
import {
  Assessment, TrendingUp, School, EmojiEvents, Refresh, PlayArrow
} from '@mui/icons-material';
import examMgmtAPI from '../../services/examApi';
import toast from 'react-hot-toast';

export default function ResultProcessing({ exam }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const theme = useTheme();

  const loadAnalysis = () => {
    if (!exam) return;
    setLoading(true);
    examMgmtAPI.getResultAnalysis(exam.id, {})
      .then(res => setAnalysis(res.data?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAnalysis(); }, [exam?.id]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await examMgmtAPI.processResults(exam.id);
      toast.success('Results processed successfully');
      setAnalysis(res.data?.data);
      loadAnalysis();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to process results'); }
    finally { setProcessing(false); }
  };

  if (!exam) return <Alert severity="info">Pehle exam select karo</Alert>;
  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Action Bar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Result Processing: {exam.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            Process results to calculate totals, percentages, grades, and ranks
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<PlayArrow />} onClick={handleProcess}
            disabled={processing}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {processing ? 'Processing...' : 'Process Results'}
          </Button>
          <IconButton onClick={loadAnalysis}><Refresh /></IconButton>
        </Box>
      </Paper>

      {/* Result Summary */}
      {analysis ? (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, borderTop: '3px solid #10b981' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color="#10b981">
                    {analysis.pass_percentage || analysis.pass_percent || 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Pass Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, borderTop: '3px solid #3b82f6' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color="#3b82f6">
                    {analysis.total_students || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Total Students</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, borderTop: '3px solid #f59e0b' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color="#f59e0b">
                    {analysis.compartment_count || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Compartment</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ borderRadius: 3, borderTop: '3px solid #ef4444' }}>
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color="#ef4444">
                    {analysis.failed_count || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Failed</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Subject-wise Analysis */}
          {analysis.subjects && analysis.subjects.length > 0 && (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={700}>Subject-wise Analysis</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Avg Marks</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Highest</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Lowest</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Pass %</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Students</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.subjects.map((sub, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{sub.subject_name}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{sub.class_name || '-'}</TableCell>
                        <TableCell>
                          <Chip label={sub.average?.toFixed(1) || '-'} size="small"
                            sx={{ fontWeight: 600, bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#10b981' }}>{sub.highest || '-'}</TableCell>
                        <TableCell sx={{ color: '#ef4444' }}>{sub.lowest || '-'}</TableCell>
                        <TableCell>
                          <Chip label={`${sub.pass_percentage || 0}%`} size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha((sub.pass_percentage || 0) >= 60 ? '#10b981' : '#ef4444', 0.1),
                              color: (sub.pass_percentage || 0) >= 60 ? '#10b981' : '#ef4444'
                            }} />
                        </TableCell>
                        <TableCell>{sub.total_students || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Toppers */}
          {analysis.toppers && analysis.toppers.length > 0 && (
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mt: 2 }}>
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents sx={{ color: '#f59e0b', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>Toppers</Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Rank</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analysis.toppers.map((t, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Chip label={`#${idx + 1}`} size="small"
                            sx={{ fontWeight: 700, bgcolor: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#fef2f2',
                              color: idx === 0 ? '#d97706' : idx === 1 ? '#64748b' : '#b91c1c' }} />
                        </TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{t.student_name}</Typography></TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{t.class_name || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t.total_marks}</TableCell>
                        <TableCell>
                          <Chip label={`${t.percentage?.toFixed(1)}%`} size="small" color="success" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Assessment sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No results processed yet. Click "Process Results" after marks entry is complete.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
