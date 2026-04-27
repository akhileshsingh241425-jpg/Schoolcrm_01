import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Avatar, IconButton,
  Button, TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Grid, Tooltip, Pagination, Stack
} from '@mui/material';
import {
  Search, Edit, Block, CheckCircle, Add, ManageAccounts,
  Visibility, VisibilityOff, Refresh
} from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

const ROLE_COLORS = {
  super_admin: 'error',
  school_admin: 'primary',
  teacher: 'success',
  accountant: 'warning',
  librarian: 'info',
  parent: 'default',
  receptionist: 'secondary',
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(null); // user object
  const [newPwd, setNewPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '', last_name: '', email: '', password: '', role: 'school_admin', school_id: ''
  });

  const fetchUsers = useCallback(() => {
    setLoading(true);
    superAdminAPI.listUsers({ page, search, school_id: filterSchool, role: filterRole })
      .then(res => {
        setUsers(res.data.data?.users || res.data.data || []);
        setTotalPages(res.data.data?.pages || 1);
      })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, filterSchool, filterRole]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    superAdminAPI.listSchools().then(res => setSchools(res.data.data?.items || [])).catch(() => {});
  }, []);

  const handleToggleUser = (u) => {
    superAdminAPI.toggleUser(u.id)
      .then(() => fetchUsers())
      .catch(() => setError('Failed to toggle user status'));
  };

  const handleResetPassword = () => {
    if (!newPwd || newPwd.length < 6) return;
    setSaving(true);
    superAdminAPI.resetUserPassword(resetOpen.id, newPwd)
      .then(() => { setResetOpen(null); setNewPwd(''); })
      .catch(() => setError('Failed to reset password'))
      .finally(() => setSaving(false));
  };

  const handleCreate = () => {
    if (!createForm.email || !createForm.password || !createForm.first_name) return;
    setSaving(true);
    superAdminAPI.createUser(createForm)
      .then(() => { setCreateOpen(false); setCreateForm({ first_name: '', last_name: '', email: '', password: '', role: 'school_admin', school_id: '' }); fetchUsers(); })
      .catch(err => setError(err.response?.data?.message || 'Failed to create user'))
      .finally(() => setSaving(false));
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <ManageAccounts sx={{ color: '#6366f1', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Manage Users</Typography>
            <Typography variant="body2" color="text.secondary">All users across all schools</Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
          sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
          Create User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5} md={4}>
              <TextField fullWidth size="small" placeholder="Search name or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter School</InputLabel>
                <Select value={filterSchool} label="Filter School" onChange={e => { setFilterSchool(e.target.value); setPage(1); }}>
                  <MenuItem value="">All Schools</MenuItem>
                  {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter Role</InputLabel>
                <Select value={filterRole} label="Filter Role" onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
                  <MenuItem value="">All Roles</MenuItem>
                  {Object.keys(ROLE_COLORS).map(r => <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchUsers}><Refresh /></IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>School</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>No users found</TableCell></TableRow>
              ) : users.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: '#6366f1', fontWeight: 700 }}>
                        {u.first_name?.[0] || u.email?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {u.first_name} {u.last_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.role?.name?.replace(/_/g, ' ') || u.role || '-'}
                      size="small"
                      color={ROLE_COLORS[u.role?.name || u.role] || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{u.school?.name || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.is_active ? 'Active' : 'Disabled'}
                      size="small"
                      color={u.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Reset Password">
                      <IconButton size="small" onClick={() => setResetOpen(u)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    {u.role?.name !== 'super_admin' && (
                      <Tooltip title={u.is_active ? 'Disable User' : 'Enable User'}>
                        <IconButton size="small" onClick={() => handleToggleUser(u)}
                          color={u.is_active ? 'error' : 'success'}>
                          {u.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box p={2} display="flex" justifyContent="center">
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={Boolean(resetOpen)} onClose={() => setResetOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Reset password for <strong>{resetOpen?.first_name} {resetOpen?.last_name}</strong> ({resetOpen?.email})
          </Typography>
          <TextField
            fullWidth label="New Password" type={showPwd ? 'text' : 'password'}
            value={newPwd} onChange={e => setNewPwd(e.target.value)}
            inputProps={{ minLength: 6 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={saving || newPwd.length < 6}>
            {saving ? <CircularProgress size={18} /> : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="First Name" value={createForm.first_name}
                  onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Last Name" value={createForm.last_name}
                  onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })} />
              </Grid>
            </Grid>
            <TextField fullWidth label="Email" type="email" value={createForm.email}
              onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            <TextField fullWidth label="Password" type={showPwd ? 'text' : 'password'} value={createForm.password}
              onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={createForm.role} label="Role"
                onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                {Object.keys(ROLE_COLORS).filter(r => r !== 'super_admin').map(r => (
                  <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>School (optional)</InputLabel>
              <Select value={createForm.school_id} label="School (optional)"
                onChange={e => setCreateForm({ ...createForm, school_id: e.target.value })}>
                <MenuItem value="">None</MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}
            sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
            {saving ? <CircularProgress size={18} /> : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
