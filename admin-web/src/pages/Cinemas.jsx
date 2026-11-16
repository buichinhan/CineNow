
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  MapPin,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  RotateCcw,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

import {
  getCinemas,
  createCinema,
  updateCinema,
  updateCinemaStatus,
} from "../services/api";

import "./Cinemas.css";

const EMPTY_FORM = {
  name: "",
  address: "",
  district: "",
  city: "TP. Hồ Chí Minh",
  distance: "1,2 km",
  status: "ACTIVE",
};

function isActive(cinema) {
  return cinema.status !== "INACTIVE";
}

export default function Cinemas() {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCinemas() {
    setLoading(true);
    setError("");

    try {
      const data = await getCinemas();
      setCinemas(data);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách rạp.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCinemas();
  }, []);

  const counts = useMemo(() => ({
    all: cinemas.length,
    active: cinemas.filter(isActive).length,
    inactive: cinemas.filter((c) => !isActive(c)).length,
  }), [cinemas]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return cinemas.filter((cinema) => {
      const status = isActive(cinema) ? "ACTIVE" : "INACTIVE";

      if (filter !== "ALL" && filter !== status) {
        return false;
      }

      return (
        !keyword ||
        [
          cinema.name,
          cinema.address,
          cinema.district,
          cinema.city,
        ].some((value) =>
          String(value || "")
            .toLocaleLowerCase("vi")
            .includes(keyword)
        )
      );
    });
  }, [cinemas, search, filter]);

  function openCreate() {
    setEditing({ mode: "create" });
    setForm({ ...EMPTY_FORM });
    setError("");
    setMessage("");
  }

  function openEdit(cinema) {
    setEditing({ mode: "edit", id: cinema._id });
    setForm({
      name: cinema.name || "",
      address: cinema.address || "",
      district: cinema.district || "",
      city: cinema.city || "",
      distance: cinema.distance || "",
      status: isActive(cinema) ? "ACTIVE" : "INACTIVE",
    });
    setError("");
    setMessage("");
  }

  function changeField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveCinema(event) {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.address.trim() ||
      !form.district.trim()
    ) {
      setError("Vui lòng nhập tên rạp, địa chỉ và quận/huyện.");
      return;
    }

    setBusy(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      distance: form.distance.trim(),
      status: form.status,
    };

    try {
      if (editing.mode === "create") {
        await createCinema(payload);
        setMessage("Đã thêm rạp thành công.");
      } else {
        await updateCinema(editing.id, payload);
        setMessage("Đã cập nhật thông tin rạp.");
      }

      setEditing(null);
      await loadCinemas();
    } catch (err) {
      setError(err.message || "Không thể lưu thông tin rạp.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(cinema) {
    const next = isActive(cinema) ? "INACTIVE" : "ACTIVE";
    const action = next === "ACTIVE"
      ? "mở lại hoạt động"
      : "tạm ngừng hoạt động";

    if (
      !window.confirm(
        `Bạn muốn ${action} rạp "${cinema.name}"?`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await updateCinemaStatus(cinema._id, next);
      setMessage(`Đã ${action} rạp "${cinema.name}".`);
      await loadCinemas();
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cinemas-page">
      <div className="cinemas-heading">
        <div>
          <h2>Danh sách rạp chiếu phim</h2>
          <p>
            Quản lý hệ thống rạp chiếu phim CineNow.
          </p>
        </div>

        <div className="cinemas-heading-actions">
          <button
            className="cinemas-secondary"
            onClick={loadCinemas}
            disabled={loading || busy}
          >
            <RefreshCw size={17} />
            Làm mới
          </button>

          <button
            className="cinemas-primary"
            onClick={openCreate}
            disabled={busy}
          >
            <Plus size={18} />
            Thêm rạp
          </button>
        </div>
      </div>

      <div className="cinemas-stats">
        {[
          ["Tổng số rạp", counts.all],
          ["Đang hoạt động", counts.active],
          ["Tạm ngừng", counts.inactive],
        ].map(([label, count]) => (
          <div className="cinemas-stat" key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      {message && (
        <div className="cinemas-success">{message}</div>
      )}

      {error && (
        <div className="cinemas-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="cinemas-toolbar">
        <div className="cinemas-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên rạp, địa chỉ, thành phố..."
          />
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Tạm ngừng</option>
        </select>
      </div>

      {loading ? (
        <div className="cinemas-empty">
          Đang tải danh sách rạp...
        </div>
      ) : filtered.length === 0 ? (
        <div className="cinemas-empty">
          <Building2 size={40} />
          <p>Không tìm thấy rạp phù hợp.</p>
        </div>
      ) : (
        <div className="cinemas-list">
          {filtered.map((cinema) => (
            <div className="cinemas-item" key={cinema._id}>
              <div className="cinemas-icon">
                <Building2 size={30} />
              </div>

              <div className="cinemas-info">
                <h3>{cinema.name}</h3>

                <p>
                  <MapPin size={15} />
                  {cinema.address}
                </p>

                <div className="cinemas-meta">
                  <span>
                    {cinema.district}
                    {cinema.city ? ` · ${cinema.city}` : ""}
                  </span>

                  <span
                    className={`cinemas-status ${
                      isActive(cinema) ? "active" : "inactive"
                    }`}
                  >
                    {isActive(cinema)
                      ? "Đang hoạt động"
                      : "Tạm ngừng"}
                  </span>
                </div>
              </div>

              <div className="cinemas-actions">
                <button
                  onClick={() => openEdit(cinema)}
                  disabled={busy}
                >
                  <Pencil size={16} />
                  Sửa
                </button>

                <button
                  onClick={() => changeStatus(cinema)}
                  disabled={busy}
                  className={
                    isActive(cinema) ? "stop" : "restart"
                  }
                >
                  {isActive(cinema) ? (
                    <Power size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  )}

                  {isActive(cinema) ? "Tạm ngừng" : "Mở lại"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="cinemas-modal-backdrop">
          <div
            className="cinemas-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Thông tin rạp"
          >
            <div className="cinemas-modal-header">
              <h2>
                {editing.mode === "create"
                  ? "Thêm rạp chiếu phim"
                  : "Chỉnh sửa rạp chiếu phim"}
              </h2>

              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                aria-label="Đóng"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveCinema}>
              <div className="cinemas-form-grid">
                {[
                  ["name", "Tên rạp *"],
                  ["address", "Địa chỉ *"],
                  ["district", "Quận / Huyện *"],
                  ["city", "Tỉnh / Thành phố"],
                  ["distance", "Khoảng cách hiển thị"],
                ].map(([name, label]) => (
                  <label
                    key={name}
                    className={
                      name === "address" ? "cinemas-wide" : ""
                    }
                  >
                    <span>{label}</span>
                    <input
                      name={name}
                      value={form[name]}
                      onChange={changeField}
                      required={[
                        "name",
                        "address",
                        "district",
                      ].includes(name)}
                    />
                  </label>
                ))}

                <label>
                  <span>Trạng thái</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={changeField}
                  >
                    <option value="ACTIVE">
                      Đang hoạt động
                    </option>
                    <option value="INACTIVE">
                      Tạm ngừng
                    </option>
                  </select>
                </label>
              </div>

              <div className="cinemas-modal-footer">
                <button
                  type="button"
                  className="cinemas-secondary"
                  onClick={() => setEditing(null)}
                  disabled={busy}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="cinemas-primary"
                  disabled={busy}
                >
                  <Save size={17} />
                  {busy ? "Đang lưu..." : "Lưu rạp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
