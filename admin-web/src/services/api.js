
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

const TOKEN_KEY = "cinenow_admin_token";

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveAdminToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(endpoint, options = {}, token) {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = token || getAdminToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message ||
      `Yêu cầu thất bại (${response.status})`
    );
  }

  return result;
}

export async function loginAdmin(email, password) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!result.success || !result.token) {
    throw new Error("Không nhận được phiên đăng nhập.");
  }

  // Chỉ chấp nhận token sau khi Backend xác nhận quyền Admin.
  const admin = await verifyAdmin(result.token);

  if (!admin.success || admin.user?.role !== "admin") {
    throw new Error("Tài khoản không có quyền quản trị.");
  }

  saveAdminToken(result.token);

  return admin.user;
}

export async function verifyAdmin(token) {
  return request("/api/admin/me", {}, token);
}

export function logoutAdmin() {
  clearAdminToken();
}

export async function getShowtimes() {
  const result = await request("/api/showtimes?manage=true");

  if (!result.success) {
    throw new Error("Không thể tải danh sách suất chiếu.");
  }

  return Array.isArray(result.data) ? result.data : [];
}

export async function getMovies() {
  const result = await request("/api/movies?manage=true");
  return Array.isArray(result.data) ? result.data : [];
}

export async function createMovie(movie) {
  return request("/api/movies", {
    method: "POST",
    body: JSON.stringify(movie),
  });
}

export async function updateMovie(id, movie) {
  return request(`/api/movies/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(movie),
  });
}

export async function updateMovieStatus(id, status) {
  return request(
    `/api/movies/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}

export async function deleteMovie(id) {
  return request(`/api/movies/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
// ===== CINEMA MANAGEMENT =====

export async function getCinemas() {
  const result = await request("/api/cinemas/manage/all");
  return Array.isArray(result.data) ? result.data : [];
}

export async function createCinema(cinema) {
  return request("/api/cinemas", {
    method: "POST",
    body: JSON.stringify(cinema),
  });
}

export async function updateCinema(id, cinema) {
  return request(`/api/cinemas/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(cinema),
  });
}

export async function updateCinemaStatus(id, status) {
  return request(
    `/api/cinemas/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );
}