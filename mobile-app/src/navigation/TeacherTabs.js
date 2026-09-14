import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/teacher/DashboardScreen';
import MarkAttendanceScreen from '../screens/teacher/MarkAttendanceScreen';
import TimetableScreen from '../screens/teacher/TimetableScreen';
import MarksEntryScreen from '../screens/teacher/MarksEntryScreen';
import MarksEntrySheetScreen from '../screens/teacher/MarksEntrySheetScreen';
import HomeworkAssignScreen from '../screens/teacher/HomeworkAssignScreen';
import MessagesScreen from '../screens/teacher/MessagesScreen';
import MessageThreadScreen from '../screens/teacher/MessageThreadScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="TeacherDashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
      <HomeStack.Screen name="MarksEntry" component={MarksEntryScreen} options={{ title: 'Marks Entry' }} />
      <HomeStack.Screen name="MarksEntrySheet" component={MarksEntrySheetScreen} />
      <HomeStack.Screen name="HomeworkAssign" component={HomeworkAssignScreen} options={{ title: 'Assign Homework' }} />
      <HomeStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
      <HomeStack.Screen name="MessageThread" component={MessageThreadScreen} />
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
