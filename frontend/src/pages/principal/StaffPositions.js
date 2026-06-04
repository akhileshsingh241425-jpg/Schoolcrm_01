import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper, Chip, Avatar, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, alpha, useTheme, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert,
  Divider, Stack, InputAdornment
} from '@mui/material';
import {
  People, School, Edit, Refresh, Person, CheckCircle, Search,
  AdminPanelSettings, SwapHoriz, Close, Badge
} from '@mui/icons-material';
import { staffAPI, authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const KEY_POSITIONS = [
  { key: 'principal', label: 'Principal', icon: '👨‍💼', color: '#1e3a5f', description: 'School Head — Overall academic & administrative leadership' },
  { key: 'vice_principal', label: 'Vice Principal', icon: '👩‍💼', color: '#2d5a87', description: 'Discipline, daily operations, assists Principal' },
  { key: 'exam_controller', label: 'Exam Controller', icon: '📝', color: '#7c3aed', description: 'Exam scheduling, hall allocation, marks verification, result publication' },
  { key: 'academic_coordinator', label: 'Academic Coordinator', icon: '📚', color: '#2563eb', description: 'Curriculum planning, syllabus monitoring, teaching quality' },
  { key: 'hr_manager', label: 'HR Manager', icon: '👥', color: '#0891b2', description: 'Staff recruitment, attendance, leaves, payroll, appraisals' },
  { key: 'accountant', label: 'Accountant', icon: '💰', color: '#059669', description: 'Fee collection, expenses, salary disbursement, financial reports' },
  { key: 'librarian', label: 'Librarian', icon: '📖', color: '#b45309', description: 'Book catalog, issue/return, fines, reading programs' },
  { key: 'transport_manager', label: 'Transport Manager', icon: '🚌', color: '#dc2626', description: 'Routes, vehicles, drivers, GPS tracking, transport fees' },
  { key: 'sports_incharge', label: 'Sports Incharge (PTI)', icon: '⚽', color: '#16a34a', description: 'Sports teams, tournaments, fitness, events' },
  { key: 'hostel_warden', label: 'Hostel Warden', icon: '🏠', color: '#9333ea', description: 'Room allocation, mess, outpass, hostel discipline' },
  { key: 'health_officer', label: 'Health Officer / Nurse', icon: '🏥', color: '#e11d48', description: 'Student health records, infirmary, first aid, checkups' },
  { key: 'counselor', label: 'Counselor', icon: '🧠', color: '#7c3aed', description: 'Student counseling, career guidance, parent meetings' },
  { key: 'receptionist', label: 'Receptionist', icon: '📞', color: '#0d9488', description: 'Front office, enquiries, visitor management, calls' },
  { key: 'canteen_manager', label: 'Canteen Manager', icon: '🍽️', color: '#ca8a04', description: 'Menu planning, inventory, hygiene, wallet system' },
  { key: 'department_head', label: 'Department Head (HOD)', icon: '🎓', color: '#4f46e5', description: 'Subject department oversight, teacher mentoring' },
];

export default function StaffPositions() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialog, setAssignDialog] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or table
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadData = () => {
    setLoading(true);
    Promise.all([
      staffAPI.list({ status: 'active', per_page: 200 }).catch(() => ({ data: { data: { items: [] } } })),
      authAPI.listRoles().catch(() => ({ data: { data: [] } })),
    ]).then(([staffRes, rolesRes]) => {
      const sd = staffRes.data?.data;
      setStaff(Array.isArray(sd) ? sd : sd?.items || []);
      const rd = rolesRes.data?.data;
      setRoles(Array.isArray(rd) ? rd : []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const getPositionHolder = (posKey) => {
    const label = KEY_POSITIONS.find(p => p.key === posKey)?.label || '';
    return staff.find(s => {
      const des = (s.designation || '').toLowerCase();
      const lbl = label.toLowerCase();
      return des === lbl || des.includes(posKey.replace(/_/g, ' ')) || des.includes(lbl);
    });
  };

  const handleAssign = async () => {
    if (!selectedStaff || !assignDialog) return;
    setSaving(true);
    try {
      const pos = KEY_POSITIONS.find(p => p.key === assignDialog);
      await staffAPI.update(parseInt(selectedStaff), { designation: pos.label });

      const role = roles.find(r => r.name === assignDialog);
      if (role) {
        const staffMember = staff.find(s => s.id === parseInt(selectedStaff));
        if (staffMember?.email) {
          try {
            const usersRes = await authAPI.listUsers({ search: staffMember.email });
            const users = usersRes.data?.data?.items || [];
            if (users.length > 0) {
              await authAPI.updateUser(users[0].id, { role_id: role.id });
            }
          } catch {}
        }
      }

      toast.success(`${pos.label} position assigned successfully!`);
      setAssignDialog(null);
      setSelectedStaff('');
      setStaffSearch('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    if (!staffSearch) return true;
    const q = staffSearch.toLowerCase();
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      (s.employee_id || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q);
  });

  const assignedCount = KEY_POSITIONS.filter(p => getPositionHolder(p.key)).length;

  if (loading) return <LinearProgress />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Staff Positions & Roles</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Assign key positions to staff members. This determines their system access, dashboard, and responsibilities.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={`${assignedCount}/${KEY_POSITIONS.length} assigned`} color="primary" size="small" sx={{ fontWeight: 600 }} />
          <IconButton onClick={loadData}><Refresh /></IconButton>
        </Box>
      </Box>

      {/* Summary Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People sx={{ color: PRIMARY }} />
          <Typography variant="body2"><strong>{staff.length}</strong> Active Staff</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ color: '#10b981' }} />
          <Typography variant="body2"><strong>{assignedCount}</strong> Positions Filled</Typography>
        </Box>
        <Divider orientation="vertical" flexItem />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHoriz sx={{ color: '#f59e0b' }} />
          <Typography variant="body2"><strong>{KEY_POSITIONS.length - assignedCount}</strong> Vacant</Typography>
        </Box>
      </Paper>

      {/* Positions Grid */}
      <Grid container spacing={2}>
        {KEY_POSITIONS.map(pos => {
          const holder = getPositionHolder(pos.key);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={pos.key}>
              <Card sx={{
                borderRadius: 3, height: '100%', position: 'relative', overflow: 'visible',
                border: holder ? `1px solid ${alpha(pos.color, 0.3)}` : `1px dashed ${alpha('#94a3b8', 0.5)}`,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(pos.color, 0.15)}` },
              }}>
                {/* Color strip */}
                <Box sx={{ height: 4, bgcolor: pos.color, borderRadius: '12px 12px 0 0' }} />

                <CardContent sx={{ p: 2, pt: 1.5 }}>
                  {/* Position header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{pos.icon}</Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>{pos.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1.2, display: 'block' }} noWrap>
                        {pos.description}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Holder info */}
                  {holder ? (
                    <Box sx={{
                      p: 1.25, borderRadius: 2,
                      bgcolor: alpha(pos.color, 0.06),
                      border: `1px solid ${alpha(pos.color, 0.12)}`,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: pos.color, fontSize: '0.75rem', fontWeight: 700 }}>
                          {holder.first_name?.[0]}{holder.last_name?.[0]}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {holder.first_name} {holder.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {holder.employee_id} • {holder.department || 'Staff'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha('#f59e0b', 0.06), textAlign: 'center', border: `1px dashed ${alpha('#f59e0b', 0.3)}` }}>
                      <Typography variant="caption" color="#b45309" fontWeight={600}>⚠️ Vacant</Typography>
                    </Box>
                  )}

                  {/* Action */}
                  <Button fullWidth size="small"
                    variant={holder ? 'text' : 'contained'}
                    color={holder ? 'primary' : 'primary'}
                    startIcon={holder ? <SwapHoriz sx={{ fontSize: 14 }} /> : <Person sx={{ fontSize: 14 }} />}
                    onClick={() => { setAssignDialog(pos.key); setSelectedStaff(holder?.id?.toString() || ''); }}
                    sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                      ...(holder ? {} : { bgcolor: pos.color, '&:hover': { bgcolor: alpha(pos.color, 0.85) } })
                    }}>
                    {holder ? 'Change Person' : 'Assign Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onClose={() => { setAssignDialog(null); setStaffSearch(''); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>
                {KEY_POSITIONS.find(p => p.key === assignDialog)?.icon}
              </Typography>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Assign {KEY_POSITIONS.find(p => p.key === assignDialog)?.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {KEY_POSITIONS.find(p => p.key === assignDialog)?.description}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => { setAssignDialog(null); setStaffSearch(''); }}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" placeholder="Search staff by name, ID, department..."
            value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />

          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', borderRadius: 2 }}>
            {filteredStaff.map(s => (
              <Box key={s.id}
                onClick={() => setSelectedStaff(s.id.toString())}
                sx={{
                  p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                  borderBottom: '1px solid', borderColor: 'divider',
                  bgcolor: selectedStaff === s.id.toString() ? alpha(PRIMARY, 0.08) : 'transparent',
                  '&:hover': { bgcolor: alpha(PRIMARY, 0.04) },
                }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, fontSize: '0.8rem' }}>
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{s.first_name} {s.last_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.employee_id || '-'} • {s.designation || 'Staff'} • {s.department || '-'}
                  </Typography>
                </Box>
                {selectedStaff === s.id.toString() && (
                  <CheckCircle sx={{ color: PRIMARY, fontSize: 20 }} />
                )}
              </Box>
            ))}
            {filteredStaff.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No staff found</Typography>
              </Box>
            )}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAssignDialog(null); setStaffSearch(''); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={saving || !selectedStaff}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {saving ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
