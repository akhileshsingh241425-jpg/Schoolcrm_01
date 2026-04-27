import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Grid, CircularProgress,
  Alert, Pagination, Tooltip, IconButton, Avatar
} from '@mui/material';
import { Search, Security, Refresh, InfoOutlined } from '@mui/icons-material';
import { superAdminAPI } from '../../services/api';

const ACTION_COLORS = {
  create: 'success',
  update: 'primary',
  delete: 'error',
  login: 'info',
  logout: 'default',
  toggle: 'warning',
  reset_password: 'warning',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    superAdminAPI.getAuditLogs({ page, search, action: filterAction })
      .then(res => {
        setLogs(res.data.data?.logs || res.data.data || []);
        setTotalPages(res.data.data?.pages || 1);
      })
      .catch(() => setError('Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [page, search, filterAction]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Security sx={{ color: '#6366f1', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Audit Logs</Typography>
            <Typography variant="body2" color="text.secondary">All system activities and changes</Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchLogs}><Refresh /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={5}>
              <TextField fullWidth size="small" placeholder="Search user, action, details..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Action Type</InputLabel>
                <Select value={filterAction} label="Action Type"
                  onChange={e => { setFilterAction(e.target.value); setPage(1); }}>
                  <MenuItem value="">All Actions</MenuItem>
                  {Object.keys(ACTION_COLORS).map(a => (
                    <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Module / Resource</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Security sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">No audit logs found</Typography>
                  </TableCell>
                </TableRow>
              ) : logs.map((log, i) => (
                <TableRow key={log.id || i} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#6366f1' }}>
                        {log.user_name?.[0] || log.user_email?.[0]?.toUpperCase() || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{log.user_name || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{log.user_email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action?.replace(/_/g, ' ')}
                      size="small"
                      color={ACTION_COLORS[log.action] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.module || log.resource_type || '-'}</Typography>
                    {log.resource_id && (
                      <Typography variant="caption" color="text.secondary">ID: {log.resource_id}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Tooltip title={log.details || ''}>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {log.details || log.description || '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontFamily="monospace" fontSize={11}>
                      {log.ip_address || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : ''}>
                      <Typography variant="body2" color="text.secondary" whiteSpace="nowrap">
                        {log.created_at ? timeAgo(log.created_at) : '-'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box p={2} display="flex" justifyContent="center">
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
}
