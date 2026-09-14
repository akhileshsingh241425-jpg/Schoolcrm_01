import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/admin/DashboardScreen';
import LeaveApprovalsScreen from '../screens/admin/LeaveApprovalsScreen';
import StudentLookupScreen from '../screens/admin/StudentLookupScreen';
import FeesSummaryScreen from '../screens/admin/FeesSummaryScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4361ee' }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Leaves" component={LeaveApprovalsScreen} />
      <Tab.Screen name="Students" component={StudentLookupScreen} />
      <Tab.Screen name="Fees" component={FeesSummaryScreen} />
    </Tab.Navigator>
  );
}
