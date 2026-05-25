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
  const [classForm, setClassForm] = useState({ name: '', numeric_name: '', description: '', stream: '', sections: [] });
  const [sectionForm, setSectionForm] = useState({ name: '', capacity: 40 });
  const [sectionNameOptions] = useState(['A', 'B', 'C', 'D', 'E', 'F']);

  const classOptions = [
    { label: 'Nursery', num: 0 }, { label: 'KG', num: 0 },
    { label: 'Class 1', num: 1 }, { label: 'Class 2', num: 2 },
    { label: 'Class 3', num: 3 }, { label: 'Class 4', num: 4 },
    { label: 'Class 5', num: 5 }, { label: 'Class 6', num: 6 },
    { label: 'Class 7', num: 7 }, { label: 'Class 8', num: 8 },
    { label: 'Class 9', num: 9 }, { label: 'Class 10', num: 10 },
    { label: 'Class 11', num: 11 }, { label: 'Class 12', num: 12 },
  ];
  const streamOptions = ['Science', 'Commerce', 'Arts'];

  const fetchClasses = () => {
    setLoading(true);
    studentsAPI.listClasses()
      .then(r => setClasses(r.data.data || []))
      .catch(() => toast.error('Failed to load classes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClasses(); }, []);

  // Class handlers
  const parseClassForEdit = (name) => {
    const parts = (name || '').split(' ');
    if (parts[0] === 'Class') {
      const num = parts[1];
      const stream = parts.slice(2).join(' ');
      return { label: `Class ${num}`, num: parseInt(num), stream: stream || '' };
    }
    const found = classOptions.find(c => c.label === name);
    return found ? { label: name, num: found.num, stream: '' } : { label: '', num: 0, stream: '' };
  };

  const openClassDialog = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      const parsed = parseClassForEdit(cls.name);
      setClassForm({ name: parsed.label, numeric_name: parsed.num?.toString() || '', description: cls.description || '', stream: parsed.stream, sections: [] });
    } else {
      setEditingClass(null);
      setClassForm({ name: '', numeric_name: '', description: '', stream: '', sections: [] });
    }
    setClassDialog(true);
  };

  const handleClassSave = async () => {
    if (!classForm.name) { toast.error('Class name is required'); return; }
    const hasStream = ['Class 11', 'Class 12'].includes(classForm.name);
    if (hasStream && !classForm.stream) { toast.error('Stream is required for Class 11/12'); return; }
    const displayName = hasStream && classForm.stream ? `${classForm.name} ${classForm.stream}` : classForm.name;
    const numeric = classOptions.find(c => c.label === classForm.name)?.num || 0;
    try {
      const data = {
        name: displayName,
        numeric_name: numeric || undefined,
        description: classForm.description || undefined
      };
      if (editingClass) {
        await studentsAPI.updateClass(editingClass.id, data);
        toast.success('Class updated');
      } else {
        const res = await studentsAPI.createClass(data);
        const newClassId = res.data.data?.id;
        if (newClassId && classForm.sections.length > 0) {
          await Promise.all(classForm.sections.map(sec =>
            studentsAPI.createSection({ class_id: newClassId, name: sec, capacity: 40 })
          ));
          toast.success(`Class created with ${classForm.sections.length} sections`);
        } else {
          toast.success('Class created');
        }
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
              <TextField fullWidth select label="Class Name" value={classForm.name}
                onChange={e => setClassForm({ ...classForm, name: e.target.value, stream: '' })}
                required>
                {classOptions.map(c => <MenuItem key={c.label} value={c.label}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            {['Class 11', 'Class 12'].includes(classForm.name) && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Stream" value={classForm.stream}
                  onChange={e => setClassForm({ ...classForm, stream: e.target.value })} required>
                  {streamOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={classForm.description}
                onChange={e => setClassForm({ ...classForm, description: e.target.value })} />
            </Grid>
            {!editingClass && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>Create Sections</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {sectionNameOptions.map(s => (
                    <Chip key={s} label={`Section ${s}`} clickable color={classForm.sections.includes(s) ? 'primary' : 'default'}
                      variant={classForm.sections.includes(s) ? 'filled' : 'outlined'}
                      onClick={() => setClassForm({
                        ...classForm,
                        sections: classForm.sections.includes(s)
                          ? classForm.sections.filter(x => x !== s)
                          : [...classForm.sections, s]
                      })} />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClassDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleClassSave}
            disabled={['Class 11', 'Class 12'].includes(classForm.name) && !classForm.stream}>
            {editingClass ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Section Name" value={sectionForm.name}
                onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} required>
                {sectionNameOptions.map(s => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
              </TextField>
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
