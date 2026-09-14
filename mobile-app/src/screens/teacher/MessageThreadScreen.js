import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Screen from '../../components/Screen';
import { teacherAPI } from '../../api/teacher';

export default function MessageThreadScreen({ route, navigation }) {
  const { studentId, studentName, receiverId, parentName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: parentName ? `${parentName} (${studentName})` : studentName });
  }, [navigation, parentName, studentName]);

  const load = useCallback(async () => {
    try {
      const res = await teacherAPI.getMessages(studentId);
      const raw = res.data.data;
      const list = Array.isArray(raw) ? raw : raw?.items || [];
      setMessages([...list].reverse());
    } catch (e) {
      // keep whatever loaded last
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await teacherAPI.sendMessage({
        receiver_id: receiverId,
        receiver_type: 'parent',
        student_id: studentId,
        message: text.trim(),
      });
      setText('');
      await load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll onRefresh={load} refreshing={false}>
        {loading && <ActivityIndicator style={{ marginTop: 40 }} />}
        {!loading && messages.length === 0 && <Text style={styles.empty}>No messages yet - say hello.</Text>}
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubbleRow, m.sender_type === 'teacher' ? styles.rowMine : styles.rowTheirs]}>
            <View style={[styles.bubble, m.sender_type === 'teacher' ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={m.sender_type === 'teacher' ? styles.textMine : styles.textTheirs}>{m.message}</Text>
              <Text style={m.sender_type === 'teacher' ? styles.timeMine : styles.timeTheirs}>
                {(m.created_at || '').slice(0, 16).replace('T', ' ')}
              </Text>
            </View>
          </View>
        ))}
      </Screen>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={send} disabled={sending}>
          {sending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { color: '#888', textAlign: 'center', marginTop: 20 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: '#4361ee' },
  bubbleTheirs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  textMine: { color: '#fff', fontSize: 14 },
  textTheirs: { color: '#1a1a2e', fontSize: 14 },
  timeMine: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  timeTheirs: { fontSize: 10, color: '#999', marginTop: 4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4361ee',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendText: { color: '#fff', fontWeight: '700' },
});
