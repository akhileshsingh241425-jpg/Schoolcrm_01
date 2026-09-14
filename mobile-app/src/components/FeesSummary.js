import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';
import StatTile from './StatTile';
import { normalizeFees } from '../utils/fees';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// feesData: the raw `fees` object from either /student/fees or the parent
// child-overview bundle - normalizeFees() reconciles the differing shapes.
export default function FeesSummary({ feesData }) {
  const summary = normalizeFees(feesData);
  const installments = feesData?.installments || [];
  const payments = feesData?.recent_payments || [];

  return (
    <>
      <Card>
        <CardTitle>Fees Summary</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Total" value={fmt(summary.total)} color="#4361ee" />
          <StatTile label="Paid" value={fmt(summary.paid)} color="#2ecc71" />
          <StatTile label="Pending" value={fmt(summary.pending)} color="#e74c3c" />
        </View>
        {summary.overdue_count > 0 && (
          <Text style={styles.overdue}>{summary.overdue_count} installment(s) overdue</Text>
        )}
      </Card>

      {installments.length > 0 && (
        <Card>
          <CardTitle>Installments</CardTitle>
          {installments.map((inst, idx) => (
            <View key={inst.id ?? idx} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{inst.description || `Installment ${inst.installment_no ?? ''}`}</Text>
                <Text style={styles.rowMeta}>Due {inst.due_date}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowAmount}>{fmt(inst.amount)}</Text>
                <Text style={[styles.rowStatus, statusColor(inst.status)]}>{inst.status}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <CardTitle>Recent Payments</CardTitle>
          {payments.map((p, idx) => (
            <View key={p.id ?? idx} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{p.payment_mode || 'Payment'}</Text>
                <Text style={styles.rowMeta}>{p.payment_date}</Text>
              </View>
              <Text style={styles.rowAmount}>{fmt(p.amount_paid ?? p.amount)}</Text>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

function statusColor(status) {
  if (status === 'paid') return { color: '#2ecc71' };
  if (status === 'overdue') return { color: '#e74c3c' };
  return { color: '#f39c12' };
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: 'row' },
  overdue: { color: '#e74c3c', fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  rowMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  rowStatus: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },
});
