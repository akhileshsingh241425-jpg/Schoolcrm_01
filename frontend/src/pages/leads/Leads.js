import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, TablePagination, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { leadsAPI } from '../../services/api';

const statusColors = {
  new: 'info', contacted: 'primary', interested: 'warning', visit_scheduled: 'secondary',
  visited: 'default', application: 'primary', admitted: 'success', lost: 'error'
};

export default function Leads() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    leadsAPI.list({ page: page + 1, per_page: 20, search, status: status || undefined })
      .then(res => setData(res.data.data)).catch(() => {});
  }, [page, search, status]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="h5">Leads / CRM</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/leads/new')} size="small">Add Lead</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField size="small" placeholder="Search leads..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: { xs: '100%', sm: 250 } }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {Object.keys(statusColors).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Parent</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items?.map((l) => (
              <TableRow key={l.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/leads/${l.id}`)}>
                <TableCell><strong>{l.student_name}</strong></TableCell>
                <TableCell>{l.parent_name || '-'}</TableCell>
                <TableCell>{l.phone}</TableCell>
                <TableCell>{l.class_interested || '-'}</TableCell>
                <TableCell>{l.source?.name || '-'}</TableCell>
                <TableCell><Chip label={l.priority} size="small" color={l.priority === 'high' ? 'error' : l.priority === 'medium' ? 'warning' : 'default'} /></TableCell>
                <TableCell><Chip label={l.status} size="small" color={statusColors[l.status] || 'default'} /></TableCell>
              </TableRow>
            ))}
            {data.items?.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No leads found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" count={data.total || 0} page={page}
          onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );
}
