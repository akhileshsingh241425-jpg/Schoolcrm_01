import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import InfoRow from '../../components/InfoRow';
import AttendanceSummary from '../../components/AttendanceSummary';
import TimetableGrid from '../../components/TimetableGrid';
import FeesSummary from '../../components/FeesSummary';
import ExamResults from '../../components/ExamResults';
import HomeworkList from '../../components/HomeworkList';
import { parentAPI } from '../../api/parent';

const TABS = ['Attendance', 'Timetable', 'Fees', 'Exams', 'Homework', 'Profile'];

export default function ChildDetailScreen({ route, navigation }) {
  const { studentId, name } = route.params;
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('Attendance');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: name || 'Child Detail' });
  }, [navigation, name]);

  const load = useCallback(async () => {
    const res = await parentAPI.getChildOverview(studentId);
    setData(res.data.data);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const classTeacher = data?.class_teacher;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === 'Attendance' && (
        <AttendanceSummary
          summary={data?.attendance?.summary || data?.attendance}
          monthly={data?.attendance?.monthly}
          recent={data?.attendance?.recent}
        />
      )}

      {tab === 'Timetable' && <TimetableGrid entries={data?.timetable || []} />}

      {tab === 'Fees' && <FeesSummary feesData={data?.fees} />}

      {tab === 'Exams' && (
        <ExamResults
          upcoming={data?.upcoming_exams}
          resultsByExam={data?.exams?.results_by_exam}
          reportCards={data?.exams?.report_cards}
        />
      )}

      {tab === 'Homework' && <HomeworkList items={data?.homework} />}

      {tab === 'Profile' && (
        <>
          <Card>
            <CardTitle>Student Info</CardTitle>
            <InfoRow label="Name" value={data?.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : name} />
            <InfoRow label="Class" value={data?.current_class?.name} />
            <InfoRow label="Section" value={data?.current_section?.name} />
          </Card>
          {classTeacher && (
            <Card>
              <CardTitle>Class Teacher</CardTitle>
              <InfoRow label="Name" value={classTeacher.name} />
              <InfoRow label="Phone" value={classTeacher.phone} />
              <InfoRow label="Email" value={classTeacher.email} />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabScroll: { marginBottom: 16 },
  tabRow: { backgroundColor: '#fff', borderRadius: 10, padding: 4, gap: 4 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#4361ee' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#666' },
  tabTextActive: { color: '#fff' },
});
