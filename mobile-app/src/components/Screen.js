import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({ children, scroll = true, refreshing, onRefresh, style }) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, style]}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, style]}>{children}</View>
  );

  return <SafeAreaView style={styles.flex}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f6fa' },
  scrollContent: { padding: 16, backgroundColor: '#f5f6fa', flexGrow: 1 },
});
