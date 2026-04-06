import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Snackbar, Alert, TablePagination,
  Card, CardContent, IconButton, Tooltip, InputAdornment, CircularProgress, LinearProgress,
  Stepper, Step, StepLabel
} from '@mui/material';
import {
  Add, Book, Edit, Delete, LibraryBooks, MenuBook, Receipt,
  BookmarkAdd, MonetizationOn, CloudDownload, Newspaper,
  History, AccountBalance, Dashboard as DashIcon, Undo,
  Search, QrCodeScanner, ContentCopy, CloudUpload, FileDownload,
  CheckCircle, Error as ErrorIcon
} from '@mui/icons-material';
import { libraryAPI } from '../../services/api';

const ex = d => d?.data?.data?.items || d?.data?.data || d?.data?.items || [];
const tot = d => d?.data?.data?.total || d?.data?.data?.length || 0;

const init = (fields) => fields.reduce((a, f) => ({ ...a, [f]: '' }), {});

const F = (form, setForm, field, label, opts = {}) => (
  <Grid item xs={opts.xs || 12} sm={opts.sm || 6}>
    <TextField fullWidth label={label} value={form[field] || ''}
      onChange={e => setForm({ ...form, [field]: e.target.value })}
      type={opts.type || 'text'} multiline={opts.multi || false}
      rows={opts.rows || 1} InputLabelProps={opts.type === 'date' ? { shrink: true } : undefined}
      size="small" />
  </Grid>
);

const Sel = (form, setForm, field, label, options, opts = {}) => (
  <Grid item xs={opts.xs || 12} sm={opts.sm || 6}>
    <FormControl fullWidth size="small">
      <InputLabel>{label}</InputLabel>
      <Select value={form[field] || ''} label={label} onChange={e => setForm({ ...form, [field]: e.target.value })}>
        {options.map(o => <MenuItem key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</MenuItem>)}
      </Select>
    </FormControl>
  </Grid>
);

const sc = (s) => {
  const m = { new:'info', good:'success', fair:'warning', poor:'error', damaged:'error', lost:'default',
    issued:'warning', returned:'success', overdue:'error', pending:'warning', fulfilled:'success',
    cancelled:'default', expired:'error', paid:'success', waived:'info', active:'success',
    reading:'info', completed:'success', abandoned:'error', planned:'info', approved:'success',
    in_progress:'warning', ebook:'primary', pdf:'secondary', journal:'info', article:'default', video:'error',
    magazine:'info', newspaper:'default', all:'success', students:'info', staff:'warning', restricted:'error' };
  return m[s] || 'default';
};

