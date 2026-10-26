import { Platform } from 'react-native';

// Tự động nhận diện môi trường:
// - Khi chạy trên Web (trình duyệt máy tính): dùng localhost:3000
// - Khi chạy trên Điện thoại (Expo Go): dùng IP mạng LAN 192.168.1.13
export const SERVER_IP = '192.168.1.13';
export const API_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : `http://${SERVER_IP}:3000/api`;

/**
 * Gọi API lấy dữ liệu Trang Chủ
 */
export async function fetchHomeData() {
  try {
    const res = await fetch(`${API_BASE_URL}/home`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Không thể tải dữ liệu trang chủ');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn('Lỗi gọi API /home:', error.message);
    throw error;
  }
}

/**
 * Gọi API lấy chi tiết phim
 */
export async function fetchMovieDetail(movieId) {
  try {
    const res = await fetch(`${API_BASE_URL}/movies/${movieId}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết phim');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn(`Lỗi gọi API /movies/${movieId}:`, error.message);
    throw error;
  }
}

/**
 * Gọi API lấy danh sách suất chiếu theo ngày
 */
export async function fetchShowtimes(movieId, date) {
  try {
    const query = date ? `?movieId=${movieId}&date=${date}` : `?movieId=${movieId}`;
    const res = await fetch(`${API_BASE_URL}/showtimes${query}`);
    if (!res.ok) throw new Error('Không thể tải suất chiếu');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn('Lỗi gọi API /showtimes:', error.message);
    throw error;
  }
}

/**
 * Gọi API lấy sơ đồ ghế và trạng thái đặt ghế
 */
export async function fetchSeats(movieId, cinemaName, date, time) {
  try {
    const query = `?movieId=${movieId}&cinemaName=${encodeURIComponent(cinemaName || '')}&date=${date}&time=${time}`;
    const res = await fetch(`${API_BASE_URL}/seats${query}`);
    if (!res.ok) throw new Error('Không thể tải sơ đồ ghế');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn('Lỗi gọi API /seats:', error.message);
    throw error;
  }
}

/**
 * Gọi API tạo đơn đặt vé
 */
export async function createBooking(bookingPayload) {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Đặt vé thất bại');
    return json;
  } catch (error) {
    console.warn('Lỗi gọi API /bookings:', error.message);
    throw error;
  }
}
