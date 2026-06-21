import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Chip, Snackbar, Alert, Card, CardContent, IconButton, MenuItem
} from '@mui/material';
import {
  Add, DirectionsBus, Person, Speed, Warning, Build, LocalGasStation,
  AttachMoney, Map, FlightTakeoff, SwapHoriz, Edit, Delete, Check, Refresh
} from '@mui/icons-material';
import { transportAPI } from '../../services/api';
import { validateForm } from '../../components/Validation';

const init = (keys) => keys.reduce((o, k) => ({ ...o, [k]: '' }), {});
// strip blank values so backend never receives '' for number/date columns
const clean = (obj) => Object.fromEntries(
  Object.entries(obj || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
);

export default function Transport() {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const msg = (m, s = 'success') => setSnack({ open: true, message: m, severity: s });

  const [dash, setDash] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [openVehicle, setOpenVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(init(['vehicle_number','vehicle_type','make','model','year','capacity','fuel_type','registration_date','insurance_expiry','fitness_expiry','permit_expiry','pollution_expiry','chassis_number','engine_number','gps_device_id','status','current_odometer','notes']));
  const [editVehicleId, setEditVehicleId] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [openDriver, setOpenDriver] = useState(false);
  const [driverForm, setDriverForm] = useState(init(['name','phone','email','license_number','license_type','license_expiry','medical_fitness_expiry','aadhar_number','address','blood_group','emergency_contact','experience_years','status']));
  const [editDriverId, setEditDriverId] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [openRoute, setOpenRoute] = useState(false);
  const [routeForm, setRouteForm] = useState(init(['route_name','route_code','description','vehicle_id','driver_id','helper_name','helper_phone','start_location','end_location','total_distance_km','estimated_time_min','shift','status']));
  const [editRouteId, setEditRouteId] = useState(null);
  const [openStop, setOpenStop] = useState(false);
  const [stopForm, setStopForm] = useState(init(['route_name','stop_name','pickup_time','drop_time','fare']));
  const [students, setStudents] = useState([]);
  const [openAssign, setOpenAssign] = useState(false);
  const [assignForm, setAssignForm] = useState(init(['admission_no','student_name','father_name','route_name','stop_name','monthly_fee','pickup_type','rfid_card_no']));
  const [gps, setGps] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [openMaint, setOpenMaint] = useState(false);
  const [maintForm, setMaintForm] = useState(init(['vehicle_id','maintenance_type','description','vendor_name','cost','odometer_reading','scheduled_date','completed_date','next_due_date','status','invoice_no','notes']));
  const [editMaintId, setEditMaintId] = useState(null);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [openFuel, setOpenFuel] = useState(false);
  const [fuelForm, setFuelForm] = useState(init(['vehicle_id','fill_date','fuel_type','quantity_liters','rate_per_liter','total_cost','odometer_reading','pump_name','receipt_no','filled_by','notes']));
  const [fees, setFees] = useState([]);
  const [openFee, setOpenFee] = useState(false);
  const [feeForm, setFeeForm] = useState(init(['admission_no','student_name','father_name','distance_km','fee_type','amount','paid_date','academic_year']));
  const [sosAlerts, setSosAlerts] = useState([]);
  const [openSOS, setOpenSOS] = useState(false);
  const [sosForm, setSOSForm] = useState(init(['vehicle_id','route_id','driver_id','alert_type','description']));
  const [trips, setTrips] = useState([]);
  const [openTrip, setOpenTrip] = useState(false);
  const [tripForm, setTripForm] = useState(init(['trip_name','trip_type','destination','vehicle_id','driver_id','departure_datetime','return_datetime','total_students','total_staff','estimated_cost','notes','status']));
  const [editTripId, setEditTripId] = useState(null);
  const [routeRequests, setRouteRequests] = useState([]);
  const [openReq, setOpenReq] = useState(false);
  const [reqForm, setReqForm] = useState(init(['student_id','current_route_id','requested_route_id','current_stop_id','requested_stop_id','reason','effective_date']));
  const [speedAlerts, setSpeedAlerts] = useState([]);

  // Emergency alert + notification dialogs (principal/admin only)
  const [openEmergency, setOpenEmergency] = useState(false);
  const [emgForm, setEmgForm] = useState({ title: '', message: '', route_id: '', audience: 'all_transport' });
  const [emgSaving, setEmgSaving] = useState(false);
  const [openNotify, setOpenNotify] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ title: '', message: '', route_id: '' });
  const [notifySaving, setNotifySaving] = useState(false);

  const sendEmergency = () => {
    if (!emgForm.title.trim()) { msg('Title required', 'error'); return; }
    setEmgSaving(true);
    const payload = { ...emgForm };
    if (!payload.route_id) delete payload.route_id;
    transportAPI.emergencyAlert(payload)
      .then(r => { msg(`Emergency sent to ${r.data?.data?.notified_users ?? 0} users`); setOpenEmergency(false); fetchSOS(); })
      .catch(e => msg(e.response?.data?.message || 'Failed', 'error'))
      .finally(() => setEmgSaving(false));
  };

  const sendNotify = () => {
    if (!notifyForm.title.trim()) { msg('Title required', 'error'); return; }
    setNotifySaving(true);
    const payload = { ...notifyForm };
    if (!payload.route_id) delete payload.route_id;
    transportAPI.notify(payload)
      .then(r => { msg(`Notification sent to ${r.data?.data?.notified_users ?? 0} users`); setOpenNotify(false); })
      .catch(e => msg(e.response?.data?.message || 'Failed', 'error'))
      .finally(() => setNotifySaving(false));
  };

  const NOTIFY_PRESETS = [
    'Bus has reached school',
    'Bus has left school',
    'Bus will not come today',
    'Bus is running late',
  ];

  // Auto-fill student name + father name when admission number is entered
  const lookupStudent = (adm) => {
    const a = (adm || '').trim();
    if (!a) { setAssignForm(f => ({ ...f, student_name: '', father_name: '' })); return; }
    transportAPI.studentLookup(a)
      .then(r => {
        const d = r.data?.data || {};
        setAssignForm(f => ({ ...f, student_name: d.student_name || '', father_name: d.father_name || '' }));
      })
      .catch(() => {
        setAssignForm(f => ({ ...f, student_name: 'Not found', father_name: '' }));
      });
  };

  // Same lookup for the Fee form
  const lookupFeeStudent = (adm) => {
    const a = (adm || '').trim();
    if (!a) { setFeeForm(f => ({ ...f, student_name: '', father_name: '' })); return; }
    transportAPI.studentLookup(a)
      .then(r => {
        const d = r.data?.data || {};
        setFeeForm(f => ({ ...f, student_name: d.student_name || '', father_name: d.father_name || '' }));
      })
      .catch(() => {
        setFeeForm(f => ({ ...f, student_name: 'Not found', father_name: '' }));
      });
  };

  const ex = (d) => d?.data?.data?.items || d?.data?.data || d?.data?.items || [];

  const fetchDash = useCallback(() => transportAPI.getDashboard().then(r => setDash(r.data.data || {})).catch(() => {}), []);
  const fetchVehicles = useCallback(() => transportAPI.listVehicles({}).then(r => setVehicles(ex(r))).catch(() => {}), []);
  const fetchDrivers = useCallback(() => transportAPI.listDrivers({}).then(r => setDrivers(ex(r))).catch(() => {}), []);
  const fetchRoutes = useCallback(() => transportAPI.listRoutes({}).then(r => setRoutes(ex(r))).catch(() => {}), []);
  const fetchStudents = useCallback(() => transportAPI.listStudents({}).then(r => setStudents(ex(r))).catch(() => {}), []);
  const fetchGPS = useCallback(() => transportAPI.latestGPS().then(r => setGps(r.data.data || [])).catch(() => {}), []);
  const fetchMaintenance = useCallback(() => transportAPI.listMaintenance({}).then(r => setMaintenance(ex(r))).catch(() => {}), []);
  const fetchFuel = useCallback(() => transportAPI.listFuelLogs({}).then(r => setFuelLogs(ex(r))).catch(() => {}), []);
  const fetchFees = useCallback(() => transportAPI.listFees({}).then(r => setFees(ex(r))).catch(() => {}), []);
  const fetchSOS = useCallback(() => transportAPI.listSOSAlerts({}).then(r => setSosAlerts(ex(r))).catch(() => {}), []);
  const fetchTrips = useCallback(() => transportAPI.listTrips({}).then(r => setTrips(ex(r))).catch(() => {}), []);
  const fetchRequests = useCallback(() => transportAPI.listRouteRequests({}).then(r => setRouteRequests(ex(r))).catch(() => {}), []);
  const fetchSpeed = useCallback(() => transportAPI.listSpeedAlerts({}).then(r => setSpeedAlerts(ex(r))).catch(() => {}), []);

  useEffect(() => { fetchDash(); }, [fetchDash]);
  useEffect(() => { fetchRoutes(); fetchVehicles(); fetchDrivers(); }, [fetchRoutes, fetchVehicles, fetchDrivers]); // for route/assign dropdowns
  useEffect(() => {
    const fetchers = [null, fetchVehicles, fetchDrivers, fetchRoutes, fetchStudents, fetchGPS, fetchMaintenance, fetchFuel, fetchFees, fetchSOS, fetchTrips, fetchRequests, fetchSpeed];
    if (fetchers[tab]) fetchers[tab]();
  }, [tab, fetchVehicles, fetchDrivers, fetchRoutes, fetchStudents, fetchGPS, fetchMaintenance, fetchFuel, fetchFees, fetchSOS, fetchTrips, fetchRequests, fetchSpeed]);

  const handleSaveVehicle = () => {
    const errs = validateForm(vehicleForm, { vehicle_number: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const fn = editVehicleId ? transportAPI.updateVehicle(editVehicleId, clean(vehicleForm)) : transportAPI.createVehicle(clean(vehicleForm));
    fn.then(() => { msg(editVehicleId ? 'Updated' : 'Created'); setOpenVehicle(false); fetchVehicles(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveDriver = () => {
    const errs = validateForm(driverForm, { name: ['required'], phone: ['phone'], email: ['email'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const fn = editDriverId ? transportAPI.updateDriver(editDriverId, clean(driverForm)) : transportAPI.createDriver(clean(driverForm));
    fn.then(() => { msg(editDriverId ? 'Updated' : 'Created'); setOpenDriver(false); fetchDrivers(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveRoute = () => {
    const errs = validateForm(routeForm, { route_name: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const fn = editRouteId ? transportAPI.updateRoute(editRouteId, clean(routeForm)) : transportAPI.createRoute(clean(routeForm));
    fn.then(() => { msg(editRouteId ? 'Updated' : 'Created'); setOpenRoute(false); fetchRoutes(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveStop = () => {
    const errs = validateForm(stopForm, { route_name: ['required'], stop_name: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    transportAPI.addStopByName(clean(stopForm)).then(() => { msg('Stop added'); setOpenStop(false); fetchRoutes(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveAssignment = () => {
    const errs = validateForm(assignForm, { admission_no: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const { student_name, father_name, ...payload } = assignForm;
    transportAPI.assign(clean(payload)).then(() => { msg('Assigned'); setOpenAssign(false); fetchStudents(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveMaintenance = () => {
    const errs = validateForm(maintForm, { vehicle_id: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const fn = editMaintId ? transportAPI.updateMaintenance(editMaintId, maintForm) : transportAPI.createMaintenance(maintForm);
    fn.then(() => { msg(editMaintId ? 'Updated' : 'Created'); setOpenMaint(false); fetchMaintenance(); }).catch(() => msg('Failed','error'));
  };
  const handleSaveFuel = () => {
    const errs = validateForm(fuelForm, { vehicle_id: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    transportAPI.createFuelLog(fuelForm).then(() => { msg('Created'); setOpenFuel(false); fetchFuel(); }).catch(() => msg('Failed','error'));
  };
  const handleSaveFee = () => {
    const errs = validateForm(feeForm, { admission_no: ['required'], amount: ['number'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const { student_name, father_name, ...payload } = feeForm;
    transportAPI.createFee(clean(payload)).then(() => { msg('Fee recorded'); setOpenFee(false); fetchFees(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveSOS = () => {
    const errs = validateForm(sosForm, { alert_type: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    transportAPI.createSOSAlert(clean(sosForm)).then(() => { msg('SOS Triggered!'); setOpenSOS(false); fetchSOS(); }).catch((e) => msg(e.response?.data?.message || 'Failed','error'));
  };
  const handleSaveTrip = () => {
    const errs = validateForm(tripForm, { trip_name: ['required'] });
    if (Object.keys(errs).length) { msg(Object.values(errs)[0], 'error'); return; }
    const fn = editTripId ? transportAPI.updateTrip(editTripId, tripForm) : transportAPI.createTrip(tripForm);
    fn.then(() => { msg(editTripId ? 'Updated' : 'Created'); setOpenTrip(false); fetchTrips(); }).catch(() => msg('Failed','error'));
  };

      <Dialog open={openDriver} onClose={() => setOpenDriver(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editDriverId ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(driverForm, setDriverForm, 'Name *', 'name')}
            {F(driverForm, setDriverForm, 'Phone', 'phone')}
            {F(driverForm, setDriverForm, 'Email', 'email')}
            {F(driverForm, setDriverForm, 'License Number', 'license_number')}
            {Sel(driverForm, setDriverForm, 'License Type', 'license_type', ['LMV','HMV'])}
            {F(driverForm, setDriverForm, 'License Expiry', 'license_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(driverForm, setDriverForm, 'Medical Fitness Expiry', 'medical_fitness_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(driverForm, setDriverForm, 'Aadhar Number', 'aadhar_number')}
            {F(driverForm, setDriverForm, 'Blood Group', 'blood_group')}
            {F(driverForm, setDriverForm, 'Emergency Contact', 'emergency_contact')}
            {F(driverForm, setDriverForm, 'Experience (Years)', 'experience_years', { type: 'number' })}
            {Sel(driverForm, setDriverForm, 'Status', 'status', ['active','on_leave','terminated'])}
            {F(driverForm, setDriverForm, 'Address', 'address', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDriver(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDriver}>{editDriverId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRoute} onClose={() => setOpenRoute(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editRouteId ? 'Edit Route' : 'Add Route'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(routeForm, setRouteForm, 'Route Name *', 'route_name')}
            {F(routeForm, setRouteForm, 'Route Code', 'route_code')}
            {Sel(routeForm, setRouteForm, 'Vehicle', 'vehicle_id',
              [{ value: '', label: '— None —' }, ...vehicles.map(v => ({ value: v.id, label: `${v.vehicle_number}${v.vehicle_type ? ' (' + v.vehicle_type + ')' : ''}` }))])}
            {Sel(routeForm, setRouteForm, 'Driver', 'driver_id',
              [{ value: '', label: '— None —' }, ...drivers.map(d => ({ value: d.id, label: `${d.name}${d.phone ? ' • ' + d.phone : ''}` }))])}
            {F(routeForm, setRouteForm, 'Helper Name', 'helper_name')}
            {F(routeForm, setRouteForm, 'Helper Phone', 'helper_phone')}
            {F(routeForm, setRouteForm, 'Start Location', 'start_location')}
            {F(routeForm, setRouteForm, 'End Location', 'end_location')}
            {Sel(routeForm, setRouteForm, 'Shift', 'shift', ['morning','afternoon','both'])}
            {Sel(routeForm, setRouteForm, 'Status', 'status', ['active','inactive'])}
          </Grid>
          {vehicles.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>Pehle "Vehicles" tab me bus add karo, tabhi yahan select kar paoge.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoute(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRoute}>{editRouteId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStop} onClose={() => setOpenStop(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Stop</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Route ka naam likho (jo aapne banaya hai), ID ki zarurat nahi.</Alert>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(stopForm, setStopForm, 'Route Name *', 'route_name', { xs: 12 })}
            {F(stopForm, setStopForm, 'Stop Name *', 'stop_name', { xs: 12 })}
            {F(stopForm, setStopForm, 'Pickup Time', 'pickup_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(stopForm, setStopForm, 'Drop Time', 'drop_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(stopForm, setStopForm, 'Fare (₹)', 'fare', { type: 'number' })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStop(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveStop}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Student to Transport</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Admission Number likhte hi student ka naam aur father ka naam auto-fill ho jayega. Route ka naam likho, naya stop apne aap ban jayega.</Alert>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Student Admission No *" value={assignForm.admission_no || ''}
                onChange={e => setAssignForm({ ...assignForm, admission_no: e.target.value })}
                onBlur={e => lookupStudent(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Student Name" value={assignForm.student_name || ''}
                InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }}
                placeholder="auto-filled" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Father Name" value={assignForm.father_name || ''}
                InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }}
                placeholder="auto-filled" />
            </Grid>
            {F(assignForm, setAssignForm, 'Route Name *', 'route_name', { xs: 12 })}
            {F(assignForm, setAssignForm, 'Stop Name *', 'stop_name')}
            {F(assignForm, setAssignForm, 'Monthly Transport Fee (₹)', 'monthly_fee', { type: 'number' })}
            {Sel(assignForm, setAssignForm, 'Pickup Type', 'pickup_type', ['both','pickup_only','drop_only'])}
            {F(assignForm, setAssignForm, 'RFID Card No', 'rfid_card_no')}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            handleSaveAssignment();
          }}>Assign</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMaint} onClose={() => setOpenMaint(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMaintId ? 'Edit Maintenance' : 'Add Maintenance'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(maintForm, setMaintForm, 'Vehicle ID *', 'vehicle_id', { type: 'number' })}
            {Sel(maintForm, setMaintForm, 'Type *', 'maintenance_type', ['scheduled','repair','emergency','inspection'])}
            {F(maintForm, setMaintForm, 'Vendor', 'vendor_name')}
            {F(maintForm, setMaintForm, 'Cost', 'cost', { type: 'number' })}
            {F(maintForm, setMaintForm, 'Odometer', 'odometer_reading', { type: 'number' })}
            {F(maintForm, setMaintForm, 'Scheduled Date', 'scheduled_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(maintForm, setMaintForm, 'Completed Date', 'completed_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(maintForm, setMaintForm, 'Next Due Date', 'next_due_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {Sel(maintForm, setMaintForm, 'Status', 'status', ['scheduled','in_progress','completed','cancelled'])}
            {F(maintForm, setMaintForm, 'Invoice No', 'invoice_no')}
            {F(maintForm, setMaintForm, 'Description', 'description', { xs: 12, multiline: true, rows: 2 })}
            {F(maintForm, setMaintForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaint(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMaintenance}>{editMaintId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFuel} onClose={() => setOpenFuel(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Fuel Log</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(fuelForm, setFuelForm, 'Vehicle ID *', 'vehicle_id', { type: 'number' })}
            {F(fuelForm, setFuelForm, 'Fill Date *', 'fill_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {Sel(fuelForm, setFuelForm, 'Fuel Type', 'fuel_type', ['diesel','petrol','cng','electric'])}
            {F(fuelForm, setFuelForm, 'Quantity (L) *', 'quantity_liters', { type: 'number' })}
            {F(fuelForm, setFuelForm, 'Rate/Liter', 'rate_per_liter', { type: 'number' })}
            {F(fuelForm, setFuelForm, 'Total Cost', 'total_cost', { type: 'number' })}
            {F(fuelForm, setFuelForm, 'Odometer', 'odometer_reading', { type: 'number' })}
            {F(fuelForm, setFuelForm, 'Pump Name', 'pump_name')}
            {F(fuelForm, setFuelForm, 'Receipt No', 'receipt_no')}
            {F(fuelForm, setFuelForm, 'Filled By', 'filled_by')}
            {F(fuelForm, setFuelForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFuel(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFuel}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFee} onClose={() => setOpenFee(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Collect Transport Fee</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Admission Number likhte hi student aur father ka naam auto-fill ho jayega.</Alert>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Student Admission No *" value={feeForm.admission_no || ''}
                onChange={e => setFeeForm({ ...feeForm, admission_no: e.target.value })}
                onBlur={e => lookupFeeStudent(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Student Name" value={feeForm.student_name || ''}
                InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} placeholder="auto-filled" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Father Name" value={feeForm.father_name || ''}
                InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }} placeholder="auto-filled" />
            </Grid>
            {F(feeForm, setFeeForm, 'Distance (km)', 'distance_km', { type: 'number' })}
            {Sel(feeForm, setFeeForm, 'Fee Type', 'fee_type', ['monthly','quarterly','yearly'])}
            {F(feeForm, setFeeForm, 'Amount (₹) *', 'amount', { type: 'number' })}
            {F(feeForm, setFeeForm, 'Payment Date *', 'paid_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(feeForm, setFeeForm, 'Academic Year', 'academic_year', { xs: 12 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFee(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFee}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSOS} onClose={() => setOpenSOS(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f', fontWeight: 700 }}>🚨 Trigger SOS Alert</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>Bus, Route ya Driver select karo aur kya hua wo likho.</Alert>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(sosForm, setSOSForm, 'Alert Type *', 'alert_type', [
              { value: 'panic', label: 'Panic / Emergency' },
              { value: 'accident', label: 'Accident' },
              { value: 'breakdown', label: 'Breakdown' },
              { value: 'medical', label: 'Medical' },
              { value: 'overspeed', label: 'Overspeeding' },
            ], { xs: 12 })}
            {Sel(sosForm, setSOSForm, 'Bus', 'vehicle_id',
              [{ value: '', label: '— Select —' }, ...vehicles.map(v => ({ value: v.id, label: v.vehicle_number }))])}
            {Sel(sosForm, setSOSForm, 'Route', 'route_id',
              [{ value: '', label: '— Select —' }, ...routes.map(r => ({ value: r.id, label: r.route_name }))])}
            {Sel(sosForm, setSOSForm, 'Driver', 'driver_id',
              [{ value: '', label: '— Select —' }, ...drivers.map(d => ({ value: d.id, label: d.name }))], { xs: 12 })}
            {F(sosForm, setSOSForm, 'What happened? (Description)', 'description', { xs: 12, multiline: true, rows: 3 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSOS(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSaveSOS}>Trigger SOS</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTrip} onClose={() => setOpenTrip(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editTripId ? 'Edit Trip' : 'Plan Trip'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(tripForm, setTripForm, 'Trip Name *', 'trip_name')}
            {Sel(tripForm, setTripForm, 'Trip Type', 'trip_type', ['field_trip','sports','exam_center','special_event'])}
            {F(tripForm, setTripForm, 'Destination', 'destination')}
            {F(tripForm, setTripForm, 'Vehicle ID', 'vehicle_id', { type: 'number' })}
            {F(tripForm, setTripForm, 'Driver ID', 'driver_id', { type: 'number' })}
            {F(tripForm, setTripForm, 'Departure', 'departure_datetime', { type: 'datetime-local', InputLabelProps: { shrink: true } })}
            {F(tripForm, setTripForm, 'Return', 'return_datetime', { type: 'datetime-local', InputLabelProps: { shrink: true } })}
            {F(tripForm, setTripForm, 'Students', 'total_students', { type: 'number' })}
            {F(tripForm, setTripForm, 'Staff', 'total_staff', { type: 'number' })}
            {F(tripForm, setTripForm, 'Estimated Cost', 'estimated_cost', { type: 'number' })}
            {Sel(tripForm, setTripForm, 'Status', 'status', ['planned','approved','in_progress','completed','cancelled'])}
            {F(tripForm, setTripForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrip(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTrip}>{editTripId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReq} onClose={() => setOpenReq(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Route Change Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(reqForm, setReqForm, 'Student ID', 'student_id', { type: 'number' })}
            {F(reqForm, setReqForm, 'Current Route ID', 'current_route_id', { type: 'number' })}
            {F(reqForm, setReqForm, 'Requested Route ID', 'requested_route_id', { type: 'number' })}
            {F(reqForm, setReqForm, 'Current Stop ID', 'current_stop_id', { type: 'number' })}
            {F(reqForm, setReqForm, 'Requested Stop ID', 'requested_stop_id', { type: 'number' })}
            {F(reqForm, setReqForm, 'Effective Date', 'effective_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(reqForm, setReqForm, 'Reason', 'reason', { xs: 12, multiline: true, rows: 3 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReq(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            transportAPI.createRouteRequest(reqForm).then(() => { msg('Request submitted'); setOpenReq(false); fetchRequests(); }).catch(() => msg('Failed','error'));
          }}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>

      {/* Emergency Alert dialog */}
      <Dialog open={openEmergency} onClose={() => setOpenEmergency(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f', fontWeight: 700 }}>🚨 Send Emergency Alert</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Ye alert recipients ki screen par aawaz ke saath turant popup ban kar khulega.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(emgForm, setEmgForm, 'Title *', 'title')}
            {Sel(emgForm, setEmgForm, 'Send To', 'audience', [
              { value: 'all_transport', label: 'All Transport Students & Parents' },
              { value: 'route', label: 'Specific Route Only' },
              { value: 'everyone', label: 'Everyone in School' },
            ])}
            {emgForm.audience === 'route' && Sel(emgForm, setEmgForm, 'Route', 'route_id',
              routes.map(r => ({ value: r.id, label: r.route_name })), { xs: 12 })}
            {F(emgForm, setEmgForm, 'Message', 'message', { xs: 12, multiline: true, rows: 3 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmergency(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={sendEmergency} disabled={emgSaving}>
            {emgSaving ? 'Sending...' : 'Broadcast Emergency'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Normal Notification dialog */}
      <Dialog open={openNotify} onClose={() => setOpenNotify(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>🚌 Send Transport Notification</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 1 }}>
            {NOTIFY_PRESETS.map(p => (
              <Chip key={p} label={p} size="small" onClick={() => setNotifyForm(f => ({ ...f, title: p }))}
                variant={notifyForm.title === p ? 'filled' : 'outlined'} color="primary" />
            ))}
          </Box>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(notifyForm, setNotifyForm, 'Title *', 'title')}
            {Sel(notifyForm, setNotifyForm, 'Route (optional)', 'route_id',
              [{ value: '', label: 'All Transport Students' }, ...routes.map(r => ({ value: r.id, label: r.route_name }))])}
            {F(notifyForm, setNotifyForm, 'Message', 'message', { xs: 12, multiline: true, rows: 3 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotify(false)}>Cancel</Button>
          <Button variant="contained" onClick={sendNotify} disabled={notifySaving}>
            {notifySaving ? 'Sending...' : 'Send Notification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
