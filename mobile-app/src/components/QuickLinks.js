import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';

// links: [{ label, icon (emoji), onPress, color }]
export default function QuickLinks({ links }) {
  return (
    <Card>
      <CardTitle>Quick Links</CardTitle>
      <View style={styles.grid}>
        {links.map((l) => (
          <TouchableOpacity key={l.label} style={styles.tile} onPress={l.onPress}>
            <View style={[styles.iconWrap, { backgroundColor: (l.color || '#4361ee') + '18' }]}>
              <Text style={styles.icon}>{l.icon}</Text>
            </View>
            <Text style={styles.label}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  tile: { width: '25%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: { fontSize: 22 },
  label: { fontSize: 11, fontWeight: '600', color: '#444', textAlign: 'center' },
});
