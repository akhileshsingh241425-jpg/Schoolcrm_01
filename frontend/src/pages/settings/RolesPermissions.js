import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Grid, Button, Card, CardContent, Snackbar, Alert
} from '@mui/material';
import {
  AdminPanelSettings, People, Security, CheckCircle, Cancel
} from '@mui/icons-material';
import { authAPI } from '../../services/api';

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

export default function RolesPermissions() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [view, setView] = useState('matrix');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  useEffect(() => {
    authAPI.listRoles().then(r => setRoles(r.data.data || [])).catch(() => {});
    authAPI.listModules().then(r => setModules(r.data.data || [])).catch(() => {});
  }, []);

  const togglePermission = (role, moduleKey) => {
    const schoolHasIt = role.school_modules?.includes(moduleKey);
    const globalHasIt = role.global_modules?.includes(moduleKey) && !schoolHasIt;

    if (globalHasIt) {
      showSnack('This is a system default permission. Remove school override first, or contact super admin.', 'warning');
      return;
    }

    const newModules = schoolHasIt
      ? (role.modules || []).filter(m => m !== moduleKey)
      : [...(role.modules || []), moduleKey];

    setSaving(`${role.id}-${moduleKey}`);
    authAPI.updateRolePermissions(role.id, { modules: newModules })
      .then(() => {
        setRoles(prev => prev.map(r => r.id === role.id ? {
          ...r,
          modules: [...new Set([...newModules, ...(r.global_modules || [])])],
          school_modules: newModules
        } : r));
        setSaving(null);
      })
      .catch(() => { showSnack('Failed to update', 'error'); setSaving(null); });
  };

  const totalUsers = roles.reduce((s, r) => s + (r.user_count || 0), 0);

  const groupedRoles = {};
  roles.forEach(r => {
    const cat = ROLE_META[r.name]?.cat || 'Other';
    if (!groupedRoles[cat]) groupedRoles[cat] = [];
    groupedRoles[cat].push(r);
  });

  return (
    <Box>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>

      <Typography variant="h5" mb={1} fontWeight="bold">Roles & Permissions</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage module access for each role. Click any cell to toggle permission on/off.
      </Typography>

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

          <Grid item xs={12} sm={8}>
            {selectedRole ? (() => {
              const meta = ROLE_META[selectedRole.name] || { icon: '👤', color: '#546e7a', bg: '#eceff1' };
              return (
                <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `2px solid ${meta.color}33` }}>
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
