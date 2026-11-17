
import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  Ticket,
  Film,
  Building2,
  CalendarDays,
  Users,
  RefreshCw,
  TrendingUp,
  Clock,
  XCircle,
  CreditCard,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

import { getDashboardStats } from "../services/api";
import "./Dashboard.css";

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const number = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parts = String(date).split("-");
  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
};

function StatCard({ title, value, icon: Icon, detail }) {
  return (
    <article className="dash-stat-card">
      <div className="dash-stat-heading">
        <span>{title}</span>
        <div className="dash-stat-icon">
          <Icon size={21} />
        </div>
      </div>

      <h2>{value}</h2>
      <p>{detail}</p>
    </article>
  );
}

function RevenueChart({ data = [] }) {
  const maxRevenue = Math.max(
    1,
    ...data.map((item) => Number(item.revenue) || 0)
  );

  const total = data.reduce(
    (sum, item) => sum + (Number(item.revenue) || 0),
    0
  );

  return (
    <section className="dash-panel">
      <div className="dash-panel-heading">
        <div>
          <h3>Doanh thu 7 ngày gần nhất</h3>
          <p>Chỉ tính vé đã thanh toán và chưa hủy</p>
        </div>
        <TrendingUp size={21} />
      </div>

      <div className="dash-chart-total">{money(total)}</div>

      <div className="dash-chart" role="img" aria-label="Biểu đồ doanh thu 7 ngày">
        {data.map((item) => {
          const revenue = Number(item.revenue) || 0;
          const height =
            revenue === 0 ? 3 : Math.max(8, (revenue / maxRevenue) * 100);

          return (
            <div className="dash-chart-column" key={item.date}>
              <div className="dash-chart-bar-area">
                <div
                  className="dash-chart-bar"
                  style={{ height: `${height}%` }}
                  title={`${formatDate(item.date)}: ${money(revenue)}`}
                />
              </div>

              <span>{item.date?.slice(5).replace("-", "/")}</span>
            </div>
          );
        })}
      </div>

      <p className="dash-chart-note">
        Doanh thu được nhóm theo ngày tạo đơn, múi giờ Việt Nam.
      </p>
    </section>
  );
}

function BookingStatus({ booking }) {
  if (booking.status === "cancelled") {
    return <span className="dash-status cancelled">Đã hủy</span>;
  }

  if (booking.paymentStatus === "paid") {
    return <span className="dash-status paid">Đã thanh toán</span>;
  }

  if (booking.paymentStatus === "refunded") {
    return <span className="dash-status refunded">Đã hoàn tiền</span>;
  }

  return <span className="dash-status pending">Chờ thanh toán</span>;
}

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getDashboardStats();
      setData(result);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const overview = data?.overview || {};

  const stats = [
    {
      title: "Tổng doanh thu",
      value: money(overview.totalRevenue),
      icon: Wallet,
      detail: "Vé đã thanh toán, chưa hủy",
    },
    {
      title: "Vé đã bán",
      value: number(overview.ticketsSold),
      icon: Ticket,
      detail: "Số đơn hợp lệ",
    },
    {
      title: "Tổng số phim",
      value: number(overview.totalMovies),
      icon: Film,
      detail: "Phim trong hệ thống",
    },
    {
      title: "Tổng số rạp",
      value: number(overview.totalCinemas),
      icon: Building2,
      detail: "Rạp trong hệ thống",
    },
    {
      title: "Suất chiếu",
      value: number(overview.totalShowtimes),
      icon: CalendarDays,
      detail: "Tất cả suất chiếu",
    },
    {
      title: "Khách hàng",
      value: number(overview.totalCustomers),
      icon: Users,
      detail: "Tài khoản khách hàng",
    },
    {
      title: "Vé đã hủy",
      value: number(overview.cancelledBookings),
      icon: XCircle,
      detail: "Đơn đặt vé đã hủy",
    },
    {
      title: "Chờ thanh toán",
      value: number(overview.pendingPayments),
      icon: CreditCard,
      detail: "Đơn chưa thanh toán",
    },
  ];

  return (
    <div className="dash-page">
      <section className="dash-hero">
        <div>
          <span className="dash-eyebrow">CINENOW MANAGEMENT</span>
          <h2>Tổng quan hệ thống</h2>
          <p>
            Theo dõi hoạt động kinh doanh, đặt vé và lịch chiếu
            từ dữ liệu CineNow.
          </p>
        </div>

        <button
          className="dash-refresh"
          type="button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? "dash-spin" : ""} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </section>

      {error && (
        <div className="dash-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>
            Thử lại
          </button>
        </div>
      )}

      {!data && loading && (
        <div className="dash-loading">
          <RefreshCw className="dash-spin" size={25} />
          Đang tải dữ liệu Dashboard...
        </div>
      )}

      {data && (
        <>
          <div className="dash-stats-grid">
            {stats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </div>

          <div className="dash-content-grid">
            <RevenueChart data={data.revenueChart} />

            <section className="dash-panel">
              <div className="dash-panel-heading">
                <div>
                  <h3>Suất chiếu sắp tới</h3>
                  <p>5 suất chiếu gần nhất</p>
                </div>
                <Clock size={21} />
              </div>

              <div className="dash-item-list">
                {data.upcomingShowtimes?.length ? (
                  data.upcomingShowtimes.map((item) => (
                    <div className="dash-list-item" key={item._id}>
                      <div className="dash-list-icon">
                        <Film size={19} />
                      </div>
                      <div className="dash-list-content">
                        <strong>{item.movieTitle}</strong>
                        <span>
                          {item.cinemaName} · {item.room}
                        </span>
                        <small>
                          {formatDate(item.date)} · {item.startTime}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dash-empty">Không có suất chiếu sắp tới.</p>
                )}
              </div>

              <button
                className="dash-link"
                type="button"
                onClick={() => onNavigate?.("showtimes")}
              >
                Quản lý suất chiếu <ArrowRight size={16} />
              </button>
            </section>
          </div>

          <section className="dash-panel dash-bookings-panel">
            <div className="dash-panel-heading">
              <div>
                <h3>Đặt vé gần đây</h3>
                <p>5 đơn đặt vé mới nhất</p>
              </div>
              <Ticket size={21} />
            </div>

            <div className="dash-table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Mã vé</th>
                    <th>Phim</th>
                    <th>Rạp</th>
                    <th>Thời gian đặt</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBookings?.length ? (
                    data.recentBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="dash-code">
                          {booking.bookingCode}
                        </td>
                        <td>{booking.movieTitle}</td>
                        <td>{booking.cinemaName}</td>
                        <td>{formatDateTime(booking.createdAt)}</td>
                        <td className="dash-price">
                          {money(booking.totalPrice)}
                        </td>
                        <td>
                          <BookingStatus booking={booking} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="dash-empty">
                        Chưa có dữ liệu đặt vé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              className="dash-link"
              type="button"
              onClick={() => onNavigate?.("bookings")}
            >
              Quản lý đặt vé <ArrowRight size={16} />
            </button>
          </section>

          <div className="dash-footer">
            Dữ liệu cập nhật: {formatDateTime(data.generatedAt)}
          </div>
        </>
      )}
    </div>
  );
}
