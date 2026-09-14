import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import StatTile from '../../components/StatTile';
import { studentPortalAPI } from '../../api/student';
import useAuthStore from '../../store/authStore';

export default function StudentDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await studentPortalAPI.dashboard();
      setData(res.data.data);
    } catch (e) {
      // Screen just shows whatever loaded last; pull-to-refresh lets the user retry.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const attendance = data?.attendance || {};
  const todayTimetable = data?.today_timetable || [];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.first_name || user?.name || 'Student'}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <CardTitle>Attendance</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Overall %" value={`${Math.round(attendance.percentage ?? 0)}%`} color="#4361ee" />
          <StatTile label="Present" value={attendance.present ?? 0} color="#2ecc71" />
          <StatTile label="Total Days" value={attendance.total_days ?? 0} color="#888" />
        </View>
      </Card>

      <Card>
        <CardTitle>Today's Timetable</CardTitle>
        {todayTimetable.length === 0 && <Text style={styles.empty}>No periods scheduled today.</Text>}
        {todayTimetable.map((t, idx) => (
          <View key={idx} style={styles.periodRow}>
            <Text style={styles.periodTime}>{(t.start_time || '').slice(0, 5)}</Text>
            <Text style={styles.periodSubject}>{t.is_break ? 'Break' : t.subject_name}</Text>
            {!!t.room_no && <Text style={styles.periodRoom}>Room {t.room_no}</Text>}
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  logout: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
  tileRow: { flexDirection: 'row' },
  empty: { color: '#888' },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  periodTime: { width: 50, fontSize: 12, color: '#888', fontWeight: '600' },
  periodSubject: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  periodRoom: { fontSize: 11, color: '#888' },
});
