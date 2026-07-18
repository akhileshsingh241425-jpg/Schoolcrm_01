import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Avatar, Grid, Chip, Divider, Skeleton, alpha, useTheme,
  Card, CardContent, Stack, LinearProgress
} from '@mui/material';
import {
  Person, School, Phone, Email, Home, CalendarMonth, Badge,
  Bloodtype, FamilyRestroom, ContactPhone, Lock, MenuBook
} from '@mui/icons-material';
import { studentPortalAPI } from '../../services/api';

export default function StudentProfile() {
  const theme = useTheme();
  const P = theme.palette.primary.main;
  const S = theme.palette.secondary?.main || '#7c3aed';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.myProfile()
      .then(r => setData(r.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box>
      <Skeleton variant="rounded" height={200} sx={{ mb: 2, borderRadius: 3 }} />
      <Skeleton variant="rounded" height={100} sx={{ mb: 2, borderRadius: 3 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} /></Grid>
        <Grid item xs={12} md={6}><Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} /></Grid>
      </Grid>
    </Box>
  );

  if (!data) return (
    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
      <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography color="text.secondary">Profile not available</Typography>
    </Paper>
  );

  const initials = `${(data.first_name || '?')[0]}${(data.last_name || '?')[0]}`.toUpperCase();

  const InfoRow = ({ icon, label, value, accent }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(accent || P, 0.08), color: accent || P, fontSize: 16 }}>
        {icon}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>{label}</Typography>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>{value || '-'}</Typography>
      </Box>
    </Box>
  );

  const sectionCard = (title, icon, color, children) => (
    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', border: `1px solid ${alpha(color, 0.15)}`, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.2, bgcolor: alpha(color, 0.04), borderBottom: `1px solid ${alpha(color, 0.1)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(color, 0.12), color }}>
          {icon}
        </Avatar>
        <Typography variant="subtitle2" fontWeight={700} color={color}>{title}</Typography>
      </Box>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Hero Banner */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{
          height: 140,
          background: `linear-gradient(135deg, ${alpha(P, 0.8)} 0%, ${alpha(S, 0.6)} 50%, ${alpha(P, 0.4)} 100%)`,
          position: 'relative',
          '&::after': {
            content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.15))'
          }
        }} />
        <Box sx={{ px: 3, pb: 3, mt: -6, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, mb: 2 }}>
            <Avatar sx={{
              width: 96, height: 96, fontSize: '2rem', fontWeight: 800,
              bgcolor: '#fff', color: P, border: `4px solid ${alpha('#fff', 0.9)}`,
              boxShadow: `0 4px 20px ${alpha(P, 0.3)}`,
              letterSpacing: 1
            }}>
              {initials}
            </Avatar>
            <Box sx={{ pb: 0.5 }}>
              <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {data.full_name || `${data.first_name || ''} ${data.last_name || ''}`}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.8 }} alignItems="center">
                <Chip label={data.admission_no || '-'} size="small"
                  sx={{ fontWeight: 700, bgcolor: alpha(P, 0.08), color: P, border: `1px solid ${alpha(P, 0.2)}` }} />
                {data.class_name && (
                  <Chip label={`${data.class_name} - ${data.section_name || ''}`}
                    size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
                {data.roll_no && (
                  <Chip label={`Roll #${data.roll_no}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
                {data.status && (
                  <Chip label={data.status} size="small"
                    sx={{ fontWeight: 600, bgcolor: alpha(data.status === 'active' ? '#10b981' : '#ef4444', 0.08), color: data.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'capitalize' }} />
                )}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {/* Personal */}
        <Grid item xs={12} md={6}>
          {sectionCard('Personal Details', <Person />, P, (
            <>
              <InfoRow icon={<Person />} label="Full Name" value={data.full_name || `${data.first_name || ''} ${data.last_name || ''}`} />
              <InfoRow icon={<Badge />} label="Gender" value={data.gender} accent="#7c3aed" />
              <InfoRow icon={<CalendarMonth />} label="Date of Birth" value={data.date_of_birth} accent="#f59e0b" />
              <InfoRow icon={<Bloodtype />} label="Blood Group" value={data.blood_group} accent="#ef4444" />
              <InfoRow icon={<School />} label="Nationality" value={data.nationality} accent="#10b981" />
            </>
          ))}
        </Grid>

        {/* Academic */}
        <Grid item xs={12} md={6}>
          {sectionCard('Academic Details', <School />, '#3b82f6', (
            <>
              <InfoRow icon={<Badge />} label="Admission No" value={data.admission_no} accent="#3b82f6" />
              <InfoRow icon={<School />} label="Class" value={data.class_name || data.current_class?.name || '-'} accent="#3b82f6" />
              <InfoRow icon={<School />} label="Section" value={data.section_name || data.current_section?.name || '-'} accent="#3b82f6" />
              <InfoRow icon={<Badge />} label="Roll No" value={data.roll_no} accent="#7c3aed" />
              <InfoRow icon={<CalendarMonth />} label="Admission Date" value={data.admission_date} accent="#f59e0b" />
              {data.class_teacher && (
                <InfoRow icon={<Person />} label="Class Teacher" value={data.class_teacher.name} accent="#10b981" />
              )}
            </>
          ))}
        </Grid>

        {/* Contact */}
        <Grid item xs={12} md={6}>
          {sectionCard('Contact & Address', <Home />, '#f59e0b', (
            <>
              <InfoRow icon={<Home />} label="Address" value={[data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ')} accent="#f59e0b" />
              <InfoRow icon={<Phone />} label="Emergency Contact" value={data.emergency_contact} accent="#ef4444" />
              <InfoRow icon={<ContactPhone />} label="Emergency Person" value={data.emergency_person} accent="#ef4444" />
            </>
          ))}
        </Grid>

        {/* Parents */}
        <Grid item xs={12} md={6}>
          {sectionCard('Parents / Guardian', <FamilyRestroom />, '#10b981', (
            data.parents && data.parents.length > 0 ? data.parents.map((p, i) => (
              <Box key={i} sx={{ mb: i < data.parents.length - 1 ? 1.5 : 0 }}>
                <InfoRow icon={<FamilyRestroom />} label={p.relation || 'Parent'} value={p.name} accent="#10b981" />
                {p.phone && <InfoRow icon={<Phone />} label={`${p.relation} Phone`} value={p.phone} accent="#3b82f6" />}
                {p.email && <InfoRow icon={<Email />} label={`${p.relation} Email`} value={p.email} accent="#7c3aed" />}
              </Box>
            )) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No parent info available</Typography>
            )
          ))}
        </Grid>

        {/* Login Credentials */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{
            borderRadius: 3,
            border: `1px solid ${alpha('#f59e0b', 0.2)}`,
            overflow: 'hidden'
          }}>
            <Box sx={{
              px: 2, py: 1.2,
              background: `linear-gradient(135deg, ${alpha('#f59e0b', 0.06)}, ${alpha('#f97316', 0.04)})`,
              borderBottom: `1px solid ${alpha('#f59e0b', 0.1)}`,
              display: 'flex', alignItems: 'center', gap: 1
            }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#f59e0b', 0.12), color: '#f59e0b' }}>
                <Lock sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="subtitle2" fontWeight={700} color="#f59e0b">Login Credentials</Typography>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{
                p: 1.5, mb: 2, borderRadius: 2,
                bgcolor: alpha('#f59e0b', 0.04),
                border: `1px dashed ${alpha('#f59e0b', 0.25)}`
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
                  Passwords are managed by admin. Contact your school administrator to change credentials.
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <InfoRow icon={<Email />} label="Login Email" value={data.login_email || data.email || '-'} accent="#3b82f6" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoRow icon={<Person />} label="Username" value={data.username || '-'} accent="#7c3aed" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoRow icon={<Lock />} label="Password" value="••••••••" accent="#f59e0b" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
