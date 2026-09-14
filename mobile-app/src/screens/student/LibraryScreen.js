import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '../../components/Screen';
import { Card, CardTitle } from '../../components/Card';
import { studentPortalAPI } from '../../api/student';

function IssueRow({ issue }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{issue.book_title}</Text>
        <Text style={styles.meta}>
          Issued {issue.issue_date} · Due {issue.due_date}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.status, statusColor(issue.status)]}>{issue.status}</Text>
        {issue.fine_amount > 0 && !issue.fine_paid && (
          <Text style={styles.fine}>₹{issue.fine_amount} due</Text>
        )}
      </View>
    </View>
  );
}

function statusColor(status) {
  if (status === 'overdue') return { color: '#e74c3c' };
  if (status === 'returned') return { color: '#2ecc71' };
  if (status === 'lost') return { color: '#888' };
  return { color: '#4361ee' };
}

export default function LibraryScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await studentPortalAPI.library();
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

  const current = data?.current || [];
  const history = data?.history || [];

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Card>
        <CardTitle>Currently Issued</CardTitle>
        {current.length === 0 && <Text style={styles.empty}>No books issued right now.</Text>}
        {current.map((i) => (
          <IssueRow key={i.id} issue={i} />
        ))}
        {data?.total_fine_due > 0 && (
          <Text style={styles.totalFine}>Total fine due: ₹{data.total_fine_due}</Text>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardTitle>History</CardTitle>
          {history.map((i) => (
            <IssueRow key={i.id} issue={i} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { color: '#888' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  title: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  meta: { fontSize: 11, color: '#888', marginTop: 2 },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  fine: { fontSize: 11, color: '#e74c3c', marginTop: 2, fontWeight: '700' },
  totalFine: { color: '#e74c3c', fontWeight: '700', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
