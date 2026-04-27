import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, useTheme, alpha } from '@mui/material';
import { School } from '@mui/icons-material';
import useAuthStore from './store/authStore';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/students/Students';
import StudentDetail from './pages/students/StudentDetail';
import StudentForm from './pages/students/StudentForm';
import Staff from './pages/staff/Staff';
import StaffForm from './pages/staff/StaffForm';
import Leads from './pages/leads/Leads';
import LeadDetail from './pages/leads/LeadDetail';
import LeadForm from './pages/leads/LeadForm';
import Admissions from './pages/admissions/Admissions';
import Attendance from './pages/attendance/Attendance';
import Fees from './pages/fees/Fees';
import Academics from './pages/academics/Academics';
import Communication from './pages/communication/Communication';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Inventory from './pages/inventory/Inventory';
import Transport from './pages/transport/Transport';
import Library from './pages/library/Library';
import Parents from './pages/parents/Parents';
import Health from './pages/health/Health';
import Hostel from './pages/hostel/Hostel';
import Canteen from './pages/canteen/Canteen';
import Sports from './pages/sports/Sports';
import DataImport from './pages/settings/DataImport';
import ParentPortal from './pages/parents/ParentPortal';
import SchoolBranding from './pages/settings/SchoolBranding';
import PaymentSettings from './pages/settings/PaymentSettings';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import ManageSchools from './pages/superadmin/ManageSchools';
import ManagePlans from './pages/superadmin/ManagePlans';
import ManageSubscriptions from './pages/superadmin/ManageSubscriptions';
import ManageUsers from './pages/superadmin/ManageUsers';
import SystemSettings from './pages/superadmin/SystemSettings';
import AuditLogs from './pages/superadmin/AuditLogs';
import CreateSchool from './pages/superadmin/CreateSchool';

const { useEffect } = React;

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const theme = useTheme();
  if (isLoading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2, background: '#f8fafc' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}` }}>
        <School sx={{ color: '#fff', fontSize: 26 }} />
      </Box>
      <CircularProgress size={28} sx={{ color: theme.palette.primary.main }} />
    </Box>
  );
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function FeatureRoute({ feature, children }) {
  const { hasFeature } = useAuthStore();
  if (!hasFeature(feature)) return <Navigate to="/dashboard" />;
  return children;
}

function ModuleRoute({ module, feature, children }) {
  const { hasFeature, hasModule } = useAuthStore();
  if (feature && !hasFeature(feature)) return <Navigate to="/dashboard" />;
  if (module && !hasModule(module)) return <Navigate to="/dashboard" />;
  return children;
}

function SuperAdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role?.name !== 'super_admin') return <Navigate to="/dashboard" />;
  return children;
}

function AppLoading() {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2, background: '#f8fafc' }}>
      <Box sx={{ width: 56, height: 56, borderRadius: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`, animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } } }}>
        <School sx={{ color: '#fff', fontSize: 30 }} />
      </Box>
      <CircularProgress size={28} sx={{ color: theme.palette.primary.main, mt: 1 }} />
    </Box>
  );
}

