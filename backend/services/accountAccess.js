const mongoose = require("mongoose");
const User = require("../models/User");

const ID_PATTERN = /^[a-f0-9]{24}$/i;

function fail(statusCode, code, message) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  throw error;
}

function readVersion(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(
      401,
      "INVALID_TOKEN_VERSION",
      "Phiên đăng nhập không hợp lệ."
    );
  }

  return value;
}

function assertAccountActive(user) {
  if (!user) {
    fail(
      401,
      "ACCOUNT_NOT_FOUND",
      "Tài khoản không tồn tại."
    );
  }

  const locked = Object.hasOwn(user, "isLocked")
    ? user.isLocked
    : false;

  if (typeof locked !== "boolean") {
    fail(
      403,
      "INVALID_ACCOUNT_STATUS",
      "Không thể xác minh trạng thái tài khoản."
    );
  }

  if (locked) {
    fail(
      403,
      "ACCOUNT_LOCKED",
      "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên."
    );
  }

  return readVersion(
    Object.hasOwn(user, "tokenVersion")
      ? user.tokenVersion
      : 0
  );
}

function assertTokenAccess(user, decoded) {
  const currentVersion = assertAccountActive(user);

  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof decoded.userId !== "string" ||
    !ID_PATTERN.test(decoded.userId)
  ) {
    fail(
      401,
      "INVALID_TOKEN",
      "Token không hợp lệ."
    );
  }

  if (String(user._id) !== decoded.userId.toLowerCase()) {
    fail(
      401,
      "TOKEN_ACCOUNT_MISMATCH",
      "Phiên đăng nhập không hợp lệ."
    );
  }

  const tokenVersion = readVersion(
    Object.hasOwn(decoded, "tokenVersion")
      ? decoded.tokenVersion
      : 0
  );

  if (currentVersion !== tokenVersion) {
    fail(
      401,
      "TOKEN_REVOKED",
      "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại."
    );
  }

  return currentVersion;
}

async function loadAccount(userId) {
  if (
    typeof userId !== "string" ||
    !ID_PATTERN.test(userId)
  ) {
    fail(
      401,
      "INVALID_USER_ID",
      "Thông tin tài khoản không hợp lệ."
    );
  }

  if (mongoose.connection.readyState !== 1) {
    fail(
      503,
      "AUTH_DATABASE_UNAVAILABLE",
      "Hệ thống xác thực tạm thời không khả dụng."
    );
  }

  return User.collection.findOne(
    {
      _id: new mongoose.Types.ObjectId(userId),
    },
    {
      projection: {
        _id: 1,
        fullName: 1,
        email: 1,
        phone: 1,
        role: 1,
        isLocked: 1,
        tokenVersion: 1,
      },
      readPreference: "primary",
    }
  );
}

async function assertDecodedAccess(decoded) {
  if (
    !decoded ||
    typeof decoded !== "object" ||
    typeof decoded.userId !== "string"
  ) {
    fail(
      401,
      "INVALID_TOKEN",
      "Token không hợp lệ."
    );
  }

  const user = await loadAccount(decoded.userId);

  assertTokenAccess(user, decoded);

  return user;
}

module.exports = {
  loadAccount,
  assertAccountActive,
  assertTokenAccess,
  assertDecodedAccess,
};