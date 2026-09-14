import Constants from 'expo-constants';

// Set the real backend URL here once it's deployed (see deploy/ in the main repo),
// or override at runtime via `extra.apiUrl` in app.json.
// For local testing on a physical phone with Expo Go, `localhost` will NOT work —
// use your computer's LAN IP instead, e.g. http://192.168.1.5:5000/api
// (phone and computer must be on the same Wi-Fi network).
const DEFAULT_API_URL = 'http://192.168.1.5:5000/api';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || DEFAULT_API_URL;
