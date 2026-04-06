import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Snackbar, Alert, TablePagination,
  Switch, FormControlLabel, Checkbox, FormGroup, Card, CardContent, CardActions,
  CircularProgress, Divider, IconButton, Tooltip
} from '@mui/material';
import { Add, Send, NotificationsActive, Email, WhatsApp, Schedule, School,
  PlayArrow, History, Settings, Phone, Chat, CheckCircle, Cancel } from '@mui/icons-material';
import { communicationAPI } from '../../services/api';

export default function Communication() {
  const [tab, setTab] = useState(0);
  const [announcements, setAnnouncements] = useState({ items: [], total: 0 });
  const [notifications, setNotifications] = useState({ items: [], total: 0 });
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const [openAnnouncement, setOpenAnnouncement] = useState(false);
  const [openSend, setOpenSend] = useState(false);
  const [openTemplate, setOpenTemplate] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', message: '', target_audience: 'all', priority: 'normal' });
  const [sendForm, setSendForm] = useState({ type: 'sms', recipients: '', subject: '', message: '' });
  const [templateForm, setTemplateForm] = useState({ name: '', content: '', category: '' });

  // Auto Alerts state
  const [alertSettings, setAlertSettings] = useState([]);
  const [notifLogs, setNotifLogs] = useState({ items: [], total: 0 });
  const [logPage, setLogPage] = useState(0);
  const [logFilter, setLogFilter] = useState('');
  const [triggering, setTriggering] = useState({});
  const [alertLoading, setAlertLoading] = useState(false);

  // WhatsApp & IVR state
  const [apiConfig, setApiConfig] = useState({});
  const [waForm, setWaForm] = useState({ phone: '', message: '' });
  const [ivrForm, setIvrForm] = useState({ phone: '' });
  const [waSending, setWaSending] = useState(false);
  const [ivrCalling, setIvrCalling] = useState(false);

  const ALERT_TYPES = [
    { key: 'late_arrival', label: 'Late Arrival Alert', icon: <Schedule />, desc: 'Alert parents if child has not reached school by cutoff time', configFields: [{ key: 'cutoff_time', label: 'Cutoff Time', type: 'time', default: '10:00' }] },
    { key: 'monthly_attendance', label: 'Monthly Attendance Report', icon: <School />, desc: 'Send monthly attendance summary to all parents', configFields: [{ key: 'send_day', label: 'Send on Day of Month', type: 'number', default: 1 }, { key: 'min_attendance_pct', label: 'Low Attendance Threshold (%)', type: 'number', default: 75 }] },
    { key: 'exam_schedule', label: 'Exam Schedule Notification', icon: <NotificationsActive />, desc: 'Notify parents when exam schedule is published', configFields: [{ key: 'days_before', label: 'Days Before Exam', type: 'number', default: 3 }] },
    { key: 'exam_result', label: 'Exam Results Notification', icon: <NotificationsActive />, desc: 'Notify parents when exam results are published', configFields: [] },
    { key: 'fee_reminder', label: 'Fee Reminder', icon: <NotificationsActive />, desc: 'Remind parents about pending fees', configFields: [{ key: 'days_before_due', label: 'Days Before Due Date', type: 'number', default: 7 }] },
    { key: 'low_attendance_warning', label: 'Low Attendance Warning', icon: <NotificationsActive />, desc: 'Warn parents when attendance drops below threshold', configFields: [{ key: 'threshold', label: 'Attendance Threshold (%)', type: 'number', default: 75 }] },
  ];

  useEffect(() => {
    if (tab === 0) communicationAPI.listAnnouncements({ page: page + 1, per_page: 20 }).then(res => setAnnouncements(res.data.data || { items: [], total: 0 })).catch(() => {});
    if (tab === 1) communicationAPI.listNotifications({ page: page + 1, per_page: 20 }).then(res => setNotifications(res.data.data || { items: [], total: 0 })).catch(() => {});
    if (tab === 2) communicationAPI.listTemplates().then(res => setTemplates(res.data.data || [])).catch(() => {});
    if (tab === 3) loadAlertData();
    if (tab === 4) communicationAPI.getApiConfig().then(res => setApiConfig(res.data?.data || {})).catch(() => {});
  }, [tab, page]);

  const loadAlertData = () => {
    setAlertLoading(true);
    Promise.all([
      communicationAPI.getAlertSettings().catch(() => ({ data: { data: [] } })),
      communicationAPI.getNotificationLogs({ page: logPage + 1, per_page: 20, alert_type: logFilter || undefined }).catch(() => ({ data: { data: { items: [], total: 0 } } })),
    ]).then(([settingsRes, logsRes]) => {
      setAlertSettings(settingsRes.data.data || []);
      setNotifLogs(logsRes.data.data || { items: [], total: 0 });
    }).finally(() => setAlertLoading(false));
  };

  useEffect(() => {
    if (tab === 3) {
      communicationAPI.getNotificationLogs({ page: logPage + 1, per_page: 20, alert_type: logFilter || undefined })
        .then(res => setNotifLogs(res.data.data || { items: [], total: 0 })).catch(() => {});
    }
  }, [logPage, logFilter]);

  const toggleAlert = (alertType, current) => {
    const existing = alertSettings.find(s => s.alert_type === alertType);
    communicationAPI.saveAlertSetting({
      alert_type: alertType,
      is_enabled: !current,
      channels: existing?.channels || ['email'],
      config: existing?.config || {},
    }).then(() => { setSnack({ open: true, message: 'Alert setting updated', severity: 'success' }); loadAlertData(); })
      .catch(() => setSnack({ open: true, message: 'Failed to update', severity: 'error' }));
  };

  const toggleChannel = (alertType, channel) => {
    const existing = alertSettings.find(s => s.alert_type === alertType);
    const channels = existing?.channels || ['email'];
    const updated = channels.includes(channel) ? channels.filter(c => c !== channel) : [...channels, channel];
    if (updated.length === 0) return;
    communicationAPI.saveAlertSetting({
      alert_type: alertType,
      is_enabled: existing?.is_enabled ?? true,
      channels: updated,
      config: existing?.config || {},
    }).then(() => loadAlertData())
      .catch(() => setSnack({ open: true, message: 'Failed to update channel', severity: 'error' }));
  };

  const updateConfig = (alertType, configKey, value) => {
    const existing = alertSettings.find(s => s.alert_type === alertType);
    const config = { ...(existing?.config || {}), [configKey]: value };
    communicationAPI.saveAlertSetting({
      alert_type: alertType,
      is_enabled: existing?.is_enabled ?? true,
      channels: existing?.channels || ['email'],
      config,
    }).then(() => loadAlertData())
      .catch(() => setSnack({ open: true, message: 'Failed to update config', severity: 'error' }));
  };

  const triggerAlert = (type) => {
    setTriggering(prev => ({ ...prev, [type]: true }));
    let promise;
    if (type === 'late_arrival') {
      promise = communicationAPI.triggerLateArrival({});
    } else if (type === 'monthly_attendance') {
      const now = new Date();
      promise = communicationAPI.triggerMonthlyAttendance({ month: now.getMonth() + 1, year: now.getFullYear() });
    } else {
      setTriggering(prev => ({ ...prev, [type]: false }));
      setSnack({ open: true, message: 'Use exam page to trigger exam notifications', severity: 'info' });
      return;
    }
    promise.then(res => {
      const d = res.data;
      setSnack({ open: true, message: d.message || 'Alerts sent!', severity: 'success' });
      loadAlertData();
    }).catch(err => {
      setSnack({ open: true, message: err.response?.data?.message || 'Failed to trigger', severity: 'error' });
    }).finally(() => setTriggering(prev => ({ ...prev, [type]: false })));
  };

  const createAnnouncement = () => {
    communicationAPI.createAnnouncement(annForm).then(() => {
      setSnack({ open: true, message: 'Announcement created', severity: 'success' });
      setOpenAnnouncement(false); setAnnForm({ title: '', message: '', target_audience: 'all', priority: 'normal' });
      communicationAPI.listAnnouncements({ page: 1, per_page: 20 }).then(res => setAnnouncements(res.data.data || { items: [], total: 0 }));
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  const sendMessage = () => {
    communicationAPI.send(sendForm).then(() => {
      setSnack({ open: true, message: 'Message sent!', severity: 'success' });
      setOpenSend(false); setSendForm({ type: 'sms', recipients: '', subject: '', message: '' });
    }).catch(() => setSnack({ open: true, message: 'Failed to send', severity: 'error' }));
  };

  const createTemplate = () => {
    communicationAPI.createTemplate(templateForm).then(() => {
      setSnack({ open: true, message: 'Template created', severity: 'success' });
      setOpenTemplate(false); setTemplateForm({ name: '', content: '', category: '' });
      communicationAPI.listTemplates().then(res => setTemplates(res.data.data || []));
    }).catch(() => setSnack({ open: true, message: 'Failed', severity: 'error' }));
  };

  const priorityColors = { low: 'default', normal: 'info', high: 'warning', urgent: 'error' };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h5">Communication</Typography>
        <Button variant="contained" color="secondary" startIcon={<Send />} onClick={() => setOpenSend(true)} size="small">Send Message</Button>
      </Box>

      <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(0); }} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Announcements" />
        <Tab label="Notifications" />
        <Tab label="SMS Templates" />
        <Tab label="Auto Alerts" icon={<NotificationsActive />} iconPosition="start" />
        <Tab label="WhatsApp & IVR" icon={<WhatsApp />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenAnnouncement(true)}>New Announcement</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Audience</TableCell><TableCell>Priority</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {announcements.items?.map(a => (
                  <TableRow key={a.id}><TableCell><strong>{a.title}</strong><br /><Typography variant="caption" color="text.secondary">{a.message?.substring(0, 100)}</Typography></TableCell>
                    <TableCell><Chip label={a.target_audience || 'all'} size="small" /></TableCell>
                    <TableCell><Chip label={a.priority || 'normal'} size="small" color={priorityColors[a.priority] || 'default'} /></TableCell>
                    <TableCell>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {announcements.items?.length === 0 && <TableRow><TableCell colSpan={4} align="center">No announcements</TableCell></TableRow>}
              </TableBody>
            </Table>
            <TablePagination component="div" count={announcements.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Message</TableCell><TableCell>Read</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
            <TableBody>
              {notifications.items?.map(n => (
                <TableRow key={n.id}><TableCell><strong>{n.title}</strong></TableCell><TableCell>{n.message?.substring(0, 80)}</TableCell>
                  <TableCell><Chip label={n.is_read ? 'Read' : 'Unread'} size="small" color={n.is_read ? 'default' : 'primary'} /></TableCell>
                  <TableCell>{n.created_at ? new Date(n.created_at).toLocaleDateString() : '-'}</TableCell>
                </TableRow>
              ))}
              {notifications.items?.length === 0 && <TableRow><TableCell colSpan={4} align="center">No notifications</TableCell></TableRow>}
            </TableBody>
          </Table>
          <TablePagination component="div" count={notifications.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
        </TableContainer>
      )}

      {tab === 2 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenTemplate(true)}>Add Template</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Content</TableCell></TableRow></TableHead>
              <TableBody>
                {templates.map(t => <TableRow key={t.id}><TableCell><strong>{t.name}</strong></TableCell><TableCell>{t.category || '-'}</TableCell><TableCell>{t.content?.substring(0, 100)}...</TableCell></TableRow>)}
                {templates.length === 0 && <TableRow><TableCell colSpan={3} align="center">No templates</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ── Auto Alerts Tab ────────────────────────────────── */}
      {tab === 3 && (
        <Box>
          {alertLoading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings fontSize="small" /> Alert Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Configure automatic notifications sent to parents via Email & WhatsApp
              </Typography>

              <Grid container spacing={2} mb={4}>
                {ALERT_TYPES.map(at => {
                  const setting = alertSettings.find(s => s.alert_type === at.key);
                  const isEnabled = setting?.is_enabled ?? false;
                  const channels = setting?.channels || ['email'];
                  const config = setting?.config || {};
                  return (
                    <Grid item xs={12} md={6} key={at.key}>
                      <Card variant="outlined" sx={{ opacity: isEnabled ? 1 : 0.6, transition: '0.3s' }}>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={1}>
                              {at.icon}
                              <Typography variant="subtitle1" fontWeight={600}>{at.label}</Typography>
                            </Box>
                            <Switch checked={isEnabled} onChange={() => toggleAlert(at.key, isEnabled)} color="primary" />
                          </Box>
                          <Typography variant="body2" color="text.secondary" mt={0.5}>{at.desc}</Typography>
                          <Divider sx={{ my: 1.5 }} />
                          <Box display="flex" gap={2} alignItems="center" mb={1}>
                            <Typography variant="caption" fontWeight={600}>Channels:</Typography>
                            <FormGroup row>
                              <FormControlLabel control={<Checkbox size="small" checked={channels.includes('email')} onChange={() => toggleChannel(at.key, 'email')} />} label={<Box display="flex" alignItems="center" gap={0.5}><Email fontSize="small" /> Email</Box>} />
                              <FormControlLabel control={<Checkbox size="small" checked={channels.includes('whatsapp')} onChange={() => toggleChannel(at.key, 'whatsapp')} />} label={<Box display="flex" alignItems="center" gap={0.5}><WhatsApp fontSize="small" /> WhatsApp</Box>} />
                            </FormGroup>
                          </Box>
                          {at.configFields.map(cf => (
                            <TextField
                              key={cf.key} size="small" label={cf.label}
                              type={cf.type} value={config[cf.key] ?? cf.default}
                              onChange={(e) => updateConfig(at.key, cf.key, cf.type === 'number' ? Number(e.target.value) : e.target.value)}
                              sx={{ mr: 1, mt: 1, width: cf.type === 'time' ? 150 : 200 }}
                              InputLabelProps={{ shrink: true }}
                            />
                          ))}
                        </CardContent>
                        {(at.key === 'late_arrival' || at.key === 'monthly_attendance') && (
                          <CardActions>
                            <Button size="small" variant="outlined" startIcon={triggering[at.key] ? <CircularProgress size={16} /> : <PlayArrow />}
                              disabled={!isEnabled || triggering[at.key]}
                              onClick={() => triggerAlert(at.key)}>
                              {at.key === 'late_arrival' ? 'Send Late Arrival Alerts Now' : 'Send Monthly Report Now'}
                            </Button>
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History fontSize="small" /> Notification Log
              </Typography>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <InputLabel>Filter by Type</InputLabel>
                  <Select value={logFilter} label="Filter by Type" onChange={(e) => { setLogFilter(e.target.value); setLogPage(0); }}>
                    <MenuItem value="">All</MenuItem>
                    {ALERT_TYPES.map(at => <MenuItem key={at.key} value={at.key}>{at.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Channel</TableCell>
                      <TableCell>Recipient</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(notifLogs.items || []).map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}</TableCell>
                        <TableCell><Chip label={log.alert_type?.replace(/_/g, ' ')} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          <Chip icon={log.channel === 'email' ? <Email fontSize="small" /> : <WhatsApp fontSize="small" />}
                            label={log.channel} size="small" color={log.channel === 'email' ? 'primary' : 'success'} />
                        </TableCell>
                        <TableCell>{log.recipient_name}<br /><Typography variant="caption" color="text.secondary">{log.recipient_contact}</Typography></TableCell>
                        <TableCell>{log.subject?.substring(0, 50)}</TableCell>
                        <TableCell>
                          <Chip label={log.status} size="small"
                            color={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!notifLogs.items || notifLogs.items.length === 0) && (
                      <TableRow><TableCell colSpan={6} align="center">No notification logs yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination component="div" count={notifLogs.total || 0} page={logPage}
                  onPageChange={(e, p) => setLogPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
              </TableContainer>
            </>
          )}
        </Box>
      )}

      {/* WhatsApp & IVR Tab */}
      {tab === 4 && (
        <Box>
          {/* API Status Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <WhatsApp sx={{ color: '#25D366', fontSize: 28 }} />
                    <Typography variant="subtitle1" fontWeight={700}>SensiBOT WhatsApp</Typography>
                  </Box>
                  <Chip icon={apiConfig.whatsapp_configured ? <CheckCircle /> : <Cancel />}
                    label={apiConfig.whatsapp_configured ? 'Configured' : 'Not Configured'}
                    color={apiConfig.whatsapp_configured ? 'success' : 'default'} size="small" />
                  <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                    Set SENSIBOT_API_TOKEN in .env
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Phone sx={{ color: '#1976d2', fontSize: 28 }} />
                    <Typography variant="subtitle1" fontWeight={700}>IVR Click-to-Call</Typography>
                  </Box>
                  <Chip icon={apiConfig.ivr_configured ? <CheckCircle /> : <Cancel />}
                    label={apiConfig.ivr_configured ? 'Configured' : 'Not Configured'}
                    color={apiConfig.ivr_configured ? 'success' : 'default'} size="small" />
                  <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                    Set IVR_API_TOKEN, IVR_DID_NO, IVR_EXT_NO in .env
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Email sx={{ color: '#ea4335', fontSize: 28 }} />
                    <Typography variant="subtitle1" fontWeight={700}>Email (SMTP)</Typography>
                  </Box>
                  <Chip icon={apiConfig.email_configured ? <CheckCircle /> : <Cancel />}
                    label={apiConfig.email_configured ? 'Configured' : 'Not Configured'}
                    color={apiConfig.email_configured ? 'success' : 'default'} size="small" />
                  <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                    Set MAIL_USERNAME & MAIL_PASSWORD in .env
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Send WhatsApp */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <WhatsApp sx={{ color: '#25D366' }} />
                    <Typography variant="subtitle1" fontWeight={700}>Send WhatsApp Message</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Phone Number (with country code)" placeholder="+91 98765 43210"
                        value={waForm.phone} onChange={e => setWaForm({ ...waForm, phone: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" multiline rows={3} label="Message"
                        value={waForm.message} onChange={e => setWaForm({ ...waForm, message: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="contained" fullWidth
                        disabled={waSending || !waForm.phone || !waForm.message}
                        onClick={() => {
                          setWaSending(true);
                          communicationAPI.sendWhatsApp(waForm)
                            .then(() => {
                              setSnack({ open: true, message: 'WhatsApp message sent!', severity: 'success' });
                              setWaForm({ phone: '', message: '' });
                            })
                            .catch(err => setSnack({ open: true, message: err.response?.data?.message || 'Failed to send', severity: 'error' }))
                            .finally(() => setWaSending(false));
                        }}
                        sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        startIcon={<Send />}
                      >{waSending ? 'Sending...' : 'Send WhatsApp'}</Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick IVR Call */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Phone sx={{ color: '#1976d2' }} />
                    <Typography variant="subtitle1" fontWeight={700}>Click-to-Call (IVR)</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Phone Number" placeholder="98765 43210"
                        value={ivrForm.phone} onChange={e => setIvrForm({ ...ivrForm, phone: e.target.value })} />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        This will initiate a call between your office extension and the given phone number via IVR Solutions.
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="contained" fullWidth
                        disabled={ivrCalling || !ivrForm.phone}
                        onClick={() => {
                          setIvrCalling(true);
                          communicationAPI.initiateCall(ivrForm)
                            .then(() => { setSnack({ open: true, message: 'Call initiated!', severity: 'success' }); setIvrForm({ phone: '' }); })
                            .catch(err => setSnack({ open: true, message: err.response?.data?.message || 'Failed to call', severity: 'error' }))
                            .finally(() => setIvrCalling(false));
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        startIcon={<Phone />}
                      >{ivrCalling ? 'Calling...' : 'Initiate Call'}</Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Environment Config Help */}
          <Card variant="outlined" sx={{ mt: 3, borderRadius: 3, bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom><Settings sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} /> API Configuration (.env file)</Typography>
              <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
{`# SensiBOT WhatsApp API
SENSIBOT_API_TOKEN=your_sensibot_api_token

# IVR Solutions Click-to-Call
IVR_API_TOKEN=your_ivr_api_token
IVR_DID_NO=your_did_number
IVR_EXT_NO=your_extension_number

# Email SMTP
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password`}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Announcement Dialog */}
      <Dialog open={openAnnouncement} onClose={() => setOpenAnnouncement(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Announcement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Audience</InputLabel>
                <Select value={annForm.target_audience} label="Audience" onChange={(e) => setAnnForm({ ...annForm, target_audience: e.target.value })}>
                  <MenuItem value="all">All</MenuItem><MenuItem value="students">Students</MenuItem><MenuItem value="staff">Staff</MenuItem><MenuItem value="parents">Parents</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Priority</InputLabel>
                <Select value={annForm.priority} label="Priority" onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}>
                  <MenuItem value="low">Low</MenuItem><MenuItem value="normal">Normal</MenuItem><MenuItem value="high">High</MenuItem><MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Message" value={annForm.message} onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenAnnouncement(false)}>Cancel</Button><Button variant="contained" onClick={createAnnouncement}>Create</Button></DialogActions>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={openSend} onClose={() => setOpenSend(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={sendForm.type} label="Type" onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}>
                  <MenuItem value="sms">SMS</MenuItem><MenuItem value="email">Email</MenuItem><MenuItem value="whatsapp">WhatsApp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Recipients (comma separated)" value={sendForm.recipients} onChange={(e) => setSendForm({ ...sendForm, recipients: e.target.value })} /></Grid>
            {sendForm.type === 'email' && <Grid item xs={12}><TextField fullWidth label="Subject" value={sendForm.subject} onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })} /></Grid>}
            <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Message" value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenSend(false)}>Cancel</Button><Button variant="contained" onClick={sendMessage}>Send</Button></DialogActions>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={openTemplate} onClose={() => setOpenTemplate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add SMS Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Category" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Content" value={templateForm.content} onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })} helperText="Use {name}, {school}, {amount} as placeholders" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenTemplate(false)}>Cancel</Button><Button variant="contained" onClick={createTemplate}>Create</Button></DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}><Alert severity={snack.severity}>{snack.message}</Alert></Snackbar>
    </Box>
  );
}
