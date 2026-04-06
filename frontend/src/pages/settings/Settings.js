import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel,
  Divider, Snackbar, Alert, Card, CardContent, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip, FormControl, InputLabel,
  Select, MenuItem, Checkbox, Tooltip, Avatar, InputAdornment
} from '@mui/material';
import {
  Add, Edit, Delete, PersonAdd, Security, Visibility, VisibilityOff,
  CheckCircle, Cancel, People, AdminPanelSettings, Lock
} from '@mui/icons-material';
import { schoolsAPI, authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function Settings() {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });
  const isAdmin = useAuthStore(s => s.hasRole('school_admin', 'super_admin'));

  return (
    <Box>
      <Typography variant="h5" mb={1} fontWeight="bold">Settings</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="School Settings" />
        {isAdmin && <Tab label="Users & Logins" icon={<People sx={{ fontSize: 18 }} />} iconPosition="start" />}
        {isAdmin && <Tab label="Roles & Permissions" icon={<Security sx={{ fontSize: 18 }} />} iconPosition="start" />}
      </Tabs>

      {tab === 0 && <SchoolSettingsTab showSnack={showSnack} />}
      {tab === 1 && isAdmin && <UsersTab showSnack={showSnack} />}
      {tab === 2 && isAdmin && <RolesTab showSnack={showSnack} />}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ============================================================
// SCHOOL SETTINGS TAB (existing)
// ============================================================
function SchoolSettingsTab({ showSnack }) {
  const [school, setSchool] = useState({});
  const [settings, setSettings] = useState({});
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schoolsAPI.getMySchool().then(res => {
      const data = res.data.data || {};
      setSchool(data);
      setSettings(data.settings || {});
      const featureMap = {};
      (data.features || []).forEach(f => { featureMap[f.feature_name] = f.enabled; });
      setFeatures(featureMap);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveSettings = () => {
    schoolsAPI.updateSettings(settings).then(() => {
      showSnack('Settings saved!');
    }).catch(() => showSnack('Failed to save', 'error'));
  };

  const toggleFeature = (feature) => {
    const updated = { ...features, [feature]: !features[feature] };
    setFeatures(updated);
    schoolsAPI.updateFeatures(school.id, { features: Object.entries(updated).map(([name, enabled]) => ({ feature_name: name, enabled })) })
      .then(() => showSnack(`${feature} ${updated[feature] ? 'enabled' : 'disabled'}`))
      .catch(() => showSnack('Failed', 'error'));
  };

  const allFeatures = [
    { key: 'student_management', label: 'Student Management' },
    { key: 'staff_management', label: 'Staff Management' },
    { key: 'marketing_crm', label: 'Marketing & CRM' },
    { key: 'admission', label: 'Admissions' },
    { key: 'academics', label: 'Academics' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'fees', label: 'Fees & Payments' },
    { key: 'communication', label: 'Communication' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'transport', label: 'Transport' },
    { key: 'library', label: 'Library' },
    { key: 'reports', label: 'Reports' },
  ];

  if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;

  return (
    <Box>
      {/* School Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>School Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField fullWidth label="School Name" value={school.name || ''} onChange={(e) => setSchool({ ...school, name: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="School Code" value={school.code || ''} disabled /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Email" value={school.email || ''} onChange={(e) => setSchool({ ...school, email: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Phone" value={school.phone || ''} onChange={(e) => setSchool({ ...school, phone: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={school.address || ''} onChange={(e) => setSchool({ ...school, address: e.target.value })} /></Grid>
        </Grid>
      </Paper>

      {/* UI Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" mb={2}>Display Settings</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField fullWidth label="Logo URL" value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Theme Color" type="color" value={settings.theme_color || '#1976d2'} onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Academic Year" value={settings.current_academic_year || ''} onChange={(e) => setSettings({ ...settings, current_academic_year: e.target.value })} /></Grid>
          <Grid item xs={12} md={6}><TextField fullWidth label="Currency Symbol" value={settings.currency || '₹'} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} /></Grid>
        </Grid>
        <Box mt={2}>
          <Button variant="contained" onClick={saveSettings}>Save Settings</Button>
        </Box>
      </Paper>

      {/* Feature Toggles */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>Module Management</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>Enable or disable modules for your school</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {allFeatures.map(f => (
            <Grid item xs={12} sm={6} md={4} key={f.key}>
              <Card variant="outlined">
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, '&:last-child': { pb: 1 } }}>
                  <Typography variant="body1">{f.label}</Typography>
                  <Switch checked={!!features[f.key]} onChange={() => toggleFeature(f.key)} color="primary" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

// ============================================================
// USERS & LOGINS TAB
// ============================================================
function UsersTab({ showSnack }) {
  const [users, setUsers] = useState({ items: [], total: 0 });
  const [roles, setRoles] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', role_id: '' });

  const loadUsers = useCallback(() => {
    const params = { per_page: 100 };
    if (filterRole) params.role_id = filterRole;
    if (search) params.search = search;
    authAPI.listUsers(params).then(r => setUsers(r.data.data || { items: [], total: 0 })).catch(() => {});
  }, [filterRole, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => {
    authAPI.listRoles().then(r => setRoles(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ email: '', password: '', first_name: '', last_name: '', phone: '', role_id: '' });
    setDialog(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      email: user.email, password: '', first_name: user.first_name,
      last_name: user.last_name || '', phone: user.phone || '', role_id: user.role?.id || ''
    });
    setDialog(true);
  };

  const save = () => {
    if (!form.email || !form.first_name || !form.role_id) {
      showSnack('Email, Name aur Role required hai', 'error'); return;
    }
    if (!editing && !form.password) {
      showSnack('Password required hai new user ke liye', 'error'); return;
    }

    const data = { ...form };
    if (!data.password) delete data.password;

    const fn = editing ? authAPI.updateUser(editing.id, data) : authAPI.createUser(data);
    fn.then(() => {
      showSnack(editing ? 'User updated!' : 'User created!');
      setDialog(false); loadUsers();
    }).catch(err => showSnack(err.response?.data?.message || 'Failed', 'error'));
  };

  const toggleActive = (user) => {
    if (user.role?.name === 'school_admin') {
      showSnack('Admin ko deactivate nahi kar sakte', 'error'); return;
    }
    authAPI.updateUser(user.id, { is_active: !user.is_active })
      .then(() => { showSnack(user.is_active ? 'User deactivated' : 'User activated'); loadUsers(); })
      .catch(() => showSnack('Failed', 'error'));
  };

  const getRoleColor = (roleName) => {
    const colors = {
      school_admin: 'error', principal: 'error', teacher: 'primary', accountant: 'success',
      exam_controller: 'warning', hostel_warden: 'secondary', librarian: 'info',
      transport_manager: 'info', hr_manager: 'secondary', counselor: 'warning',
      receptionist: 'default', parent: 'default', student: 'default'
    };
    return colors[roleName] || 'default';
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid #1565c0', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px #1565c022' } }}>
            <CardContent><Typography variant="h4" fontWeight="bold" color="#1565c0">{users.total}</Typography><Typography variant="body2" color="text.secondary">Total Users</Typography></CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid #2e7d32', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px #2e7d3222' } }}>
            <CardContent><Typography variant="h4" fontWeight="bold" color="#2e7d32">{users.items?.filter(u => u.is_active).length}</Typography><Typography variant="body2" color="text.secondary">Active</Typography></CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid #e65100', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px #e6510022' } }}>
            <CardContent><Typography variant="h4" fontWeight="bold" color="#e65100">{users.items?.filter(u => !u.is_active).length}</Typography><Typography variant="body2" color="text.secondary">Inactive</Typography></CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderLeft: '4px solid #6a1b9a', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px #6a1b9a22' } }}>
            <CardContent><Typography variant="h4" fontWeight="bold" color="#6a1b9a">{roles.length}</Typography><Typography variant="body2" color="text.secondary">Roles</Typography></CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Search" placeholder="Name or Email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Role</InputLabel>
              <Select value={filterRole} label="Filter by Role" onChange={e => setFilterRole(e.target.value)}>
                <MenuItem value="">All Roles</MenuItem>
                {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.description || r.name} ({r.user_count})</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} display="flex" justifyContent="flex-end">
            <Button variant="contained" startIcon={<PersonAdd />} onClick={openCreate}
              sx={{ borderRadius: 50, textTransform: 'none' }}>
              Create New User
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Modules Access</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Login</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.items?.map(u => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                      {u.first_name?.[0]}{u.last_name?.[0]}
                    </Avatar>
                    <Typography fontWeight="bold" fontSize={13}>{u.first_name} {u.last_name}</Typography>
                  </Box>
                </TableCell>
                <TableCell><Typography fontSize={13}>{u.email}</Typography></TableCell>
                <TableCell>
                  <Chip label={u.role?.description || u.role?.name} size="small"
                    color={getRoleColor(u.role?.name)} variant="filled" sx={{ fontWeight: 'bold', fontSize: 11 }} />
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.3}>
                    {(u.allowed_modules || []).slice(0, 5).map(m => (
                      <Chip key={m} label={m} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                    ))}
                    {(u.allowed_modules || []).length > 5 && (
                      <Chip label={`+${u.allowed_modules.length - 5}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={u.is_active ? 'Active' : 'Inactive'} size="small"
                    color={u.is_active ? 'success' : 'default'} icon={u.is_active ? <CheckCircle /> : <Cancel />} />
                </TableCell>
                <TableCell>
                  <Typography fontSize={12} color="text.secondary">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={u.is_active ? 'Deactivate' : 'Activate'}>
                    <IconButton size="small" color={u.is_active ? 'error' : 'success'} onClick={() => toggleActive(u)}>
                      {u.is_active ? <Lock fontSize="small" /> : <CheckCircle fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!users.items?.length && (
              <TableRow><TableCell colSpan={7} align="center">
                <Typography color="text.secondary" py={3}>No users found</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit User Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {editing ? `Edit User — ${editing.first_name}` : 'Create New User Login'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="First Name" value={form.first_name} required
                onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Last Name" value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email (Login ID)" value={form.email} required type="email"
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={editing ? 'New Password (leave blank to keep)' : 'Password'}
                value={form.password} required={!editing}
                type={showPwd ? 'text' : 'password'}
                onChange={e => setForm({ ...form, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPwd(!showPwd)} size="small">
                        {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  )
                }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Role / Department</InputLabel>
                <Select value={form.role_id} label="Role / Department"
                  onChange={e => setForm({ ...form, role_id: e.target.value })}>
                  {roles.map(r => (
                    <MenuItem key={r.id} value={r.id}>
                      <Box>
                        <Typography fontSize={14} fontWeight="bold">{r.description || r.name}</Typography>
                        <Typography fontSize={11} color="text.secondary">{r.modules?.length || 0} modules</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {form.role_id && (
            <Box mt={2} p={1.5} bgcolor="#f5f5f5" borderRadius={2}>
              <Typography variant="caption" fontWeight="bold" color="primary">
                <Security sx={{ fontSize: 14, verticalAlign: 'middle' }} /> This role has access to:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                {roles.find(r => r.id === form.role_id)?.modules?.map(m => (
                  <Chip key={m} label={m.replace('_', ' ')} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}
            sx={{ borderRadius: 50, textTransform: 'none' }}>
            {editing ? 'Update' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ============================================================
// ROLES & PERMISSIONS TAB
// ============================================================
const ROLE_META = {
  super_admin: { icon: '👑', color: '#b71c1c', bg: '#ffebee', cat: 'Admin' },
  school_admin: { icon: '👑', color: '#c62828', bg: '#ffebee', cat: 'Admin' },
  principal: { icon: '👑', color: '#d32f2f', bg: '#ffebee', cat: 'Admin' },
  teacher: { icon: '👨‍🏫', color: '#1565c0', bg: '#e3f2fd', cat: 'Academic' },
  department_head: { icon: '🎓', color: '#0d47a1', bg: '#e3f2fd', cat: 'Academic' },
  exam_controller: { icon: '📝', color: '#e65100', bg: '#fff3e0', cat: 'Academic' },
  counselor: { icon: '🤝', color: '#6a1b9a', bg: '#f3e5f5', cat: 'Academic' },
  lab_assistant: { icon: '🔬', color: '#00695c', bg: '#e0f2f1', cat: 'Academic' },
  accountant: { icon: '💰', color: '#2e7d32', bg: '#e8f5e9', cat: 'Support' },
  hr_manager: { icon: '👥', color: '#4527a0', bg: '#ede7f6', cat: 'Support' },
  receptionist: { icon: '📞', color: '#546e7a', bg: '#eceff1', cat: 'Support' },
  librarian: { icon: '📚', color: '#00838f', bg: '#e0f7fa', cat: 'Support' },
  hostel_warden: { icon: '🏠', color: '#4e342e', bg: '#efebe9', cat: 'Facility' },
  transport_manager: { icon: '🚌', color: '#ef6c00', bg: '#fff3e0', cat: 'Facility' },
  canteen_manager: { icon: '🍽️', color: '#558b2f', bg: '#f1f8e9', cat: 'Facility' },
  sports_incharge: { icon: '⚽', color: '#c62828', bg: '#fce4ec', cat: 'Facility' },
  health_officer: { icon: '🏥', color: '#00695c', bg: '#e0f2f1', cat: 'Facility' },
  parent: { icon: '👨‍👩‍👧', color: '#37474f', bg: '#eceff1', cat: 'External' },
  student: { icon: '🎒', color: '#37474f', bg: '#eceff1', cat: 'External' },
};

const MODULE_ICONS = {
  dashboard: '📊', students: '👨‍🎓', staff: '👨‍💼', academics: '📖', attendance: '✅',
  fees: '💳', communication: '💬', leads: '📣', admissions: '📋', reports: '📈',
  inventory: '📦', transport: '🚌', library: '📚', hostel: '🏠', sports: '⚽',
  canteen: '🍽️', health: '🏥', settings: '⚙️', data_import: '📥', parents: '👨‍👩‍👧'
};

const CAT_COLORS = {
  Admin: { bg: '#b71c1c', light: '#ffebee' },
  Academic: { bg: '#1565c0', light: '#e3f2fd' },
  Support: { bg: '#2e7d32', light: '#e8f5e9' },
  Facility: { bg: '#e65100', light: '#fff3e0' },
  External: { bg: '#37474f', light: '#eceff1' }
};

function RolesTab({ showSnack }) {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [view, setView] = useState('matrix'); // 'matrix' or 'detail'

  useEffect(() => {
    authAPI.listRoles().then(r => setRoles(r.data.data || [])).catch(() => {});
    authAPI.listModules().then(r => setModules(r.data.data || [])).catch(() => {});
  }, []);

  const togglePermission = (role, moduleKey) => {
    const hasIt = role.modules?.includes(moduleKey);
    const newModules = hasIt
      ? role.modules.filter(m => m !== moduleKey)
      : [...(role.modules || []), moduleKey];

    setSaving(`${role.id}-${moduleKey}`);
    authAPI.updateRolePermissions(role.id, { modules: newModules })
      .then(() => {
        setRoles(prev => prev.map(r => r.id === role.id ? { ...r, modules: newModules } : r));
        setSaving(null);
      })
      .catch(() => { showSnack('Failed to update', 'error'); setSaving(null); });
  };

  const totalUsers = roles.reduce((s, r) => s + (r.user_count || 0), 0);

  // Group roles by category
  const groupedRoles = {};
  roles.forEach(r => {
    const cat = ROLE_META[r.name]?.cat || 'Other';
    if (!groupedRoles[cat]) groupedRoles[cat] = [];
    groupedRoles[cat].push(r);
  });

  return (
    <Box>
      {/* Top Stats */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: 'Roles', value: roles.length, icon: <AdminPanelSettings />, gradient: 'linear-gradient(135deg, #1a237e, #3f51b5)' },
          { label: 'Users', value: totalUsers, icon: <People />, gradient: 'linear-gradient(135deg, #004d40, #009688)' },
          { label: 'Modules', value: modules.length, icon: <Security />, gradient: 'linear-gradient(135deg, #bf360c, #ff5722)' },
        ].map((s, i) => (
          <Paper key={i} sx={{ flex: '1 1 auto', minWidth: { xs: '100%', sm: 150 }, p: 2, borderRadius: 3, background: s.gradient, color: 'white', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {React.cloneElement(s.icon, { sx: { fontSize: 32, opacity: 0.7 } })}
            <Box><Typography variant="h5" fontWeight="bold">{s.value}</Typography><Typography variant="caption" sx={{ opacity: 0.85 }}>{s.label}</Typography></Box>
          </Paper>
        ))}
      </Box>

      {/* View Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          {view === 'matrix' ? 'Click any cell to toggle access instantly.' : 'Click a role to see details.'}
        </Typography>
        <Box display="flex" gap={0.5} bgcolor="#f0f0f0" borderRadius={2} p={0.5}>
          <Button size="small" variant={view === 'matrix' ? 'contained' : 'text'}
            onClick={() => setView('matrix')} sx={{ borderRadius: 1.5, textTransform: 'none', minWidth: 100 }}>
            Permission Matrix
          </Button>
          <Button size="small" variant={view === 'detail' ? 'contained' : 'text'}
            onClick={() => setView('detail')} sx={{ borderRadius: 1.5, textTransform: 'none', minWidth: 100 }}>
            Role Cards
          </Button>
        </Box>
      </Box>

      {/* ====== MATRIX VIEW ====== */}
      {view === 'matrix' && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e0e0e0', maxHeight: '65vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  fontWeight: 'bold', bgcolor: '#1a237e', color: 'white', position: 'sticky',
                  left: 0, zIndex: 3, minWidth: 200, borderRight: '2px solid #283593', fontSize: 13
                }}>
                  Role
                </TableCell>
                {modules.map(mod => (
                  <TableCell key={mod.key} align="center" sx={{
                    bgcolor: '#1a237e', color: 'white', fontWeight: 600, fontSize: 11,
                    minWidth: 70, maxWidth: 80, p: 1, lineHeight: 1.2, borderRight: '1px solid #283593',
                    whiteSpace: 'normal'
                  }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                      <Typography fontSize={16}>{MODULE_ICONS[mod.key] || '📁'}</Typography>
                      <Typography fontSize={10} sx={{ opacity: 0.9, textTransform: 'capitalize' }}>
                        {mod.label?.replace(' Management', '').replace(' & ', '/') || mod.key}
                      </Typography>
                    </Box>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ bgcolor: '#1a237e', color: 'white', fontWeight: 'bold', fontSize: 11, minWidth: 60 }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedRoles).map(([cat, catRoles]) => (
                <React.Fragment key={cat}>
                  {/* Category separator row */}
                  <TableRow>
                    <TableCell colSpan={modules.length + 2} sx={{
                      bgcolor: CAT_COLORS[cat]?.light || '#f5f5f5', py: 0.8, position: 'sticky', left: 0,
                      borderBottom: `2px solid ${CAT_COLORS[cat]?.bg || '#999'}44`
                    }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: CAT_COLORS[cat]?.bg, letterSpacing: 1, textTransform: 'uppercase' }}>
                        {cat === 'Admin' ? '👑 Administration' : cat === 'Academic' ? '📖 Academic Staff' : cat === 'Support' ? '💼 Support Staff' : cat === 'Facility' ? '🏢 Facility Management' : '👤 External Users'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {catRoles.map((role, idx) => {
                    const meta = ROLE_META[role.name] || { icon: '👤', color: '#546e7a', bg: '#eceff1' };
                    const moduleCount = role.modules?.length || 0;
                    return (
                      <TableRow key={role.id} sx={{
                        bgcolor: idx % 2 === 0 ? 'white' : '#fafafa',
                        '&:hover': { bgcolor: '#f5f5ff' },
                        transition: 'background 0.15s'
                      }}>
                        {/* Role name cell - sticky */}
                        <TableCell sx={{
                          position: 'sticky', left: 0, zIndex: 1,
                          bgcolor: idx % 2 === 0 ? 'white' : '#fafafa',
                          borderRight: '2px solid #e0e0e0', py: 1.2,
                          '&:hover': { bgcolor: '#f5f5ff' }
                        }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{
                              width: 34, height: 34, borderRadius: 2, display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: 18, bgcolor: meta.bg
                            }}>
                              {meta.icon}
                            </Box>
                            <Box>
                              <Typography fontSize={13} fontWeight="bold" lineHeight={1.2}>
                                {role.description || role.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography fontSize={10} color="text.secondary">{role.name}</Typography>
                                <Chip label={`${role.user_count || 0}`} size="small"
                                  sx={{ fontSize: 10, height: 16, minWidth: 20, bgcolor: meta.bg, color: meta.color, fontWeight: 'bold' }} />
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Module cells */}
                        {modules.map(mod => {
                          const hasAccess = role.modules?.includes(mod.key);
                          const isSaving = saving === `${role.id}-${mod.key}`;
                          return (
                            <TableCell key={mod.key} align="center" sx={{
                              p: 0, cursor: 'pointer', borderRight: '1px solid #f0f0f0',
                              transition: 'all 0.15s',
                              '&:hover': {
                                bgcolor: hasAccess ? '#ffebee' : '#e8f5e9',
                                transform: 'scale(1.05)'
                              }
                            }} onClick={() => !isSaving && togglePermission(role, mod.key)}>
                              {isSaving ? (
                                <Box sx={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #ccc',
                                  mx: 'auto', animation: 'spin 1s linear infinite',
                                  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
                                }} />
                              ) : hasAccess ? (
                                <Box sx={{
                                  width: 30, height: 30, borderRadius: '50%', mx: 'auto',
                                  background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: '0 2px 6px rgba(46,125,50,0.35)',
                                  transition: 'all 0.2s'
                                }}>
                                  <CheckCircle sx={{ fontSize: 18, color: 'white' }} />
                                </Box>
                              ) : (
                                <Box sx={{
                                  width: 30, height: 30, borderRadius: '50%', mx: 'auto',
                                  border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.2s', opacity: 0.4,
                                  '&:hover': { borderColor: '#4caf50', opacity: 0.8 }
                                }}>
                                  <Cancel sx={{ fontSize: 14, color: '#bbb' }} />
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}

                        {/* Total count */}
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                          <Chip label={moduleCount} size="small"
                            color={moduleCount > 10 ? 'success' : moduleCount > 5 ? 'primary' : moduleCount > 0 ? 'warning' : 'default'}
                            sx={{ fontWeight: 'bold', minWidth: 35 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ====== CARD VIEW ====== */}
      {view === 'detail' && (
        <Grid container spacing={2}>
          {/* Left: Role List */}
          <Grid item xs={12} sm={4}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #1a237e, #3949ab)', color: 'white' }}>
                <Typography fontWeight="bold">All Roles</Typography>
              </Box>
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {Object.entries(groupedRoles).map(([cat, catRoles]) => (
                  <React.Fragment key={cat}>
                    <Box sx={{ px: 2, py: 0.8, bgcolor: CAT_COLORS[cat]?.light, borderBottom: '1px solid #eee' }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: CAT_COLORS[cat]?.bg, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {cat}
                      </Typography>
                    </Box>
                    {catRoles.map(role => {
                      const meta = ROLE_META[role.name] || { icon: '👤', color: '#546e7a', bg: '#eceff1' };
                      const isActive = selectedRole?.id === role.id;
                      return (
                        <Box key={role.id} onClick={() => setSelectedRole(role)} sx={{
                          px: 2, py: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                          borderBottom: '1px solid #f5f5f5', borderLeft: isActive ? `4px solid ${meta.color}` : '4px solid transparent',
                          bgcolor: isActive ? meta.bg : 'white',
                          transition: 'all 0.15s', '&:hover': { bgcolor: meta.bg + '66' }
                        }}>
                          <Typography fontSize={22}>{meta.icon}</Typography>
                          <Box flex={1}>
                            <Typography fontSize={13} fontWeight={isActive ? 'bold' : 500}>{role.description || role.name}</Typography>
                            <Typography fontSize={11} color="text.secondary">{role.modules?.length || 0} modules • {role.user_count || 0} users</Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </React.Fragment>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right: Selected Role Detail */}
          <Grid item xs={12} sm={8}>
            {selectedRole ? (() => {
              const meta = ROLE_META[selectedRole.name] || { icon: '👤', color: '#546e7a', bg: '#eceff1' };
              return (
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `2px solid ${meta.color}33` }}>
                  {/* Header */}
                  <Box sx={{ p: 3, background: `linear-gradient(135deg, ${meta.color}, ${meta.color}bb)`, color: 'white' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                        {meta.icon}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="h5" fontWeight="bold">{selectedRole.description || selectedRole.name}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>{selectedRole.name} • {selectedRole.user_count || 0} users assigned</Typography>
                      </Box>
                      <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 2, py: 1 }}>
                        <Typography variant="h4" fontWeight="bold">{selectedRole.modules?.length || 0}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Modules</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Module Grid */}
                  <Box p={2.5}>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Click any module to toggle access for this role:
                    </Typography>
                    <Grid container spacing={1.5}>
                      {modules.map(mod => {
                        const hasAccess = selectedRole.modules?.includes(mod.key);
                        const isSaving = saving === `${selectedRole.id}-${mod.key}`;
                        return (
                          <Grid item xs={6} sm={4} key={mod.key}>
                            <Card onClick={() => !isSaving && togglePermission(selectedRole, mod.key)} sx={{
                              cursor: 'pointer', borderRadius: 2.5, transition: 'all 0.2s',
                              border: hasAccess ? `2px solid ${meta.color}` : '2px solid #e0e0e0',
                              bgcolor: hasAccess ? meta.bg : 'white',
                              opacity: isSaving ? 0.5 : 1,
                              '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                            }}>
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                <Box sx={{
                                  width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 18, bgcolor: hasAccess ? meta.color + '18' : '#f5f5f5'
                                }}>
                                  {MODULE_ICONS[mod.key] || '📁'}
                                </Box>
                                <Box flex={1}>
                                  <Typography fontSize={12.5} fontWeight={hasAccess ? 'bold' : 400} color={hasAccess ? meta.color : 'text.secondary'}>
                                    {mod.label}
                                  </Typography>
                                </Box>
                                {hasAccess ? (
                                  <CheckCircle sx={{ fontSize: 20, color: meta.color }} />
                                ) : (
                                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px dashed #ccc' }} />
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                </Paper>
              );
            })() : (
              <Paper sx={{ borderRadius: 3, p: 6, textAlign: 'center', bgcolor: '#fafafa', border: '2px dashed #e0e0e0' }}>
                <AdminPanelSettings sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Select a role from the left</Typography>
                <Typography variant="body2" color="text.disabled">to view and manage its module permissions</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
