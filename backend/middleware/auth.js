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

function createAuthMiddleware({ optional = false } = {}) {
  return async function authenticate(req, res, next) {
    const authorization = req.headers.authorization;

    if (authorization === undefined) {
      if (optional) {
        return next();
      }

      return reject(
        res,
        401,
        "Không tìm thấy token xác thực. Vui lòng đăng nhập."
      );
    }

    const match =
      typeof authorization === "string"
        ? authorization.match(/^Bearer\s+(\S+)$/i)
        : null;

    if (!match) {
      return reject(
        res,
        401,
        "Token xác thực không hợp lệ."
      );
    }

    if (!process.env.JWT_SECRET) {
      return reject(
        res,
        503,
        "Hệ thống xác thực tạm thời không khả dụng."
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(
        match[1],
        process.env.JWT_SECRET,
        {
          algorithms: ["HS256"],
        }
      );
    } catch {
      return reject(
        res,
        401,
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ."
      );
    }

    try {
      const account = await assertDecodedAccess(decoded);

      req.userId = String(account._id);
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
          ? "Hệ thống xác thực tạm thời không khả dụng."
          : error.message
      );
    }

    return next();
  };
}

const authMiddleware = createAuthMiddleware();

const optionalAuthMiddleware = createAuthMiddleware({
  optional: true,
});

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};