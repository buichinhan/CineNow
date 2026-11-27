const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const History = require("../models/AccountStatusHistory");

const {
  requireAuth,
  requireAdmin,
} = require("../middleware/adminAuth");

const router = express.Router();

const ID_PATTERN = /^[a-f0-9]{24}$/i;

const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

// Keep writes disabled until all authentication paths
// enforce account status and token version.
const STATUS_WRITES_ENABLED = true;

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function parseId(value) {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    fail(400, "ID khách hàng không hợp lệ.");
  }

  return new mongoose.Types.ObjectId(value);
}

function customerFilter(id) {
  return {
    _id: id,
    $or: [
      { role: "customer" },
      { role: { $exists: false } },
    ],
  };
}

function readStatus(user) {
  const locked = Object.hasOwn(user, "isLocked")
    ? user.isLocked
    : false;

  const version = Object.hasOwn(user, "tokenVersion")
    ? user.tokenVersion
    : 0;

  if (
    typeof locked !== "boolean" ||
    !Number.isSafeInteger(version) ||
    version < 0
  ) {
    fail(422, "Dữ liệu trạng thái tài khoản không hợp lệ.");
  }

  return {
    isLocked: locked,
    tokenVersion: version,
  };
}

function parsePage(value, fallback, max) {
  if (value === undefined) return fallback;

  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    fail(400, "Thông số phân trang không hợp lệ.");
  }

  const result = Number(value);

  if (!Number.isSafeInteger(result) || result > max) {
    fail(400, "Thông số phân trang vượt giới hạn.");
  }

  return result;
}

function validateBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "Dữ liệu yêu cầu không hợp lệ.");
  }

  const { reason, operationId } = body;

  if (
    typeof reason !== "string" ||
    reason.trim().length < 5 ||
    reason.trim().length > 300
  ) {
    fail(400, "Lý do phải từ 5 đến 300 ký tự.");
  }

  if (
    typeof operationId !== "string" ||
    !UUID_PATTERN.test(operationId)
  ) {
    fail(400, "Mã giao dịch không hợp lệ.");
  }

  return {
    reason: reason.trim(),
    operationId: operationId.toLowerCase(),
  };
}

function handleError(res, error) {
  const allowed = [400, 401, 403, 404, 409, 422, 503];

  const status = allowed.includes(error.statusCode)
    ? error.statusCode
    : 500;

  if (status === 500) {
    console.error("[ACCOUNT STATUS ERROR]", error.name);
  }

  return res.status(status).json({
    success: false,
    message: status === 500
      ? "Không thể xử lý trạng thái tài khoản."
      : error.message,
  });
}

function assertReplay(record, userId, adminId, action, reason) {
  if (
    String(record.userId) !== String(userId) ||
    String(record.performedBy) !== String(adminId) ||
    record.action !== action ||
    record.reason !== reason
  ) {
    fail(409, "Mã giao dịch đã được sử dụng.");
  }
}

async function assertStorageReady() {
  if (mongoose.connection.readyState !== 1) {
    fail(503, "Database chưa sẵn sàng.");
  }

  const indexes = await History.collection.indexes();

  const unique = indexes.find(index =>
    index.name === "uniq_account_status_operation" &&
    index.unique === true &&
    index.key.operationId === 1 &&
    Object.keys(index.key).length === 1 &&
    !index.partialFilterExpression &&
    !index.sparse
  );

  if (!unique) {
    fail(503, "Kho lưu lịch sử chưa sẵn sàng.");
  }
}

// ==================== READ STATUS ====================

