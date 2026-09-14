import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';

export default function AnnouncementsList({ items = [] }) {
  return (
    <Card>
      <CardTitle>Announcements</CardTitle>
      {items.length === 0 && <Text style={styles.empty}>No announcements yet.</Text>}
      {items.map((a, idx) => (
        <View key={a.id ?? idx} style={styles.row}>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.message}>{a.message}</Text>
          <Text style={styles.meta}>{(a.published_at || a.created_at || '').slice(0, 10)}</Text>
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
  message: { fontSize: 13, color: '#444', marginTop: 4 },
  meta: { fontSize: 11, color: '#888', marginTop: 6 },
});
