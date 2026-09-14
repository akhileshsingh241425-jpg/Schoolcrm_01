import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import { teacherAPI } from '../../api/teacher';

const STATUS_CYCLE = ['present', 'absent', 'late'];
const STATUS_COLOR = { present: '#2ecc71', absent: '#e74c3c', late: '#f39c12' };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MarkAttendanceScreen({ route, navigation }) {
  const { sectionId, classId, className } = route.params;
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: className || 'Mark Attendance' });
  }, [navigation, className]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getRoster(sectionId, date);
      const raw = res.data.data;
      const list = Array.isArray(raw) ? raw : raw?.students || raw?.items || [];
      setStudents(
        list.map((s) => ({
          student_id: s.student_id || s.id,
          name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
          roll_no: s.roll_no,
          status: s.status || 'present',
        }))
      );
    } catch (e) {
      Alert.alert('Error', 'Could not load class roster for this date.');
    } finally {
      setLoading(false);
    }
  }, [sectionId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const cycleStatus = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.student_id !== studentId) return s;
        const nextIndex = (STATUS_CYCLE.indexOf(s.status) + 1) % STATUS_CYCLE.length;
        return { ...s, status: STATUS_CYCLE[nextIndex] };
      })
    );
  };

  const submit = async () => {
    setSaving(true);
    try {
      await teacherAPI.markAttendance({
        class_id: classId,
        section_id: sectionId,
        date,
        entries: students.map((s) => ({ student_id: s.student_id, status: s.status })),
      });
      Alert.alert('Saved', 'Attendance submitted successfully.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Date</Text>
        <TextInput style={styles.dateInput} value={date} onChangeText={setDate} onBlur={load} placeholder="YYYY-MM-DD" />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.list}>
          {students.length === 0 && <Text style={styles.empty}>No students found for this date.</Text>}
          {students.map((s) => (
            <TouchableOpacity key={s.student_id} style={styles.row} onPress={() => cycleStatus(s.student_id)}>
              <View>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.roll}>Roll No {s.roll_no}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[s.status] + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[s.status] }]}>{s.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {students.length > 0 && (
        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Attendance</Text>}
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  dateLabel: { fontWeight: '700', color: '#333', marginRight: 10 },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: { flex: 1, paddingHorizontal: 16 },
  empty: { color: '#888', marginTop: 20, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  name: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  roll: { fontSize: 11, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  submitButton: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
