import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';
import StatTile from './StatTile';

// summary: {total_days, present, absent, late, percentage}
// monthly: [{month, present, absent, late, total}]
// recent: [{date, status}]
export default function AttendanceSummary({ summary = {}, monthly = [], recent = [] }) {
  const statusColor = { present: '#2ecc71', absent: '#e74c3c', late: '#f39c12', leave: '#3498db', half_day: '#9b59b6' };

  return (
    <>
      <Card>
        <CardTitle>Attendance Summary</CardTitle>
        <View style={styles.tileRow}>
          <StatTile label="Overall %" value={`${Math.round(summary.percentage ?? 0)}%`} color="#4361ee" />
          <StatTile label="Present" value={summary.present ?? 0} color="#2ecc71" />
          <StatTile label="Absent" value={summary.absent ?? 0} color="#e74c3c" />
          <StatTile label="Late" value={summary.late ?? 0} color="#f39c12" />
        </View>
      </Card>

      {monthly.length > 0 && (
        <Card>
          <CardTitle>Monthly Breakdown</CardTitle>
          {monthly.map((m, idx) => (
            <View key={idx} style={styles.monthRow}>
              <Text style={styles.monthLabel}>{m.month}</Text>
              <Text style={styles.monthValue}>
                {m.present}/{m.total} present
              </Text>
            </View>
          ))}
        </Card>
      )}

      {recent.length > 0 && (
        <Card>
          <CardTitle>Recent</CardTitle>
          {recent.map((r, idx) => (
            <View key={idx} style={styles.recentRow}>
              <Text style={styles.recentDate}>{r.date}</Text>
              <View style={[styles.badge, { backgroundColor: (statusColor[r.status] || '#888') + '20' }]}>
                <Text style={[styles.badgeText, { color: statusColor[r.status] || '#888' }]}>{r.status}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: 'row' },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  monthLabel: { color: '#333', fontWeight: '600', fontSize: 13 },
  monthValue: { color: '#666', fontSize: 13 },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  recentDate: { color: '#333', fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
});
