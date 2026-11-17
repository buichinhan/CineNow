import { Platform } from 'react-native';

// Cau hinh Backend local
export const SERVER_IP = '192.168.1.13';

export const LOCAL_API_BASE_URL = Platform.select({
  web: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: `http://${SERVER_IP}:3000/api`,
});

// Backend Render dung chung cho ca nhom
export const RENDER_API_BASE_URL =
  'https://cinenow-backend-9on6.onrender.com/api';

// Mac dinh su dung Backend chung
export const API_BASE_URL = RENDER_API_BASE_URL;