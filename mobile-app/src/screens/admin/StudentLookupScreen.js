import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import Screen from '../../components/Screen';
import { Card } from '../../components/Card';
import { adminAPI } from '../../api/admin';

export default function StudentLookupScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await adminAPI.searchStudents(q.trim());
      const raw = res.data.data;
      setResults(Array.isArray(raw) ? raw : raw?.items || []);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  const onChangeText = (text) => {
    setQuery(text);
    search(text);
  };

  return (
    <Screen>
      <TextInput
        style={styles.input}
        placeholder="Search by name, admission no, or roll no"
        value={query}
        onChangeText={onChangeText}
      />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {!loading && searched && results.length === 0 && (
        <Card>
          <Text style={styles.empty}>No students found.</Text>
        </Card>
      )}

      {results.map((s) => (
        <Card key={s.admission_no || s.id}>
          <Text style={styles.name}>
            {s.first_name} {s.last_name || ''}
          </Text>
          <Text style={styles.meta}>
            {s.current_class?.name || s.class_name}
            {s.current_section?.name ? `-${s.current_section.name}` : ''} · Roll No {s.roll_no}
          </Text>
          {!!s.father_name && (
            <Text style={styles.contact}>
              {s.father_name} {s.father_phone ? `· ${s.father_phone}` : ''}
            </Text>
          )}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  empty: { color: '#888', textAlign: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 12, color: '#888', marginTop: 4 },
  contact: { fontSize: 12, color: '#4361ee', marginTop: 6, fontWeight: '600' },
});
