import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Chip, Snackbar, Alert, Card, CardContent, IconButton, MenuItem
} from '@mui/material';
import {
  Add, LocalHospital, ReportProblem, Visibility, Security, Medication,
  Phone, Psychology, CleaningServices, Thermostat, Edit, Delete, Check,
  Refresh, ExitToApp, HealthAndSafety
} from '@mui/icons-material';
import { healthAPI } from '../../services/api';

const init = (keys) => keys.reduce((o, k) => ({ ...o, [k]: '' }), {});

export default function Health() {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const msg = (m, s = 'success') => setSnack({ open: true, message: m, severity: s });

  // State
  const [dash, setDash] = useState({});
  const [records, setRecords] = useState([]);
  const [openRec, setOpenRec] = useState(false);
  const [recForm, setRecForm] = useState(init(['person_type','person_id','blood_group','height_cm','weight_kg','bmi','allergies','chronic_conditions','vaccinations','disabilities','vision_left','vision_right','dental_status','doctor_name','doctor_phone','insurance_provider','insurance_policy_no','insurance_expiry','notes']));
  const [editRecId, setEditRecId] = useState(null);

  const [infirmary, setInfirmary] = useState([]);
  const [openInf, setOpenInf] = useState(false);
  const [infForm, setInfForm] = useState(init(['person_type','person_id','visit_date','complaint','diagnosis','treatment','medicines_given','temperature','blood_pressure','referred_to_hospital','parent_notified','attended_by','status','notes']));
  const [editInfId, setEditInfId] = useState(null);

  const [incidents, setIncidents] = useState([]);
  const [openInc, setOpenInc] = useState(false);
  const [incForm, setIncForm] = useState(init(['incident_type','severity','title','description','incident_date','location','persons_involved','first_aid_given','first_aid_details','parent_notified','action_taken','status']));
  const [editIncId, setEditIncId] = useState(null);

  const [checkups, setCheckups] = useState([]);
  const [openChk, setOpenChk] = useState(false);
  const [chkForm, setChkForm] = useState(init(['checkup_name','checkup_type','checkup_date','person_type','person_id','height_cm','weight_kg','bmi','vision_left','vision_right','dental_status','hearing_status','blood_pressure','hemoglobin','doctor_name','findings','recommendations','follow_up_required']));

  const [visitors, setVisitors] = useState([]);
  const [openVis, setOpenVis] = useState(false);
  const [visForm, setVisForm] = useState(init(['visitor_name','visitor_phone','visitor_email','id_type','id_number','purpose','visiting_person','visiting_department','vehicle_number','items_carried','remarks']));

  const [drills, setDrills] = useState([]);
  const [openDrl, setOpenDrl] = useState(false);
  const [drlForm, setDrlForm] = useState(init(['drill_type','drill_name','scheduled_date','scheduled_time','assembly_point','conducted_by','status']));
  const [editDrlId, setEditDrlId] = useState(null);

  const [medications, setMedications] = useState([]);
  const [openMed, setOpenMed] = useState(false);
  const [medForm, setMedForm] = useState(init(['person_type','person_id','medication_name','dosage','frequency','timing','prescribed_by','start_date','end_date','condition','parent_consent','status','notes']));
  const [editMedId, setEditMedId] = useState(null);

  const [emergency, setEmergency] = useState([]);
  const [openEm, setOpenEm] = useState(false);
  const [emForm, setEmForm] = useState(init(['person_type','person_id','contact_name','relationship','phone_primary','phone_secondary','email','address','priority']));

  const [wellbeing, setWellbeing] = useState([]);
  const [openWel, setOpenWel] = useState(false);
  const [welForm, setWelForm] = useState(init(['student_id','record_date','mood','mood_score','sleep_hours','stress_level','notes','counselor_referral','counselor_name','intervention_type','intervention_notes','follow_up_date','status']));
  const [editWelId, setEditWelId] = useState(null);

  const [sanitation, setSanitation] = useState([]);
  const [openSan, setOpenSan] = useState(false);
  const [sanForm, setSanForm] = useState(init(['area_name','area_type','scheduled_time','actual_time','cleaned_by','verified_by','cleaning_date','chemicals_used','rating','status','remarks']));

  const [temps, setTemps] = useState([]);
  const [openTmp, setOpenTmp] = useState(false);
  const [tmpForm, setTmpForm] = useState(init(['person_type','person_id','screen_date','temperature','symptoms','action_taken','screened_by']));

  const ex = (d) => d?.data?.data?.items || d?.data?.data || d?.data?.items || [];

  const fetchDash = useCallback(() => healthAPI.getDashboard().then(r => setDash(r.data.data || {})).catch(() => {}), []);
  const fetchRecords = useCallback(() => healthAPI.listRecords({}).then(r => setRecords(ex(r))).catch(() => {}), []);
  const fetchInfirmary = useCallback(() => healthAPI.listInfirmary({}).then(r => setInfirmary(ex(r))).catch(() => {}), []);
  const fetchIncidents = useCallback(() => healthAPI.listIncidents({}).then(r => setIncidents(ex(r))).catch(() => {}), []);
  const fetchCheckups = useCallback(() => healthAPI.listCheckups({}).then(r => setCheckups(ex(r))).catch(() => {}), []);
  const fetchVisitors = useCallback(() => healthAPI.listVisitors({}).then(r => setVisitors(ex(r))).catch(() => {}), []);
  const fetchDrills = useCallback(() => healthAPI.listDrills({}).then(r => setDrills(ex(r))).catch(() => {}), []);
  const fetchMedications = useCallback(() => healthAPI.listMedications({}).then(r => setMedications(ex(r))).catch(() => {}), []);
  const fetchEmergency = useCallback(() => healthAPI.listEmergency({}).then(r => setEmergency(ex(r))).catch(() => {}), []);
  const fetchWellbeing = useCallback(() => healthAPI.listWellbeing({}).then(r => setWellbeing(ex(r))).catch(() => {}), []);
  const fetchSanitation = useCallback(() => healthAPI.listSanitization({}).then(r => setSanitation(ex(r))).catch(() => {}), []);
  const fetchTemps = useCallback(() => healthAPI.listTemperature({}).then(r => setTemps(ex(r))).catch(() => {}), []);

  useEffect(() => { fetchDash(); }, [fetchDash]);
  useEffect(() => {
    const f = [null, fetchRecords, fetchInfirmary, fetchIncidents, fetchCheckups, fetchVisitors, fetchDrills, fetchMedications, fetchEmergency, fetchWellbeing, fetchSanitation, fetchTemps];
    if (f[tab]) f[tab]();
  }, [tab, fetchRecords, fetchInfirmary, fetchIncidents, fetchCheckups, fetchVisitors, fetchDrills, fetchMedications, fetchEmergency, fetchWellbeing, fetchSanitation, fetchTemps]);

  const F = (form, setForm, label, key, props = {}) => (
    <Grid item xs={props.xs || 12} sm={props.sm || 6} key={key}>
      <TextField fullWidth size="small" label={label} value={form[key] || ''}
        onChange={e => setForm({ ...form, [key]: e.target.value })} {...props} />
    </Grid>
  );
  const Sel = (form, setForm, label, key, opts, props = {}) => (
    <Grid item xs={props.xs || 12} sm={props.sm || 6} key={key}>
      <TextField fullWidth size="small" select label={label} value={form[key] || ''}
        onChange={e => setForm({ ...form, [key]: e.target.value })} {...props}>
        {opts.map(o => <MenuItem key={o.value || o} value={o.value || o}>{o.label || o}</MenuItem>)}
      </TextField>
    </Grid>
  );

  const statColor = (s) => {
    if (['treated','completed','resolved','closed','checked_out','active','recorded'].includes(s)) return 'success';
    if (['critical','severe','denied','discontinued'].includes(s)) return 'error';
    if (['investigating','under_observation','referred','in_progress','scheduled','pending'].includes(s)) return 'warning';
    return 'default';
  };

  const tabLabels = ['Dashboard','Health Records','Infirmary','Incidents','Checkups','Visitors','Safety Drills','Medications','Emergency','Wellbeing','Sanitization','Temperature'];

  return (
    <Box>
      <Typography variant="h5" mb={2}>Health & Safety Management</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabLabels.map((l, i) => <Tab key={i} label={l} icon={[<HealthAndSafety fontSize="small"/>,<LocalHospital fontSize="small"/>,<LocalHospital fontSize="small"/>,<ReportProblem fontSize="small"/>,<HealthAndSafety fontSize="small"/>,<Visibility fontSize="small"/>,<Security fontSize="small"/>,<Medication fontSize="small"/>,<Phone fontSize="small"/>,<Psychology fontSize="small"/>,<CleaningServices fontSize="small"/>,<Thermostat fontSize="small"/>][i]} iconPosition="start" sx={{ minHeight: 48, textTransform: 'none' }} />)}
      </Tabs>

      {/* TAB 0: Dashboard */}
      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}><Button startIcon={<Refresh />} onClick={fetchDash}>Refresh</Button></Box>
          <Grid container spacing={2}>
            {[
              { label: 'Health Records', val: dash.total_health_records, color: '#6366f1' },
              { label: 'Infirmary Today', val: dash.infirmary_today, color: '#2e7d32' },
              { label: 'Open Incidents', val: dash.open_incidents, color: '#d32f2f' },
              { label: 'Active Medications', val: dash.active_medications, color: '#ed6c02' },
              { label: 'Visitors Today', val: dash.visitors_today, color: '#0288d1' },
              { label: 'Visitors Inside', val: dash.visitors_in, color: '#7b1fa2' },
              { label: 'Upcoming Drills', val: dash.upcoming_drills, color: '#388e3c' },
              { label: 'Checkups This Month', val: dash.checkups_this_month, color: '#f57c00' },
              { label: 'Wellbeing Alerts', val: dash.wellbeing_alerts, color: '#c2185b' },
              { label: 'Fever Today', val: dash.fever_today, color: '#e64a19' },
              { label: 'Sanitization Today', val: dash.sanitization_today, color: '#00796b' },
              { label: 'Emergency Contacts', val: dash.emergency_contacts, color: '#5d4037' },
            ].map((c, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ borderLeft: `4px solid ${c.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${c.color}22` } }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color={c.color}>{c.val ?? 0}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* TAB 1: Health Records */}
      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setRecForm(init(['person_type','person_id','blood_group','height_cm','weight_kg','bmi','allergies','chronic_conditions','vaccinations','disabilities','vision_left','vision_right','dental_status','doctor_name','doctor_phone','insurance_provider','insurance_policy_no','insurance_expiry','notes'])); setEditRecId(null); setOpenRec(true); }}>Add Record</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Type</TableCell><TableCell>Person ID</TableCell><TableCell>Blood</TableCell>
                <TableCell>Height</TableCell><TableCell>Weight</TableCell><TableCell>BMI</TableCell>
                <TableCell>Allergies</TableCell><TableCell>Conditions</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Chip size="small" label={r.person_type} /></TableCell>
                    <TableCell>{r.person_id}</TableCell>
                    <TableCell><Chip size="small" label={r.blood_group || '-'} color="error" variant="outlined" /></TableCell>
                    <TableCell>{r.height_cm || '-'} cm</TableCell>
                    <TableCell>{r.weight_kg || '-'} kg</TableCell>
                    <TableCell>{r.bmi || '-'}</TableCell>
                    <TableCell>{r.allergies || '-'}</TableCell>
                    <TableCell>{r.chronic_conditions || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setRecForm(r); setEditRecId(r.id); setOpenRec(true); }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => healthAPI.deleteRecord(r.id).then(() => { msg('Deleted'); fetchRecords(); }).catch(() => msg('Failed','error'))}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && <TableRow><TableCell colSpan={9} align="center">No health records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Infirmary */}
      {tab === 2 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setInfForm(init(['person_type','person_id','visit_date','complaint','diagnosis','treatment','medicines_given','temperature','blood_pressure','referred_to_hospital','parent_notified','attended_by','status','notes'])); setEditInfId(null); setOpenInf(true); }}>New Visit</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Person</TableCell>
                <TableCell>Complaint</TableCell><TableCell>Diagnosis</TableCell><TableCell>Treatment</TableCell>
                <TableCell>Temp</TableCell><TableCell>Parent</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {infirmary.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{v.visit_date}</TableCell>
                    <TableCell>{v.person_type}</TableCell>
                    <TableCell>{v.person_id}</TableCell>
                    <TableCell>{v.complaint}</TableCell>
                    <TableCell>{v.diagnosis || '-'}</TableCell>
                    <TableCell>{v.treatment || '-'}</TableCell>
                    <TableCell>{v.temperature ? `${v.temperature}°F` : '-'}</TableCell>
                    <TableCell>{v.parent_notified ? <Check color="success" fontSize="small" /> : '-'}</TableCell>
                    <TableCell><Chip size="small" label={v.status} color={statColor(v.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setInfForm(v); setEditInfId(v.id); setOpenInf(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {infirmary.length === 0 && <TableRow><TableCell colSpan={10} align="center">No visits</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 3: Incidents */}
      {tab === 3 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" color="error" startIcon={<ReportProblem />} onClick={() => { setIncForm(init(['incident_type','severity','title','description','incident_date','location','persons_involved','first_aid_given','first_aid_details','parent_notified','action_taken','status'])); setEditIncId(null); setOpenInc(true); }}>Report Incident</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Title</TableCell>
                <TableCell>Severity</TableCell><TableCell>Location</TableCell><TableCell>First Aid</TableCell>
                <TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {incidents.map(inc => (
                  <TableRow key={inc.id} sx={{ bgcolor: inc.severity === 'critical' ? '#ffebee' : 'inherit' }}>
                    <TableCell>{inc.incident_date}</TableCell>
                    <TableCell><Chip size="small" label={inc.incident_type} /></TableCell>
                    <TableCell>{inc.title}</TableCell>
                    <TableCell><Chip size="small" label={inc.severity} color={statColor(inc.severity)} /></TableCell>
                    <TableCell>{inc.location || '-'}</TableCell>
                    <TableCell>{inc.first_aid_given ? <Check color="success" fontSize="small"/> : '-'}</TableCell>
                    <TableCell><Chip size="small" label={inc.status} color={statColor(inc.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setIncForm(inc); setEditIncId(inc.id); setOpenInc(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {incidents.length === 0 && <TableRow><TableCell colSpan={8} align="center">No incidents</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 4: Health Checkups */}
      {tab === 4 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setChkForm(init(['checkup_name','checkup_type','checkup_date','person_type','person_id','height_cm','weight_kg','bmi','vision_left','vision_right','dental_status','hearing_status','blood_pressure','hemoglobin','doctor_name','findings','recommendations','follow_up_required'])); setOpenChk(true); }}>Add Checkup</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell>
                <TableCell>Person</TableCell><TableCell>Height/Weight</TableCell><TableCell>BMI</TableCell>
                <TableCell>Vision</TableCell><TableCell>Findings</TableCell><TableCell>Follow-up</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {checkups.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.checkup_name}</TableCell>
                    <TableCell><Chip size="small" label={c.checkup_type} /></TableCell>
                    <TableCell>{c.checkup_date}</TableCell>
                    <TableCell>{c.person_type} #{c.person_id}</TableCell>
                    <TableCell>{c.height_cm || '-'}/{c.weight_kg || '-'}</TableCell>
                    <TableCell>{c.bmi || '-'}</TableCell>
                    <TableCell>{c.vision_left || '-'}/{c.vision_right || '-'}</TableCell>
                    <TableCell>{c.findings || '-'}</TableCell>
                    <TableCell>{c.follow_up_required ? <Chip size="small" label="Yes" color="warning" /> : 'No'}</TableCell>
                  </TableRow>
                ))}
                {checkups.length === 0 && <TableRow><TableCell colSpan={9} align="center">No checkups</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 5: Visitors */}
      {tab === 5 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setVisForm(init(['visitor_name','visitor_phone','visitor_email','id_type','id_number','purpose','visiting_person','visiting_department','vehicle_number','items_carried','remarks'])); setOpenVis(true); }}>Check-In Visitor</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Purpose</TableCell>
                <TableCell>Visiting</TableCell><TableCell>ID</TableCell><TableCell>Entry</TableCell>
                <TableCell>Exit</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {visitors.map(v => (
                  <TableRow key={v.id} sx={{ bgcolor: v.status === 'checked_in' ? '#e8f5e9' : 'inherit' }}>
                    <TableCell>{v.visitor_name}</TableCell>
                    <TableCell>{v.visitor_phone || '-'}</TableCell>
                    <TableCell>{v.purpose}</TableCell>
                    <TableCell>{v.visiting_person || '-'}</TableCell>
                    <TableCell>{v.id_type ? `${v.id_type}: ${v.id_number}` : '-'}</TableCell>
                    <TableCell>{v.entry_time ? new Date(v.entry_time).toLocaleString() : '-'}</TableCell>
                    <TableCell>{v.exit_time ? new Date(v.exit_time).toLocaleString() : '-'}</TableCell>
                    <TableCell><Chip size="small" label={v.status} color={statColor(v.status)} /></TableCell>
                    <TableCell>
                      {v.status === 'checked_in' && <Button size="small" startIcon={<ExitToApp />} onClick={() => healthAPI.checkoutVisitor(v.id).then(() => { msg('Checked out'); fetchVisitors(); }).catch(() => msg('Failed','error'))}>Out</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {visitors.length === 0 && <TableRow><TableCell colSpan={9} align="center">No visitors</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 6: Safety Drills */}
      {tab === 6 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setDrlForm(init(['drill_type','drill_name','scheduled_date','scheduled_time','assembly_point','conducted_by','status'])); setEditDrlId(null); setOpenDrl(true); }}>Schedule Drill</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Scheduled</TableCell>
                <TableCell>Actual</TableCell><TableCell>Duration</TableCell><TableCell>Participants</TableCell>
                <TableCell>Rating</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {drills.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.drill_name}</TableCell>
                    <TableCell><Chip size="small" label={d.drill_type} color="warning" /></TableCell>
                    <TableCell>{d.scheduled_date}</TableCell>
                    <TableCell>{d.actual_date || '-'}</TableCell>
                    <TableCell>{d.duration_minutes ? `${d.duration_minutes} min` : '-'}</TableCell>
                    <TableCell>{d.participants_count || '-'}</TableCell>
                    <TableCell>{d.rating ? `${d.rating}/5` : '-'}</TableCell>
                    <TableCell><Chip size="small" label={d.status} color={statColor(d.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setDrlForm(d); setEditDrlId(d.id); setOpenDrl(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {drills.length === 0 && <TableRow><TableCell colSpan={9} align="center">No drills</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 7: Medications */}
      {tab === 7 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setMedForm(init(['person_type','person_id','medication_name','dosage','frequency','timing','prescribed_by','start_date','end_date','condition','parent_consent','status','notes'])); setEditMedId(null); setOpenMed(true); }}>Add Medication</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Person</TableCell><TableCell>Medication</TableCell><TableCell>Dosage</TableCell>
                <TableCell>Frequency</TableCell><TableCell>Condition</TableCell><TableCell>Start</TableCell>
                <TableCell>End</TableCell><TableCell>Consent</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {medications.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{m.person_type} #{m.person_id}</TableCell>
                    <TableCell><strong>{m.medication_name}</strong></TableCell>
                    <TableCell>{m.dosage || '-'}</TableCell>
                    <TableCell>{m.frequency || '-'}</TableCell>
                    <TableCell>{m.condition || '-'}</TableCell>
                    <TableCell>{m.start_date}</TableCell>
                    <TableCell>{m.end_date || '-'}</TableCell>
                    <TableCell>{m.parent_consent ? <Check color="success" fontSize="small"/> : '-'}</TableCell>
                    <TableCell><Chip size="small" label={m.status} color={statColor(m.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setMedForm(m); setEditMedId(m.id); setOpenMed(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {medications.length === 0 && <TableRow><TableCell colSpan={10} align="center">No medications</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 8: Emergency Contacts */}
      {tab === 8 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setEmForm(init(['person_type','person_id','contact_name','relationship','phone_primary','phone_secondary','email','address','priority'])); setOpenEm(true); }}>Add Contact</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Priority</TableCell><TableCell>Person</TableCell><TableCell>Contact Name</TableCell>
                <TableCell>Relation</TableCell><TableCell>Phone 1</TableCell><TableCell>Phone 2</TableCell>
                <TableCell>Email</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {emergency.map(e => (
                  <TableRow key={e.id}>
                    <TableCell><Chip size="small" label={`#${e.priority}`} color={e.priority === 1 ? 'error' : 'default'} /></TableCell>
                    <TableCell>{e.person_type} #{e.person_id}</TableCell>
                    <TableCell><strong>{e.contact_name}</strong></TableCell>
                    <TableCell>{e.relationship || '-'}</TableCell>
                    <TableCell>{e.phone_primary}</TableCell>
                    <TableCell>{e.phone_secondary || '-'}</TableCell>
                    <TableCell>{e.email || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => healthAPI.deleteEmergency(e.id).then(() => { msg('Deleted'); fetchEmergency(); }).catch(() => msg('Failed','error'))}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {emergency.length === 0 && <TableRow><TableCell colSpan={8} align="center">No contacts</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 9: Wellbeing */}
      {tab === 9 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setWelForm(init(['student_id','record_date','mood','mood_score','sleep_hours','stress_level','notes','counselor_referral','counselor_name','intervention_type','intervention_notes','follow_up_date','status'])); setEditWelId(null); setOpenWel(true); }}>Add Record</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Date</TableCell><TableCell>Student</TableCell><TableCell>Mood</TableCell>
                <TableCell>Score</TableCell><TableCell>Stress</TableCell><TableCell>Sleep</TableCell>
                <TableCell>Referral</TableCell><TableCell>Intervention</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {wellbeing.map(w => (
                  <TableRow key={w.id} sx={{ bgcolor: w.stress_level === 'critical' ? '#ffebee' : w.stress_level === 'high' ? '#fff3e0' : 'inherit' }}>
                    <TableCell>{w.record_date}</TableCell>
                    <TableCell>{w.student_id}</TableCell>
                    <TableCell>{{'happy':'😊','neutral':'😐','sad':'😢','anxious':'😰','angry':'😠'}[w.mood] || w.mood}</TableCell>
                    <TableCell>{w.mood_score}/10</TableCell>
                    <TableCell><Chip size="small" label={w.stress_level} color={w.stress_level === 'high' || w.stress_level === 'critical' ? 'error' : 'default'} /></TableCell>
                    <TableCell>{w.sleep_hours ? `${w.sleep_hours}h` : '-'}</TableCell>
                    <TableCell>{w.counselor_referral ? <Chip size="small" label="Yes" color="warning" /> : 'No'}</TableCell>
                    <TableCell>{w.intervention_type || '-'}</TableCell>
                    <TableCell><Chip size="small" label={w.status} color={statColor(w.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setWelForm(w); setEditWelId(w.id); setOpenWel(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {wellbeing.length === 0 && <TableRow><TableCell colSpan={10} align="center">No records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 10: Sanitization */}
      {tab === 10 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setSanForm(init(['area_name','area_type','scheduled_time','actual_time','cleaned_by','verified_by','cleaning_date','chemicals_used','rating','status','remarks'])); setOpenSan(true); }}>Add Log</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Date</TableCell><TableCell>Area</TableCell><TableCell>Type</TableCell>
                <TableCell>Cleaned By</TableCell><TableCell>Verified</TableCell><TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sanitation.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.cleaning_date}</TableCell>
                    <TableCell>{s.area_name}</TableCell>
                    <TableCell>{s.area_type || '-'}</TableCell>
                    <TableCell>{s.cleaned_by || '-'}</TableCell>
                    <TableCell>{s.verified_by || '-'}</TableCell>
                    <TableCell>{s.rating ? `${s.rating}/5` : '-'}</TableCell>
                    <TableCell><Chip size="small" label={s.status} color={statColor(s.status)} /></TableCell>
                  </TableRow>
                ))}
                {sanitation.length === 0 && <TableRow><TableCell colSpan={7} align="center">No logs</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 11: Temperature */}
      {tab === 11 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setTmpForm(init(['person_type','person_id','screen_date','temperature','symptoms','action_taken','screened_by'])); setOpenTmp(true); }}>Record Temperature</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Person</TableCell>
                <TableCell>Temperature</TableCell><TableCell>Fever</TableCell><TableCell>Symptoms</TableCell>
                <TableCell>Action</TableCell><TableCell>By</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {temps.map(t => (
                  <TableRow key={t.id} sx={{ bgcolor: t.is_fever ? '#ffebee' : 'inherit' }}>
                    <TableCell>{t.screen_date}</TableCell>
                    <TableCell>{t.person_type}</TableCell>
                    <TableCell>{t.person_id}</TableCell>
                    <TableCell><Typography color={t.is_fever ? 'error' : 'inherit'} fontWeight={t.is_fever ? 'bold' : 'normal'}>{t.temperature}°F</Typography></TableCell>
                    <TableCell>{t.is_fever ? <Chip size="small" label="FEVER" color="error" /> : 'Normal'}</TableCell>
                    <TableCell>{t.symptoms || '-'}</TableCell>
                    <TableCell>{t.action_taken || '-'}</TableCell>
                    <TableCell>{t.screened_by || '-'}</TableCell>
                  </TableRow>
                ))}
                {temps.length === 0 && <TableRow><TableCell colSpan={8} align="center">No records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* DIALOGS */}
      {/* Health Record Dialog */}
      <Dialog open={openRec} onClose={() => setOpenRec(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editRecId ? 'Edit Health Record' : 'Add Health Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(recForm, setRecForm, 'Person Type', 'person_type', ['student','staff'])}
            {F(recForm, setRecForm, 'Person ID *', 'person_id', { type: 'number' })}
            {Sel(recForm, setRecForm, 'Blood Group', 'blood_group', ['A+','A-','B+','B-','AB+','AB-','O+','O-'])}
            {F(recForm, setRecForm, 'Height (cm)', 'height_cm', { type: 'number' })}
            {F(recForm, setRecForm, 'Weight (kg)', 'weight_kg', { type: 'number' })}
            {F(recForm, setRecForm, 'BMI', 'bmi', { type: 'number' })}
            {F(recForm, setRecForm, 'Vision Left', 'vision_left')}
            {F(recForm, setRecForm, 'Vision Right', 'vision_right')}
            {F(recForm, setRecForm, 'Dental Status', 'dental_status')}
            {F(recForm, setRecForm, 'Doctor Name', 'doctor_name')}
            {F(recForm, setRecForm, 'Doctor Phone', 'doctor_phone')}
            {F(recForm, setRecForm, 'Insurance Provider', 'insurance_provider')}
            {F(recForm, setRecForm, 'Policy No', 'insurance_policy_no')}
            {F(recForm, setRecForm, 'Insurance Expiry', 'insurance_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(recForm, setRecForm, 'Allergies', 'allergies', { xs: 12, multiline: true, rows: 2 })}
            {F(recForm, setRecForm, 'Chronic Conditions', 'chronic_conditions', { xs: 12, multiline: true, rows: 2 })}
            {F(recForm, setRecForm, 'Vaccinations', 'vaccinations', { xs: 12, multiline: true, rows: 2 })}
            {F(recForm, setRecForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRec(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editRecId ? healthAPI.updateRecord(editRecId, recForm) : healthAPI.createRecord(recForm);
            fn.then(() => { msg(editRecId ? 'Updated' : 'Created'); setOpenRec(false); fetchRecords(); }).catch(() => msg('Failed','error'));
          }}>{editRecId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Infirmary Dialog */}
      <Dialog open={openInf} onClose={() => setOpenInf(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editInfId ? 'Update Visit' : 'New Infirmary Visit'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(infForm, setInfForm, 'Person Type', 'person_type', ['student','staff'])}
            {F(infForm, setInfForm, 'Person ID *', 'person_id', { type: 'number' })}
            {F(infForm, setInfForm, 'Visit Date *', 'visit_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(infForm, setInfForm, 'Complaint *', 'complaint', { xs: 12 })}
            {F(infForm, setInfForm, 'Diagnosis', 'diagnosis')}
            {F(infForm, setInfForm, 'Treatment', 'treatment')}
            {F(infForm, setInfForm, 'Medicines Given', 'medicines_given', { xs: 12 })}
            {F(infForm, setInfForm, 'Temperature (°F)', 'temperature', { type: 'number' })}
            {F(infForm, setInfForm, 'Blood Pressure', 'blood_pressure')}
            {F(infForm, setInfForm, 'Attended By', 'attended_by')}
            {Sel(infForm, setInfForm, 'Status', 'status', ['treated','referred','under_observation'])}
            {F(infForm, setInfForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInf(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editInfId ? healthAPI.updateInfirmary(editInfId, infForm) : healthAPI.createInfirmary(infForm);
            fn.then(() => { msg(editInfId ? 'Updated' : 'Recorded'); setOpenInf(false); fetchInfirmary(); }).catch(() => msg('Failed','error'));
          }}>{editInfId ? 'Update' : 'Record'}</Button>
        </DialogActions>
      </Dialog>

      {/* Incident Dialog */}
      <Dialog open={openInc} onClose={() => setOpenInc(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editIncId ? 'Update Incident' : 'Report Incident'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(incForm, setIncForm, 'Type *', 'incident_type', ['injury','fight','bullying','property_damage','medical','other'])}
            {Sel(incForm, setIncForm, 'Severity', 'severity', ['minor','moderate','severe','critical'])}
            {F(incForm, setIncForm, 'Title *', 'title', { xs: 12 })}
            {F(incForm, setIncForm, 'Date *', 'incident_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(incForm, setIncForm, 'Location', 'location')}
            {F(incForm, setIncForm, 'Persons Involved', 'persons_involved', { xs: 12 })}
            {F(incForm, setIncForm, 'Description', 'description', { xs: 12, multiline: true, rows: 3 })}
            {F(incForm, setIncForm, 'First Aid Details', 'first_aid_details', { xs: 12 })}
            {F(incForm, setIncForm, 'Action Taken', 'action_taken', { xs: 12, multiline: true, rows: 2 })}
            {Sel(incForm, setIncForm, 'Status', 'status', ['reported','investigating','resolved','closed'])}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInc(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => {
            const fn = editIncId ? healthAPI.updateIncident(editIncId, incForm) : healthAPI.createIncident(incForm);
            fn.then(() => { msg(editIncId ? 'Updated' : 'Reported'); setOpenInc(false); fetchIncidents(); }).catch(() => msg('Failed','error'));
          }}>{editIncId ? 'Update' : 'Report'}</Button>
        </DialogActions>
      </Dialog>

      {/* Checkup Dialog */}
      <Dialog open={openChk} onClose={() => setOpenChk(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Health Checkup</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(chkForm, setChkForm, 'Checkup Name *', 'checkup_name', { xs: 12 })}
            {Sel(chkForm, setChkForm, 'Type', 'checkup_type', ['annual','dental','eye','bmi','general'])}
            {F(chkForm, setChkForm, 'Date *', 'checkup_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {Sel(chkForm, setChkForm, 'Person Type', 'person_type', ['student','staff'])}
            {F(chkForm, setChkForm, 'Person ID *', 'person_id', { type: 'number' })}
            {F(chkForm, setChkForm, 'Height (cm)', 'height_cm', { type: 'number' })}
            {F(chkForm, setChkForm, 'Weight (kg)', 'weight_kg', { type: 'number' })}
            {F(chkForm, setChkForm, 'BMI', 'bmi', { type: 'number' })}
            {F(chkForm, setChkForm, 'Vision Left', 'vision_left')}
            {F(chkForm, setChkForm, 'Vision Right', 'vision_right')}
            {F(chkForm, setChkForm, 'Dental Status', 'dental_status')}
            {F(chkForm, setChkForm, 'Hearing Status', 'hearing_status')}
            {F(chkForm, setChkForm, 'Blood Pressure', 'blood_pressure')}
            {F(chkForm, setChkForm, 'Hemoglobin', 'hemoglobin', { type: 'number' })}
            {F(chkForm, setChkForm, 'Doctor', 'doctor_name')}
            {F(chkForm, setChkForm, 'Findings', 'findings', { xs: 12, multiline: true, rows: 2 })}
            {F(chkForm, setChkForm, 'Recommendations', 'recommendations', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChk(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            healthAPI.createCheckup(chkForm).then(() => { msg('Recorded'); setOpenChk(false); fetchCheckups(); }).catch(() => msg('Failed','error'));
          }}>Record</Button>
        </DialogActions>
      </Dialog>

      {/* Visitor Dialog */}
      <Dialog open={openVis} onClose={() => setOpenVis(false)} maxWidth="md" fullWidth>
        <DialogTitle>Check-In Visitor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(visForm, setVisForm, 'Visitor Name *', 'visitor_name')}
            {F(visForm, setVisForm, 'Phone', 'visitor_phone')}
            {F(visForm, setVisForm, 'Email', 'visitor_email')}
            {Sel(visForm, setVisForm, 'ID Type', 'id_type', ['aadhar','voter_id','driving_license','passport'])}
            {F(visForm, setVisForm, 'ID Number', 'id_number')}
            {F(visForm, setVisForm, 'Purpose *', 'purpose', { xs: 12 })}
            {F(visForm, setVisForm, 'Visiting Person', 'visiting_person')}
            {F(visForm, setVisForm, 'Department', 'visiting_department')}
            {F(visForm, setVisForm, 'Vehicle No', 'vehicle_number')}
            {F(visForm, setVisForm, 'Items Carried', 'items_carried', { xs: 12 })}
            {F(visForm, setVisForm, 'Remarks', 'remarks', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVis(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            healthAPI.createVisitor(visForm).then(() => { msg('Visitor checked in'); setOpenVis(false); fetchVisitors(); }).catch(() => msg('Failed','error'));
          }}>Check In</Button>
        </DialogActions>
      </Dialog>

      {/* Safety Drill Dialog */}
      <Dialog open={openDrl} onClose={() => setOpenDrl(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editDrlId ? 'Update Drill' : 'Schedule Drill'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(drlForm, setDrlForm, 'Type *', 'drill_type', ['fire','earthquake','lockdown','evacuation','flood'])}
            {F(drlForm, setDrlForm, 'Drill Name *', 'drill_name')}
            {F(drlForm, setDrlForm, 'Scheduled Date *', 'scheduled_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(drlForm, setDrlForm, 'Time', 'scheduled_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(drlForm, setDrlForm, 'Assembly Point', 'assembly_point')}
            {F(drlForm, setDrlForm, 'Conducted By', 'conducted_by')}
            {editDrlId && F(drlForm, setDrlForm, 'Actual Date', 'actual_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {editDrlId && F(drlForm, setDrlForm, 'Duration (min)', 'duration_minutes', { type: 'number' })}
            {editDrlId && F(drlForm, setDrlForm, 'Evacuation Time (s)', 'evacuation_time_seconds', { type: 'number' })}
            {editDrlId && F(drlForm, setDrlForm, 'Participants', 'participants_count', { type: 'number' })}
            {editDrlId && F(drlForm, setDrlForm, 'Rating (1-5)', 'rating', { type: 'number' })}
            {Sel(drlForm, setDrlForm, 'Status', 'status', ['scheduled','completed','cancelled'])}
            {editDrlId && F(drlForm, setDrlForm, 'Observations', 'observations', { xs: 12, multiline: true, rows: 2 })}
            {editDrlId && F(drlForm, setDrlForm, 'Issues Found', 'issues_found', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDrl(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editDrlId ? healthAPI.updateDrill(editDrlId, drlForm) : healthAPI.createDrill(drlForm);
            fn.then(() => { msg(editDrlId ? 'Updated' : 'Scheduled'); setOpenDrl(false); fetchDrills(); }).catch(() => msg('Failed','error'));
          }}>{editDrlId ? 'Update' : 'Schedule'}</Button>
        </DialogActions>
      </Dialog>

      {/* Medication Dialog */}
      <Dialog open={openMed} onClose={() => setOpenMed(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMedId ? 'Update Medication' : 'Add Medication'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(medForm, setMedForm, 'Person Type', 'person_type', ['student','staff'])}
            {F(medForm, setMedForm, 'Person ID *', 'person_id', { type: 'number' })}
            {F(medForm, setMedForm, 'Medication Name *', 'medication_name')}
            {F(medForm, setMedForm, 'Dosage', 'dosage')}
            {Sel(medForm, setMedForm, 'Frequency', 'frequency', ['daily','twice_daily','weekly','as_needed'])}
            {Sel(medForm, setMedForm, 'Timing', 'timing', ['before_meal','after_meal','morning','afternoon'])}
            {F(medForm, setMedForm, 'Prescribed By', 'prescribed_by')}
            {F(medForm, setMedForm, 'Condition', 'condition')}
            {F(medForm, setMedForm, 'Start Date *', 'start_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(medForm, setMedForm, 'End Date', 'end_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {Sel(medForm, setMedForm, 'Status', 'status', ['active','completed','discontinued'])}
            {F(medForm, setMedForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMed(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editMedId ? healthAPI.updateMedication(editMedId, medForm) : healthAPI.createMedication(medForm);
            fn.then(() => { msg(editMedId ? 'Updated' : 'Added'); setOpenMed(false); fetchMedications(); }).catch(() => msg('Failed','error'));
          }}>{editMedId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Contact Dialog */}
      <Dialog open={openEm} onClose={() => setOpenEm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(emForm, setEmForm, 'Person Type', 'person_type', ['student','staff'])}
            {F(emForm, setEmForm, 'Person ID *', 'person_id', { type: 'number' })}
            {F(emForm, setEmForm, 'Contact Name *', 'contact_name')}
            {Sel(emForm, setEmForm, 'Relationship', 'relationship', ['parent','guardian','sibling','spouse','friend','neighbor','other'])}
            {F(emForm, setEmForm, 'Phone Primary *', 'phone_primary')}
            {F(emForm, setEmForm, 'Phone Secondary', 'phone_secondary')}
            {F(emForm, setEmForm, 'Email', 'email')}
            {F(emForm, setEmForm, 'Priority (1=highest)', 'priority', { type: 'number' })}
            {F(emForm, setEmForm, 'Address', 'address', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEm(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            healthAPI.createEmergency(emForm).then(() => { msg('Contact added'); setOpenEm(false); fetchEmergency(); }).catch(() => msg('Failed','error'));
          }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Wellbeing Dialog */}
      <Dialog open={openWel} onClose={() => setOpenWel(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editWelId ? 'Update Wellbeing' : 'Add Wellbeing Record'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(welForm, setWelForm, 'Student ID *', 'student_id', { type: 'number' })}
            {F(welForm, setWelForm, 'Date *', 'record_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {Sel(welForm, setWelForm, 'Mood', 'mood', ['happy','neutral','sad','anxious','angry'])}
            {F(welForm, setWelForm, 'Mood Score (1-10)', 'mood_score', { type: 'number' })}
            {F(welForm, setWelForm, 'Sleep Hours', 'sleep_hours', { type: 'number' })}
            {Sel(welForm, setWelForm, 'Stress Level', 'stress_level', ['low','medium','high','critical'])}
            {Sel(welForm, setWelForm, 'Intervention Type', 'intervention_type', [{value:'',label:'None'},{value:'counseling',label:'Counseling'},{value:'parent_meeting',label:'Parent Meeting'},{value:'therapy',label:'Therapy'},{value:'monitoring',label:'Monitoring'}])}
            {F(welForm, setWelForm, 'Counselor Name', 'counselor_name')}
            {F(welForm, setWelForm, 'Follow-up Date', 'follow_up_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {Sel(welForm, setWelForm, 'Status', 'status', ['recorded','referred','in_progress','resolved'])}
            {F(welForm, setWelForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
            {F(welForm, setWelForm, 'Intervention Notes', 'intervention_notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWel(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editWelId ? healthAPI.updateWellbeing(editWelId, welForm) : healthAPI.createWellbeing(welForm);
            fn.then(() => { msg(editWelId ? 'Updated' : 'Created'); setOpenWel(false); fetchWellbeing(); }).catch(() => msg('Failed','error'));
          }}>{editWelId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Sanitization Dialog */}
      <Dialog open={openSan} onClose={() => setOpenSan(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sanitization Log</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(sanForm, setSanForm, 'Area Name *', 'area_name')}
            {Sel(sanForm, setSanForm, 'Area Type', 'area_type', ['classroom','toilet','lab','corridor','canteen','playground'])}
            {F(sanForm, setSanForm, 'Date *', 'cleaning_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(sanForm, setSanForm, 'Scheduled Time', 'scheduled_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(sanForm, setSanForm, 'Actual Time', 'actual_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(sanForm, setSanForm, 'Cleaned By', 'cleaned_by')}
            {F(sanForm, setSanForm, 'Verified By', 'verified_by')}
            {F(sanForm, setSanForm, 'Chemicals Used', 'chemicals_used')}
            {F(sanForm, setSanForm, 'Rating (1-5)', 'rating', { type: 'number' })}
            {Sel(sanForm, setSanForm, 'Status', 'status', ['pending','completed','missed'])}
            {F(sanForm, setSanForm, 'Remarks', 'remarks', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSan(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            healthAPI.createSanitization(sanForm).then(() => { msg('Logged'); setOpenSan(false); fetchSanitation(); }).catch(() => msg('Failed','error'));
          }}>Log</Button>
        </DialogActions>
      </Dialog>

      {/* Temperature Dialog */}
      <Dialog open={openTmp} onClose={() => setOpenTmp(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Temperature</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(tmpForm, setTmpForm, 'Person Type', 'person_type', ['student','staff','visitor'])}
            {F(tmpForm, setTmpForm, 'Person ID *', 'person_id', { type: 'number' })}
            {F(tmpForm, setTmpForm, 'Date *', 'screen_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(tmpForm, setTmpForm, 'Temperature (°F) *', 'temperature', { type: 'number' })}
            {F(tmpForm, setTmpForm, 'Symptoms', 'symptoms', { xs: 12 })}
            {Sel(tmpForm, setTmpForm, 'Action Taken', 'action_taken', ['allowed','sent_home','infirmary','isolated'])}
            {F(tmpForm, setTmpForm, 'Screened By', 'screened_by')}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTmp(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            healthAPI.createTemperature(tmpForm).then(() => { msg('Recorded'); setOpenTmp(false); fetchTemps(); }).catch(() => msg('Failed','error'));
          }}>Record</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
