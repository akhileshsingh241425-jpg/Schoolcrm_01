import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import { studentPortalAPI } from '../../api/student';

export default function HostelScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.hostel();
    setData(res.data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (data && !data.has_hostel) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <Card>
          <Text style={styles.empty}>No hostel allocation on record.</Text>
        </Card>
      </Screen>
    );
  }

  const allocation = data?.allocation;
  const menu = data?.today_menu || [];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <CardTitle>Hostel Room</CardTitle>
        <InfoRow label="Block" value={allocation?.block_name} />
        <InfoRow label="Room No" value={allocation?.room_number} />
        <InfoRow label="Bed No" value={allocation?.bed_number} />
        <InfoRow label="Since" value={allocation?.allocation_date} />
      </Card>

      {menu.length > 0 && (
        <Card>
          <CardTitle>Today's Mess Menu</CardTitle>
          {menu.map((m, idx) => (
            <View key={m.id ?? idx} style={styles.row}>
              <Text style={styles.meal}>{m.meal_type}</Text>
              <Text style={styles.items}>{m.menu_items}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888', textAlign: 'center' },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  meal: { fontSize: 13, fontWeight: '700', color: '#4361ee', textTransform: 'capitalize' },
  items: { fontSize: 13, color: '#444', marginTop: 2 },
});
