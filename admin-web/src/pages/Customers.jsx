import { useEffect, useState } from "react";
import {
  Users, UserPlus, Search, RefreshCw, Eye, Lock,
  ChevronLeft, ChevronRight, ArrowLeft,
  Ticket, CreditCard, Coins, ShieldCheck,
  UserRound, Mail, Phone, CalendarDays
} from "lucide-react";

import {
  getAdminCustomers,
  getAdminCustomerDetail
} from "../services/api";

import CustomerPoints from "./CustomerPoints";
import CustomerStatus from "./CustomerStatus";
import "./Customers.css";

const PAGE_SIZE = 10;

const numberFormat = new Intl.NumberFormat("vi-VN");

const moneyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND"
});

const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeZone: "Asia/Ho_Chi_Minh"
});

function number(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormat.format(value)
    : "—";
}

function money(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? moneyFormat.format(value)
    : "—";
}

function date(value) {
  if (!value) return "Chưa có";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "Không xác định"
    : dateFormat.format(parsed);
}

function Avatar({ name }) {
  const initial = typeof name === "string"
    ? Array.from(name.trim())[0]?.toUpperCase()
    : null;

  return (
    <div className="cm-avatar" aria-hidden="true">
      {initial || <UserRound size={20} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, description }) {
  return (
    <article className="cm-stat">
      <div className="cm-stat-top">
        <span>{label}</span>
        <div className="cm-stat-icon"><Icon size={23} /></div>
      </div>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

function Pagination({ data, page, setPage, loading }) {
  const pages = data?.totalPages ?? 0;

  return (
    <div className="cm-pagination">
      <span>Tổng cộng {number(data?.total)} bản ghi</span>
      <div className="cm-pagination-controls">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={loading || page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          <ChevronLeft size={18} />
        </button>
        <span>Trang {page} / {Math.max(1, pages)}</span>
        <button
          type="button"
          aria-label="Trang tiếp theo"
          disabled={loading || page >= pages}
          onClick={() => setPage(p => p + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function Status({ value }) {
  const labels = {
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    paid: "Đã thanh toán",
    pending: "Chờ thanh toán",
    refunded: "Đã hoàn tiền"
  };

  const status = Object.hasOwn(labels, value)
    ? value
    : "unknown";

  return (
    <span className={`cm-status cm-status-${status}`}>
      {labels[status] || "Không xác định"}
    </span>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="cm-info">
      <Icon size={19} />
      <div>
        <span>{label}</span>
        <strong>{value || "Chưa có"}</strong>
      </div>
    </div>
  );
}

function useRequest(load, dependencies) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: ""
  });

  useEffect(() => {
    const controller = new AbortController();

    setState({
      data: null,
      loading: true,
      error: ""
    });

    async function run() {
      try {
        const data = await load(controller.signal);

        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: "" });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            data: null,
            loading: false,
            error: error.message || "Không thể tải dữ liệu."
          });
        }
      }
    }

    run();

    return () => controller.abort();
  // The caller supplies the complete request dependencies.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return state;
}

function RequestMessage({ loading, error, retry }) {
  if (loading) {
    return <div className="cm-empty" role="status">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return (
      <div className="cm-error" role="alert">
        <span>{error}</span>
        <button type="button" onClick={retry}>Thử lại</button>
      </div>
    );
  }

  return null;
}

function CustomerDetail({ id, onBack }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const { data, loading, error } = useRequest(
    signal => getAdminCustomerDetail(id, {
      page, limit: PAGE_SIZE, signal
    }),
    [id, page, revision]
  );

  const customer = data?.customer;
  const stats = data?.stats;

  return (
    <section className="cm-page">
      <div className="cm-heading">
        <button className="cm-button" type="button" onClick={onBack}>
          <ArrowLeft size={18} /> Danh sách khách hàng
        </button>
        <button
          className="cm-button"
          type="button"
          disabled={loading}
          onClick={() => setRevision(v => v + 1)}
        >
          <RefreshCw size={17} /> Làm mới
        </button>
      </div>

      <RequestMessage
        loading={loading}
        error={error}
        retry={() => setRevision(v => v + 1)}
      />

      {!loading && !error && customer && (
        <>
          <div className="cm-profile cm-panel">
            <Avatar name={customer.fullName} />
            <div className="cm-profile-name">
              <h2>{customer.fullName || "Khách hàng"}</h2>
              <p>Thành viên CineNow</p>
              <small>Mã: {customer._id}</small>
            </div>
            <span className="cm-readonly">
              <ShieldCheck size={16} /> Chỉ đọc
            </span>
          </div>

          <div className="cm-stats cm-stats-three">
            <Stat icon={Ticket} label="Tổng đơn đặt vé"
              value={number(stats?.totalBookings)}
              description="Toàn bộ lịch sử" />
            <Stat icon={CreditCard} label="Đơn thanh toán hợp lệ"
              value={number(stats?.paidBookings)}
              description="Đã xác nhận và thanh toán" />
            <Stat icon={Coins} label="Tổng chi tiêu hợp lệ"
              value={money(stats?.totalSpent)}
              description="Không gồm đơn đã hủy" />
          </div>

          <div className="cm-detail-grid">
            <article className="cm-panel cm-section">
              <h3>Thông tin cá nhân</h3>
              <Info icon={UserRound} label="Họ và tên"
                value={customer.fullName} />
              <Info icon={Mail} label="Email"
                value={customer.email} />
              <Info icon={Phone} label="Số điện thoại"
                value={customer.phone} />
              <Info icon={CalendarDays} label="Ngày đăng ký"
                value={date(customer.createdAt)} />
            </article>

            <CustomerPoints key={customer._id} customerId={customer._id} />
          </div>



          <article className="cm-panel">
            <div className="cm-section">
              <h3>Lịch sử đặt vé</h3>
              <p className="cm-muted">
                Theo dõi các đơn đặt vé của khách hàng.
              </p>
            </div>

            <div className="cm-table-scroll">
              <table className="cm-table">
                <thead>
                  <tr>
                    <th>Mã đặt vé</th>
                    <th>Phim / Rạp</th>
                    <th>Suất chiếu</th>
                    <th>Ghế</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="cm-empty">
                        Chưa có đơn đặt vé.
                      </td>
                    </tr>
                  ) : data.bookings.map(booking => (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.bookingCode || "—"}</strong>
                        <small>{date(booking.createdAt)}</small>
                      </td>
                      <td>
                        <strong>{booking.movieTitle || "—"}</strong>
                        <small>{booking.cinemaName || "—"}</small>
                      </td>
                      <td>
                        <strong>{booking.date || "—"}</strong>
                        <small>{booking.time || "—"} · {booking.room || "—"}</small>
                      </td>
                      <td>
                        {Array.isArray(booking.seats)
                          ? booking.seats.join(", ") || "—"
                          : "—"}
                      </td>
                      <td>{money(booking.totalPrice)}</td>
                      <td><Status value={booking.status} /></td>
                      <td><Status value={booking.paymentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              data={data.pagination}
              page={page}
              setPage={setPage}
              loading={loading}
            />
          </article>
        </>
      )}
    </section>
  );
}

export default function Customers() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const { data, loading, error } = useRequest(
    signal => getAdminCustomers({
      page,
      limit: PAGE_SIZE,
      search,
      status,
      signal
    }),
    [page, search, status, revision]
  );

  const stats = data?.stats;
  const totalPages = data?.pagination?.totalPages;

  useEffect(() => {
    if (
      !loading &&
      !error &&
      Number.isSafeInteger(totalPages) &&
      page > Math.max(1, totalPages)
    ) {
      setPage(Math.max(1, totalPages));
    }
  }, [loading, error, totalPages, page]);

  function refresh() {
    setRevision(value => value + 1);
  }

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(input.trim());
    refresh();
  }

  function selectStatus(value) {
    setPage(1);
    setStatus(value);
  }

  function resetFilters() {
    setInput("");
    setSearch("");
    setStatus("all");
    setPage(1);
    refresh();
  }

  const filters = [
    {
      value: "all",
      label: "Tất cả",
      count: stats?.totalCustomers
    },
    {
      value: "active",
      label: "Hoạt động",
      count: stats?.activeCustomers
    },
    {
      value: "locked",
      label: "Đã khóa",
      count: stats?.lockedCustomers
    }
  ];

  if (selectedId) {
    return (
      <CustomerDetail
        key={selectedId}
        id={selectedId}
        onBack={() => {
          setSelectedId(null);
          refresh();
        }}
      />
    );
  }

  return (
    <section className="cm-page cm-customer-list">
      <div className="cm-heading">
        <div>
          <h2>Quản lý khách hàng</h2>
          <p>
            Quản lý thành viên và trạng thái tài khoản CineNow.
          </p>
        </div>

        <button
          className="cm-button cm-primary"
          type="button"
          disabled={loading}
          onClick={refresh}
        >
          <RefreshCw
            size={17}
            className={loading ? "cm-spin" : ""}
          />
          Làm mới
        </button>
      </div>

      <div className="cm-stats cm-stats-four">
        <Stat
          icon={Users}
          label="Tổng khách hàng"
          value={number(stats?.totalCustomers)}
          description="Thành viên trong hệ thống"
        />

        <Stat
          icon={UserPlus}
          label="Mới trong tháng"
          value={number(stats?.newCustomers)}
          description="Đăng ký trong tháng hiện tại"
        />

        <Stat
          icon={ShieldCheck}
          label="Đang hoạt động"
          value={number(stats?.activeCustomers)}
          description="Tài khoản không bị khóa"
        />

        <Stat
          icon={Lock}
          label="Đã khóa"
          value={number(stats?.lockedCustomers)}
          description="Tài khoản bị hạn chế"
        />
      </div>

      {stats?.invalidCustomers > 0 && (
        <div className="cm-error" role="alert">
          Có {number(stats.invalidCustomers)} tài khoản
          có dữ liệu trạng thái không hợp lệ.
        </div>
      )}

      <article className="cm-panel">
        <div className="cm-section">
          <h3>Danh sách khách hàng</h3>

          <p className="cm-muted">
            Tìm kiếm, lọc và quản lý tài khoản thành viên.
          </p>

          <form
            className="cm-search"
            onSubmit={submitSearch}
          >
            <Search size={19} />

            <input
              aria-label="Tìm kiếm khách hàng"
              placeholder="Tìm họ tên, email, số điện thoại..."
              value={input}
              maxLength={100}
              onChange={event =>
                setInput(event.target.value)
              }
            />

            <button
              className="cm-button cm-primary"
              type="submit"
            >
              Tìm kiếm
            </button>
          </form>

          <div
            className="cm-status-filters"
            role="group"
            aria-label="Lọc trạng thái tài khoản"
          >
            {filters.map(filter => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={status === filter.value}
                className={
                  `cm-filter-button cm-filter-${filter.value}` +
                  (status === filter.value
                    ? " cm-filter-selected"
                    : "")
                }
                onClick={() =>
                  selectStatus(filter.value)
                }
              >
                {filter.label}
                <span>{number(filter.count)}</span>
              </button>
            ))}

            {(search || input || status !== "all") && (
              <button
                className="cm-clear"
                type="button"
                onClick={resetFilters}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <RequestMessage
          loading={loading}
          error={error}
          retry={refresh}
        />

        {!loading && !error && data && (
          <>
            <div className="cm-table-scroll">
              <table className="cm-table cm-customer-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Liên hệ</th>
                    <th>Điểm thành viên</th>
                    <th>Ngày đăng ký</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {data.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="cm-empty">
                        Không tìm thấy khách hàng phù hợp.
                      </td>
                    </tr>
                  ) : data.data.map(customer => (
                    <tr key={customer._id}>
                      <td>
                        <div className="cm-person">
                          <Avatar name={customer.fullName} />

                          <div className="cm-person-text">
                            <strong
                              title={customer.fullName}
                            >
                              {customer.fullName || "Khách hàng"}
                            </strong>

                            <small title={customer._id}>
                              #{customer._id.slice(-8).toUpperCase()}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td className="cm-contact-cell">
                        <strong title={customer.email}>
                          {customer.email || "Chưa có email"}
                        </strong>

                        <small title={customer.phone}>
                          {customer.phone || "Chưa có SĐT"}
                        </small>
                      </td>

                      <td>
                        <div className="cm-point-value">
                          <Coins size={16} />
                          {number(customer.loyaltyPoints)}
                        </div>
                      </td>

                      <td>{date(customer.createdAt)}</td>

                      <td>
                        <div className="cm-row-actions">
                          <button
                            className="cm-button cm-icon-button"
                            type="button"
                            title="Xem chi tiết"
                            aria-label="Xem chi tiết khách hàng"
                            onClick={() =>
                              setSelectedId(customer._id)
                            }
                          >
                            <Eye size={18} />
                          </button>

                          {customer.accountStatus === "invalid" ? (
                            <span className="cm-invalid-status">
                              Lỗi trạng thái
                            </span>
                          ) : (
                            <CustomerStatus
                              key={customer._id}
                              customerId={customer._id}
                              customerName={customer.fullName}
                              accountStatus={customer.accountStatus}
                              onStatusChanged={refresh}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              data={data.pagination}
              page={page}
              setPage={setPage}
              loading={loading}
            />
          </>
        )}
      </article>
    </section>
  );
}
