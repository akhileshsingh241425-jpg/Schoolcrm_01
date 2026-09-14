import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import { teacherAPI } from '../../api/teacher';
import useAuthStore from '../../store/authStore';

export default function TeacherDashboardScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [classes, setClasses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await teacherAPI.getMyClasses();
    setClasses(res.data.data?.my_classes || []);
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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {user?.first_name || user?.name || 'Teacher'}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <CardTitle>My Classes</CardTitle>
        {classes.length === 0 && <Text style={styles.empty}>No classes assigned.</Text>}
        {classes.map((c, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.classRow}
            onPress={() =>
              navigation.navigate('MarkAttendance', {
                sectionId: c.section_id,
                classId: c.class_id,
                className: `${c.class_name}-${c.section_name}`,
              })
            }
          >
            <Text style={styles.className}>
              {c.class_name}-{c.section_name}
            </Text>
            <Text style={styles.markLink}>Mark Attendance →</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  logout: { color: '#e74c3c', fontWeight: '700', fontSize: 13 },
  empty: { color: '#888' },
  classRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  className: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  markLink: { fontSize: 12, fontWeight: '700', color: '#4361ee' },
});
