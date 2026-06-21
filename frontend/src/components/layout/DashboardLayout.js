import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, SwipeableDrawer, AppBar, Toolbar, Typography, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, Menu, MenuItem,
  Divider, useTheme, useMediaQuery, Chip, alpha, Tooltip, InputBase, Badge,
  Popover, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Collapse, CircularProgress, Paper
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, People, School, PersonAdd, Campaign,
  EventNote, AttachMoney, CalendarMonth, Announcement, Assessment,
  Inventory, DirectionsBus, LocalLibrary, Settings, Logout,
  FamilyRestroom, HealthAndSafety, Hotel, Restaurant, SportsBasketball,
  CloudUpload, Search, NotificationsNoneOutlined, Palette, Close,
  ChildCare, AdminPanelSettings, Star, Receipt, Brush, Payment, Group,
  KeyboardArrowDown, KeyboardArrowUp, Book, Class, Schedule, MenuBook,
  Email, Sms, Message, Assignment, Edit, Lock, AccountBalance, Store, RateReview,
  ArrowUpward, SwapHoriz, TrendingUp, FactCheck, AutoGraph,
  Timeline, HowToVote, TaskAlt, Checklist
} from '@mui/icons-material';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import api, { noticesAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LOGO_CRM = '/assets/images/logo-crm.svg';
const DRAWER_WIDTH = 264;

const menuGroups = [
  {
    label: 'Main',
    role: ['school_admin', 'super_admin', 'principal'],
    items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', module: 'dashboard' },
      { text: 'Principal View', icon: <Assessment />, path: '/principal-dashboard', module: 'dashboard', role: ['principal', 'school_admin', 'super_admin'] },
      { text: 'Exam Controller', icon: <EventNote />, path: '/exam-controller', module: 'academics', role: ['principal', 'school_admin', 'super_admin', 'exam_controller'] },
      { text: 'Date Sheet Approval', icon: <CalendarMonth />, path: '/date-sheet-approval', module: 'academics', role: ['principal', 'school_admin', 'super_admin'] },
      { text: 'Grace Marks', icon: <Star />, path: '/grace-marks', module: 'academics', role: ['principal', 'school_admin', 'super_admin'] },
      { text: 'Academic Control', icon: <MenuBook />, path: '/academic-controller', module: 'academics', role: ['principal', 'school_admin', 'super_admin', 'academic_controller'] },
      { text: 'Staff Positions', icon: <AdminPanelSettings />, path: '/staff-positions', module: 'staff', role: ['principal', 'school_admin', 'super_admin'] },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students', role: ['school_admin', 'super_admin', 'principal'] },
      { text: 'Staff', icon: <School />, path: '/staff', feature: 'staff_management', module: 'staff', role: ['school_admin', 'super_admin', 'principal'] },
      { text: 'Parents', icon: <FamilyRestroom />, path: '/parents', feature: 'parent_engagement', module: 'parents', role: ['school_admin', 'super_admin', 'principal'] },
    ],
  },
  {
    label: 'Academic',
    role: ['teacher'],
    items: [
      { text: 'My Dashboard', icon: <Dashboard />, path: '/teacher/dashboard' },
      { text: 'My Classes', icon: <Class />, path: '/teacher/classes' },
      { text: 'Attendance', icon: <CalendarMonth />, path: '/attendance' },
      { text: 'My Timetable', icon: <Schedule />, path: '/teacher/timetable' },
      { text: 'Student Subjects', icon: <MenuBook />, path: '/teacher/class-subjects' },
      { text: 'Subjects & Syllabus', icon: <Book />, path: '/teacher/subjects' },
    ],
  },
  {
    label: 'Exams & Marks',
    role: ['teacher'],
    items: [
      { text: 'Marks Entry', icon: <RateReview />, path: '/teacher/marks-entry' },
      { text: 'Question Papers', icon: <Assignment />, path: '/teacher/question-papers' },
      { text: 'Invigilator Duty', icon: <EventNote />, path: '/teacher/invigilator-duty' },
      { text: 'Performance Analytics', icon: <Star />, path: '/teacher/analytics' },
    ],
  },
  {
    label: 'Assignments',
    role: ['teacher'],
    items: [
      { text: 'My Assignments', icon: <Assignment />, path: '/teacher/assignments' },
    ],
  },
  {
    label: 'Communication',
    role: ['teacher'],
    items: [
      { text: 'Send SMS/Email', icon: <Sms />, path: '/teacher/communication' },
      { text: 'Create Announcements', icon: <Announcement />, path: '/teacher/announcements' },
      { text: 'Message History', icon: <Message />, path: '/teacher/messages' },
      { text: 'Parent Contacts', icon: <People />, path: '/teacher/parents' },
    ],
  },
  {
    label: 'Library',
    role: ['teacher'],
    items: [
      { text: 'Browse Books', icon: <LocalLibrary />, path: '/teacher/library' },
    ],
  },
  {
    label: 'My Account',
    role: ['teacher'],
    items: [
      { text: 'My Profile', icon: <Edit />, path: '/teacher/profile' },
      { text: 'My Leave', icon: <CalendarMonth />, path: '/teacher/leave' },
      { text: 'Payroll', icon: <AccountBalance />, path: '/teacher/payroll' },
    ],
  },
  {
    label: 'Academic',
    role: ['school_admin', 'super_admin', 'principal'],
    items: [
      { text: 'Academics', icon: <EventNote />, path: '/academics', feature: 'academic', module: 'academics' },
      { text: 'Attendance', icon: <CalendarMonth />, path: '/attendance', feature: 'attendance', module: 'attendance' },
      { text: 'Library', icon: <LocalLibrary />, path: '/library', feature: 'library', module: 'library' },
      { text: 'Classes & Sections', icon: <Group />, path: '/academics/classes', feature: 'academic', module: 'academics' },
    ],
  },
  {
    label: 'Finance & CRM',
    role: ['school_admin', 'super_admin', 'principal'],
    items: [
      { text: 'Fees', icon: <AttachMoney />, path: '/fees', feature: 'fee_management', module: 'fees' },
      { text: 'Leads (CRM)', icon: <Campaign />, path: '/leads', feature: 'marketing_crm', module: 'leads' },
      { text: 'Admissions', icon: <PersonAdd />, path: '/admissions', feature: 'admission', module: 'admissions' },
    ],
  },
  {
    label: 'Services',
    role: ['school_admin', 'super_admin', 'principal'],
    items: [
      { text: 'Transport', icon: <DirectionsBus />, path: '/transport', feature: 'transport', module: 'transport' },
      { text: 'Hostel', icon: <Hotel />, path: '/hostel', feature: 'hostel', module: 'hostel' },
      { text: 'Canteen', icon: <Restaurant />, path: '/canteen', feature: 'canteen', module: 'canteen' },
      { text: 'Health & Safety', icon: <HealthAndSafety />, path: '/health', feature: 'health_safety', module: 'health' },
      { text: 'Sports', icon: <SportsBasketball />, path: '/sports', feature: 'sports', module: 'sports' },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory', feature: 'inventory', module: 'inventory' },
      { text: 'Store Room', icon: <Store />, path: '/store', module: 'inventory', role: ['school_admin', 'super_admin', 'principal'] },
    ],
  },
  {
    label: 'Admin',
    role: ['school_admin', 'super_admin', 'principal'],
    items: [
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
      { text: 'Data Import', icon: <CloudUpload />, path: '/data-import', module: 'data_import' },
      { text: 'School Branding', icon: <Brush />, path: '/school-branding', module: 'settings' },
      { text: 'Payment Gateway', icon: <Payment />, path: '/payment-settings', module: 'settings' },
      { text: 'Settings', icon: <Settings />, path: '/settings', module: 'settings' },
    ],
  },
  {
    label: 'Super Admin',
    superAdminOnly: true,
    items: [
      { text: 'Super Admin Panel', icon: <AdminPanelSettings />, path: '/super-admin' },
    ],
  },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [colorAnchor, setColorAnchor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', message: '', target_audience: 'all' });
  const [noticeSaving, setNoticeSaving] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const seenEmergencyIds = React.useRef(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  const { user, school, features, logout } = useAuthStore();
  const hasModule = useAuthStore(s => s.hasModule);
  const hasRole = useAuthStore(s => s.hasRole);
  const { colorPresets, selectedColor, setColor } = useThemeStore();

  const PRIMARY = theme.palette.primary.main;
  const SECONDARY = theme.palette.secondary.main;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Search handler
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await api.get('/global/search', { params: { q: query } });
      setSearchResults(res.data?.data || []);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { if (searchQuery.length >= 2) handleSearch(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await api.get('/global/notifications', { params: { limit: 20 } });
      const data = res.data?.data || {};
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadCount(data.unread_count || 0);
      // Detect a new UNREAD emergency alert → auto-popup with sound
      const emergency = list.find(n =>
        !n.read_at && typeof n.title === 'string' && n.title.includes('[EMERGENCY]')
        && !seenEmergencyIds.current.has(n.id)
      );
      if (emergency) {
        seenEmergencyIds.current.add(emergency.id);
        setEmergencyAlert(emergency);
        playAlarm();
      }
    } catch { setNotifications([]); setUnreadCount(0); }
    finally { setNotifLoading(false); }
  }, []);

  // Play an attention-grabbing alarm tone using the Web Audio API (no asset needed)
  const playAlarm = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      let t = ctx.currentTime;
      // 3 rising beeps
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(660 + i * 220, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.34);
        t += 0.4;
      }
      setTimeout(() => ctx.close().catch(() => {}), 1600);
    } catch {}
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // poll every 30s for new notices
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const canPostNotice = ['principal', 'school_admin', 'super_admin', 'exam_controller', 'academic_controller'].includes(user?.role?.name);

  const handleBroadcastNotice = async () => {
    if (!noticeForm.title.trim()) { toast.error('Title required'); return; }
    setNoticeSaving(true);
    try {
      const res = await noticesAPI.broadcast(noticeForm);
      const n = res.data?.data?.notified_users ?? 0;
      toast.success(`Notice sent to ${n} users`);
      setNoticeOpen(false);
      setNoticeForm({ title: '', message: '', target_audience: 'all' });
      loadNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notice');
    } finally { setNoticeSaving(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/global/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/global/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch {}
  };
  const isSuperAdmin = user?.role?.name === 'super_admin';
  const isParent = user?.role?.name === 'parent';
  const isStudent = user?.role?.name === 'student';
  const isExamController = user?.role?.name === 'exam_controller';

  const isVisible = (item) => {
    if (item.feature && !features.includes(item.feature)) return false;
    if (item.module && !hasModule(item.module)) return false;
    if (item.role && !hasRole(...item.role)) return false;
    return true;
  };

  const parentMenuGroups = [
    { label: 'Parent Portal', items: [
      { text: 'My Children', icon: <ChildCare />, path: '/my-children', module: 'dashboard' },
      { text: 'Exams & Results', icon: <Assessment />, path: '/parent-exams', module: 'dashboard' },
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', module: 'dashboard' },
    ] },
  ];

  const studentMenuGroups = [
    { label: 'Student Portal', items: [
      { text: 'My Portal', icon: <Dashboard />, path: '/my-portal', module: 'dashboard' },
      { text: 'My Exams', icon: <EventNote />, path: '/student-exams', module: 'dashboard' },
    ] },
  ];

  const librarianMenuGroups = [
    { label: 'Library', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Library', icon: <LocalLibrary />, path: '/library', feature: 'library', module: 'library' },
      { text: 'Books', icon: <MenuBook />, path: '/library', feature: 'library', module: 'library' },
    ] },
  ];

  const storeManagerMenuGroups = [
    { label: 'Store Room', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/store' },
      { text: 'Stock Items', icon: <Inventory />, path: '/store/items' },
      { text: 'Issue Items', icon: <ArrowUpward />, path: '/store/allocate' },
      { text: 'Receive Returns', icon: <SwapHoriz />, path: '/store/returns' },
      { text: 'Stock Entry', icon: <Edit />, path: '/store/stock' },
      { text: 'Issue Register', icon: <Receipt />, path: '/store/transactions' },
    ] },
  ];

  const examControllerMenuGroups = [
    { label: 'Exam Management', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Exam Controller', icon: <EventNote />, path: '/exam-controller' },
      { text: 'Marks Entry', icon: <RateReview />, path: '/exam-controller/marks-entry-dashboard' },
      { text: 'Date Sheet Approval', icon: <CalendarMonth />, path: '/date-sheet-approval' },
      { text: 'Invigilator Duty', icon: <Assignment />, path: '/exam-controller/invigilator-duty' },
      { text: 'Grace Marks', icon: <Star />, path: '/grace-marks' },
    ] },
    { label: 'Academic', items: [
      { text: 'Academics', icon: <MenuBook />, path: '/academics', feature: 'academic', module: 'academics' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
    ] },
  ];

  const academicControllerMenuGroups = [
    { label: 'Main', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Academic Control', icon: <MenuBook />, path: '/academic-controller', tab: '' },
    ] },
    { label: 'Curriculum & Timetable', items: [
      { text: 'Subjects', icon: <Book />, path: '/academic-controller', tab: 'subjects' },
      { text: 'Timetable', icon: <Schedule />, path: '/academic-controller', tab: 'timetable' },
      { text: 'Substitutions', icon: <SwapHoriz />, path: '/academic-controller', tab: 'substitutions' },
      { text: 'Syllabus Progress', icon: <TrendingUp />, path: '/academic-controller', tab: 'syllabus' },
      { text: 'Promotions', icon: <ArrowUpward />, path: '/academic-controller', tab: 'promotions' },
    ] },
    { label: 'Staff & Students', items: [
      { text: 'Teacher Assignment', icon: <Assignment />, path: '/academic-controller', tab: 'teachers' },
      { text: 'Class Teachers', icon: <AdminPanelSettings />, path: '/academic-controller', tab: 'class-teachers' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Staff', icon: <School />, path: '/staff', feature: 'staff_management', module: 'staff' },
      { text: 'Classes & Sections', icon: <Group />, path: '/academics/classes', feature: 'academic', module: 'academics' },
    ] },
    { label: 'Exams & Assessment', items: [
      { text: 'Exam Controller', icon: <EventNote />, path: '/exam-controller' },
      { text: 'Marks Entry', icon: <RateReview />, path: '/exam-controller/marks-entry-dashboard' },
      { text: 'Date Sheet', icon: <CalendarMonth />, path: '/exam-controller', view: 'datesheet' },
      { text: 'Grace Marks', icon: <Star />, path: '/grace-marks' },
    ] },
    { label: 'Reports & Planning', items: [
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
      { text: 'Academic Calendar', icon: <CalendarMonth />, path: '/academic-controller', tab: 'calendar' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const accountantMenuGroups = [
    { label: 'Finance', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Fees', icon: <AttachMoney />, path: '/fees', feature: 'fee_management', module: 'fees' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
    ] },
  ];

  const counselorMenuGroups = [
    { label: 'Counseling', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const receptionistMenuGroups = [
    { label: 'Front Desk', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Visitors', icon: <People />, path: '/visitors', feature: 'health_safety', module: 'health' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const transportManagerMenuGroups = [
    { label: 'Transport', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Transport', icon: <DirectionsBus />, path: '/transport', feature: 'transport', module: 'transport' },
    ] },
  ];

  const genericStaffMenuGroups = [
    { label: 'Staff Portal', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const hrManagerMenuGroups = [
    { label: 'HR Management', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Staff', icon: <School />, path: '/staff', feature: 'staff_management', module: 'staff' },
      { text: 'Attendance', icon: <CalendarMonth />, path: '/attendance', feature: 'attendance', module: 'attendance' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const departmentHeadMenuGroups = [
    { label: 'Academic', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Academics', icon: <EventNote />, path: '/academics', feature: 'academic', module: 'academics' },
      { text: 'Attendance', icon: <CalendarMonth />, path: '/attendance', feature: 'attendance', module: 'attendance' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
      { text: 'Library', icon: <LocalLibrary />, path: '/library', feature: 'library', module: 'library' },
    ] },
  ];

  const healthOfficerMenuGroups = [
    { label: 'Health & Safety', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Health', icon: <HealthAndSafety />, path: '/health', feature: 'health_safety', module: 'health' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
    ] },
  ];

  const canteenManagerMenuGroups = [
    { label: 'Canteen', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Canteen', icon: <Restaurant />, path: '/canteen', feature: 'canteen', module: 'canteen' },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory', feature: 'inventory', module: 'inventory' },
      { text: 'Reports', icon: <Assessment />, path: '/reports', feature: 'reports', module: 'reports' },
    ] },
  ];

  const sportsInchargeMenuGroups = [
    { label: 'Sports', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Sports', icon: <SportsBasketball />, path: '/sports', feature: 'sports', module: 'sports' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Health', icon: <HealthAndSafety />, path: '/health', feature: 'health_safety', module: 'health' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const labAssistantMenuGroups = [
    { label: 'Lab', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory', feature: 'inventory', module: 'inventory' },
      { text: 'Academics', icon: <EventNote />, path: '/academics', feature: 'academic', module: 'academics' },
    ] },
  ];

  const hostelWardenMenuGroups = [
    { label: 'Hostel Management', items: [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      { text: 'Hostel', icon: <Hotel />, path: '/hostel', feature: 'hostel', module: 'hostel' },
      { text: 'Students', icon: <People />, path: '/students', feature: 'student_management', module: 'students' },
      { text: 'Attendance', icon: <CalendarMonth />, path: '/attendance', feature: 'attendance', module: 'attendance' },
      { text: 'Health', icon: <HealthAndSafety />, path: '/health', feature: 'health_safety', module: 'health' },
      { text: 'Communication', icon: <Announcement />, path: '/communication', feature: 'communication', module: 'communication' },
    ] },
  ];

  const isAcademicController = user?.role?.name === 'academic_controller';
  const isLibrarian = user?.role?.name === 'librarian';
  const isStoreManager = user?.role?.name === 'store_manager';
  const roleName = user?.role?.name;

  const roleMenuMap = {
    accountant: accountantMenuGroups,
    counselor: counselorMenuGroups,
    receptionist: receptionistMenuGroups,
    transport_manager: transportManagerMenuGroups,
    staff: genericStaffMenuGroups,
    hr_manager: hrManagerMenuGroups,
    department_head: departmentHeadMenuGroups,
    health_officer: healthOfficerMenuGroups,
    canteen_manager: canteenManagerMenuGroups,
    sports_incharge: sportsInchargeMenuGroups,
    lab_assistant: labAssistantMenuGroups,
    hostel_warden: hostelWardenMenuGroups,
  };

  const activeMenuGroups = isParent
    ? parentMenuGroups
    : isStudent
      ? studentMenuGroups
      : isExamController
        ? examControllerMenuGroups
        : isAcademicController
          ? academicControllerMenuGroups
          : isLibrarian
            ? librarianMenuGroups
            : isStoreManager
              ? storeManagerMenuGroups
              : roleMenuMap[roleName] || menuGroups;

  const matchNavItem = (item) => {
    if (!location.pathname.startsWith(item.path)) return false;
    if (item.tab !== undefined) {
      const expectedSearch = item.tab ? `?tab=${item.tab}` : '';
      return location.search === expectedSearch || (item.tab === '' && !location.search);
    }
    if (item.view !== undefined) {
      return location.search === `?view=${item.view}`;
    }
    return true;
  };

  const currentPage = activeMenuGroups
    .flatMap(g => g.items)
    .find(matchNavItem)?.text || 'Dashboard';

  const toggleGroup = (label) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const schoolLogo = school?.branding?.logo_url;
  const themeColor = school?.branding?.theme_color || PRIMARY;

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
      {/* School Brand Header */}
      <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {schoolLogo ? (
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, overflow: 'hidden', bgcolor: '#f8fafc',
            p: 0.5, flexShrink: 0, border: `2px solid ${alpha(themeColor, 0.2)}` }}>
            <img src={schoolLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
        ) : (
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, overflow: 'hidden',
            boxShadow: `0 4px 14px ${alpha(PRIMARY, 0.15)}` }}>
            <img src={LOGO_CRM} alt="School CRM" style={{ width: '100%', height: '100%' }} />
          </Box>
        )}
        <Box sx={{ overflow: 'hidden', flex: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3 }}>
            {school?.name || 'School CRM'}
          </Typography>
          <Chip label={school?.plan || 'basic'} size="small"
            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, mt: 0.3,
              bgcolor: alpha(themeColor, 0.1), color: themeColor,
              textTransform: 'uppercase', letterSpacing: '0.05em' }} />
        </Box>
      </Box>

      <Box sx={{ mx: 2, mb: 1 }}>
        <Box sx={{ height: 1, bgcolor: '#e2e8f0' }} />
      </Box>

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1.5, py: 0.5,
        '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 2 } }}>
        {activeMenuGroups.map((group) => {
          if (group.superAdminOnly && !isSuperAdmin) return null;
          if (group.role && !hasRole(...group.role)) return null;
          const visibleItems = group.superAdminOnly ? group.items : group.items.filter(isVisible);
          if (visibleItems.length === 0) return null;
          const isCollapsed = collapsedGroups[group.label];
          const hasActive = visibleItems.some(i => location.pathname.startsWith(i.path));
          return (
            <Box key={group.label} sx={{ mb: 0.5 }}>
              <Box onClick={() => toggleGroup(group.label)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 1.5, py: 0.8, cursor: 'pointer', borderRadius: 2, userSelect: 'none',
                  '&:hover': { bgcolor: alpha('#f1f5f9', 0.8) } }}>
                <Typography variant="overline"
                  sx={{ color: hasActive ? PRIMARY : '#94a3b8',
                    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {group.label}
                </Typography>
                {isCollapsed
                  ? <KeyboardArrowDown sx={{ fontSize: 14, color: '#94a3b8' }} />
                  : <KeyboardArrowUp sx={{ fontSize: 14, color: '#94a3b8' }} />}
              </Box>
              <Collapse in={!isCollapsed}>
                <List disablePadding>
                  {visibleItems.map((item) => {
                    const isActive = matchNavItem(item);
                    const navTarget = item.path + (
                      item.tab !== undefined ? (item.tab ? `?tab=${item.tab}` : '') :
                      item.view !== undefined ? `?view=${item.view}` : ''
                    );
                    return (
                      <ListItem key={item.text} disablePadding sx={{ mb: 0.2 }}>
                        <ListItemButton onClick={() => { navigate(navTarget); if (isMobile) setMobileOpen(false); }}
                          sx={{ borderRadius: 2.5, py: 0.85, px: 1.5,
                            bgcolor: isActive ? alpha(PRIMARY, 0.08) : 'transparent',
                            color: isActive ? PRIMARY : '#475569',
                            '&:hover': { bgcolor: isActive ? alpha(PRIMARY, 0.12) : '#f1f5f9', color: isActive ? PRIMARY : '#1e293b' },
                            transition: 'all 0.2s ease', position: 'relative' }}>
                          <ListItemIcon sx={{ minWidth: 34,
                            color: isActive ? PRIMARY : '#94a3b8',
                            '& .MuiSvgIcon-root': { fontSize: 19 } }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primary={item.text}
                            primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isActive ? 600 : 400 }} />
                          {isActive && <Box sx={{ width: 3, height: 18, borderRadius: 2,
                            bgcolor: PRIMARY, position: 'absolute', right: 4 }} />}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* User section */}
      <Box sx={{ mx: 2, mb: 0.5 }}>
        <Box sx={{ height: 1, bgcolor: '#e2e8f0' }} />
      </Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36,
          background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
          fontSize: '0.85rem', fontWeight: 700 }}>
          {user?.first_name?.[0] || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Typography variant="body2" noWrap sx={{ color: '#1e293b', fontWeight: 600, fontSize: '0.8rem' }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: '#94a3b8', fontSize: '0.68rem', textTransform: 'capitalize' }}>
            {user?.role?.name?.replace(/_/g, ' ')}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton size="small" onClick={() => { logout(); navigate('/login'); }}
            sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.08) } }}>
            <Logout sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* AppBar */}
      <AppBar position="fixed" elevation={0}
        sx={{ zIndex: theme.zIndex.drawer + 1,
          backgroundColor: alpha('#ffffff', 0.85), backdropFilter: 'blur(12px)',
          color: 'text.primary', borderBottom: '1px solid', borderColor: alpha('#e2e8f0', 0.8),
          ml: { md: `${DRAWER_WIDTH}px` }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
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

          {/* Search */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', position: 'relative',
            bgcolor: alpha('#f1f5f9', 0.8), borderRadius: 3, px: 1.5, py: 0.5, mr: 2, width: 260,
            border: '1px solid', borderColor: 'transparent',
            transition: 'all 0.2s', '&:focus-within': { borderColor: alpha(PRIMARY, 0.3), bgcolor: '#fff', width: 320 } }}>
            <Search sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
            <InputBase placeholder="Search students, staff, subjects..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              sx={{ fontSize: '0.85rem', flex: 1 }} />
            {searchLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
            {/* Search Results Dropdown */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 0.5, zIndex: 9999, maxHeight: 320, overflow: 'auto', borderRadius: 2 }}>
                {searchResults.map((r, i) => (
                  <Box key={i} onClick={() => { navigate(r.path); setSearchQuery(''); setSearchResults([]); }}
                    sx={{ px: 2, py: 1.2, cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                      '&:hover': { bgcolor: '#f8fafc' }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip label={r.type} size="small" sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize',
                      bgcolor: r.type === 'student' ? '#dbeafe' : r.type === 'staff' ? '#dcfce7' : r.type === 'subject' ? '#fef3c7' : '#f1f5f9',
                      color: r.type === 'student' ? '#1d4ed8' : r.type === 'staff' ? '#15803d' : r.type === 'subject' ? '#92400e' : '#475569' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{r.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.subtitle}</Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
              <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 0.5, zIndex: 9999, borderRadius: 2, p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No results found</Typography>
              </Paper>
            )}
          </Box>

          {isSmall && (
            <IconButton onClick={() => setSearchOpen(true)} sx={{ mr: 0.5 }}>
              <Search sx={{ fontSize: 22 }} />
            </IconButton>
          )}

          <Tooltip title="Theme Color">
            <IconButton onClick={(e) => setColorAnchor(e.currentTarget)} sx={{ mr: { xs: 0, sm: 0.5 } }}>
              <Palette sx={{ fontSize: { xs: 20, sm: 22 }, color: PRIMARY }} />
            </IconButton>
          </Tooltip>
          <Popover open={Boolean(colorAnchor)} anchorEl={colorAnchor} onClose={() => setColorAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { borderRadius: 4, mt: 1, border: '1px solid', borderColor: 'divider',
              boxShadow: `0 12px 40px ${alpha(PRIMARY, 0.15)}` } }}>
            <Box sx={{ p: 2.5, width: 240 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Theme Color</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>Choose your accent color</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
                {colorPresets.map((preset) => (
                  <Tooltip title={preset.name} key={preset.name} arrow>
                    <IconButton onClick={() => { setColor(preset); setColorAnchor(null); }}
                      sx={{ width: 38, height: 38,
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                        border: selectedColor.name === preset.name ? '3px solid #fff' : '2px solid transparent',
                        boxShadow: selectedColor.name === preset.name
                          ? `0 0 0 2px ${preset.primary}, 0 4px 12px ${alpha(preset.primary, 0.4)}`
                          : `0 2px 8px ${alpha(preset.primary, 0.3)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'scale(1.15)',
                          background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
                          boxShadow: `0 0 0 2px ${preset.primary}, 0 4px 12px ${alpha(preset.primary, 0.4)}` } }} />
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Popover>

          <Tooltip title="Notifications">
            <IconButton onClick={(e) => { setNotifAnchor(e.currentTarget); loadNotifications(); }} sx={{ mr: { xs: 0, sm: 0.5 } }}>
              <Badge badgeContent={unreadCount} color="error" max={9}>
                <NotificationsNoneOutlined sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </Badge>
            </IconButton>
          </Tooltip>
          {canPostNotice && (
            <Tooltip title="Post Notice">
              <IconButton onClick={() => setNoticeOpen(true)} sx={{ mr: { xs: 0, sm: 0.5 } }}>
                <Campaign sx={{ fontSize: { xs: 20, sm: 22 }, color: PRIMARY }} />
              </IconButton>
            </Tooltip>
          )}
          <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, maxHeight: 420, borderRadius: 3, mt: 1, border: '1px solid #e2e8f0' } }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
              {unreadCount > 0 && (
                <Chip label="Mark all read" size="small" onClick={handleMarkAllRead}
                  sx={{ fontSize: '0.7rem', height: 24, cursor: 'pointer', '&:hover': { bgcolor: '#e2e8f0' } }} />
              )}
            </Box>
            <Box sx={{ maxHeight: 340, overflow: 'auto' }}>
              {notifLoading ? (
                <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
                </Box>
              ) : notifications.map(n => (
                <Box key={n.id} onClick={() => handleMarkRead(n.id)}
                  sx={{ px: 2, py: 1.5, cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                    bgcolor: n.read_at ? 'transparent' : alpha(PRIMARY, 0.03),
                    '&:hover': { bgcolor: '#f8fafc' } }}>
                  <Typography variant="body2" fontWeight={n.read_at ? 400 : 600} sx={{ fontSize: '0.82rem' }}>{n.title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>{n.message}</Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', mt: 0.5, display: 'block' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Popover>

          {/* Post Notice Dialog */}
          <Dialog open={noticeOpen} onClose={() => setNoticeOpen(false)} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
              <Campaign sx={{ color: PRIMARY }} /> Post a Notice
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                This notice will appear in the notification bell of all selected recipients.
              </Typography>
              <TextField fullWidth label="Title" value={noticeForm.title} sx={{ mb: 2 }} autoFocus
                onChange={e => setNoticeForm(f => ({ ...f, title: e.target.value }))} />
              <TextField fullWidth label="Message" value={noticeForm.message} multiline rows={4} sx={{ mb: 2 }}
                onChange={e => setNoticeForm(f => ({ ...f, message: e.target.value }))} />
              <TextField select fullWidth label="Send To" value={noticeForm.target_audience}
                onChange={e => setNoticeForm(f => ({ ...f, target_audience: e.target.value }))}>
                <MenuItem value="all">Everyone</MenuItem>
                <MenuItem value="teachers">Teachers</MenuItem>
                <MenuItem value="students">Students</MenuItem>
                <MenuItem value="parents">Parents</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </TextField>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setNoticeOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
              <Button variant="contained" onClick={handleBroadcastNotice} disabled={noticeSaving}
                startIcon={noticeSaving ? <CircularProgress size={16} color="inherit" /> : <Campaign />}
                sx={{ textTransform: 'none', fontWeight: 600 }}>
                {noticeSaving ? 'Sending...' : 'Broadcast'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* EMERGENCY ALERT — auto-opens with sound */}
          <Dialog open={Boolean(emergencyAlert)} onClose={() => {}} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: 4, border: '3px solid #ef4444', overflow: 'hidden' } }}>
            <Box sx={{ bgcolor: '#ef4444', color: '#fff', p: 2, textAlign: 'center',
              animation: 'emgPulse 1s ease-in-out infinite',
              '@keyframes emgPulse': { '0%,100%': { bgcolor: '#ef4444' }, '50%': { bgcolor: '#b91c1c' } } }}>
              <Typography variant="h4" sx={{ mb: 0.5 }}>🚨</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '0.05em' }}>EMERGENCY ALERT</Typography>
            </Box>
            <DialogContent sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                {emergencyAlert?.title?.replace('[EMERGENCY]', '').replace('🚨', '').trim()}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                {emergencyAlert?.message}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                {emergencyAlert?.created_at ? new Date(emergencyAlert.created_at).toLocaleString() : ''}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
              <Button variant="outlined" color="error" onClick={() => playAlarm()}
                sx={{ textTransform: 'none', fontWeight: 600 }}>🔊 Replay Sound</Button>
              <Button variant="contained" color="error"
                onClick={() => { if (emergencyAlert) handleMarkRead(emergencyAlert.id); setEmergencyAlert(null); }}
                sx={{ textTransform: 'none', fontWeight: 700, px: 4 }}>
                Acknowledge
              </Button>
            </DialogActions>
          </Dialog>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{ width: 36, height: 36,
              background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
              fontSize: '0.85rem', fontWeight: 700 }}>
              {user?.first_name?.[0] || 'U'}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { width: 240, mt: 1, borderRadius: 3, border: '1px solid',
              borderColor: 'divider', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
            <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 44, height: 44,
                background: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})`,
                fontSize: '1rem', fontWeight: 700 }}>
                {user?.first_name?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{user?.first_name} {user?.last_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </Box>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }} sx={{ py: 1.2, mx: 1, borderRadius: 2, mt: 0.5 }}>
              <Settings sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2">Settings</Typography>
            </MenuItem>
            <MenuItem onClick={() => { logout(); navigate('/login'); }} sx={{ py: 1.2, mx: 1, borderRadius: 2, mb: 0.5, color: 'error.main' }}>
              <Logout sx={{ mr: 1.5, fontSize: 20 }} />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <SwipeableDrawer variant="temporary" open={mobileOpen}
            onOpen={() => setMobileOpen(true)} onClose={handleDrawerToggle} disableBackdropTransition
            sx={{ '& .MuiDrawer-paper': { width: { xs: '85vw', sm: DRAWER_WIDTH }, maxWidth: DRAWER_WIDTH,
              border: 'none', bgcolor: '#ffffff' } }}>
            {drawer}
          </SwipeableDrawer>
        ) : (
          <Drawer variant="permanent"
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', bgcolor: '#ffffff',
              boxShadow: '1px 0 8px rgba(0,0,0,0.04)' } }} open>
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main */}
      <Box component="main"
        sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2, md: 3 },
          mt: { xs: '56px', sm: '64px' },
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)' },
          maxWidth: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, width: '100%', overflow: 'hidden' }}>
        <Outlet />
      </Box>

      {/* Mobile Search */}
      <Dialog open={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }} fullWidth maxWidth="sm"
        PaperProps={{ sx: { position: 'fixed', top: 0, m: 0, borderRadius: '0 0 16px 16px', width: '100%', maxWidth: '100%' } }}>
        <DialogContent sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search sx={{ color: 'text.secondary' }} />
            <InputBase placeholder="Search students, staff, subjects..." autoFocus fullWidth
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              sx={{ fontSize: '1rem' }} />
            {searchLoading && <CircularProgress size={18} />}
            <IconButton size="small" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}><Close /></IconButton>
          </Box>
          {searchResults.length > 0 && (
            <Box sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
              {searchResults.map((r, i) => (
                <Box key={i} onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                  sx={{ px: 1, py: 1, cursor: 'pointer', borderBottom: '1px solid #f1f5f9', '&:hover': { bgcolor: '#f8fafc' }, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip label={r.type} size="small" sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{r.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.subtitle}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
