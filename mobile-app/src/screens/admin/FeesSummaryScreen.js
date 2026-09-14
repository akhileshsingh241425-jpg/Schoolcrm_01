import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import StatTile from '../../components/StatTile';
import { adminAPI } from '../../api/admin';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function FeesSummaryScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await adminAPI.getFeesDashboard();
    setData(res.data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <CardTitle>Collection</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Collected" value={fmt(data?.total_collected)} color="#2ecc71" />
          <StatTile label="Pending" value={fmt(data?.total_pending)} color="#e74c3c" />
        </View>
        <View style={[styles.tileRow, { marginTop: 8 }]}>
          <StatTile label="This Month" value={fmt(data?.monthly_collection)} color="#4361ee" />
          <StatTile label="Defaulters" value={data?.defaulter_count ?? 0} color="#f39c12" />
        </View>
      </Card>

      {(data?.category_wise || []).length > 0 && (
        <Card>
          <CardTitle>By Category</CardTitle>
          {data.category_wise.map((c, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.rowTitle}>{c.category || c.name}</Text>
              <Text style={styles.rowAmount}>{fmt(c.amount ?? c.collected)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: 'row' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  rowAmount: { fontSize: 13, fontWeight: '700', color: '#2ecc71' },
});