function App() {
  const { loadUser, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return <AppLoading />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Student Management */}
        <Route path="students" element={<ModuleRoute module="students" feature="student_management"><Students /></ModuleRoute>} />
        <Route path="students/new" element={<ModuleRoute module="students" feature="student_management"><StudentForm /></ModuleRoute>} />
        <Route path="students/:id" element={<ModuleRoute module="students" feature="student_management"><StudentDetail /></ModuleRoute>} />
        <Route path="students/:id/edit" element={<ModuleRoute module="students" feature="student_management"><StudentForm /></ModuleRoute>} />
        
        {/* Staff Management */}
        <Route path="staff" element={<ModuleRoute module="staff" feature="staff_management"><Staff /></ModuleRoute>} />
        <Route path="staff/new" element={<ModuleRoute module="staff" feature="staff_management"><StaffForm /></ModuleRoute>} />
        
        {/* CRM */}
        <Route path="leads" element={<ModuleRoute module="leads" feature="marketing_crm"><Leads /></ModuleRoute>} />
        <Route path="leads/new" element={<ModuleRoute module="leads" feature="marketing_crm"><LeadForm /></ModuleRoute>} />
        <Route path="leads/:id" element={<ModuleRoute module="leads" feature="marketing_crm"><LeadDetail /></ModuleRoute>} />
        
        {/* Admissions */}
        <Route path="admissions" element={<ModuleRoute module="admissions" feature="admission"><Admissions /></ModuleRoute>} />
        
        {/* Attendance */}
        <Route path="attendance" element={<ModuleRoute module="attendance" feature="attendance"><Attendance /></ModuleRoute>} />
        
        {/* Fees */}
        <Route path="fees" element={<ModuleRoute module="fees" feature="fee_management"><Fees /></ModuleRoute>} />
        
        {/* Academics */}
        <Route path="academics" element={<ModuleRoute module="academics" feature="academic"><Academics /></ModuleRoute>} />
        
        {/* Communication */}
        <Route path="communication" element={<ModuleRoute module="communication" feature="communication"><Communication /></ModuleRoute>} />
        
        {/* Reports */}
        <Route path="reports" element={<ModuleRoute module="reports" feature="reports"><Reports /></ModuleRoute>} />
        
        {/* Modules with feature toggle */}
        <Route path="inventory" element={<ModuleRoute module="inventory" feature="inventory"><Inventory /></ModuleRoute>} />
        <Route path="transport" element={<ModuleRoute module="transport" feature="transport"><Transport /></ModuleRoute>} />
        <Route path="library" element={<ModuleRoute module="library" feature="library"><Library /></ModuleRoute>} />
        
        {/* Parent Engagement */}
        <Route path="parents" element={<ModuleRoute module="parents"><Parents /></ModuleRoute>} />
        
        {/* Health & Safety */}
        <Route path="health" element={<ModuleRoute module="health" feature="health_safety"><Health /></ModuleRoute>} />
        
        {/* Hostel Management */}
        <Route path="hostel" element={<ModuleRoute module="hostel" feature="hostel"><Hostel /></ModuleRoute>} />
        
        {/* Canteen Management */}
        <Route path="canteen" element={<ModuleRoute module="canteen" feature="canteen"><Canteen /></ModuleRoute>} />
        
        {/* Sports & Extra-Curricular */}
        <Route path="sports" element={<ModuleRoute module="sports" feature="sports"><Sports /></ModuleRoute>} />
        
        {/* Settings - admin only */}
        <Route path="settings" element={<ModuleRoute module="settings"><Settings /></ModuleRoute>} />
        
        {/* Parent Portal */}
        <Route path="my-children" element={<ParentPortal />} />

        {/* Data Import / Migration */}
        <Route path="data-import" element={<ModuleRoute module="data_import"><DataImport /></ModuleRoute>} />
        
        {/* School Branding */}
        <Route path="school-branding" element={<ModuleRoute module="settings"><SchoolBranding /></ModuleRoute>} />
        
        {/* Payment Gateway Settings */}
        <Route path="payment-settings" element={<ModuleRoute module="settings"><PaymentSettings /></ModuleRoute>} />
        
      </Route>

      {/* ─── Super Admin Panel (Separate Layout) ─── */}
      <Route path="/super-admin" element={
        <SuperAdminRoute>
          <SuperAdminLayout />
        </SuperAdminRoute>
      }>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="schools" element={<ManageSchools />} />
        <Route path="schools/create" element={<CreateSchool />} />
        <Route path="plans" element={<ManagePlans />} />
        <Route path="subscriptions" element={<ManageSubscriptions />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit" element={<AuditLogs />} />
      </Route>
    </Routes>
  );
}

export default App;
