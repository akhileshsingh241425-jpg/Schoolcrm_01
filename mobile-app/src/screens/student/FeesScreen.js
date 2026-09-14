import React, { useCallback, useEffect, useState } from 'react';
import Screen from '../../components/Screen';
import FeesSummary from '../../components/FeesSummary';
import { studentPortalAPI } from '../../api/student';

export default function StudentFeesScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.fees();
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

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <FeesSummary feesData={data} />
    </Screen>
  );
}
