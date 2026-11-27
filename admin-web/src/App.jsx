
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  Film,
  Building2,
  CalendarDays,
  Menu,
  Bell,
  Search,
  ChevronRight,
  Clapperboard,
  Ticket,
TicketPercent,
  LogOut,
} from "lucide-react";

import "./App.css";

// ==================== PAGES ====================

import Dashboard from "./pages/Dashboard";
import Movies from "./pages/Movies";
import Cinemas from "./pages/Cinemas";
import Showtimes from "./pages/Showtimes";
import Login from "./pages/Login";
import Bookings from "./pages/Bookings";
import Vouchers from "./pages/Vouchers";
import Customers from "./pages/Customers";
// ==================== API ====================

import {
  loginAdmin,
  verifyAdmin,
  getAdminToken,
  logoutAdmin,
} from "./services/api";

// ==================== SIDEBAR MENU ====================

const menuItems = [
  {
    id: "customers",
    name: "Quản lý khách hàng",
    icon: Users,
  },
  {
    id: "dashboard",
    name: "Tổng quan",
    icon: LayoutDashboard,
  },
  {
    id: "movies",
    name: "Quản lý phim",
    icon: Film,
  },
  {
    id: "cinemas",
    name: "Quản lý rạp",
    icon: Building2,
  },
  {
    id: "showtimes",
    name: "Quản lý suất chiếu",
    icon: CalendarDays,
  },
  {
    id: "bookings",
    name: "Quản lý đặt vé",
    icon: Ticket,
  },
  {
  id: "vouchers",
  name: "Quản lý Voucher",
  icon: TicketPercent,
},
];

// ==================== APP ====================

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ==================== RESTORE SESSION ====================

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = getAdminToken();

      if (!token) {
        if (active) {
          setAuthLoading(false);
        }
        return;
      }

      try {
        const result = await verifyAdmin(token);

        if (!result.success || result.user?.role !== "admin") {
          throw new Error("Không có quyền quản trị.");
        }

        if (active) {
          setAdminUser(result.user);
        }
      } catch {
        logoutAdmin();

        if (active) {
          setAdminUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // ==================== LOGIN ====================

  const handleLogin = async (email, password) => {
    const user = await loginAdmin(email, password);

    setAdminUser(user);
    setActivePage("dashboard");
    setSidebarOpen(false);
  };

  // ==================== LOGOUT ====================

  const handleLogout = () => {
    logoutAdmin();

    setAdminUser(null);
    setActivePage("dashboard");
    setSidebarOpen(false);
  };

  // ==================== NAVIGATION ====================

  const current =
    menuItems.find((item) => item.id === activePage) ||
    menuItems[0];

  const navigate = (id) => {
    if (!menuItems.some((item) => item.id === id)) {
      return;
    }

    setActivePage(id);
    setSidebarOpen(false);
  };

  // ==================== AUTH LOADING ====================

  if (authLoading) {
    return (
      <div className="cn-login-page">
        <div
          className="cn-login-card"
          style={{ textAlign: "center" }}
        >
          <Clapperboard size={42} color="#E50914" />

          <h2>Đang xác thực CineNow Admin...</h2>

          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      </div>
    );
  }

  // ==================== NOT LOGGED IN ====================

  if (!adminUser) {
    return <Login onLogin={handleLogin} />;
  }

  // ==================== ADMIN PROFILE ====================

  const adminName =
    adminUser.fullName || "Administrator";

  const adminInitial =
    adminName.charAt(0).toUpperCase();

  // ==================== PAGE RENDERING ====================

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={navigate} />;

      case "movies":
        return <Movies />;

      case "cinemas":
        return <Cinemas />;

      case "showtimes":
        return <Showtimes />;
      case "customers":
        return <Customers />;

      case "bookings":
        return <Bookings />;
          case "vouchers":
  return <Vouchers />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  // ==================== MAIN LAYOUT ====================

  return (
    <div className="admin-layout">
      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Clapperboard size={25} />
          </div>

          <div>
            <h2>
              Cine<span>Now</span>
            </h2>

            <small>ADMIN PANEL</small>
          </div>
        </div>

        <div className="nav-caption">
          QUẢN TRỊ HỆ THỐNG
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(
            ({ id, name, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`nav-item ${
                  activePage === id ? "active" : ""
                }`}
                onClick={() => navigate(id)}
              >
                <Icon size={19} />

                <span>{name}</span>

                {activePage === id && (
                  <ChevronRight
                    size={15}
                    className="nav-arrow"
                  />
                )}
              </button>
            )
          )}
        </nav>

        {/* ADMIN PROFILE */}

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="avatar">
              {adminInitial}
            </div>

            <div>
              <strong>{adminName}</strong>

              <small>{adminUser.email}</small>
            </div>
          </div>

          <button
            className="logout-btn"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        {/* TOP BAR */}

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <h1>{current.name}</h1>

              <p>
                Hệ thống quản trị rạp chiếu phim CineNow
              </p>
            </div>
          </div>

          {/* TOP BAR ACTIONS */}

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <span>Tìm kiếm...</span>
            </div>

            <Bell size={20} />

            <div className="header-avatar">
              {adminInitial}
            </div>
          </div>
        </header>

        {/* CURRENT PAGE */}

        <div className="page-content">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
