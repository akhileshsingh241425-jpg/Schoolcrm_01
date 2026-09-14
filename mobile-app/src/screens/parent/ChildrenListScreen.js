import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card } from '../../components/Card';
import { parentAPI } from '../../api/parent';
import useAuthStore from '../../store/authStore';

export default function ChildrenListScreen({ navigation }) {
  const logout = useAuthStore((s) => s.logout);
  const [children, setChildren] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await parentAPI.listMyChildren();
    setChildren(res.data.data?.items || res.data.data || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.title}>My Children</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {children.length === 0 && <Text style={styles.empty}>No children linked to this account.</Text>}

      {children.map((child) => (
        <TouchableOpacity
          key={child.id}
          onPress={() => navigation.navigate('ChildDetail', { studentId: child.id, name: child.name })}
        >
          <Card>
            <Text style={styles.name}>{child.name}</Text>
            <Text style={styles.meta}>
              {child.class_name}
              {child.section_name ? `-${child.section_name}` : ''} • Roll No {child.roll_no}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  logout: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 12, color: '#777', marginTop: 4 },
  empty: { color: '#888' },
});
