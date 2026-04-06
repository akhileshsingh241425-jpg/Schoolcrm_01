import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, SwipeableDrawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Divider, useTheme, useMediaQuery, Chip, alpha, Tooltip, InputBase, Badge,
  Popover, Dialog, DialogContent
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, School, PersonAdd, Campaign,
  EventNote, AttachMoney, CalendarMonth, Announcement, Assessment,
  Inventory, DirectionsBus, LocalLibrary, Settings, Logout,
  FamilyRestroom, HealthAndSafety, Hotel, Restaurant, SportsBasketball,
  CloudUpload, Search, NotificationsNoneOutlined, Palette, Close,
  ChildCare
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const DRAWER_WIDTH = 270;

const menuGroups = [
  {
    label: 'Main',
    items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', module: 'dashboard' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Staff', icon: <School />, path: '/staff', feature: 'staff_management', module: 'staff' },
      { text: 'Parents', icon: <FamilyRestroom />, path: '/parents', feature: 'parent_engagement', module: 'parents' },
    ],
  },
  {
    label: 'Academic',
    items: [
      { text: 'Academics', icon: <EventNote />, path: '/academics', feature: 'academic', module: 'academics' },
      { text: 'Attendance', icon: <CalendarMonth />, path: '/attendance', feature: 'attendance', module: 'attendance' },
      { text: 'Library', icon: <LocalLibrary />, path: '/library', feature: 'library', module: 'library' },
    ],
  },
  {
    label: 'Finance & CRM',
    items: [
      { text: 'Fees', icon: <AttachMoney />, path: '/fees', feature: 'fee_management', module: 'fees' },
      { text: 'Leads (CRM)', icon: <Campaign />, path: '/leads', feature: 'marketing_crm', module: 'leads' },
      { text: 'Admissions', icon: <PersonAdd />, path: '/admissions', feature: 'admission', module: 'admissions' },
    ],
  },
  {
    label: 'Services',
    items: [
      { text: 'Transport', icon: <DirectionsBus />, path: '/transport', feature: 'transport', module: 'transport' },
      { text: 'Hostel', icon: <Hotel />, path: '/hostel', feature: 'hostel', module: 'hostel' },
      { text: 'Canteen', icon: <Restaurant />, path: '/canteen', feature: 'canteen', module: 'canteen' },
      { text: 'Health & Safety', icon: <HealthAndSafety />, path: '/health', feature: 'health_safety', module: 'health' },
      { text: 'Sports', icon: <SportsBasketball />, path: '/sports', feature: 'sports', module: 'sports' },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory', feature: 'inventory', module: 'inventory' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
      { text: 'Data Import', icon: <CloudUpload />, path: '/data-import', module: 'data_import' },
      { text: 'Settings', icon: <Settings />, path: '/settings', module: 'settings' },
    ],
  },
];

