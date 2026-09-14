import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../components/Screen';
import { teacherAPI } from '../../api/teacher';

export default function MarksEntrySheetScreen({ route, navigation }) {
  const { examScheduleId, title } = route.params;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: title || 'Marks Entry' });
  }, [navigation, title]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getMarksSheet(examScheduleId);
      const raw = res.data.data?.students || [];
      setStudents(
        raw.map((s) => {
          const subj = (s.subjects || [])[0] || {};
          return {
            student_id: s.student_id,
            name: s.student_name,
            roll_no: s.roll_no,
            max_marks: subj.max_marks,
            marks: subj.marks_obtained != null ? String(subj.marks_obtained) : '',
            is_absent: !!subj.is_absent,
          };
        })
      );
    } catch (e) {
      Alert.alert('Error', 'Could not load marks sheet.');
    } finally {
      setLoading(false);
    }
  }, [examScheduleId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateMarks = (studentId, value) => {
    setStudents((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, marks: value } : s)));
  };

  const toggleAbsent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, is_absent: !s.is_absent, marks: '' } : s))
    );
  };

  const submit = async () => {
    setSaving(true);
    try {
      await teacherAPI.submitMarks({
        exam_schedule_id: examScheduleId,
        entries: students.map((s) => ({
          student_id: s.student_id,
          marks_obtained: s.is_absent ? null : Number(s.marks) || 0,
          is_absent: s.is_absent,
        })),
      });
      Alert.alert('Saved', 'Marks submitted successfully.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not submit marks.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.list}>
        {students.map((s) => (
          <View key={s.student_id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.roll}>Roll No {s.roll_no}</Text>
            </View>
            {s.is_absent ? (
              <Text style={styles.absentLabel}>Absent</Text>
            ) : (
              <TextInput
                style={styles.marksInput}
                keyboardType="numeric"
                value={s.marks}
                onChangeText={(v) => updateMarks(s.student_id, v)}
                placeholder={`/${s.max_marks}`}
              />
            )}
            <TouchableOpacity style={styles.absentToggle} onPress={() => toggleAbsent(s.student_id)}>
              <Text style={styles.absentToggleText}>{s.is_absent ? 'Present' : 'Absent'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {students.length > 0 && (
        <TouchableOpacity style={styles.submitButton} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Marks</Text>}
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 8,
  },
  name: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  roll: { fontSize: 11, color: '#888', marginTop: 2 },
  marksInput: {
    width: 64,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  absentLabel: { width: 64, textAlign: 'center', color: '#e74c3c', fontWeight: '700', fontSize: 12 },
  absentToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f0f0' },
  absentToggleText: { fontSize: 11, fontWeight: '700', color: '#666' },
  submitButton: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
