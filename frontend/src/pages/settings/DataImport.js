import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Card, CardContent, Chip, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  CloudUpload, Download, CheckCircle, Error as ErrorIcon, Warning, Description,
  People, School, MenuBook, CalendarMonth, AttachMoney, LocalLibrary, Schedule,
  Refresh, ArrowBack, ArrowForward, UploadFile, Lock, ContentCopy, Visibility, VisibilityOff
} from '@mui/icons-material';
import { importsAPI } from '../../services/api';

const MODULE_ICONS = {
  students: <People sx={{ fontSize: 40 }} />,
  staff: <School sx={{ fontSize: 40 }} />,
  subjects: <MenuBook sx={{ fontSize: 40 }} />,
  class_subjects: <MenuBook sx={{ fontSize: 40 }} />,
  syllabus: <Description sx={{ fontSize: 40 }} />,
  fee_structure: <AttachMoney sx={{ fontSize: 40 }} />,
  library_books: <LocalLibrary sx={{ fontSize: 40 }} />,
  calendar_events: <CalendarMonth sx={{ fontSize: 40 }} />,
  timetable: <Schedule sx={{ fontSize: 40 }} />,
};

const MODULE_COLORS = {
  students: '#6366f1',
  staff: '#2e7d32',
  subjects: '#ed6c02',
  class_subjects: '#9c27b0',
  syllabus: '#0288d1',
  fee_structure: '#d32f2f',
  library_books: '#7b1fa2',
  calendar_events: '#e91e63',
  timetable: '#00897b',
};

const MODULE_GRADIENTS = {
  students: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
  staff: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
  subjects: 'linear-gradient(135deg, #ed6c02 0%, #ffa726 100%)',
  class_subjects: 'linear-gradient(135deg, #9c27b0 0%, #ce93d8 100%)',
  syllabus: 'linear-gradient(135deg, #0288d1 0%, #4fc3f7 100%)',
  fee_structure: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
  library_books: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)',
  calendar_events: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)',
  timetable: 'linear-gradient(135deg, #00897b 0%, #4db6ac 100%)',
};

const IMPORT_ORDER = [
  { key: 'subjects', step: 1, note: 'Import subjects first - other modules depend on these' },
  { key: 'staff', step: 2, note: 'Import staff/teachers before class-subject mapping & timetable' },
  { key: 'students', step: 3, note: 'Import students with parent details and class assignment' },
  { key: 'syllabus', step: 4, note: 'Import syllabus chapters per class and subject' },
  { key: 'fee_structure', step: 5, note: 'Import fee structure per class - auto creates categories' },
  { key: 'library_books', step: 6, note: 'Import library books - auto creates categories' },
  { key: 'calendar_events', step: 7, note: 'Import academic calendar - holidays, exams, PTMs' },
  { key: 'timetable', step: 8, note: 'Import timetable - needs classes, sections, subjects, staff' },
];

