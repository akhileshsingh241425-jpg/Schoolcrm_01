import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Screen from '../../components/Screen';
import { teacherAPI } from '../../api/teacher';

const AUDIENCES = [
  { value: 'students', label: 'Students' },
  { value: 'parents', label: 'Parents' },
  { value: 'all', label: 'Everyone' },
  { value: 'class_specific', label: 'One Class' },
];

export default function NoticeScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('students');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await teacherAPI.getMySubjects();
      const list = res.data.data || [];
      const uniqueClasses = [];
      const seen = new Set();
      for (const a of list) {
        if (!seen.has(a.class_id)) {
          seen.add(a.class_id);
          uniqueClasses.push(a);
        }
      }
      setClasses(uniqueClasses);
      if (uniqueClasses.length > 0) setSelectedClass(uniqueClasses[0]);
    } catch (e) {
      // class picker just stays empty; class_specific audience won't be usable
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const submit = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and message are required.');
      return;
    }
    if (audience === 'class_specific' && !selectedClass) {
      Alert.alert('Error', 'Select a class.');
      return;
    }
    setSaving(true);
    try {
      await teacherAPI.postAnnouncement({
        title: title.trim(),
        message: message.trim(),
        target_audience: audience,
        target_class_id: audience === 'class_specific' ? selectedClass.class_id : undefined,
        is_published: true,
      });
      Alert.alert('Posted', 'Notice published successfully.');
      setTitle('');
      setMessage('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not post notice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.label}>Send To</Text>
      <View style={styles.chipRow}>
        {AUDIENCES.map((a) => (
          <TouchableOpacity
            key={a.value}
            style={[styles.chip, audience === a.value && styles.chipActive]}
            onPress={() => setAudience(a.value)}
          >
            <Text style={[styles.chipText, audience === a.value && styles.chipTextActive]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {audience === 'class_specific' && (
        <>
          <Text style={styles.label}>Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {classes.map((c, idx) => {
              const active = selectedClass?.class_id === c.class_id;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedClass(c)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.class_name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. PTM on Friday" />

      <Text style={styles.label}>Message</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={message}
        onChangeText={setMessage}
        placeholder="Details of the notice"
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post Notice</Text>}
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 8 },
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
  multiline: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
