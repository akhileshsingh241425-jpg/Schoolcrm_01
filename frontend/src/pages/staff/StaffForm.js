import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Chip, Select, FormControl, InputLabel, OutlinedInput } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { staffAPI, authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } },
};

const SENSITIVE_FIELDS = ['salary', 'bank_name', 'bank_account_no', 'ifsc_code', 'aadhar_no', 'pan_no', 'pf_number', 'esi_number', 'uan_number'];

export default function StaffForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [roles, setRoles] = useState([]);
  const isPrivileged = useAuthStore(s => s.hasRole('school_admin', 'principal'));
  const [form, setForm] = useState({
    first_name: '', last_name: '', employee_id: '', gender: '',
    date_of_birth: '', phone: '', email: '', qualification: '',
    experience_years: '', designation: '', department: '',
    date_of_joining: '', salary: '', address: '', city: '', state: '',
    staff_type: 'teaching', contract_type: 'permanent',
    probation_end_date: '', contract_end_date: '',
    pf_number: '', esi_number: '', uan_number: '',
    aadhar_no: '', pan_no: '', bank_name: '', bank_account_no: '', ifsc_code: '',
    emergency_contact: '', emergency_person: '',
    blood_group: '', marital_status: '', spouse_name: '',
    create_login: false, role: 'teacher', password: '', role_ids: []
  });

  useEffect(() => {
    authAPI.listRoles().then(res => {
      const data = res.data.data || [];
      setRoles(data);
      if (data.length === 0) console.warn('Roles API returned empty list');
    }).catch(err => console.error('Failed to load roles:', err));
  }, []);

  useEffect(() => {
    if (isEdit) {
      staffAPI.get(id, { params: { edit: 1 } }).then(res => {
        const s = res.data.data;
        setForm({
          first_name: s.first_name || '', last_name: s.last_name || '', employee_id: s.employee_id || '',
          gender: s.gender || '', date_of_birth: s.date_of_birth || '', phone: s.phone || '',
          email: s.email || '', qualification: s.qualification || '',
          experience_years: s.experience_years || '', designation: s.designation || '',
          department: s.department || '', date_of_joining: s.date_of_joining || '',
          salary: s.salary || '', address: s.address || '', city: s.city || '', state: s.state || '',
          staff_type: s.staff_type || 'teaching', contract_type: s.contract_type || 'permanent',
          probation_end_date: s.probation_end_date || '', contract_end_date: s.contract_end_date || '',
          pf_number: s.pf_number || '', esi_number: s.esi_number || '', uan_number: s.uan_number || '',
          aadhar_no: s.aadhar_no || '', pan_no: s.pan_no || '',
          bank_name: s.bank_name || '', bank_account_no: s.bank_account_no || '', ifsc_code: s.ifsc_code || '',
          emergency_contact: s.emergency_contact || '', emergency_person: s.emergency_person || '',
          blood_group: s.blood_group || '', marital_status: s.marital_status || '',
          spouse_name: s.spouse_name || '',
          create_login: s.login_created, role: s.role || 'teacher', password: '', role_ids: s.role_ids || []
        });
      }).catch(() => { toast.error('Failed to load staff'); navigate('/staff'); });
    }
  }, [id]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleRoleIds = (e) => {
    const { value } = e.target;
    const newIds = (typeof value === 'string' ? value.split(',') : value).map(Number);
    setForm(prev => ({ ...prev, role_ids: newIds }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && form.create_login && !form.password) {
      toast.error('Password is required when creating login');
      return;
    }
    try {
      if (isEdit) {
        const payload = { ...form };
        if (!isPrivileged) SENSITIVE_FIELDS.forEach(f => delete payload[f]);
        await staffAPI.update(id, payload);
        toast.success('Staff updated');
      } else {
        await staffAPI.create(form);
        toast.success('Staff created');
      }
      navigate('/staff');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/staff')} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h5" gutterBottom>{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</Typography>

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
              <TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))} inputProps={{ maxLength: 10 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} error={form.email.length > 0 && !form.email.includes('@')} helperText={form.email.length > 0 && !form.email.includes('@') ? 'Invalid email' : ''} />
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
              <TextField fullWidth label="Salary" type="number" value={form.salary} onChange={handleChange('salary')} disabled={isEdit && !isPrivileged} />
            </Grid>

            {/* Login & Role Assignment */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>Login & Role Assignment</Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    {!isEdit && (
                    <TextField fullWidth select label="Create Login?" value={form.create_login ? 'yes' : 'no'}
                      onChange={e => setForm(prev => ({ ...prev, create_login: e.target.value === 'yes', password: '' }))}>
                      <MenuItem value="yes">Yes — Create Login</MenuItem>
                      <MenuItem value="no">No — Skip Login</MenuItem>
                    </TextField>
                    )}
                  </Grid>
                  {(isEdit || form.create_login) && (
                    <>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth select label="Primary Role" value={form.role} onChange={handleChange('role')}>
                          {roles.filter(r => r.name !== 'super_admin').map(r => (
                            <MenuItem key={r.id} value={r.name}>{r.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      {!isEdit && (
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth required label="Password" type="password" value={form.password}
                            onChange={handleChange('password')} helperText={form.create_login && !form.password ? 'Required' : ''} />
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Additional Roles (optional)</InputLabel>
                          <Select multiple value={form.role_ids} onChange={handleRoleIds}
                            input={<OutlinedInput label="Additional Roles (optional)" />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((rid) => {
                                  const r = roles.find(r => r.id == rid);
                                  return r ? <Chip key={rid} label={r.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} size="small"
                                    onDelete={() => {
                                      const next = form.role_ids.filter(v => v !== rid);
                                      setForm(prev => ({ ...prev, role_ids: next }));
                                    }} /> : null;
                                })}
                              </Box>
                            )}
                            MenuProps={MenuProps}>
                            {roles.filter(r => r.name !== 'super_admin').map(r => (
                              <MenuItem key={r.id} value={r.id}>
                                {r.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Statutory & Emergency</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="PF Number" value={form.pf_number} onChange={handleChange('pf_number')} disabled={!isPrivileged} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="ESI Number" value={form.esi_number} onChange={handleChange('esi_number')} disabled={!isPrivileged} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="UAN Number" value={form.uan_number} onChange={handleChange('uan_number')} disabled={!isPrivileged} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Emergency Contact Person" value={form.emergency_person} onChange={handleChange('emergency_person')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Emergency Contact Number" value={form.emergency_contact} onChange={(e) => setForm(prev => ({ ...prev, emergency_contact: e.target.value.replace(/\D/g, '') }))} inputProps={{ maxLength: 15 }} />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Financial Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Bank Name" value={form.bank_name} onChange={handleChange('bank_name')} disabled={!isPrivileged} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Bank Account No" value={form.bank_account_no} onChange={handleChange('bank_account_no')} disabled={!isPrivileged} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="IFSC Code" value={form.ifsc_code} onChange={handleChange('ifsc_code')} disabled={!isPrivileged} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Aadhaar No" value={form.aadhar_no} onChange={handleChange('aadhar_no')} disabled={!isPrivileged} inputProps={{ maxLength: 12 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="PAN No" value={form.pan_no} onChange={handleChange('pan_no')} disabled={!isPrivileged} />
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

        <Button type="submit" variant="contained" size="large" startIcon={<Save />}>{isEdit ? 'Update Staff' : 'Create Staff'}</Button>
      </form>
    </Box>
  );
}
