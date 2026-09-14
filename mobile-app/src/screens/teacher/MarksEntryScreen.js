import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card } from '../../components/Card';
import { teacherAPI } from '../../api/teacher';

export default function MarksEntryScreen({ navigation }) {
  const [assignments, setAssignments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await teacherAPI.getMarksAssignments();
    setAssignments(res.data.data || []);
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
      {assignments.length === 0 && (
        <Card>
          <Text style={styles.empty}>No marks entry assignments right now.</Text>
        </Card>
      )}
      {assignments.map((a) => (
        <TouchableOpacity
          key={a.assignment_id}
          disabled={a.is_marks_locked}
          onPress={() =>
            navigation.navigate('MarksEntrySheet', {
              examScheduleId: a.exam_schedule_id,
              title: `${a.exam_name} - ${a.subject_name}`,
            })
          }
        >
          <Card style={a.is_marks_locked ? styles.locked : null}>
            <Text style={styles.title}>
              {a.exam_name} - {a.subject_name}
            </Text>
            <Text style={styles.meta}>
              {a.class_name}-{a.section_name} · Max {a.max_marks}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.progress}>
                {a.marks_entered}/{a.total_students} entered
              </Text>
              {a.is_marks_locked ? (
                <Text style={styles.lockedText}>Locked</Text>
              ) : a.is_overdue ? (
                <Text style={styles.overdue}>Overdue</Text>
              ) : (
                <Text style={styles.deadline}>Due {a.deadline}</Text>
              )}
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888', textAlign: 'center' },
  locked: { opacity: 0.5 },
  title: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  progress: { fontSize: 12, fontWeight: '700', color: '#4361ee' },
  overdue: { fontSize: 12, fontWeight: '700', color: '#e74c3c' },
  lockedText: { fontSize: 12, fontWeight: '700', color: '#888' },
  deadline: { fontSize: 12, color: '#888' },
});
