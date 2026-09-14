import React, { useCallback, useEffect, useState } from 'react';
import Screen from '../../components/Screen';
import TimetableGrid from '../../components/TimetableGrid';
import { teacherAPI } from '../../api/teacher';

export default function TeacherTimetableScreen() {
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await teacherAPI.getMyTimetable();
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
