const jwt = require("jsonwebtoken");

const {
  assertDecodedAccess,
} = require("../services/accountAccess");

function reject(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

const requireAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;

  const match =
    typeof authorization === "string"
      ? authorization.match(/^Bearer\s+(\S+)$/i)
      : null;

  if (!match) {
    return reject(
      res,
      401,
      "Vui lòng đăng nhập để tiếp tục."
    );
  }

  if (!process.env.JWT_SECRET) {
    return reject(
      res,
      503,
      "Hệ thống xác thực chưa sẵn sàng."
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(
      match[1],
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );
  } catch {
    return reject(
      res,
      401,
      "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
    );
  }

  try {
    const account = await assertDecodedAccess(decoded);

    req.authUser = {
      _id: account._id,
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      role: account.role,
    };
  } catch (error) {
    const status = [401, 403, 503].includes(
      error.statusCode
    )
      ? error.statusCode
      : 503;

    return reject(
      res,
      status,
      status === 503
        ? "Không thể xác thực tài khoản."
        : error.message
    );
  }

  return next();
};

const requireAdmin = (req, res, next) => {
  if (!req.authUser) {
    return reject(
      res,
      401,
      "Bạn chưa đăng nhập."
    );
  }

  if (req.authUser.role !== "admin") {
    return reject(
      res,
      403,
      "Bạn không có quyền truy cập trang quản trị."
    );
  }

  return next();
};

module.exports = {
  requireAuth,
  requireAdmin,
};
