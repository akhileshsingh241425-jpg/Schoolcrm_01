import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useAuthStore from '../store/authStore';
import LoginScreen from '../screens/auth/LoginScreen';
import StudentTabs from './StudentTabs';
import ParentTabs from './ParentTabs';
import TeacherTabs from './TeacherTabs';

export default function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const logout = useAuthStore((s) => s.logout);
  const roleName = user?.role?.name;

  if (roleName === 'student') return <StudentTabs />;
  if (roleName === 'parent') return <ParentTabs />;
  if (roleName === 'teacher') return <TeacherTabs />;

  return (
    <View style={styles.center}>
      <Text style={styles.message}>
        This app currently supports student, parent and teacher accounts only.
      </Text>
      <TouchableOpacity onPress={logout}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { textAlign: 'center', color: '#666', marginBottom: 16, fontSize: 14 },
  logout: { color: '#4361ee', fontWeight: '700' },
});
