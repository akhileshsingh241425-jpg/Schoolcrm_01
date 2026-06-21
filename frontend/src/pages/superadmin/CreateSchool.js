import React, { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Alert, CircularProgress, Switch, FormControlLabel, Divider,
  Chip, Stack, InputAdornment, IconButton, Collapse, MenuItem,
  Select, FormControl, InputLabel, Autocomplete, Tooltip, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar
} from '@mui/material';
import {
  School, Save, ArrowBack, Person, Email, Phone,
  LocationOn, Language, Business, ContentCopy,
  Add, Delete, CameraAlt, Upload, Badge, Description,
  NoteAdd, Settings, ExpandMore, ExpandLess, Link as LinkIcon,
  Search, Work, PhotoCamera, Panorama, Numbers
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { superAdminAPI } from '../../services/api';

const FEATURES_LIST = [
  { key: 'student_management', label: 'Student Management' },
  { key: 'staff_management', label: 'Staff Management' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'fee_management', label: 'Fee Management' },
  { key: 'academic', label: 'Academics' },
  { key: 'library', label: 'Library' },
  { key: 'transport', label: 'Transport' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'canteen', label: 'Canteen' },
  { key: 'health_safety', label: 'Health & Safety' },
  { key: 'sports', label: 'Sports' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'communication', label: 'Communication' },
  { key: 'reports', label: 'Reports' },
  { key: 'marketing_crm', label: 'Leads / CRM' },
  { key: 'admission', label: 'Admissions' },
  { key: 'parent_engagement', label: 'Parent Portal' },
];

const DEFAULT_FEATURES = [
  'student_management', 'staff_management', 'attendance', 'fee_management', 'academic', 'reports'
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli',
  'Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

const SESSION_OPTIONS = ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'];

const STAFF_CATEGORIES = [
  { value: 'director', label: 'Director' },
  { value: 'principal', label: 'Principal' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'transport_manager', label: 'Transport Manager' },
];

export default function CreateSchool() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDirector, setShowDirector] = useState(false);
  const [showAlternate, setShowAlternate] = useState(false);
  const [customFieldDialog, setCustomFieldDialog] = useState(false);
  const [staffCategoryDialog, setStaffCategoryDialog] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ label: '', type: 'textbox' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    short_name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    website: '',
    domain_name: '',
    principal_name: '',
    principal_email: '',
    principal_phone: '',
    board: 'CBSE',
    school_type: 'co-ed',
    established_year: '',
    registration_number: '',
    session: '',
    notes: '',
  });

  const [alternateContacts, setAlternateContacts] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [features, setFeatures] = useState(new Set(DEFAULT_FEATURES));
  const [staffCategory, setStaffCategory] = useState('');

  const [director, setDirector] = useState({
    name: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    qualification: '',
    experience_years: '',
    aadhar_no: '',
    aadhar_doc: null,
    aadhar_doc_preview: '',
    pan_no: '',
    pan_doc: null,
    pan_doc_preview: '',
    photo: null,
    photo_preview: '',
    other_doc_name: '',
    other_doc: null,
    other_doc_preview: '',
  });

  const [adminForm, setAdminForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const handleAdminChange = (key, value) => setAdminForm(prev => ({ ...prev, [key]: value }));
  const handleDirectorChange = (key, value) => setDirector(prev => ({ ...prev, [key]: value }));

  const numField = (handler, key, maxLen) => (e) => {
    handler(key, e.target.value.replace(/\D/g, '').slice(0, maxLen));
  };

  const toggleFeature = (key) => {
    setFeatures(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const addAlternateContact = () => {
    setAlternateContacts([...alternateContacts, { name: '', phone: '', relation: '' }]);
    setShowAlternate(true);
  };

  const updateAlternate = (idx, key, value) => {
    const updated = [...alternateContacts];
    updated[idx][key] = value;
    setAlternateContacts(updated);
  };

  const removeAlternate = (idx) => {
    setAlternateContacts(alternateContacts.filter((_, i) => i !== idx));
  };

  const addCustomField = () => {
    if (newCustomField.label) {
      setCustomFields([...customFields, { ...newCustomField, value: '' }]);
      setNewCustomField({ label: '', type: 'textbox' });
      setCustomFieldDialog(false);
    }
  };

  const updateCustomFieldValue = (idx, value) => {
    const updated = [...customFields];
    updated[idx] = { ...updated[idx], value };
    setCustomFields(updated);
  };

  const removeCustomField = (idx) => {
    setCustomFields(customFields.filter((_, i) => i !== idx));
  };

  const addCustomCategory = () => {
    if (newCategoryName.trim()) {
      setCustomCategories([...customCategories, newCategoryName.trim()]);
      setStaffCategory(newCategoryName.trim());
      setNewCategoryName('');
      setStaffCategoryDialog(false);
    }
  };

  // ── File Upload Handling ──────────────────────────────────────────
  const handleFileSelect = (field, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setDirector(prev => ({
      ...prev,
      [field]: file,
      [field.replace('_doc', '_doc_preview').replace('photo', 'photo_preview')]: previewUrl,
    }));
  };

  const triggerUpload = (field) => {
    if (field === 'photo') {
      fileInputRef.current.dataset.target = field;
      fileInputRef.current.click();
    } else {
      fileInputRef.current.dataset.target = field;
      fileInputRef.current.click();
    }
  };

  const triggerCamera = (field) => {
    cameraInputRef.current.dataset.target = field;
    cameraInputRef.current.click();
  };

  const processOcr = async (file) => {
    if (!file) return;
    setOcrProcessing(true);
    try {
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => { if (m.status === 'recognizing text') { /* progress */ } },
      });
      const text = data.text;
      // Extract Aadhar number (12 digits)
      const aadharMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      if (aadharMatch) {
        handleDirectorChange('aadhar_no', aadharMatch[0].replace(/\s/g, ''));
      }
    } catch (err) {
      console.error('OCR failed:', err);
    } finally {
      setOcrProcessing(false);
    }
  };

  const onFileInput = (e) => {
    const file = e.target.files?.[0];
    const target = e.target.dataset?.target;
    if (!file || !target) return;
    handleFileSelect(target, file);
    if (target === 'aadhar_doc') {
      processOcr(file);
    }
    e.target.value = '';
  };

  // ── Upload to Server ──────────────────────────────────────────────
  const uploadDoc = async (schoolCode, docType, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('school_code', schoolCode);
    const res = await superAdminAPI.uploadDoc(formData);
    return res.data.data.url;
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      setError('School name and email are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        features: Array.from(features),
        alternate_contacts: alternateContacts.length > 0 ? alternateContacts : undefined,
        custom_fields: customFields.length > 0 ? customFields : undefined,
        admin: adminForm.email ? adminForm : undefined,
        director: director.name ? {
          name: director.name,
          email: director.email,
          phone: director.phone,
          secondary_phone: director.secondary_phone,
          address: director.address,
          city: director.city,
          state: director.state,
          pincode: director.pincode,
          qualification: director.qualification,
          experience_years: director.experience_years ? parseInt(director.experience_years) : undefined,
          aadhar_no: director.aadhar_no,
          pan_no: director.pan_no,
          other_doc_name: director.other_doc_name,
        } : undefined,
        staff_category: staffCategory ? { category: staffCategory } : undefined,
      };

      const res = await superAdminAPI.createSchool(payload);
      const schoolCode = res.data.data.code;

      // Upload documents if director exists and files selected
      if (director.name) {
        if (director.aadhar_doc) await uploadDoc(schoolCode, 'aadhar', director.aadhar_doc);
        if (director.pan_doc) await uploadDoc(schoolCode, 'pan', director.pan_doc);
        if (director.photo) await uploadDoc(schoolCode, 'photo', director.photo);
        if (director.other_doc) await uploadDoc(schoolCode, 'other', director.other_doc);
      }

      setSuccess('School created successfully!');
      setTimeout(() => navigate('/super-admin/schools'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" hidden accept="image/*,.pdf,.doc,.docx"
        data-target="" onChange={onFileInput} />
      <input ref={cameraInputRef} type="file" hidden accept="image/*" capture="environment"
        data-target="" onChange={onFileInput} />

      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/super-admin/schools')}
          sx={{ color: 'text.secondary' }}>
          Back
        </Button>
        <Box display="flex" alignItems="center" gap={1.5}>
          <School sx={{ color: '#6366f1', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Create New School</Typography>
            <Typography variant="body2" color="text.secondary">Register a new school on the platform</Typography>
          </Box>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* ── Left Column: Forms ─────────────────────────────── */}
        <Grid item xs={12} lg={8}>
          {/* ═══ School Information ═══ */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <Business fontSize="small" color="primary" /> School Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="School Name" value={form.name}
                    onChange={e => handleChange('name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="School Short Name" value={form.short_name}
                    placeholder="e.g. SPS"
                    onChange={e => handleChange('short_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="School Email" type="email" value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" value={form.phone}
                    onChange={numField(handleChange, 'phone', 10)}
                    inputProps={{ maxLength: 10 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Secondary Mobile No." value={form.secondary_phone}
                    onChange={numField(handleChange, 'secondary_phone', 10)}
                    inputProps={{ maxLength: 10 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="School Search URL / Domain Name" value={form.domain_name}
                    placeholder="e.g. school.example.com"
                    onChange={e => handleChange('domain_name', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Language fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" multiline rows={2} value={form.address}
                    onChange={e => handleChange('address', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="City" value={form.city}
                    onChange={e => handleChange('city', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>State</InputLabel>
                    <Select label="State" value={form.state}
                      onChange={e => handleChange('state', e.target.value)}>
                      {INDIAN_STATES.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <TextField fullWidth label="Pincode" value={form.pincode}
                    onChange={numField(handleChange, 'pincode', 6)}
                    inputProps={{ maxLength: 6 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Website" value={form.website}
                    onChange={e => handleChange('website', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Language fontSize="small" /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Registration Number" value={form.registration_number}
                    onChange={e => handleChange('registration_number', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="Board" value={form.board}
                    onChange={e => handleChange('board', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="School Type" value={form.school_type}
                    onChange={e => handleChange('school_type', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="Est. Year" type="number" value={form.established_year}
                    onChange={e => handleChange('established_year', e.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Session</InputLabel>
                    <Select label="Session" value={form.session}
                      onChange={e => handleChange('session', e.target.value)}>
                      {SESSION_OPTIONS.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* ── Add Alternate Link ── */}
              <Box mt={2}>
                <Button size="small" startIcon={<Add />} onClick={addAlternateContact}
                  sx={{ textTransform: 'none', color: '#6366f1', fontWeight: 600 }}>
                  Add Alternate Contact
                </Button>
              </Box>

              <Collapse in={alternateContacts.length > 0}>
                <Stack spacing={1.5} mt={1.5}>
                  {alternateContacts.map((alt, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label="Name" value={alt.name}
                            onChange={e => updateAlternate(idx, 'name', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField fullWidth size="small" label="Phone" value={alt.phone}
                            onChange={e => updateAlternate(idx, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            inputProps={{ maxLength: 10 }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField fullWidth size="small" label="Relation" value={alt.relation}
                            onChange={e => updateAlternate(idx, 'relation', e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <IconButton size="small" color="error" onClick={() => removeAlternate(idx)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </Collapse>

              {/* ── Notes Field ── */}
              <Box mt={2}>
                <TextField fullWidth label="Notes" multiline rows={2} value={form.notes}
                  placeholder="Any additional notes about the school..."
                  onChange={e => handleChange('notes', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><NoteAdd fontSize="small" /></InputAdornment> }} />
              </Box>

              {/* ── Custom Fields ── */}
              <Box mt={2} display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2" color="text.secondary">Custom Fields:</Typography>
                <Button size="small" startIcon={<Add />} onClick={() => setCustomFieldDialog(true)}
                  sx={{ textTransform: 'none', color: '#6366f1', fontWeight: 600 }}>
                  Add Custom Field
                </Button>
              </Box>

              {customFields.length > 0 && (
                <Stack spacing={1.5} mt={1.5}>
                  {customFields.map((cf, idx) => (
                    <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Grid container spacing={1.5} alignItems="center">
                        <Grid item xs={12} sm={3}>
                          <Typography variant="body2" fontWeight={600}>{cf.label}</Typography>
                          <Chip label={cf.type === 'textbox' ? 'Text' : 'Upload'} size="small"
                            color={cf.type === 'textbox' ? 'primary' : 'secondary'} variant="outlined" />
                        </Grid>
                        <Grid item xs={12} sm={7}>
                          {cf.type === 'textbox' ? (
                            <TextField fullWidth size="small" placeholder="Text Value" value={cf.value}
                              onChange={e => updateCustomFieldValue(idx, e.target.value)} />
                          ) : (
                            <Button variant="outlined" component="label" size="small" startIcon={<Upload />}>
                              Upload File
                              <input type="file" hidden onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) updateCustomFieldValue(idx, file.name);
                              }} />
                            </Button>
                          )}
                        </Grid>
                        <Grid item xs={12} sm={2}>
                          <IconButton size="small" color="error" onClick={() => removeCustomField(idx)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* ═══ Principal Information ═══ */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <Person fontSize="small" color="primary" /> Principal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Principal Name" value={form.principal_name}
                    onChange={e => handleChange('principal_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Principal Email" type="email" value={form.principal_email}
                    onChange={e => handleChange('principal_email', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField fullWidth label="Principal Phone" value={form.principal_phone}
                    onChange={numField(handleChange, 'principal_phone', 10)}
                    inputProps={{ maxLength: 10 }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ═══ Director Information ═══ */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={600} display="flex" alignItems="center" gap={1}>
                  <Badge fontSize="small" color="primary" /> Director Information
                </Typography>
                <Button size="small"
                  startIcon={showDirector ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowDirector(!showDirector)}
                  sx={{ textTransform: 'none' }}>
                  {showDirector ? 'Collapse' : 'Add Director'}
                </Button>
              </Box>

              <Collapse in={showDirector}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Director Name" value={director.name}
                      onChange={e => handleDirectorChange('name', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" type="email" value={director.email}
                      onChange={e => handleDirectorChange('email', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Phone" value={director.phone}
                      onChange={numField(handleDirectorChange, 'phone', 10)}
                      inputProps={{ maxLength: 10 }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Secondary Phone" value={director.secondary_phone}
                      onChange={numField(handleDirectorChange, 'secondary_phone', 10)}
                      inputProps={{ maxLength: 10 }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Qualification" value={director.qualification}
                      onChange={e => handleDirectorChange('qualification', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Experience (Years)" type="number" value={director.experience_years}
                      onChange={e => handleDirectorChange('experience_years', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>State</InputLabel>
                      <Select label="State" value={director.state}
                        onChange={e => handleDirectorChange('state', e.target.value)}>
                        {INDIAN_STATES.map(s => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="City" value={director.city}
                      onChange={e => handleDirectorChange('city', e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" multiline rows={2} value={director.address}
                      onChange={e => handleDirectorChange('address', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Pincode" value={director.pincode}
                      onChange={numField(handleDirectorChange, 'pincode', 6)}
                      inputProps={{ maxLength: 6 }} />
                  </Grid>

                  {/* ── Aadhar ── */}
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Aadhar Number" value={director.aadhar_no}
                      onChange={e => handleDirectorChange('aadhar_no', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Badge fontSize="small" /></InputAdornment>,
                      }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={1} alignItems="center">
                      <Button variant="outlined" size="small" startIcon={<Upload />}
                        onClick={() => { fileInputRef.current.dataset.target = 'aadhar_doc'; fileInputRef.current.click(); }}>
                        Upload Aadhar
                      </Button>
                      <Tooltip title="Capture via Camera & OCR">
                        <Button variant="outlined" size="small" startIcon={<CameraAlt />}
                          onClick={() => { cameraInputRef.current.dataset.target = 'aadhar_doc'; cameraInputRef.current.click(); }}>
                          Scan
                        </Button>
                      </Tooltip>
                      {ocrProcessing && <CircularProgress size={20} />}
                      {director.aadhar_doc_preview && (
                        <Chip label="Uploaded" size="small" color="success"
                          onDelete={() => setDirector(prev => ({ ...prev, aadhar_doc: null, aadhar_doc_preview: '' }))} />
                      )}
                    </Box>
                  </Grid>

                  {/* ── PAN ── */}
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="PAN Number" value={director.pan_no}
                      onChange={e => handleDirectorChange('pan_no', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={1} alignItems="center">
                      <Button variant="outlined" size="small" startIcon={<Upload />}
                        onClick={() => { fileInputRef.current.dataset.target = 'pan_doc'; fileInputRef.current.click(); }}>
                        Upload PAN
                      </Button>
                      {director.pan_doc_preview && (
                        <Chip label="Uploaded" size="small" color="success"
                          onDelete={() => setDirector(prev => ({ ...prev, pan_doc: null, pan_doc_preview: '' }))} />
                      )}
                    </Box>
                  </Grid>

                  {/* ── Photo ── */}
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={1} alignItems="center">
                      <Button variant="outlined" size="small" startIcon={<PhotoCamera />}
                        onClick={() => { fileInputRef.current.dataset.target = 'photo'; fileInputRef.current.click(); }}>
                        Upload Photo
                      </Button>
                      {director.photo_preview && (
                        <Chip label="Uploaded" size="small" color="success"
                          onDelete={() => setDirector(prev => ({ ...prev, photo: null, photo_preview: '' }))} />
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} />

                  {/* ── Other Document ── */}
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Other Document Name" value={director.other_doc_name}
                      placeholder="e.g. Resume, Certificate"
                      onChange={e => handleDirectorChange('other_doc_name', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={1} alignItems="center">
                      <Button variant="outlined" size="small" startIcon={<Upload />}
                        onClick={() => { fileInputRef.current.dataset.target = 'other_doc'; fileInputRef.current.click(); }}>
                        Upload Document
                      </Button>
                      {director.other_doc_preview && (
                        <Chip label="Uploaded" size="small" color="success"
                          onDelete={() => setDirector(prev => ({ ...prev, other_doc: null, other_doc_preview: '' }))} />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Collapse>
            </CardContent>
          </Card>

          {/* ═══ Staff Category ═══ */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2} display="flex" alignItems="center" gap={1}>
                <Work fontSize="small" color="primary" /> Staff Category
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    freeSolo
                    options={[...STAFF_CATEGORIES.map(c => c.label), ...customCategories]}
                    value={staffCategory}
                    onInputChange={(_, val) => setStaffCategory(val)}
                    renderInput={(params) => (
                      <TextField {...params} label="Select or Type Category" placeholder="Search or type..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                        }} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" startIcon={<Add />} onClick={() => setStaffCategoryDialog(true)}
                    sx={{ textTransform: 'none' }}>
                    Create New Category
                  </Button>
                </Grid>
              </Grid>
              {staffCategory && (
                <Chip label={`Selected: ${staffCategory}`} color="primary" size="small"
                  onDelete={() => setStaffCategory('')} sx={{ mt: 1.5 }} />
              )}
            </CardContent>
          </Card>

          {/* ═══ Admin Account ═══ */}
          <Card sx={{ borderRadius: 2, mb: { xs: 3, lg: 0 } }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={0.5} display="flex" alignItems="center" gap={1}>
                <Person fontSize="small" color="secondary" /> Create School Admin Account
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Optional - create login credentials for the school admin
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth label="Admin First Name" value={adminForm.first_name}
                    onChange={e => handleAdminChange('first_name', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth label="Admin Last Name" value={adminForm.last_name}
                    onChange={e => handleAdminChange('last_name', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Admin Email" type="email" value={adminForm.email}
                    onChange={e => handleAdminChange('email', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Admin Password" type="password" value={adminForm.password}
                    onChange={e => handleAdminChange('password', e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right Column: Features + Submit ──────────────────── */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, position: { lg: 'sticky' }, top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={0.5}>Module Features</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Enable features for this school
              </Typography>
              <Stack spacing={0.5}>
                {FEATURES_LIST.map(f => (
                  <FormControlLabel key={f.key}
                    control={<Switch size="small" checked={features.has(f.key)}
                      onChange={() => toggleFeature(f.key)} color="primary" />}
                    label={<Typography variant="body2">{f.label}</Typography>}
                    sx={{ m: 0, px: 1, py: 0.25, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  />
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                {features.size} of {FEATURES_LIST.length} modules enabled
              </Typography>
            </CardContent>
          </Card>

          <Button
            fullWidth variant="contained" size="large"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSubmit} disabled={saving}
            sx={{ mt: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1.5, borderRadius: 2 }}
          >
            {saving ? 'Creating School...' : 'Create School'}
          </Button>
        </Grid>
      </Grid>

      {/* ── Custom Field Dialog ── */}
      <Dialog open={customFieldDialog} onClose={() => setCustomFieldDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Custom Field</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField fullWidth label="Field Label" value={newCustomField.label}
              onChange={e => setNewCustomField({ ...newCustomField, label: e.target.value })}
              placeholder="e.g. Board Affiliation Number" />
            <FormControl fullWidth size="small">
              <InputLabel>Field Type</InputLabel>
              <Select label="Field Type" value={newCustomField.type}
                onChange={e => setNewCustomField({ ...newCustomField, type: e.target.value })}>
                <MenuItem value="textbox">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Numbers fontSize="small" /> Textbox (Text Value)
                  </Box>
                </MenuItem>
                <MenuItem value="upload">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Upload fontSize="small" /> Upload File
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            {newCustomField.type === 'textbox' && (
              <Typography variant="caption" color="text.secondary">
                Text Value will appear once field is added
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomFieldDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addCustomField} disabled={!newCustomField.label}>
            Add Field
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Staff Category Dialog ── */}
      <Dialog open={staffCategoryDialog} onClose={() => setStaffCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Staff Category</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Category Name" value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="e.g. Vice Principal" sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffCategoryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addCustomCategory} disabled={!newCategoryName.trim()}>
            Create & Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
