import React, { useCallback, useEffect, useState } from 'react';
import Screen from '../../components/Screen';
import TimetableGrid from '../../components/TimetableGrid';
import { studentPortalAPI } from '../../api/student';

export default function StudentTimetableScreen() {
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.timetable();
    setEntries(res.data.data || []);
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
      <TimetableGrid entries={entries} />
    </Screen>
  );
}
