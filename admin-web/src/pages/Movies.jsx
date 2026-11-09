
import { useEffect, useMemo, useState } from "react";
import {
  Film,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Archive,
  RotateCcw,
  Trash2,
  X,
  Save,
  AlertCircle,
} from "lucide-react";

import {
  getMovies,
  createMovie,
  updateMovie,
  updateMovieStatus,
  deleteMovie,
} from "../services/api";

import "./Movies.css";

const STATUS_OPTIONS = [
  { value: "NOW_SHOWING", label: "Đang chiếu" },
  { value: "COMING_SOON", label: "Sắp chiếu" },
  { value: "ENDED", label: "Ngừng chiếu" },
];

const EMPTY_FORM = {
  title: "",
  originalTitle: "",
  director: "",
  duration: "120",
  releaseDate: "",
  genres: "",
  formats: "2D",
  cast: "",
  language: "Tiếng Việt",
  ageRating: "P",
  posterUrl: "",
  bannerUrl: "",
  trailerUrl: "",
  synopsis: "",
  status: "COMING_SOON",
  isFeatured: false,
};

function normalizeStatus(status) {
  if (["NOW_SHOWING", "now_showing"].includes(status)) {
    return "NOW_SHOWING";
  }
  if (["COMING_SOON", "upcoming"].includes(status)) {
    return "COMING_SOON";
  }
  return "ENDED";
}

function statusLabel(status) {
  return STATUS_OPTIONS.find(
    (item) => item.value === normalizeStatus(status)
  )?.label || "Không xác định";
}

function dateForInput(value) {
  if (!value) return "";
  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const match = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  return "";
}

function formFromMovie(movie) {
  const toText = (value) =>
    Array.isArray(value) ? value.join(", ") : String(value || "");

  return {
    title: movie.title || "",
    originalTitle: movie.originalTitle || "",
    director: movie.director || "",
    duration: String(movie.duration || "120").replace(/[^\d]/g, "") || "120",
    releaseDate: dateForInput(movie.releaseDate),
    genres: toText(movie.genres?.length ? movie.genres : movie.genre),
    formats: toText(movie.formats?.length ? movie.formats : "2D"),
    cast: toText(movie.cast),
    language: movie.language || "",
    ageRating: movie.ageRating || "P",
    posterUrl: movie.posterUrl || movie.poster || "",
    bannerUrl: movie.bannerUrl || movie.backdrop || "",
    trailerUrl: movie.trailerUrl || "",
    synopsis: movie.synopsis || movie.description || "",
    status: normalizeStatus(movie.status),
    isFeatured: Boolean(movie.isFeatured),
  };
}

