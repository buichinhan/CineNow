
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
} from "lucide-react";
import { getShowtimes } from "../services/api";

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

  const start = `${showtime.date} ${showtime.startTime}`;
  const end = `${showtime.date} ${showtime.endTime}`;
  const current = `${now.date} ${now.time}`;

  if (end < current) {
    return { label: "Đã qua", type: "past" };
  }

  if (start <= current && current <= end) {
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

  return (
    <div className="showtimes-page">
      <div className="st-page-heading">
        <div>
          <h2>Quản lý suất chiếu</h2>
          <p>Quản lý lịch chiếu phim trên hệ thống CineNow.</p>
        </div>

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
