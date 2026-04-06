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

const init = (keys) => keys.reduce((o, k) => ({ ...o, [k]: '' }), {});

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
  const [stopForm, setStopForm] = useState(init(['route_id','stop_name','latitude','longitude','pickup_time','drop_time','fare','stop_order','radius_meters']));
  const [students, setStudents] = useState([]);
  const [openAssign, setOpenAssign] = useState(false);
  const [assignForm, setAssignForm] = useState(init(['student_id','route_id','stop_id','pickup_type','rfid_card_no']));
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
  const [feeForm, setFeeForm] = useState(init(['route_id','stop_id','academic_year','fee_type','amount','distance_based','distance_km','rate_per_km','effective_from','effective_to']));
  const [sosAlerts, setSosAlerts] = useState([]);
  const [openSOS, setOpenSOS] = useState(false);
  const [sosForm, setSOSForm] = useState(init(['vehicle_id','route_id','driver_id','alert_type','description','latitude','longitude']));
  const [trips, setTrips] = useState([]);
  const [openTrip, setOpenTrip] = useState(false);
  const [tripForm, setTripForm] = useState(init(['trip_name','trip_type','destination','vehicle_id','driver_id','departure_datetime','return_datetime','total_students','total_staff','estimated_cost','notes','status']));
  const [editTripId, setEditTripId] = useState(null);
  const [routeRequests, setRouteRequests] = useState([]);
  const [openReq, setOpenReq] = useState(false);
  const [reqForm, setReqForm] = useState(init(['student_id','current_route_id','requested_route_id','current_stop_id','requested_stop_id','reason','effective_date']));
  const [speedAlerts, setSpeedAlerts] = useState([]);

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
  useEffect(() => {
    const fetchers = [null, fetchVehicles, fetchDrivers, fetchRoutes, fetchStudents, fetchGPS, fetchMaintenance, fetchFuel, fetchFees, fetchSOS, fetchTrips, fetchRequests, fetchSpeed];
    if (fetchers[tab]) fetchers[tab]();
  }, [tab, fetchVehicles, fetchDrivers, fetchRoutes, fetchStudents, fetchGPS, fetchMaintenance, fetchFuel, fetchFees, fetchSOS, fetchTrips, fetchRequests, fetchSpeed]);

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
    if (['active','completed','approved','resolved'].includes(s)) return 'success';
    if (['inactive','cancelled','rejected','retired','terminated'].includes(s)) return 'error';
    if (['under_repair','scheduled','in_progress','pending','planned'].includes(s)) return 'warning';
    return 'default';
  };

  const tabLabels = ['Dashboard','Vehicles','Drivers','Routes','Students','GPS Tracking','Maintenance','Fuel Logs','Fees','SOS Alerts','Trips','Route Requests','Speed Alerts'];

  return (
    <Box>
      <Typography variant="h5" mb={2}>Transport & Fleet Management</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabLabels.map((l, i) => <Tab key={i} label={l} icon={[<DirectionsBus fontSize="small"/>,<DirectionsBus fontSize="small"/>,<Person fontSize="small"/>,<Map fontSize="small"/>,<Person fontSize="small"/>,<Map fontSize="small"/>,<Build fontSize="small"/>,<LocalGasStation fontSize="small"/>,<AttachMoney fontSize="small"/>,<Warning fontSize="small"/>,<FlightTakeoff fontSize="small"/>,<SwapHoriz fontSize="small"/>,<Speed fontSize="small"/>][i]} iconPosition="start" sx={{ minHeight: 48, textTransform: 'none' }} />)}
      </Tabs>

      {/* TAB 0: Dashboard */}
      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}><Button startIcon={<Refresh />} onClick={fetchDash}>Refresh</Button></Box>
          <Grid container spacing={2}>
            {[
              { label: 'Total Vehicles', val: dash.total_vehicles, color: '#6366f1' },
              { label: 'Active Vehicles', val: dash.active_vehicles, color: '#2e7d32' },
              { label: 'Under Repair', val: dash.under_repair, color: '#ed6c02' },
              { label: 'Spare Vehicles', val: dash.spare_vehicles, color: '#9c27b0' },
              { label: 'Active Drivers', val: dash.total_drivers, color: '#0288d1' },
              { label: 'Active Routes', val: dash.total_routes, color: '#388e3c' },
              { label: 'Students Enrolled', val: dash.total_students, color: '#f57c00' },
              { label: 'Active SOS', val: dash.active_sos, color: '#d32f2f' },
              { label: 'Pending Maintenance', val: dash.pending_maintenance, color: '#7b1fa2' },
              { label: 'Active Trips', val: dash.active_trips, color: '#00796b' },
              { label: 'Pending Requests', val: dash.pending_requests, color: '#c2185b' },
              { label: 'Speed Alerts', val: dash.speed_alerts_today, color: '#e64a19' },
            ].map((c, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ borderLeft: `4px solid ${c.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${c.color}25` } }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                    <Typography variant="h4" fontWeight="bold" color={c.color}>{c.val ?? 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* TAB 1: Vehicles */}
      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setVehicleForm(init(['vehicle_number','vehicle_type','make','model','year','capacity','fuel_type','registration_date','insurance_expiry','fitness_expiry','permit_expiry','pollution_expiry','chassis_number','engine_number','gps_device_id','status','current_odometer','notes'])); setEditVehicleId(null); setOpenVehicle(true); }}>Add Vehicle</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Vehicle No</TableCell><TableCell>Type</TableCell><TableCell>Make/Model</TableCell>
                <TableCell>Capacity</TableCell><TableCell>Fuel</TableCell><TableCell>Insurance Exp</TableCell>
                <TableCell>Fitness Exp</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {vehicles.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{v.vehicle_number}</TableCell>
                    <TableCell>{v.vehicle_type}</TableCell>
                    <TableCell>{v.make} {v.model}</TableCell>
                    <TableCell>{v.capacity}</TableCell>
                    <TableCell>{v.fuel_type}</TableCell>
                    <TableCell>{v.insurance_expiry || '-'}</TableCell>
                    <TableCell>{v.fitness_expiry || '-'}</TableCell>
                    <TableCell><Chip size="small" label={v.status} color={statColor(v.status)} /></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setVehicleForm(v); setEditVehicleId(v.id); setOpenVehicle(true); }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => { transportAPI.deleteVehicle(v.id).then(() => { msg('Deleted'); fetchVehicles(); }).catch(() => msg('Failed','error')); }}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {vehicles.length === 0 && <TableRow><TableCell colSpan={9} align="center">No vehicles</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: Drivers */}
      {tab === 2 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2} flexWrap="wrap" gap={1}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setDriverForm(init(['name','phone','email','license_number','license_type','license_expiry','medical_fitness_expiry','aadhar_number','address','blood_group','emergency_contact','experience_years','status'])); setEditDriverId(null); setOpenDriver(true); }}>Add Driver</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>License No</TableCell>
                <TableCell>License Expiry</TableCell><TableCell>Medical Exp</TableCell><TableCell>Score</TableCell>
                <TableCell>Experience</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {drivers.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell>{d.license_number}</TableCell>
                    <TableCell>{d.license_expiry || '-'}</TableCell>
                    <TableCell>{d.medical_fitness_expiry || '-'}</TableCell>
                    <TableCell>{d.driving_score}</TableCell>
                    <TableCell>{d.experience_years} yrs</TableCell>
                    <TableCell><Chip size="small" label={d.status} color={statColor(d.status)} /></TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setDriverForm(d); setEditDriverId(d.id); setOpenDriver(true); }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => { transportAPI.deleteDriver(d.id).then(() => { msg('Deleted'); fetchDrivers(); }).catch(() => msg('Failed','error')); }}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {drivers.length === 0 && <TableRow><TableCell colSpan={9} align="center">No drivers</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 3: Routes */}
      {tab === 3 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" gap={1} mb={2}>
            <Button variant="outlined" onClick={() => { setStopForm(init(['route_id','stop_name','latitude','longitude','pickup_time','drop_time','fare','stop_order','radius_meters'])); setOpenStop(true); }}>Add Stop</Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setRouteForm(init(['route_name','route_code','description','vehicle_id','driver_id','helper_name','helper_phone','start_location','end_location','total_distance_km','estimated_time_min','shift','status'])); setEditRouteId(null); setOpenRoute(true); }}>Add Route</Button>
          </Box>
          {routes.map(route => (
            <Paper key={route.id} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="h6">{route.route_name} {route.route_code ? `(${route.route_code})` : ''}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle: {route.vehicle?.vehicle_number || route.vehicle_no || 'N/A'} | Driver: {route.driver?.name || route.driver_name || 'N/A'} | Distance: {route.total_distance_km || '-'} km | Time: {route.estimated_time_min || '-'} min
                  </Typography>
                </Box>
                <Box>
                  <Chip label={route.status} color={statColor(route.status)} size="small" sx={{ mr: 1 }} />
                  <IconButton size="small" onClick={() => { setRouteForm(route); setEditRouteId(route.id); setOpenRoute(true); }}><Edit fontSize="small" /></IconButton>
                </Box>
              </Box>
              {route.stops?.length > 0 && (
                <Table size="small">
                  <TableHead><TableRow><TableCell>#</TableCell><TableCell>Stop Name</TableCell><TableCell>Pickup</TableCell><TableCell>Drop</TableCell><TableCell>Fare</TableCell></TableRow></TableHead>
                  <TableBody>
                    {route.stops.map((s, i) => <TableRow key={i}><TableCell>{s.stop_order}</TableCell><TableCell>{s.stop_name}</TableCell><TableCell>{s.pickup_time || '-'}</TableCell><TableCell>{s.drop_time || '-'}</TableCell><TableCell>{s.fare ? `₹${s.fare}` : '-'}</TableCell></TableRow>)}
                  </TableBody>
                </Table>
              )}
            </Paper>
          ))}
          {routes.length === 0 && <Paper sx={{ p: { xs: 2, sm: 4 }, textAlign: 'center' }}><Typography color="text.secondary">No routes</Typography></Paper>}
        </Box>
      )}

      {/* TAB 4: Students */}
      {tab === 4 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setAssignForm(init(['student_id','route_id','stop_id','pickup_type','rfid_card_no'])); setOpenAssign(true); }}>Assign Student</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Student ID</TableCell><TableCell>Route</TableCell><TableCell>Stop</TableCell><TableCell>Type</TableCell><TableCell>RFID</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.student_id}</TableCell>
                    <TableCell>{s.route?.route_name || '-'}</TableCell>
                    <TableCell>{s.stop?.stop_name || '-'}</TableCell>
                    <TableCell>{s.pickup_type}</TableCell>
                    <TableCell>{s.rfid_card_no || '-'}</TableCell>
                    <TableCell><Chip size="small" label={s.status || 'active'} color={statColor(s.status || 'active')} /></TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && <TableRow><TableCell colSpan={6} align="center">No assignments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 5: GPS Tracking */}
      {tab === 5 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}><Button startIcon={<Refresh />} onClick={fetchGPS}>Refresh</Button></Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Vehicle ID</TableCell><TableCell>Latitude</TableCell><TableCell>Longitude</TableCell><TableCell>Speed (km/h)</TableCell><TableCell>Overspeed</TableCell><TableCell>Timestamp</TableCell></TableRow></TableHead>
              <TableBody>
                {gps.map(g => (
                  <TableRow key={g.id}>
                    <TableCell>{g.vehicle_id}</TableCell><TableCell>{g.latitude}</TableCell><TableCell>{g.longitude}</TableCell>
                    <TableCell>{g.speed_kmh}</TableCell>
                    <TableCell>{g.is_overspeeding ? <Chip size="small" label="YES" color="error" /> : 'No'}</TableCell>
                    <TableCell>{g.timestamp ? new Date(g.timestamp).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {gps.length === 0 && <TableRow><TableCell colSpan={6} align="center">No GPS data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 6: Maintenance */}
      {tab === 6 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setMaintForm(init(['vehicle_id','maintenance_type','description','vendor_name','cost','odometer_reading','scheduled_date','completed_date','next_due_date','status','invoice_no','notes'])); setEditMaintId(null); setOpenMaint(true); }}>Add Maintenance</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Vehicle</TableCell><TableCell>Type</TableCell><TableCell>Vendor</TableCell><TableCell>Cost</TableCell><TableCell>Scheduled</TableCell><TableCell>Completed</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {maintenance.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{m.vehicle_id}</TableCell><TableCell>{m.maintenance_type}</TableCell>
                    <TableCell>{m.vendor_name || '-'}</TableCell><TableCell>₹{m.cost || 0}</TableCell>
                    <TableCell>{m.scheduled_date || '-'}</TableCell><TableCell>{m.completed_date || '-'}</TableCell>
                    <TableCell><Chip size="small" label={m.status} color={statColor(m.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setMaintForm(m); setEditMaintId(m.id); setOpenMaint(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {maintenance.length === 0 && <TableRow><TableCell colSpan={8} align="center">No records</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 7: Fuel Logs */}
      {tab === 7 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setFuelForm(init(['vehicle_id','fill_date','fuel_type','quantity_liters','rate_per_liter','total_cost','odometer_reading','pump_name','receipt_no','filled_by','notes'])); setOpenFuel(true); }}>Add Fuel Log</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Vehicle</TableCell><TableCell>Date</TableCell><TableCell>Fuel</TableCell><TableCell>Qty (L)</TableCell><TableCell>Rate/L</TableCell><TableCell>Total</TableCell><TableCell>Odometer</TableCell><TableCell>Mileage</TableCell><TableCell>Pump</TableCell></TableRow></TableHead>
              <TableBody>
                {fuelLogs.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.vehicle_id}</TableCell><TableCell>{f.fill_date}</TableCell><TableCell>{f.fuel_type}</TableCell>
                    <TableCell>{f.quantity_liters}</TableCell><TableCell>₹{f.rate_per_liter}</TableCell><TableCell>₹{f.total_cost}</TableCell>
                    <TableCell>{f.odometer_reading || '-'}</TableCell><TableCell>{f.mileage_kmpl || '-'} kmpl</TableCell><TableCell>{f.pump_name || '-'}</TableCell>
                  </TableRow>
                ))}
                {fuelLogs.length === 0 && <TableRow><TableCell colSpan={9} align="center">No fuel logs</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 8: Transport Fees */}
      {tab === 8 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setFeeForm(init(['route_id','stop_id','academic_year','fee_type','amount','distance_based','distance_km','rate_per_km','effective_from','effective_to'])); setOpenFee(true); }}>Add Fee Structure</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Route</TableCell><TableCell>Stop</TableCell><TableCell>Year</TableCell><TableCell>Type</TableCell><TableCell>Amount</TableCell><TableCell>Distance</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {fees.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.route_id || 'All'}</TableCell><TableCell>{f.stop_id || 'All'}</TableCell>
                    <TableCell>{f.academic_year || '-'}</TableCell><TableCell>{f.fee_type}</TableCell>
                    <TableCell>₹{f.amount}</TableCell><TableCell>{f.distance_based ? `${f.distance_km} km` : 'N/A'}</TableCell>
                    <TableCell>{f.effective_from || '-'}</TableCell><TableCell>{f.effective_to || '-'}</TableCell>
                    <TableCell><Chip size="small" label={f.status} color={statColor(f.status)} /></TableCell>
                  </TableRow>
                ))}
                {fees.length === 0 && <TableRow><TableCell colSpan={9} align="center">No fee structures</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 9: SOS Alerts */}
      {tab === 9 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" color="error" startIcon={<Warning />} onClick={() => { setSOSForm(init(['vehicle_id','route_id','driver_id','alert_type','description','latitude','longitude'])); setOpenSOS(true); }}>Trigger SOS</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Type</TableCell><TableCell>Vehicle</TableCell><TableCell>Description</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {sosAlerts.map(s => (
                  <TableRow key={s.id} sx={{ bgcolor: s.status === 'active' ? '#fff3e0' : 'inherit' }}>
                    <TableCell>{s.id}</TableCell><TableCell><Chip size="small" label={s.alert_type} color="error" /></TableCell>
                    <TableCell>{s.vehicle_id || '-'}</TableCell><TableCell>{s.description || '-'}</TableCell>
                    <TableCell>{s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : '-'}</TableCell>
                    <TableCell><Chip size="small" label={s.status} color={statColor(s.status)} /></TableCell>
                    <TableCell>{s.created_at ? new Date(s.created_at).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      {s.status !== 'resolved' && <Button size="small" color="success" onClick={() => { transportAPI.updateSOSAlert(s.id, { status: 'resolved', resolution_notes: 'Resolved' }).then(() => { msg('Resolved'); fetchSOS(); }).catch(() => msg('Failed','error')); }}>Resolve</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {sosAlerts.length === 0 && <TableRow><TableCell colSpan={8} align="center">No SOS alerts</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 10: Trips */}
      {tab === 10 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setTripForm(init(['trip_name','trip_type','destination','vehicle_id','driver_id','departure_datetime','return_datetime','total_students','total_staff','estimated_cost','notes','status'])); setEditTripId(null); setOpenTrip(true); }}>Plan Trip</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Trip</TableCell><TableCell>Type</TableCell><TableCell>Destination</TableCell><TableCell>Departure</TableCell><TableCell>Return</TableCell><TableCell>Students</TableCell><TableCell>Staff</TableCell><TableCell>Cost</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {trips.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{t.trip_name}</TableCell><TableCell>{t.trip_type}</TableCell>
                    <TableCell>{t.destination}</TableCell>
                    <TableCell>{t.departure_datetime ? new Date(t.departure_datetime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{t.return_datetime ? new Date(t.return_datetime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{t.total_students}</TableCell><TableCell>{t.total_staff}</TableCell>
                    <TableCell>₹{t.estimated_cost || 0}</TableCell>
                    <TableCell><Chip size="small" label={t.status} color={statColor(t.status)} /></TableCell>
                    <TableCell><IconButton size="small" onClick={() => { setTripForm(t); setEditTripId(t.id); setOpenTrip(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {trips.length === 0 && <TableRow><TableCell colSpan={10} align="center">No trips</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 11: Route Change Requests */}
      {tab === 11 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setReqForm(init(['student_id','current_route_id','requested_route_id','current_stop_id','requested_stop_id','reason','effective_date'])); setOpenReq(true); }}>New Request</Button>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Student</TableCell><TableCell>Current Route</TableCell><TableCell>Requested Route</TableCell><TableCell>Reason</TableCell><TableCell>Effective</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {routeRequests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.id}</TableCell><TableCell>{r.student_id || '-'}</TableCell>
                    <TableCell>{r.current_route_id || '-'}</TableCell><TableCell>{r.requested_route_id || '-'}</TableCell>
                    <TableCell>{r.reason || '-'}</TableCell><TableCell>{r.effective_date || '-'}</TableCell>
                    <TableCell><Chip size="small" label={r.status} color={statColor(r.status)} /></TableCell>
                    <TableCell>
                      {r.status === 'pending' && <>
                        <Button size="small" color="success" onClick={() => { transportAPI.updateRouteRequest(r.id, { status: 'approved' }).then(() => { msg('Approved'); fetchRequests(); }).catch(() => msg('Failed','error')); }}>Approve</Button>
                        <Button size="small" color="error" onClick={() => { transportAPI.updateRouteRequest(r.id, { status: 'rejected' }).then(() => { msg('Rejected'); fetchRequests(); }).catch(() => msg('Failed','error')); }}>Reject</Button>
                      </>}
                    </TableCell>
                  </TableRow>
                ))}
                {routeRequests.length === 0 && <TableRow><TableCell colSpan={8} align="center">No requests</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 12: Speed Alerts */}
      {tab === 12 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}><Button startIcon={<Refresh />} onClick={fetchSpeed}>Refresh</Button></Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell>Vehicle</TableCell><TableCell>Speed</TableCell><TableCell>Limit</TableCell><TableCell>Excess</TableCell><TableCell>Location</TableCell><TableCell>Time</TableCell><TableCell>Acknowledged</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {speedAlerts.map(s => (
                  <TableRow key={s.id} sx={{ bgcolor: !s.acknowledged ? '#ffebee' : 'inherit' }}>
                    <TableCell>{s.vehicle_id}</TableCell>
                    <TableCell><Typography color="error" fontWeight="bold">{s.speed_kmh} km/h</Typography></TableCell>
                    <TableCell>{s.speed_limit_kmh} km/h</TableCell>
                    <TableCell>{(s.speed_kmh - s.speed_limit_kmh).toFixed(1)} km/h</TableCell>
                    <TableCell>{s.location_name || (s.latitude ? `${s.latitude}, ${s.longitude}` : '-')}</TableCell>
                    <TableCell>{s.created_at ? new Date(s.created_at).toLocaleString() : '-'}</TableCell>
                    <TableCell>{s.acknowledged ? <Chip size="small" label="Yes" color="success" /> : <Chip size="small" label="No" color="error" />}</TableCell>
                    <TableCell>
                      {!s.acknowledged && <Button size="small" startIcon={<Check />} onClick={() => { transportAPI.acknowledgeSpeedAlert(s.id).then(() => { msg('Acknowledged'); fetchSpeed(); }).catch(() => msg('Failed','error')); }}>Ack</Button>}
                    </TableCell>
                  </TableRow>
                ))}
                {speedAlerts.length === 0 && <TableRow><TableCell colSpan={8} align="center">No speed alerts</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* DIALOGS */}
      <Dialog open={openVehicle} onClose={() => setOpenVehicle(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editVehicleId ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(vehicleForm, setVehicleForm, 'Vehicle Number *', 'vehicle_number')}
            {Sel(vehicleForm, setVehicleForm, 'Vehicle Type', 'vehicle_type', ['bus','van','mini_bus','car'])}
            {F(vehicleForm, setVehicleForm, 'Make', 'make')}
            {F(vehicleForm, setVehicleForm, 'Model', 'model')}
            {F(vehicleForm, setVehicleForm, 'Year', 'year', { type: 'number' })}
            {F(vehicleForm, setVehicleForm, 'Capacity', 'capacity', { type: 'number' })}
            {Sel(vehicleForm, setVehicleForm, 'Fuel Type', 'fuel_type', ['diesel','petrol','cng','electric'])}
            {F(vehicleForm, setVehicleForm, 'Registration Date', 'registration_date', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(vehicleForm, setVehicleForm, 'Insurance Expiry', 'insurance_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(vehicleForm, setVehicleForm, 'Fitness Expiry', 'fitness_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(vehicleForm, setVehicleForm, 'Permit Expiry', 'permit_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(vehicleForm, setVehicleForm, 'Pollution Expiry', 'pollution_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(vehicleForm, setVehicleForm, 'Chassis Number', 'chassis_number')}
            {F(vehicleForm, setVehicleForm, 'Engine Number', 'engine_number')}
            {F(vehicleForm, setVehicleForm, 'GPS Device ID', 'gps_device_id')}
            {F(vehicleForm, setVehicleForm, 'Odometer', 'current_odometer', { type: 'number' })}
            {Sel(vehicleForm, setVehicleForm, 'Status', 'status', ['active','under_repair','spare','retired'])}
            {F(vehicleForm, setVehicleForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVehicle(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editVehicleId ? transportAPI.updateVehicle(editVehicleId, vehicleForm) : transportAPI.createVehicle(vehicleForm);
            fn.then(() => { msg(editVehicleId ? 'Updated' : 'Created'); setOpenVehicle(false); fetchVehicles(); }).catch(() => msg('Failed','error'));
          }}>{editVehicleId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

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
          <Button variant="contained" onClick={() => {
            const fn = editDriverId ? transportAPI.updateDriver(editDriverId, driverForm) : transportAPI.createDriver(driverForm);
            fn.then(() => { msg(editDriverId ? 'Updated' : 'Created'); setOpenDriver(false); fetchDrivers(); }).catch(() => msg('Failed','error'));
          }}>{editDriverId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRoute} onClose={() => setOpenRoute(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editRouteId ? 'Edit Route' : 'Add Route'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(routeForm, setRouteForm, 'Route Name *', 'route_name')}
            {F(routeForm, setRouteForm, 'Route Code', 'route_code')}
            {F(routeForm, setRouteForm, 'Vehicle ID', 'vehicle_id', { type: 'number' })}
            {F(routeForm, setRouteForm, 'Driver ID', 'driver_id', { type: 'number' })}
            {F(routeForm, setRouteForm, 'Helper Name', 'helper_name')}
            {F(routeForm, setRouteForm, 'Helper Phone', 'helper_phone')}
            {F(routeForm, setRouteForm, 'Start Location', 'start_location')}
            {F(routeForm, setRouteForm, 'End Location', 'end_location')}
            {F(routeForm, setRouteForm, 'Distance (km)', 'total_distance_km', { type: 'number' })}
            {F(routeForm, setRouteForm, 'Time (min)', 'estimated_time_min', { type: 'number' })}
            {Sel(routeForm, setRouteForm, 'Shift', 'shift', ['morning','afternoon','both'])}
            {Sel(routeForm, setRouteForm, 'Status', 'status', ['active','inactive'])}
            {F(routeForm, setRouteForm, 'Description', 'description', { xs: 12, multiline: true, rows: 2 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoute(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editRouteId ? transportAPI.updateRoute(editRouteId, routeForm) : transportAPI.createRoute(routeForm);
            fn.then(() => { msg(editRouteId ? 'Updated' : 'Created'); setOpenRoute(false); fetchRoutes(); }).catch(() => msg('Failed','error'));
          }}>{editRouteId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStop} onClose={() => setOpenStop(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Stop</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(stopForm, setStopForm, 'Route ID *', 'route_id', { type: 'number' })}
            {F(stopForm, setStopForm, 'Stop Name *', 'stop_name')}
            {F(stopForm, setStopForm, 'Latitude', 'latitude')}
            {F(stopForm, setStopForm, 'Longitude', 'longitude')}
            {F(stopForm, setStopForm, 'Pickup Time', 'pickup_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(stopForm, setStopForm, 'Drop Time', 'drop_time', { type: 'time', InputLabelProps: { shrink: true } })}
            {F(stopForm, setStopForm, 'Fare', 'fare', { type: 'number' })}
            {F(stopForm, setStopForm, 'Stop Order', 'stop_order', { type: 'number' })}
            {F(stopForm, setStopForm, 'Radius (m)', 'radius_meters', { type: 'number' })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStop(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            transportAPI.addStop(stopForm.route_id, stopForm).then(() => { msg('Stop added'); setOpenStop(false); fetchRoutes(); }).catch(() => msg('Failed','error'));
          }}>Add</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Student</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(assignForm, setAssignForm, 'Student ID *', 'student_id', { type: 'number' })}
            {F(assignForm, setAssignForm, 'Route ID *', 'route_id', { type: 'number' })}
            {F(assignForm, setAssignForm, 'Stop ID *', 'stop_id', { type: 'number' })}
            {Sel(assignForm, setAssignForm, 'Pickup Type', 'pickup_type', ['both','pickup_only','drop_only'])}
            {F(assignForm, setAssignForm, 'RFID Card No', 'rfid_card_no')}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            transportAPI.assign(assignForm).then(() => { msg('Assigned'); setOpenAssign(false); fetchStudents(); }).catch(() => msg('Failed','error'));
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
          <Button variant="contained" onClick={() => {
            const fn = editMaintId ? transportAPI.updateMaintenance(editMaintId, maintForm) : transportAPI.createMaintenance(maintForm);
            fn.then(() => { msg(editMaintId ? 'Updated' : 'Created'); setOpenMaint(false); fetchMaintenance(); }).catch(() => msg('Failed','error'));
          }}>{editMaintId ? 'Update' : 'Create'}</Button>
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
          <Button variant="contained" onClick={() => {
            transportAPI.createFuelLog(fuelForm).then(() => { msg('Created'); setOpenFuel(false); fetchFuel(); }).catch(() => msg('Failed','error'));
          }}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openFee} onClose={() => setOpenFee(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Fee Structure</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {F(feeForm, setFeeForm, 'Route ID', 'route_id', { type: 'number' })}
            {F(feeForm, setFeeForm, 'Stop ID', 'stop_id', { type: 'number' })}
            {F(feeForm, setFeeForm, 'Academic Year', 'academic_year')}
            {Sel(feeForm, setFeeForm, 'Fee Type', 'fee_type', ['monthly','quarterly','yearly'])}
            {F(feeForm, setFeeForm, 'Amount *', 'amount', { type: 'number' })}
            {F(feeForm, setFeeForm, 'Distance (km)', 'distance_km', { type: 'number' })}
            {F(feeForm, setFeeForm, 'Rate/km', 'rate_per_km', { type: 'number' })}
            {F(feeForm, setFeeForm, 'From', 'effective_from', { type: 'date', InputLabelProps: { shrink: true } })}
            {F(feeForm, setFeeForm, 'To', 'effective_to', { type: 'date', InputLabelProps: { shrink: true } })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFee(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            transportAPI.createFee(feeForm).then(() => { msg('Created'); setOpenFee(false); fetchFees(); }).catch(() => msg('Failed','error'));
          }}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openSOS} onClose={() => setOpenSOS(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trigger SOS Alert</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {Sel(sosForm, setSOSForm, 'Alert Type *', 'alert_type', ['panic','accident','breakdown','medical','overspeed'])}
            {F(sosForm, setSOSForm, 'Vehicle ID', 'vehicle_id', { type: 'number' })}
            {F(sosForm, setSOSForm, 'Route ID', 'route_id', { type: 'number' })}
            {F(sosForm, setSOSForm, 'Driver ID', 'driver_id', { type: 'number' })}
            {F(sosForm, setSOSForm, 'Latitude', 'latitude')}
            {F(sosForm, setSOSForm, 'Longitude', 'longitude')}
            {F(sosForm, setSOSForm, 'Description', 'description', { xs: 12, multiline: true, rows: 3 })}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSOS(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => {
            transportAPI.createSOSAlert(sosForm).then(() => { msg('SOS Triggered!'); setOpenSOS(false); fetchSOS(); }).catch(() => msg('Failed','error'));
          }}>Trigger SOS</Button>
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
          <Button variant="contained" onClick={() => {
            const fn = editTripId ? transportAPI.updateTrip(editTripId, tripForm) : transportAPI.createTrip(tripForm);
            fn.then(() => { msg(editTripId ? 'Updated' : 'Created'); setOpenTrip(false); fetchTrips(); }).catch(() => msg('Failed','error'));
          }}>{editTripId ? 'Update' : 'Create'}</Button>
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
    </Box>
  );
}
