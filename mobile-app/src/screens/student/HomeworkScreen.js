import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import HomeworkList from '../../components/HomeworkList';
import { studentPortalAPI } from '../../api/student';

const TABS = ['pending', 'past'];

export default function StudentHomeworkScreen() {
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s) => {
    const res = await studentPortalAPI.homework({ status: s });
    setItems(res.data.data || []);
  }, []);

  useEffect(() => {
    load(status);
  }, [load, status]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(status);
    setRefreshing(false);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, status === t && styles.tabActive]} onPress={() => setStatus(t)}>
            <Text style={[styles.tabText, status === t && styles.tabTextActive]}>
              {t === 'pending' ? 'Pending' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <HomeworkList items={items} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#fff', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#4361ee' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#666' },
  tabTextActive: { color: '#fff' },
});
