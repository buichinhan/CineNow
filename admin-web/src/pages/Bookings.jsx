
import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Ticket,
  ChevronLeft,
  ChevronRight,
  X,
  Film,
  MapPin,
  CalendarDays,
  Armchair,
  CreditCard,
  UserRound,
} from "lucide-react";

import {
  getAdminBookings,
  getAdminBookingDetail,
} from "../services/api";

import "./Bookings.css";

const PAGE_SIZE = 10;

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value) || 0);

const dateTime = (value) => {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Không xác định"
    : date.toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
};

const bookingStatus = {
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
};

const paymentStatus = {
  paid: "Đã thanh toán",
  pending: "Chờ thanh toán",
  refunded: "Đã hoàn tiền",
};

function StatusBadge({ value, type }) {
  const labels =
    type === "payment" ? paymentStatus : bookingStatus;

  return (
    <span className={`bk-status bk-status-${value || "unknown"}`}>
      {labels[value] || value || "Không rõ"}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="bk-detail-item">
      <span>{label}</span>
      <strong>{value ?? "Không có"}</strong>
    </div>
  );
}

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        const result = await getAdminBookings({
          page,
          limit: PAGE_SIZE,
          search,
          status,
          paymentStatus: payment,
        });

        if (!active || controller.signal.aborted) return;

        setBookings(
          Array.isArray(result.data) ? result.data : []
        );

        setPagination(
          result.pagination || {
            page,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        if (!active) return;
        setError(err.message || "Không thể tải đặt vé.");
        setBookings([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBookings();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, search, status, payment, refreshKey]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const refresh = () => setRefreshKey((value) => value + 1);

  const openDetail = async (id) => {
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const result = await getAdminBookingDetail(id);
      setDetail(result);
    } catch (err) {
      setDetailError(
        err.message || "Không thể tải chi tiết đặt vé."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const showModal =
    detailLoading || Boolean(detail) || Boolean(detailError);

  return (
    <div className="bk-page">
      <div className="bk-heading">
        <div>
          <h2>Quản lý đặt vé</h2>
          <p>
            Theo dõi đơn đặt vé và trạng thái thanh toán
            từ hệ thống CineNow.
          </p>
        </div>

        <button
          className="bk-button bk-refresh"
          onClick={refresh}
          disabled={loading}
          type="button"
        >
          <RefreshCw size={17} />
          Làm mới
        </button>
      </div>

      <div className="bk-summary">
        <div className="bk-summary-icon">
          <Ticket size={23} />
        </div>
        <div>
          <span>Tổng đơn phù hợp bộ lọc</span>
          <strong>{pagination.total || 0}</strong>
        </div>
      </div>

      <div className="bk-panel">
        <div className="bk-filters">
          <form
            className="bk-search"
            onSubmit={applySearch}
          >
            <Search size={18} />
            <input
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Mã vé, tên phim, tên rạp..."
            />
            <button type="submit">Tìm kiếm</button>
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Lọc trạng thái vé"
          >
            <option value="">Tất cả trạng thái vé</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select
            value={payment}
            onChange={(event) => {
              setPayment(event.target.value);
              setPage(1);
            }}
            aria-label="Lọc trạng thái thanh toán"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>
        </div>

        {error && (
          <div className="bk-error" role="alert">
            {error}
          </div>
        )}

        <div className="bk-table-scroll">
          <table className="bk-table">
            <thead>
              <tr>
                <th>Mã đặt vé</th>
                <th>Phim</th>
                <th>Khách hàng</th>
                <th>Ghế</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="bk-empty">
                    Đang tải danh sách đặt vé...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="bk-empty">
                    Không tìm thấy đơn đặt vé phù hợp.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong className="bk-code">
                        {booking.bookingCode}
                      </strong>
                      <small>
                        {dateTime(booking.createdAt)}
                      </small>
                    </td>

                    <td>
                      <strong>{booking.movieTitle}</strong>
                      <small>{booking.cinemaName}</small>
                    </td>

                    <td>
                      <strong>
                        {booking.userId?.fullName ||
                          "Khách hàng"}
                      </strong>
                      <small>
                        {booking.userId?.email || "Không có email"}
                      </small>
                    </td>

                    <td>
                      {Array.isArray(booking.seats)
                        ? booking.seats.join(", ") || "Không có"
                        : "Không có"}
                    </td>

                    <td className="bk-price">
                      {money(booking.totalPrice)}
                    </td>

                    <td>
                      <StatusBadge value={booking.status} />
                    </td>

                    <td>
                      <StatusBadge
                        value={booking.paymentStatus}
                        type="payment"
                      />
                    </td>

                    <td>
                      <button
                        className="bk-view"
                        type="button"
                        onClick={() => openDetail(booking._id)}
                      >
                        <Eye size={16} />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bk-pagination">
          <span>
            Trang {pagination.page || page} /{" "}
            {Math.max(1, pagination.totalPages || 0)}
          </span>

          <div className="bk-pagination-buttons">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              disabled={
                loading ||
                page >= (pagination.totalPages || 1)
              }
              onClick={() => setPage((p) => p + 1)}
              aria-label="Trang tiếp"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="bk-modal-overlay"
          onClick={closeDetail}
        >
          <section
            className="bk-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết đặt vé"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bk-modal-header">
              <div>
                <h3>Chi tiết đặt vé</h3>
                <p>{detail?.bookingCode || "Đang tải..."}</p>
              </div>

              <button
                type="button"
                className="bk-close"
                onClick={closeDetail}
                aria-label="Đóng"
              >
                <X size={21} />
              </button>
            </div>

            <div className="bk-modal-body">
              {detailLoading ? (
                <p>Đang tải chi tiết...</p>
              ) : detailError ? (
                <div className="bk-error">{detailError}</div>
              ) : detail ? (
                <>
                  <div className="bk-detail-status">
                    <StatusBadge value={detail.status} />
                    <StatusBadge
                      value={detail.paymentStatus}
                      type="payment"
                    />
                  </div>

                  <h4>
                    <UserRound size={17} />
                    Khách hàng
                  </h4>

                  <DetailItem
                    label="Họ tên"
                    value={detail.userId?.fullName || "Không có"}
                  />
                  <DetailItem
                    label="Email"
                    value={detail.userId?.email || "Không có"}
                  />
                  <DetailItem
                    label="Số điện thoại"
                    value={detail.userId?.phone || "Không có"}
                  />

                  <h4>
                    <Film size={17} />
                    Thông tin phim
                  </h4>

                  <DetailItem
                    label="Tên phim"
                    value={detail.movieTitle}
                  />
                  <DetailItem
                    label="Rạp"
                    value={detail.cinemaName}
                  />
                  <DetailItem
                    label="Phòng"
                    value={detail.room}
                  />

                  <h4>
                    <CalendarDays size={17} />
                    Suất chiếu
                  </h4>

                  <DetailItem label="Ngày" value={detail.date} />
                  <DetailItem label="Giờ" value={detail.time} />

                  <h4>
                    <Armchair size={17} />
                    Ghế và dịch vụ
                  </h4>

                  <DetailItem
                    label="Ghế"
                    value={detail.seats?.join(", ") || "Không có"}
                  />
                  <DetailItem
                    label="Tiền ghế"
                    value={money(detail.seatTotal)}
                  />
                  <DetailItem
                    label="Đồ ăn và nước"
                    value={
                      detail.concessions?.length
                        ? detail.concessions
                            .map(
                              (item) =>
                                `${item.name} × ${item.quantity}`
                            )
                            .join(", ")
                        : "Không có"
                    }
                  />
                  <DetailItem
                    label="Tiền đồ ăn"
                    value={money(detail.concessionsTotal)}
                  />

                  <h4>
                    <CreditCard size={17} />
                    Thanh toán
                  </h4>

                  <DetailItem
                    label="Tạm tính"
                    value={money(detail.subtotal)}
                  />
                  <DetailItem
                    label="Voucher"
                    value={detail.voucherCode || "Không có"}
                  />
                  <DetailItem
                    label="Giảm giá"
                    value={money(detail.voucherDiscount)}
                  />
                  <DetailItem
                    label="Phương thức"
                    value={detail.paymentMethod}
                  />
                  <DetailItem
                    label="Hoàn tiền"
                    value={detail.refundStatus || "Chưa có"}
                  />
                  <DetailItem
                    label="Ngày tạo"
                    value={dateTime(detail.createdAt)}
                  />

                  <div className="bk-total">
                    <span>Tổng thanh toán</span>
                    <strong>{money(detail.totalPrice)}</strong>
                  </div>

                  <p className="bk-notice">
                    Chức năng hủy vé tạm khóa cho đến khi
                    hoàn thiện đồng bộ ghế và quy trình
                    hoàn tiền.
                  </p>
                </>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
