import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Avatar, Skeleton, alpha, useTheme, IconButton,
  Tooltip, Button, Grid, Card, CardContent, TextField, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  List, ListItem, ListItemText, ListItemIcon, Snackbar, Alert, Badge
} from '@mui/material';
import {
  Refresh, Edit, Lock, AccountBalance, Person, Email, Phone,
  School, Badge as BadgeIcon, CalendarMonth, Save, CheckCircle,
  History, Description, Download
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { staffAPI } from '../../services/api';

export default function TeacherProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user, school } = useAuthStore();
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  useEffect(() => {
    if (user?.staff_id) {
      staffAPI.getProfile(user.staff_id)
        .then(res => setProfile(res.data.data))
        .catch(() => setSnackbar({ open: true, message: 'Failed to load profile', severity: 'error' }))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.staff_id]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Profile</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} /></Grid>
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Profile not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>My Profile</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!editMode ? (
            <Button variant="contained" startIcon={<Edit />} size="small"
              onClick={() => setEditMode(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="contained" startIcon={<Save />} size="small"
                onClick={() => { setEditMode(false); setSnackbar({ open: true, message: 'Profile updated!', severity: 'success' }); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Save
              </Button>
              <Button variant="outlined" size="small"
                onClick={() => setEditMode(false)}
                sx={{ borderRadius: 2, textTransform: 'none' }}>
                Cancel
              </Button>
            </>
          )}
          <Button variant="outlined" startIcon={<Lock />} size="small"
            onClick={() => setPasswordDialog(true)}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Change Password
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, textAlign: 'center', p: 3 }}>
            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton size="small" sx={{ bgcolor: PRIMARY, color: '#fff', '&:hover': { bgcolor: PRIMARY } }}>
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
              }>
              <Avatar sx={{ width: 96, height: 96, mx: 'auto', mb: 2,
                background: `linear-gradient(135deg, ${PRIMARY}, ${theme.palette.secondary.main})`,
                fontSize: '2rem', fontWeight: 700 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
            </Badge>
            <Typography variant="h6" fontWeight={700}>{profile.first_name} {profile.last_name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.designation}</Typography>
            <Chip label={profile.employee_id} size="small"
              sx={{ mt: 1, bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY, fontWeight: 600 }} />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">{profile.email || user?.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">{profile.phone || user?.phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">{school?.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">Joined: {profile.date_of_joining?.split('T')[0]}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Personal Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="First Name" defaultValue={profile.first_name}
                    disabled={!editMode} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Last Name" defaultValue={profile.last_name}
                    disabled={!editMode} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Email" defaultValue={profile.email || user?.email}
                    disabled={!editMode} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Phone" defaultValue={profile.phone}
                    disabled={!editMode} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Qualification" defaultValue={profile.qualification}
                    disabled={!editMode} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Experience (Years)" defaultValue={profile.experience_years}
                    disabled={!editMode} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Address" defaultValue={profile.address}
                    disabled={!editMode} />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Employment Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Employee ID" defaultValue={profile.employee_id} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Designation" defaultValue={profile.designation} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Department" defaultValue={profile.department} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Date of Joining" defaultValue={profile.date_of_joining?.split('T')[0]} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="PAN No" defaultValue={profile.pan_no} disabled />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Payroll Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Salary" defaultValue={profile.salary ? `₹${profile.salary}` : ''} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Bank Name" defaultValue={profile.bank_name} disabled />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth size="small" label="Account No" defaultValue={profile.bank_account_no} disabled />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" startIcon={<Download />} size="small"
                  sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Download Payslip
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Change Password</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" type="password" label="Current Password" sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth size="small" type="password" label="New Password" sx={{ mb: 2 }} />
          <TextField fullWidth size="small" type="password" label="Confirm New Password" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordDialog(false)} sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={() => { setPasswordDialog(false); setSnackbar({ open: true, message: 'Password changed!', severity: 'success' }); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}>Update Password</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
