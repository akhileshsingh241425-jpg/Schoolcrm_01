import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Switch, FormControlLabel,
  TextField, Button, Divider, Alert, CircularProgress, Chip, Accordion,
  AccordionSummary, AccordionDetails, InputAdornment, Stack
} from '@mui/material';
import {
  Settings, ExpandMore, Save, Email, Sms, Business,
  Security, Notifications, DataUsage, CloudQueue
} from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

const Section = ({ icon, title, color = '#6366f1', children }) => (
  <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', mb: 2, '&:before': { display: 'none' } }}>
    <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 2 }}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
        <Typography fontWeight={600}>{title}</Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails sx={{ pt: 0 }}>
      <Divider sx={{ mb: 2 }} />
      {children}
    </AccordionDetails>
  </Accordion>
);

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    // App Info
    app_name: 'School CRM',
    app_url: 'http://localhost:3000',
    support_email: 'support@schoolcrm.com',
    support_phone: '',
    // Email
    email_enabled: true,
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_name: 'School CRM',
    // SMS
    sms_enabled: false,
    sms_provider: 'twilio',
    sms_api_key: '',
    sms_sender_id: '',
    // Security
    max_login_attempts: '5',
    session_timeout_minutes: '480',
    require_2fa: false,
    password_min_length: '8',
    // Notifications
    notify_on_new_school: true,
    notify_on_subscription_expire: true,
    notify_email: 'admin@schoolcrm.com',
    // Storage
    max_upload_size_mb: '10',
    allowed_file_types: 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx',
  });

  useEffect(() => {
    superAdminAPI.getSystemSettings()
      .then(res => {
        if (res.data.data) setSettings(prev => ({ ...prev, ...res.data.data }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    setSaving(true);
    setError('');
    superAdminAPI.saveSystemSettings(settings)
      .then(() => setSuccess('Settings saved successfully!'))
      .catch(() => setError('Failed to save settings'))
      .finally(() => setSaving(false));
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Settings sx={{ color: '#6366f1', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>System Settings</Typography>
            <Typography variant="body2" color="text.secondary">Global configuration for the entire platform</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSave} disabled={saving}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
          Save All Settings
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* App Info */}
      <Section icon={<Business />} title="Application Info">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="App Name" value={settings.app_name}
              onChange={e => handleChange('app_name', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="App URL" value={settings.app_url}
              onChange={e => handleChange('app_url', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Support Email" type="email" value={settings.support_email}
              onChange={e => handleChange('support_email', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Support Phone" value={settings.support_phone}
              onChange={e => handleChange('support_phone', e.target.value)} />
          </Grid>
        </Grid>
      </Section>

      {/* Email Settings */}
      <Section icon={<Email />} title="Email (SMTP) Settings" color="#3b82f6">
        <Stack spacing={2}>
          <FormControlLabel
            control={<Switch checked={settings.email_enabled} onChange={e => handleChange('email_enabled', e.target.checked)} color="primary" />}
            label="Enable Email Notifications"
          />
          {settings.email_enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="SMTP Host" value={settings.smtp_host}
                  onChange={e => handleChange('smtp_host', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="SMTP Port" value={settings.smtp_port}
                  onChange={e => handleChange('smtp_port', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="SMTP Username" value={settings.smtp_user}
                  onChange={e => handleChange('smtp_user', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="SMTP Password" type="password" value={settings.smtp_password}
                  onChange={e => handleChange('smtp_password', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="From Name" value={settings.smtp_from_name}
                  onChange={e => handleChange('smtp_from_name', e.target.value)} />
              </Grid>
            </Grid>
          )}
        </Stack>
      </Section>

      {/* SMS Settings */}
      <Section icon={<Sms />} title="SMS Settings" color="#10b981">
        <Stack spacing={2}>
          <FormControlLabel
            control={<Switch checked={settings.sms_enabled} onChange={e => handleChange('sms_enabled', e.target.checked)} color="success" />}
            label="Enable SMS Notifications"
          />
          {settings.sms_enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="SMS Provider" value={settings.sms_provider}
                  onChange={e => handleChange('sms_provider', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="API Key" value={settings.sms_api_key}
                  onChange={e => handleChange('sms_api_key', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Sender ID" value={settings.sms_sender_id}
                  onChange={e => handleChange('sms_sender_id', e.target.value)} />
              </Grid>
            </Grid>
          )}
        </Stack>
      </Section>

      {/* Security */}
      <Section icon={<Security />} title="Security Settings" color="#ef4444">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Max Login Attempts" type="number" value={settings.max_login_attempts}
              onChange={e => handleChange('max_login_attempts', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Session Timeout (min)" type="number" value={settings.session_timeout_minutes}
              onChange={e => handleChange('session_timeout_minutes', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField fullWidth label="Min Password Length" type="number" value={settings.password_min_length}
              onChange={e => handleChange('password_min_length', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
            <FormControlLabel
              control={<Switch checked={settings.require_2fa} onChange={e => handleChange('require_2fa', e.target.checked)} color="error" />}
              label="Require 2FA"
            />
          </Grid>
        </Grid>
      </Section>

      {/* Notifications */}
      <Section icon={<Notifications />} title="Admin Notifications" color="#f59e0b">
        <Stack spacing={2}>
          <FormControlLabel
            control={<Switch checked={settings.notify_on_new_school} onChange={e => handleChange('notify_on_new_school', e.target.checked)} />}
            label="Notify when a new school registers"
          />
          <FormControlLabel
            control={<Switch checked={settings.notify_on_subscription_expire} onChange={e => handleChange('notify_on_subscription_expire', e.target.checked)} />}
            label="Notify when a subscription is about to expire"
          />
          <TextField fullWidth label="Admin Notification Email" value={settings.notify_email}
            onChange={e => handleChange('notify_email', e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }}
          />
        </Stack>
      </Section>

      {/* Storage */}
      <Section icon={<CloudQueue />} title="File & Storage Settings" color="#8b5cf6">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Max Upload Size (MB)" type="number" value={settings.max_upload_size_mb}
              onChange={e => handleChange('max_upload_size_mb', e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position="end">MB</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Allowed File Types" value={settings.allowed_file_types}
              onChange={e => handleChange('allowed_file_types', e.target.value)}
              helperText="Comma-separated extensions (jpg,pdf,docx...)" />
          </Grid>
        </Grid>
      </Section>

      {/* Save Button bottom */}
      <Box display="flex" justifyContent="flex-end" mt={1}>
        <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSave} disabled={saving}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, px: 4 }}>
          Save All Settings
        </Button>
      </Box>
    </Box>
  );
}
