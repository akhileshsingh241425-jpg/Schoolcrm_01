import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress, Grid, InputAdornment, alpha, useTheme
} from '@mui/material';
import { School, Business, Email, Lock, Person, Phone, LocationCity } from '@mui/icons-material';
import useAuthStore from '../../store/authStore';

export default function Register() {
  const [form, setForm] = useState({
    school_name: '', school_code: '', school_email: '', school_phone: '',
    city: '', state: '',
    admin_email: '', admin_password: '', admin_first_name: '', admin_last_name: '', admin_phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      py: 4, px: 2,
    }}>
      <Box sx={{
        width: '100%', maxWidth: 720, bgcolor: '#fff', borderRadius: 4, p: { xs: 3, sm: 5 },
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, justifyContent: 'center' }}>
          <Box sx={{
            width: 46, height: 46, borderRadius: 2.5,
            background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 20px ${alpha(PRIMARY, 0.35)}`,
          }}>
            <School sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Typography variant="h5" fontWeight={800}>Register Your School</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          Create your school's CRM account to get started
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>School Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Name" required value={form.school_name} onChange={handleChange('school_name')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Business sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Code" required value={form.school_code} onChange={handleChange('school_code')} helperText="Unique code for login" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Email" type="email" value={form.school_email} onChange={handleChange('school_email')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Phone" value={form.school_phone} onChange={handleChange('school_phone')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="City" value={form.city} onChange={handleChange('city')}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationCity sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="State" value={form.state} onChange={handleChange('state')} />
            </Grid>
          </Grid>

          <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mt: 3, mb: 1 }}>Admin Account</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" required value={form.admin_first_name} onChange={handleChange('admin_first_name')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" value={form.admin_last_name} onChange={handleChange('admin_last_name')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Admin Email" type="email" required value={form.admin_email} onChange={handleChange('admin_email')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={form.admin_phone} onChange={handleChange('admin_phone')}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" type="password" required value={form.admin_password} onChange={handleChange('admin_password')} helperText="Minimum 8 characters"
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment> }} />
            </Grid>
          </Grid>

          <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
            sx={{
              mt: 3, py: 1.5, fontSize: '0.95rem',
              background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              '&:hover': { background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark || SECONDARY})` },
            }}>
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Register School'}
          </Button>
        </form>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Already registered?{' '}
            <Link to="/login" style={{ color: PRIMARY, fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
