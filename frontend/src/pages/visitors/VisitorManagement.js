import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Chip, IconButton, MenuItem, Avatar, InputAdornment, Tabs, Tab, Tooltip, Card, CardContent
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Add, Search, ExitToApp, Visibility, Print, People, Login, Logout,
  Block, CalendarToday, Refresh, Badge, DirectionsCar, Phone, Email
} from '@mui/icons-material';
import { healthAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { validateForm } from '../../components/Validation';

const ID_TYPES = [
  { value: 'aadhar', label: 'Aadhar Card' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
];

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'denied', label: 'Denied' },
];

const initialForm = {
  visitor_name: '',
  visitor_phone: '',
  visitor_email: '',
  id_type: '',
  id_number: '',
  purpose: '',
  visiting_person: '',
  visiting_department: '',
  badge_number: '',
  vehicle_number: '',
  items_carried: '',
  remarks: '',
};

export default function VisitorManagement() {
  const theme = useTheme();

  // State
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(dayjs().format('YYYY-MM-DD'));
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, checked_in: 0, checked_out: 0, denied: 0 });

  // Dialogs
  const [openCheckin, setOpenCheckin] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [form, setForm] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);

  // Fetch visitors
  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date: dateFilter };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await healthAPI.listVisitors(params);
      const data = res?.data?.data?.items || res?.data?.data || res?.data?.items || [];
      setVisitors(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load visitors');
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Compute stats from loaded visitors (for today)
  useEffect(() => {
    const todayVisitors = visitors;
    setStats({
      total: todayVisitors.length,
      checked_in: todayVisitors.filter(v => v.status === 'checked_in').length,
      checked_out: todayVisitors.filter(v => v.status === 'checked_out').length,
      denied: todayVisitors.filter(v => v.status === 'denied').length,
    });
  }, [visitors]);

  // Handlers
  const handleCheckin = async () => {
    const errs = validateForm(form, { visitor_name: ['required'], visitor_phone: ['phone'], visitor_email: ['email'] });
    if (Object.keys(errs).length) { toast.error(Object.values(errs)[0]); return; }
    setSubmitting(true);
    try {
      await healthAPI.createVisitor(form);
      toast.success('Visitor checked in successfully');
      setOpenCheckin(false);
      setForm({ ...initialForm });
      fetchVisitors();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to check in visitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (id) => {
    try {
      await healthAPI.checkoutVisitor(id);
      toast.success('Visitor checked out successfully');
      fetchVisitors();
    } catch (err) {
      toast.error('Failed to check out visitor');
    }
  };

  const handleViewDetail = (visitor) => {
    setSelectedVisitor(visitor);
    setOpenDetail(true);
  };

  const handlePrintPass = (visitor) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
      <head>
        <title>Gate Pass - ${visitor.visitor_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
          .header h2 { margin: 0; font-size: 18px; }
          .header p { margin: 4px 0; font-size: 12px; color: #666; }
          .field { display: flex; margin: 8px 0; font-size: 13px; }
          .field .label { font-weight: bold; min-width: 130px; }
          .field .value { flex: 1; }
          .badge { text-align: center; margin: 15px 0; padding: 10px; border: 2px dashed #333; font-size: 20px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          .status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; background: #e8f5e9; color: #2e7d32; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>VISITOR GATE PASS</h2>
          <p>${dayjs(visitor.entry_time).format('DD MMM YYYY')}</p>
        </div>
        ${visitor.badge_number ? `<div class="badge">Badge #${visitor.badge_number}</div>` : ''}
        <div class="field"><span class="label">Visitor Name:</span><span class="value">${visitor.visitor_name}</span></div>
        <div class="field"><span class="label">Phone:</span><span class="value">${visitor.visitor_phone || '-'}</span></div>
        <div class="field"><span class="label">ID Type:</span><span class="value">${visitor.id_type ? ID_TYPES.find(t => t.value === visitor.id_type)?.label || visitor.id_type : '-'}</span></div>
        <div class="field"><span class="label">ID Number:</span><span class="value">${visitor.id_number || '-'}</span></div>
        <div class="field"><span class="label">Purpose:</span><span class="value">${visitor.purpose}</span></div>
        <div class="field"><span class="label">Visiting Person:</span><span class="value">${visitor.visiting_person}</span></div>
        <div class="field"><span class="label">Department:</span><span class="value">${visitor.visiting_department || '-'}</span></div>
        <div class="field"><span class="label">Entry Time:</span><span class="value">${dayjs(visitor.entry_time).format('hh:mm A')}</span></div>
        ${visitor.vehicle_number ? `<div class="field"><span class="label">Vehicle No:</span><span class="value">${visitor.vehicle_number}</span></div>` : ''}
        ${visitor.items_carried ? `<div class="field"><span class="label">Items Carried:</span><span class="value">${visitor.items_carried}</span></div>` : ''}
        <div class="footer">
          <p>This pass is valid only for the date mentioned above.</p>
          <p>Please return this pass at the gate while leaving.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const getStatusChip = (status) => {
    const config = {
      checked_in: { color: 'success', label: 'Checked In' },
      checked_out: { color: 'default', label: 'Checked Out' },
      denied: { color: 'error', label: 'Denied' },
    };
    const c = config[status] || { color: 'default', label: status };
    return <Chip size="small" label={c.label} color={c.color} />;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const statCards = [
    { label: 'Total Visitors', value: stats.total, icon: <People />, color: theme.palette.primary.main },
    { label: 'Checked In', value: stats.checked_in, icon: <Login />, color: '#2e7d32' },
    { label: 'Checked Out', value: stats.checked_out, icon: <Logout />, color: '#757575' },
    { label: 'Denied', value: stats.denied, icon: <Block />, color: '#d32f2f' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Visitor Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all visitors for {dayjs(dateFilter).format('DD MMM YYYY')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchVisitors} sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}` }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCheckin(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            New Check-in
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={3} key={card.label}>
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${alpha(card.color, 0.2)}`,
                borderRadius: 2,
                background: alpha(card.color, 0.04),
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ color: card.color }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(card.color, 0.12), color: card.color, width: 40, height: 40 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onChange={(_, v) => setStatusFilter(v)}
            sx={{
              minHeight: 36,
              '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: 13, fontWeight: 600, py: 0 },
            }}
          >
            {STATUS_TABS.map(t => (
              <Tab key={t.value} value={t.value} label={t.label} />
            ))}
          </Tabs>

          <Box sx={{ flex: 1 }} />

          {/* Date Filter */}
          <TextField
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 170 }}
          />

          {/* Search */}
          <TextField
            size="small"
            placeholder="Search name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 220 }}
          />
        </Box>
      </Paper>

      {/* Visitor Table */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600 }}>Visitor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Visiting Person</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entry Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Exit Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Loading visitors...</Typography>
                  </TableCell>
                </TableRow>
              ) : visitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No visitors found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visitors.map((visitor) => (
                  <TableRow
                    key={visitor.id}
                    hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                    onClick={() => handleViewDetail(visitor)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={visitor.visitor_photo_url}
                          sx={{
                            width: 32, height: 32, fontSize: 13, fontWeight: 600,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {getInitials(visitor.visitor_name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {visitor.visitor_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{visitor.visitor_phone || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {visitor.purpose || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{visitor.visiting_person || '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {visitor.entry_time ? dayjs(visitor.entry_time).format('hh:mm A') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {visitor.exit_time ? dayjs(visitor.exit_time).format('hh:mm A') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(visitor.status)}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        {visitor.status === 'checked_in' && (
                          <Tooltip title="Check Out">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleCheckout(visitor.id)}
                            >
                              <ExitToApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Details">
                          <IconButton size="small" color="info" onClick={() => handleViewDetail(visitor)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Print Pass">
                          <IconButton size="small" color="primary" onClick={() => handlePrintPass(visitor)}>
                            <Print fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Check-in Dialog */}
      <Dialog open={openCheckin} onClose={() => setOpenCheckin(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>New Visitor Check-in</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Visitor Name *"
                value={form.visitor_name}
                onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Phone *"
                value={form.visitor_phone}
                onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Email"
                value={form.visitor_email}
                onChange={(e) => setForm({ ...form, visitor_email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="ID Type" select
                value={form.id_type}
                onChange={(e) => setForm({ ...form, id_type: e.target.value })}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {ID_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="ID Number"
                value={form.id_number}
                onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Purpose *"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Visiting Person *"
                value={form.visiting_person}
                onChange={(e) => setForm({ ...form, visiting_person: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Department"
                value={form.visiting_department}
                onChange={(e) => setForm({ ...form, visiting_department: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Badge Number"
                value={form.badge_number}
                onChange={(e) => setForm({ ...form, badge_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Vehicle Number"
                value={form.vehicle_number}
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Items Carried"
                value={form.items_carried}
                onChange={(e) => setForm({ ...form, items_carried: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth size="small" label="Remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                multiline rows={1}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenCheckin(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCheckin}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? 'Checking In...' : 'Check In Visitor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visitor Detail Dialog */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Visitor Details</DialogTitle>
        <DialogContent dividers>
          {selectedVisitor && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  src={selectedVisitor.visitor_photo_url}
                  sx={{
                    width: 56, height: 56, fontSize: 20, fontWeight: 700,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                  }}
                >
                  {getInitials(selectedVisitor.visitor_name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>{selectedVisitor.visitor_name}</Typography>
                  {getStatusChip(selectedVisitor.status)}
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DetailField icon={<Phone sx={{ fontSize: 16 }} />} label="Phone" value={selectedVisitor.visitor_phone} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField icon={<Email sx={{ fontSize: 16 }} />} label="Email" value={selectedVisitor.visitor_email} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField icon={<Badge sx={{ fontSize: 16 }} />} label="ID Type" value={ID_TYPES.find(t => t.value === selectedVisitor.id_type)?.label || selectedVisitor.id_type} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField label="ID Number" value={selectedVisitor.id_number} />
                </Grid>
                <Grid item xs={12}>
                  <DetailField label="Purpose" value={selectedVisitor.purpose} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField label="Visiting Person" value={selectedVisitor.visiting_person} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField label="Department" value={selectedVisitor.visiting_department} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField label="Entry Time" value={selectedVisitor.entry_time ? dayjs(selectedVisitor.entry_time).format('DD MMM YYYY, hh:mm A') : '-'} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField label="Exit Time" value={selectedVisitor.exit_time ? dayjs(selectedVisitor.exit_time).format('DD MMM YYYY, hh:mm A') : '-'} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField icon={<Badge sx={{ fontSize: 16 }} />} label="Badge Number" value={selectedVisitor.badge_number} />
                </Grid>
                <Grid item xs={6}>
                  <DetailField icon={<DirectionsCar sx={{ fontSize: 16 }} />} label="Vehicle Number" value={selectedVisitor.vehicle_number} />
                </Grid>
                <Grid item xs={12}>
                  <DetailField label="Items Carried" value={selectedVisitor.items_carried} />
                </Grid>
                {selectedVisitor.approved_by && (
                  <Grid item xs={6}>
                    <DetailField label="Approved By" value={selectedVisitor.approved_by} />
                  </Grid>
                )}
                {selectedVisitor.remarks && (
                  <Grid item xs={12}>
                    <DetailField label="Remarks" value={selectedVisitor.remarks} />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {selectedVisitor?.status === 'checked_in' && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ExitToApp />}
              onClick={() => { handleCheckout(selectedVisitor.id); setOpenDetail(false); }}
              sx={{ textTransform: 'none' }}
            >
              Check Out
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => handlePrintPass(selectedVisitor)}
            sx={{ textTransform: 'none' }}
          >
            Print Pass
          </Button>
          <Button onClick={() => setOpenDetail(false)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper component for detail fields
function DetailField({ icon, label, value }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {icon} {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value || '-'}
      </Typography>
    </Box>
  );
}
