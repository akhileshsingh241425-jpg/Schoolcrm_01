import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Chip, Button, Tabs, Tab, Table,
  TableBody, TableCell, TableRow, TableHead, TableContainer, Divider, Avatar,
  Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, LinearProgress, Alert,
  Timeline as MuiTimeline, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import {
  Edit, ArrowBack, EmojiEvents, Psychology, MedicalServices, Gavel,
  Description, People, School, Add, Star, Warning, CheckCircle,
  Timeline as TimelineIcon, Delete, Verified, FamilyRestroom
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { studentsAPI } from '../../services/api';

const statusColors = { active: 'success', inactive: 'default', graduated: 'info', transferred: 'warning', dropout: 'error' };
const behaviorColors = { positive: 'success', negative: 'error' };

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogType, setDialogType] = useState(null);

  const fetchStudent = useCallback(() => {
    setLoading(true);
    studentsAPI.get360(id)
      .then(res => { setStudent(res.data.data); setLoading(false); })
      .catch(() => { navigate('/students'); });
  }, [id]);

  useEffect(() => { fetchStudent(); }, [fetchStudent]);

  if (loading) return <LinearProgress />;
  if (!student) return <Typography>Student not found</Typography>;

  const TABS = [
    { label: 'Profile', icon: <People /> },
    { label: 'Parents', icon: <FamilyRestroom /> },
    { label: 'Achievements', icon: <EmojiEvents /> },
    { label: 'Behavior', icon: <Gavel /> },
    { label: 'Counseling', icon: <Psychology /> },
    { label: 'Medical', icon: <MedicalServices /> },
    { label: 'Timeline', icon: <TimelineIcon /> },
    { label: 'Documents', icon: <Description /> },
    { label: 'Promotions', icon: <School /> },
  ];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')}>Back</Button>
        <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/students/${id}/edit`)}>Edit Student</Button>
      </Box>

      {/* Student Header Card */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 90, height: 90, fontSize: 36, bgcolor: student.gender === 'female' ? 'secondary.main' : 'primary.main' }}>
              {student.first_name?.[0]}{student.last_name?.[0]}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" fontWeight={700}>{student.full_name}</Typography>
            <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
              <Chip label={student.status || 'active'} color={statusColors[student.status] || 'default'} size="small" />
              {student.current_class && <Chip label={`Class: ${student.current_class.name}`} variant="outlined" size="small" />}
              {student.current_section && <Chip label={`Section: ${student.current_section.name}`} variant="outlined" size="small" />}
              {student.house && <Chip label={`House: ${student.house.name}`} size="small" sx={{ bgcolor: student.house.color, color: 'white' }} />}
              {student.roll_no && <Chip label={`Roll: ${student.roll_no}`} variant="outlined" size="small" />}
            </Box>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>Adm No: {student.admission_no || 'N/A'} | ID: {student.id_card_no || 'N/A'}</Typography>
          </Grid>
          <Grid item>
            <Grid container spacing={1}>
              {[
                { label: 'Achievements', value: student.stats?.total_achievements || 0, color: '#ff9800' },
                { label: 'Behavior Pts', value: student.behavior_points || 0, color: '#4caf50' },
                { label: 'Documents', value: student.stats?.documents_count || 0, color: '#2196f3' },
                { label: 'Counseling', value: student.stats?.counseling_sessions || 0, color: '#9c27b0' },
              ].map(s => (
                <Grid item xs={6} key={s.label}>
                  <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 6px 20px ${s.color}22` } }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map(t => <Tab key={t.label} icon={t.icon} label={t.label} iconPosition="start" />)}
      </Tabs>

      {/* Tab 0: Profile */}
      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Personal Information</Typography>
          <Grid container spacing={2}>
            {[
              ['Class', student.current_class?.name], ['Section', student.current_section?.name],
              ['Roll No', student.roll_no], ['Gender', student.gender],
              ['Date of Birth', student.date_of_birth], ['Blood Group', student.blood_group],
              ['Religion', student.religion], ['Category', student.category],
              ['Nationality', student.nationality], ['Mother Tongue', student.mother_tongue],
              ['Aadhar No', student.aadhar_no], ['Admission Date', student.admission_date],
              ['Transport Mode', student.transport_mode], ['Previous School', student.previous_school],
            ].map(([label, value]) => (
              <Grid item xs={12} sm={6} md={4} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography>{value || 'N/A'}</Typography>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Address</Typography>
          <Grid container spacing={2}>
            {[['Address', student.address], ['City', student.city], ['State', student.state], ['Pincode', student.pincode]].map(([l, v]) => (
              <Grid item xs={12} sm={6} md={3} key={l}>
                <Typography variant="caption" color="text.secondary">{l}</Typography>
                <Typography>{v || 'N/A'}</Typography>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Emergency & Medical</Typography>
          <Grid container spacing={2}>
            {[
              ['Emergency Person', student.emergency_person], ['Emergency Contact', student.emergency_contact],
              ['Medical Conditions', student.medical_conditions], ['Allergies', student.allergies],
            ].map(([l, v]) => (
              <Grid item xs={12} sm={6} key={l}>
                <Typography variant="caption" color="text.secondary">{l}</Typography>
                <Typography>{v || 'N/A'}</Typography>
              </Grid>
            ))}
          </Grid>

          {/* Siblings */}
          {student.siblings?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Siblings</Typography>
              <Grid container spacing={2}>
                {student.siblings.map(s => (
                  <Grid item xs={12} sm={6} md={4} key={s.id}>
                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>{s.full_name?.[0]}</Avatar>
                        <Box>
                          <Typography fontWeight={600}>{s.full_name}</Typography>
                          <Typography variant="body2" color="text.secondary">{s.class || 'N/A'} | {s.admission_no}</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Paper>
      )}

      {/* Tab 1: Parents */}
      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          {student.parents?.length > 0 ? student.parents.map(p => (
            <Card key={p.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  <Avatar sx={{ bgcolor: p.relation === 'father' ? 'primary.main' : 'secondary.main' }}>
                    {p.name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{p.name}</Typography>
                    <Chip label={p.relation} size="small" />
                  </Box>
                </Box>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {[['Phone', p.phone], ['Email', p.email], ['Occupation', p.occupation],
                    ['Income', p.income], ['Qualification', p.qualification], ['Aadhar', p.aadhar_no]
                  ].map(([l, v]) => (
                    <Grid item xs={12} sm={6} md={4} key={l}>
                      <Typography variant="caption" color="text.secondary">{l}</Typography>
                      <Typography>{v || 'N/A'}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )) : <Alert severity="info">No parent details added</Alert>}
        </Paper>
      )}

      {/* Tab 2: Achievements */}
      {tab === 2 && <AchievementsTab studentId={id} achievements={student.achievements} onRefresh={fetchStudent} />}
      
      {/* Tab 3: Behavior */}
      {tab === 3 && <BehaviorTab studentId={id} behaviors={student.behavior_logs} onRefresh={fetchStudent} />}
      
      {/* Tab 4: Counseling */}
      {tab === 4 && <CounselingTab studentId={id} sessions={student.counseling} onRefresh={fetchStudent} />}
      
      {/* Tab 5: Medical */}
      {tab === 5 && <MedicalTab studentId={id} records={student.medical} onRefresh={fetchStudent} />}
      
      {/* Tab 6: Timeline */}
      {tab === 6 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Student Timeline</Typography>
          {(student.timeline || []).length === 0 ? <Alert severity="info">No timeline events</Alert> : (
            <List>
              {student.timeline.map(t => (
                <ListItem key={t.id} sx={{ borderLeft: '3px solid', borderColor: 'primary.main', mb: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                      {t.event_type === 'achievement' ? <Star /> : t.event_type === 'behavior' ? <Gavel /> :
                       t.event_type === 'medical' ? <MedicalServices /> : t.event_type === 'counseling' ? <Psychology /> :
                       t.event_type === 'promotion' ? <School /> : <TimelineIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Box display="flex" gap={1} alignItems="center">
                      <Typography fontWeight={600}>{t.title}</Typography>
                      <Chip label={t.event_type} size="small" variant="outlined" />
                    </Box>}
                    secondary={<><Typography variant="body2">{t.description}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.event_date}</Typography></>}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Tab 7: Documents */}
      {tab === 7 && <DocumentsTab studentId={id} documents={student.documents} onRefresh={fetchStudent} />}

      {/* Tab 8: Promotions */}
      {tab === 8 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Promotion History</Typography>
          {(student.promotions || []).length === 0 ? <Alert severity="info">No promotion records</Alert> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    {['From Class', 'To Class', 'Type', 'Result %', 'Remarks', 'Date'].map(h =>
                      <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {student.promotions.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.from_class || '-'}</TableCell>
                      <TableCell>{p.to_class || '-'}</TableCell>
                      <TableCell><Chip label={p.promotion_type} size="small" color={p.promotion_type === 'promoted' ? 'success' : 'warning'} /></TableCell>
                      <TableCell>{p.result_percentage || '-'}</TableCell>
                      <TableCell>{p.remarks || '-'}</TableCell>
                      <TableCell>{p.promoted_at?.split('T')[0]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}

// ==================== SUB COMPONENTS ====================

function AchievementsTab({ studentId, achievements, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'academic', level: 'school', position: '', description: '', event_date: '', points_earned: 0 });

  const handleAdd = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    try {
      await studentsAPI.addAchievement(studentId, form);
      toast.success('Achievement added');
      setOpen(false);
      setForm({ title: '', category: 'academic', level: 'school', position: '', description: '', event_date: '', points_earned: 0 });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (achId) => {
    if (!window.confirm('Delete this achievement?')) return;
    try { await studentsAPI.deleteAchievement(achId); toast.success('Deleted'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Achievements</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Add Achievement</Button>
      </Box>
      {(achievements || []).length === 0 ? <Alert severity="info">No achievements yet</Alert> : (
        <Grid container spacing={2}>
          {achievements.map(a => (
            <Grid item xs={12} sm={6} md={4} key={a.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box display="flex" gap={1} alignItems="center">
                      <EmojiEvents sx={{ color: 'warning.main' }} />
                      <Typography fontWeight={600}>{a.title}</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}><Delete /></IconButton>
                  </Box>
                  <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                    <Chip label={a.category} size="small" />
                    <Chip label={a.level} size="small" variant="outlined" />
                    {a.position && <Chip label={a.position} size="small" color="warning" />}
                  </Box>
                  {a.description && <Typography variant="body2" sx={{ mt: 1 }}>{a.description}</Typography>}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>{a.event_date} | +{a.points_earned} pts</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Achievement</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['academic', 'sports', 'cultural', 'science', 'leadership', 'community', 'other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                {['school', 'district', 'state', 'national', 'international'].map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Points" type="number" value={form.points_earned} onChange={e => setForm({ ...form, points_earned: +e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Event Date" type="date" InputLabelProps={{ shrink: true }} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function BehaviorTab({ studentId, behaviors, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ behavior_type: 'positive', category: '', title: '', description: '', points: 0, action_taken: '', incident_date: '' });

  const handleAdd = async () => {
    if (!form.title) { toast.error('Title required'); return; }
    try {
      await studentsAPI.addBehavior(studentId, form);
      toast.success('Behavior recorded');
      setOpen(false);
      setForm({ behavior_type: 'positive', category: '', title: '', description: '', points: 0, action_taken: '', incident_date: '' });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Behavior Log</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Record Behavior</Button>
      </Box>
      {(behaviors || []).length === 0 ? <Alert severity="info">No behavior records</Alert> : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                {['Date', 'Type', 'Title', 'Category', 'Points', 'Action Taken'].map(h =>
                  <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {behaviors.map(b => (
                <TableRow key={b.id}>
                  <TableCell>{b.incident_date}</TableCell>
                  <TableCell><Chip label={b.behavior_type} size="small" color={behaviorColors[b.behavior_type]} /></TableCell>
                  <TableCell>{b.title}</TableCell>
                  <TableCell>{b.category || '-'}</TableCell>
                  <TableCell>{b.behavior_type === 'positive' ? '+' : '-'}{b.points}</TableCell>
                  <TableCell>{b.action_taken || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Behavior</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Type" value={form.behavior_type} onChange={e => setForm({ ...form, behavior_type: e.target.value })}>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Discipline, Punctuality" /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Points" type="number" value={form.points} onChange={e => setForm({ ...form, points: +e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.incident_date} onChange={e => setForm({ ...form, incident_date: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Action Taken" multiline rows={2} value={form.action_taken} onChange={e => setForm({ ...form, action_taken: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function CounselingTab({ studentId, sessions, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ session_date: '', session_type: 'academic', reason: '', notes: '', recommendations: '', follow_up_date: '', status: 'scheduled', is_confidential: false });

  const handleAdd = async () => {
    if (!form.session_date) { toast.error('Session date required'); return; }
    try {
      await studentsAPI.addCounseling(studentId, form);
      toast.success('Counseling session added');
      setOpen(false);
      setForm({ session_date: '', session_type: 'academic', reason: '', notes: '', recommendations: '', follow_up_date: '', status: 'scheduled', is_confidential: false });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Counseling Sessions</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Add Session</Button>
      </Box>
      {(sessions || []).length === 0 ? <Alert severity="info">No counseling sessions</Alert> : (
        <Grid container spacing={2}>
          {sessions.map(s => (
            <Grid item xs={12} sm={6} key={s.id}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Box display="flex" gap={1}>
                      <Chip label={s.session_type} size="small" color="primary" />
                      <Chip label={s.status} size="small" variant="outlined"
                        color={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'error' : 'default'} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{s.session_date}</Typography>
                  </Box>
                  <Typography variant="body2"><strong>Reason:</strong> {s.reason || 'N/A'}</Typography>
                  {s.notes && <Typography variant="body2"><strong>Notes:</strong> {s.notes}</Typography>}
                  {s.recommendations && <Typography variant="body2"><strong>Recommendations:</strong> {s.recommendations}</Typography>}
                  {s.follow_up_date && <Typography variant="caption" color="warning.main">Follow-up: {s.follow_up_date}</Typography>}
                  {s.is_confidential && <Chip label="Confidential" size="small" color="error" sx={{ mt: 1 }} />}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Counseling Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Session Date" type="date" InputLabelProps={{ shrink: true }} value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Type" value={form.session_type} onChange={e => setForm({ ...form, session_type: e.target.value })}>
                {['academic', 'behavioral', 'career', 'personal', 'parent_meeting'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Recommendations" multiline rows={2} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Follow-up Date" type="date" InputLabelProps={{ shrink: true }} value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {['scheduled', 'completed', 'cancelled', 'no_show'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function MedicalTab({ studentId, records, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ record_type: 'checkup', title: '', description: '', doctor_name: '', record_date: '', next_followup: '' });

  const handleAdd = async () => {
    if (!form.title || !form.record_date) { toast.error('Title and date required'); return; }
    try {
      await studentsAPI.addMedical(studentId, form);
      toast.success('Medical record added');
      setOpen(false);
      setForm({ record_type: 'checkup', title: '', description: '', doctor_name: '', record_date: '', next_followup: '' });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Medical Records</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Add Record</Button>
      </Box>
      {(records || []).length === 0 ? <Alert severity="info">No medical records</Alert> : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                {['Date', 'Type', 'Title', 'Description', 'Doctor', 'Follow-up'].map(h =>
                  <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.record_date}</TableCell>
                  <TableCell><Chip label={r.record_type} size="small" /></TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.description || '-'}</TableCell>
                  <TableCell>{r.doctor_name || '-'}</TableCell>
                  <TableCell>{r.next_followup || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Medical Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth select label="Record Type" value={form.record_type} onChange={e => setForm({ ...form, record_type: e.target.value })}>
                {['checkup', 'vaccination', 'illness', 'injury', 'allergy', 'other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.record_date} onChange={e => setForm({ ...form, record_date: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Doctor Name" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Next Follow-up" type="date" InputLabelProps={{ shrink: true }} value={form.next_followup} onChange={e => setForm({ ...form, next_followup: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function DocumentsTab({ studentId, documents, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ document_type: '', document_name: '', file_url: '' });

  const handleAdd = async () => {
    if (!form.document_type || !form.file_url) { toast.error('Type and URL required'); return; }
    try {
      await studentsAPI.uploadDocument(studentId, form);
      toast.success('Document uploaded');
      setOpen(false);
      setForm({ document_type: '', document_name: '', file_url: '' });
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleVerify = async (docId) => {
    try { await studentsAPI.verifyDocument(docId); toast.success('Document verified'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try { await studentsAPI.deleteDocument(docId); toast.success('Deleted'); onRefresh(); }
    catch { toast.error('Failed'); }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Documents</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setOpen(true)}>Add Document</Button>
      </Box>
      {(documents || []).length === 0 ? <Alert severity="info">No documents uploaded</Alert> : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                {['Type', 'Name', 'Uploaded', 'Status', 'Actions'].map(h =>
                  <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map(d => (
                <TableRow key={d.id}>
                  <TableCell>{d.document_type}</TableCell>
                  <TableCell>{d.document_name}</TableCell>
                  <TableCell>{d.uploaded_at?.split('T')[0]}</TableCell>
                  <TableCell>
                    {d.verified ?
                      <Chip label="Verified" size="small" color="success" icon={<Verified />} /> :
                      <Chip label="Pending" size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    {!d.verified && <Tooltip title="Verify"><IconButton size="small" color="success" onClick={() => handleVerify(d.id)}><CheckCircle /></IconButton></Tooltip>}
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(d.id)}><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Document</DialogTitle>
        <DialogContent>
          <TextField fullWidth select label="Document Type" value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })} sx={{ mt: 2, mb: 2 }}>
            {['Birth Certificate', 'Aadhar Card', 'Transfer Certificate', 'Character Certificate', 'Report Card', 'Medical Certificate', 'Photo', 'Other'].map(t =>
              <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Document Name" value={form.document_name} onChange={e => setForm({ ...form, document_name: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="File URL" value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} helperText="Enter file URL" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
