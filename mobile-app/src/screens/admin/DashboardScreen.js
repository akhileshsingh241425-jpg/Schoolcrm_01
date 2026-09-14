import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import StatTile from '../../components/StatTile';
import { adminAPI } from '../../api/admin';
import useAuthStore from '../../store/authStore';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await adminAPI.getDashboard();
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

  const stats = data?.stats || {};
  const attendance = stats.attendance_today || {};

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.first_name || user?.name || 'Admin'}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <CardTitle>Overview</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Students" value={stats.total_students ?? 0} color="#4361ee" />
          <StatTile label="Staff" value={stats.total_staff ?? 0} color="#9b59b6" />
        </View>
      </Card>

      <Card>
        <CardTitle>Today's Attendance</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Present" value={attendance.present ?? 0} color="#2ecc71" />
          <StatTile label="Marked" value={attendance.total_marked ?? 0} color="#888" />
          <StatTile label="Percent" value={`${Math.round(attendance.percentage ?? 0)}%`} color="#4361ee" />
        </View>
      </Card>

      <Card>
        <CardTitle>This Month</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Fee Collection" value={fmt(stats.monthly_fee_collection)} color="#2ecc71" />
          <StatTile label="New Leads" value={stats.new_leads_this_month ?? 0} color="#f39c12" />
          <StatTile label="Pending Admissions" value={stats.pending_admissions ?? 0} color="#e74c3c" />
        </View>
      </Card>

      {(data?.recent_payments || []).length > 0 && (
        <Card>
          <CardTitle>Recent Payments</CardTitle>
          {data.recent_payments.map((p, idx) => (
            <View key={p.id ?? idx} style={styles.row}>
              <Text style={styles.rowTitle}>{p.student_name || p.student?.first_name}</Text>
              <Text style={styles.rowAmount}>{fmt(p.amount_paid ?? p.amount)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  logout: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
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
