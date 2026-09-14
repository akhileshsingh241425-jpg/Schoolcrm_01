import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function UpdateRequiredScreen({ downloadUrl, changelog }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.message}>
        A new version of the School CRM app is available. Please download and install it to
        continue.
      </Text>
      {!!changelog && <Text style={styles.changelog}>{changelog}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(downloadUrl)}>
        <Text style={styles.buttonText}>Download Update</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#f5f6fa',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 12 },
  message: { fontSize: 14, color: '#555', textAlign: 'center', marginBottom: 10 },
  changelog: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
