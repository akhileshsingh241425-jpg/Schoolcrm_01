import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, IconButton, alpha, useTheme, TextField,
  InputAdornment, Skeleton, Tabs, Tab, Tooltip
} from '@mui/material';
import { People, Phone, Email, Search, Refresh, Class as ClassIcon } from '@mui/icons-material';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeacherParents() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const theme = useTheme();
  const PRIMARY = theme.palette.primary.main;

  const loadData = () => {
    setLoading(true);
    dashboardAPI.getTeacher()
      .then(res => setData(res.data?.data))
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Parent Contacts</Typography>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 4 }} />
      </Box>
    );
  }

  const myClasses = data?.my_classes || [];
  const mySubjects = data?.my_subjects || [];
  const students = data?.class_students || [];

  // If no class_teacher assignment, derive class tabs from subjects
  const classTabs = myClasses.length > 0 ? myClasses : mySubjects.reduce((acc, sub) => {
    if (!acc.find(c => c.section_id === sub.section_id)) {
      acc.push({
        section_id: sub.section_id,
        class_name: sub.class_name,
        section_name: sub.section_name,
        class_id: sub.class_id,
        student_count: 0,
      });
    }
    return acc;
  }, []);

  // Filter by class
  const filteredStudents = students.filter(s => {
    if (selectedClass !== 'all' && s.section_id !== selectedClass) return false;
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
      const parentInfo = `${s.parent_phone || ''} ${s.parent_email || ''}`.toLowerCase();
      if (!fullName.includes(q) && !parentInfo.includes(q)) return false;
    }
    return true;
  });

  // Only show students who have parent contact
  const withParents = filteredStudents.filter(s => s.parent_phone || s.parent_email);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <People sx={{ color: PRIMARY, fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700}>Parent Contacts</Typography>
          <Chip label={`${withParents.length} contacts`} size="small" color="primary" sx={{ fontWeight: 600 }} />
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData} sx={{ color: PRIMARY }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Class Filter Tabs */}
      {classTabs.length > 0 && (
        <Paper sx={{ mb: 2, borderRadius: 3 }}>
          <Tabs
            value={selectedClass}
            onChange={(_, v) => setSelectedClass(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44 } }}
          >
            <Tab value="all" label={`All (${students.filter(s => s.parent_phone || s.parent_email).length})`} icon={<People sx={{ fontSize: 18 }} />} iconPosition="start" />
            {classTabs.map(cls => {
              const count = students.filter(s => s.section_id === cls.section_id && (s.parent_phone || s.parent_email)).length;
              return (
                <Tab
                  key={cls.section_id}
                  value={cls.section_id}
                  label={`${cls.class_name} - ${cls.section_name} (${count})`}
                  icon={<ClassIcon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                />
              );
            })}
          </Tabs>
        </Paper>
      )}

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search by student name, parent phone or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha('#000', 0.02) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Roll No</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parent Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parent Email</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Call / Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {withParents.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, fontSize: '0.75rem', fontWeight: 700 }}>
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {s.first_name} {s.last_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${s.class_name} - ${s.section_name}`} size="small"
                      sx={{ height: 22, fontSize: '0.65rem', bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{s.roll_no || '-'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {s.parent_phone || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {s.parent_email || '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {s.parent_phone && (
                        <Tooltip title={`Call ${s.parent_phone}`}>
                          <IconButton size="small"
                            onClick={() => window.open(`tel:${s.parent_phone}`)}
                            sx={{ color: '#3b82f6', bgcolor: alpha('#3b82f6', 0.08), width: 30, height: 30 }}>
                            <Phone sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {s.parent_email && (
                        <Tooltip title={`Email ${s.parent_email}`}>
                          <IconButton size="small"
                            onClick={() => window.open(`mailto:${s.parent_email}`)}
                            sx={{ color: '#ef4444', bgcolor: alpha('#ef4444', 0.08), width: 30, height: 30 }}>
                            <Email sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {withParents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                    <People sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      {search ? 'No matching contacts found' : 'No parent contacts available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
