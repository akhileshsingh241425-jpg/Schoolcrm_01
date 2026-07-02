import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Chip, Alert, Snackbar, LinearProgress, Checkbox, FormControlLabel
} from '@mui/material';
import { Add, Edit, Delete, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { studentsAPI } from '../../services/api';

const emptyForm = { name: '', start_date: '', end_date: '', is_current: false };

export default function AcademicYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const fetchYears = () => {
    setLoading(true);
    studentsAPI.listAcademicYears()
      .then(r => setYears(r.data.data || []))
      .catch(() => showSnack('Failed to load academic years', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchYears(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialog(true);
  };

  const openEdit = (year) => {
    setEditing(year);
    setForm({
      name: year.name,
      start_date: year.start_date?.split('T')[0] || year.start_date,
      end_date: year.end_date?.split('T')[0] || year.end_date,
      is_current: year.is_current,
    });
    setDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.start_date || !form.end_date) {
      showSnack('Name, Start Date aur End Date required hai', 'error');
      return;
    }
    if (new Date(form.end_date) <= new Date(form.start_date)) {
      showSnack('End Date, Start Date se baad ki honi chahiye', 'error');
      return;
    }
    try {
      if (editing) {
        await studentsAPI.updateAcademicYear(editing.id, form);
        showSnack('Academic year updated!');
      } else {
        await studentsAPI.createAcademicYear(form);
        showSnack('Academic year created!');
      }
      setDialog(false);
      fetchYears();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const handleSetCurrent = async (year) => {
    try {
      await studentsAPI.setCurrentAcademicYear(year.id);
      showSnack(`"${year.name}" ko current academic year set kiya gaya`);
      fetchYears();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to set current', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await studentsAPI.deleteAcademicYear(deleteConfirm.id);
      showSnack(`"${deleteConfirm.name}" deleted!`);
      setDeleteConfirm(null);
      fetchYears();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to delete (related data may exist)', 'error');
      setDeleteConfirm(null);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Academic Years</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Create Academic Year
        </Button>
      </Box>

      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && years.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={4}>
                      No academic years found. Create one to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {years.map(year => (
                <TableRow key={year.id} sx={year.is_current ? { bgcolor: 'action.selected' } : {}}>
                  <TableCell>
                    <Typography fontWeight={year.is_current ? 'bold' : 'normal'}>{year.name}</Typography>
                  </TableCell>
                  <TableCell>{year.start_date}</TableCell>
                  <TableCell>{year.end_date}</TableCell>
                  <TableCell>
                    {year.is_current ? (
                      <Chip icon={<CheckCircle />} label="Current" color="success" size="small" />
                    ) : (
                      <Chip icon={<RadioButtonUnchecked />} label="Inactive" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {!year.is_current && (
                      <Tooltip title="Set as Current">
                        <IconButton size="small" color="primary" onClick={() => handleSetCurrent(year)}>
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(year)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(year)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Academic Year' : 'Create Academic Year'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Academic Year Name" fullWidth required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., 2025-2026"
            />
            <TextField
              label="Start Date" type="date" fullWidth required
              InputLabelProps={{ shrink: true }}
              value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })}
            />
            <TextField
              label="End Date" type="date" fullWidth required
              InputLabelProps={{ shrink: true }}
              value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.is_current}
                  onChange={e => setForm({ ...form, is_current: e.target.checked })}
                />
              }
              label="Set as current academic year"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Academic Year?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
            <Alert severity="warning" sx={{ mt: 2 }}>
              Related data (admissions, exams, fees, etc.) may be affected.
            </Alert>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
