import React, { useCallback, useEffect, useState } from 'react';
import Screen from '../../components/Screen';
import ExamResults from '../../components/ExamResults';
import { studentPortalAPI } from '../../api/student';

export default function StudentExamsScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.exams();
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
      <ExamResults
        upcoming={data?.upcoming}
        resultsByExam={data?.results_by_exam}
        reportCards={data?.report_cards}
      />
    </Screen>
  );
}
