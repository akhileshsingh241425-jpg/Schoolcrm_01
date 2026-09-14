import Constants from 'expo-constants';

// Points at the live School CRM backend on the production VPS (93.127.194.235),
// so the app works from any network - no need to keep a laptop running or be on
// the same Wi-Fi. Override at runtime via `extra.apiUrl` in app.json if needed
// (e.g. to point at localhost/LAN IP for local backend development).
const DEFAULT_API_URL = 'http://93.127.194.235/api';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || DEFAULT_API_URL;
