import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Screen from '../../components/Screen';
import { teacherAPI } from '../../api/teacher';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeworkAssignScreen() {
  const [allocations, setAllocations] = useState([]);
  const [selected, setSelected] = useState(null); // one allocation {class_id, section_id, subject_id, ...}
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherAPI.getMySubjects();
      const list = res.data.data || [];
      setAllocations(list);
      if (list.length > 0) setSelected(list[0]);
    } catch (e) {
      Alert.alert('Error', 'Could not load your classes/subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!selected) {
      Alert.alert('Error', 'Select a class and subject first.');
      return;
    }
    if (!title.trim() || !dueDate) {
      Alert.alert('Error', 'Title and due date are required.');
      return;
    }
    setSaving(true);
    try {
      await teacherAPI.assignHomework({
        class_id: selected.class_id,
        section_id: selected.section_id,
        subject_id: selected.subject_id,
        title: title.trim(),
        description,
        due_date: dueDate,
      });
      Alert.alert('Saved', 'Homework assigned successfully.');
      setTitle('');
      setDescription('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not assign homework.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.label}>Class / Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {allocations.map((a, idx) => {
          const active = selected === a;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelected(a)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {a.class_name}-{a.section_name} · {a.subject_name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {allocations.length === 0 && <Text style={styles.empty}>No class/subject allocations found.</Text>}
      </ScrollView>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Chapter 3 exercises" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Instructions for students (optional)"
        multiline
      />

      <Text style={styles.label}>Due Date</Text>
      <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />

      <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Assign Homework</Text>}
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 4 },
  chipRow: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#444' },
  chipTextActive: { color: '#fff' },
  empty: { color: '#888', paddingVertical: 10 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multiline: { height: 90, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
