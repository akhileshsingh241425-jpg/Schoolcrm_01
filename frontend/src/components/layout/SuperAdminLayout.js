import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Divider, useTheme, useMediaQuery, Chip, alpha, Tooltip, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Alert,
  Popover,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, School, People, Star, Receipt,
  Settings, Logout, AdminPanelSettings, BarChart, Security,
  ManageAccounts, Notifications, ChevronLeft, Circle, Group, Search, Close
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import { superAdminAPI } from '../../services/api';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'OVERVIEW', items: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/super-admin' },
  ]},
  { label: 'SCHOOLS', items: [
    { text: 'All Schools', icon: <School />, path: '/super-admin/schools' },
    { text: 'Create School', icon: <School fontSize="small" />, path: '/super-admin/schools/create' },
  ]},
  { label: 'SUBSCRIPTIONS', items: [
    { text: 'Plans', icon: <Star />, path: '/super-admin/plans' },
    { text: 'Subscriptions', icon: <Receipt />, path: '/super-admin/subscriptions' },
  ]},
  { label: 'USERS & ACCESS', items: [
    { text: 'Manage Users', icon: <ManageAccounts />, path: '/super-admin/users' },
    { text: 'Platform Staff', icon: <Group />, path: '/super-admin/staff' },
  ]},
  { label: 'SYSTEM', items: [
    { text: 'System Settings', icon: <Settings />, path: '/super-admin/settings' },
    { text: 'Audit Logs', icon: <Security />, path: '/super-admin/audit' },
  ]},
];