function moviePayload(form) {
  const split = (value) =>
    value.split(",").map((item) => item.trim()).filter(Boolean);

  return {
    ...form,
    title: form.title.trim(),
    duration: Number(form.duration),
    genres: split(form.genres),
    formats: split(form.formats),
    cast: split(form.cast),
  };
}

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadMovies() {
    setLoading(true);
    setError("");

    try {
      setMovies(await getMovies());
    } catch (err) {
      setError(err.message || "Không thể tải danh sách phim.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  const counts = useMemo(() => ({
    all: movies.length,
    showing: movies.filter(
      (movie) => normalizeStatus(movie.status) === "NOW_SHOWING"
    ).length,
    upcoming: movies.filter(
      (movie) => normalizeStatus(movie.status) === "COMING_SOON"
    ).length,
    ended: movies.filter(
      (movie) => normalizeStatus(movie.status) === "ENDED"
    ).length,
  }), [movies]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return movies.filter((movie) => {
      if (
        filter !== "ALL" &&
        normalizeStatus(movie.status) !== filter
      ) {
        return false;
      }

      return (
        !keyword ||
        [movie.title, movie.originalTitle, movie.director]
          .some((value) =>
            String(value || "")
              .toLocaleLowerCase("vi")
              .includes(keyword)
          )
      );
    });
  }, [movies, search, filter]);

  function openCreate() {
    setEditing({ mode: "create" });
    setForm({ ...EMPTY_FORM });
    setError("");
    setMessage("");
  }

  function openEdit(movie) {
    setEditing({ mode: "edit", id: movie._id });
    setForm(formFromMovie(movie));
    setError("");
    setMessage("");
  }

  function changeField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function saveMovie(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Vui lòng nhập tên phim.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const payload = moviePayload(form);

      if (editing.mode === "create") {
        await createMovie(payload);
        setMessage("Đã thêm phim thành công.");
      } else {
        await updateMovie(editing.id, payload);
        setMessage("Đã cập nhật phim thành công.");
      }

      setEditing(null);
      await loadMovies();
    } catch (err) {
      setError(err.message || "Không thể lưu phim.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(movie) {
    const current = normalizeStatus(movie.status);
    const next = current === "ENDED" ? "NOW_SHOWING" : "ENDED";

    const action = next === "ENDED"
      ? "ngừng chiếu"
      : "mở chiếu lại";

    if (!window.confirm(`Bạn muốn ${action} phim "${movie.title}"?`)) {
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await updateMovieStatus(movie._id, next);
      setMessage(`Đã ${action} phim "${movie.title}".`);
      await loadMovies();
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMovie(movie) {
    if (normalizeStatus(movie.status) !== "ENDED") {
      setError("Phải ngừng chiếu phim trước khi xóa.");
      return;
    }

    const confirmed = window.confirm(
      `XÓA VĨNH VIỄN "${movie.title}"?\n\n` +
      "Thao tác này không thể hoàn tác. " +
      "Hệ thống sẽ từ chối nếu phim còn dữ liệu liên quan."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      await deleteMovie(movie._id);
      setMessage(`Đã xóa phim "${movie.title}".`);
      await loadMovies();
    } catch (err) {
      setError(err.message || "Không thể xóa phim.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="movies-page">
      <div className="movies-heading">
        <div>
          <h2>Danh sách phim</h2>
          <p>Quản lý nội dung phim đồng bộ với CineNow Mobile.</p>
        </div>
        <div className="movies-heading-actions">
          <button
            className="movies-secondary"
            onClick={loadMovies}
            disabled={loading || busy}
          >
            <RefreshCw size={17} /> Làm mới
          </button>
          <button
            className="movies-primary"
            onClick={openCreate}
            disabled={busy}
          >
            <Plus size={18} /> Thêm phim
          </button>
        </div>
      </div>

      <div className="movies-stats">
        {[
          ["Tất cả", counts.all],
          ["Đang chiếu", counts.showing],
          ["Sắp chiếu", counts.upcoming],
          ["Ngừng chiếu", counts.ended],
        ].map(([label, count]) => (
          <div className="movies-stat" key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      {message && <div className="movies-success">{message}</div>}
      {error && (
        <div className="movies-error">
          <AlertCircle size={17} /> {error}
        </div>
      )}

      <div className="movies-toolbar">
        <div className="movies-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên phim, đạo diễn..."
          />
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="movies-empty">Đang tải danh sách phim...</div>
      ) : filtered.length === 0 ? (
        <div className="movies-empty">
          <Film size={36} />
          <p>Không tìm thấy phim phù hợp.</p>
        </div>
      ) : (
        <div className="movies-list">
          {filtered.map((movie) => {
            const status = normalizeStatus(movie.status);
            const poster = movie.posterUrl || movie.poster;

            return (
              <div className="movies-item" key={movie._id}>
                <div className="movies-poster">
                  {poster ? (
                    <img src={poster} alt={movie.title} />
                  ) : (
                    <Film size={28} />
                  )}
                </div>

                <div className="movies-info">
                  <h3>{movie.title}</h3>
                  <p>{movie.originalTitle || movie.director || "Phim điện ảnh"}</p>
                  <div className="movies-meta">
                    <span>{String(movie.duration || "—")} phút</span>
                    <span>{movie.ageRating || "P"}</span>
                    <span className={`movies-status ${status.toLowerCase()}`}>
                      {statusLabel(movie.status)}
                    </span>
                  </div>
                </div>

                <div className="movies-actions">
                  <button
                    title="Chỉnh sửa phim"
                    onClick={() => openEdit(movie)}
                    disabled={busy}
                  >
                    <Pencil size={17} /> Sửa
                  </button>
                  <button
                    title={status === "ENDED" ? "Mở chiếu lại" : "Ngừng chiếu"}
                    onClick={() => changeStatus(movie)}
                    disabled={busy}
                  >
                    {status === "ENDED"
                      ? <RotateCcw size={17} />
                      : <Archive size={17} />}
                    {status === "ENDED" ? "Mở lại" : "Ngừng chiếu"}
                  </button>
                  <button
                    className="movies-delete"
                    title="Xóa vĩnh viễn"
                    onClick={() => removeMovie(movie)}
                    disabled={busy || status !== "ENDED"}
                  >
                    <Trash2 size={17} /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="movies-modal-backdrop">
          <div
            className="movies-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Thông tin phim"
          >
            <div className="movies-modal-header">
              <h2>
                {editing.mode === "create"
                  ? "Thêm phim mới"
                  : "Chỉnh sửa phim"}
              </h2>
              <button onClick={() => setEditing(null)} disabled={busy}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={saveMovie}>
              <div className="movies-form-grid">
                {[
                  ["title", "Tên phim *", "text"],
                  ["originalTitle", "Tên gốc", "text"],
                  ["director", "Đạo diễn", "text"],
                  ["duration", "Thời lượng (phút)", "number"],
                  ["releaseDate", "Ngày phát hành", "date"],
                  ["genres", "Thể loại (cách nhau bằng dấu phẩy)", "text"],
                  ["formats", "Định dạng (2D, 3D, IMAX)", "text"],
                  ["cast", "Diễn viên (cách nhau bằng dấu phẩy)", "text"],
                  ["language", "Ngôn ngữ", "text"],
                  ["posterUrl", "URL poster", "url"],
                  ["bannerUrl", "URL banner", "url"],
                  ["trailerUrl", "URL trailer", "url"],
                ].map(([name, label, type]) => (
                  <label key={name}>
                    <span>{label}</span>
                    <input
                      name={name}
                      type={type}
                      value={form[name]}
                      onChange={changeField}
                      required={name === "title"}
                      min={type === "number" ? "1" : undefined}
                    />
                  </label>
                ))}

                <label>
                  <span>Giới hạn độ tuổi</span>
                  <select
                    name="ageRating"
                    value={form.ageRating}
                    onChange={changeField}
                  >
                    {["P", "K", "T13", "T16", "T18", "13+", "16+", "18+"]
                      .map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  <span>Trạng thái</span>
                  <select
                    name="status"
                    value={form.status}
                    onChange={changeField}
                  >
                    {STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="movies-wide">
                  <span>Nội dung phim</span>
                  <textarea
                    name="synopsis"
                    rows="4"
                    value={form.synopsis}
                    onChange={changeField}
                  />
                </label>

                <label className="movies-checkbox movies-wide">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={changeField}
                  />
                  <span>Đặt làm phim nổi bật</span>
                </label>
              </div>

              <div className="movies-modal-footer">
                <button
                  type="button"
                  className="movies-secondary"
                  onClick={() => setEditing(null)}
                  disabled={busy}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="movies-primary"
                  disabled={busy}
                >
                  <Save size={17} />
                  {busy ? "Đang lưu..." : "Lưu phim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
