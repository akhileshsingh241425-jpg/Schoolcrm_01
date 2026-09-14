import React, { useCallback, useEffect, useState } from 'react';
import Screen from '../../components/Screen';
import AnnouncementsList from '../../components/AnnouncementsList';
import { studentPortalAPI } from '../../api/student';

export default function StudentAnnouncementsScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.announcements();
    setItems(res.data.data || []);
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
      <AnnouncementsList items={items} />
    </Screen>
  );
}
