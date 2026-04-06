import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Chip, Snackbar, Alert, Card, CardContent, IconButton, MenuItem
} from '@mui/material';
import {
  Add, Edit, Delete, Refresh, Dashboard as DashIcon, Category, Inventory as InvIcon,
  Build, ShoppingCart, Receipt, RequestQuote, DeleteSweep, SwapHoriz, Warehouse
} from '@mui/icons-material';
import { inventoryAPI } from '../../services/api';

const init = (keys) => keys.reduce((o, k) => ({ ...o, [k]: '' }), {});

export default function Inventory() {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const msg = (m, s = 'success') => setSnack({ open: true, message: m, severity: s });

  const [dash, setDash] = useState({});

  // Asset Categories
  const [assetCats, setAssetCats] = useState([]);
  const [openAC, setOpenAC] = useState(false);
  const [acForm, setAcForm] = useState(init(['name','description','depreciation_rate','useful_life_years']));

  // Assets
  const [assets, setAssets] = useState([]);
  const [openAst, setOpenAst] = useState(false);
  const [astForm, setAstForm] = useState(init(['category_id','asset_code','name','description','asset_type','brand','model','serial_number','purchase_date','purchase_price','warranty_expiry','warranty_details','location','room_number','assigned_to','condition','status','current_value','depreciation_method','salvage_value','useful_life_years','notes']));
  const [editAstId, setEditAstId] = useState(null);

  // Maintenance
  const [maint, setMaint] = useState([]);
  const [openMnt, setOpenMnt] = useState(false);
  const [mntForm, setMntForm] = useState(init(['asset_id','maintenance_type','description','reported_date','scheduled_date','completed_date','vendor_name','cost','status','priority','technician','notes']));
  const [editMntId, setEditMntId] = useState(null);

  // Inventory Categories
  const [invCats, setInvCats] = useState([]);
  const [openIC, setOpenIC] = useState(false);
  const [icForm, setIcForm] = useState(init(['name','description']));

  // Inventory Items
  const [items, setItems] = useState([]);
  const [openItm, setOpenItm] = useState(false);
  const [itmForm, setItmForm] = useState(init(['category_id','name','description','sku','quantity','unit','unit_price','min_stock_level','max_stock_level','reorder_quantity','location','expiry_date','is_lab_item']));
  const [editItmId, setEditItmId] = useState(null);

  // Transactions
  const [txns, setTxns] = useState([]);
  const [openTxn, setOpenTxn] = useState(false);
  const [txnForm, setTxnForm] = useState(init(['item_id','transaction_type','quantity','issued_to','remarks']));

  // Purchase Requests
  const [prList, setPrList] = useState([]);
  const [openPR, setOpenPR] = useState(false);
  const [prForm, setPrForm] = useState(init(['title','description','request_type','priority','department','estimated_total','notes']));
  const [editPRId, setEditPRId] = useState(null);

  // Purchase Orders
  const [poList, setPoList] = useState([]);
  const [openPO, setOpenPO] = useState(false);
  const [poForm, setPoForm] = useState(init(['purchase_request_id','vendor_name','vendor_contact','vendor_email','vendor_address','order_date','expected_delivery','subtotal','tax_amount','discount_amount','total_amount','payment_terms','delivery_terms','status','notes']));
  const [editPOId, setEditPOId] = useState(null);

  // Quotations
  const [quotes, setQuotes] = useState([]);
  const [openQt, setOpenQt] = useState(false);
  const [qtForm, setQtForm] = useState(init(['purchase_request_id','vendor_name','vendor_contact','vendor_email','quotation_number','quotation_date','valid_until','total_amount','delivery_days','payment_terms','warranty_terms','rating','notes']));

  // Disposals
  const [disposals, setDisposals] = useState([]);
  const [openDsp, setOpenDsp] = useState(false);
  const [dspForm, setDspForm] = useState(init(['asset_id','disposal_type','disposal_date','reason','book_value','disposal_value','buyer_name','buyer_contact','status','notes']));
  const [editDspId, setEditDspId] = useState(null);

  const ex = (d) => d?.data?.data?.items || d?.data?.data || d?.data?.items || [];

  const fetchDash = useCallback(() => inventoryAPI.getDashboard().then(r => setDash(r.data.data || {})).catch(() => {}), []);
  const fetchAssetCats = useCallback(() => inventoryAPI.listAssetCategories().then(r => setAssetCats(ex(r))).catch(() => {}), []);
  const fetchAssets = useCallback(() => inventoryAPI.listAssets({}).then(r => setAssets(ex(r))).catch(() => {}), []);
  const fetchMaint = useCallback(() => inventoryAPI.listMaintenance({}).then(r => setMaint(ex(r))).catch(() => {}), []);
  const fetchInvCats = useCallback(() => inventoryAPI.listCategories().then(r => setInvCats(ex(r))).catch(() => {}), []);
  const fetchItems = useCallback(() => inventoryAPI.listItems({}).then(r => setItems(ex(r))).catch(() => {}), []);
  const fetchTxns = useCallback(() => inventoryAPI.listTransactions({}).then(r => setTxns(ex(r))).catch(() => {}), []);
  const fetchPR = useCallback(() => inventoryAPI.listPurchaseRequests({}).then(r => setPrList(ex(r))).catch(() => {}), []);
  const fetchPO = useCallback(() => inventoryAPI.listPurchaseOrders({}).then(r => setPoList(ex(r))).catch(() => {}), []);
  const fetchQt = useCallback(() => inventoryAPI.listQuotations({}).then(r => setQuotes(ex(r))).catch(() => {}), []);
  const fetchDsp = useCallback(() => inventoryAPI.listDisposals({}).then(r => setDisposals(ex(r))).catch(() => {}), []);

  useEffect(() => { fetchDash(); }, [fetchDash]);
  useEffect(() => {
    const f = [null, fetchAssetCats, fetchAssets, fetchMaint, fetchInvCats, fetchItems, fetchTxns, fetchPR, fetchPO, fetchQt, fetchDsp];
    if (f[tab]) f[tab]();
  }, [tab, fetchAssetCats, fetchAssets, fetchMaint, fetchInvCats, fetchItems, fetchTxns, fetchPR, fetchPO, fetchQt, fetchDsp]);

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
    if (['active','completed','approved','delivered','good','new','in_stock'].includes(s)) return 'success';
    if (['disposed','condemned','damaged','rejected','cancelled','lost'].includes(s)) return 'error';
    if (['in_repair','pending','draft','sent','confirmed','fair','in_progress','scheduled'].includes(s)) return 'warning';
    return 'default';
  };

  const tabLabels = ['Dashboard','Asset Categories','Assets','Maintenance','Inv Categories','Inv Items','Transactions','Purchase Req','Purchase Orders','Quotations','Disposals'];
  const tabIcons = [<DashIcon fontSize="small"/>,<Category fontSize="small"/>,<Warehouse fontSize="small"/>,<Build fontSize="small"/>,<Category fontSize="small"/>,<InvIcon fontSize="small"/>,<SwapHoriz fontSize="small"/>,<ShoppingCart fontSize="small"/>,<Receipt fontSize="small"/>,<RequestQuote fontSize="small"/>,<DeleteSweep fontSize="small"/>];

  return (
    <Box>
      <Typography variant="h5" mb={2}>Inventory & Asset Management</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabLabels.map((l, i) => <Tab key={i} label={l} icon={tabIcons[i]} iconPosition="start" sx={{ minHeight: 48, textTransform: 'none' }} />)}
      </Tabs>

      {/* TAB 0: Dashboard */}
      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}><Button startIcon={<Refresh />} onClick={fetchDash}>Refresh</Button></Box>
          <Grid container spacing={2}>
            {[
              { label: 'Total Assets', val: dash.total_assets, color: '#6366f1' },
              { label: 'Active Assets', val: dash.active_assets, color: '#2e7d32' },
              { label: 'In Repair', val: dash.in_repair, color: '#ed6c02' },
              { label: 'Disposed', val: dash.disposed_assets, color: '#d32f2f' },
              { label: 'Inventory Items', val: dash.total_items, color: '#0288d1' },
              { label: 'Low Stock', val: dash.low_stock_items, color: '#c2185b' },
              { label: 'Pending Requests', val: dash.pending_requests, color: '#7b1fa2' },
              { label: 'Pending Orders', val: dash.pending_orders, color: '#f57c00' },
              { label: 'Pending Maintenance', val: dash.pending_maintenance, color: '#388e3c' },
              { label: 'Warranty Expiring', val: dash.warranty_expiring, color: '#e64a19' },
              { label: 'Total Asset Value', val: dash.total_asset_value ? `₹${Number(dash.total_asset_value).toLocaleString()}` : '₹0', color: '#00796b' },
              { label: 'Pending Disposals', val: dash.pending_disposals, color: '#5d4037' },
            ].map((c, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card sx={{ borderLeft: `4px solid ${c.color}`, borderRadius: 4, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 25px ${c.color}22` } }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color={c.color}>{typeof c.val === 'string' ? c.val : (c.val ?? 0)}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* TAB 1: Asset Categories */}
      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setAcForm(init(['name','description','depreciation_rate','useful_life_years'])); setOpenAC(true); }}>Add Category</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Name</TableCell><TableCell>Description</TableCell><TableCell>Depreciation %</TableCell><TableCell>Useful Life</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {assetCats.map(c => (
                <TableRow key={c.id}>
                  <TableCell><strong>{c.name}</strong></TableCell><TableCell>{c.description || '-'}</TableCell>
                  <TableCell>{c.depreciation_rate ? `${c.depreciation_rate}%` : '-'}</TableCell>
                  <TableCell>{c.useful_life_years ? `${c.useful_life_years} yrs` : '-'}</TableCell>
                </TableRow>
              ))}
              {assetCats.length === 0 && <TableRow><TableCell colSpan={4} align="center">No categories</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 2: Assets */}
      {tab === 2 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setAstForm(init(['category_id','asset_code','name','description','asset_type','brand','model','serial_number','purchase_date','purchase_price','warranty_expiry','warranty_details','location','room_number','assigned_to','condition','status','current_value','depreciation_method','salvage_value','useful_life_years','notes'])); setEditAstId(null); setOpenAst(true); }}>Add Asset</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Brand/Model</TableCell>
              <TableCell>Location</TableCell><TableCell>Condition</TableCell><TableCell>Status</TableCell><TableCell>Value</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {assets.map(a => (
                <TableRow key={a.id}>
                  <TableCell><Chip size="small" label={a.asset_code || `#${a.id}`} variant="outlined" /></TableCell>
                  <TableCell><strong>{a.name}</strong></TableCell>
                  <TableCell><Chip size="small" label={a.asset_type || '-'} /></TableCell>
                  <TableCell>{a.brand || '-'} {a.model || ''}</TableCell>
                  <TableCell>{a.location || '-'}</TableCell>
                  <TableCell><Chip size="small" label={a.condition || '-'} color={statColor(a.condition)} /></TableCell>
                  <TableCell><Chip size="small" label={a.status || '-'} color={statColor(a.status)} /></TableCell>
                  <TableCell>{a.current_value ? `₹${Number(a.current_value).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => { setAstForm(a); setEditAstId(a.id); setOpenAst(true); }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => inventoryAPI.deleteAsset(a.id).then(() => { msg('Deleted'); fetchAssets(); }).catch(() => msg('Failed','error'))}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {assets.length === 0 && <TableRow><TableCell colSpan={9} align="center">No assets</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 3: Maintenance */}
      {tab === 3 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setMntForm(init(['asset_id','maintenance_type','description','reported_date','scheduled_date','completed_date','vendor_name','cost','status','priority','technician','notes'])); setEditMntId(null); setOpenMnt(true); }}>Add Maintenance</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Asset ID</TableCell><TableCell>Type</TableCell><TableCell>Priority</TableCell><TableCell>Reported</TableCell>
              <TableCell>Scheduled</TableCell><TableCell>Vendor</TableCell><TableCell>Cost</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {maint.map(m => (
                <TableRow key={m.id}>
                  <TableCell>#{m.asset_id}</TableCell>
                  <TableCell><Chip size="small" label={m.maintenance_type} /></TableCell>
                  <TableCell><Chip size="small" label={m.priority || 'medium'} color={m.priority === 'high' || m.priority === 'urgent' ? 'error' : 'default'} /></TableCell>
                  <TableCell>{m.reported_date || '-'}</TableCell>
                  <TableCell>{m.scheduled_date || '-'}</TableCell>
                  <TableCell>{m.vendor_name || '-'}</TableCell>
                  <TableCell>{m.cost ? `₹${Number(m.cost).toLocaleString()}` : '-'}</TableCell>
                  <TableCell><Chip size="small" label={m.status} color={statColor(m.status)} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => { setMntForm(m); setEditMntId(m.id); setOpenMnt(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {maint.length === 0 && <TableRow><TableCell colSpan={9} align="center">No records</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 4: Inventory Categories */}
      {tab === 4 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setIcForm(init(['name','description'])); setOpenIC(true); }}>Add Category</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Description</TableCell></TableRow></TableHead>
            <TableBody>
              {invCats.map(c => <TableRow key={c.id}><TableCell><strong>{c.name}</strong></TableCell><TableCell>{c.description || '-'}</TableCell></TableRow>)}
              {invCats.length === 0 && <TableRow><TableCell colSpan={2} align="center">No categories</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 5: Inventory Items */}
      {tab === 5 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setItmForm(init(['category_id','name','description','sku','quantity','unit','unit_price','min_stock_level','max_stock_level','reorder_quantity','location','expiry_date','is_lab_item'])); setEditItmId(null); setOpenItm(true); }}>Add Item</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>SKU</TableCell><TableCell>Name</TableCell><TableCell>Unit</TableCell><TableCell>Qty</TableCell>
              <TableCell>Min</TableCell><TableCell>Price</TableCell><TableCell>Location</TableCell><TableCell>Lab</TableCell><TableCell>Stock</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id} sx={{ bgcolor: it.quantity <= (it.min_stock_level || 0) ? '#fff3e0' : 'inherit' }}>
                  <TableCell>{it.sku || '-'}</TableCell>
                  <TableCell><strong>{it.name}</strong></TableCell>
                  <TableCell>{it.unit || '-'}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{it.min_stock_level || '-'}</TableCell>
                  <TableCell>₹{it.unit_price || 0}</TableCell>
                  <TableCell>{it.location || '-'}</TableCell>
                  <TableCell>{it.is_lab_item ? <Chip size="small" label="Lab" color="info" /> : '-'}</TableCell>
                  <TableCell><Chip size="small" label={it.quantity > (it.min_stock_level || 10) ? 'In Stock' : it.quantity > 0 ? 'Low' : 'Out'} color={it.quantity > (it.min_stock_level || 10) ? 'success' : it.quantity > 0 ? 'warning' : 'error'} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => { setItmForm(it); setEditItmId(it.id); setOpenItm(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={10} align="center">No items</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 6: Transactions */}
      {tab === 6 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setTxnForm(init(['item_id','transaction_type','quantity','issued_to','remarks'])); setOpenTxn(true); }}>Record Transaction</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Date</TableCell><TableCell>Item</TableCell><TableCell>Type</TableCell><TableCell>Qty</TableCell>
              <TableCell>Issued To</TableCell><TableCell>Remarks</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {txns.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>#{t.item_id}</TableCell>
                  <TableCell><Chip size="small" label={t.transaction_type} color={t.transaction_type === 'in' || t.transaction_type === 'return' ? 'success' : t.transaction_type === 'out' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>{t.quantity}</TableCell>
                  <TableCell>{t.issued_to || '-'}</TableCell>
                  <TableCell>{t.remarks || '-'}</TableCell>
                </TableRow>
              ))}
              {txns.length === 0 && <TableRow><TableCell colSpan={6} align="center">No transactions</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 7: Purchase Requests */}
      {tab === 7 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setPrForm(init(['title','description','request_type','priority','department','estimated_total','notes'])); setEditPRId(null); setOpenPR(true); }}>New Request</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Req #</TableCell><TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Priority</TableCell>
              <TableCell>Dept</TableCell><TableCell>Est. Total</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {prList.map(pr => (
                <TableRow key={pr.id}>
                  <TableCell><Chip size="small" label={pr.request_number} variant="outlined" /></TableCell>
                  <TableCell><strong>{pr.title}</strong></TableCell>
                  <TableCell>{pr.request_type || '-'}</TableCell>
                  <TableCell><Chip size="small" label={pr.priority || 'medium'} color={pr.priority === 'high' || pr.priority === 'urgent' ? 'error' : 'default'} /></TableCell>
                  <TableCell>{pr.department || '-'}</TableCell>
                  <TableCell>{pr.estimated_total ? `₹${Number(pr.estimated_total).toLocaleString()}` : '-'}</TableCell>
                  <TableCell><Chip size="small" label={pr.status} color={statColor(pr.status)} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => { setPrForm(pr); setEditPRId(pr.id); setOpenPR(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {prList.length === 0 && <TableRow><TableCell colSpan={8} align="center">No requests</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 8: Purchase Orders */}
      {tab === 8 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setPoForm(init(['purchase_request_id','vendor_name','vendor_contact','vendor_email','vendor_address','order_date','expected_delivery','subtotal','tax_amount','discount_amount','total_amount','payment_terms','delivery_terms','status','notes'])); setEditPOId(null); setOpenPO(true); }}>New Order</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>PO #</TableCell><TableCell>Vendor</TableCell><TableCell>Order Date</TableCell><TableCell>Delivery</TableCell>
              <TableCell>Total</TableCell><TableCell>Payment</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {poList.map(po => (
                <TableRow key={po.id}>
                  <TableCell><Chip size="small" label={po.po_number} variant="outlined" /></TableCell>
                  <TableCell><strong>{po.vendor_name}</strong></TableCell>
                  <TableCell>{po.order_date || '-'}</TableCell>
                  <TableCell>{po.expected_delivery || '-'}</TableCell>
                  <TableCell>{po.total_amount ? `₹${Number(po.total_amount).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{po.payment_terms || '-'}</TableCell>
                  <TableCell><Chip size="small" label={po.status} color={statColor(po.status)} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => { setPoForm(po); setEditPOId(po.id); setOpenPO(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {poList.length === 0 && <TableRow><TableCell colSpan={8} align="center">No orders</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 9: Quotations */}
      {tab === 9 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setQtForm(init(['purchase_request_id','vendor_name','vendor_contact','vendor_email','quotation_number','quotation_date','valid_until','total_amount','delivery_days','payment_terms','warranty_terms','rating','notes'])); setOpenQt(true); }}>Add Quotation</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Quote #</TableCell><TableCell>Vendor</TableCell><TableCell>Date</TableCell><TableCell>Valid Until</TableCell>
              <TableCell>Amount</TableCell><TableCell>Delivery</TableCell><TableCell>Rating</TableCell><TableCell>Selected</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {quotes.map(q => (
                <TableRow key={q.id} sx={{ bgcolor: q.is_selected ? '#e8f5e9' : 'inherit' }}>
                  <TableCell>{q.quotation_number || '-'}</TableCell>
                  <TableCell><strong>{q.vendor_name}</strong></TableCell>
                  <TableCell>{q.quotation_date || '-'}</TableCell>
                  <TableCell>{q.valid_until || '-'}</TableCell>
                  <TableCell>{q.total_amount ? `₹${Number(q.total_amount).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{q.delivery_days ? `${q.delivery_days} days` : '-'}</TableCell>
                  <TableCell>{q.rating ? `${q.rating}/5` : '-'}</TableCell>
                  <TableCell>{q.is_selected ? <Chip size="small" label="Selected" color="success" /> : '-'}</TableCell>
                </TableRow>
              ))}
              {quotes.length === 0 && <TableRow><TableCell colSpan={8} align="center">No quotations</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* TAB 10: Disposals */}
      {tab === 10 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button variant="contained" color="error" startIcon={<DeleteSweep />} onClick={() => { setDspForm(init(['asset_id','disposal_type','disposal_date','reason','book_value','disposal_value','buyer_name','buyer_contact','status','notes'])); setEditDspId(null); setOpenDsp(true); }}>New Disposal</Button>
          </Box>
          <TableContainer component={Paper}><Table size="small">
            <TableHead><TableRow>
              <TableCell>Asset</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell><TableCell>Reason</TableCell>
              <TableCell>Book Value</TableCell><TableCell>Disposal Value</TableCell><TableCell>Buyer</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {disposals.map(d => (
                <TableRow key={d.id}>
                  <TableCell>#{d.asset_id}</TableCell>
                  <TableCell><Chip size="small" label={d.disposal_type || '-'} /></TableCell>
                  <TableCell>{d.disposal_date || '-'}</TableCell>
                  <TableCell>{d.reason || '-'}</TableCell>
                  <TableCell>{d.book_value ? `₹${Number(d.book_value).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{d.disposal_value ? `₹${Number(d.disposal_value).toLocaleString()}` : '-'}</TableCell>
                  <TableCell>{d.buyer_name || '-'}</TableCell>
                  <TableCell><Chip size="small" label={d.status} color={statColor(d.status)} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => { setDspForm(d); setEditDspId(d.id); setOpenDsp(true); }}><Edit fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {disposals.length === 0 && <TableRow><TableCell colSpan={9} align="center">No disposals</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        </Box>
      )}

      {/* ═══ DIALOGS ═══ */}

      {/* Asset Category Dialog */}
      <Dialog open={openAC} onClose={() => setOpenAC(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Asset Category</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(acForm, setAcForm, 'Name *', 'name', { xs: 12 })}
          {F(acForm, setAcForm, 'Description', 'description', { xs: 12 })}
          {F(acForm, setAcForm, 'Depreciation Rate (%)', 'depreciation_rate', { type: 'number' })}
          {F(acForm, setAcForm, 'Useful Life (years)', 'useful_life_years', { type: 'number' })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAC(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => inventoryAPI.createAssetCategory(acForm).then(() => { msg('Created'); setOpenAC(false); fetchAssetCats(); }).catch(() => msg('Failed','error'))}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={openAst} onClose={() => setOpenAst(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editAstId ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(astForm, setAstForm, 'Name *', 'name')}
          {F(astForm, setAstForm, 'Asset Code', 'asset_code')}
          {Sel(astForm, setAstForm, 'Type', 'asset_type', ['fixed','it','furniture','lab','sports','vehicle'])}
          {F(astForm, setAstForm, 'Category ID', 'category_id', { type: 'number' })}
          {F(astForm, setAstForm, 'Brand', 'brand')}
          {F(astForm, setAstForm, 'Model', 'model')}
          {F(astForm, setAstForm, 'Serial Number', 'serial_number')}
          {F(astForm, setAstForm, 'Purchase Date', 'purchase_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(astForm, setAstForm, 'Purchase Price', 'purchase_price', { type: 'number' })}
          {F(astForm, setAstForm, 'Current Value', 'current_value', { type: 'number' })}
          {F(astForm, setAstForm, 'Warranty Expiry', 'warranty_expiry', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(astForm, setAstForm, 'Location', 'location')}
          {F(astForm, setAstForm, 'Room', 'room_number')}
          {F(astForm, setAstForm, 'Assigned To', 'assigned_to')}
          {Sel(astForm, setAstForm, 'Condition', 'condition', ['new','good','fair','poor','damaged','condemned'])}
          {Sel(astForm, setAstForm, 'Status', 'status', ['active','in_repair','disposed','lost','transferred'])}
          {Sel(astForm, setAstForm, 'Depreciation', 'depreciation_method', ['straight_line','declining_balance','none'])}
          {F(astForm, setAstForm, 'Salvage Value', 'salvage_value', { type: 'number' })}
          {F(astForm, setAstForm, 'Useful Life (yrs)', 'useful_life_years', { type: 'number' })}
          {F(astForm, setAstForm, 'Warranty Details', 'warranty_details', { xs: 12 })}
          {F(astForm, setAstForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAst(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editAstId ? inventoryAPI.updateAsset(editAstId, astForm) : inventoryAPI.createAsset(astForm);
            fn.then(() => { msg(editAstId ? 'Updated' : 'Created'); setOpenAst(false); fetchAssets(); }).catch(() => msg('Failed','error'));
          }}>{editAstId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={openMnt} onClose={() => setOpenMnt(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editMntId ? 'Update Maintenance' : 'Add Maintenance'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(mntForm, setMntForm, 'Asset ID *', 'asset_id', { type: 'number' })}
          {Sel(mntForm, setMntForm, 'Type', 'maintenance_type', ['repair','service','upgrade','inspection'])}
          {Sel(mntForm, setMntForm, 'Priority', 'priority', ['low','medium','high','urgent'])}
          {Sel(mntForm, setMntForm, 'Status', 'status', ['pending','in_progress','completed','cancelled'])}
          {F(mntForm, setMntForm, 'Reported Date', 'reported_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(mntForm, setMntForm, 'Scheduled Date', 'scheduled_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(mntForm, setMntForm, 'Completed Date', 'completed_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(mntForm, setMntForm, 'Vendor', 'vendor_name')}
          {F(mntForm, setMntForm, 'Technician', 'technician')}
          {F(mntForm, setMntForm, 'Cost', 'cost', { type: 'number' })}
          {F(mntForm, setMntForm, 'Description', 'description', { xs: 12, multiline: true, rows: 2 })}
          {F(mntForm, setMntForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMnt(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editMntId ? inventoryAPI.updateMaintenance(editMntId, mntForm) : inventoryAPI.createMaintenance(mntForm);
            fn.then(() => { msg(editMntId ? 'Updated' : 'Created'); setOpenMnt(false); fetchMaint(); }).catch(() => msg('Failed','error'));
          }}>{editMntId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Category Dialog */}
      <Dialog open={openIC} onClose={() => setOpenIC(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Inventory Category</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(icForm, setIcForm, 'Name *', 'name', { xs: 12 })}
          {F(icForm, setIcForm, 'Description', 'description', { xs: 12 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIC(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => inventoryAPI.createCategory(icForm).then(() => { msg('Created'); setOpenIC(false); fetchInvCats(); }).catch(() => msg('Failed','error'))}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Item Dialog */}
      <Dialog open={openItm} onClose={() => setOpenItm(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editItmId ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(itmForm, setItmForm, 'Name *', 'name')}
          {F(itmForm, setItmForm, 'SKU', 'sku')}
          {F(itmForm, setItmForm, 'Category ID', 'category_id', { type: 'number' })}
          {F(itmForm, setItmForm, 'Quantity', 'quantity', { type: 'number' })}
          {F(itmForm, setItmForm, 'Unit', 'unit')}
          {F(itmForm, setItmForm, 'Unit Price', 'unit_price', { type: 'number' })}
          {F(itmForm, setItmForm, 'Min Stock Level', 'min_stock_level', { type: 'number' })}
          {F(itmForm, setItmForm, 'Max Stock Level', 'max_stock_level', { type: 'number' })}
          {F(itmForm, setItmForm, 'Reorder Qty', 'reorder_quantity', { type: 'number' })}
          {F(itmForm, setItmForm, 'Location', 'location')}
          {F(itmForm, setItmForm, 'Expiry Date', 'expiry_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {Sel(itmForm, setItmForm, 'Lab Item?', 'is_lab_item', [{value:'',label:'No'},{value:true,label:'Yes'}])}
          {F(itmForm, setItmForm, 'Description', 'description', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenItm(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editItmId ? inventoryAPI.updateItem(editItmId, itmForm) : inventoryAPI.createItem(itmForm);
            fn.then(() => { msg(editItmId ? 'Updated' : 'Created'); setOpenItm(false); fetchItems(); }).catch(() => msg('Failed','error'));
          }}>{editItmId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={openTxn} onClose={() => setOpenTxn(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Transaction</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(txnForm, setTxnForm, 'Item ID *', 'item_id', { type: 'number' })}
          {Sel(txnForm, setTxnForm, 'Type *', 'transaction_type', ['in','out','return','adjustment'])}
          {F(txnForm, setTxnForm, 'Quantity *', 'quantity', { type: 'number' })}
          {F(txnForm, setTxnForm, 'Issued To', 'issued_to')}
          {F(txnForm, setTxnForm, 'Remarks', 'remarks', { xs: 12 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTxn(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => inventoryAPI.addTransaction(txnForm).then(() => { msg('Recorded'); setOpenTxn(false); fetchTxns(); fetchItems(); }).catch(e => msg(e?.response?.data?.message || 'Failed','error'))}>Record</Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Request Dialog */}
      <Dialog open={openPR} onClose={() => setOpenPR(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editPRId ? 'Update Request' : 'New Purchase Request'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(prForm, setPrForm, 'Title *', 'title', { xs: 12 })}
          {Sel(prForm, setPrForm, 'Type', 'request_type', ['asset','consumable','service','other'])}
          {Sel(prForm, setPrForm, 'Priority', 'priority', ['low','medium','high','urgent'])}
          {F(prForm, setPrForm, 'Department', 'department')}
          {F(prForm, setPrForm, 'Est. Total', 'estimated_total', { type: 'number' })}
          {editPRId && Sel(prForm, setPrForm, 'Status', 'status', ['pending','approved','rejected','ordered','completed'])}
          {F(prForm, setPrForm, 'Description', 'description', { xs: 12, multiline: true, rows: 2 })}
          {F(prForm, setPrForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPR(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editPRId ? inventoryAPI.updatePurchaseRequest(editPRId, prForm) : inventoryAPI.createPurchaseRequest(prForm);
            fn.then(() => { msg(editPRId ? 'Updated' : 'Created'); setOpenPR(false); fetchPR(); }).catch(() => msg('Failed','error'));
          }}>{editPRId ? 'Update' : 'Submit'}</Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Order Dialog */}
      <Dialog open={openPO} onClose={() => setOpenPO(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editPOId ? 'Update Order' : 'New Purchase Order'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(poForm, setPoForm, 'PR ID', 'purchase_request_id', { type: 'number' })}
          {F(poForm, setPoForm, 'Vendor Name *', 'vendor_name')}
          {F(poForm, setPoForm, 'Vendor Contact', 'vendor_contact')}
          {F(poForm, setPoForm, 'Vendor Email', 'vendor_email')}
          {F(poForm, setPoForm, 'Vendor Address', 'vendor_address', { xs: 12 })}
          {F(poForm, setPoForm, 'Order Date', 'order_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(poForm, setPoForm, 'Expected Delivery', 'expected_delivery', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(poForm, setPoForm, 'Subtotal', 'subtotal', { type: 'number' })}
          {F(poForm, setPoForm, 'Tax', 'tax_amount', { type: 'number' })}
          {F(poForm, setPoForm, 'Discount', 'discount_amount', { type: 'number' })}
          {F(poForm, setPoForm, 'Total Amount', 'total_amount', { type: 'number' })}
          {F(poForm, setPoForm, 'Payment Terms', 'payment_terms')}
          {Sel(poForm, setPoForm, 'Status', 'status', ['draft','sent','confirmed','delivered','completed','cancelled'])}
          {F(poForm, setPoForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPO(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            const fn = editPOId ? inventoryAPI.updatePurchaseOrder(editPOId, poForm) : inventoryAPI.createPurchaseOrder(poForm);
            fn.then(() => { msg(editPOId ? 'Updated' : 'Created'); setOpenPO(false); fetchPO(); }).catch(() => msg('Failed','error'));
          }}>{editPOId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Quotation Dialog */}
      <Dialog open={openQt} onClose={() => setOpenQt(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Vendor Quotation</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(qtForm, setQtForm, 'PR ID', 'purchase_request_id', { type: 'number' })}
          {F(qtForm, setQtForm, 'Vendor Name *', 'vendor_name')}
          {F(qtForm, setQtForm, 'Vendor Contact', 'vendor_contact')}
          {F(qtForm, setQtForm, 'Vendor Email', 'vendor_email')}
          {F(qtForm, setQtForm, 'Quotation #', 'quotation_number')}
          {F(qtForm, setQtForm, 'Date', 'quotation_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(qtForm, setQtForm, 'Valid Until', 'valid_until', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(qtForm, setQtForm, 'Total Amount', 'total_amount', { type: 'number' })}
          {F(qtForm, setQtForm, 'Delivery Days', 'delivery_days', { type: 'number' })}
          {F(qtForm, setQtForm, 'Payment Terms', 'payment_terms')}
          {F(qtForm, setQtForm, 'Warranty Terms', 'warranty_terms')}
          {F(qtForm, setQtForm, 'Rating (1-5)', 'rating', { type: 'number' })}
          {F(qtForm, setQtForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQt(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => inventoryAPI.createQuotation(qtForm).then(() => { msg('Added'); setOpenQt(false); fetchQt(); }).catch(() => msg('Failed','error'))}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Disposal Dialog */}
      <Dialog open={openDsp} onClose={() => setOpenDsp(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editDspId ? 'Update Disposal' : 'New Asset Disposal'}</DialogTitle>
        <DialogContent><Grid container spacing={2} sx={{ mt: 0.5 }}>
          {F(dspForm, setDspForm, 'Asset ID *', 'asset_id', { type: 'number' })}
          {Sel(dspForm, setDspForm, 'Type', 'disposal_type', ['sale','auction','scrap','donation','write_off'])}
          {F(dspForm, setDspForm, 'Date', 'disposal_date', { type: 'date', InputLabelProps: { shrink: true } })}
          {F(dspForm, setDspForm, 'Book Value', 'book_value', { type: 'number' })}
          {F(dspForm, setDspForm, 'Disposal Value', 'disposal_value', { type: 'number' })}
          {F(dspForm, setDspForm, 'Buyer Name', 'buyer_name')}
          {F(dspForm, setDspForm, 'Buyer Contact', 'buyer_contact')}
          {Sel(dspForm, setDspForm, 'Status', 'status', ['pending','approved','completed','cancelled'])}
          {F(dspForm, setDspForm, 'Reason', 'reason', { xs: 12, multiline: true, rows: 2 })}
          {F(dspForm, setDspForm, 'Notes', 'notes', { xs: 12, multiline: true, rows: 2 })}
        </Grid></DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDsp(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => {
            const fn = editDspId ? inventoryAPI.updateDisposal(editDspId, dspForm) : inventoryAPI.createDisposal(dspForm);
            fn.then(() => { msg(editDspId ? 'Updated' : 'Created'); setOpenDsp(false); fetchDsp(); }).catch(() => msg('Failed','error'));
          }}>{editDspId ? 'Update' : 'Submit'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
