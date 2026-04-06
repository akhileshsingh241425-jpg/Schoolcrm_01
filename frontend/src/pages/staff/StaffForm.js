import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { staffAPI } from '../../services/api';

export default function StaffForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', employee_id: '', gender: '',
    date_of_birth: '', phone: '', email: '', qualification: '',
    experience_years: '', designation: '', department: '',
    date_of_joining: '', salary: '', address: '', city: '', state: '',
    staff_type: 'teaching', contract_type: 'permanent',
    probation_end_date: '', contract_end_date: '',
    pf_number: '', esi_number: '', uan_number: '',
    emergency_contact: '', emergency_person: '',
    blood_group: '', marital_status: '', spouse_name: '',
    create_login: false, role: 'teacher', password: 'Welcome@123'
  });

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await staffAPI.create(form);
      toast.success('Staff member created');
      navigate('/staff');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/staff')} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h5" gutterBottom>Add Staff Member</Typography>

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Personal Info</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="First Name" required value={form.first_name} onChange={handleChange('first_name')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Last Name" value={form.last_name} onChange={handleChange('last_name')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Employee ID" value={form.employee_id} onChange={handleChange('employee_id')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Gender" value={form.gender} onChange={handleChange('gender')}>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} value={form.date_of_birth} onChange={handleChange('date_of_birth')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Blood Group" value={form.blood_group} onChange={handleChange('blood_group')}>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Marital Status" value={form.marital_status} onChange={handleChange('marital_status')}>
                <MenuItem value="single">Single</MenuItem><MenuItem value="married">Married</MenuItem>
                <MenuItem value="divorced">Divorced</MenuItem><MenuItem value="widowed">Widowed</MenuItem>
              </TextField>
            </Grid>
            {form.marital_status === 'married' && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Spouse Name" value={form.spouse_name} onChange={handleChange('spouse_name')} />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Employment Info</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Staff Type" value={form.staff_type} onChange={handleChange('staff_type')}>
                <MenuItem value="teaching">Teaching</MenuItem>
                <MenuItem value="non_teaching">Non-Teaching</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Designation" value={form.designation} onChange={handleChange('designation')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Department" value={form.department} onChange={handleChange('department')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Contract Type" value={form.contract_type} onChange={handleChange('contract_type')}>
                <MenuItem value="permanent">Permanent</MenuItem><MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="probation">Probation</MenuItem><MenuItem value="part_time">Part-Time</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Date of Joining" type="date" InputLabelProps={{ shrink: true }} value={form.date_of_joining} onChange={handleChange('date_of_joining')} />
            </Grid>
            {form.contract_type === 'probation' && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Probation End Date" type="date" InputLabelProps={{ shrink: true }} value={form.probation_end_date} onChange={handleChange('probation_end_date')} />
              </Grid>
            )}
            {form.contract_type === 'contract' && (
              <Grid item xs={12} sm={6} md={4}>
                <TextField fullWidth label="Contract End Date" type="date" InputLabelProps={{ shrink: true }} value={form.contract_end_date} onChange={handleChange('contract_end_date')} />
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Qualification" value={form.qualification} onChange={handleChange('qualification')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Experience (years)" type="number" value={form.experience_years} onChange={handleChange('experience_years')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Salary" type="number" value={form.salary} onChange={handleChange('salary')} />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Statutory & Emergency</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="PF Number" value={form.pf_number} onChange={handleChange('pf_number')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="ESI Number" value={form.esi_number} onChange={handleChange('esi_number')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="UAN Number" value={form.uan_number} onChange={handleChange('uan_number')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Emergency Contact Person" value={form.emergency_person} onChange={handleChange('emergency_person')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Emergency Contact Number" value={form.emergency_contact} onChange={handleChange('emergency_contact')} />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Address</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth label="Address" value={form.address} onChange={handleChange('address')} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="City" value={form.city} onChange={handleChange('city')} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="State" value={form.state} onChange={handleChange('state')} /></Grid>
          </Grid>
        </Paper>

        <Button type="submit" variant="contained" size="large" startIcon={<Save />}>Create Staff</Button>
      </form>
    </Box>
  );
}
