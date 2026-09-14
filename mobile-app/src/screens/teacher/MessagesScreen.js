import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Screen from '../../components/Screen';
import { Card } from '../../components/Card';
import { teacherAPI } from '../../api/teacher';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MessagesScreen({ navigation }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    const res = await teacherAPI.getMyClasses();
    setClasses(res.data.data?.my_classes || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const openClass = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    try {
      const res = await teacherAPI.getRoster(cls.section_id, todayStr());
      const raw = res.data.data;
      const list = Array.isArray(raw) ? raw : raw?.students || raw?.items || [];
      setStudents(
        list.map((s) => ({
          student_id: s.student_id || s.id,
          name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
        }))
      );
    } catch (e) {
      Alert.alert('Error', 'Could not load class roster.');
    } finally {
      setLoading(false);
    }
  };

  const openStudent = async (student) => {
    setResolvingId(student.student_id);
    try {
      const res = await teacherAPI.getStudentDetail(student.student_id);
      const parents = (res.data.data?.parents || []).filter((p) => p.user_id);
      if (parents.length === 0) {
        Alert.alert('No parent account', 'This student\'s parent does not have a login yet, so they cannot be messaged.');
        return;
      }
      const parent = parents[0];
      navigation.navigate('MessageThread', {
        studentId: student.student_id,
        studentName: student.name,
        receiverId: parent.user_id,
        parentName: parent.name,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not load student details.');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading && !selectedClass) {
    return (
      <Screen>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  if (!selectedClass) {
    return (
      <Screen>
        {classes.length === 0 && (
          <Card>
            <Text style={styles.empty}>No classes assigned.</Text>
          </Card>
        )}
        {classes.map((c, idx) => (
          <TouchableOpacity key={idx} onPress={() => openClass(c)}>
            <Card>
              <Text style={styles.className}>
                {c.class_name}-{c.section_name}
              </Text>
              <Text style={styles.hint}>Tap to message a parent</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Screen>
    );
  }

  return (
    <Screen>
      <TouchableOpacity onPress={() => setSelectedClass(null)}>
        <Text style={styles.back}>← Back to classes</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <Card>
          {students.map((s) => (
            <TouchableOpacity
              key={s.student_id}
              style={styles.studentRow}
              onPress={() => openStudent(s)}
              disabled={resolvingId === s.student_id}
            >
              <Text style={styles.studentName}>{s.name}</Text>
              {resolvingId === s.student_id ? <ActivityIndicator size="small" /> : <Text style={styles.arrow}>→</Text>}
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888' },
  className: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  hint: { fontSize: 12, color: '#888', marginTop: 4 },
  back: { color: '#4361ee', fontWeight: '700', marginBottom: 12 },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  arrow: { color: '#4361ee', fontWeight: '700' },
});