export default function DataImport() {
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeStep, setActiveStep] = useState(0); // 0=select, 1=upload, 2=preview, 3=done
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [showTemplates, setShowTemplates] = useState(false);
  const [templatePassword, setTemplatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const loadData = useCallback(() => {
    importsAPI.listTemplates().then(r => setTemplates(r.data.data || [])).catch(() => {});
    importsAPI.getImportStats().then(r => setStats(r.data.data)).catch(() => {});
    importsAPI.getTemplatePassword().then(r => setTemplatePassword(r.data.data?.password || '')).catch(() => {});
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const downloadTemplate = async (key) => {
    try {
      const res = await importsAPI.downloadTemplate(key);
      const url = window.URL.createObjectURL(new Blob([res.data],
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${key}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSnack(`${key} Excel template downloaded`);
    } catch {
      showSnack('Download failed', 'error');
    }
  };

  const downloadAllTemplates = async () => {
    for (const item of IMPORT_ORDER) {
      await downloadTemplate(item.key);
      // Small delay between downloads so browser doesn't block them
      await new Promise(r => setTimeout(r, 500));
    }
    showSnack('All templates downloaded!');
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      if (!f.name.endsWith('.csv') && !f.name.endsWith('.xlsx')) {
        showSnack('Only .xlsx or .csv files supported.', 'warning');
        return;
      }
      setFile(f);
      setValidationResult(null);
      setImportResult(null);
    }
  };

  const handleValidate = async () => {
    if (!file || !selectedModule) return;
    setLoading(true);
    try {
      const res = await importsAPI.validateImport(selectedModule, file);
      setValidationResult(res.data.data);
      setActiveStep(2);
    } catch (err) {
      showSnack(err.response?.data?.message || 'Validation failed', 'error');
    }
    setLoading(false);
  };

  const handleExecuteImport = async () => {
    if (!file || !selectedModule) return;
    setLoading(true);
    try {
      const res = await importsAPI.executeImport(selectedModule, file);
      setImportResult(res.data.data);
      setActiveStep(3);
      showSnack(res.data.message);
      loadData(); // Refresh stats
    } catch (err) {
      showSnack(err.response?.data?.message || 'Import failed', 'error');
    }
    setLoading(false);
  };

  const resetImport = () => {
    setSelectedModule(null);
    setActiveStep(0);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
  };

  const selectModule = (key) => {
    setSelectedModule(key);
    setActiveStep(1);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
  };

  const steps = ['Select Module', 'Upload File', 'Preview & Validate', 'Import Complete'];

  const copyPassword = () => {
    navigator.clipboard.writeText(templatePassword);
    showSnack('Password copied to clipboard!');
  };

  return (
    <Box>
      {/* Header with gradient */}
      <Paper sx={{
        p: 3, mb: 3, borderRadius: 4,
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 30%, #3949ab 60%, #5c6bc0 100%)',
        color: '#fff', position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(26,35,126,0.3)',
      }}>
        <Box sx={{
          position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <Box sx={{
          position: 'absolute', right: 60, bottom: -60, width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <Box display="flex" justifyContent="space-between" alignItems="center" position="relative">
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              📦 Data Import & Migration
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
              Bulk import data from Excel files. Perfect for migrating from another school software.
            </Typography>
          </Box>
          {activeStep > 0 && (
            <Button startIcon={<ArrowBack />} onClick={resetImport} variant="contained"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              Back to Modules
            </Button>
          )}
        </Box>
      </Paper>

      {/* Migration Progress Stats */}
      {stats && activeStep === 0 && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #e3e8ef',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <Typography variant="h6" mb={1.5} fontWeight="bold" color="#1a237e">
            📊 Current Data Summary
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Students', value: stats.students, icon: <People />, color: '#6366f1', bg: '#eef2ff' },
              { label: 'Staff', value: stats.staff, icon: <School />, color: '#2e7d32', bg: '#e8f5e9' },
              { label: 'Subjects', value: stats.subjects, icon: <MenuBook />, color: '#ed6c02', bg: '#fff3e0' },
              { label: 'Classes', value: stats.classes, icon: <School />, color: '#9c27b0', bg: '#f3e5f5' },
              { label: 'Syllabus', value: stats.syllabus_chapters, icon: <Description />, color: '#0288d1', bg: '#e1f5fe' },
              { label: 'Fee Structures', value: stats.fee_structures, icon: <AttachMoney />, color: '#d32f2f', bg: '#ffebee' },
              { label: 'Library Books', value: stats.library_books, icon: <LocalLibrary />, color: '#7b1fa2', bg: '#f3e5f5' },
              { label: 'Calendar', value: stats.calendar_events, icon: <CalendarMonth />, color: '#e91e63', bg: '#fce4ec' },
            ].map((s, i) => (
              <Grid item xs={6} sm={3} md={1.5} key={i}>
                <Box textAlign="center" sx={{
                  p: 1.5, borderRadius: 2, bgcolor: s.bg,
                  border: `1px solid ${s.color}22`, transition: '0.3s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${s.color}22` }
                }}>
                  <Box sx={{ color: s.color, mb: 0.5 }}>{s.icon}</Box>
                  <Typography variant="h5" fontWeight="bold" color={s.color}>{s.value}</Typography>
                  <Typography variant="caption" color="textSecondary" fontWeight="500">{s.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
        <Stepper activeStep={activeStep} sx={{
          '& .MuiStepLabel-root .Mui-completed': { color: '#2e7d32' },
          '& .MuiStepLabel-root .Mui-active': { color: '#1565c0' },
          '& .MuiStepConnector-line': { borderTopWidth: 3 },
          '& .Mui-completed .MuiStepConnector-line': { borderColor: '#2e7d32' },
          '& .Mui-active .MuiStepConnector-line': { borderColor: '#1565c0' },
        }}>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step 0: Select Module */}
      {activeStep === 0 && (
        <Box>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, border: '1px solid #90caf9',
            '& .MuiAlert-icon': { color: '#1565c0' } }}>
            <strong>Recommended Import Order:</strong> Subjects &rarr; Staff &rarr; Students &rarr; Syllabus &rarr; Fee Structure &rarr; Library Books &rarr; Calendar Events &rarr; Timetable.
            This ensures all dependencies are met.
          </Alert>

          {/* ===== Excel Templates Download Section ===== */}
          <Paper sx={{
            p: 2.5, mb: 3, borderRadius: 3,
            border: '2px solid #e8eaf6',
            background: 'linear-gradient(135deg, #fafbff 0%, #f5f6ff 100%)',
            boxShadow: '0 2px 16px rgba(26,35,126,0.08)',
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="#1a237e">
                  📑 Excel Templates
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Download password-protected Excel templates, fill data, then upload.
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button variant="outlined" size="small" onClick={() => setShowTemplates(!showTemplates)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}>
                  {showTemplates ? 'Hide Details' : 'Show Column Details'}
                </Button>
                <Button variant="contained" startIcon={<Download />} onClick={downloadAllTemplates}
                  sx={{
                    borderRadius: 2, textTransform: 'none',
                    background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                    boxShadow: '0 3px 10px rgba(26,35,126,0.3)',
                    '&:hover': { boxShadow: '0 5px 15px rgba(26,35,126,0.4)' },
                  }}>
                  Download All Templates
                </Button>
              </Box>
            </Box>

            {/* Password info */}
            {templatePassword && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 2,
                bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffe082',
              }}>
                <Lock sx={{ color: '#f57f17' }} />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="bold" color="#e65100">
                    🔐 Excel files are password protected. Use this password to open:
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Box sx={{
                      fontFamily: 'monospace', bgcolor: '#fff', px: 2, py: 0.5, borderRadius: 1,
                      border: '1px solid #ffe082', letterSpacing: 1, fontWeight: 'bold', fontSize: 14,
                    }}>
                      {showPassword ? templatePassword : '••••••••••••'}
                    </Box>
                    <Tooltip title={showPassword ? 'Hide' : 'Show'}>
                      <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy Password">
                      <IconButton size="small" onClick={copyPassword}
                        sx={{ color: '#e65100' }}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Quick download row for all templates */}
            <Box display="flex" gap={1} flexWrap="wrap">
              {IMPORT_ORDER.map((item) => {
                const tmpl = templates.find(t => t.key === item.key);
                return (
                  <Chip
                    key={item.key}
                    icon={<Download />}
                    label={`${item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}${tmpl ? ` (${tmpl.columns} cols)` : ''}`}
                    onClick={() => downloadTemplate(item.key)}
                    sx={{
                      background: MODULE_GRADIENTS[item.key], color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                      border: 'none', boxShadow: `0 2px 6px ${MODULE_COLORS[item.key]}44`,
                      '& .MuiChip-icon': { color: '#fff' },
                      '&:hover': { opacity: 0.9, transform: 'translateY(-1px)', boxShadow: `0 4px 10px ${MODULE_COLORS[item.key]}55` },
                      transition: '0.2s',
                    }}
                  />
                );
              })}
            </Box>

            {/* Detailed template columns */}
            {showTemplates && templates.length > 0 && (
              <Box mt={2}>
                <Divider sx={{ mb: 2 }} />
                <TableContainer sx={{ maxHeight: 500, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: 140, bgcolor: '#e8eaf6', color: '#1a237e' }}>Template</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e8eaf6', color: '#1a237e' }}>Columns</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: 250, bgcolor: '#e8eaf6', color: '#1a237e' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', width: 120, textAlign: 'center', bgcolor: '#e8eaf6', color: '#1a237e' }}>Download</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {templates.map(tmpl => (
                        <TableRow key={tmpl.key} hover sx={{ '&:hover': { bgcolor: '#f5f6ff' } }}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box sx={{
                                color: '#fff', display: 'flex', p: 0.8, borderRadius: 1.5,
                                background: MODULE_GRADIENTS[tmpl.key],
                                boxShadow: `0 2px 6px ${MODULE_COLORS[tmpl.key]}33`,
                              }}>
                                {React.cloneElement(MODULE_ICONS[tmpl.key] || <Description sx={{ fontSize: 40 }} />, { sx: { fontSize: 20 } })}
                              </Box>
                              <Box>
                                <Typography fontWeight="bold" fontSize={13}>{tmpl.name}</Typography>
                                <Typography variant="caption" color="textSecondary">{tmpl.columns} columns</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {tmpl.headers.map(h => (
                                <Chip key={h} label={h} size="small" variant="outlined"
                                  sx={{ fontSize: 11, height: 22, borderColor: MODULE_COLORS[tmpl.key] || '#999',
                                    color: MODULE_COLORS[tmpl.key], fontWeight: 500 }} />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontSize={12}>{tmpl.description}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button size="small" variant="contained" startIcon={<Download />}
                              sx={{
                                background: MODULE_GRADIENTS[tmpl.key], borderRadius: 2,
                                textTransform: 'none', fontSize: 12,
                                boxShadow: `0 2px 6px ${MODULE_COLORS[tmpl.key]}33`,
                              }}
                              onClick={() => downloadTemplate(tmpl.key)}>
                              Excel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>

          {/* ===== Module Cards for Import ===== */}
          <Typography variant="h6" fontWeight="bold" mb={1.5} color="#1a237e">
            🚀 Select Module to Import
          </Typography>

          <Grid container spacing={2}>
            {IMPORT_ORDER.map((item) => {
              const tmpl = templates.find(t => t.key === item.key);
              return (
                <Grid item xs={12} sm={6} md={4} key={item.key}>
                  <Card sx={{
                    cursor: 'pointer', transition: '0.3s', borderRadius: 3, overflow: 'hidden',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 8px 25px ${MODULE_COLORS[item.key]}33` },
                    border: selectedModule === item.key
                      ? `2px solid ${MODULE_COLORS[item.key]}`
                      : '1px solid #e8eaf6',
                  }} onClick={() => selectModule(item.key)}>
                    {/* Colored top bar */}
                    <Box sx={{ height: 5, background: MODULE_GRADIENTS[item.key] }} />
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                        <Box sx={{
                          color: '#fff', p: 1.5, borderRadius: 2,
                          background: MODULE_GRADIENTS[item.key],
                          boxShadow: `0 4px 12px ${MODULE_COLORS[item.key]}44`,
                        }}>
                          {MODULE_ICONS[item.key]}
                        </Box>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 16 }}>
                            {item.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </Typography>
                          <Chip label={`Step ${item.step}`} size="small" sx={{
                            background: MODULE_GRADIENTS[item.key], color: '#fff',
                            fontWeight: 'bold', fontSize: 11, height: 22,
                          }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary" mb={1.5} sx={{ lineHeight: 1.5 }}>
                        {item.note}
                      </Typography>
                      {tmpl && (
                        <Box display="flex" justifyContent="space-between" alignItems="center"
                          sx={{ pt: 1.5, borderTop: '1px solid #f0f0f0' }}>
                          <Typography variant="caption" color="textSecondary" fontWeight="500">
                            {tmpl.columns} columns
                          </Typography>
                          <Button size="small" startIcon={<Download />}
                            sx={{ textTransform: 'none', color: MODULE_COLORS[item.key], fontWeight: 'bold' }}
                            onClick={(e) => { e.stopPropagation(); downloadTemplate(item.key); }}>
                            Template
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Step 1: Upload File */}
      {activeStep === 1 && selectedModule && (
        <Box>
          <Paper sx={{ p: 3, mb: 2, borderRadius: 3, border: `2px solid ${MODULE_COLORS[selectedModule]}22`,
            background: `linear-gradient(135deg, #fafbff 0%, ${MODULE_COLORS[selectedModule]}08 100%)` }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box sx={{
                color: '#fff', p: 1, borderRadius: 2,
                background: MODULE_GRADIENTS[selectedModule],
              }}>
                {MODULE_ICONS[selectedModule]}
              </Box>
              <Typography variant="h6" fontWeight="bold" color={MODULE_COLORS[selectedModule]}>
                Upload {selectedModule.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Data
              </Typography>
            </Box>

            {/* Instructions */}
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2, border: '1px solid #90caf9' }}>
              <strong>Instructions:</strong>
              <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>Download the Excel template using the button below</li>
                <li>Open with the password (shown on previous page)</li>
                <li>Fill in your data starting from row 5 (row 4 is a sample)</li>
                <li>Save and upload the .xlsx file here</li>
                <li>Review the preview and fix any errors</li>
                <li>Click "Import" to bring in the data</li>
              </ol>
            </Alert>

            {/* Template Headers */}
            {(() => {
              const tmpl = templates.find(t => t.key === selectedModule);
              if (!tmpl) return null;
              return (
                <Box mb={2} sx={{ p: 2, bgcolor: '#f5f6ff', borderRadius: 2, border: '1px solid #e8eaf6' }}>
                  <Typography variant="subtitle2" mb={0.5} color="#1a237e" fontWeight="bold">
                    Expected Columns ({tmpl.columns}):
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {tmpl.headers.map(h => (
                      <Chip key={h} label={h} size="small" variant="outlined"
                        sx={{ borderColor: MODULE_COLORS[selectedModule], color: MODULE_COLORS[selectedModule], fontWeight: 500 }} />
                    ))}
                  </Box>
                </Box>
              );
            })()}

            <Box display="flex" gap={2} mb={3}>
              <Button variant="outlined" startIcon={<Download />} onClick={() => downloadTemplate(selectedModule)}
                sx={{ borderRadius: 2, borderColor: MODULE_COLORS[selectedModule], color: MODULE_COLORS[selectedModule],
                  '&:hover': { borderColor: MODULE_COLORS[selectedModule], bgcolor: `${MODULE_COLORS[selectedModule]}08` } }}>
                Download Template
              </Button>
            </Box>

            {/* Upload Area */}
            <Box sx={{
              border: file ? `2px solid ${MODULE_COLORS[selectedModule]}` : '2px dashed #bbb',
              borderRadius: 3, p: 4, textAlign: 'center',
              background: file
                ? `linear-gradient(135deg, ${MODULE_COLORS[selectedModule]}08 0%, ${MODULE_COLORS[selectedModule]}15 100%)`
                : 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
              cursor: 'pointer', transition: '0.3s',
              '&:hover': {
                borderColor: MODULE_COLORS[selectedModule],
                background: `linear-gradient(135deg, ${MODULE_COLORS[selectedModule]}05 0%, ${MODULE_COLORS[selectedModule]}10 100%)`,
                transform: 'translateY(-2px)', boxShadow: `0 4px 15px ${MODULE_COLORS[selectedModule]}22`,
              }
            }} onClick={() => document.getElementById('file-upload').click()}>
              <input id="file-upload" type="file" accept=".csv,.xlsx" hidden onChange={handleFileSelect} />
              <CloudUpload sx={{ fontSize: 56, color: file ? MODULE_COLORS[selectedModule] : '#999', mb: 1 }} />
              {file ? (
                <Box>
                  <Typography fontWeight="bold" color={MODULE_COLORS[selectedModule]} fontSize={16}>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {(file.size / 1024).toFixed(1)} KB — Click to change file
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography fontWeight="bold" fontSize={16}>Click to upload Excel or CSV file</Typography>
                  <Typography variant="body2" color="textSecondary">
                    .xlsx or .csv files supported (max 10MB)
                  </Typography>
                </Box>
              )}
            </Box>

            {file && (
              <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={() => { setFile(null); }}
                  sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Clear
                </Button>
                <Button variant="contained" onClick={handleValidate} disabled={loading}
                  startIcon={loading ? null : <CheckCircle />}
                  sx={{
                    borderRadius: 2, textTransform: 'none',
                    background: MODULE_GRADIENTS[selectedModule],
                    boxShadow: `0 3px 10px ${MODULE_COLORS[selectedModule]}33`,
                  }}>
                  {loading ? 'Validating...' : 'Validate & Preview'}
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Step 2: Preview & Validate */}
      {activeStep === 2 && validationResult && (
        <Box>
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2, height: 6 }} />}

          {/* Summary Cards */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={4}>
              <Card sx={{
                borderRadius: 3, border: '1px solid #90caf9', overflow: 'hidden',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="#1565c0">{validationResult.total_rows}</Typography>
                  <Typography variant="body2" fontWeight="500" color="#1565c0">Total Rows</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card sx={{
                borderRadius: 3, border: '1px solid #81c784', overflow: 'hidden',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold" color="#2e7d32">{validationResult.valid_rows}</Typography>
                  <Typography variant="body2" fontWeight="500" color="#2e7d32">Valid (Ready)</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Card sx={{
                borderRadius: 3, overflow: 'hidden',
                border: validationResult.error_rows > 0 ? '1px solid #ef9a9a' : '1px solid #81c784',
                background: validationResult.error_rows > 0
                  ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)'
                  : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              }}>
                <CardContent sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="h3" fontWeight="bold"
                    color={validationResult.error_rows > 0 ? '#c62828' : '#2e7d32'}>
                    {validationResult.error_rows}
                  </Typography>
                  <Typography variant="body2" fontWeight="500"
                    color={validationResult.error_rows > 0 ? '#c62828' : '#2e7d32'}>
                    Errors (Skipped)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Missing Headers Warning */}
          {validationResult.missing_headers?.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, border: '1px solid #ffb74d' }}>
              <strong>Missing columns:</strong> {validationResult.missing_headers.join(', ')}. These fields will be empty.
            </Alert>
          )}

          {/* Errors Table */}
          {validationResult.errors?.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #ef9a9a',
              background: 'linear-gradient(135deg, #fff 0%, #fff5f5 100%)' }}>
              <Typography variant="h6" color="#c62828" mb={1} fontWeight="bold">
                <ErrorIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Errors ({validationResult.error_rows} rows will be skipped)
              </Typography>
              <TableContainer sx={{ maxHeight: 300, borderRadius: 2, border: '1px solid #ffcdd2' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#ffebee', color: '#c62828' }}>Row #</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#ffebee', color: '#c62828' }}>Errors</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: '#ffebee', color: '#c62828' }}>Data Preview</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationResult.errors.map((err, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: '#fff5f5' } }}>
                        <TableCell><strong>{err.row}</strong></TableCell>
                        <TableCell>
                          {err.errors.map((e, j) => (
                            <Chip key={j} label={e} size="small" color="error" variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, fontWeight: 500 }} />
                          ))}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <Typography variant="caption" noWrap>
                            {Object.entries(err.data || {}).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Valid Data Preview */}
          {validationResult.preview?.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #81c784',
              background: 'linear-gradient(135deg, #fff 0%, #f5fff5 100%)' }}>
              <Typography variant="h6" color="#2e7d32" mb={1} fontWeight="bold">
                <CheckCircle sx={{ verticalAlign: 'middle', mr: 1 }} />
                Valid Data Preview (first 20 rows)
              </Typography>
              <TableContainer sx={{ maxHeight: 400, borderRadius: 2, border: '1px solid #c8e6c9' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {Object.keys(validationResult.preview[0]).map(h => (
                        <TableCell key={h} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap',
                          bgcolor: '#e8f5e9', color: '#1b5e20' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationResult.preview.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f5fff5' } }}>
                        {Object.values(row).map((v, j) => (
                          <TableCell key={j} sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Import Actions */}
          <Box display="flex" justifyContent="space-between">
            <Button variant="outlined" onClick={() => { setActiveStep(1); setValidationResult(null); }}
              startIcon={<ArrowBack />} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Back to Upload
            </Button>
            <Box display="flex" gap={2}>
              {validationResult.valid_rows > 0 ? (
                <Button variant="contained" size="large" onClick={handleExecuteImport}
                  disabled={loading} startIcon={<UploadFile />}
                  sx={{
                    borderRadius: 2, textTransform: 'none', px: 4,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
                    boxShadow: '0 4px 15px rgba(46,125,50,0.35)',
                    '&:hover': { boxShadow: '0 6px 20px rgba(46,125,50,0.45)' },
                  }}>
                  {loading ? 'Importing...' : `Import ${validationResult.valid_rows} Records`}
                </Button>
              ) : (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  No valid rows to import. Fix the errors in your file and re-upload.
                </Alert>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* Step 3: Import Complete */}
      {activeStep === 3 && importResult && (
        <Box textAlign="center" py={4}>
          <Box sx={{
            width: 100, height: 100, borderRadius: '50%', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(46,125,50,0.35)',
          }}>
            <CheckCircle sx={{ fontSize: 60, color: '#fff' }} />
          </Box>
          <Typography variant="h4" fontWeight="bold" mb={1} color="#1a237e">
            Import Successful!
          </Typography>

          <Grid container spacing={2} justifyContent="center" mb={3} maxWidth={600} mx="auto">
            <Grid item xs={12} sm={4}>
              <Paper sx={{
                p: 2.5, borderRadius: 3, border: '1px solid #81c784',
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              }}>
                <Typography variant="h3" fontWeight="bold" color="#2e7d32">{importResult.imported}</Typography>
                <Typography variant="body2" fontWeight="500" color="#2e7d32">Imported</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Paper sx={{
                p: 2.5, borderRadius: 3, border: '1px solid #ffb74d',
                background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              }}>
                <Typography variant="h3" fontWeight="bold" color="#e65100">{importResult.skipped}</Typography>
                <Typography variant="body2" fontWeight="500" color="#e65100">Skipped</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Paper sx={{
                p: 2.5, borderRadius: 3, border: '1px solid #90caf9',
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              }}>
                <Typography variant="h3" fontWeight="bold" color="#1565c0">{importResult.total}</Typography>
                <Typography variant="body2" fontWeight="500" color="#1565c0">Total</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Box display="flex" gap={2} justifyContent="center">
            <Button variant="contained" onClick={resetImport} startIcon={<Refresh />}
              sx={{
                borderRadius: 2, textTransform: 'none', px: 4, py: 1.5,
                background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
                boxShadow: '0 4px 15px rgba(26,35,126,0.3)',
              }}>
              Import More Data
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
