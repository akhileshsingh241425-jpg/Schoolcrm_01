import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Chip, Alert, LinearProgress, Card, CardContent,
  Accordion, AccordionSummary, AccordionDetails, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, ExpandMore, School, Group,
  Class as ClassIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { studentsAPI } from '../../services/api';

export default function ClassSectionManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classDialog, setClassDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', numeric_name: '', description: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', capacity: 40 });

  const fetchClasses = () => {
    setLoading(true);
    studentsAPI.listClasses()
      .then(r => setClasses(r.data.data || []))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClasses(); }, []);

  // Class handlers
  const openClassDialog = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setClassForm({ name: cls.name, numeric_name: cls.numeric_name?.toString() || '', description: cls.description || '' });
    } else {
      setEditingClass(null);
      setClassForm({ name: '', numeric_name: '', description: '' });
    }
    setClassDialog(true);
  };

  const handleClassSave = async () => {
    if (!classForm.name) { toast.error('Class name is required'); return; }
    try {
      const data = {
        name: classForm.name,
        numeric_name: classForm.numeric_name ? parseInt(classForm.numeric_name) : undefined,
        description: classForm.description || undefined
      };
      if (editingClass) {
        await studentsAPI.updateClass(editingClass.id, data);
        toast.success('Class updated');
      } else {
        await studentsAPI.createClass(data);
        toast.success('Class created');
      }
      setClassDialog(false);
      fetchClasses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleClassDelete = async (id) => {
    if (!window.confirm('Delete this class and all its sections?')) return;
    try {
      await studentsAPI.deleteClass(id);
      toast.success('Class deleted');
      fetchClasses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Section handlers
  const openSectionDialog = (classId, sec = null) => {
    setSelectedClassId(classId);
    if (sec) {
      setEditingSection(sec);
      setSectionForm({ name: sec.name, capacity: sec.capacity?.toString() || '40' });
    } else {
      setEditingSection(null);
      setSectionForm({ name: '', capacity: '40' });
    }
    setSectionDialog(true);
  };

  const handleSectionSave = async () => {
    if (!sectionForm.name) { toast.error('Section name is required'); return; }
    try {
      const data = {
        class_id: selectedClassId,
        name: sectionForm.name,
        capacity: parseInt(sectionForm.capacity) || 40
      };
      if (editingSection) {
        await studentsAPI.updateSection(editingSection.id, { name: sectionForm.name, capacity: parseInt(sectionForm.capacity) || 40 });
        toast.success('Section updated');
      } else {
        await studentsAPI.createSection(data);
        toast.success('Section created');
      }
      setSectionDialog(false);
      fetchClasses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSectionDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await studentsAPI.deleteSection(id);
      toast.success('Section deleted');
      fetchClasses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleTeacherSelect = async (sectionId, teacherId) => {
    try {
      await studentsAPI.updateSection(sectionId, { class_teacher_id: teacherId || null });
      fetchClasses();
    } catch (err) { toast.error('Failed to update class teacher'); }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>Class & Section Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => openClassDialog()}>Add Class</Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!loading && classes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <School sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No classes created yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Create your first class to get started</Typography>
          <Button variant="contained" onClick={() => openClassDialog()}>Create Class</Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {classes.map(cls => (
            <Grid item xs={12} key={cls.id}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2} flex={1}>
                    <ClassIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>{cls.name}</Typography>
                    {cls.numeric_name && <Chip label={`#${cls.numeric_name}`} size="small" variant="outlined" />}
                    <Chip label={`${(cls.sections || []).length} sections`} size="small" color="info" />
                    <Box flex={1} />
                    <Tooltip title="Edit Class"><IconButton size="small" onClick={e => { e.stopPropagation(); openClassDialog(cls); }}><Edit /></IconButton></Tooltip>
                    <Tooltip title="Delete Class"><IconButton size="small" color="error" onClick={e => { e.stopPropagation(); handleClassDelete(cls.id); }}><Delete /></IconButton></Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {cls.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{cls.description}</Typography>}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2">Sections</Typography>
                    <Button size="small" startIcon={<Add />} variant="outlined" onClick={() => openSectionDialog(cls.id)}>Add Section</Button>
                  </Box>
                  {(cls.sections || []).length === 0 ? (
                    <Alert severity="info">No sections added yet</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Capacity</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Class Teacher</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Students</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cls.sections.map(sec => (
                            <TableRow key={sec.id}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Group fontSize="small" color="action" />
                                  <Typography fontWeight={500}>{sec.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{sec.capacity || 40}</TableCell>
                              <TableCell>{sec.class_teacher_id ? `Teacher #${sec.class_teacher_id}` : <Chip label="Not assigned" size="small" variant="outlined" />}</TableCell>
                              <TableCell>-</TableCell>
                              <TableCell>
                                <Tooltip title="Edit"><IconButton size="small" onClick={() => openSectionDialog(cls.id, sec)}><Edit /></IconButton></Tooltip>
                                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleSectionDelete(sec.id)}><Delete /></IconButton></Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Class Dialog */}
      <Dialog open={classDialog} onClose={() => setClassDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingClass ? 'Edit Class' : 'Add Class'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Class Name" value={classForm.name}
                onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="e.g. Class 10" required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Numeric Name" type="number" value={classForm.numeric_name}
                onChange={e => setClassForm({ ...classForm, numeric_name: e.target.value })}
                placeholder="e.g. 10" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={classForm.description}
                onChange={e => setClassForm({ ...classForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleClassSave}>{editingClass ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Section Name" value={sectionForm.name}
                onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })}
                placeholder="e.g. A" required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Capacity" type="number" value={sectionForm.capacity}
                onChange={e => setSectionForm({ ...sectionForm, capacity: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSectionDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSectionSave}>{editingSection ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
