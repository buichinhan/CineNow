import { Platform } from 'react-native';

// Địa chỉ backend CineNow
// - Android Emulator: 10.0.2.2
// - iOS Simulator / Web: localhost
// - Thiết bị thật: thay bằng IP mạng LAN máy tính của bạn (VD: http://192.168.1.x:3000/api)
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});
