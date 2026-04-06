import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, Stepper, Step,
  StepLabel, Divider, Alert, IconButton, Chip
} from '@mui/material';
import { Save, ArrowBack, Add, Delete, NavigateNext, NavigateBefore } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { studentsAPI } from '../../services/api';

const STEPS = ['Personal Info', 'Academic & Address', 'Parent / Guardian', 'Medical & Transport', 'Additional Info'];

const INITIAL_FORM = {
  first_name: '', last_name: '', admission_no: '', roll_no: '',
  gender: '', date_of_birth: '', blood_group: '', aadhar_no: '',
  religion: '', category: '', nationality: 'Indian', mother_tongue: '',
  address: '', city: '', state: '', pincode: '',
  class_id: '', section_id: '', academic_year_id: '', admission_date: '',
  emergency_contact: '', emergency_person: '',
  medical_conditions: '', allergies: '',
  previous_school: '', transport_mode: 'self', house_id: '',
  parents: [
    { relation: 'father', name: '', phone: '', email: '', occupation: '', income: '', qualification: '', aadhar_no: '' },
    { relation: 'mother', name: '', phone: '', email: '', occupation: '', income: '', qualification: '', aadhar_no: '' }
  ]
};

export default function StudentForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [houses, setHouses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    studentsAPI.listClasses().then(r => setClasses(r.data.data || [])).catch(() => {});
    studentsAPI.listAcademicYears().then(r => setAcademicYears(r.data.data || [])).catch(() => {});
    studentsAPI.listHouses().then(r => setHouses(r.data.data || [])).catch(() => {});
    if (isEdit) {
      studentsAPI.get(id).then(res => {
        const s = res.data.data;
        setForm({
          ...INITIAL_FORM, ...s,
          class_id: s.current_class?.id || '',
          section_id: s.current_section?.id || '',
          academic_year_id: s.academic_year_id || '',
          house_id: s.house?.id || '',
          parents: s.parents?.length > 0 ? s.parents : INITIAL_FORM.parents
        });
      }).catch(() => navigate('/students'));
    }
  }, [id]);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleParentChange = (idx, field) => (e) => {
    const parents = [...form.parents];
    parents[idx] = { ...parents[idx], [field]: e.target.value };
    setForm({ ...form, parents });
  };

  const addParent = () => setForm({ ...form, parents: [...form.parents, { relation: 'guardian', name: '', phone: '', email: '', occupation: '', income: '', qualification: '', aadhar_no: '' }] });
  const removeParent = (idx) => setForm({ ...form, parents: form.parents.filter((_, i) => i !== idx) });

  const handleSubmit = async () => {
    if (!form.first_name) { toast.error('First name is required'); setActiveStep(0); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await studentsAPI.update(id, form);
        toast.success('Student updated successfully');
      } else {
        await studentsAPI.create(form);
        toast.success('Student created successfully');
      }
      navigate('/students');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving student');
    }
    setSaving(false);
  };

  const selectedClass = classes.find(c => c.id === form.class_id);

  const renderStep = () => {
    switch (activeStep) {
      case 0: return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Personal Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="First Name" required value={form.first_name} onChange={handleChange('first_name')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Last Name" value={form.last_name} onChange={handleChange('last_name')} />
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
              <TextField fullWidth select label="Blood Group" value={form.blood_group} onChange={handleChange('blood_group')}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Aadhar No" value={form.aadhar_no} onChange={handleChange('aadhar_no')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Religion" value={form.religion} onChange={handleChange('religion')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Category" value={form.category} onChange={handleChange('category')}>
                {['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Nationality" value={form.nationality} onChange={handleChange('nationality')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Mother Tongue" value={form.mother_tongue} onChange={handleChange('mother_tongue')} />
            </Grid>
          </Grid>
        </Paper>
      );

      case 1: return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Academic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Admission No" value={form.admission_no} onChange={handleChange('admission_no')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Roll No" value={form.roll_no} onChange={handleChange('roll_no')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth label="Admission Date" type="date" InputLabelProps={{ shrink: true }} value={form.admission_date} onChange={handleChange('admission_date')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Class" value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value, section_id: '' })}>
                <MenuItem value="">Select</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Section" value={form.section_id} onChange={handleChange('section_id')}>
                <MenuItem value="">Select</MenuItem>
                {(selectedClass?.sections || []).map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth select label="Academic Year" value={form.academic_year_id} onChange={handleChange('academic_year_id')}>
                <MenuItem value="">Select</MenuItem>
                {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Previous School" value={form.previous_school} onChange={handleChange('previous_school')} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Address</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Address" multiline rows={2} value={form.address} onChange={handleChange('address')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="City" value={form.city} onChange={handleChange('city')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" value={form.state} onChange={handleChange('state')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Pincode" value={form.pincode} onChange={handleChange('pincode')} />
            </Grid>
          </Grid>
        </Paper>
      );

      case 2: return (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Parent / Guardian Details</Typography>
            <Button size="small" startIcon={<Add />} onClick={addParent}>Add Guardian</Button>
          </Box>
          {form.parents.map((parent, idx) => (
            <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, position: 'relative' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Chip label={`${parent.relation?.charAt(0).toUpperCase()}${parent.relation?.slice(1) || 'Parent'} ${idx + 1}`} color="primary" size="small" />
                {form.parents.length > 1 && (
                  <IconButton size="small" color="error" onClick={() => removeParent(idx)}><Delete /></IconButton>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth select label="Relation" value={parent.relation} onChange={handleParentChange(idx, 'relation')}>
                    <MenuItem value="father">Father</MenuItem>
                    <MenuItem value="mother">Mother</MenuItem>
                    <MenuItem value="guardian">Guardian</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Full Name" value={parent.name} onChange={handleParentChange(idx, 'name')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Phone" value={parent.phone} onChange={handleParentChange(idx, 'phone')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Email" value={parent.email} onChange={handleParentChange(idx, 'email')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Occupation" value={parent.occupation} onChange={handleParentChange(idx, 'occupation')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Annual Income" value={parent.income} onChange={handleParentChange(idx, 'income')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Qualification" value={parent.qualification} onChange={handleParentChange(idx, 'qualification')} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Aadhar No" value={parent.aadhar_no} onChange={handleParentChange(idx, 'aadhar_no')} />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Paper>
      );

      case 3: return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Medical Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Medical Conditions" multiline rows={3} value={form.medical_conditions}
                onChange={handleChange('medical_conditions')} helperText="List any chronic conditions, disabilities etc." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Allergies" multiline rows={3} value={form.allergies}
                onChange={handleChange('allergies')} helperText="Food, medicine or other allergies" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Emergency Contact</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Emergency Contact Person" value={form.emergency_person} onChange={handleChange('emergency_person')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Emergency Contact Number" value={form.emergency_contact} onChange={handleChange('emergency_contact')} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Transport</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Transport Mode" value={form.transport_mode} onChange={handleChange('transport_mode')}>
                <MenuItem value="bus">School Bus</MenuItem>
                <MenuItem value="van">School Van</MenuItem>
                <MenuItem value="self">Self (Parent Drop)</MenuItem>
                <MenuItem value="walk">Walk</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>
      );

      case 4: return (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Additional Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="House" value={form.house_id} onChange={handleChange('house_id')}>
                <MenuItem value="">None</MenuItem>
                {houses.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Review Summary</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>Please review the details before submitting.</Alert>
          <Grid container spacing={2}>
            {[
              ['Name', `${form.first_name} ${form.last_name}`],
              ['Gender', form.gender],
              ['DOB', form.date_of_birth],
              ['Admission No', form.admission_no],
              ['Class', classes.find(c => c.id === form.class_id)?.name || '-'],
              ['Section', selectedClass?.sections?.find(s => s.id === form.section_id)?.name || '-'],
              ['Blood Group', form.blood_group],
              ['Category', form.category],
              ['Transport', form.transport_mode],
              ['Parents', form.parents.filter(p => p.name).map(p => `${p.relation}: ${p.name}`).join(', ')],
            ].map(([label, value]) => (
              <Grid item xs={12} sm={6} md={4} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography>{value || 'N/A'}</Typography>
              </Grid>
            ))}
          </Grid>
        </Paper>
      );

      default: return null;
    }
  };

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')} sx={{ mb: 2 }}>Back to Students</Button>
      <Typography variant="h5" fontWeight={700} gutterBottom>{isEdit ? 'Edit Student' : 'Add New Student'}</Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {renderStep()}

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button variant="outlined" startIcon={<NavigateBefore />} onClick={() => setActiveStep(s => s - 1)} disabled={activeStep === 0}>
          Previous
        </Button>
        <Box display="flex" gap={1}>
          {activeStep < STEPS.length - 1 ? (
            <Button variant="contained" endIcon={<NavigateNext />} onClick={() => setActiveStep(s => s + 1)}>Next</Button>
          ) : (
            <Button variant="contained" color="success" startIcon={<Save />} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Student' : 'Create Student'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
