import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatTile({ label, value, color = '#4361ee' }) {
  return (
    <View style={[styles.tile, { backgroundColor: color + '15', borderColor: color + '30' }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  value: { fontSize: 20, fontWeight: '800' },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
});