export default function SuperAdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, school, logout, switchSchool, clearSchool } = useAuthStore();

  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError] = useState('');
  const [switchSuccess, setSwitchSuccess] = useState('');

  const handleSwitchSchool = async () => {
    if (!schoolCode.trim()) { setSwitchError('Please enter a school code'); return; }
    setSwitchLoading(true); setSwitchError(''); setSwitchSuccess('');
    try {
      await switchSchool(schoolCode.trim());
      setSwitchSuccess(`Switched to ${schoolCode.trim().toUpperCase()}`);
      setSchoolCode('');
      setTimeout(() => setSwitchDialogOpen(false), 1000);
    } catch (err) {
      setSwitchError(err.response?.data?.message || 'Failed to switch school');
    } finally { setSwitchLoading(false); }
  };

  const handleClearSchool = () => {
    clearSchool();
    setSwitchDialogOpen(false);
    setSchoolCode('');
    setSwitchSuccess('');
  };

  // Notification state
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await superAdminAPI.notifications({ limit: 10 });
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unread_count || 0);
    } catch { /* silent */ }
    setNotifLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); const t = setInterval(fetchNotifications, 30000); return () => clearInterval(t); }, [fetchNotifications]);

  const handleNotifClick = (e) => { setNotifAnchor(e.currentTarget); fetchNotifications(); };
  const handleNotifClose = () => setNotifAnchor(null);

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/super-admin') return location.pathname === '/super-admin';
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Logo / Brand */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <AdminPanelSettings sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.2}>
            Super Admin
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.45)">
            Control Panel
          </Typography>
        </Box>
        {isMobile && (
          <IconButton sx={{ ml: 'auto', color: 'rgba(255,255,255,0.6)' }} onClick={() => setMobileOpen(false)}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      {/* Admin Badge */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{
          borderRadius: 2, p: 1.5,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', gap: 1.5
        }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 13, fontWeight: 700 }}>
            {user?.first_name?.[0] || 'S'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} color="#fff" noWrap>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.5)" noWrap>
              {user?.email}
            </Typography>
          </Box>
          <Circle sx={{ ml: 'auto', fontSize: 8, color: '#10b981', flexShrink: 0 }} />
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5 }}>
        {navItems.map((group) => (
          <Box key={group.label} mb={1}>
            <Typography variant="caption" sx={{ px: 1, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 1 }}>
              {group.label}
            </Typography>
            <List dense disablePadding sx={{ mt: 0.5 }}>
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                      sx={{
                        borderRadius: 2, px: 1.5, py: 1,
                        bgcolor: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        transition: 'all 0.15s',
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: 36, color: active ? '#818cf8' : 'rgba(255,255,255,0.4)',
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: 13.5, fontWeight: active ? 600 : 400,
                          color: active ? '#e0e7ff' : 'rgba(255,255,255,0.65)',
                        }}
                      />
                      {active && (
                        <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: '#6366f1', ml: 1 }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

      {/* Bottom: Go to Main App + Logout */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <ListItemButton
          onClick={() => navigate('/dashboard')}
          sx={{ borderRadius: 2, px: 1.5, py: 0.9, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.4)' }}>
            <BarChart />
          </ListItemIcon>
          <ListItemText primary="Main App" primaryTypographyProps={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }} />
        </ListItemButton>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, px: 1.5, py: 0.9, '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' } }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(239,68,68,0.7)' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 13, color: 'rgba(239,68,68,0.75)' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Sidebar - desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH, flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Sidebar - mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#fff',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: 'text.secondary' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettings sx={{ color: '#6366f1' }} />
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Super Admin Panel
              </Typography>
            </Box>
            <Chip
              label="SUPER ADMIN"
              size="small"
              sx={{
                ml: 1, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1',
                fontWeight: 700, fontSize: 10, letterSpacing: 0.5,
              }}
            />

            {/* School Switcher */}
            <Tooltip title={school ? `Viewing: ${school.name} (${school.code})` : 'No school selected - click to switch'}>
              <Chip
                icon={<School sx={{ fontSize: 14 }} />}
                label={school ? `${school.name} (${school.code})` : 'Select School'}
                size="small"
                onClick={() => setSwitchDialogOpen(true)}
                sx={{
                  ml: 1.5,
                  bgcolor: school ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                  color: school ? '#059669' : '#d97706',
                  fontWeight: 600, fontSize: 11,
                  '&:hover': { bgcolor: school ? alpha('#10b981', 0.2) : alpha('#f59e0b', 0.2) },
                  cursor: 'pointer',
                  maxWidth: 220,
                  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                }}
              />
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton onClick={handleNotifClick}>
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <Notifications sx={{ color: 'text.secondary' }} />
                </Badge>
              </IconButton>
            </Tooltip>
            <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={handleNotifClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { width: 360, maxHeight: 480, borderRadius: 3, mt: 1, overflow: 'hidden' } }}>
              <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                {unreadCount > 0 && <Chip label={`${unreadCount} new`} size="small" color="primary" sx={{ fontWeight: 600 }} />}
              </Box>
              <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                    <Notifications sx={{ fontSize: 40, color: alpha('#000', 0.15), mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                  </Box>
                ) : notifications.map((n, i) => (
                  <React.Fragment key={n.id}>
                    {i > 0 && <Divider />}
                    <Box sx={{ px: 2, py: 1.5, '&:hover': { bgcolor: alpha('#6366f1', 0.04) }, transition: 'background 0.15s' }}>
                      <Typography variant="subtitle2" fontWeight={600} fontSize={13}>{n.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>{n.message}</Typography>
                      <Typography variant="caption" color="text.disabled" fontSize={11}>{timeAgo(n.created_at)}</Typography>
                    </Box>
                  </React.Fragment>
                ))}
              </Box>
              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Button size="small" onClick={() => { handleNotifClose(); navigate('/super-admin/audit'); }} sx={{ textTransform: 'none', fontSize: 12 }}>
                  View All Activity
                </Button>
              </Box>
            </Popover>

            {/* Avatar Menu */}
            <Tooltip title="Account">
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: '#6366f1', fontSize: 14, fontWeight: 700 }}>
                  {user?.first_name?.[0] || 'S'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
                <Typography fontWeight={600} fontSize={14}>{user?.first_name} {user?.last_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/dashboard'); }}>
                <ListItemIcon><BarChart fontSize="small" /></ListItemIcon>
                Main App
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }} sx={{ color: 'error.main' }}>
                <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          <Outlet />
        </Box>
      </Box>

      {/* School Switcher Dialog */}
      <Dialog open={switchDialogOpen} onClose={() => { setSwitchDialogOpen(false); setSwitchError(''); setSwitchSuccess(''); }}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 440, width: '100%', p: 1 } }}>
        <DialogTitle sx={{ pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Switch School</Typography>
            <Typography variant="body2" color="text.secondary">Enter a school code to view its data</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setSwitchDialogOpen(false); setSwitchError(''); setSwitchSuccess(''); }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {school && (
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 3, bgcolor: alpha('#10b981', 0.08), border: '1px solid', borderColor: alpha('#10b981', 0.2) }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>CURRENT SCHOOL</Typography>
              <Typography variant="subtitle2" fontWeight={700} mt={0.5}>{school.name}</Typography>
              <Typography variant="caption" color="text.secondary">Code: {school.code}</Typography>
            </Box>
          )}
          <TextField fullWidth label="School Code" placeholder="e.g. SPS" value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSwitchSchool()}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 1.5 }}
          />
          {switchError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{switchError}</Alert>}
          {switchSuccess && <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>{switchSuccess}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {school && (
            <Button onClick={handleClearSchool} color="warning" variant="outlined" size="small"
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              Clear Context
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => { setSwitchDialogOpen(false); setSwitchError(''); setSwitchSuccess(''); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleSwitchSchool} variant="contained" disabled={switchLoading}
            startIcon={switchLoading ? <CircularProgress size={18} /> : <Search />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {switchLoading ? 'Switching...' : 'Switch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
