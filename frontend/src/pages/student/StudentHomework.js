import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Tabs, Tab,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, LinearProgress, Alert, Stack, Avatar, IconButton,
  alpha, useTheme, Skeleton, Tooltip, Link
} from '@mui/material';
import {
  Assignment, CloudUpload, Send, CheckCircle, Schedule,
  Warning, GradeOutlined, AttachFile, Close, Sort
} from '@mui/icons-material';
import { studentPortalAPI, academicsAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', label: 'Pending', icon: <Schedule fontSize="small" /> },
  submitted: { color: '#3b82f6', label: 'Submitted', icon: <Send fontSize="small" /> },
  graded: { color: '#10b981', label: 'Graded', icon: <CheckCircle fontSize="small" /> },
  overdue: { color: '#ef4444', label: 'Overdue', icon: <Warning fontSize="small" /> },
};

const getStatus = (hw) => {
  if (hw.status === 'graded' || hw.grade) return 'graded';
  if (hw.status === 'submitted' || hw.submitted_at) return 'submitted';
  if (hw.due_date && dayjs(hw.due_date).isBefore(dayjs(), 'day') && hw.status !== 'submitted') return 'overdue';
  return hw.status || 'pending';
};

export default function StudentHomework() {
  const theme = useTheme();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [submitDialog, setSubmitDialog] = useState({ open: false, hw: null });
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchHomework = useCallback(() => {
    setLoading(true);
    studentPortalAPI.homework()
      .then(r => {
        const data = r.data?.data || r.data || [];
        const sorted = [...data].sort((a, b) => {
          const da = a.due_date ? dayjs(a.due_date) : dayjs().add(100, 'year');
          const db = b.due_date ? dayjs(b.due_date) : dayjs().add(100, 'year');
          return da.diff(db);
        });
        setHomework(sorted);
      })
      .catch(() => toast.error('Failed to load homework'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHomework(); }, [fetchHomework]);

  const tabs = ['All', 'Pending', 'Submitted', 'Graded', 'Overdue'];
  const filtered = homework.filter(hw => {
    if (tab === 0) return true;
    const status = getStatus(hw);
    return status === tabs[tab].toLowerCase();
  });

  const handleOpenSubmit = (hw) => {
    setSubmitDialog({ open: true, hw });
    setSubmissionText('');
    setAttachmentUrl('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.upload(file, 'homework');
      const url = res.data?.data?.file_url || res.data?.file_url || res.data?.url;
      setAttachmentUrl(url || '');
      toast.success('File uploaded');
    } catch {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionText && !attachmentUrl) {
      toast.error('Please add text or upload a file');
      return;
    }
    setSubmitting(true);
    try {
      await academicsAPI.submitHomework(submitDialog.hw.id, {
        submission_text: submissionText,
        attachment_url: attachmentUrl,
      });
      toast.success('Homework submitted successfully');
      setSubmitDialog({ open: false, hw: null });
      fetchHomework();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2, borderRadius: 3 }} />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 2, borderRadius: 3 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.main }}>
          <Assignment />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}>My Homework</Typography>
          <Typography variant="body2" color="text.secondary">
            {homework.length} assignment{homework.length !== 1 ? 's' : ''} total
          </Typography>
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Tabs
        value={tab} onChange={(_, v) => setTab(v)}
        variant="scrollable" scrollButtons="auto"
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}
      >
        {tabs.map((t, i) => {
          const count = homework.filter(hw => i === 0 ? true : getStatus(hw) === t.toLowerCase()).length;
          return <Tab key={t} label={`${t} (${count})`} />;
        })}
      </Tabs>

      {/* Homework List */}
      {filtered.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No {tab > 0 ? tabs[tab].toLowerCase() : ''} homework found.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {filtered.map((hw) => {
            const status = getStatus(hw);
            const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            const isPending = status === 'pending';
            const isOverdue = status === 'overdue';
            const isGraded = status === 'graded';

            return (
              <Card key={hw.id} variant="outlined" sx={{
                borderRadius: 3,
                borderColor: alpha(cfg.color, 0.3),
                '&:hover': { borderColor: cfg.color, boxShadow: `0 2px 12px ${alpha(cfg.color, 0.1)}` },
                transition: 'all 0.2s',
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {hw.title || 'Untitled Homework'}
                        </Typography>
                        <Chip
                          icon={cfg.icon}
                          label={cfg.label}
                          size="small"
                          sx={{
                            bgcolor: alpha(cfg.color, 0.1),
                            color: cfg.color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            '& .MuiChip-icon': { color: cfg.color },
                          }}
                        />
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        {hw.subject_name && (
                          <Typography variant="caption" color="text.secondary">
                            📚 {hw.subject_name}
                          </Typography>
                        )}
                        {hw.teacher_name && (
                          <Typography variant="caption" color="text.secondary">
                            👤 {hw.teacher_name}
                          </Typography>
                        )}
                        {hw.due_date && (
                          <Typography variant="caption" sx={{ color: isOverdue ? '#ef4444' : 'text.secondary', fontWeight: isOverdue ? 700 : 400 }}>
                            📅 Due: {dayjs(hw.due_date).format('DD MMM YYYY')}
                          </Typography>
                        )}
                        {hw.max_marks && (
                          <Typography variant="caption" color="text.secondary">
                            📝 Max: {hw.max_marks} marks
                          </Typography>
                        )}
                      </Stack>
                      {hw.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {hw.description}
                        </Typography>
                      )}
                      {hw.attachment_url && (
                        <Link href={hw.attachment_url} target="_blank" rel="noopener" sx={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <AttachFile fontSize="small" /> Attachment
                        </Link>
                      )}
                    </Box>

                    {/* Action / Grade Info */}
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      {(isPending || isOverdue) && (
                        <Button
                          variant="contained" size="small"
                          startIcon={<Send />}
                          onClick={() => handleOpenSubmit(hw)}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                          Submit
                        </Button>
                      )}
                      {isGraded && (
                        <Box>
                          {hw.marks_obtained != null && (
                            <Chip
                              label={`${hw.marks_obtained}/${hw.max_marks || '?'}`}
                              color="success" size="small"
                              sx={{ fontWeight: 700, mb: 0.5 }}
                            />
                          )}
                          {hw.grade && (
                            <Typography variant="caption" display="block" sx={{ color: '#10b981', fontWeight: 700 }}>
                              Grade: {hw.grade}
                            </Typography>
                          )}
                          {hw.teacher_remarks && (
                            <Tooltip title={hw.teacher_remarks}>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                💬 {hw.teacher_remarks}
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitDialog.open} onClose={() => setSubmitDialog({ open: false, hw: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Submit Homework</Typography>
          <IconButton onClick={() => setSubmitDialog({ open: false, hw: null })} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {submitDialog.hw && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>{submitDialog.hw.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {submitDialog.hw.subject_name} • Due: {submitDialog.hw.due_date ? dayjs(submitDialog.hw.due_date).format('DD MMM YYYY') : 'N/A'}
              </Typography>
            </Box>
          )}
          <TextField
            label="Your Answer / Submission Text"
            multiline rows={5} fullWidth
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Type your homework submission here..."
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined" component="label"
              startIcon={uploading ? null : <CloudUpload />}
              disabled={uploading}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
              <input type="file" hidden onChange={handleFileUpload} />
            </Button>
            {attachmentUrl && (
              <Chip
                label="File attached ✓"
                color="success" size="small" variant="outlined"
                onDelete={() => setAttachmentUrl('')}
              />
            )}
          </Box>
          {uploading && <LinearProgress sx={{ mt: 1, borderRadius: 2 }} />}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSubmitDialog({ open: false, hw: null })} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleSubmit}
            disabled={submitting || (!submissionText && !attachmentUrl)}
            startIcon={<Send />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
