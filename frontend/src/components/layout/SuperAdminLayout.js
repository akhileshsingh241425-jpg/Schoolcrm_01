import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Divider, useTheme, useMediaQuery, Chip, alpha, Tooltip, Badge
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, School, People, Star, Receipt,
  Settings, Logout, AdminPanelSettings, BarChart, Security,
  ManageAccounts, Notifications, ChevronLeft, Circle
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';

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
  const { user, logout } = useAuthStore();

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

            <Box sx={{ flex: 1 }} />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton>
                <Badge badgeContent={3} color="error">
                  <Notifications sx={{ color: 'text.secondary' }} />
                </Badge>
              </IconButton>
            </Tooltip>

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
    </Box>
  );
}
