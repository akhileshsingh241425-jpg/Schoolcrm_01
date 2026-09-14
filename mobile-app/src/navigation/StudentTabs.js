import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/student/DashboardScreen';
import AttendanceScreen from '../screens/student/AttendanceScreen';
import TimetableScreen from '../screens/student/TimetableScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import FeesScreen from '../screens/student/FeesScreen';
import ExamsScreen from '../screens/student/ExamsScreen';
import HomeworkScreen from '../screens/student/HomeworkScreen';
import AnnouncementsScreen from '../screens/student/AnnouncementsScreen';
import HostelScreen from '../screens/student/HostelScreen';
import TransportScreen from '../screens/student/TransportScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="StudentDashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="Fees" component={FeesScreen} />
      <HomeStack.Screen name="Exams" component={ExamsScreen} />
      <HomeStack.Screen name="Homework" component={HomeworkScreen} />
      <HomeStack.Screen name="Announcements" component={AnnouncementsScreen} />
      <HomeStack.Screen name="Hostel" component={HostelScreen} />
      <HomeStack.Screen name="Transport" component={TransportScreen} options={{ title: 'Bus / Transport' }} />
    </HomeStack.Navigator>
  );
}

export default function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#4361ee' }}>
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Timetable" component={TimetableScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
