import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  Typography, RadioGroup, FormControlLabel, Radio, TextField,
  CircularProgress, Alert, Chip, Divider, Stack
} from '@mui/material';
import { Payment, CreditCard, AccountBalance, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { paymentAPI } from '../services/api';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function OnlinePaymentModal({ open, onClose, paymentData, onSuccess }) {
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null, 'processing', 'success', 'failed'
  const [error, setError] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (open) {
      fetchGateways();
      setStatus(null);
      setError('');
    }
  }, [open]);

  const fetchGateways = async () => {
    try {
      const res = await paymentAPI.getGatewayConfig();
      const data = res.data?.data || res.data;
      const available = (data.gateways || []).filter(g => g.enabled);
      setGateways(available);
      setSelectedGateway(data.default_gateway || (available[0]?.name) || '');
    } catch {
      setError('Payment gateways are not configured. Contact your school admin.');
    }
  };

  const handlePay = async () => {
    if (!selectedGateway) return;
    setLoading(true);
    setError('');

    if (selectedGateway === 'razorpay') {
      await handleRazorpay();
    } else if (selectedGateway === 'paytm') {
      await handlePaytm();
    }
    setLoading(false);
  };

  // ─── Razorpay Flow ───
  const handleRazorpay = async () => {
    const loaded = await loadScript(RAZORPAY_SCRIPT);
    if (!loaded) {
      setError('Failed to load Razorpay. Check your internet connection.');
      return;
    }

    try {
      const res = await paymentAPI.createRazorpayOrder({
        amount: paymentData.amount,
        student_id: paymentData.student_id,
        fee_structure_id: paymentData.fee_structure_id,
        installment_id: paymentData.installment_id,
        late_fee: paymentData.late_fee || 0,
        discount: paymentData.discount || 0,
        remarks: remarks,
      });

      const orderData = res.data?.data || res.data;
      setStatus('processing');

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.name || 'School Fee Payment',
        description: orderData.description || '',
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await paymentAPI.verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setStatus('success');
            if (onSuccess) onSuccess(verifyRes.data?.data || verifyRes.data);
          } catch (err) {
            setStatus('failed');
            setError('Payment verification failed. Contact support if amount was deducted.');
          }
        },
        prefill: {
          name: paymentData.student_name || '',
          email: paymentData.email || '',
          contact: paymentData.phone || '',
        },
        theme: { color: '#1976d2' },
        modal: {
          ondismiss: () => {
            setStatus(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setStatus('failed');
        setError(response.error?.description || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment order');
      setStatus(null);
    }
  };

  // ─── Paytm Flow ───
  const handlePaytm = async () => {
    try {
      const callbackUrl = `${window.location.origin}/payment-callback`;
      const res = await paymentAPI.initiatePaytm({
        amount: paymentData.amount,
        student_id: paymentData.student_id,
        fee_structure_id: paymentData.fee_structure_id,
        installment_id: paymentData.installment_id,
        late_fee: paymentData.late_fee || 0,
        discount: paymentData.discount || 0,
        remarks: remarks,
        callback_url: callbackUrl,
      });

      const paytmData = res.data?.data || res.data;
      setStatus('processing');

      // Create and submit Paytm form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paytmData.txn_url;
      form.style.display = 'none';

      Object.entries(paytmData.paytm_params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate Paytm payment');
      setStatus(null);
    }
  };

  const getGatewayIcon = (name) => {
    switch (name) {
      case 'razorpay': return <CreditCard color="primary" />;
      case 'paytm': return <AccountBalance color="primary" />;
      default: return <Payment color="primary" />;
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Payment color="primary" />
        Online Fee Payment
      </DialogTitle>

      <DialogContent>
        {/* Payment Summary */}
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">Payment Summary</Typography>
          <Stack direction="row" justifyContent="space-between" mt={1}>
            <Typography>Student</Typography>
            <Typography fontWeight={600}>{paymentData?.student_name || '-'}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography>Fee Amount</Typography>
            <Typography fontWeight={600} color="primary">
              ₹{Number(paymentData?.amount || 0).toLocaleString('en-IN')}
            </Typography>
          </Stack>
          {paymentData?.late_fee > 0 && (
            <Stack direction="row" justifyContent="space-between" mt={0.5}>
              <Typography>Late Fee</Typography>
              <Typography color="error">₹{Number(paymentData.late_fee).toLocaleString('en-IN')}</Typography>
            </Stack>
          )}
          {paymentData?.discount > 0 && (
            <Stack direction="row" justifyContent="space-between" mt={0.5}>
              <Typography>Discount</Typography>
              <Typography color="success.main">-₹{Number(paymentData.discount).toLocaleString('en-IN')}</Typography>
            </Stack>
          )}
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700} color="primary" variant="h6">
              ₹{Number((paymentData?.amount || 0) + (paymentData?.late_fee || 0) - (paymentData?.discount || 0)).toLocaleString('en-IN')}
            </Typography>
          </Stack>
        </Box>

        {/* Status Display */}
        {status === 'success' && (
          <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
            Payment completed successfully! Receipt has been generated.
          </Alert>
        )}
        {status === 'failed' && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
            {error || 'Payment failed. Please try again.'}
          </Alert>
        )}
        {error && !status && (
          <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {/* Gateway Selection */}
        {status !== 'success' && gateways.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Payment Method</Typography>
            <RadioGroup value={selectedGateway} onChange={(e) => setSelectedGateway(e.target.value)}>
              {gateways.map((gw) => (
                <FormControlLabel
                  key={gw.name}
                  value={gw.name}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getGatewayIcon(gw.name)}
                      <Typography>{gw.label}</Typography>
                      {gw.name === 'razorpay' && <Chip label="UPI, Cards, Net Banking" size="small" variant="outlined" />}
                      {gw.name === 'paytm' && <Chip label="Paytm Wallet, UPI, Cards" size="small" variant="outlined" />}
                    </Box>
                  }
                  sx={{
                    border: 1,
                    borderColor: selectedGateway === gw.name ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    mb: 1,
                    mx: 0,
                    px: 2,
                    py: 0.5,
                    bgcolor: selectedGateway === gw.name ? 'primary.50' : 'transparent',
                  }}
                />
              ))}
            </RadioGroup>

            <TextField
              fullWidth
              label="Remarks (Optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              size="small"
              sx={{ mt: 2 }}
            />
          </>
        )}

        {gateways.length === 0 && !error && (
          <Alert severity="info">Loading payment gateways...</Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {status === 'success' ? (
          <Button variant="contained" onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={loading || status === 'processing'}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handlePay}
              disabled={loading || !selectedGateway || gateways.length === 0 || status === 'processing'}
              startIcon={loading || status === 'processing' ? <CircularProgress size={20} /> : <Payment />}
            >
              {loading || status === 'processing' ? 'Processing...' : `Pay ₹${Number(paymentData?.amount || 0).toLocaleString('en-IN')}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
