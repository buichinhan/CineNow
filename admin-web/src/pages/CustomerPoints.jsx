import { useEffect, useRef, useState } from "react";

import {
  Coins,
  Plus,
  Minus,
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

import {
  getAdminCustomerPoints,
  adjustAdminCustomerPoints
} from "../services/api";

const LIMIT = 10;
const MAX_POINTS = 10000;

const TYPES = {
  EARN: "Tích điểm",
  REDEEM: "Sử dụng điểm",
  REFUND: "Hoàn / thu hồi điểm",
  ADMIN_ADD: "Admin cộng điểm",
  ADMIN_DEDUCT: "Admin trừ điểm"
};

const REASONS = {
  add: [
    "Thưởng khách hàng mua nhiều vé",
    "Thưởng khách hàng thân thiết",
    "Bổ sung điểm còn thiếu",
    "Bồi thường sự cố dịch vụ"
  ],
  deduct: [
    "Thu hồi điểm cộng nhầm",
    "Điều chỉnh sai lệch điểm",
    "Thu hồi điểm thưởng không hợp lệ"
  ]
};

const format = new Intl.NumberFormat("vi-VN");

function number(value) {
  return Number.isSafeInteger(value)
    ? format.format(value)
    : "—";
}

function date(value) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh"
  });
}

function readPending(key) {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(key) || "null"
    );

    if (!value) return null;

    if (
      !["add", "deduct"].includes(value.action) ||
      !Number.isSafeInteger(value.points) ||
      value.points < 1 ||
      value.points > MAX_POINTS ||
      typeof value.reason !== "string" ||
      typeof value.operationId !== "string"
    ) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