export default function Library() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [cats, setCats] = useState([]);
  const [books, setBooks] = useState([]);
  const [dash, setDash] = useState({});
  const [dlg, setDlg] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [search, setSearch] = useState('');
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [bulkDlg, setBulkDlg] = useState(false);
  const [bulkStep, setBulkStep] = useState(0);
  const [bulkData, setBulkData] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const fileRef = useRef(null);

  const msg = (message, severity = 'success') => setSnack({ open: true, message, severity });

  // ISBN Auto-fill — fetches book details from Google Books
  const lookupISBN = async () => {
    const isbn = (form.isbn || '').trim().replace(/-/g, '');
    if (!isbn) { msg('Enter an ISBN first', 'warning'); return; }
    setIsbnLoading(true);
    try {
      const res = await libraryAPI.isbnLookup(isbn);
      const d = res.data?.data;
      if (d) {
        setForm(prev => ({
          ...prev,
          title: d.title || prev.title,
          author: d.author || prev.author,
          publisher: d.publisher || prev.publisher,
          publication_year: d.publication_year || prev.publication_year,
          pages: d.pages || prev.pages,
          language: d.language || prev.language,
          subject: d.subject || prev.subject,
          isbn: d.isbn || prev.isbn,
        }));
        msg('Book details fetched from ISBN!');
      }
    } catch (err) {
      msg(err.response?.data?.message || 'ISBN not found', 'error');
    }
    setIsbnLoading(false);
  };

  // Duplicate book — prefill form with existing book data
  const duplicateBook = (book) => {
    setEdit(null);
    setForm({
      title: book.title || '', author: book.author || '', isbn: '',
      category_id: book.category?.id || '', publisher: book.publisher || '',
      edition: book.edition || '', language: book.language || 'English',
      subject: book.subject || '', publication_year: book.publication_year || '',
      pages: book.pages || '', total_copies: 1, rack_no: book.rack_no || '',
      price: book.price || '', condition: book.condition || 'new'
    });
    setDlg(true);
  };

  // CSV/Excel parsing
  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
    const fieldMap = {
      'title': 'title', 'book_title': 'title', 'booktitle': 'title', 'name': 'title',
      'author': 'author', 'authors': 'author', 'writer': 'author',
      'isbn': 'isbn', 'isbn13': 'isbn', 'isbn10': 'isbn',
      'publisher': 'publisher', 'publication': 'publisher',
      'edition': 'edition', 'language': 'language', 'lang': 'language',
      'subject': 'subject', 'category': 'subject', 'genre': 'subject',
      'year': 'publication_year', 'publication_year': 'publication_year', 'pub_year': 'publication_year',
      'pages': 'pages', 'page_count': 'pages',
      'copies': 'total_copies', 'total_copies': 'total_copies', 'qty': 'total_copies', 'quantity': 'total_copies',
      'rack': 'rack_no', 'rack_no': 'rack_no', 'shelf': 'rack_no', 'location': 'rack_no',
      'price': 'price', 'cost': 'price', 'mrp': 'price',
      'condition': 'condition',
    };
    const mappedHeaders = headers.map(h => fieldMap[h] || h);

    return lines.slice(1).map((line, idx) => {
      // Handle quoted CSV fields
      const vals = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      vals.push(current.trim());

      const obj = { _row: idx + 2 };
      mappedHeaders.forEach((h, i) => { if (vals[i]) obj[h] = vals[i]; });
      return obj;
    }).filter(o => o.title);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        msg('No valid books found in file. Make sure first row has headers with "title" column.', 'error');
        return;
      }
      setBulkData(parsed);
      setBulkStep(1);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeBulkImport = async () => {
    setBulkLoading(true);
    try {
      const res = await libraryAPI.bulkImportBooks({
        books: bulkData,
        category_id: bulkCategoryId || undefined,
        condition: 'new'
      });
      setBulkResult(res.data?.data || {});
      setBulkStep(2);
      msg(`${res.data?.data?.added || 0} books imported!`);
      load(); loadBooks();
    } catch (err) {
      msg(err.response?.data?.message || 'Bulk import failed', 'error');
    }
    setBulkLoading(false);
  };

  const closeBulk = () => {
    setBulkDlg(false); setBulkStep(0); setBulkData([]); setBulkResult(null); setBulkCategoryId('');
  };

  const downloadTemplate = () => {
    const csv = 'title,author,isbn,publisher,edition,language,subject,publication_year,pages,total_copies,rack_no,price,condition\n"Example Book","Author Name","9781234567890","Publisher","1st","English","Science","2024","250","2","A-1","450","new"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'library_books_template.csv';
    a.click();
  };

  const loadCats = useCallback(() => {
    libraryAPI.listCategories().then(r => setCats(r.data?.data || [])).catch(() => {});
  }, []);

  const loadBooks = useCallback(() => {
    libraryAPI.listBooks({ per_page: 500 }).then(r => {
      const items = r.data?.data?.items || r.data?.data || [];
      setBooks(items);
    }).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const p = { page: page + 1, per_page: 20 };
    if (tab === 2 && search) p.search = search;
    const handlers = [
      () => libraryAPI.getDashboard().then(r => setDash(r.data?.data || {})),
      () => libraryAPI.listCategories().then(r => { setData(r.data?.data || []); setTotal(r.data?.data?.length || 0); }),
      () => libraryAPI.listBooks(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listCopies(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listIssues(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listReservations(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listFines(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listEbooks(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listPeriodicals(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listReadingHistory(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
      () => libraryAPI.listBudget(p).then(r => { setData(ex(r)); setTotal(tot(r)); }),
    ];
    handlers[tab]?.();
  }, [tab, page, search]);

  useEffect(() => { loadCats(); loadBooks(); }, [loadCats, loadBooks]);
  useEffect(() => { load(); }, [load]);

  const openAdd = (defaults = {}) => { setEdit(null); setForm(defaults); setDlg(true); };
  const openEdit = (item) => { setEdit(item); setForm({ ...item }); setDlg(true); };
  const close = () => { setDlg(false); setEdit(null); setForm({}); };

  const save = async () => {
    try {
      const api = [
        null,
        () => edit ? libraryAPI.updateCategory(edit.id, form) : libraryAPI.createCategory(form),
        () => edit ? libraryAPI.updateBook(edit.id, form) : libraryAPI.createBook(form),
        () => edit ? libraryAPI.updateCopy(edit.id, form) : libraryAPI.createCopy(form),
        () => edit ? null : libraryAPI.issueBook(form),
        () => edit ? libraryAPI.updateReservation(edit.id, form) : libraryAPI.createReservation(form),
        () => edit ? libraryAPI.updateFine(edit.id, form) : libraryAPI.createFine(form),
        () => edit ? libraryAPI.updateEbook(edit.id, form) : libraryAPI.createEbook(form),
        () => edit ? libraryAPI.updatePeriodical(edit.id, form) : libraryAPI.createPeriodical(form),
        () => edit ? libraryAPI.updateReadingHistory(edit.id, form) : libraryAPI.createReadingHistory(form),
        () => edit ? libraryAPI.updateBudget(edit.id, form) : libraryAPI.createBudget(form),
      ];
      await api[tab]?.();
      msg(edit ? 'Updated successfully' : 'Created successfully');
      close(); load(); loadCats(); loadBooks();
    } catch { msg('Operation failed', 'error'); }
  };

  const handleDelete = async (id) => {
    try {
      const apis = [null,
        libraryAPI.deleteCategory, libraryAPI.deleteBook, libraryAPI.deleteCopy,
        null, libraryAPI.deleteReservation, null,
        libraryAPI.deleteEbook, libraryAPI.deletePeriodical,
        libraryAPI.deleteReadingHistory, libraryAPI.deleteBudget
      ];
      if (apis[tab]) { await apis[tab](id); msg('Deleted'); load(); }
    } catch { msg('Delete failed', 'error'); }
  };

  const returnBook = async (id) => {
    try { await libraryAPI.returnBook(id); msg('Book returned'); load(); }
    catch { msg('Return failed', 'error'); }
  };

  const statCards = [
    { label: 'Total Books', value: dash.total_books, icon: <MenuBook />, color: '#6366f1' },
    { label: 'Total Copies', value: dash.total_copies, icon: <LibraryBooks />, color: '#0288d1' },
    { label: 'Issued', value: dash.issued, icon: <Receipt />, color: '#f57c00' },
    { label: 'Overdue', value: dash.overdue, icon: <Book />, color: '#d32f2f' },
    { label: 'Returned', value: dash.returned, icon: <Undo />, color: '#388e3c' },
    { label: 'Reservations', value: dash.reservations, icon: <BookmarkAdd />, color: '#7b1fa2' },
    { label: 'Pending Fines', value: `₹${dash.pending_fines || 0}`, icon: <MonetizationOn />, color: '#e64a19' },
    { label: 'E-Resources', value: dash.ebooks, icon: <CloudDownload />, color: '#00796b' },
    { label: 'Periodicals', value: dash.periodicals, icon: <Newspaper />, color: '#5d4037' },
    { label: 'Categories', value: dash.categories, icon: <DashIcon />, color: '#455a64' },
    { label: 'Lost Books', value: dash.lost, icon: <Delete />, color: '#c62828' },
    { label: 'Budget', value: `₹${dash.budget_allocated || 0}`, icon: <AccountBalance />, color: '#1565c0' },
  ];

  const tabLabels = ['Dashboard','Categories','Books','Copies','Issues','Reservations','Fines','E-Resources','Periodicals','Reading History','Budget'];

  const renderDashboard = () => (
    <Grid container spacing={2}>
      {statCards.map((s, i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <Card sx={{ borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${s.color}22` } }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" fontWeight="bold" color={s.color}>{s.value ?? 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderCategories = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ name: '', description: '' })}>Add Category</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Description</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {(Array.isArray(data) ? data : []).map(c => (
              <TableRow key={c.id}>
                <TableCell><strong>{c.name}</strong></TableCell>
                <TableCell>{c.description || '-'}</TableCell>
                <TableCell><Chip label={c.is_active !== false ? 'Active' : 'Inactive'} size="small" color={c.is_active !== false ? 'success':'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.length === 0) && <TableRow><TableCell colSpan={4} align="center">No categories</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderBooks = () => (
    <Box>
      <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
        <TextField size="small" placeholder="Search by title, author, ISBN..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: { xs: '100%', sm: 280 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
          }} />
        <Box flex={1} />
        <Button variant="outlined" startIcon={<CloudUpload />} onClick={() => setBulkDlg(true)}>
          Bulk Import
        </Button>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ title:'', author:'', isbn:'', category_id:'', total_copies:1, publisher:'', edition:'', language:'English', subject:'', publication_year:'', pages:'', rack_no:'', price:'', condition:'new' })}>Add Book</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Author</TableCell><TableCell>ISBN</TableCell><TableCell>Category</TableCell><TableCell>Copies</TableCell><TableCell>Available</TableCell><TableCell>Rack</TableCell><TableCell>Condition</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(b => (
              <TableRow key={b.id}>
                <TableCell><strong>{b.title}</strong></TableCell>
                <TableCell>{b.author || '-'}</TableCell>
                <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{b.isbn || '-'}</Typography></TableCell>
                <TableCell>{b.category_name || b.category?.name || '-'}</TableCell>
                <TableCell>{b.total_copies}</TableCell>
                <TableCell><Chip label={b.available_copies ?? 0} size="small" color={b.available_copies > 0 ? 'success':'error'} /></TableCell>
                <TableCell>{b.rack_no || '-'}</TableCell>
                <TableCell><Chip label={b.condition || 'new'} size="small" color={sc(b.condition)} /></TableCell>
                <TableCell>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(b)}><Edit fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Duplicate"><IconButton size="small" color="info" onClick={() => duplicateBook(b)}><ContentCopy fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(b.id)}><Delete fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={9} align="center">No books</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderCopies = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ book_id:'', accession_no:'', barcode:'', condition:'new', location:'', notes:'' })}>Add Copy</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Accession No</TableCell><TableCell>Book</TableCell><TableCell>Barcode</TableCell><TableCell>Condition</TableCell><TableCell>Location</TableCell><TableCell>Available</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(c => (
              <TableRow key={c.id}>
                <TableCell><strong>{c.accession_no}</strong></TableCell>
                <TableCell>{c.book_title || '-'}</TableCell>
                <TableCell>{c.barcode || '-'}</TableCell>
                <TableCell><Chip label={c.condition} size="small" color={sc(c.condition)} /></TableCell>
                <TableCell>{c.location || '-'}</TableCell>
                <TableCell><Chip label={c.is_available ? 'Yes' : 'No'} size="small" color={c.is_available ? 'success':'error'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No copies</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderIssues = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Book />} onClick={() => openAdd({ book_id:'', issued_to:'', issued_to_type:'student', due_date:'', notes:'' })}>Issue Book</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Book</TableCell><TableCell>Issued To</TableCell><TableCell>Type</TableCell><TableCell>Issue Date</TableCell><TableCell>Due Date</TableCell><TableCell>Return Date</TableCell><TableCell>Status</TableCell><TableCell>Fine</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(i => (
              <TableRow key={i.id}>
                <TableCell><strong>{i.book_title || i.book?.title || '-'}</strong></TableCell>
                <TableCell>{i.issued_to}</TableCell>
                <TableCell>{i.issued_to_type}</TableCell>
                <TableCell>{i.issue_date || '-'}</TableCell>
                <TableCell>{i.due_date || '-'}</TableCell>
                <TableCell>{i.return_date || '-'}</TableCell>
                <TableCell><Chip label={i.status} size="small" color={sc(i.status)} /></TableCell>
                <TableCell>{i.fine_amount ? `₹${i.fine_amount}` : '-'}</TableCell>
                <TableCell>
                  {i.status === 'issued' && <Tooltip title="Return"><IconButton size="small" color="primary" onClick={() => returnBook(i.id)}><Undo fontSize="small" /></IconButton></Tooltip>}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={9} align="center">No issues</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderReservations = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ book_id:'', reserved_by:'', reserved_by_type:'student', expiry_date:'', notes:'' })}>Add Reservation</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Book</TableCell><TableCell>Reserved By</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell><TableCell>Expiry</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(r => (
              <TableRow key={r.id}>
                <TableCell><strong>{r.book_title || '-'}</strong></TableCell>
                <TableCell>{r.reserved_by}</TableCell>
                <TableCell>{r.reserved_by_type}</TableCell>
                <TableCell>{r.reservation_date || '-'}</TableCell>
                <TableCell>{r.expiry_date || '-'}</TableCell>
                <TableCell><Chip label={r.status} size="small" color={sc(r.status)} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No reservations</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderFines = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ issue_id:'', student_id:'', fine_type:'overdue', amount:'', notes:'' })}>Add Fine</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Book</TableCell><TableCell>Student ID</TableCell><TableCell>Type</TableCell><TableCell>Amount</TableCell><TableCell>Paid</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(f => (
              <TableRow key={f.id}>
                <TableCell><strong>{f.book_title || '-'}</strong></TableCell>
                <TableCell>{f.student_id}</TableCell>
                <TableCell>{f.fine_type}</TableCell>
                <TableCell>₹{f.amount}</TableCell>
                <TableCell>₹{f.paid_amount || 0}</TableCell>
                <TableCell><Chip label={f.status} size="small" color={sc(f.status)} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(f)}><Edit fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No fines</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderEbooks = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ title:'', author:'', resource_type:'ebook', subject:'', url:'', description:'', access_level:'all' })}>Add E-Resource</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Author</TableCell><TableCell>Type</TableCell><TableCell>Subject</TableCell><TableCell>Access</TableCell><TableCell>Downloads</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(e => (
              <TableRow key={e.id}>
                <TableCell><strong>{e.title}</strong></TableCell>
                <TableCell>{e.author || '-'}</TableCell>
                <TableCell><Chip label={e.resource_type} size="small" color={sc(e.resource_type)} /></TableCell>
                <TableCell>{e.subject || '-'}</TableCell>
                <TableCell><Chip label={e.access_level} size="small" color={sc(e.access_level)} /></TableCell>
                <TableCell>{e.download_count || 0}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(e)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No e-resources</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderPeriodicals = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ title:'', periodical_type:'magazine', publisher:'', frequency:'monthly', subscription_start:'', subscription_end:'', subscription_cost:'', notes:'' })}>Add Periodical</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Publisher</TableCell><TableCell>Frequency</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Cost</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(p => (
              <TableRow key={p.id}>
                <TableCell><strong>{p.title}</strong></TableCell>
                <TableCell>{p.periodical_type}</TableCell>
                <TableCell>{p.publisher || '-'}</TableCell>
                <TableCell>{p.frequency}</TableCell>
                <TableCell>{p.subscription_start || '-'}</TableCell>
                <TableCell>{p.subscription_end || '-'}</TableCell>
                <TableCell>₹{p.subscription_cost || 0}</TableCell>
                <TableCell><Chip label={p.status} size="small" color={sc(p.status)} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={9} align="center">No periodicals</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderReadingHistory = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ student_id:'', book_id:'', start_date:'', rating:'', review:'', pages_read:'' })}>Add Record</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Student ID</TableCell><TableCell>Book</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Rating</TableCell><TableCell>Pages Read</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.student_id}</TableCell>
                <TableCell><strong>{r.book_title || '-'}</strong></TableCell>
                <TableCell>{r.start_date || '-'}</TableCell>
                <TableCell>{r.end_date || '-'}</TableCell>
                <TableCell>{r.rating ? `${r.rating}/5` : '-'}</TableCell>
                <TableCell>{r.pages_read || '-'}</TableCell>
                <TableCell><Chip label={r.status} size="small" color={sc(r.status)} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={8} align="center">No records</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderBudget = () => (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" startIcon={<Add />} onClick={() => openAdd({ academic_year:'2025-26', category:'books', allocated_amount:'', spent_amount:0, description:'', status:'planned' })}>Add Budget</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead><TableRow><TableCell>Year</TableCell><TableCell>Category</TableCell><TableCell>Allocated</TableCell><TableCell>Spent</TableCell><TableCell>Remaining</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {data.map(b => (
              <TableRow key={b.id}>
                <TableCell><strong>{b.academic_year}</strong></TableCell>
                <TableCell>{b.category}</TableCell>
                <TableCell>₹{b.allocated_amount}</TableCell>
                <TableCell>₹{b.spent_amount}</TableCell>
                <TableCell>₹{b.remaining}</TableCell>
                <TableCell><Chip label={b.status} size="small" color={sc(b.status)} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(b)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(b.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No budget records</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
      </TableContainer>
    </Box>
  );

  const renderDialog = () => {
    const forms = {
      1: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {F(form, setForm, 'name', 'Name', { xs: 12 })}
        {F(form, setForm, 'description', 'Description', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      2: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <Alert severity="info" icon={<QrCodeScanner />} sx={{ mb: 1 }}>
            Enter ISBN and click "Fetch" to auto-fill book details from Google Books
          </Alert>
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField fullWidth label="ISBN" value={form.isbn || ''} size="small"
            onChange={e => setForm({ ...form, isbn: e.target.value })}
            placeholder="e.g. 9780134685991"
            InputProps={{
              startAdornment: <InputAdornment position="start"><QrCodeScanner fontSize="small" /></InputAdornment>
            }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupISBN(); } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button fullWidth variant="outlined" onClick={lookupISBN} disabled={isbnLoading}
            startIcon={isbnLoading ? <CircularProgress size={16} /> : <Search />}
            sx={{ height: 40 }}>
            {isbnLoading ? 'Fetching...' : 'Fetch Details'}
          </Button>
        </Grid>
        {F(form, setForm, 'title', 'Title *')}
        {F(form, setForm, 'author', 'Author')}
        {Sel(form, setForm, 'category_id', 'Category', cats.map(c => ({ value: c.id, label: c.name })))}
        {F(form, setForm, 'publisher', 'Publisher')}
        {F(form, setForm, 'edition', 'Edition')}
        {F(form, setForm, 'language', 'Language')}
        {F(form, setForm, 'subject', 'Subject')}
        {F(form, setForm, 'publication_year', 'Publication Year', { type: 'number' })}
        {F(form, setForm, 'pages', 'Pages', { type: 'number' })}
        {F(form, setForm, 'total_copies', 'Total Copies', { type: 'number' })}
        {F(form, setForm, 'rack_no', 'Rack No')}
        {F(form, setForm, 'price', 'Price', { type: 'number' })}
        {Sel(form, setForm, 'condition', 'Condition', ['new','good','fair','poor','damaged'])}
      </Grid>),
      3: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {Sel(form, setForm, 'book_id', 'Book', books.map(b => ({ value: b.id, label: b.title })))}
        {F(form, setForm, 'accession_no', 'Accession No')}
        {F(form, setForm, 'barcode', 'Barcode')}
        {Sel(form, setForm, 'condition', 'Condition', ['new','good','fair','poor','damaged','lost'])}
        {F(form, setForm, 'location', 'Location')}
        {F(form, setForm, 'notes', 'Notes', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      4: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {Sel(form, setForm, 'book_id', 'Book', books.map(b => ({ value: b.id, label: `${b.title} (Avail: ${b.available_copies})` })))}
        {F(form, setForm, 'issued_to', 'Issued To (ID)', { type: 'number' })}
        {Sel(form, setForm, 'issued_to_type', 'Type', ['student', 'staff'])}
        {F(form, setForm, 'due_date', 'Due Date', { type: 'date' })}
        {F(form, setForm, 'notes', 'Notes', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      5: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {Sel(form, setForm, 'book_id', 'Book', books.map(b => ({ value: b.id, label: b.title })))}
        {F(form, setForm, 'reserved_by', 'Reserved By (ID)', { type: 'number' })}
        {Sel(form, setForm, 'reserved_by_type', 'Type', ['student', 'staff'])}
        {F(form, setForm, 'expiry_date', 'Expiry Date', { type: 'date' })}
        {edit && Sel(form, setForm, 'status', 'Status', ['pending','fulfilled','cancelled','expired'])}
        {F(form, setForm, 'notes', 'Notes', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      6: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {F(form, setForm, 'issue_id', 'Issue ID', { type: 'number' })}
        {F(form, setForm, 'student_id', 'Student ID', { type: 'number' })}
        {Sel(form, setForm, 'fine_type', 'Fine Type', ['overdue','lost','damaged'])}
        {F(form, setForm, 'amount', 'Amount', { type: 'number' })}
        {edit && F(form, setForm, 'paid_amount', 'Paid Amount', { type: 'number' })}
        {edit && Sel(form, setForm, 'status', 'Status', ['pending','paid','waived'])}
        {edit && F(form, setForm, 'paid_date', 'Paid Date', { type: 'date' })}
        {F(form, setForm, 'notes', 'Notes', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      7: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {F(form, setForm, 'title', 'Title')}
        {F(form, setForm, 'author', 'Author')}
        {Sel(form, setForm, 'resource_type', 'Type', ['ebook','pdf','journal','article','video'])}
        {F(form, setForm, 'subject', 'Subject')}
        {F(form, setForm, 'url', 'URL', { xs: 12 })}
        {F(form, setForm, 'description', 'Description', { xs: 12, multi: true, rows: 2 })}
        {Sel(form, setForm, 'access_level', 'Access Level', ['all','students','staff','restricted'])}
      </Grid>),
      8: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {F(form, setForm, 'title', 'Title')}
        {Sel(form, setForm, 'periodical_type', 'Type', ['magazine','journal','newspaper'])}
        {F(form, setForm, 'publisher', 'Publisher')}
        {Sel(form, setForm, 'frequency', 'Frequency', ['daily','weekly','biweekly','monthly','quarterly','yearly'])}
        {F(form, setForm, 'subscription_start', 'Start Date', { type: 'date' })}
        {F(form, setForm, 'subscription_end', 'End Date', { type: 'date' })}
        {F(form, setForm, 'subscription_cost', 'Cost', { type: 'number' })}
        {edit && Sel(form, setForm, 'status', 'Status', ['active','expired','cancelled'])}
        {F(form, setForm, 'notes', 'Notes', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      9: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {F(form, setForm, 'student_id', 'Student ID', { type: 'number' })}
        {Sel(form, setForm, 'book_id', 'Book', books.map(b => ({ value: b.id, label: b.title })))}
        {F(form, setForm, 'start_date', 'Start Date', { type: 'date' })}
        {edit && F(form, setForm, 'end_date', 'End Date', { type: 'date' })}
        {F(form, setForm, 'rating', 'Rating (1-5)', { type: 'number' })}
        {F(form, setForm, 'pages_read', 'Pages Read', { type: 'number' })}
        {edit && Sel(form, setForm, 'status', 'Status', ['reading','completed','abandoned'])}
        {F(form, setForm, 'review', 'Review', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
      10: () => (<Grid container spacing={2} sx={{ mt: 0.5 }}>
        {F(form, setForm, 'academic_year', 'Academic Year')}
        {Sel(form, setForm, 'category', 'Category', ['books','periodicals','ebooks','furniture','equipment','other'])}
        {F(form, setForm, 'allocated_amount', 'Allocated Amount', { type: 'number' })}
        {F(form, setForm, 'spent_amount', 'Spent Amount', { type: 'number' })}
        {Sel(form, setForm, 'status', 'Status', ['planned','approved','in_progress','completed'])}
        {F(form, setForm, 'description', 'Description', { xs: 12, multi: true, rows: 2 })}
      </Grid>),
    };
    const titles = ['', 'Category', 'Book', 'Book Copy', 'Issue Book', 'Reservation', 'Fine', 'E-Resource', 'Periodical', 'Reading History', 'Budget'];
    return (
      <Dialog open={dlg} onClose={close} maxWidth="md" fullWidth>
        <DialogTitle>{edit ? 'Edit' : 'Add'} {titles[tab]}</DialogTitle>
        <DialogContent>{forms[tab]?.()}</DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button variant="contained" onClick={save}>{edit ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renders = [renderDashboard, renderCategories, renderBooks, renderCopies, renderIssues, renderReservations, renderFines, renderEbooks, renderPeriodicals, renderReadingHistory, renderBudget];

  return (
    <Box>
      <Typography variant="h5" mb={2}>Library Management</Typography>
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(0); setData([]); }} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {tabLabels.map((l, i) => <Tab key={i} label={l} />)}
      </Tabs>

      {renders[tab]?.()}
      {renderDialog()}

      {/* Bulk Import Dialog */}
      <Dialog open={bulkDlg} onClose={closeBulk} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" /> Bulk Import Books
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={bulkStep} sx={{ mb: 3, mt: 1 }}>
            <Step><StepLabel>Upload CSV</StepLabel></Step>
            <Step><StepLabel>Review Data</StepLabel></Step>
            <Step><StepLabel>Result</StepLabel></Step>
          </Stepper>

          {bulkStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Upload a CSV file with book data. First row should be headers.
                Required column: <strong>title</strong>. Optional: author, isbn, publisher, edition, language, subject, publication_year, pages, total_copies, rack_no, price, condition.
              </Alert>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <InputLabel>Default Category (optional)</InputLabel>
                  <Select value={bulkCategoryId} label="Default Category (optional)"
                    onChange={e => setBulkCategoryId(e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {cats.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box display="flex" gap={2} alignItems="center">
                <input type="file" accept=".csv,.txt" ref={fileRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <Button variant="contained" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()}>
                  Upload CSV File
                </Button>
                <Button variant="outlined" startIcon={<FileDownload />} onClick={downloadTemplate}>
                  Download Template
                </Button>
              </Box>
            </Box>
          )}

          {bulkStep === 1 && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Found <strong>{bulkData.length}</strong> books ready to import. Review below and click Import.
              </Alert>
              <TableContainer component={Paper} sx={{ maxHeight: 350 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>ISBN</TableCell>
                      <TableCell>Publisher</TableCell>
                      <TableCell>Copies</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bulkData.slice(0, 100).map((b, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{b.title}</TableCell>
                        <TableCell>{b.author || '-'}</TableCell>
                        <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{b.isbn || '-'}</Typography></TableCell>
                        <TableCell>{b.publisher || '-'}</TableCell>
                        <TableCell>{b.total_copies || 1}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {bulkData.length > 100 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Showing first 100 of {bulkData.length} books
                </Typography>
              )}
            </Box>
          )}

          {bulkStep === 2 && bulkResult && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: 'success.50' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold" color="success.main">{bulkResult.added}</Typography>
                      <Typography variant="body2" color="text.secondary">Books Added</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Card sx={{ bgcolor: 'warning.50' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <ErrorIcon color="warning" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold" color="warning.main">{bulkResult.skipped}</Typography>
                      <Typography variant="body2" color="text.secondary">Skipped</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                      <LibraryBooks color="primary" sx={{ fontSize: 40 }} />
                      <Typography variant="h4" fontWeight="bold" color="primary">{bulkResult.added + bulkResult.skipped}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Processed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              {bulkResult.errors?.length > 0 && (
                <Alert severity="warning">
                  <Typography variant="subtitle2" mb={0.5}>Skipped Rows:</Typography>
                  {bulkResult.errors.map((e, i) => <Typography key={i} variant="caption" display="block">{e}</Typography>)}
                </Alert>
              )}
            </Box>
          )}

          {bulkLoading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBulk}>{bulkStep === 2 ? 'Close' : 'Cancel'}</Button>
          {bulkStep === 1 && (
            <>
              <Button onClick={() => { setBulkStep(0); setBulkData([]); }}>Back</Button>
              <Button variant="contained" onClick={executeBulkImport} disabled={bulkLoading}
                startIcon={bulkLoading ? <CircularProgress size={16} /> : <CloudUpload />}>
                {bulkLoading ? 'Importing...' : `Import ${bulkData.length} Books`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
