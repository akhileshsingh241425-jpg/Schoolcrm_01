import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, Alert,
  CircularProgress, Avatar, alpha, useTheme
} from '@mui/material';
import { CloudUpload, Palette, School, Image } from '@mui/icons-material';
import { brandingAPI, schoolsAPI } from '../../services/api';

export default function SchoolBranding() {
  const theme = useTheme();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ tagline: '', theme_color: '#1976d2' });

  const logoRef = useRef();
  const bgRef = useRef();
  const bannerRef = useRef();

  useEffect(() => {
    schoolsAPI.getMySchool().then(res => {
      const s = res.data.data;
      setSchool(s);
      setForm({ tagline: s.tagline || '', theme_color: s.theme_color || '#1976d2' });
    }).catch(() => setError('Failed to load school info'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveBranding = async () => {
    setSaving(true);
    setSuccess(''); setError('');
    try {
      const res = await brandingAPI.updateBranding(form);
      setSchool(res.data.data);
      setSuccess('Branding updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleUpload = async (type, file) => {
    if (!file) return;
    setUploading(type); setSuccess(''); setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    try {
      const res = await brandingAPI.uploadImage(formData);
      const url = res.data.data.url;
      setSchool(prev => ({
        ...prev,
        ...(type === 'logo' ? { logo_url: url } : type === 'login_bg' ? { login_bg_image: url } : { banner_image: url })
      }));
      setSuccess(`${type.replace('_', ' ')} uploaded successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
    setUploading('');
  };

  if (loading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
        School Branding
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Logo Upload */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', p: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>School Logo</Typography>
              <Avatar
                src={school?.logo_url}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
              >
                <School sx={{ fontSize: 60, color: theme.palette.primary.main }} />
              </Avatar>
              <input ref={logoRef} type="file" accept="image/*" hidden
                onChange={e => handleUpload('logo', e.target.files[0])} />
              <Button variant="outlined" startIcon={uploading === 'logo' ? <CircularProgress size={16} /> : <CloudUpload />}
                onClick={() => logoRef.current.click()} disabled={!!uploading}>
                Upload Logo
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                Recommended: 200x200px, PNG/JPG
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Login Background */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', p: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Login Page Background</Typography>
              <Box sx={{
                width: '100%', height: 150, borderRadius: 2, mb: 2, mx: 'auto',
                bgcolor: '#e5e7eb', overflow: 'hidden',
                backgroundImage: school?.login_bg_image ? `url(${school.login_bg_image})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!school?.login_bg_image && <Image sx={{ fontSize: 48, color: '#9ca3af' }} />}
              </Box>
              <input ref={bgRef} type="file" accept="image/*" hidden
                onChange={e => handleUpload('login_bg', e.target.files[0])} />
              <Button variant="outlined" startIcon={uploading === 'login_bg' ? <CircularProgress size={16} /> : <CloudUpload />}
                onClick={() => bgRef.current.click()} disabled={!!uploading}>
                Upload Background
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                This image will show on your school's login page
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Banner Image */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', p: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Banner Image</Typography>
              <Box sx={{
                width: '100%', height: 150, borderRadius: 2, mb: 2, mx: 'auto',
                bgcolor: '#e5e7eb', overflow: 'hidden',
                backgroundImage: school?.banner_image ? `url(${school.banner_image})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {!school?.banner_image && <Image sx={{ fontSize: 48, color: '#9ca3af' }} />}
              </Box>
              <input ref={bannerRef} type="file" accept="image/*" hidden
                onChange={e => handleUpload('banner', e.target.files[0])} />
              <Button variant="outlined" startIcon={uploading === 'banner' ? <CircularProgress size={16} /> : <CloudUpload />}
                onClick={() => bannerRef.current.click()} disabled={!!uploading}>
                Upload Banner
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                Used as dashboard banner
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Theme & Tagline */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, p: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Theme & Tagline</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="School Tagline" placeholder="e.g., Shaping Future Leaders"
                    value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label="Theme Color" type="color"
                    value={form.theme_color} onChange={e => setForm({ ...form, theme_color: e.target.value })}
                    InputProps={{ sx: { height: 56 } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button variant="contained" fullWidth size="large" onClick={handleSaveBranding}
                    disabled={saving} sx={{ height: 56 }}>
                    {saving ? <CircularProgress size={24} /> : 'Save Branding'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
              <Typography variant="h6" fontWeight={600} p={3} pb={1}>Login Page Preview</Typography>
              <Box sx={{
                height: 300, display: 'flex',
                background: school?.login_bg_image
                  ? `linear-gradient(rgba(0,0,0,0.5),rgba(0,0,0,0.5)), url(${school.login_bg_image})`
                  : 'linear-gradient(135deg, #0f172a, #1e293b)',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 6, color: '#fff' }}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    {school?.logo_url ? (
                      <img src={school.logo_url} alt="Logo" style={{ width: 48, height: 48, borderRadius: 8 }} />
                    ) : (
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: form.theme_color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <School sx={{ color: '#fff' }} />
                      </Box>
                    )}
                    <Typography variant="h5" fontWeight={700}>{school?.name}</Typography>
                  </Box>
                  {form.tagline && <Typography variant="h6" sx={{ opacity: 0.8 }}>{form.tagline}</Typography>}
                </Box>
                <Box sx={{ width: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 4 }}>
                  <Box sx={{ width: '100%', bgcolor: '#fff', borderRadius: 3, p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600} color="text.primary">Sign In</Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>Your login form appears here</Typography>
                    <Box sx={{ height: 36, bgcolor: '#f3f4f6', borderRadius: 1, mb: 1.5 }} />
                    <Box sx={{ height: 36, bgcolor: '#f3f4f6', borderRadius: 1, mb: 1.5 }} />
                    <Box sx={{ height: 36, bgcolor: form.theme_color, borderRadius: 1, opacity: 0.8 }} />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