const SIDEBAR_BG = '#0f172a';
const SIDEBAR_HOVER = 'rgba(255,255,255,0.06)';
const SIDEBAR_TEXT = 'rgba(255,255,255,0.7)';

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, school, features, logout } = useAuthStore();
  const hasModule = useAuthStore(s => s.hasModule);
  const { colorPresets, selectedColor, setColor } = useThemeStore();

  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;
  const SIDEBAR_ACTIVE = alpha(PRIMARY, 0.15);
  const SIDEBAR_TEXT_ACTIVE = theme.palette.primary.light;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const isVisible = (item) => {
    if (item.feature && !features.includes(item.feature)) return false;
    if (item.module && !hasModule(item.module)) return false;
    return true;
  };

  const isParent = user?.role?.name === 'parent';

  const parentMenuGroups = [
    {
      label: 'Parent Portal',
      items: [
        { text: 'My Children', icon: <ChildCare />, path: '/my-children', module: 'dashboard' },
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', module: 'dashboard' },
      ],
    },
  ];

  const activeMenuGroups = isParent ? parentMenuGroups : menuGroups;

  const currentPage = activeMenuGroups
    .flatMap(g => g.items)
    .find(i => location.pathname.startsWith(i.path))?.text || 'Dashboard';

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: SIDEBAR_BG }}>
      {/* Logo / Brand */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2.5,
          background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 14px ${alpha(PRIMARY, 0.4)}`,
        }}>
          <School sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
            {school?.name || 'School CRM'}
          </Typography>
          <Chip
            label={school?.plan || 'basic'}
            size="small"
            sx={{
              height: 20, fontSize: '0.65rem', fontWeight: 700,
              bgcolor: alpha(PRIMARY, 0.2), color: theme.palette.primary.light,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              mt: 0.3,
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.5, py: 1, '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 } }}>
        {activeMenuGroups.map((group) => {
          const visibleItems = group.items.filter(isVisible);
          if (visibleItems.length === 0) return null;
          return (
            <Box key={group.label} sx={{ mb: 1 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  px: 1.5,
                  py: 1,
                  display: 'block',
                  letterSpacing: '0.1em',
                }}
              >
                {group.label}
              </Typography>
              <List disablePadding>
                {visibleItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        onClick={() => {
                          navigate(item.path);
                          if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 0.9,
                          px: 1.5,
                          bgcolor: isActive ? SIDEBAR_ACTIVE : 'transparent',
                          color: isActive ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                          '&:hover': {
                            bgcolor: isActive ? SIDEBAR_ACTIVE : SIDEBAR_HOVER,
                            color: isActive ? SIDEBAR_TEXT_ACTIVE : '#fff',
                          },
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <ListItemIcon sx={{
                          minWidth: 36,
                          color: isActive ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                          '& .MuiSvgIcon-root': { fontSize: 20 },
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: isActive ? 600 : 400 }}
                        />
                        {isActive && (
                          <Box sx={{
                            width: 4, height: 20, borderRadius: 2,
                            bgcolor: PRIMARY,
                            position: 'absolute', right: 0,
                          }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* User section at bottom */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 36, height: 36,
          background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
          fontSize: '0.85rem', fontWeight: 700,
        }}>
          {user?.first_name?.[0] || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="body2" noWrap sx={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
            {user?.role?.name?.replace(/_/g, ' ')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: alpha('#ffffff', 0.8),
          backdropFilter: 'blur(8px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 2, md: 3 }, minHeight: { xs: 56, sm: 64 } }}>
          {isMobile && (
            <IconButton edge="start" onClick={handleDrawerToggle} sx={{ mr: 0.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              {currentPage}
            </Typography>
          </Box>

          {/* Desktop search bar */}
          <Box sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            bgcolor: '#f1f5f9',
            borderRadius: 2.5,
            px: 1.5, py: 0.5, mr: 2,
            width: 220,
          }}>
            <Search sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Search..." sx={{ fontSize: '0.85rem', flex: 1 }} />
          </Box>

          {/* Mobile search icon */}
          {isSmall && (
            <IconButton onClick={() => setSearchOpen(true)} sx={{ mr: 0.5 }}>
              <Search sx={{ fontSize: 22 }} />
            </IconButton>
          )}

          <Tooltip title="Theme Color">
            <IconButton onClick={(e) => setColorAnchor(e.currentTarget)} sx={{ mr: { xs: 0, sm: 1 } }}>
              <Palette sx={{ fontSize: { xs: 20, sm: 22 }, color: PRIMARY }} />
            </IconButton>
          </Tooltip>
          <Popover
            open={Boolean(colorAnchor)}
            anchorEl={colorAnchor}
            onClose={() => setColorAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { borderRadius: 4, mt: 1, border: '1px solid', borderColor: 'divider', boxShadow: `0 12px 40px ${alpha(PRIMARY, 0.15)}` } }}
          >
            <Box sx={{ p: 2.5, width: 240 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Theme Color</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Choose your accent color</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                {colorPresets.map((preset) => (
                  <Tooltip title={preset.name} key={preset.name} arrow>
                    <IconButton
                      onClick={() => { setColor(preset); setColorAnchor(null); }}
                      sx={{
                        width: 38, height: 38,
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                        border: selectedColor.name === preset.name ? '3px solid #fff' : '2px solid transparent',
                        boxShadow: selectedColor.name === preset.name
                          ? `0 0 0 2px ${preset.primary}, 0 4px 12px ${alpha(preset.primary, 0.4)}`
                          : `0 2px 8px ${alpha(preset.primary, 0.3)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                          boxShadow: `0 0 0 2px ${preset.primary}, 0 4px 12px ${alpha(preset.primary, 0.4)}`,
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Popover>

          <Tooltip title="Notifications">
            <IconButton sx={{ mr: { xs: 0, sm: 1 } }}>
              <Badge variant="dot" color="error">
                <NotificationsNoneOutlined sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{
              width: 36, height: 36,
              background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              fontSize: '0.85rem', fontWeight: 700,
            }}>
              {user?.first_name?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: { width: 220, mt: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>{user?.first_name} {user?.last_name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }} sx={{ py: 1.2 }}>
              <Settings sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2">Settings</Typography>
            </MenuItem>
            <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ py: 1.2, color: 'error.main' }}>
              <Logout sx={{ mr: 1.5, fontSize: 20 }} />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <SwipeableDrawer
            variant="temporary"
            open={mobileOpen}
            onOpen={() => setMobileOpen(true)}
            onClose={handleDrawerToggle}
            disableBackdropTransition
            sx={{
              '& .MuiDrawer-paper': {
                width: { xs: '85vw', sm: DRAWER_WIDTH },
                maxWidth: DRAWER_WIDTH,
                border: 'none',
                bgcolor: SIDEBAR_BG,
              },
            }}
          >
            {drawer}
          </SwipeableDrawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                border: 'none',
                bgcolor: SIDEBAR_BG,
                boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          mt: { xs: '56px', sm: '64px' },
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          maxWidth: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile Search Dialog */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { position: 'fixed', top: 0, m: 0, borderRadius: '0 0 16px 16px', width: '100%', maxWidth: '100%' } }}>
        <DialogContent sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Search sx={{ color: 'text.secondary' }} />
          <InputBase placeholder="Search..." autoFocus fullWidth sx={{ fontSize: '1rem' }} />
          <IconButton size="small" onClick={() => setSearchOpen(false)}><Close /></IconButton>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
