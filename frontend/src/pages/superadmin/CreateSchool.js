import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Alert, CircularProgress, Switch, FormControlLabel, Divider,
  Chip, Stack, InputAdornment
} from '@mui/material';
import {
  School, Save, ArrowBack, Person, Email, Phone,
  LocationOn, Language, Business
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { superAdminAPI } from '../../services/api';

const FEATURES_LIST = [
  { key: 'student_management', label: 'Student Management' },
  { key: 'staff_management', label: 'Staff Management' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'fee_management', label: 'Fee Management' },
  { key: 'academic', label: 'Academics' },
  { key: 'library', label: 'Library' },
  { key: 'transport', label: 'Transport' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'canteen', label: 'Canteen' },
  { key: 'health_safety', label: 'Health & Safety' },
  { key: 'sports', label: 'Sports' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'communication', label: 'Communication' },
  { key: 'reports', label: 'Reports' },
  { key: 'marketing_crm', label: 'Leads / CRM' },
  { key: 'admission', label: 'Admissions' },
  { key: 'parent_engagement', label: 'Parent Portal' },
];

const DEFAULT_FEATURES = [
  'student_management', 'staff_management', 'attendance', 'fee_management', 'academic', 'reports'
];

export default function CreateSchool() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    website: '',
    principal_name: '',
    principal_email: '',
    principal_phone: '',
    board: 'CBSE',
    school_type: 'co-ed',
    established_year: '',
    registration_number: '',
  });
  const [features, setFeatures] = useState(new Set(DEFAULT_FEATURES));
  const [adminForm, setAdminForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const handleAdminChange = (key, value) => setAdminForm(prev => ({ ...prev, [key]: value }));
  const toggleFeature = (key) => {
    setFeatures(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError('School name and email are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        features: Array.from(features),
        admin: adminForm.email ? adminForm : undefined,
      };
      await superAdminAPI.createSchool(payload);
      setSuccess('School created successfully!');
      setTimeout(() => navigate('/super-admin/schools'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/super-admin/schools')} sx={{ color: 'text.secondary' }}>
          Back
        </Button>
        <Box display="flex" alignItems="center" gap={1.5}>
          <School sx={{ color: '#6366f1', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Create New School</Typography>
            <Typography variant="body2" color="text.secondary">Register a new school on the platform</Typography>
          </Box>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* School Info */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <Business fontSize="small" color="primary" /> School Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="School Name" value={form.name}
                    onChange={e => handleChange('name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="School Email" type="email" value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" value={form.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" multiline rows={2} value={form.address}
                    onChange={e => handleChange('address', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="City" value={form.city}
                    onChange={e => handleChange('city', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="State" value={form.state}
                    onChange={e => handleChange('state', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="Pincode" value={form.pincode}
                    onChange={e => handleChange('pincode', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Website" value={form.website}
                    onChange={e => handleChange('website', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Language fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Registration Number" value={form.registration_number}
                    onChange={e => handleChange('registration_number', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="Board" value={form.board}
                    onChange={e => handleChange('board', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="School Type" value={form.school_type}
                    onChange={e => handleChange('school_type', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="Est. Year" type="number" value={form.established_year}
                    onChange={e => handleChange('established_year', e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Principal Info */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <Person fontSize="small" color="primary" /> Principal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Principal Name" value={form.principal_name}
                    onChange={e => handleChange('principal_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Principal Email" type="email" value={form.principal_email}
                    onChange={e => handleChange('principal_email', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Principal Phone" value={form.principal_phone}
                    onChange={e => handleChange('principal_phone', e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Admin Account */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={0.5} display="flex" alignItems="center" gap={1}>
                <Person fontSize="small" color="secondary" /> Create School Admin Account
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Optional - create login credentials for the school admin
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Admin First Name" value={adminForm.first_name}
                    onChange={e => handleAdminChange('first_name', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Admin Last Name" value={adminForm.last_name}
                    onChange={e => handleAdminChange('last_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Admin Email" type="email" value={adminForm.email}
                    onChange={e => handleAdminChange('email', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Admin Password" type="password" value={adminForm.password}
                    onChange={e => handleAdminChange('password', e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Panel */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, position: { lg: 'sticky' }, top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={0.5}>Module Features</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enable features for this school
              </Typography>
              <Stack spacing={0.5}>
                {FEATURES_LIST.map(f => (
                  <FormControlLabel key={f.key}
                    control={<Switch size="small" checked={features.has(f.key)} onChange={() => toggleFeature(f.key)} color="primary" />}
                    label={<Typography variant="body2">{f.label}</Typography>}
                    sx={{ m: 0, px: 1, py: 0.25, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  />
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                {features.size} of {FEATURES_LIST.length} modules enabled
              </Typography>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            fullWidth variant="contained" size="large"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSubmit} disabled={saving}
            sx={{ mt: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1.5, borderRadius: 2 }}
          >
            {saving ? 'Creating School...' : 'Create School'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
