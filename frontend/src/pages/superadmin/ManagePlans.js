import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, IconButton, Switch,
  FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, Alert
} from '@mui/material';
import { Add, Edit, Delete, Star } from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

const ALL_FEATURES = [
  'student_management', 'staff_management', 'fee_management', 'attendance',
  'communication', 'marketing_crm', 'admission', 'academic', 'reports',
  'inventory', 'transport', 'library', 'parent_engagement', 'health_safety',
  'hostel', 'canteen', 'sports'
];

export default function ManagePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', monthly_price: '', yearly_price: '',
    max_students: '', max_staff: '', features: [], is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    superAdminAPI.listPlans()
      .then(res => setPlans(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', monthly_price: '', yearly_price: '',
      max_students: '', max_staff: '', features: [], is_active: true });
    setDialog(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      name: plan.name, description: plan.description || '',
      monthly_price: plan.monthly_price || '', yearly_price: plan.yearly_price || '',
      max_students: plan.max_students || '', max_staff: plan.max_staff || '',
      features: plan.features || [], is_active: plan.is_active !== false,
    });
    setDialog(true);
  };

  const toggleFeature = (feat) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(feat)
        ? prev.features.filter(f => f !== feat)
        : [...prev.features, feat]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        monthly_price: parseFloat(form.monthly_price) || 0,
        yearly_price: parseFloat(form.yearly_price) || 0,
        max_students: parseInt(form.max_students) || 0,
        max_staff: parseInt(form.max_staff) || 0,
      };
      if (editing) {
        await superAdminAPI.updatePlan(editing.id, data);
      } else {
        await superAdminAPI.createPlan(data);
      }
      setDialog(false);
      fetchPlans();
    } catch { }
    setSaving(false);
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Deactivate plan "${plan.name}"?`)) return;
    await superAdminAPI.deletePlan(plan.id);
    fetchPlans();
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
          Subscription Plans
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}>Add Plan</Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {plans.map(plan => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card sx={{
                borderRadius: 3, position: 'relative',
                border: plan.name === 'Premium' ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}>
                {!plan.is_active && (
                  <Chip label="Inactive" color="error" size="small" sx={{ position: 'absolute', top: 12, right: 12 }} />
                )}
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={700} mb={1}>{plan.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>{plan.description}</Typography>

                  <Box mb={2}>
                    <Typography variant="h4" fontWeight={800} color="primary">
                      ₹{plan.monthly_price?.toLocaleString()}
                      <Typography component="span" variant="body2" color="text.secondary">/month</Typography>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{plan.yearly_price?.toLocaleString()}/year
                    </Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2"><strong>Max Students:</strong> {plan.max_students?.toLocaleString()}</Typography>
                    <Typography variant="body2"><strong>Max Staff:</strong> {plan.max_staff?.toLocaleString()}</Typography>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" fontWeight={600} mb={1}>Features:</Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(plan.features || []).map(f => (
                        <Chip key={f} label={f.replace(/_/g, ' ')} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>

                  <Box display="flex" gap={1}>
                    <Button size="small" startIcon={<Edit />} onClick={() => openEdit(plan)}>Edit</Button>
                    <Button size="small" startIcon={<Delete />} color="error" onClick={() => handleDelete(plan)}>
                      Deactivate
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Plan Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Plan Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel control={
                <Switch checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              } label="Active" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Monthly Price (₹)" type="number" value={form.monthly_price}
                onChange={e => setForm({ ...form, monthly_price: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Yearly Price (₹)" type="number" value={form.yearly_price}
                onChange={e => setForm({ ...form, yearly_price: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Max Students" type="number" value={form.max_students}
                onChange={e => setForm({ ...form, max_students: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Max Staff" type="number" value={form.max_staff}
                onChange={e => setForm({ ...form, max_staff: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} mb={1}>Select Features:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {ALL_FEATURES.map(f => (
                  <Chip key={f} label={f.replace(/_/g, ' ')} size="small"
                    color={form.features.includes(f) ? 'primary' : 'default'}
                    onClick={() => toggleFeature(f)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
