import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Screen from '../../components/Screen';
import { Card } from '../../components/Card';
import { adminAPI } from '../../api/admin';

export default function LeaveApprovalsScreen() {
  const [leaves, setLeaves] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async () => {
    const res = await adminAPI.getLeaves('pending');
    const raw = res.data.data;
    setLeaves(Array.isArray(raw) ? raw : raw?.items || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const act = async (id, action) => {
    setActingId(id);
    try {
      await adminAPI.approveLeave(id, action);
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update leave request.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {leaves.length === 0 && (
        <Card>
          <Text style={styles.empty}>No pending leave requests.</Text>
        </Card>
      )}
      {leaves.map((l) => (
        <Card key={l.id}>
          <Text style={styles.name}>{l.staff_name || l.staff?.first_name || 'Staff'}</Text>
          <Text style={styles.meta}>
            {l.leave_type} · {l.start_date} to {l.end_date}
          </Text>
          {!!l.reason && <Text style={styles.reason}>{l.reason}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.approve]}
              onPress={() => act(l.id, 'approve')}
              disabled={actingId === l.id}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.reject]}
              onPress={() => act(l.id, 'reject')}
              disabled={actingId === l.id}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888', textAlign: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  reason: { fontSize: 13, color: '#444', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  approve: { backgroundColor: '#2ecc71' },
  reject: { backgroundColor: '#e74c3c' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
