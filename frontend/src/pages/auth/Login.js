import React, { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress, InputAdornment,
  alpha, Fade, Grow, Divider, Chip
} from '@mui/material';
import { Email, Lock, School, Visibility, VisibilityOff, ArrowForward, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { brandingAPI } from '../../services/api';

const LOGIN_BG = '/assets/images/login-bg.jpg';
const LOGO_CRM = '/assets/images/logo-crm.svg';
const STUDENTS_IMG = '/assets/images/students-happy.jpg';
const GRADUATION_IMG = '/assets/images/graduation.jpg';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', school_code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [schoolBrand, setSchoolBrand] = useState(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [step, setStep] = useState(1);

  const fetchBranding = useCallback(async (code) => {
    if (!code || code.length < 2) { setSchoolBrand(null); return; }
    setBrandLoading(true);
    try {
      const res = await brandingAPI.getPublicSchool(code);
      setSchoolBrand(res.data.data);
    } catch { setSchoolBrand(null); }
    setBrandLoading(false);
  }, []);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => fetchBranding(form.school_code), 500);
      return () => clearTimeout(timer);
    }
  }, [form.school_code, fetchBranding, step]);

  const handleNext = () => {
    if (!form.school_code.trim()) { setError('Please enter your school code'); return; }
    if (!schoolBrand) { setError('Invalid school code'); return; }
    setError(''); setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await login(form);
      const userRole = res?.data?.user?.role?.name;
      navigate(userRole === 'parent' ? '/my-children' : userRole === 'super_admin' ? '/super-admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const PRIMARY = schoolBrand?.theme_color || '#6366f1';
  const logoUrl = schoolBrand?.logo_url;
  const schoolName = schoolBrand?.name;
  const tagline = schoolBrand?.tagline;
  const bgImage = schoolBrand?.login_bg_image;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Full background image */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: bgImage
          ? `url(${bgImage})`
          : `url(${LOGIN_BG})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        '&::after': {
          content: '""', position: 'absolute', inset: 0,
          background: step === 2 && schoolBrand
            ? `linear-gradient(135deg, ${alpha(PRIMARY, 0.92)} 0%, rgba(15,23,42,0.88) 50%, ${alpha(PRIMARY, 0.85)} 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,27,75,0.92) 50%, rgba(49,46,129,0.88) 100%)',
        },
      }} />

      {/* Animated floating orbs */}
      <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', zIndex: 0,
        background: `radial-gradient(circle, ${alpha(PRIMARY, 0.12)}, transparent 70%)`,
        top: -150, right: -150, animation: 'floatOrb 10s ease-in-out infinite',
        '@keyframes floatOrb': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-30px,40px)' } } }} />
      <Box sx={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', zIndex: 0,
        background: `radial-gradient(circle, ${alpha('#818cf8', 0.08)}, transparent 70%)`,
        bottom: -100, left: -100, animation: 'floatOrb 7s ease-in-out infinite reverse' }} />
      <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', zIndex: 0,
        background: `radial-gradient(circle, ${alpha('#f59e0b', 0.06)}, transparent 70%)`,
        top: '40%', left: '30%', animation: 'floatOrb 12s ease-in-out infinite' }} />

      {/* Left panel - branding / info */}
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, flex: 1, flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', px: 6, zIndex: 1, position: 'relative' }}>
        <Fade in timeout={1200}>
          <Box sx={{ textAlign: 'center', maxWidth: 520 }}>
            {step === 2 && schoolBrand ? (<>
              {/* School branding on step 2 */}
              {logoUrl && <Box sx={{ width: 130, height: 130, borderRadius: 5, overflow: 'hidden',
                mx: 'auto', mb: 3, bgcolor: 'white', p: 1.5,
                boxShadow: `0 20px 60px ${alpha(PRIMARY, 0.5)}, 0 0 0 1px ${alpha('#fff', 0.1)}`,
                border: `3px solid ${alpha('#fff', 0.15)}`,
                animation: 'popIn 0.6s ease', '@keyframes popIn': { from: { transform: 'scale(0.8)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } } }}>
                <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>}
              <Typography variant="h3" fontWeight={800} color="white" mb={1}
                sx={{ textShadow: '0 2px 30px rgba(0,0,0,0.3)', letterSpacing: '-0.02em' }}>{schoolName}</Typography>
              {tagline && <Typography variant="h6" sx={{ color: alpha('#fff', 0.65), fontWeight: 300, fontStyle: 'italic', mb: 4 }}>
                &ldquo;{tagline}&rdquo;</Typography>}
              {/* Testimonial images */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                {[STUDENTS_IMG, GRADUATION_IMG].map((img, i) => (
                  <Box key={i} sx={{ width: 160, height: 100, borderRadius: 3, overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: `2px solid ${alpha('#fff', 0.1)}`,
                    opacity: 0.85, transition: 'all 0.3s', '&:hover': { opacity: 1, transform: 'scale(1.05)' } }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            </>) : (<>
              {/* Default branding step 1 */}
              <Box sx={{ width: 90, height: 90, borderRadius: 4, mx: 'auto', mb: 3, overflow: 'hidden',
                boxShadow: `0 20px 60px ${alpha(PRIMARY, 0.5)}`,
                animation: 'popIn 0.6s ease' }}>
                <img src={LOGO_CRM} alt="School CRM" style={{ width: '100%', height: '100%' }} />
              </Box>
              <Typography variant="h3" fontWeight={800} color="white" mb={1}
                sx={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)', letterSpacing: '-0.02em' }}>School CRM</Typography>
              <Typography variant="h6" sx={{ color: alpha('#fff', 0.55), fontWeight: 300, mb: 5 }}>
                Complete School Management Platform</Typography>

              {/* Feature highlights with images */}
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mb: 4 }}>
                {[
                  { img: STUDENTS_IMG, label: 'Student Management' },
                  { img: GRADUATION_IMG, label: 'Academic Excellence' },
                ].map((x, i) => (
                  <Box key={i} sx={{ textAlign: 'center' }}>
                    <Box sx={{ width: 140, height: 90, borderRadius: 3, overflow: 'hidden', mb: 1,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', border: `2px solid ${alpha('#fff', 0.08)}`,
                      transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' } }}>
                      <img src={x.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), fontSize: '0.7rem' }}>{x.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {[{ n: '20+', l: 'Modules' }, { n: '19', l: 'Roles' }, { n: '100%', l: 'Secure' }].map((x, i) => (
                  <Box key={i} sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={800} sx={{ color: PRIMARY, textShadow: `0 0 40px ${alpha(PRIMARY, 0.5)}` }}>{x.n}</Typography>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.4), textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.65rem' }}>{x.l}</Typography>
                  </Box>
                ))}
              </Box>
            </>)}
          </Box>
        </Fade>
      </Box>

      {/* Right panel - form */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: { xs: 1, lg: '0 0 500px' }, p: { xs: 2, sm: 4 }, zIndex: 1 }}>
        <Grow in timeout={600}>
          <Box sx={{ width: '100%', maxWidth: 440,
            bgcolor: alpha('#fff', 0.06), backdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: 6, p: { xs: 3, sm: 5 },
            border: `1px solid ${alpha('#fff', 0.1)}`,
            boxShadow: `0 32px 80px ${alpha('#000', 0.5)}, inset 0 1px 0 ${alpha('#fff', 0.1)}` }}>

            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'center', mb: 3 }}>
              {step === 2 && logoUrl ? (
                <Box sx={{ width: 64, height: 64, borderRadius: 3, overflow: 'hidden', bgcolor: 'white', p: 0.5,
                  boxShadow: `0 8px 32px ${alpha(PRIMARY, 0.4)}` }}>
                  <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></Box>
              ) : (
                <Box sx={{ width: 56, height: 56, borderRadius: 3, overflow: 'hidden',
                  boxShadow: `0 8px 32px ${alpha(PRIMARY, 0.4)}` }}>
                  <img src={LOGO_CRM} alt="School CRM" style={{ width: '100%', height: '100%' }} /></Box>
              )}
            </Box>

            {/* Step indicator */}
            <Box sx={{ display: 'flex', gap: 1, mb: 4, justifyContent: 'center' }}>
              {[1, 2].map(s => (
                <Box key={s} sx={{ width: s === step ? 36 : 12, height: 4, borderRadius: 2,
                  bgcolor: s === step ? PRIMARY : alpha('#fff', 0.15),
                  transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: s === step ? `0 0 12px ${alpha(PRIMARY, 0.5)}` : 'none' }} />
              ))}
            </Box>

            <Typography variant="h5" fontWeight={700} color="white" textAlign="center" mb={0.5}
              sx={{ letterSpacing: '-0.01em' }}>
              {step === 1 ? 'Welcome Back' : schoolName || 'Sign In'}</Typography>
            <Typography variant="body2" textAlign="center" mb={3} sx={{ color: alpha('#fff', 0.45) }}>
              {step === 1 ? 'Enter your school code to get started' : 'Sign in to your account'}</Typography>

            {error && <Fade in><Alert severity="error" sx={{ mb: 2, borderRadius: 3,
              bgcolor: alpha('#ef4444', 0.12), color: '#fca5a5',
              '& .MuiAlert-icon': { color: '#f87171' },
              backdropFilter: 'blur(10px)' }}>{error}</Alert></Fade>}

            {step === 1 ? (
              <Box>
                <TextField fullWidth placeholder="e.g. Sikarwar" label="School Code" value={form.school_code}
                  onChange={(e) => setForm({ ...form, school_code: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  InputLabelProps={{ shrink: true, sx: { color: alpha('#fff', 0.5), fontWeight: 500 } }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><School sx={{ color: alpha('#fff', 0.35) }} /></InputAdornment>,
                    endAdornment: brandLoading ? <InputAdornment position="end">
                      <CircularProgress size={20} sx={{ color: PRIMARY }} /></InputAdornment> : null,
                  }} sx={inputSx(PRIMARY)} />

                {/* School preview card */}
                {schoolBrand && <Fade in><Box sx={{ mt: 2.5, p: 2, borderRadius: 4,
                  background: `linear-gradient(135deg, ${alpha(PRIMARY, 0.15)}, ${alpha(PRIMARY, 0.05)})`,
                  border: `1px solid ${alpha(PRIMARY, 0.25)}`,
                  display: 'flex', alignItems: 'center', gap: 2,
                  animation: 'slideUp 0.3s ease',
                  '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                  {logoUrl ? <Box sx={{ width: 48, height: 48, borderRadius: 2.5, overflow: 'hidden', bgcolor: 'white', p: 0.5, flexShrink: 0,
                    boxShadow: `0 4px 16px ${alpha(PRIMARY, 0.3)}` }}>
                    <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></Box>
                  : <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: alpha(PRIMARY, 0.25),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <School sx={{ color: PRIMARY, fontSize: 24 }} /></Box>}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="white" noWrap>{schoolName}</Typography>
                    {tagline && <Typography variant="caption" noWrap sx={{ color: alpha('#fff', 0.45), display: 'block' }}>{tagline}</Typography>}
                  </Box>
                  <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Verified" size="small"
                    sx={{ bgcolor: alpha('#22c55e', 0.15), color: '#4ade80', fontSize: 11,
                      '& .MuiChip-icon': { color: '#4ade80' } }} />
                </Box></Fade>}

                <Button fullWidth variant="contained" size="large" onClick={handleNext}
                  endIcon={<ArrowForward />} sx={btnSx(PRIMARY)}>
                  Continue
                </Button>

                <Divider sx={{ my: 3, '&::before, &::after': { borderColor: alpha('#fff', 0.08) } }}>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.25), px: 1 }}>OR</Typography></Divider>

                <Button fullWidth variant="outlined" size="large"
                  onClick={() => { setForm({ ...form, school_code: '' }); setSchoolBrand(null); setStep(2); }}
                  sx={{ py: 1.3, borderRadius: 3, textTransform: 'none', fontWeight: 500,
                    borderColor: alpha('#fff', 0.12), color: alpha('#fff', 0.55),
                    backdropFilter: 'blur(10px)',
                    '&:hover': { borderColor: alpha('#fff', 0.25), bgcolor: alpha('#fff', 0.05) } }}>
                  Login as Super Admin</Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                {schoolBrand && <Button size="small" onClick={() => { setStep(1); setError(''); }}
                  sx={{ mb: 2, textTransform: 'none', color: alpha('#fff', 0.45), fontSize: '0.8rem',
                    '&:hover': { color: '#fff', bgcolor: alpha('#fff', 0.05) } }}>
                  &#8592; Change School</Button>}
                <TextField fullWidth placeholder="you@school.com" label="Email" type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  InputLabelProps={{ shrink: true, sx: { color: alpha('#fff', 0.5), fontWeight: 500 } }}
                  InputProps={{ startAdornment: <InputAdornment position="start">
                    <Email sx={{ color: alpha('#fff', 0.35) }} /></InputAdornment> }}
                  sx={{ ...inputSx(PRIMARY), mb: 2.5 }} />
                <TextField fullWidth placeholder="Enter your password" label="Password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  InputLabelProps={{ shrink: true, sx: { color: alpha('#fff', 0.5), fontWeight: 500 } }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock sx={{ color: alpha('#fff', 0.35) }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end">
                      <Box onClick={() => setShowPassword(!showPassword)}
                        sx={{ cursor: 'pointer', color: alpha('#fff', 0.35), '&:hover': { color: '#fff' }, transition: 'color 0.2s' }}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</Box>
                    </InputAdornment>,
                  }} sx={inputSx(PRIMARY)} />
                <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
                  sx={{ ...btnSx(PRIMARY),
                    '&:disabled': { background: alpha('#fff', 0.08), color: alpha('#fff', 0.25) } }}>
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}</Button>
              </form>
            )}

            <Typography variant="caption" textAlign="center" display="block" mt={4}
              sx={{ color: alpha('#fff', 0.2), fontSize: '0.7rem' }}>
              Powered by School CRM &bull; Secure &amp; Encrypted</Typography>
          </Box>
        </Grow>
      </Box>
    </Box>
  );
}

const inputSx = (c) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 3, color: '#fff',
    bgcolor: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(8px)',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&.Mui-focused fieldset': { borderColor: c, borderWidth: 2 },
  },
  '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.3)' },
});

const btnSx = (c) => ({
  mt: 3, py: 1.6, borderRadius: 3, textTransform: 'none', fontSize: 16, fontWeight: 600,
  background: `linear-gradient(135deg, ${c}, #818cf8)`,
  boxShadow: `0 8px 32px ${c}55`,
  '&:hover': { boxShadow: `0 16px 48px ${c}70`, transform: 'translateY(-2px)' },
  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
});
