import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Card, CardContent
} from '@mui/material';
import { reportsAPI } from '../../services/api';

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [overview, setOverview] = useState({});
  const [admissionReport, setAdmissionReport] = useState({});
  const [feeReport, setFeeReport] = useState({});
  const [attendanceReport, setAttendanceReport] = useState({});
  const [marketingReport, setMarketingReport] = useState({});

  useEffect(() => { reportsAPI.overview().then(res => setOverview(res.data.data || {})).catch(() => {}); }, []);

  const fetchReport = () => {
    if (tab === 0) reportsAPI.admission(dateRange).then(res => setAdmissionReport(res.data.data || {})).catch(() => {});
    if (tab === 1) reportsAPI.feeCollection(dateRange).then(res => setFeeReport(res.data.data || {})).catch(() => {});
    if (tab === 2) reportsAPI.attendance(dateRange).then(res => setAttendanceReport(res.data.data || {})).catch(() => {});
    if (tab === 3) reportsAPI.marketing(dateRange).then(res => setMarketingReport(res.data.data || {})).catch(() => {});
  };

  useEffect(() => { fetchReport(); }, [tab]);

  const StatCard = ({ title, value, color }) => (
    <Card sx={{ bgcolor: color || '#f5f5f5', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight="bold">{value || 0}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" mb={3}>Reports & Analytics</Typography>

      {/* Overview Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={6} md={3}><StatCard title="Total Students" value={overview.total_students} color="#e3f2fd" /></Grid>
        <Grid item xs={6} sm={6} md={3}><StatCard title="Total Leads" value={overview.total_leads} color="#e8f5e9" /></Grid>
        <Grid item xs={6} sm={6} md={3}><StatCard title="Fee Collected" value={`₹${overview.total_fee_collected || 0}`} color="#fff3e0" /></Grid>
        <Grid item xs={6} sm={6} md={3}><StatCard title="Pending Admissions" value={overview.pending_admissions} color="#fce4ec" /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Admission Report" />
        <Tab label="Fee Report" />
        <Tab label="Attendance Report" />
        <Tab label="Marketing Report" />
      </Tabs>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField type="date" size="small" label="From" value={dateRange.start_date} onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField type="date" size="small" label="To" value={dateRange.end_date} onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" onClick={fetchReport}>Generate</Button>
        </Box>
      </Paper>

      {tab === 0 && (
        <Box>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={4}><StatCard title="Total Applications" value={admissionReport.total_applications} /></Grid>
            <Grid item xs={6} sm={4}><StatCard title="Enrolled" value={admissionReport.by_status?.enrolled || 0} color="#e8f5e9" /></Grid>
            <Grid item xs={6} sm={4}><StatCard title="Pending" value={admissionReport.by_status?.pending || 0} color="#fff3e0" /></Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Count</TableCell><TableCell>Percentage</TableCell></TableRow></TableHead>
              <TableBody>
                {admissionReport.by_status && Object.keys(admissionReport.by_status).length > 0 ? Object.entries(admissionReport.by_status).map(([status, count], i) => (
                  <TableRow key={i}><TableCell>{status}</TableCell><TableCell>{count}</TableCell><TableCell>{admissionReport.total_applications ? ((count / admissionReport.total_applications) * 100).toFixed(1) : 0}%</TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={3} align="center">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} sm={4}><StatCard title="Total Collected" value={`₹${feeReport.total_collected || 0}`} color="#e8f5e9" /></Grid>
            <Grid item xs={6} sm={4}><StatCard title="Transactions" value={feeReport.total_transactions || 0} color="#fce4ec" /></Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Payment Mode</TableCell><TableCell>Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {feeReport.by_payment_mode && Object.keys(feeReport.by_payment_mode).length > 0 ? Object.entries(feeReport.by_payment_mode).map(([mode, amount], i) => (
                  <TableRow key={i}><TableCell>{mode}</TableCell><TableCell>₹{amount}</TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} align="center">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={4}><StatCard title="Total Records" value={attendanceReport.total_records || 0} /></Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Count</TableCell></TableRow></TableHead>
              <TableBody>
                {attendanceReport.by_status && Object.keys(attendanceReport.by_status).length > 0 ? Object.entries(attendanceReport.by_status).map(([status, count], i) => (
                  <TableRow key={i}><TableCell>{status}</TableCell><TableCell>{count}</TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} align="center">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={4}><StatCard title="Total Leads" value={marketingReport.total_leads} /></Grid>
            <Grid item xs={6} sm={4}><StatCard title="Admitted" value={marketingReport.admitted} color="#e8f5e9" /></Grid>
            <Grid item xs={6} sm={4}><StatCard title="Conversion Rate" value={`${marketingReport.conversion_rate || 0}%`} /></Grid>
          </Grid>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Count</TableCell></TableRow></TableHead>
              <TableBody>
                {marketingReport.by_status && Object.keys(marketingReport.by_status).length > 0 ? Object.entries(marketingReport.by_status).map(([status, count], i) => (
                  <TableRow key={i}><TableCell>{status}</TableCell><TableCell>{count}</TableCell></TableRow>
                )) : <TableRow><TableCell colSpan={2} align="center">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
