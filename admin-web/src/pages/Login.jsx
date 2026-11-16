
import { useState } from "react";
import {
  Clapperboard,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cn-login-page">
      <div className="cn-login-card">
        <div className="cn-login-brand">
          <div className="cn-login-logo">
            <Clapperboard size={30} />
          </div>

          <h1>
            Cine<span>Now</span>
          </h1>

          <p>ADMIN MANAGEMENT SYSTEM</p>
        </div>

        <div className="cn-login-heading">
          <h2>Đăng nhập quản trị</h2>
          <p>Chào mừng trở lại hệ thống CineNow.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Email</label>

          <div className="cn-login-input">
            <Mail size={19} />
            <input
              id="admin-email"
              type="email"
              placeholder="Nhập email quản trị"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <label htmlFor="admin-password">Mật khẩu</label>

          <div className="cn-login-input">
            <LockKeyhole size={19} />
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="cn-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>

          {error && (
            <div className="cn-login-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="cn-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={19}
                  className="cn-login-spinner"
                />
                Đang xác thực...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <div className="cn-login-footer">
          <ShieldCheck size={17} />
          <span>Chỉ dành cho quản trị viên CineNow</span>
        </div>
      </div>
    </div>
  );
}
