import { API_BASE_URL } from './apiConfig';
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
 * Gọi API lấy danh sách suất chiếu theo ngày (cho giao diện đặt vé)
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
 * Gọi API lấy sơ đồ ghế và trạng thái đặt ghế / giữ ghế tạm
 */
export async function fetchSeats(movieId, cinemaName, date, time, holdToken = null, room = '') {
  try {
    let query = `?movieId=${movieId}&cinemaName=${encodeURIComponent(cinemaName || '')}&date=${date}&time=${time}`;
    if (room) query += `&room=${encodeURIComponent(room)}`;
    if (holdToken) query += `&holdToken=${encodeURIComponent(holdToken)}`;

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
 * Gọi API Giữ ghế tạm thời (Temporary Seat Hold)
 * @param {Object} payload { cinemaName, room, date, time, seats, holdToken, userId, durationSeconds }
 */
export async function holdSeatsApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/seats/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      const error = new Error(json.message || 'Không thể giữ ghế tạm thời');
      error.code = json.code;
      error.conflictingSeats = json.conflictingSeats;
      throw error;
    }
    return json;
  } catch (error) {
    console.warn('Lỗi giữ ghế tạm thời:', error.message);
    throw error;
  }
}

/**
 * Gọi API Giải phóng ghế giữ tạm (Release Seats)
 * @param {Object} payload { cinemaName, room, date, time, seats, holdToken }
 */
export async function releaseSeatsApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/seats/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.warn('Lỗi giải phóng ghế:', error.message);
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
/**
 * Lấy danh sách vé của tài khoản đang đăng nhập.
 */
export async function getMyBookings(token) {
  if (!token) {
    throw new Error('Bạn cần đăng nhập để xem vé.');
  }

  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Không thể tải lịch sử đặt vé.'
    );
  }

  if (!Array.isArray(result.data)) {
    throw new Error('Dữ liệu lịch sử vé không hợp lệ.');
  }

  return result.data;
}

// =========================================================================
// QUẢN LÝ LỊCH CHIẾU VÀ KIỂM TRA XUNG ĐỘT (SHOWTIME MANAGEMENT & CONFLICT)
// =========================================================================

/**
 * Gọi API kiểm tra trước xung đột thời gian & phòng chiếu (Preview Conflict)
 * @param {Object} payload { movieId, cinemaName, room, date, startTime, bufferMinutes, excludeShowtimeId }
 */
export async function checkShowtimeConflictApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/showtimes/check-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.warn('Lỗi kiểm tra xung đột lịch chiếu:', error.message);
    throw error;
  }
}

/**
 * Gọi API tạo mới lịch chiếu (Có kiểm tra xung đột phòng chiếu & thời gian)
 * @param {Object} payload { movieId, cinemaName, room, date, startTime, format, price, bufferMinutes }
 */
export async function createShowtimeApi(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/showtimes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Không thể tạo lịch chiếu.');
    }
    return json;
  } catch (error) {
    console.warn('Lỗi tạo lịch chiếu:', error.message);
    throw error;
  }
}

/**
 * Gọi API cập nhật/chỉnh sửa lịch chiếu
 * @param {string} id Mã lịch chiếu cần cập nhật
 * @param {Object} payload Các trường cần cập nhật
 */
export async function updateShowtimeApi(id, payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/showtimes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Không thể cập nhật lịch chiếu.');
    }
    return json;
  } catch (error) {
    console.warn(`Lỗi cập nhật lịch chiếu ${id}:`, error.message);
    throw error;
  }
}

/**
 * Gọi API xóa lịch chiếu
 * @param {string} id Mã lịch chiếu cần xóa
 */
export async function deleteShowtimeApi(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/showtimes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Không thể xóa lịch chiếu.');
    }
    return json;
  } catch (error) {
    console.warn(`Lỗi xóa lịch chiếu ${id}:`, error.message);
    throw error;
  }
}

/**
 * @param {Object} filters { movieId, cinemaName, date, room, status }
 */
export async function fetchShowtimesManagement(filters = {}) {
  try {
    const params = new URLSearchParams({ manage: 'true', ...filters });
    const res = await fetch(`${API_BASE_URL}/showtimes?${params.toString()}`);
    if (!res.ok) throw new Error('Không thể tải danh sách quản lý lịch chiếu');
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn('Lỗi lấy danh sách quản lý lịch chiếu:', error.message);
    throw error;
  }
}

