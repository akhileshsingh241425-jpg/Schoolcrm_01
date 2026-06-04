import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, alpha, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { storeAPI } from '../../services/api';

const typeColors = { out: '#ef4444', in: '#10b981', return: '#3b82f6', adjustment: '#f59e0b' };

export default function StoreTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { per_page: 100 };
      if (typeFilter) params.type = typeFilter;
      const res = await storeAPI.getTransactions(params);
      setTransactions(res.data.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    }
    setLoading(false);
  };

  useEffect(() => { load() }, [typeFilter]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>All Transactions</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)} sx={{ borderRadius: 3, bgcolor: '#fff' }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="out">Issued</MenuItem>
            <MenuItem value="return">Returned</MenuItem>
            <MenuItem value="adjustment">Adjustment</MenuItem>
            <MenuItem value="in">Stocked In</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #f1f5f9' }}>
          <Typography color="text.secondary">
            {typeFilter ? `No ${typeFilter} transactions found` : 'No transactions yet'}
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Item', 'Type', 'Qty', 'Issued To / By', 'Issue Date', 'Expected Return', 'Return Date', 'Note', 'Date'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t.item_name}</TableCell>
                    <TableCell>
                      <Chip label={t.transaction_type} size="small"
                        sx={{ bgcolor: alpha(typeColors[t.transaction_type] || '#94a3b8', 0.1), color: typeColors[t.transaction_type] || '#475569', fontWeight: 600, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>{t.issued_to || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.issue_date || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.expected_return_date || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.return_date || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem' }}>{t.note || '-'}</TableCell>
                    <TableCell sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
