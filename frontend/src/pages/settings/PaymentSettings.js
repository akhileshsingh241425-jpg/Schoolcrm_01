import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Switch, FormControlLabel,
  Alert, CircularProgress, Divider, Tabs, Tab, InputAdornment, IconButton, Chip
} from '@mui/material';
import {
  Save, Visibility, VisibilityOff, CreditCard, AccountBalance,
  CheckCircle, Settings
} from '@mui/icons-material';
import { paymentAPI } from '../../services/api';

export default function PaymentSettings() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [showSecrets, setShowSecrets] = useState({});

  const [settings, setSettings] = useState({
    pg_razorpay_key_id: '',
    pg_razorpay_key_secret: '',
    pg_razorpay_enabled: 'true',
    pg_paytm_merchant_id: '',
    pg_paytm_merchant_key: '',
    pg_paytm_website: 'DEFAULT',
    pg_paytm_industry_type: 'Education',
    pg_paytm_env: 'staging',
    pg_paytm_enabled: 'true',
    pg_default_gateway: 'razorpay',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await paymentAPI.getSettings();
      const data = res.data?.data || res.data;
      if (data && typeof data === 'object') {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch {
      // First time - no settings yet
    }
    setLoading(false);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await paymentAPI.saveSettings(settings);
      setMsg({ type: 'success', text: 'Payment gateway settings saved successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    }
    setSaving(false);
  };

  const toggleSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Settings color="primary" fontSize="large" />
        <Box>
          <Typography variant="h5" fontWeight={700}>Payment Gateway Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure Razorpay and Paytm for online fee collection
          </Typography>
        </Box>
      </Box>

      {msg.text && (
        <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg({ type: '', text: '' })}>
          {msg.text}
        </Alert>
      )}

      {/* Default Gateway */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Default Payment Gateway</Typography>
        <Grid container spacing={2}>
          {['razorpay', 'paytm'].map((gw) => (
            <Grid item xs={6} key={gw}>
              <Paper
                onClick={() => handleChange('pg_default_gateway', gw)}
                sx={{
                  p: 2, cursor: 'pointer', textAlign: 'center',
                  border: 2,
                  borderColor: settings.pg_default_gateway === gw ? 'primary.main' : 'grey.200',
                  bgcolor: settings.pg_default_gateway === gw ? 'primary.50' : 'background.paper',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                elevation={0}
              >
                {gw === 'razorpay' ? <CreditCard fontSize="large" color="primary" /> : <AccountBalance fontSize="large" color="primary" />}
                <Typography fontWeight={600} mt={1}>{gw === 'razorpay' ? 'Razorpay' : 'Paytm'}</Typography>
                {settings.pg_default_gateway === gw && (
                  <Chip label="Default" size="small" color="primary" sx={{ mt: 1 }} icon={<CheckCircle />} />
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Gateway Tabs */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<CreditCard />} iconPosition="start" label="Razorpay" />
          <Tab icon={<AccountBalance />} iconPosition="start" label="Paytm" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Razorpay Settings */}
          {tab === 0 && (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pg_razorpay_enabled === 'true'}
                    onChange={(e) => handleChange('pg_razorpay_enabled', e.target.checked ? 'true' : 'false')}
                  />
                }
                label="Enable Razorpay"
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Razorpay Key ID"
                    value={settings.pg_razorpay_key_id}
                    onChange={(e) => handleChange('pg_razorpay_key_id', e.target.value)}
                    placeholder="rzp_live_xxxxxxxxxxxxx"
                    helperText="Find this in Razorpay Dashboard → Settings → API Keys"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Razorpay Key Secret"
                    type={showSecrets.razorpay_secret ? 'text' : 'password'}
                    value={settings.pg_razorpay_key_secret}
                    onChange={(e) => handleChange('pg_razorpay_key_secret', e.target.value)}
                    placeholder="Enter key secret"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleSecret('razorpay_secret')}>
                            {showSecrets.razorpay_secret ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Steps to get Razorpay credentials:</strong><br />
                1. Login to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer">Razorpay Dashboard</a><br />
                2. Go to Settings → API Keys<br />
                3. Generate Key ID and Key Secret<br />
                4. For testing, use Test Mode keys
              </Typography>
            </Box>
          )}

          {/* Paytm Settings */}
          {tab === 1 && (
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pg_paytm_enabled === 'true'}
                    onChange={(e) => handleChange('pg_paytm_enabled', e.target.checked ? 'true' : 'false')}
                  />
                }
                label="Enable Paytm"
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Merchant ID (MID)"
                    value={settings.pg_paytm_merchant_id}
                    onChange={(e) => handleChange('pg_paytm_merchant_id', e.target.value)}
                    placeholder="YOUR_MID_HERE"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Merchant Key"
                    type={showSecrets.paytm_key ? 'text' : 'password'}
                    value={settings.pg_paytm_merchant_key}
                    onChange={(e) => handleChange('pg_paytm_merchant_key', e.target.value)}
                    placeholder="Enter merchant key"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleSecret('paytm_key')}>
                            {showSecrets.paytm_key ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Website"
                    value={settings.pg_paytm_website}
                    onChange={(e) => handleChange('pg_paytm_website', e.target.value)}
                    helperText="Usually DEFAULT or WEBSTAGING for test"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Industry Type"
                    value={settings.pg_paytm_industry_type}
                    onChange={(e) => handleChange('pg_paytm_industry_type', e.target.value)}
                    helperText="Usually 'Education' or 'Retail'"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth label="Environment" select
                    value={settings.pg_paytm_env}
                    onChange={(e) => handleChange('pg_paytm_env', e.target.value)}
                    SelectProps={{ native: true }}
                  >
                    <option value="staging">Staging (Test)</option>
                    <option value="production">Production (Live)</option>
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Steps to get Paytm credentials:</strong><br />
                1. Login to <a href="https://dashboard.paytm.com" target="_blank" rel="noreferrer">Paytm Business Dashboard</a><br />
                2. Go to Developer Settings<br />
                3. Copy Merchant ID and Merchant Key<br />
                4. For testing, use Staging credentials
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained" size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}