/**
 * Gọi API lấy timeline lịch phòng chiếu (ca bận và ca trống)
 * @param {Object} params { cinemaName, room, date }
 */
export async function fetchRoomTimelineApi({ cinemaName, room, date }) {
  try {
    const params = new URLSearchParams({ cinemaName, room, date });
    const res = await fetch(`${API_BASE_URL}/showtimes/timeline?${params.toString()}`);
    if (!res.ok) throw new Error('Không thể tải timeline phòng chiếu');
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.warn('Lỗi lấy timeline phòng chiếu:', error.message);
    throw error;
  }
}

// =========================================================================
// BẮP NƯỚC VÀ SNACK (CONCESSIONS & COMBOS)
// =========================================================================

/**
 * Gọi API lấy danh mục bắp nước & combo
 * @param {string} [category] - 'all' | 'combo' | 'popcorn' | 'drink' | 'snack'
 */
export async function fetchConcessions(category) {
  try {
    const query = category && category !== 'all' ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE_URL}/concessions${query}`);
    if (!res.ok) throw new Error('Không thể tải danh sách bắp nước và snack');
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.warn('Lỗi gọi API /concessions:', error.message);
    throw error;
  }
}

// =========================================================================
// VOUCHER & MÃ GIẢM GIÁ (VOUCHERS & PROMOTIONS)
// =========================================================================

/**
 * Lấy danh sách Voucher công khai
 */
export async function fetchPublicVouchers(token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/vouchers`, { headers });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể tải voucher');
    return json.data || [];
  } catch (error) {
    console.warn('Lỗi gọi API /vouchers:', error.message);
    throw error;
  }
}

/**
 * Lấy danh sách Voucher trong ví cá nhân của người dùng
 */
export async function fetchMyVouchers(token, status = '') {
  try {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/vouchers/my-vouchers${query}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể tải ví voucher');
    return json.data || [];
  } catch (error) {
    console.warn('Lỗi gọi API /vouchers/my-vouchers:', error.message);
    throw error;
  }
}

/**
 * Thu thập voucher vào ví
 */
export async function claimVoucherApi(payload, token) {
  try {
    const res = await fetch(`${API_BASE_URL}/vouchers/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể lưu voucher');
    return json;
  } catch (error) {
    console.warn('Lỗi lưu voucher:', error.message);
    throw error;
  }
}

/**
 * Kiểm tra và tính toán giảm giá của Voucher
 */
export async function validateVoucherApi(payload, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/vouchers/validate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Mã giảm giá không hợp lệ');
    return json;
  } catch (error) {
    console.warn('Lỗi kiểm tra voucher:', error.message);
    throw error;
  }
}

// =========================================================================
// ĐIỂM THÀNH VIÊN (LOYALTY POINTS)
// =========================================================================

/**
 * Lấy số dư điểm thành viên và tỷ lệ quy đổi
 */
export async function fetchLoyaltyBalance(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/loyalty/balance`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể lấy số dư điểm');
    return json.data;
  } catch (error) {
    console.warn('Lỗi lấy điểm thành viên:', error.message);
    throw error;
  }
}

/**
 * Lấy lịch sử biến động điểm
 */
export async function fetchLoyaltyHistory(token) {
  try {
    const res = await fetch(`${API_BASE_URL}/loyalty/history`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không thể tải lịch sử điểm');
    return json.data || [];
  } catch (error) {
    console.warn('Lỗi lấy lịch sử điểm:', error.message);
    throw error;
  }
}

/**
 * Hủy vé và xử lý hoàn điểm / hoàn voucher
 */
/**
 * Hủy vé và xử lý hoàn điểm / hoàn voucher
 */
export async function cancelBookingApi(bookingId, token = null) {
  if (!bookingId) {
    throw new Error("Thiếu mã vé cần hủy.");
  }

  try {
    const headers = { "Content-Type": "application/json" };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(
      `${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}/cancel`,
      {
        method: "POST",
        headers,
      }
    );

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || "Không thể hủy vé.");
    }

    return json;
  } catch (error) {
    console.warn("Lỗi hủy vé:", error.message);
    throw error;
  }
}
