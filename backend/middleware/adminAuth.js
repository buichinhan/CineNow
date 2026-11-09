
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Kiểm tra người dùng đã đăng nhập hay chưa
const requireAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";

    const match = authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Vui lòng đăng nhập để tiếp tục.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET chưa được cấu hình.");

      return res.status(500).json({
        success: false,
        message: "Hệ thống xác thực chưa sẵn sàng.",
      });
    }

    const decoded = jwt.verify(
      match[1],
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ.",
      });
    }

    const user = await User.findById(decoded.userId)
      .select("_id fullName email phone role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại.",
      });
    }

    req.authUser = user;

    next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
      });
    }

    console.error("Lỗi xác thực:", error.message);

    return res.status(500).json({
      success: false,
      message: "Không thể xác thực tài khoản.",
    });
  }
};

// Chỉ cho phép tài khoản Admin
const requireAdmin = (req, res, next) => {
  if (!req.authUser) {
    return res.status(401).json({
      success: false,
      message: "Bạn chưa đăng nhập.",
    });
  }

  if (req.authUser.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền truy cập trang quản trị.",
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
};
