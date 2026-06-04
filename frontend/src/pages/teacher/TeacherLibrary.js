import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, TextField, InputAdornment,
  Chip, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Skeleton, alpha, useTheme, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Alert
} from '@mui/material';
import {
  Search, LocalLibrary, MenuBook, CheckCircle, Cancel, Send, Refresh
} from '@mui/icons-material';
import { libraryAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherLibrary() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [requestDialog, setRequestDialog] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadBooks = () => {
    setLoading(true);
    libraryAPI.listBooks({ search, per_page: 100 })
      .then(res => {
        const data = res.data?.data;
        setBooks(Array.isArray(data) ? data : data?.items || []);
      })
      .catch(() => toast.error('Failed to load books'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBooks(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadBooks();
  };

  const handleRequest = async () => {
    if (!requestDialog) return;
    setRequesting(true);
    try {
      await libraryAPI.createReservation({
        book_id: requestDialog.id,
        reserved_by_type: 'staff',
        notes: `Issue request from teacher`,
      });
      toast.success('Book issue request sent to librarian!');
      setRequestDialog(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalLibrary sx={{ color: PRIMARY, fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>Library</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadBooks} sx={{ color: PRIMARY }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }} component="form" onSubmit={handleSearch}>
        <TextField
          fullWidth size="small"
          placeholder="Search books by title, author, ISBN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <Button type="submit" size="small" variant="contained"
                sx={{ borderRadius: 2, textTransform: 'none', minWidth: 80 }}>
                Search
              </Button>
            ),
          }}
        />
      </Paper>

      {/* Info */}
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Browse available books below. Click "Request Issue" to send a request to the librarian.
      </Alert>

      {/* Books Table */}
      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : books.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <MenuBook sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No books found</Typography>
        </Box>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Author</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>ISBN</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Available</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => {
                  const available = book.available_copies > 0 || book.is_available !== false;
                  return (
                    <TableRow key={book.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, width: 36, height: 36 }}>
                            <MenuBook sx={{ fontSize: 18 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{book.title}</Typography>
                            {book.publisher && (
                              <Typography variant="caption" color="text.secondary">{book.publisher}</Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{book.author || '-'}</TableCell>
                      <TableCell>
                        {book.category_name || book.category ? (
                          <Chip label={book.category_name || book.category} size="small"
                            sx={{ fontSize: '0.7rem', bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY }} />
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{book.isbn || '-'}</TableCell>
                      <TableCell>
                        {available ? (
                          <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Available" size="small"
                            color="success" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                        ) : (
                          <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label="Issued" size="small"
                            color="error" variant="outlined" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small" variant="outlined" startIcon={<Send sx={{ fontSize: 14 }} />}
                          disabled={!available}
                          onClick={() => setRequestDialog(book)}
                          sx={{ textTransform: 'none', fontSize: '0.7rem', borderRadius: 2 }}
                        >
                          Request Issue
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Request Confirmation Dialog */}
      <Dialog open={!!requestDialog} onClose={() => setRequestDialog(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Request Book Issue</Typography>
        </DialogTitle>
        <DialogContent>
          {requestDialog && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(PRIMARY, 0.05), mb: 2 }}>
                <Typography variant="body1" fontWeight={700}>{requestDialog.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {requestDialog.author && `By ${requestDialog.author}`}
                  {requestDialog.isbn && ` • ISBN: ${requestDialog.isbn}`}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                A request will be sent to the librarian to issue this book to you.
                You'll be notified once it's approved.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequestDialog(null)}
            sx={{ borderRadius: 2, textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleRequest} disabled={requesting}
            startIcon={<Send />}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            {requesting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
