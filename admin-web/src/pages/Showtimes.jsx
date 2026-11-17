
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Film,
  MapPin,
  RefreshCw,
  Search,
  Ticket,
  Plus,
  Pencil,
  X,
} from "lucide-react";
import {
  getShowtimes,
  getMovies,
  getCinemas,
  createShowtime,
    updateShowtime,
} from "../services/api";
import "./Showtimes.css";
const TIME_ZONE = "Asia/Ho_Chi_Minh";
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getVietnamNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
    year: Number(value.year),
    month: Number(value.month) - 1,
  };
}

function getStatus(showtime, now) {
  if (showtime.status === "cancelled") {
    return { label: "Đã hủy", type: "cancelled" };
  }

  if (showtime.status === "completed") {
    return { label: "Đã kết thúc", type: "past" };
  }

  const start = new Date(
    `${showtime.date}T${showtime.startTime}:00+07:00`
  );

  const end = new Date(
    `${showtime.date}T${showtime.endTime}:00+07:00`
  );

  // Suất chiếu kết thúc vào ngày hôm sau
  if (end < start) {
    end.setTime(end.getTime() + 24 * 60 * 60 * 1000);
  }

  const current = new Date();

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return { label: "Không xác định", type: "past" };
  }

  if (current >= end) {
    return { label: "Đã qua", type: "past" };
  }

  if (current >= start) {
    return { label: "Đang chiếu", type: "playing" };
  }

  return { label: "Sắp chiếu", type: "upcoming" };
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("vi-VN") + "đ";
}

function formatDate(date) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default function Showtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
const [cinemas, setCinemas] = useState([]);
const [showCreateForm, setShowCreateForm] = useState(false);
const [saving, setSaving] = useState(false);
const [editingShowtime, setEditingShowtime] = useState(null);
const [formError, setFormError] = useState("");

const [form, setForm] = useState({
  movieId: "",
  cinemaId: "",
  room: "",
  format: "2D PHỤ ĐỀ",
  date: "",
  startTime: "",
  price: "95000",
  bufferMinutes: "15",
});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [now, setNow] = useState(getVietnamNow);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const current = getVietnamNow();
    return new Date(current.year, current.month, 1);
  });

  async function loadShowtimes() {
    try {
      setLoading(true);
      setError("");
      const data = await getShowtimes();
      setShowtimes(data);
      setNow(getVietnamNow());
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShowtimes();
  }, []);

  const countsByDate = useMemo(() => {
    const counts = {};
    showtimes.forEach((item) => {
      if (item.date) {
        counts[item.date] = (counts[item.date] || 0) + 1;
      }
    });
    return counts;
  }, [showtimes]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;

    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const date =
          `${year}-${String(month + 1).padStart(2, "0")}-` +
          String(day).padStart(2, "0");
        return { day, date };
      }),
    ];
  }, [calendarMonth]);

  const filteredShowtimes = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");

    return showtimes
      .filter((item) => {
        if (selectedDate && item.date !== selectedDate) return false;

        const status = getStatus(item, now);
        if (
          statusFilter !== "all" &&
          status.type !== statusFilter
        ) {
          return false;
        }

        const searchable = [
          item.movieTitle,
          item.cinemaName,
          item.room,
          item.format,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("vi-VN");

        return searchable.includes(keyword);
      })
      .sort((a, b) => {
        const aTime = `${a.date} ${a.startTime}`;
        const bTime = `${b.date} ${b.startTime}`;
        return bTime.localeCompare(aTime);
      });
  }, [showtimes, selectedDate, search, statusFilter, now]);

  const upcomingCount = showtimes.filter(
    (item) => getStatus(item, now).type === "upcoming"
  ).length;

  const pastCount = showtimes.filter(
    (item) => getStatus(item, now).type === "past"
  ).length;

  const playingCount = showtimes.filter(
    (item) => getStatus(item, now).type === "playing"
  ).length;

  function changeMonth(amount) {
    setCalendarMonth((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth() + amount,
        1
      );
    });
    setSelectedDate("");
  }

  function goToToday() {
    const current = getVietnamNow();
    setCalendarMonth(
      new Date(current.year, current.month, 1)
    );
    setSelectedDate(current.date);
    setNow(current);
  }
  async function openEditForm(item) {
  setFormError("");
  setError("");

  try {
    const [movieList, cinemaList] = await Promise.all([
      getMovies(),
      getCinemas(),
    ]);

    setMovies(movieList);
    setCinemas(cinemaList);

    setEditingShowtime(item);

    setForm({
      movieId: String(item.movieId?._id || item.movieId || ""),
      cinemaId: String(item.cinemaId?._id || item.cinemaId || ""),
      room: item.room || "",
      format: item.format || "2D PHỤ ĐỀ",
      date: item.date || "",
      startTime: item.startTime || "",
      price: String(item.price ?? 95000),
      bufferMinutes: String(item.bufferMinutes ?? 15),
    });

    setShowCreateForm(true);
  } catch (err) {
    setError(err.message || "Không thể tải dữ liệu chỉnh sửa.");
  }
}
async function openCreateForm() {
  setFormError("");
  setError("");
  setEditingShowtime(null);

  try {
    const [movieList, cinemaList] = await Promise.all([
      getMovies(),
      getCinemas(),
    ]);

    setMovies(movieList);
    setCinemas(cinemaList);

    setForm({
      movieId: "",
      cinemaId: "",
      room: "",
      format: "2D PHỤ ĐỀ",
      date: getVietnamNow().date,
      startTime: "",
      price: "95000",
      bufferMinutes: "15",
    });

    setShowCreateForm(true);
  } catch (err) {
    setError(err.message || "Không thể tải phim và rạp.");
  }
}

