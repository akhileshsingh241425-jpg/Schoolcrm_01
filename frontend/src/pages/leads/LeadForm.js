import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { leadsAPI } from '../../services/api';

export default function LeadForm() {
  const navigate = useNavigate();
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState({
    student_name: '', parent_name: '', phone: '', email: '',
    class_interested: '', source_id: '', priority: 'medium', notes: ''
  });

  useEffect(() => {
    leadsAPI.listSources().then(res => setSources(res.data.data)).catch(() => {});
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leadsAPI.create(form);
      toast.success('Lead created');
      navigate('/leads');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating lead');
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/leads')} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h5" gutterBottom>Add New Lead</Typography>

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Student Name" required value={form.student_name} onChange={handleChange('student_name')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Parent Name" value={form.parent_name} onChange={handleChange('parent_name')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" required value={form.phone} onChange={handleChange('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" value={form.email} onChange={handleChange('email')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Class Interested" value={form.class_interested} onChange={handleChange('class_interested')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Source" value={form.source_id} onChange={handleChange('source_id')}>
                <MenuItem value="">None</MenuItem>
                {sources.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Priority" value={form.priority} onChange={handleChange('priority')}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={3} value={form.notes} onChange={handleChange('notes')} />
            </Grid>
          </Grid>
        </Paper>

        <Button type="submit" variant="contained" size="large" startIcon={<Save />}>Create Lead</Button>
      </form>
    </Box>
  );
}
