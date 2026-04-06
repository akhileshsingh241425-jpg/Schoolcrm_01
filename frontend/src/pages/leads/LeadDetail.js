import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Button, Divider, TextField, MenuItem,
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineDot, TimelineContent
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { leadsAPI } from '../../services/api';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [followupForm, setFollowupForm] = useState({ followup_type: 'call', notes: '', followup_date: '' });

  const fetchLead = () => {
    leadsAPI.get(id).then(res => setLead(res.data.data)).catch(() => navigate('/leads'));
  };

  useEffect(() => { fetchLead(); }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await leadsAPI.update(id, { status: newStatus });
      toast.success('Status updated');
      fetchLead();
    } catch (err) { toast.error('Error updating status'); }
  };

  const handleAddFollowup = async () => {
    try {
      await leadsAPI.addFollowup(id, followupForm);
      toast.success('Follow-up added');
      setFollowupForm({ followup_type: 'call', notes: '', followup_date: '' });
      fetchLead();
    } catch (err) { toast.error('Error adding follow-up'); }
  };

  if (!lead) return <Typography>Loading...</Typography>;

  const statuses = ['new', 'contacted', 'interested', 'visit_scheduled', 'visited', 'application', 'admitted', 'lost'];

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/leads')} sx={{ mb: 2 }}>Back</Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box>
            <Typography variant="h5">{lead.student_name}</Typography>
            <Typography color="text.secondary">Parent: {lead.parent_name || 'N/A'}</Typography>
            <Typography color="text.secondary">Phone: {lead.phone} | Email: {lead.email || 'N/A'}</Typography>
            <Typography color="text.secondary">Class Interested: {lead.class_interested || 'N/A'}</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip label={lead.priority} color={lead.priority === 'high' ? 'error' : 'warning'} />
            <Chip label={lead.status} color="primary" />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>Change Status:</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {statuses.map(s => (
            <Chip key={s} label={s} variant={lead.status === s ? 'filled' : 'outlined'}
              color={lead.status === s ? 'primary' : 'default'}
              onClick={() => handleStatusChange(s)} sx={{ cursor: 'pointer' }} />
          ))}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add Follow-up</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth select label="Type" value={followupForm.followup_type}
                  onChange={(e) => setFollowupForm({ ...followupForm, followup_type: e.target.value })}>
                  {['call', 'whatsapp', 'email', 'visit', 'sms'].map(t =>
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  )}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Date" type="datetime-local" InputLabelProps={{ shrink: true }}
                  value={followupForm.followup_date}
                  onChange={(e) => setFollowupForm({ ...followupForm, followup_date: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" multiline rows={2}
                  value={followupForm.notes}
                  onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleAddFollowup}>Add Follow-up</Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Follow-ups</Typography>
            {lead.followups?.length > 0 ? lead.followups.map(f => (
              <Box key={f.id} sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box display="flex" justifyContent="space-between">
                  <Chip label={f.followup_type} size="small" />
                  <Chip label={f.status} size="small" variant="outlined" />
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>{f.notes}</Typography>
                <Typography variant="caption" color="text.secondary">{f.followup_date}</Typography>
              </Box>
            )) : <Typography variant="body2">No follow-ups yet</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
