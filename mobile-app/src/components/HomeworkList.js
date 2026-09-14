import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';

export default function HomeworkList({ items = [] }) {
  return (
    <Card>
      <CardTitle>Homework</CardTitle>
      {items.length === 0 && <Text style={styles.empty}>No homework to show.</Text>}
      {items.map((h, idx) => (
        <View key={h.id ?? idx} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{h.title}</Text>
            <Text style={styles.meta}>
              {h.subject_name} · {h.teacher_name} · Due {h.due_date}
            </Text>
            {!!h.description && (
              <Text style={styles.description} numberOfLines={2}>
                {h.description}
              </Text>
            )}
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888' },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 11, color: '#888', marginTop: 2 },
  description: { fontSize: 12, color: '#555', marginTop: 4 },
});
