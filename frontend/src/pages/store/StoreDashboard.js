import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Paper, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, alpha, useTheme, Alert
} from '@mui/material';
import {
  Inventory, Warning, Category, Warehouse
} from '@mui/icons-material';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  allocation: 'info',
  return: 'success',
  adjustment: 'warning',
};

export default function StoreDashboard() {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await storeAPI.getDashboard();
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to load dashboard');
        toast.error(res.data?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error loading dashboard';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !data) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  const stats = [
    {
      label: 'Total Items',
      value: data?.total_items ?? 0,
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Low Stock Items',
      value: data?.low_stock_items ?? 0,
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
    },
    {
      label: 'Categories',
      value: data?.total_categories ?? 0,
      icon: <Category sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
    },
    {
      label: 'Total Quantity',
      value: data?.total_quantity ?? 0,
      icon: <Warehouse sx={{ fontSize: 40 }} />,
      color: theme.palette.info.main,
    },
  ];

  const transactions = data?.recent_transactions ?? [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Store Dashboard
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(s.color, 0.15)} 0%, ${alpha(s.color, 0.05)} 100%)`,
                border: `1px solid ${alpha(s.color, 0.2)}`,
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                <Box sx={{ color: s.color }}>{s.icon}</Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Transactions */}
      <Paper sx={{ borderRadius: 3, p: 2 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Recent Transactions
        </Typography>
        {transactions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No transactions yet
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Issued To</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Note</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id} hover>
                    <TableCell>{txn.item_name || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={txn.transaction_type}
                        size="small"
                        color={TYPE_COLORS[txn.transaction_type] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{txn.quantity}</TableCell>
                    <TableCell>{txn.issued_to || '—'}</TableCell>
                    <TableCell>{txn.note || '—'}</TableCell>
                    <TableCell>
                      {txn.created_at
                        ? new Date(txn.created_at).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
