import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import useAuthStore from '../store/authStore';
import { mobileAPI } from '../api/mobile';
import { isOlderVersion } from '../utils/version';
import { registerForPushNotifications } from '../utils/pushNotifications';
import LoginScreen from '../screens/auth/LoginScreen';
import UpdateRequiredScreen from '../screens/UpdateRequiredScreen';
import StudentTabs from './StudentTabs';
import ParentTabs from './ParentTabs';
import TeacherTabs from './TeacherTabs';
import AdminTabs from './AdminTabs';

export default function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);
  const logout = useAuthStore((s) => s.logout);

  const [updateInfo, setUpdateInfo] = useState(null); // set only if a forced update is needed
  const [checkingVersion, setCheckingVersion] = useState(true);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const currentVersion = Constants.expoConfig?.version;
    mobileAPI
      .getVersionInfo()
      .then((res) => {
        const info = res.data.data;
        if (isOlderVersion(currentVersion, info.min_version)) {
          setUpdateInfo(info);
        }
      })
      .catch(() => {
        // No internet / backend unreachable - don't block app usage on this check alone.
      })
      .finally(() => setCheckingVersion(false));
  }, []);

  if (checkingVersion || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  if (updateInfo) {
    return <UpdateRequiredScreen downloadUrl={updateInfo.download_url} changelog={updateInfo.changelog} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const roleName = user?.role?.name;

  if (roleName === 'student') return <StudentTabs />;
  if (roleName === 'parent') return <ParentTabs />;
  if (roleName === 'teacher') return <TeacherTabs />;
  if (roleName === 'school_admin' || roleName === 'principal') return <AdminTabs />;

  return (
    <View style={styles.center}>
      <Text style={styles.message}>
        This app currently supports student, parent, teacher and admin accounts only.
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
