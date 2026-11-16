import { Platform } from 'react-native';

// Cấu hình địa chỉ máy chủ CineNow:
// - Web / Máy tính: http://localhost:3000/api
// - Android Emulator: http://10.0.2.2:3000/api
// - Thiết bị thật (Expo Go): http://192.168.1.13:3000/api
// - Server chung cả nhóm (Render): https://cinenow-backend.onrender.com/api
export const SERVER_IP = '192.168.1.13';

export const API_BASE_URL = Platform.select({
  web: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: `http://${SERVER_IP}:3000/api`,
});

export const RENDER_API_BASE_URL = 'https://cinenow-backend.onrender.com/api';