function updateForm(field, value) {
  setForm((current) => ({
    ...current,
    [field]: value,
  }));
}

async function handleCreateShowtime(event) {
  event.preventDefault();

  if (saving) return;

  const price = Number(form.price);

  if (!Number.isFinite(price) || price <= 0) {
    setFormError("Giá vé phải lớn hơn 0.");
    return;
  }

  try {
    setSaving(true);
    setFormError("");

   if (editingShowtime) {
  const cinema = cinemas.find(
    (item) => String(item._id) === form.cinemaId
  );

  const price = Number(form.price);
  const bufferMinutes = Number(form.bufferMinutes);

  if (!cinema) {
    throw new Error("Không tìm thấy rạp chiếu hợp lệ.");
  }

  await updateShowtime(editingShowtime._id, {
    movieId: form.movieId,
    cinemaId: form.cinemaId,
    cinemaName: cinema.name,
    room: form.room.trim(),
    format: form.format,
    date: form.date,
    startTime: form.startTime,
    price,
    bufferMinutes,
  });
}else {
      const cinema = cinemas.find(
        (item) => String(item._id) === form.cinemaId
      );

      const bufferMinutes = Number(form.bufferMinutes);

      if (
        !cinema ||
        !form.movieId ||
        !form.room.trim() ||
        !form.date ||
        !form.startTime ||
        !Number.isInteger(bufferMinutes) ||
        bufferMinutes < 0
      ) {
        setFormError("Thông tin suất chiếu không hợp lệ.");
        return;
      }

      await createShowtime({
        movieId: form.movieId,
        cinemaId: form.cinemaId,
        cinemaName: cinema.name,
        room: form.room.trim(),
        format: form.format,
        date: form.date,
        startTime: form.startTime,
        price,
        bufferMinutes,
      });
    }

    setShowCreateForm(false);
    setEditingShowtime(null);
    await loadShowtimes();
  } catch (err) {
    setFormError(err.message || "Không thể lưu suất chiếu.");
  } finally {
    setSaving(false);
  }
}
    return (
    <div className="showtimes-page">
      {showCreateForm && (
  <div className="st-modal-overlay">
    <div
      className="st-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="st-modal-title"
    >
      <div className="st-modal-header">
        <h3 id="st-modal-title">
  {editingShowtime ? "Sửa suất chiếu" : "Thêm suất chiếu"}
</h3>

        <button
          type="button"
          onClick={() => setShowCreateForm(false)}
          disabled={saving}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleCreateShowtime}>
        <label>
          Phim
          <select
            required
            disabled={Boolean(editingShowtime)}
            value={form.movieId}
            onChange={(e) =>
              updateForm("movieId", e.target.value)
            }
          >
            <option value="">Chọn phim</option>
            {movies.map((movie) => (
              <option key={movie._id} value={movie._id}>
                {movie.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          Rạp
          <select
            required
            value={form.cinemaId}
            disabled={Boolean(editingShowtime)}
            onChange={(e) =>
              updateForm("cinemaId", e.target.value)
            }
          >
            <option value="">Chọn rạp</option>
            {cinemas.map((cinema) => (
              <option key={cinema._id} value={cinema._id}>
                {cinema.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Phòng chiếu
          <input
            required
            disabled={Boolean(editingShowtime)}
            value={form.room}
            onChange={(e) =>
              updateForm("room", e.target.value)
            }
            placeholder="Ví dụ: PHÒNG 01"
          />
        </label>

        <label>
          Định dạng
          <select
            value={form.format}
            onChange={(e) =>
              updateForm("format", e.target.value)
            }
          >
            <option value="2D PHỤ ĐỀ">2D PHỤ ĐỀ</option>
            <option value="2D LỒNG TIẾNG">2D LỒNG TIẾNG</option>
            <option value="3D PHỤ ĐỀ">3D PHỤ ĐỀ</option>
            <option value="3D LỒNG TIẾNG">3D LỒNG TIẾNG</option>
          </select>
        </label>

        <label>
          Ngày chiếu
          <input
            required
            type="date"
            disabled={Boolean(editingShowtime)}
            value={form.date}
            onChange={(e) =>
              updateForm("date", e.target.value)
            }
          />
        </label>

        <label>
          Giờ bắt đầu
          <input
            required

            type="time"
            value={form.startTime}
            onChange={(e) =>
              updateForm("startTime", e.target.value)
            }
          />
        </label>

        <label>
          Giá vé (VNĐ)
          <input
            required
            type="number"
            min="1"
            value={form.price}
            onChange={(e) =>
              updateForm("price", e.target.value)
            }
          />
        </label>

        <label>
          Thời gian đệm (phút)
          <input
            required
            type="number"
            min="0"
            disabled={Boolean(editingShowtime)}
            value={form.bufferMinutes}
            onChange={(e) =>
              updateForm("bufferMinutes", e.target.value)
            }
          />
        </label>

        {formError && (
          <p className="st-form-error">{formError}</p>
        )}

        <div className="st-modal-actions">
          <button
            type="button"
            onClick={() => setShowCreateForm(false)}
            disabled={saving}
          >
            Hủy
          </button>

          <button type="submit" disabled={saving}>
  {saving
    ? "Đang lưu..."
    : editingShowtime
      ? "Lưu thay đổi"
      : "Tạo suất chiếu"}
</button>
        </div>
            </form>
    </div>
  </div>
)}
      <div className="st-page-heading">
        <div>
          <h2>Quản lý suất chiếu</h2>
          <p>Quản lý lịch chiếu phim trên hệ thống CineNow.</p>
        </div>
        <button
  type="button"
  className="st-create-btn"
  onClick={openCreateForm}
>
  <Plus size={17} />
  Thêm suất chiếu
</button>

        <button
          className="st-refresh-btn"
          onClick={loadShowtimes}
          disabled={loading}
          type="button"
        >
          <RefreshCw size={17} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>

      </div>

      <div className="st-stats">
        <div className="st-stat-card">
          <Film size={22} />
          <span>Tổng suất chiếu</span>
          <strong>{showtimes.length}</strong>
        </div>

        <div className="st-stat-card">
          <CalendarDays size={22} />
          <span>Sắp chiếu</span>
          <strong>{upcomingCount}</strong>
        </div>

        <div className="st-stat-card">
          <Clock3 size={22} />
          <span>Đang chiếu</span>
          <strong>{playingCount}</strong>
        </div>

        <div className="st-stat-card">
          <Ticket size={22} />
          <span>Đã qua</span>
          <strong>{pastCount}</strong>
        </div>
      </div>

      <div className="st-layout">
        <section className="st-calendar-panel">
          <div className="st-calendar-header">
            <h3>
              Tháng {calendarMonth.getMonth() + 1}/
              {calendarMonth.getFullYear()}
            </h3>

            <div className="st-calendar-nav">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                aria-label="Tháng trước"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Tháng sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="st-calendar-grid">
            {WEEKDAYS.map((day) => (
              <div className="st-weekday" key={day}>
                {day}
              </div>
            ))}

            {calendarDays.map((item, index) => {
              if (!item) {
                return (
                  <div
                    className="st-empty-day"
                    key={`empty-${index}`}
                  />
                );
              }

              const isToday = item.date === now.date;
              const isSelected = item.date === selectedDate;
              const count = countsByDate[item.date] || 0;

              return (
                <button
                  key={item.date}
                  type="button"
                  className={[
                    "st-calendar-day",
                    isToday ? "today" : "",
                    isSelected ? "selected" : "",
                  ].join(" ")}
                  onClick={() =>
                    setSelectedDate(
                      isSelected ? "" : item.date
                    )
                  }
                  title={`${formatDate(item.date)}: ${count} suất chiếu`}
                >
                  <span>{item.day}</span>
                  {count > 0 && (
                    <span className="st-day-dot" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="st-calendar-footer">
            <span>
              <i className="st-legend-dot" />
              Ngày có suất chiếu
            </span>
            <button type="button" onClick={goToToday}>
              Hôm nay
            </button>
          </div>

          {selectedDate && (
            <div className="st-selected-date">
              Đang lọc: <strong>{formatDate(selectedDate)}</strong>
              <button
                type="button"
                onClick={() => setSelectedDate("")}
              >
                Bỏ lọc
              </button>
            </div>
          )}
        </section>

        <section className="st-list-panel">
          <div className="st-list-heading">
            <div>
              <h3>Danh sách suất chiếu</h3>
              <p>{filteredShowtimes.length} kết quả</p>
            </div>
          </div>

          <div className="st-filters">
            <label className="st-search">
              <Search size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Tìm phim, rạp, phòng..."
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Lọc trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="upcoming">Sắp chiếu</option>
              <option value="playing">Đang chiếu</option>
              <option value="past">Đã qua</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {error && (
            <div className="st-error">
              {error}
              <button type="button" onClick={loadShowtimes}>
                Thử lại
              </button>
            </div>
          )}

          <div className="st-table-scroll">
            <table className="st-table">
              <thead>
                <tr>
                  <th>Phim / Rạp</th>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Phòng</th>
                  <th>Giá vé</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredShowtimes.map((item) => {
                  const status = getStatus(item, now);

                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="st-movie-cell">
                          <strong>{item.movieTitle}</strong>
                          <span>
                            <MapPin size={13} />
                            {item.cinemaName}
                          </span>
                          <small>{item.format}</small>
                        </div>
                      </td>

                      <td>{formatDate(item.date)}</td>

                      <td>
                        <div className="st-time-cell">
                          <strong>{item.startTime}</strong>
                          <span>– {item.endTime}</span>
                        </div>
                      </td>

                      <td>{item.room}</td>

                      <td className="st-price">
                        {formatPrice(item.price)}
                      </td>

                      <td>
                        <span
                          className={`st-status ${status.type}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td>
  <button
    type="button"
    className="st-edit-btn"
    onClick={() => openEditForm(item)}
  >
    <Pencil size={15} />
    Sửa
  </button>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && !error && filteredShowtimes.length === 0 && (
            <div className="st-no-data">
              <CalendarDays size={32} />
              <h4>Không có suất chiếu</h4>
              <p>
                Không tìm thấy suất chiếu phù hợp với bộ lọc.
              </p>
            </div>
          )}

          {loading && (
            <div className="st-no-data">
              <RefreshCw size={28} />
              <p>Đang tải dữ liệu từ CineNow API...</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
