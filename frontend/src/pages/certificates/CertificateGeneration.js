import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Grid, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, MenuItem,
  Autocomplete, CircularProgress, Checkbox, FormControlLabel, Divider,
  alpha, useTheme
} from '@mui/material';
import {
  Add, Print, Download, Refresh, Visibility, Description,
  WorkspacePremium, School, VerifiedUser, EmojiEvents, Close,
  CheckCircle, People
} from '@mui/icons-material';
import { admissionsAPI, sportsAPI, studentsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ py: 2 }}>{children}</Box> : null;
}

const CERTIFICATE_TYPES = [
  { label: 'Transfer Certificate', icon: <Description />, key: 'tc' },
  { label: 'Character Certificate', icon: <VerifiedUser />, key: 'character' },
  { label: 'Bonafide Certificate', icon: <School />, key: 'bonafide' },
  { label: 'Sports/Achievement', icon: <EmojiEvents />, key: 'sports' },
];

const SCHOOL_INFO = {
  name: 'Delhi Public School',
  address: '123 Education Lane, New Delhi - 110001',
  phone: '+91-11-2345-6789',
  email: 'info@dps.edu.in',
  affiliation: 'CBSE Affiliation No: 2730001',
  logo: '/logo.png',
};

export default function CertificateGeneration() {
  const [tab, setTab] = useState(0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const theme = useTheme();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Certificate Generation
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => setBulkMode(true)}
            sx={{ mr: 1 }}
          >
            Bulk Generate
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGenerateOpen(true)}
          >
            Generate Certificate
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {CERTIFICATE_TYPES.map((ct, i) => (
            <Tab key={ct.key} label={ct.label} icon={ct.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Paper>

      <TabPanel value={tab} index={0}>
        <TCTab onPreview={(data) => { setPreviewData({ ...data, type: 'tc' }); setPreviewOpen(true); }} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <CharacterTab onPreview={(data) => { setPreviewData({ ...data, type: 'character' }); setPreviewOpen(true); }} />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <BonafideTab onPreview={(data) => { setPreviewData({ ...data, type: 'bonafide' }); setPreviewOpen(true); }} />
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <SportsTab onPreview={(data) => { setPreviewData({ ...data, type: 'sports' }); setPreviewOpen(true); }} />
      </TabPanel>

      {/* Generate Certificate Dialog */}
      <GenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onPreview={(data) => { setPreviewData(data); setPreviewOpen(true); setGenerateOpen(false); }}
      />

      {/* Bulk Generate Dialog */}
      <BulkGenerateDialog open={bulkMode} onClose={() => setBulkMode(false)} />

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={previewData}
      />
    </Box>
  );
}

// ==================== STUDENT SEARCH COMPONENT ====================
function StudentSearch({ value, onChange, multiple = false }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (inputValue.length < 2) { setOptions([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await studentsAPI.list({ search: inputValue, page_size: 20 });
        const students = res.data.data?.items || res.data.data || [];
        setOptions(students);
      } catch (e) { setOptions([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <Autocomplete
      multiple={multiple}
      value={value}
      onChange={(e, newVal) => onChange(newVal)}
      inputValue={inputValue}
      onInputChange={(e, val) => setInputValue(val)}
      options={options}
      getOptionLabel={(opt) => opt ? `${opt.first_name || ''} ${opt.last_name || ''} (${opt.admission_number || opt.id})` : ''}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          label={multiple ? "Search Students" : "Search Student"}
          placeholder="Type name or admission number..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={inputValue.length < 2 ? "Type at least 2 characters" : "No students found"}
    />
  );
}

// ==================== TC TAB ====================
function TCTab({ onPreview }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await admissionsAPI.listTC();
      setCertificates(res.data.data?.items || res.data.data || []);
    } catch (e) { toast.error('Failed to load transfer certificates'); }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      await admissionsAPI.approveTC(id);
      toast.success('Transfer Certificate approved');
      load();
    } catch (e) { toast.error('Failed to approve'); }
  };

  const statusColors = { pending: 'warning', approved: 'success', issued: 'info', cancelled: 'error' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Transfer Certificates</Typography>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sr. No</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Date of Leaving</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert, idx) => (
              <TableRow key={cert.id}>
                <TableCell>{cert.serial_number || idx + 1}</TableCell>
                <TableCell>{cert.student_name || `Student #${cert.student_id}`}</TableCell>
                <TableCell>{cert.class_name || cert.class_at_leaving || '-'}</TableCell>
                <TableCell>{cert.reason_for_leaving || '-'}</TableCell>
                <TableCell>{cert.date_of_leaving ? dayjs(cert.date_of_leaving).format('DD/MM/YYYY') : '-'}</TableCell>
                <TableCell>
                  <Chip label={cert.status || 'pending'} color={statusColors[cert.status] || 'default'} size="small" />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onPreview(cert)} title="Preview">
                    <Visibility />
                  </IconButton>
                  {cert.status === 'pending' && (
                    <IconButton size="small" color="success" onClick={() => handleApprove(cert.id)} title="Approve">
                      <CheckCircle />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={() => onPreview(cert)} title="Print">
                    <Print />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && certificates.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No transfer certificates found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ==================== CHARACTER CERTIFICATE TAB ====================
function CharacterTab({ onPreview }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await sportsAPI.listCertificates({ certificate_type: 'character' });
      setCertificates(res.data.data?.items || res.data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Character Certificates</Typography>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Issued Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert, idx) => (
              <TableRow key={cert.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{cert.student_name || `Student #${cert.student_id}`}</TableCell>
                <TableCell>{cert.class_name || '-'}</TableCell>
                <TableCell>{cert.academic_year || '-'}</TableCell>
                <TableCell>{cert.issued_date ? dayjs(cert.issued_date).format('DD/MM/YYYY') : '-'}</TableCell>
                <TableCell><Chip label="Issued" color="success" size="small" /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onPreview({ ...cert, type: 'character' })}><Visibility /></IconButton>
                  <IconButton size="small" onClick={() => onPreview({ ...cert, type: 'character' })}><Print /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && certificates.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No character certificates found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ==================== BONAFIDE CERTIFICATE TAB ====================
function BonafideTab({ onPreview }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await sportsAPI.listCertificates({ certificate_type: 'bonafide' });
      setCertificates(res.data.data?.items || res.data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Bonafide Certificates</Typography>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Student Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Issued Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert, idx) => (
              <TableRow key={cert.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{cert.student_name || `Student #${cert.student_id}`}</TableCell>
                <TableCell>{cert.class_name || '-'}</TableCell>
                <TableCell>{cert.purpose || cert.description || '-'}</TableCell>
                <TableCell>{cert.issued_date ? dayjs(cert.issued_date).format('DD/MM/YYYY') : '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onPreview({ ...cert, type: 'bonafide' })}><Visibility /></IconButton>
                  <IconButton size="small" onClick={() => onPreview({ ...cert, type: 'bonafide' })}><Print /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && certificates.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No bonafide certificates found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ==================== SPORTS/ACHIEVEMENT TAB ====================
function SportsTab({ onPreview }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const res = await sportsAPI.listCertificates({});
      setCertificates(res.data.data?.items || res.data.data || []);
    } catch (e) {}
    setLoading(false);
  };

  const typeColors = { participation: 'info', winner: 'success', merit: 'warning', appreciation: 'secondary' };

  return (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Sports & Achievement Certificates</Typography>
        <Button startIcon={<Refresh />} onClick={load}>Refresh</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Issued Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert, idx) => (
              <TableRow key={cert.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{cert.student_name || `Student #${cert.student_id}`}</TableCell>
                <TableCell>{cert.event_name || '-'}</TableCell>
                <TableCell>
                  <Chip label={cert.certificate_type || 'N/A'} color={typeColors[cert.certificate_type] || 'default'} size="small" />
                </TableCell>
                <TableCell>{cert.position || '-'}</TableCell>
                <TableCell>{cert.issued_date ? dayjs(cert.issued_date).format('DD/MM/YYYY') : '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onPreview({ ...cert, type: 'sports' })}><Visibility /></IconButton>
                  <IconButton size="small" onClick={() => onPreview({ ...cert, type: 'sports' })}><Print /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && certificates.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No sports certificates found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ==================== GENERATE DIALOG ====================
function GenerateDialog({ open, onClose, onPreview }) {
  const [certType, setCertType] = useState('tc');
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setStudent(null); setForm({}); };

  const handleGenerate = async () => {
    if (!student) { toast.error('Please select a student'); return; }
    setSaving(true);
    try {
      if (certType === 'tc') {
        await admissionsAPI.generateTC({
          student_id: student.id,
          reason_for_leaving: form.reason_for_leaving || '',
          date_of_leaving: form.date_of_leaving || dayjs().format('YYYY-MM-DD'),
          conduct: form.conduct || 'Good',
          character: form.character || 'Good',
          remarks: form.remarks || '',
        });
        toast.success('Transfer Certificate generated');
      } else if (certType === 'sports') {
        await sportsAPI.createCertificate({
          student_id: student.id,
          certificate_type: form.certificate_type || 'participation',
          event_name: form.event_name || '',
          issued_date: form.issued_date || dayjs().format('YYYY-MM-DD'),
          description: form.description || '',
          position: form.position || '',
          issued_by: form.issued_by || '',
          template: form.template || 'default',
        });
        toast.success('Sports certificate created');
      } else {
        // Character / Bonafide - use sports certificates API with type
        await sportsAPI.createCertificate({
          student_id: student.id,
          certificate_type: certType,
          event_name: certType === 'character' ? 'Character Certificate' : 'Bonafide Certificate',
          issued_date: form.issued_date || dayjs().format('YYYY-MM-DD'),
          description: form.description || form.purpose || '',
          issued_by: form.issued_by || 'Principal',
          template: certType,
        });
        toast.success(`${certType === 'character' ? 'Character' : 'Bonafide'} certificate generated`);
      }
      onClose();
      resetForm();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to generate certificate');
    }
    setSaving(false);
  };

  const handlePreview = () => {
    if (!student) { toast.error('Please select a student'); return; }
    onPreview({
      ...form,
      type: certType,
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      student,
      father_name: student.father_name || student.guardian_name || '',
      admission_number: student.admission_number || '',
      class_name: student.current_class || student.class_name || '',
      section: student.section || '',
      dob: student.date_of_birth || '',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Generate Certificate
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              select fullWidth label="Certificate Type" value={certType}
              onChange={(e) => { setCertType(e.target.value); setForm({}); }}
            >
              <MenuItem value="tc">Transfer Certificate</MenuItem>
              <MenuItem value="character">Character Certificate</MenuItem>
              <MenuItem value="bonafide">Bonafide Certificate</MenuItem>
              <MenuItem value="sports">Sports/Achievement Certificate</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <StudentSearch value={student} onChange={setStudent} />
          </Grid>

          {/* TC Fields */}
          {certType === 'tc' && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Date of Leaving" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date_of_leaving || ''}
                  onChange={e => setForm({ ...form, date_of_leaving: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Reason for Leaving"
                  value={form.reason_for_leaving || ''}
                  onChange={e => setForm({ ...form, reason_for_leaving: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Conduct"
                  value={form.conduct || 'Good'}
                  onChange={e => setForm({ ...form, conduct: e.target.value })}
                >
                  {['Excellent', 'Very Good', 'Good', 'Satisfactory'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Character"
                  value={form.character || 'Good'}
                  onChange={e => setForm({ ...form, character: e.target.value })}
                >
                  {['Excellent', 'Very Good', 'Good', 'Satisfactory'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Remarks" multiline rows={2}
                  value={form.remarks || ''}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                />
              </Grid>
            </>
          )}

          {/* Character Certificate Fields */}
          {certType === 'character' && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Academic Year"
                  value={form.academic_year || ''}
                  onChange={e => setForm({ ...form, academic_year: e.target.value })}
                  placeholder="2024-25"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Date of Issue" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.issued_date || dayjs().format('YYYY-MM-DD')}
                  onChange={e => setForm({ ...form, issued_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Character & Conduct Statement" multiline rows={3}
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="His/Her character and conduct have been found to be good during the stay in this school."
                />
              </Grid>
            </>
          )}

          {/* Bonafide Certificate Fields */}
          {certType === 'bonafide' && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Academic Year"
                  value={form.academic_year || ''}
                  onChange={e => setForm({ ...form, academic_year: e.target.value })}
                  placeholder="2024-25"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Date of Issue" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.issued_date || dayjs().format('YYYY-MM-DD')}
                  onChange={e => setForm({ ...form, issued_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Purpose"
                  value={form.purpose || ''}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  placeholder="e.g., For bank account opening, passport application..."
                />
              </Grid>
            </>
          )}

          {/* Sports/Achievement Fields */}
          {certType === 'sports' && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Event Name"
                  value={form.event_name || ''}
                  onChange={e => setForm({ ...form, event_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Certificate Type"
                  value={form.certificate_type || 'participation'}
                  onChange={e => setForm({ ...form, certificate_type: e.target.value })}
                >
                  <MenuItem value="participation">Participation</MenuItem>
                  <MenuItem value="winner">Winner</MenuItem>
                  <MenuItem value="merit">Merit</MenuItem>
                  <MenuItem value="appreciation">Appreciation</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Position"
                  value={form.position || ''}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                  placeholder="e.g., 1st, 2nd, 3rd"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Issued Date" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.issued_date || dayjs().format('YYYY-MM-DD')}
                  onChange={e => setForm({ ...form, issued_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Issued By"
                  value={form.issued_by || ''}
                  onChange={e => setForm({ ...form, issued_by: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Template"
                  value={form.template || 'default'}
                  onChange={e => setForm({ ...form, template: e.target.value })}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="colorful">Colorful</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" multiline rows={2}
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="outlined" startIcon={<Visibility />} onClick={handlePreview}>
          Preview
        </Button>
        <Button variant="contained" onClick={handleGenerate} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Generate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== BULK GENERATE DIALOG ====================
function BulkGenerateDialog({ open, onClose }) {
  const [certType, setCertType] = useState('character');
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBulkGenerate = async () => {
    if (students.length === 0) { toast.error('Please select at least one student'); return; }
    setSaving(true);
    setProgress(0);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < students.length; i++) {
      try {
        const s = students[i];
        if (certType === 'tc') {
          await admissionsAPI.generateTC({
            student_id: s.id,
            reason_for_leaving: form.reason_for_leaving || '',
            date_of_leaving: form.date_of_leaving || dayjs().format('YYYY-MM-DD'),
            conduct: form.conduct || 'Good',
            character: form.character || 'Good',
          });
        } else {
          await sportsAPI.createCertificate({
            student_id: s.id,
            certificate_type: certType === 'sports' ? (form.certificate_type || 'participation') : certType,
            event_name: form.event_name || `${certType} Certificate`,
            issued_date: form.issued_date || dayjs().format('YYYY-MM-DD'),
            description: form.description || form.purpose || '',
            issued_by: form.issued_by || 'Principal',
            template: certType,
          });
        }
        success++;
      } catch (e) { failed++; }
      setProgress(Math.round(((i + 1) / students.length) * 100));
    }

    toast.success(`Generated ${success} certificates${failed > 0 ? `, ${failed} failed` : ''}`);
    setSaving(false);
    setStudents([]);
    setForm({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Bulk Certificate Generation
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField select fullWidth label="Certificate Type" value={certType}
              onChange={(e) => setCertType(e.target.value)}
            >
              <MenuItem value="tc">Transfer Certificate</MenuItem>
              <MenuItem value="character">Character Certificate</MenuItem>
              <MenuItem value="bonafide">Bonafide Certificate</MenuItem>
              <MenuItem value="sports">Sports/Achievement Certificate</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <StudentSearch value={students} onChange={setStudents} multiple />
          </Grid>
          {students.length > 0 && (
            <Grid item xs={12}>
              <Chip label={`${students.length} student(s) selected`} color="primary" />
            </Grid>
          )}

          {certType === 'tc' && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Date of Leaving" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date_of_leaving || ''}
                  onChange={e => setForm({ ...form, date_of_leaving: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Reason for Leaving"
                  value={form.reason_for_leaving || ''}
                  onChange={e => setForm({ ...form, reason_for_leaving: e.target.value })}
                />
              </Grid>
            </>
          )}

          {(certType === 'character' || certType === 'bonafide') && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Date of Issue" type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.issued_date || dayjs().format('YYYY-MM-DD')}
                  onChange={e => setForm({ ...form, issued_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label={certType === 'bonafide' ? 'Purpose' : 'Issued By'}
                  value={certType === 'bonafide' ? (form.purpose || '') : (form.issued_by || '')}
                  onChange={e => setForm({ ...form, [certType === 'bonafide' ? 'purpose' : 'issued_by']: e.target.value })}
                />
              </Grid>
            </>
          )}

          {certType === 'sports' && (
            <>
              <Grid item xs={6}>
                <TextField fullWidth label="Event Name"
                  value={form.event_name || ''}
                  onChange={e => setForm({ ...form, event_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Certificate Type"
                  value={form.certificate_type || 'participation'}
                  onChange={e => setForm({ ...form, certificate_type: e.target.value })}
                >
                  <MenuItem value="participation">Participation</MenuItem>
                  <MenuItem value="winner">Winner</MenuItem>
                  <MenuItem value="merit">Merit</MenuItem>
                  <MenuItem value="appreciation">Appreciation</MenuItem>
                </TextField>
              </Grid>
            </>
          )}

          {saving && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2">Generating... {progress}%</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleBulkGenerate} disabled={saving || students.length === 0}>
          {saving ? `Generating (${progress}%)` : `Generate for ${students.length} Student(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== PREVIEW DIALOG ====================
function PreviewDialog({ open, onClose, data }) {
  const printRef = useRef(null);
  const theme = useTheme();

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${data?.student_name || 'Print'}</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; }
            .certificate { border: 3px double #333; padding: 40px; min-height: 700px; position: relative; }
            .header { text-align: center; margin-bottom: 30px; }
            .school-name { font-size: 28px; font-weight: bold; color: #1a237e; margin: 0; }
            .school-address { font-size: 12px; color: #555; margin: 5px 0; }
            .affiliation { font-size: 11px; color: #777; }
            .title { text-align: center; font-size: 22px; font-weight: bold; text-decoration: underline;
                     margin: 20px 0; color: #333; text-transform: uppercase; }
            .serial { text-align: right; font-size: 12px; margin-bottom: 10px; }
            .content { font-size: 14px; line-height: 2; margin: 20px 0; }
            .content p { margin: 8px 0; }
            .field { display: inline-block; border-bottom: 1px dotted #333; min-width: 150px;
                     padding: 0 5px; font-weight: bold; }
            .footer { position: absolute; bottom: 40px; left: 40px; right: 40px;
                      display: flex; justify-content: space-between; align-items: flex-end; }
            .signature { text-align: center; }
            .signature-line { border-top: 1px solid #333; width: 150px; margin-top: 40px; padding-top: 5px; }
            .date-section { font-size: 12px; }
            table.details { width: 100%; border-collapse: collapse; margin: 15px 0; }
            table.details td { padding: 6px 10px; font-size: 13px; }
            table.details td:first-child { font-weight: bold; width: 200px; }
            .sports-cert { text-align: center; }
            .sports-cert .event { font-size: 20px; color: #1565c0; font-weight: bold; margin: 15px 0; }
            .sports-cert .achievement { font-size: 16px; margin: 10px 0; }
            @media print { body { padding: 20px; } .certificate { border: 2px double #333; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </html>
    `);
    printWindow.document.close();
  };

  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Certificate Preview
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box ref={printRef} sx={{ p: 2 }}>
          {data.type === 'tc' && <TCTemplate data={data} />}
          {data.type === 'character' && <CharacterTemplate data={data} />}
          {data.type === 'bonafide' && <BonafideTemplate data={data} />}
          {data.type === 'sports' && <SportsTemplate data={data} />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
          Print Certificate
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ==================== TC TEMPLATE ====================
function TCTemplate({ data }) {
  return (
    <div className="certificate" style={{ border: '3px double #333', padding: '40px', fontFamily: "'Times New Roman', serif" }}>
      <div className="header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a237e' }}>{SCHOOL_INFO.name}</div>
        <div style={{ fontSize: '12px', color: '#555', margin: '5px 0' }}>{SCHOOL_INFO.address}</div>
        <div style={{ fontSize: '11px', color: '#777' }}>{SCHOOL_INFO.affiliation}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', textDecoration: 'underline', margin: '20px 0', textTransform: 'uppercase' }}>
        Transfer Certificate
      </div>
      <div style={{ textAlign: 'right', fontSize: '12px', marginBottom: '10px' }}>
        Sr. No: {data.serial_number || '____'}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '15px 0' }}>
        <tbody>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold', width: '200px' }}>Name of Student</td><td style={{ padding: '6px 10px' }}>{data.student_name || '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Father's Name</td><td style={{ padding: '6px 10px' }}>{data.father_name || data.father_name_field || '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Date of Birth</td><td style={{ padding: '6px 10px' }}>{data.dob ? dayjs(data.dob).format('DD MMMM YYYY') : '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Admission No.</td><td style={{ padding: '6px 10px' }}>{data.admission_number || '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Class & Section</td><td style={{ padding: '6px 10px' }}>{data.class_name || '____'} - {data.section || '____'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Date of Admission</td><td style={{ padding: '6px 10px' }}>{data.date_of_admission ? dayjs(data.date_of_admission).format('DD/MM/YYYY') : '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Date of Leaving</td><td style={{ padding: '6px 10px' }}>{data.date_of_leaving ? dayjs(data.date_of_leaving).format('DD/MM/YYYY') : '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Class at Leaving</td><td style={{ padding: '6px 10px' }}>{data.class_at_leaving || data.class_name || '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Reason for Leaving</td><td style={{ padding: '6px 10px' }}>{data.reason_for_leaving || '________________'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Conduct</td><td style={{ padding: '6px 10px' }}>{data.conduct || 'Good'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Character</td><td style={{ padding: '6px 10px' }}>{data.character || 'Good'}</td></tr>
          <tr><td style={{ padding: '6px 10px', fontWeight: 'bold' }}>Remarks</td><td style={{ padding: '6px 10px' }}>{data.remarks || 'N/A'}</td></tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
        <div style={{ fontSize: '12px' }}>
          <div>Date: {data.issued_date ? dayjs(data.issued_date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}</div>
          <div>Place: New Delhi</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', width: '150px', marginTop: '40px', paddingTop: '5px' }}>
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== CHARACTER CERTIFICATE TEMPLATE ====================
function CharacterTemplate({ data }) {
  return (
    <div className="certificate" style={{ border: '3px double #333', padding: '40px', fontFamily: "'Times New Roman', serif" }}>
      <div className="header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a237e' }}>{SCHOOL_INFO.name}</div>
        <div style={{ fontSize: '12px', color: '#555', margin: '5px 0' }}>{SCHOOL_INFO.address}</div>
        <div style={{ fontSize: '11px', color: '#777' }}>{SCHOOL_INFO.affiliation}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', textDecoration: 'underline', margin: '20px 0', textTransform: 'uppercase' }}>
        Character Certificate
      </div>
      <div style={{ fontSize: '14px', lineHeight: '2.2', margin: '30px 0' }}>
        <p style={{ margin: '8px 0' }}>
          This is to certify that <strong>{data.student_name || '________________'}</strong>,
          {data.student?.gender === 'female' ? ' daughter' : ' son'} of <strong>{data.father_name || '________________'}</strong>,
          was a student of Class <strong>{data.class_name || '____'}</strong>,
          Section <strong>{data.section || '____'}</strong> during the academic year
          <strong> {data.academic_year || '________'}</strong> in this school.
        </p>
        <p style={{ margin: '8px 0' }}>
          {data.description || `${data.student?.gender === 'female' ? 'Her' : 'His'} character and conduct have been found to be good during ${data.student?.gender === 'female' ? 'her' : 'his'} stay in this school.`}
        </p>
        <p style={{ margin: '8px 0' }}>
          I wish {data.student?.gender === 'female' ? 'her' : 'him'} all the best for {data.student?.gender === 'female' ? 'her' : 'his'} future endeavours.
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
        <div style={{ fontSize: '12px' }}>
          <div>Date: {data.issued_date ? dayjs(data.issued_date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}</div>
          <div>Place: New Delhi</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', width: '150px', marginTop: '40px', paddingTop: '5px' }}>
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== BONAFIDE CERTIFICATE TEMPLATE ====================
function BonafideTemplate({ data }) {
  return (
    <div className="certificate" style={{ border: '3px double #333', padding: '40px', fontFamily: "'Times New Roman', serif" }}>
      <div className="header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a237e' }}>{SCHOOL_INFO.name}</div>
        <div style={{ fontSize: '12px', color: '#555', margin: '5px 0' }}>{SCHOOL_INFO.address}</div>
        <div style={{ fontSize: '11px', color: '#777' }}>{SCHOOL_INFO.affiliation}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 'bold', textDecoration: 'underline', margin: '20px 0', textTransform: 'uppercase' }}>
        Bonafide Certificate
      </div>
      <div style={{ fontSize: '14px', lineHeight: '2.2', margin: '30px 0' }}>
        <p style={{ margin: '8px 0' }}>
          This is to certify that <strong>{data.student_name || '________________'}</strong>,
          {data.student?.gender === 'female' ? ' daughter' : ' son'} of <strong>{data.father_name || '________________'}</strong>,
          is/was a bonafide student of this school.
        </p>
        <p style={{ margin: '8px 0' }}>
          {data.student?.gender === 'female' ? 'She' : 'He'} is/was studying in Class <strong>{data.class_name || '____'}</strong>,
          Section <strong>{data.section || '____'}</strong> during the academic year
          <strong> {data.academic_year || '________'}</strong>.
        </p>
        <p style={{ margin: '8px 0' }}>
          {data.student?.gender === 'female' ? 'Her' : 'His'} date of birth as per school records is
          <strong> {data.dob ? dayjs(data.dob).format('DD MMMM YYYY') : '________________'}</strong>.
        </p>
        {data.purpose && (
          <p style={{ margin: '8px 0' }}>
            This certificate is issued for the purpose of <strong>{data.purpose}</strong>.
          </p>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
        <div style={{ fontSize: '12px' }}>
          <div>Date: {data.issued_date ? dayjs(data.issued_date).format('DD/MM/YYYY') : dayjs().format('DD/MM/YYYY')}</div>
          <div>Place: New Delhi</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', width: '150px', marginTop: '40px', paddingTop: '5px' }}>
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SPORTS CERTIFICATE TEMPLATE ====================
function SportsTemplate({ data }) {
  const typeLabel = {
    participation: 'Certificate of Participation',
    winner: 'Certificate of Achievement',
    merit: 'Certificate of Merit',
    appreciation: 'Certificate of Appreciation',
  };

  return (
    <div className="certificate" style={{ border: '3px double #1565c0', padding: '40px', fontFamily: "'Times New Roman', serif", textAlign: 'center' }}>
      <div className="header" style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a237e' }}>{SCHOOL_INFO.name}</div>
        <div style={{ fontSize: '12px', color: '#555', margin: '5px 0' }}>{SCHOOL_INFO.address}</div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 'bold', textDecoration: 'underline', margin: '20px 0', textTransform: 'uppercase', color: '#1565c0' }}>
        {typeLabel[data.certificate_type] || 'Certificate'}
      </div>
      <div style={{ fontSize: '14px', lineHeight: '2', margin: '30px 20px' }}>
        <p style={{ margin: '15px 0', fontSize: '16px' }}>This is to certify that</p>
        <p style={{ margin: '15px 0', fontSize: '24px', fontWeight: 'bold', color: '#1a237e' }}>
          {data.student_name || '________________'}
        </p>
        <p style={{ margin: '10px 0' }}>
          Class: <strong>{data.class_name || '____'}</strong>
        </p>
        {data.event_name && (
          <p style={{ margin: '15px 0', fontSize: '20px', color: '#1565c0', fontWeight: 'bold' }}>
            {data.event_name}
          </p>
        )}
        {data.position && (
          <p style={{ margin: '10px 0', fontSize: '18px' }}>
            Position: <strong>{data.position}</strong>
          </p>
        )}
        {data.description && (
          <p style={{ margin: '15px 0', fontStyle: 'italic' }}>
            {data.description}
          </p>
        )}
        <p style={{ margin: '10px 0' }}>
          Date: <strong>{data.issued_date ? dayjs(data.issued_date).format('DD MMMM YYYY') : dayjs().format('DD MMMM YYYY')}</strong>
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '50px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', width: '150px', marginTop: '40px', paddingTop: '5px' }}>
            {data.issued_by || 'Sports Coordinator'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #333', width: '150px', marginTop: '40px', paddingTop: '5px' }}>
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}
