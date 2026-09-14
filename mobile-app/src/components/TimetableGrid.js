import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday' };

// entries: [{day_of_week, period_number, is_break, start_time, end_time, subject_name, class_name, section_name, room_no}]
export default function TimetableGrid({ entries = [] }) {
  const byDay = {};
  for (const day of DAYS) byDay[day] = [];
  for (const entry of entries) {
    const day = (entry.day_of_week || '').toLowerCase();
    if (byDay[day]) byDay[day].push(entry);
  }

  const daysWithData = DAYS.filter((d) => byDay[d].length > 0);

  if (daysWithData.length === 0) {
    return (
      <Card>
        <Text style={styles.empty}>No timetable available yet.</Text>
      </Card>
    );
  }

  return (
    <>
      {daysWithData.map((day) => {
        const periods = [...byDay[day]].sort((a, b) => (a.period_number || 0) - (b.period_number || 0));
        return (
          <Card key={day}>
            <CardTitle>{DAY_LABELS[day] || day}</CardTitle>
            {periods.map((p, idx) => (
              <View key={idx} style={[styles.periodRow, p.is_break && styles.breakRow]}>
                <View style={styles.periodBadge}>
                  <Text style={styles.periodBadgeText}>{p.period_number ?? '-'}</Text>
                </View>
                <View style={styles.periodInfo}>
                  <Text style={styles.subject}>
                    {p.is_break ? 'Break' : p.subject_name || 'Subject'}
                  </Text>
                  {!p.is_break && (
                    <Text style={styles.meta}>
                      {[p.class_name && p.section_name ? `${p.class_name}-${p.section_name}` : null, p.teacher_name, p.room_no ? `Room ${p.room_no}` : null]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  )}
                </View>
                <Text style={styles.time}>
                  {(p.start_time || '').slice(0, 5)}-{(p.end_time || '').slice(0, 5)}
                </Text>
              </View>
            ))}
          </Card>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  breakRow: { opacity: 0.6 },
  periodBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4361ee20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  periodBadgeText: { fontSize: 12, fontWeight: '700', color: '#4361ee' },
  periodInfo: { flex: 1 },
  subject: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 11, color: '#777', marginTop: 1 },
  time: { fontSize: 11, color: '#888', fontWeight: '600' },
  empty: { color: '#888', textAlign: 'center' },
});
