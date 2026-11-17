
import { useEffect, useState } from "react";
import {
  Plus, Search, Pencil, Trash2, X,
  TicketPercent, RefreshCw
} from "lucide-react";
import {
  getAdminVouchers,
  createAdminVoucher,
  updateAdminVoucher,
  updateAdminVoucherStatus,
  deleteAdminVoucher,
} from "../services/api";
import "./Vouchers.css";

const emptyForm = {
  code: "",
  title: "",
  description: "",
  discountType: "FIXED_AMOUNT",
  discountValue: 10000,
  maxDiscountAmount: 0,
  minOrderAmount: 0,
  startDate: "",
  endDate: "",
  totalLimit: 100,
  usageLimitPerUser: 1,
  applicableCinemas: [],
  applicableFormats: [],
  freeItemName: "",
  isActive: true,
};

const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "-";

const getStatus = (voucher) => {
  const now = Date.now();
  if (!voucher.isActive) return ["Tạm dừng", "inactive"];
  if (new Date(voucher.endDate).getTime() <= now)
    return ["Hết hạn", "expired"];
  if (new Date(voucher.startDate).getTime() > now)
    return ["Sắp diễn ra", "upcoming"];
  return ["Hoạt động", "active"];
};

const getDiscount = (voucher) => {
  if (voucher.discountType === "PERCENTAGE")
    return `Giảm ${voucher.discountValue}%`;
  if (voucher.discountType === "FREE_ITEM")
    return `Tặng ${voucher.freeItemName || "quà"}`;
  return `Giảm ${money(voucher.discountValue)}`;
};

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadVouchers = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getAdminVouchers();
      if (result.success === false) {
        throw new Error(result.message || "Không thể tải voucher.");
      }
      setVouchers(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách voucher.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const openCreate = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400000);
    setEditing(null);
    setForm({
      ...emptyForm,
      startDate: dateInput(now),
      endDate: dateInput(end),
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (voucher) => {
    setEditing(voucher);
    setForm({
      ...emptyForm,
      ...voucher,
      startDate: dateInput(voucher.startDate),
      endDate: dateInput(voucher.endDate),
    });
    setError("");
    setModalOpen(true);
  };

  const change = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveVoucher = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.startDate || !form.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        discountValue: Number(form.discountValue),
        maxDiscountAmount: Number(form.maxDiscountAmount),
        minOrderAmount: Number(form.minOrderAmount),
        totalLimit: Number(form.totalLimit),
        usageLimitPerUser: Number(form.usageLimitPerUser),
      };

      delete payload._id;
      delete payload.usedCount;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;

      const result = editing
        ? await updateAdminVoucher(editing._id, payload)
        : await createAdminVoucher(payload);

      if (result.success === false)
        throw new Error(result.message || "Không thể lưu voucher.");

      setModalOpen(false);
      setNotice(editing ? "Đã cập nhật voucher." : "Đã tạo voucher.");
      await loadVouchers();
    } catch (err) {
      setError(err.message || "Lưu voucher thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (voucher) => {
    setError("");
    setNotice("");
    try {
      const result = await updateAdminVoucherStatus(
        voucher._id,
        !voucher.isActive
      );
      if (result.success === false)
        throw new Error(result.message || "Không thể đổi trạng thái.");
      setNotice("Đã cập nhật trạng thái voucher.");
      await loadVouchers();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeVoucher = async (voucher) => {
    if (voucher.usedCount > 0) {
      setError("Voucher đã được sử dụng. Hãy tạm dừng thay vì xóa.");
      return;
    }

    if (!window.confirm(`Xóa voucher ${voucher.code}?`)) return;

    setError("");
    setNotice("");
    try {
      const result = await deleteAdminVoucher(voucher._id);
      if (result.success === false)
        throw new Error(result.message || "Không thể xóa voucher.");
      setNotice("Đã xóa voucher.");
      await loadVouchers();
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = vouchers.filter((voucher) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      voucher.code?.toLowerCase().includes(keyword) ||
      voucher.title?.toLowerCase().includes(keyword);

    return matchesSearch &&
      (status === "all" || getStatus(voucher)[1] === status);
  });

  const activeCount = vouchers.filter(
    (voucher) => getStatus(voucher)[1] === "active"
  ).length;

  const usedCount = vouchers.reduce(
    (total, voucher) => total + Number(voucher.usedCount || 0), 0
  );

  return (
    <div className="voucher-page">
      <div className="voucher-heading">
        <div>
          <h2>Quản lý Voucher</h2>
          <p>Tạo và quản lý chương trình ưu đãi CineNow</p>
        </div>
        <button className="voucher-primary" onClick={openCreate}>
          <Plus size={18} /> Tạo voucher
        </button>
      </div>

      <div className="voucher-stats">
        <div className="voucher-stat">
          <TicketPercent size={22} />
          <span>Tổng voucher</span>
          <strong>{vouchers.length}</strong>
        </div>
        <div className="voucher-stat">
          <span>Đang hoạt động</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="voucher-stat">
          <span>Tổng lượt sử dụng</span>
          <strong>{usedCount}</strong>
        </div>
      </div>

      {notice && <div className="voucher-notice">{notice}</div>}
      {error && <div className="voucher-error">{error}</div>}

      <div className="voucher-panel">
        <div className="voucher-toolbar">
          <div className="voucher-search">
            <Search size={18} />
            <input
              placeholder="Tìm mã hoặc tên voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm dừng</option>
            <option value="expired">Hết hạn</option>
            <option value="upcoming">Sắp diễn ra</option>
          </select>

          <button className="voucher-icon-btn" onClick={loadVouchers} title="Tải lại">
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="voucher-table-wrap">
          <table className="voucher-table">
            <thead>
              <tr>
                <th>Mã voucher</th>
                <th>Ưu đãi</th>
                <th>Thời hạn</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="voucher-empty">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="voucher-empty">Không có voucher phù hợp.</td></tr>
              ) : filtered.map((voucher) => {
                const [label, state] = getStatus(voucher);
                return (
                  <tr key={voucher._id}>
                    <td>
                      <strong className="voucher-code">{voucher.code}</strong>
                      <small>{voucher.title}</small>
                    </td>
                    <td>{getDiscount(voucher)}</td>
                    <td>
                      {formatDate(voucher.startDate)}
                      <small>Đến {formatDate(voucher.endDate)}</small>
                    </td>
                    <td>
                      {voucher.usedCount || 0} /{" "}
                      {voucher.totalLimit === 0 ? "∞" : voucher.totalLimit}
                    </td>
                    <td>
                      <span className={`voucher-status ${state}`}>{label}</span>
                    </td>
                    <td>
                      <div className="voucher-actions">
                        <button onClick={() => openEdit(voucher)} title="Sửa">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => toggleStatus(voucher)}
                          title={voucher.isActive ? "Tạm dừng" : "Kích hoạt"}
                        >
                          {voucher.isActive ? "Tắt" : "Bật"}
                        </button>
                        <button
                          className="voucher-delete"
                          onClick={() => removeVoucher(voucher)}
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="voucher-modal-overlay" onClick={() => !saving && setModalOpen(false)}>
          <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voucher-modal-header">
              <h3>{editing ? "Chỉnh sửa voucher" : "Tạo voucher mới"}</h3>
              <button type="button" disabled={saving} onClick={() => setModalOpen(false)}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={saveVoucher}>
              <div className="voucher-form-grid">
                <label>
                  Mã voucher *
                  <input required value={form.code}
                    onChange={(e) => change("code", e.target.value.toUpperCase())}
                    placeholder="VD: CINE20" />
                </label>
                <label>
                  Tên voucher *
                  <input required value={form.title}
                    onChange={(e) => change("title", e.target.value)} />
                </label>

                <label className="voucher-full">
                  Mô tả
                  <textarea rows="2" value={form.description}
                    onChange={(e) => change("description", e.target.value)} />
                </label>

                <label>
                  Loại ưu đãi
                  <select value={form.discountType}
                    onChange={(e) => change("discountType", e.target.value)}>
                    <option value="FIXED_AMOUNT">Giảm tiền</option>
                    <option value="PERCENTAGE">Giảm phần trăm</option>
                    <option value="FREE_ITEM">Tặng quà</option>
                  </select>
                </label>

                {form.discountType !== "FREE_ITEM" && (
                  <label>
                    {form.discountType === "PERCENTAGE" ? "Phần trăm giảm *" : "Số tiền giảm *"}
                    <input type="number" min="1"
                      max={form.discountType === "PERCENTAGE" ? 100 : undefined}
                      required value={form.discountValue}
                      onChange={(e) => change("discountValue", e.target.value)} />
                  </label>
                )}

                {form.discountType === "FREE_ITEM" && (
                  <label>
                    Tên quà tặng *
                    <input required value={form.freeItemName}
                      onChange={(e) => change("freeItemName", e.target.value)} />
                  </label>
                )}

                {form.discountType === "PERCENTAGE" && (
                  <label>
                    Giảm tối đa (0 = không giới hạn)
                    <input type="number" min="0" value={form.maxDiscountAmount}
                      onChange={(e) => change("maxDiscountAmount", e.target.value)} />
                  </label>
                )}

                <label>
                  Đơn hàng tối thiểu
                  <input type="number" min="0" value={form.minOrderAmount}
                    onChange={(e) => change("minOrderAmount", e.target.value)} />
                </label>
                <label>
                  Tổng lượt phát hành (0 = vô hạn)
                  <input type="number" min="0" step="1" value={form.totalLimit}
                    onChange={(e) => change("totalLimit", e.target.value)} />
                </label>
                <label>
                  Giới hạn mỗi người
                  <input type="number" min="1" step="1" value={form.usageLimitPerUser}
                    onChange={(e) => change("usageLimitPerUser", e.target.value)} />
                </label>
                <label>
                  Ngày bắt đầu *
                  <input type="datetime-local" required value={form.startDate}
                    onChange={(e) => change("startDate", e.target.value)} />
                </label>
                <label>
                  Ngày kết thúc *
                  <input type="datetime-local" required value={form.endDate}
                    onChange={(e) => change("endDate", e.target.value)} />
                </label>
                <label className="voucher-check">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => change("isActive", e.target.checked)} />
                  Kích hoạt voucher
                </label>
              </div>

              {error && <div className="voucher-error">{error}</div>}

              <div className="voucher-modal-footer">
                <button type="button" className="voucher-secondary"
                  disabled={saving} onClick={() => setModalOpen(false)}>Hủy</button>
                <button type="submit" className="voucher-primary" disabled={saving}>
                  {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
