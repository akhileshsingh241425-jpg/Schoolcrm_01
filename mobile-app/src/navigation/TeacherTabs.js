import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/teacher/DashboardScreen';
import MarkAttendanceScreen from '../screens/teacher/MarkAttendanceScreen';
import TimetableScreen from '../screens/teacher/TimetableScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="TeacherDashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
    </HomeStack.Navigator>
  );
}

export default function TeacherTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4361ee' }}>
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Timetable" component={TimetableScreen} />
    </Tab.Navigator>
  );
}