export default function CustomerPoints({ customerId }) {
  const storageKey = `cinenow_pending_points_${customerId}`;

  const [pending, setPending] = useState(
    () => readPending(storageKey)
  );

  const [action, setAction] = useState(
    pending?.action || "add"
  );

  const [points, setPoints] = useState(
    pending ? String(pending.points) : ""
  );

  const [reason, setReason] = useState(
    pending?.reason || ""
  );

  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const busyRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setLoadError("");

    getAdminCustomerPoints(customerId, {
      page,
      limit: LIMIT,
      signal: controller.signal
    })
      .then(result => {
        if (!controller.signal.aborted) {
          setData(result);
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setData(null);
          setLoadError(error.message || "Không tải được điểm.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [customerId, page, revision]);

  const amount = Number(points);
  const balance = data?.balance;
  const debt = data?.debt;

  const validAmount =
    /^[1-9]\d*$/.test(points) &&
    Number.isSafeInteger(amount) &&
    amount <= MAX_POINTS;

  const validBalance =
    Number.isSafeInteger(balance) &&
    balance >= 0 &&
    Number.isSafeInteger(debt) &&
    debt >= 0;

  const debtPaid =
    validAmount && validBalance && action === "add"
      ? Math.min(amount, debt)
      : 0;

  const nextBalance =
    validAmount && validBalance
      ? action === "add"
        ? balance + amount - debtPaid
        : balance - amount
      : null;

  const nextDebt =
    validBalance ? debt - debtPaid : null;

  const validReason =
    reason.trim().length >= 5 &&
    reason.trim().length <= 300;

  const canSubmit =
    !loading &&
    !loadError &&
    !submitting &&
    data?.canAdjust === true &&
    validAmount &&
    validBalance &&
    Number.isSafeInteger(nextBalance) &&
    nextBalance >= 0 &&
    validReason;

  const formLocked = submitting || Boolean(pending);

  function changeAction(value) {
    if (formLocked) return;

    setAction(value);
    setReason("");
    setSuccess("");
    setSubmitError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (busyRef.current || (!pending && !canSubmit)) {
      return;
    }

    let payload = pending;

    if (!payload) {
      const confirmed = window.confirm(
        `${action === "add" ? "Cộng" : "Trừ"} ${number(amount)} điểm?\n` +
        `Số dư dự kiến: ${number(nextBalance)} điểm\n` +
        `Lý do: ${reason.trim()}`
      );

      if (!confirmed) return;

      try {
        payload = {
          action,
          points: amount,
          reason: reason.trim(),
          operationId: crypto.randomUUID()
        };

        sessionStorage.setItem(
          storageKey,
          JSON.stringify(payload)
        );
      } catch {
        setSubmitError(
          "Không thể lưu mã giao dịch an toàn. Chưa gửi yêu cầu."
        );
        return;
      }

      setPending(payload);
    }

    busyRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    setSuccess("");

    try {
      const result = await adjustAdminCustomerPoints(
        customerId,
        payload
      );

      sessionStorage.removeItem(storageKey);

      if (mountedRef.current) {
        setPending(null);
        setPoints("");
        setReason("");

        setSuccess(
          result.replayed
            ? "Giao dịch đã được thực hiện trước đó."
            : "Điều chỉnh điểm thành công."
        );

        setPage(1);
        setRevision(value => value + 1);
      }
    } catch (error) {
      if (mountedRef.current) {
        setSubmitError(
          `${error.message || "Không xác nhận được giao dịch."} ` +
          "Hãy kiểm tra lịch sử hoặc thử lại cùng mã giao dịch."
        );
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }

  const totalPages = data?.pagination?.totalPages ?? 0;

  return (
    <article className="cm-panel cm-section cp-panel">
      <div className="cp-heading">
        <h3>Điểm thành viên</h3>

        <button
          type="button"
          className="cm-button"
          disabled={loading || submitting}
          onClick={() => setRevision(value => value + 1)}
          aria-label="Làm mới điểm"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="cm-points">
        <Coins size={30} />
        <strong>{loading ? "..." : number(balance)}</strong>
        <span>Điểm hiện tại</span>
      </div>

      <div className="cm-debt">
        <span>Điểm còn nợ</span>
        <strong>{number(debt)}</strong>
      </div>

      {loadError && (
        <div className="cp-alert cp-alert-error" role="alert">
          {loadError}
        </div>
      )}

      {!loading && data?.canAdjust === false && (
        <div className="cp-alert" role="status">
          Dữ liệu điểm chưa đầy đủ hoặc không hợp lệ.
          Tài khoản này chưa thể điều chỉnh điểm.
        </div>
      )}

      <form className="cp-form" onSubmit={submit}>
        <div className="cp-actions">
          <button
            type="button"
            disabled={formLocked}
            aria-pressed={action === "add"}
            className={`cm-button ${action === "add" ? "cp-active-add" : ""}`}
            onClick={() => changeAction("add")}
          >
            <Plus size={17} /> Cộng điểm
          </button>

          <button
            type="button"
            disabled={formLocked}
            aria-pressed={action === "deduct"}
            className={`cm-button ${action === "deduct" ? "cp-active-deduct" : ""}`}
            onClick={() => changeAction("deduct")}
          >
            <Minus size={17} /> Trừ điểm
          </button>
        </div>

        <label className="cp-field">
          <span>Số điểm điều chỉnh</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={5}
            placeholder="Nhập số điểm"
            value={points}
            disabled={formLocked || !data?.canAdjust}
            onChange={event => setPoints(event.target.value)}
          />
        </label>

        <div className="cp-presets">
          {[10, 20, 50, 100, 200].map(value => (
            <button
              key={value}
              type="button"
              className={`cm-button ${points === String(value) ? "cp-selected" : ""}`}
              disabled={
                formLocked ||
                !data?.canAdjust ||
                (action === "deduct" && value > balance)
              }
              onClick={() => setPoints(String(value))}
            >
              {value}
            </button>
          ))}
        </div>

        {points && !validAmount && (
          <small className="cp-error-text">
            Nhập số nguyên từ 1 đến 10.000.
          </small>
        )}

        {action === "deduct" &&
          validAmount &&
          validBalance &&
          amount > balance && (
            <small className="cp-error-text">
              Không thể trừ vượt số dư hiện tại.
            </small>
          )}

        <label className="cp-field">
          <span>Lý do điều chỉnh</span>
          <select
            disabled={formLocked || !data?.canAdjust}
            value={REASONS[action].includes(reason) ? reason : ""}
            onChange={event => setReason(event.target.value)}
          >
            <option value="">Chọn lý do hoặc nhập bên dưới</option>

            {REASONS[action].map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <textarea
            rows={3}
            maxLength={300}
            disabled={formLocked || !data?.canAdjust}
            value={reason}
            placeholder="Nhập lý do cụ thể..."
            onChange={event => setReason(event.target.value)}
          />

          <small>{reason.length}/300 ký tự · Tối thiểu 5</small>
        </label>

        <div className="cp-preview">
          <div>
            <span>Số dư trước</span>
            <strong>{number(balance)}</strong>
          </div>

          <div>
            <span>Điều chỉnh</span>
            <strong className={
              action === "add" ? "cp-positive" : "cp-negative"
            }>
              {validAmount
                ? `${action === "add" ? "+" : "-"}${number(amount)}`
                : "—"}
            </strong>
          </div>

          {debtPaid > 0 && (
            <div>
              <span>Điểm dùng để bù nợ</span>
              <strong>{number(debtPaid)}</strong>
            </div>
          )}

          <div>
            <span>Nợ điểm dự kiến</span>
            <strong>{number(nextDebt)}</strong>
          </div>

          <div className="cp-preview-total">
            <span>Số dư dự kiến</span>
            <strong>
              {nextBalance >= 0 ? number(nextBalance) : "—"}
            </strong>
          </div>
        </div>

        {pending && (
          <div className="cp-alert" role="status">
            Có giao dịch đang chờ xác nhận kết quả.
            Không tạo mã giao dịch mới khi thử lại.
          </div>
        )}

        {submitError && (
          <div className="cp-alert cp-alert-error" role="alert">
            {submitError}
          </div>
        )}

        {success && (
          <div className="cp-alert cp-alert-success" role="status">
            <ShieldCheck size={18} /> {success}
          </div>
        )}

        <button
          type="submit"
          className="cm-button cm-primary cp-submit"
          disabled={submitting || (!pending && !canSubmit)}
        >
          {submitting
            ? "Đang xử lý..."
            : pending
              ? "Thử lại giao dịch"
              : `Xác nhận ${action === "add" ? "cộng" : "trừ"} điểm`}
        </button>
      </form>

      <section className="cp-history">
        <div className="cp-heading">
          <h3><History size={19} /> Lịch sử biến động điểm</h3>
        </div>

        {loading ? (
          <p>Đang tải lịch sử...</p>
        ) : loadError ? (
          <p>Không thể tải lịch sử.</p>
        ) : !data?.transactions?.length ? (
          <p>Chưa có giao dịch điểm.</p>
        ) : (
          data.transactions.map(item => (
            <div className="cp-transaction" key={item._id}>
              <div className="cp-transaction-top">
                <strong>
                  {TYPES[item.type] || "Giao dịch khác"}
                </strong>

                <strong className={
                  item.points > 0
                    ? "cp-positive"
                    : item.points < 0
                      ? "cp-negative"
                      : ""
                }>
                  {item.points > 0 ? "+" : ""}
                  {number(item.points)}
                </strong>
              </div>

              <p>{item.description || "Không có mô tả"}</p>

              <div className="cp-transaction-meta">
                <span>{date(item.createdAt)}</span>
                <span>
                  Số dư: {number(item.balanceBefore)}
                  {" → "}
                  {number(item.balanceAfter)}
                </span>

                {Number.isSafeInteger(item.debtBefore) && (
                  <span>
                    Nợ: {number(item.debtBefore)}
                    {" → "}
                    {number(item.debtAfter)}
                  </span>
                )}

                {item.type?.startsWith("ADMIN_") && (
                  <span>
                    Admin: {item.performedBy?.fullName || "Không xác định"}
                  </span>
                )}

                {item.bookingCode && (
                  <span>Mã vé: {item.bookingCode}</span>
                )}
              </div>
            </div>
          ))
        )}

        <div className="cp-pagination">
          <button
            className="cm-button"
            type="button"
            aria-label="Trang trước"
            disabled={loading || page <= 1}
            onClick={() => setPage(value => value - 1)}
          >
            <ChevronLeft size={16} />
          </button>

          <span>{page}/{Math.max(1, totalPages)}</span>

          <button
            className="cm-button"
            type="button"
            aria-label="Trang tiếp theo"
            disabled={loading || page >= totalPages}
            onClick={() => setPage(value => value + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </article>
  );
}