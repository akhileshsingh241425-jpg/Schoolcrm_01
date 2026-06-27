import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Tooltip, Alert,
  Switch, FormControlLabel, Snackbar, CircularProgress, Select, MenuItem,
  FormControl, InputLabel
} from '@mui/material';
import {
  Add, Edit, Delete, Security, CheckCircle, Block, Refresh, Save
} from '@mui/icons-material';
import { rolesAPI } from '../../services/api';

const LEVEL_COLORS = {
  none: 'default', view: 'info', create: 'warning', edit: 'primary', delete: 'error', full: 'success'
};

const LEVEL_LABELS = {
  none: 'No Access', view: 'View Only', create: 'View + Create',
  edit: 'View + Edit', delete: 'View + Delete', full: 'Full Access'
};

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRole, setEditRole] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', display_name: '', description: '', permissions: {}
  });

  const msg = (m, s = 'success') => setSnack({ open: true, message: m, severity: s });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, modulesRes] = await Promise.all([
        rolesAPI.listRoles(),
        rolesAPI.getModules()
      ]);
      setRoles(rolesRes.data.data || []);
      setModules(modulesRes.data.data?.modules || []);
    } catch {
      msg('Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInitDefaults = async () => {
    try {
      const res = await rolesAPI.initDefaults();
      msg(res.data.message || 'Default roles created');
      fetchData();
    } catch (e) {
      msg(e.response?.data?.message || 'Failed', 'error');
    }
  };

  const openCreate = () => {
    setEditRole(null);
    const defaultPerms = {};
    modules.forEach(m => { defaultPerms[m.key] = 'none'; });
    setForm({ name: '', display_name: '', description: '', permissions: defaultPerms });
    setDialogOpen(true);
  };

  const openEdit = (role) => {
    setEditRole(role);
    const perms = { ...role.permissions };
    modules.forEach(m => { if (!perms[m.key]) perms[m.key] = 'none'; });
    setForm({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permissions: perms
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() && !editRole) {
      msg('Role name is required', 'error'); return;
    }
    setSaving(true);
    try {
      if (editRole) {
        await rolesAPI.updateRole(editRole.id, form);
        msg('Role updated');
      } else {
        await rolesAPI.createRole(form);
        msg('Role created');
      }
      setDialogOpen(false);
      fetchData();
    } catch (e) {
      msg(e.response?.data?.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.display_name}"?`)) return;
    try {
      await rolesAPI.deleteRole(role.id);
      msg('Role deleted');
      fetchData();
    } catch (e) {
      msg(e.response?.data?.message || 'Cannot delete', 'error');
    }
  };

  const setPermLevel = (moduleKey, level) => {
    setForm(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [moduleKey]: level }
    }));
  };

  const setAllPermissions = (level) => {
    const perms = {};
    modules.forEach(m => { perms[m.key] = level; });
    setForm(prev => ({ ...prev, permissions: perms }));
  };

  if (loading) return <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" gap={1}>
            <Security color="primary" /> Roles & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create custom roles and assign module-level permissions
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleInitDefaults}>
            Load Default Roles
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Create Role
          </Button>
        </Box>
      </Box>

      {roles.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No custom roles found. Click "Load Default Roles" to get started with pre-built templates (IT Admin, HR Manager, Data Operator, Accountant, Receptionist).
        </Alert>
      )}

      <Grid container spacing={2}>
        {roles.map(role => (
          <Grid item xs={12} md={6} lg={4} key={role.id}>
            <Card sx={{ borderRadius: 2, height: '100%', borderLeft: role.is_system ? '4px solid #6366f1' : '4px solid #10b981' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{role.display_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(role)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    {!role.is_system && (
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(role)}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Box mt={1.5} display="flex" flexWrap="wrap" gap={0.5}>
                  {Object.entries(role.permissions || {}).filter(([, v]) => v !== 'none').map(([mod, level]) => (
                    <Chip key={mod} label={`${mod}: ${level}`} size="small" color={LEVEL_COLORS[level]} variant="outlined" sx={{ fontSize: 10 }} />
                  ))}
                  {Object.values(role.permissions || {}).every(v => v === 'none') && (
                    <Typography variant="caption" color="text.secondary">No permissions assigned</Typography>
                  )}
                </Box>
                {role.is_system && <Chip label="System Role" size="small" sx={{ mt: 1 }} color="primary" variant="outlined" />}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editRole ? `Edit: ${editRole.display_name}` : 'Create New Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {!editRole && (
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Role Key (unique)" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="e.g. it_admin" />
              </Grid>
            )}
            <Grid item xs={12} sm={editRole ? 6 : 4}>
              <TextField fullWidth size="small" label="Display Name" value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                placeholder="e.g. IT Admin" />
            </Grid>
            <Grid item xs={12} sm={editRole ? 6 : 4}>
              <TextField fullWidth size="small" label="Description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description" />
            </Grid>
          </Grid>

          <Box mt={3} mb={1} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>Module Permissions</Typography>
            <Box display="flex" gap={1}>
              <Button size="small" variant="outlined" onClick={() => setAllPermissions('view')}>All View</Button>
              <Button size="small" variant="outlined" color="success" onClick={() => setAllPermissions('full')}>All Full</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setAllPermissions('none')}>All None</Button>
            </Box>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: '35%' }}>Module</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Permission Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map(m => (
                  <TableRow key={m.key} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{m.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={form.permissions[m.key] || 'none'}
                          onChange={e => setPermLevel(m.key, e.target.value)}
                        >
                          {Object.entries(LEVEL_LABELS).map(([val, label]) => (
                            <MenuItem key={val} value={val}>{label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={<Save />}>
            {saving ? 'Saving...' : (editRole ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
