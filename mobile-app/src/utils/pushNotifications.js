import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { mobileAPI } from '../api/mobile';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Requests permission, grabs an Expo push token, and registers it with the
// backend against the currently logged-in user. Call this once right after
// login (and again on app boot while already authenticated) - safe to call
// repeatedly, it's just an upsert server-side.
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return; // push tokens don't work on emulators/simulators
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenResponse.data;

  try {
    await mobileAPI.registerPushToken(token, Platform.OS);
  } catch (e) {
    // Non-fatal - app still works without push, just quieter.
  }
}