router.get(
  "/customers/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
      const id = parseId(req.params.id);
      const page = parsePage(req.query.page, 1, 100000);
      const limit = parsePage(req.query.limit, 10, 50);

      if (mongoose.connection.readyState !== 1) {
        fail(503, "Database chưa sẵn sàng.");
      }

      const user = await User.collection.findOne(
        customerFilter(id),
        {
          projection: {
            _id: 1,
            isLocked: 1,
            tokenVersion: 1,
            lockedAt: 1,
            lockReason: 1,
            lockedBy: 1,
          },
        }
      );

      if (!user) {
        fail(404, "Không tìm thấy khách hàng.");
      }

      const status = readStatus(user);

      const filter = { userId: id };

      const [history, total] = await Promise.all([
        History.find(filter)
          .populate("performedBy", "fullName")
          .sort({ createdAt: -1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        History.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: {
          isLocked: status.isLocked,
          lockedAt: user.lockedAt ?? null,
          lockReason: user.lockReason ?? null,
          lockedBy: user.lockedBy ?? null,
          canChangeStatus: STATUS_WRITES_ENABLED,
          history,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// ==================== CHANGE STATUS ====================

function changeStatus(action) {
  return async (req, res) => {
    res.set("Cache-Control", "no-store");

    let session;

    try {
      const id = parseId(req.params.id);

      const adminId = parseId(
        String(req.authUser?._id ?? "")
      );

      const { reason, operationId } = validateBody(req.body);

      if (String(id) === String(adminId)) {
        fail(403, "Không thể tự khóa hoặc mở khóa tài khoản.");
      }

      if (!STATUS_WRITES_ENABLED) {
        fail(503, "Chức năng thay đổi trạng thái chưa được kích hoạt.");
      }

      await assertStorageReady();

      session = await mongoose.startSession();

      let result;

      try {
        await session.withTransaction(async () => {
          const actor = await User.collection.findOne(
            { _id: adminId, role: "admin" },
            {
              session,
              projection: {
                _id: 1,
                isLocked: 1,
                tokenVersion: 1,
              },
            }
          );

          if (!actor || readStatus(actor).isLocked) {
            fail(403, "Không có quyền thay đổi trạng thái.");
          }

          const user = await User.collection.findOne(
            customerFilter(id),
            {
              session,
              projection: {
                _id: 1,
                isLocked: 1,
                tokenVersion: 1,
              },
            }
          );

          if (!user) {
            fail(404, "Không tìm thấy khách hàng.");
          }

          const current = readStatus(user);

          const existing = await History.findOne({
            operationId,
          }).session(session).lean();

          if (existing) {
            assertReplay(
              existing,
              id,
              adminId,
              action,
              reason
            );

            result = {
              replayed: true,
              history: existing,
            };

            return;
          }

          const shouldLock = action === "LOCK";

          if (current.isLocked === shouldLock) {
            fail(
              409,
              shouldLock
                ? "Tài khoản đã bị khóa."
                : "Tài khoản đang hoạt động."
            );
          }

          if (current.tokenVersion >= Number.MAX_SAFE_INTEGER) {
            fail(422, "Phiên bản token vượt giới hạn.");
          }

          const filter = {
            ...customerFilter(id),

            isLocked: Object.hasOwn(user, "isLocked")
              ? user.isLocked
              : { $exists: false },

            tokenVersion: Object.hasOwn(user, "tokenVersion")
              ? user.tokenVersion
              : { $exists: false },
          };

          const now = new Date();

          const updated = await User.collection.updateOne(
            filter,
            {
              $set: {
                isLocked: shouldLock,
                lockedAt: shouldLock ? now : null,
                lockedBy: shouldLock ? adminId : null,
                lockReason: shouldLock ? reason : null,
                tokenVersion: current.tokenVersion + 1,
                updatedAt: now,
              },
            },
            { session }
          );

          if (updated.modifiedCount !== 1) {
            fail(409, "Trạng thái đã thay đổi. Vui lòng tải lại.");
          }

          const [record] = await History.create(
            [{
              userId: id,
              performedBy: adminId,
              action,
              reason,
              operationId,
              previousStatus: current.isLocked
                ? "LOCKED"
                : "ACTIVE",
              newStatus: shouldLock
                ? "LOCKED"
                : "ACTIVE",
            }],
            { session }
          );

          result = {
            replayed: false,
            history: record.toObject(),
          };
        }, {
          readPreference: "primary",
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
        });
      } catch (error) {
        if (error.code !== 11000) throw error;

        const existing = await History.findOne({
          operationId,
        }).lean();

        if (!existing) throw error;

        assertReplay(existing, id, adminId, action, reason);

        result = {
          replayed: true,
          history: existing,
        };
      }

      if (!result) {
        fail(503, "Chưa xác nhận được kết quả giao dịch.");
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return handleError(res, error);
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  };
}

router.post(
  "/customers/:id/lock",
  requireAuth,
  requireAdmin,
  changeStatus("LOCK")
);

router.post(
  "/customers/:id/unlock",
  requireAuth,
  requireAdmin,
  changeStatus("UNLOCK")
);

module.exports = router;