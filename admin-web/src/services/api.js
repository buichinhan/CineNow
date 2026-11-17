
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:3000"
).replace(/\/+$/, "");

const TOKEN_KEY = "cinenow_admin_token";

// ==================== TOKEN ====================

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ==================== HTTP REQUEST ====================

async function request(endpoint, options = {}, token) {
  const headers = new Headers(
    options.headers || {}
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const accessToken =
    token || getAdminToken();

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  const result = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Yêu cầu thất bại (${response.status})`
    );
  }

  return result;
}

// ==================== ADMIN AUTH ====================

export async function loginAdmin(
  email,
  password
) {
  const result = await request(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  if (!result.success || !result.token) {
    throw new Error(
      "Không nhận được phiên đăng nhập."
    );
  }

  // Chi luu token khi backend xac nhan Admin.
  const admin = await verifyAdmin(
    result.token
  );

  if (
    !admin.success ||
    admin.user?.role !== "admin"
  ) {
    throw new Error(
      "Tài khoản không có quyền quản trị."
    );
  }

  saveAdminToken(result.token);

  return admin.user;
}

export async function verifyAdmin(token) {
  return request(
    "/api/admin/me",
    {},
    token
  );
}

export function logoutAdmin() {
  clearAdminToken();
}

// ==================== DASHBOARD ====================

export async function getDashboardStats() {
  const result = await request(
    "/api/admin/dashboard/stats"
  );

  if (
    !result.success ||
    !result.data
  ) {
    throw new Error(
      "Không thể tải dữ liệu Dashboard."
    );
  }

  return result.data;
}

// ==================== SHOWTIMES ====================

export async function getShowtimes() {
  const result = await request(
    "/api/showtimes?manage=true"
  );

  if (!result.success) {
    throw new Error(
      "Không thể tải danh sách suất chiếu."
    );
  }

  return Array.isArray(result.data)
    ? result.data
    : [];
}

// ==================== SHOWTIME MANAGEMENT ====================

// Tạo suất chiếu mới
export async function createShowtime(data) {
  return request("/api/showtimes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Cập nhật suất chiếu
export async function updateShowtime(id, data) {
  return request(
    `/api/showtimes/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// Kiểm tra trùng lịch trước khi lưu
export async function checkShowtimeConflict(data) {
  return request("/api/showtimes/check-conflict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Xem lịch sử dụng phòng chiếu trong ngày
export async function getShowtimeTimeline(params) {
  const query = new URLSearchParams({
    cinemaName: params.cinemaName,
    room: params.room,
    date: params.date,
  });

  return request(
    `/api/showtimes/timeline?${query.toString()}`
  );
}

// ==================== MOVIES ====================

export async function getMovies() {
  const result = await request(
    "/api/movies?manage=true"
  );

  return Array.isArray(result.data)
    ? result.data
    : [];
}

export async function createMovie(movie) {
  return request(
    "/api/movies",
    {
      method: "POST",
      body: JSON.stringify(movie),
    }
  );
}

export async function updateMovie(
  id,
  movie
) {
  return request(
    `/api/movies/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(movie),
    }
  );
}

export async function updateMovieStatus(
  id,
  status
) {
  return request(
    `/api/movies/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
}

export async function deleteMovie(id) {
  return request(
    `/api/movies/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

// ==================== CINEMAS ====================

export async function getCinemas() {
  const result = await request(
    "/api/cinemas/manage/all"
  );

  return Array.isArray(result.data)
    ? result.data
    : [];
}

export async function createCinema(
  cinema
) {
  return request(
    "/api/cinemas",
    {
      method: "POST",
      body: JSON.stringify(cinema),
    }
  );
}

export async function updateCinema(
  id,
  cinema
) {
  return request(
    `/api/cinemas/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(cinema),
    }
  );
}

export async function updateCinemaStatus(
  id,
  status
) {
  return request(
    `/api/cinemas/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
}

// ==================== BOOKING MANAGEMENT ====================

export async function getAdminBookings(params = {}) {
  const query = new URLSearchParams();

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.paymentStatus) {
    query.set("paymentStatus", params.paymentStatus);
  }

  return request(`/api/admin/bookings?${query.toString()}`);
}

export async function getAdminBookingDetail(id) {
  const result = await request(
    `/api/admin/bookings/${encodeURIComponent(id)}`
  );

  if (!result.success) {
    throw new Error("Không thể tải chi tiết đặt vé.");
  }

  return result.data;
}

export async function cancelAdminBooking(id) {
  return request(
    `/api/admin/bookings/${encodeURIComponent(id)}/cancel`,
    {
      method: "PATCH",
    }
  );
}
// ==================== VOUCHER MANAGEMENT ====================

// Lấy danh sách voucher
export async function getAdminVouchers(params = {}) {
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }

  const suffix = query.toString();

  return request(
    `/api/admin/vouchers${suffix ? `?${suffix}` : ""}`
  );
}

// Tạo voucher mới
export async function createAdminVoucher(data) {
  return request("/api/admin/vouchers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Chỉnh sửa voucher
export async function updateAdminVoucher(id, data) {
  return request(
    `/api/admin/vouchers/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// Bật hoặc tắt voucher
export async function updateAdminVoucherStatus(id, isActive) {
  return request(
    `/api/admin/vouchers/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }
  );
}

// Xóa voucher chưa được sử dụng
export async function deleteAdminVoucher(id) {
  return request(
    `/api/admin/vouchers/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}