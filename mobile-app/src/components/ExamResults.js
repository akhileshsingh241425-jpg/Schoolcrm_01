import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardTitle } from './Card';

export default function ExamResults({ upcoming = [], resultsByExam = [], reportCards = [] }) {
  return (
    <>
      {upcoming.length > 0 && (
        <Card>
          <CardTitle>Upcoming Exams</CardTitle>
          {upcoming.map((e, idx) => (
            <View key={e.id ?? idx} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{e.exam_name} - {e.subject?.name || e.subject_name}</Text>
                <Text style={styles.rowMeta}>{e.exam_date} · {(e.start_time || '').slice(0, 5)}</Text>
              </View>
              <Text style={styles.rowMeta}>Max {e.max_marks}</Text>
            </View>
          ))}
        </Card>
      )}

      {resultsByExam.map((exam, idx) => (
        <Card key={idx}>
          <CardTitle>{exam.exam}</CardTitle>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              {exam.obtained}/{exam.total_marks} ({Math.round(exam.percentage ?? 0)}%)
            </Text>
            {!!exam.grade && <Text style={styles.grade}>{exam.grade}</Text>}
          </View>
          {(exam.subjects || []).map((s, sIdx) => (
            <View key={sIdx} style={styles.row}>
              <Text style={styles.rowTitle}>{s.subject_name}</Text>
              <Text style={styles.rowMeta}>
                {s.is_absent ? 'Absent' : `${s.marks_obtained}/${s.max_marks}`}
              </Text>
            </View>
          ))}
        </Card>
      ))}

      {reportCards.length > 0 && (
        <Card>
          <CardTitle>Report Cards</CardTitle>
          {reportCards.map((rc, idx) => (
            <View key={rc.id ?? idx} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{rc.exam_name}</Text>
                <Text style={styles.rowMeta}>
                  {Math.round(rc.percentage ?? 0)}% · Grade {rc.grade}
                  {rc.rank_in_class ? ` · Rank ${rc.rank_in_class}/${rc.total_students}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {upcoming.length === 0 && resultsByExam.length === 0 && reportCards.length === 0 && (
        <Card>
          <Text style={styles.empty}>No exam data available yet.</Text>
        </Card>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a2e', flexShrink: 1 },
  rowMeta: { fontSize: 12, color: '#888' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryText: { fontSize: 14, fontWeight: '700', color: '#4361ee' },
  grade: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ecc71',
    backgroundColor: '#2ecc7120',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  empty: { color: '#888', textAlign: 'center' },
});
