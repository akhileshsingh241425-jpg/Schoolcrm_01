import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  label: { color: '#666', fontSize: 13, fontWeight: '600' },
  value: { color: '#1a1a2e', fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
