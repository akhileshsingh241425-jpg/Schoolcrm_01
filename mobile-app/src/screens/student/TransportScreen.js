import React, { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import { studentPortalAPI } from '../../api/student';

export default function TransportScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.transport();
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

  if (data && !data.has_transport) {
    return (
      <Screen refreshing={refreshing} onRefresh={onRefresh}>
        <Card>
          <Text style={styles.empty}>No transport assigned.</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <CardTitle>Bus Route</CardTitle>
        <InfoRow label="Route" value={data?.route_name} />
        <InfoRow label="Bus No" value={data?.bus_number} />
        <InfoRow label="Shift" value={data?.shift} />
      </Card>
      <Card>
        <CardTitle>Pickup Point</CardTitle>
        <InfoRow label="Stop" value={data?.stop_name} />
        <InfoRow label="Pickup Time" value={data?.pickup_time} />
        <InfoRow label="Drop Time" value={data?.drop_time} />
      </Card>
      <Card>
        <CardTitle>Driver / Helper</CardTitle>
        <InfoRow label="Driver" value={data?.driver_name} />
        <InfoRow label="Driver Phone" value={data?.driver_phone} />
        <InfoRow label="Helper" value={data?.helper_name} />
        <InfoRow label="Helper Phone" value={data?.helper_phone} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ empty: { color: '#888', textAlign: 'center' } });
