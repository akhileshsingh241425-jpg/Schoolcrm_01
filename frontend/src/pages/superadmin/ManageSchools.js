import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, TextField, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Switch, FormControlLabel,
  InputAdornment, CircularProgress, MenuItem, Select, FormControl, InputLabel, Alert
} from '@mui/material';
import { Search, Edit, ToggleOn, Visibility, Business } from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

const ALL_FEATURES = [
  'student_management', 'staff_management', 'fee_management', 'attendance',
  'communication', 'marketing_crm', 'admission', 'academic', 'reports',
  'inventory', 'transport', 'library', 'parent_engagement', 'health_safety',
  'hostel', 'canteen', 'sports'
];

export default function ManageSchools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editDialog, setEditDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [featureDialog, setFeatureDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [features, setFeatures] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchSchools = useCallback(() => {
    setLoading(true);
    superAdminAPI.listSchools({ search, plan: planFilter, status: statusFilter, page })
      .then(res => {
        const d = res.data.data;
        setSchools(d.items || d);
        setTotal(d.total || 0);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [search, planFilter, statusFilter, page]);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const handleEdit = (school) => {
    setSelected(school);
    setEditForm({ ...school });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await superAdminAPI.updateSchool(selected.id, editForm);
      setEditDialog(false);
      fetchSchools();
    } catch { }
    setSaving(false);
  };

  const handleToggle = async (school) => {
    await superAdminAPI.toggleSchool(school.id);
    fetchSchools();
  };

  const handleViewDetail = async (school) => {
    const res = await superAdminAPI.getSchool(school.id);
    setSelected(res.data.data);
    setDetailDialog(true);
  };

  const handleFeatures = (school) => {
    setSelected(school);
    const featureMap = {};
    ALL_FEATURES.forEach(f => featureMap[f] = false);
    (school.features || []).forEach(f => { if (f.is_enabled) featureMap[f.feature_name] = true; });
    setFeatures(featureMap);
    setFeatureDialog(true);
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    try {
      await superAdminAPI.updateFeatures(selected.id, { features });
      setFeatureDialog(false);
      fetchSchools();
    } catch { }
    setSaving(false);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
        Manage Schools
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" placeholder="Search schools..."
                value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select value={planFilter} label="Plan" onChange={e => setPlanFilter(e.target.value)}>
                  <MenuItem value="">All Plans</MenuItem>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>School</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Max Students</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schools.map(school => (
                  <TableRow key={school.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {school.logo_url ? (
                          <img src={school.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <Business sx={{ fontSize: 32, color: 'text.secondary' }} />
                        )}
                        <Box>
                          <Typography fontWeight={600}>{school.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{school.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={school.code} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Chip label={school.plan?.toUpperCase()} size="small"
                        color={school.plan === 'premium' ? 'secondary' : school.plan === 'standard' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{school.max_students}</TableCell>
                    <TableCell>
                      <Chip label={school.is_active ? 'Active' : 'Inactive'} size="small"
                        color={school.is_active ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>{school.created_at?.split('T')[0]}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewDetail(school)} title="View Details">
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleEdit(school)} title="Edit">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleToggle(school)} title="Toggle Status"
                        color={school.is_active ? 'error' : 'success'}>
                        <ToggleOn fontSize="small" />
                      </IconButton>
                      <Button size="small" onClick={() => handleFeatures(school)}>Features</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit School</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {['name', 'email', 'phone', 'city', 'state', 'pincode', 'website'].map(field => (
              <Grid item xs={6} key={field}>
                <TextField fullWidth size="small" label={field.charAt(0).toUpperCase() + field.slice(1)}
                  value={editForm[field] || ''} onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                />
              </Grid>
            ))}
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Plan</InputLabel>
                <Select value={editForm.plan || 'basic'} label="Plan"
                  onChange={e => setEditForm({ ...editForm, plan: e.target.value })}>
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Max Students" type="number"
                value={editForm.max_students || ''} onChange={e => setEditForm({ ...editForm, max_students: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Max Staff" type="number"
                value={editForm.max_staff || ''} onChange={e => setEditForm({ ...editForm, max_staff: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>School Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Name</Typography>
                <Typography fontWeight={600}>{selected.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Code</Typography>
                <Typography fontWeight={600}>{selected.code}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Students</Typography>
                <Typography fontWeight={600}>{selected.student_count || 0} / {selected.max_students}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Staff</Typography>
                <Typography fontWeight={600}>{selected.staff_count || 0} / {selected.max_staff}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Plan</Typography>
                <Chip label={selected.plan?.toUpperCase()} color="primary" size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label={selected.is_active ? 'Active' : 'Inactive'} color={selected.is_active ? 'success' : 'error'} size="small" />
              </Grid>
              {selected.current_subscription && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Current Plan: {selected.current_subscription.plan?.name} |
                    Amount: ₹{selected.current_subscription.amount?.toLocaleString()} |
                    Valid till: {selected.current_subscription.end_date}
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Features Dialog */}
      <Dialog open={featureDialog} onClose={() => setFeatureDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Features - {selected?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {ALL_FEATURES.map(f => (
              <Grid item xs={6} key={f}>
                <FormControlLabel
                  control={<Switch checked={features[f] || false}
                    onChange={e => setFeatures({ ...features, [f]: e.target.checked })} />}
                  label={f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeatureDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFeatures} disabled={saving}>Save Features</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
