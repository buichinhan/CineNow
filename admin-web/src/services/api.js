
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

// ==================== CUSTOMER MANAGEMENT ====================

function customerQuery(page, limit, search = "") {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    typeof search !== "string" ||
    search.length > 100
  ) {
    throw new Error("Thông số truy vấn không hợp lệ.");
  }

  return new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search: search.trim()
  });
}

export async function getAdminCustomers({
  page = 1,
  limit = 10,
  search = "",
  status = "all",
  signal
} = {}) {
  if (!["all", "active", "locked"].includes(status)) {
    throw new Error("Bộ lọc trạng thái không hợp lệ.");
  }

  const query = customerQuery(page, limit, search);
  query.set("status", status);

  const result = await request(
    `/api/admin/customers?${query}`,
    { signal, cache: "no-store" }
  );

  const stats = result?.stats;
  const pagination = result?.pagination;

  const validCount = value =>
    Number.isSafeInteger(value) && value >= 0;

  if (
    result?.success !== true ||
    !Array.isArray(result.data) ||
    !stats ||
    !pagination ||
    ![
      stats.totalCustomers,
      stats.newCustomers,
      stats.activeCustomers,
      stats.lockedCustomers,
      stats.invalidCustomers,
      pagination.total,
      pagination.totalPages
    ].every(validCount) ||
    stats.totalCustomers !==
      stats.activeCustomers +
      stats.lockedCustomers +
      stats.invalidCustomers ||
    stats.newCustomers > stats.totalCustomers ||
    pagination.page !== page ||
    pagination.limit !== limit ||
    pagination.totalPages !== Math.ceil(pagination.total / limit) ||
    result.data.length > limit ||
    result.data.some(customer =>
      !customer ||
      typeof customer._id !== "string" ||
      !/^[a-f0-9]{24}$/i.test(customer._id) ||
      !["active", "locked", "invalid"].includes(
        customer.accountStatus
      ) ||
      (
        status !== "all" &&
        customer.accountStatus !== status
      )
    )
  ) {
    throw new Error("Dữ liệu danh sách khách hàng không hợp lệ.");
  }

  return result;
}

export async function getAdminCustomerDetail(
  id,
  { page = 1, limit = 10, signal } = {}
) {
  if (
    typeof id !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(id)
  ) {
    throw new Error("ID khách hàng không hợp lệ.");
  }

  const query = customerQuery(page, limit);
  query.delete("search");

  const result = await request(
    `/api/admin/customers/${encodeURIComponent(id)}?${query}`,
    { signal }
  );

  if (
    !result?.success ||
    result.data?.customer?._id !== id ||
    !result.data.stats ||
    !Array.isArray(result.data.bookings) ||
    !result.data.pagination
  ) {
    throw new Error("Dữ liệu chi tiết không hợp lệ.");
  }

  return result.data;
}


// ==================== CUSTOMER POINTS ====================

export async function getAdminCustomerPoints(
  id,
  { page = 1, limit = 10, signal } = {}
) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    throw new Error("ID khách hàng không hợp lệ.");
  }

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    throw new Error("Thông số phân trang không hợp lệ.");
  }

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  const result = await request(
    `/api/admin/customers/${id}/points?${query}`,
    { signal }
  );

  if (
    !result?.success ||
    !result.data ||
    !Array.isArray(result.data.transactions) ||
    !result.data.pagination ||
    typeof result.data.canAdjust !== "boolean"
  ) {
    throw new Error("Dữ liệu điểm không hợp lệ.");
  }

  return result.data;
}

export async function adjustAdminCustomerPoints(id, payload) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    throw new Error("ID khách hàng không hợp lệ.");
  }

  const { action, points, reason, operationId } = payload ?? {};

  if (!["add", "deduct"].includes(action)) {
    throw new Error("Thao tác không hợp lệ.");
  }

  if (
    !Number.isSafeInteger(points) ||
    points < 1 ||
    points > 10000
  ) {
    throw new Error("Số điểm phải từ 1 đến 10000.");
  }

  if (
    typeof reason !== "string" ||
    reason.trim().length < 5 ||
    reason.trim().length > 300
  ) {
    throw new Error("Lý do phải từ 5 đến 300 ký tự.");
  }

  if (
    typeof operationId !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operationId)
  ) {
    throw new Error("Mã giao dịch không hợp lệ.");
  }

  const result = await request(
    `/api/admin/customers/${id}/points`,
    {
      method: "POST",
      body: JSON.stringify({
        action,
        points,
        reason: reason.trim(),
        operationId
      })
    }
  );

  if (!result?.success || !result.data?.transaction) {
    throw new Error("Chưa xác nhận được kết quả giao dịch.");
  }

  return result.data;
}

// ==================== CUSTOMER STATUS V2.2.5 ====================

function validateStatusCustomerId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) {
    throw new Error("Mã khách hàng không hợp lệ.");
  }
}

export async function getAdminCustomerStatus(
  id,
  { page = 1, limit = 10, signal } = {}
) {
  validateStatusCustomerId(id);

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    throw new Error("Thông số phân trang không hợp lệ.");
  }

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  const result = await request(
    `/api/admin/customers/${id}/status?${query}`,
    { signal, cache: "no-store" }
  );

  const data = result?.data;

  if (
    result?.success !== true ||
    typeof data?.isLocked !== "boolean" ||
    typeof data?.canChangeStatus !== "boolean" ||
    !Array.isArray(data?.history) ||
    !Number.isSafeInteger(data?.pagination?.totalPages) ||
    data.pagination.totalPages < 0
  ) {
    throw new Error("Dữ liệu trạng thái không hợp lệ.");
  }

  return data;
}

export async function changeAdminCustomerStatus(id, payload) {
  validateStatusCustomerId(id);

  const { action, reason, operationId } = payload || {};

  if (!["lock", "unlock"].includes(action)) {
    throw new Error("Thao tác không hợp lệ.");
  }

  if (
    typeof reason !== "string" ||
    reason.trim().length < 5 ||
    reason.trim().length > 300
  ) {
    throw new Error("Lý do phải từ 5 đến 300 ký tự.");
  }

  if (
    typeof operationId !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operationId)
  ) {
    throw new Error("Mã giao dịch không hợp lệ.");
  }

  const result = await request(
    `/api/admin/customers/${id}/${action}`,
    {
      method: "POST",
      body: JSON.stringify({
        reason: reason.trim(),
        operationId
      }),
      signal: AbortSignal.timeout(30000)
    }
  );

  if (
    result?.success !== true ||
    typeof result?.data?.replayed !== "boolean" ||
    result?.data?.history?.operationId !== operationId
  ) {
    throw new Error("Chưa xác nhận được kết quả giao dịch.");
  }

  return result.data;
}
