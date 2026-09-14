import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChildrenListScreen from '../screens/parent/ChildrenListScreen';
import ChildDetailScreen from '../screens/parent/ChildDetailScreen';

const Stack = createNativeStackNavigator();

export default function ParentTabs() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChildrenList" component={ChildrenListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChildDetail" component={ChildDetailScreen} />
    </Stack.Navigator>
  );
}
