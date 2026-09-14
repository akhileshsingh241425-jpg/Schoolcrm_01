import React, { useCallback, useEffect, useState } from 'react';
import Screen from '../../components/Screen';
import AttendanceSummary from '../../components/AttendanceSummary';
import { studentPortalAPI } from '../../api/student';

export default function StudentAttendanceScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.attendance();
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
      <AttendanceSummary
        summary={data?.summary}
        monthly={data?.monthly}
        recent={data?.recent}
      />
    </Screen>
  );
}
