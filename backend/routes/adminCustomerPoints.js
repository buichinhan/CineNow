const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const PointTransaction = require("../models/PointTransaction");

const {
  requireAuth,
  requireAdmin,
} = require("../middleware/adminAuth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

const MAX_POINTS = 10000;

const ID_PATTERN = /^[a-f0-9]{24}$/i;

const UUID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function customerFilter(id) {
  return {
    _id: new mongoose.Types.ObjectId(id),
    $or: [
      { role: "customer" },
      { role: { $exists: false } },
    ],
  };
}

function validBalance(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function validateAdjustment(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "Dữ liệu yêu cầu không hợp lệ.");
  }

  const { action, points, reason, operationId } = body;

  if (!["add", "deduct"].includes(action)) {
    fail(400, "Loại điều chỉnh không hợp lệ.");
  }

  if (
    typeof points !== "number" ||
    !Number.isSafeInteger(points) ||
    points < 1 ||
    points > MAX_POINTS
  ) {
    fail(400, "Số điểm phải là số nguyên từ 1 đến 10000.");
  }

  if (
    typeof reason !== "string" ||
    reason.trim().length < 5 ||
    reason.trim().length > 300
  ) {
    fail(400, "Lý do phải có từ 5 đến 300 ký tự.");
  }

  if (
    typeof operationId !== "string" ||
    !UUID_PATTERN.test(operationId)
  ) {
    fail(400, "Mã giao dịch không hợp lệ.");
  }

  return {
    type: action === "add" ? "ADMIN_ADD" : "ADMIN_DEDUCT",
    points: action === "add" ? points : -points,
    description: reason.trim(),
    operationId: operationId.toLowerCase(),
  };
}

function calculateAdjustment(balance, debt, points) {
  if (!validBalance(balance) || !validBalance(debt)) {
    fail(422, "Dữ liệu điểm của khách hàng chưa hợp lệ.");
  }

  if (points < 0) {
    if (Math.abs(points) > balance) {
      fail(409, "Số điểm muốn trừ vượt quá số dư.");
    }

    return {
      balanceAfter: balance + points,
      debtAfter: debt,
    };
  }

  const debtPaid = Math.min(points, debt);

  const balanceAfter = balance + (points - debtPaid);
  const debtAfter = debt - debtPaid;

  if (!validBalance(balanceAfter) || !validBalance(debtAfter)) {
    fail(422, "Kết quả điều chỉnh vượt giới hạn an toàn.");
  }

  return { balanceAfter, debtAfter };
}

function verifyReplay(existing, adjustment, userId, adminId) {
  if (
    String(existing.userId) !== String(userId) ||
    String(existing.performedBy) !== String(adminId) ||
    existing.type !== adjustment.type ||
    existing.points !== adjustment.points ||
    existing.description !== adjustment.description
  ) {
    fail(409, "Mã giao dịch đã được sử dụng cho yêu cầu khác.");
  }
}

function transactionResult(doc) {
  return {
    _id: doc._id,
    type: doc.type,
    points: doc.points,
    description: doc.description,
    balanceBefore: doc.balanceBefore,
    balanceAfter: doc.balanceAfter,
    debtBefore: doc.debtBefore,
    debtAfter: doc.debtAfter,
    operationId: doc.operationId,
    performedBy: doc.performedBy,
    createdAt: doc.createdAt,
  };
}

function sendError(res, error) {
  const status = error.statusCode;

  if ([400, 404, 409, 422, 503].includes(status)) {
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }

  console.error("Admin customer points:", error.name, error.code);

  return res.status(500).json({
    success: false,
    message: "Không thể hoàn tất yêu cầu. Hãy kiểm tra lịch sử trước khi thử lại.",
  });
}

async function ensureUniqueIndex() {
  const indexes = await PointTransaction.collection.indexes();

  const index = indexes.find(item =>
    item.name === "uniq_admin_point_operation"
  );

  if (
    !index ||
    index.unique !== true ||
    index.key.operationId !== 1 ||
    Object.keys(index.key).length !== 1 ||
    index.partialFilterExpression?.operationId?.$type !== "string"
  ) {
    fail(503, "Cơ chế bảo vệ giao dịch chưa sẵn sàng.");
  }
}

router.post("/customers/:id/points", async (req, res) => {
  res.set("Cache-Control", "no-store");

  let session;

  try {
    const id = req.params.id;

    if (!ID_PATTERN.test(id)) {
      fail(400, "ID khách hàng không hợp lệ.");
    }

    const adjustment = validateAdjustment(req.body);

    const userId = new mongoose.Types.ObjectId(id);
    const adminId = req.authUser._id;

    if (mongoose.connection.readyState !== 1) {
      fail(503, "Cơ sở dữ liệu chưa sẵn sàng.");
    }

    await ensureUniqueIndex();

    session = await mongoose.startSession();

    let result;

    try {
      await session.withTransaction(async () => {
        const existing = await PointTransaction.findOne({
          operationId: adjustment.operationId,
        }).session(session).lean();

        if (existing) {
          verifyReplay(existing, adjustment, userId, adminId);

          result = {
            replayed: true,
            transaction: transactionResult(existing),
          };

          return;
        }

        // Read raw data to avoid applying Mongoose defaults
        // to legacy customers with missing point fields.
        const customer = await User.collection.findOne(
          customerFilter(id),
          {
            session,
            projection: {
              loyaltyPoints: 1,
              loyaltyPointsDebt: 1,
            },
          }
        );

        if (!customer) {
          fail(404, "Không tìm thấy khách hàng.");
        }

        const balanceBefore = customer.loyaltyPoints;
        const debtBefore = customer.loyaltyPointsDebt;

        const { balanceAfter, debtAfter } =
          calculateAdjustment(
            balanceBefore,
            debtBefore,
            adjustment.points
          );

        const updated = await User.updateOne(
          {
            ...customerFilter(id),
            loyaltyPoints: balanceBefore,
            loyaltyPointsDebt: debtBefore,
          },
          {
            $set: {
              loyaltyPoints: balanceAfter,
              loyaltyPointsDebt: debtAfter,
            },
          },
          {
            session,
            runValidators: true,
          }
        );

        if (updated.matchedCount !== 1) {
          fail(409, "Số dư đã thay đổi. Vui lòng tải lại dữ liệu.");
        }

        const [transaction] = await PointTransaction.create(
          [{
            userId,
            performedBy: adminId,
            ...adjustment,
            balanceBefore,
            balanceAfter,
            debtBefore,
            debtAfter,
          }],
          { session }
        );

        result = {
          replayed: false,
          transaction: transactionResult(transaction),
        };
      }, {
        readPreference: "primary",
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
      });
    } catch (error) {
      // A concurrent request may have committed the same
      // operation ID before this transaction completed.
      if (error.code !== 11000) {
        throw error;
      }

      const existing = await PointTransaction.findOne({
        operationId: adjustment.operationId,
      }).read("primary").lean();

      if (!existing) {
        throw error;
      }

      verifyReplay(existing, adjustment, userId, adminId);

      result = {
        replayed: true,
        transaction: transactionResult(existing),
      };
    }

    if (!result) {
      throw new Error("Transaction result missing");
    }

    return res.status(result.replayed ? 200 : 201).json({
      success: true,
      message: result.replayed
        ? "Giao dịch này đã được thực hiện trước đó."
        : "Điều chỉnh điểm thành công.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

function parsePage(value, fallback, max) {
  if (value === undefined) {
    return fallback;
  }

  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    fail(400, "Thông số phân trang không hợp lệ.");
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number > max) {
    fail(400, "Thông số phân trang vượt giới hạn.");
  }

  return number;
}

router.get("/customers/:id/points", async (req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    const id = req.params.id;

    if (!ID_PATTERN.test(id)) {
      fail(400, "ID khách hàng không hợp lệ.");
    }

    const page = parsePage(req.query.page, 1, 100000);
    const limit = parsePage(req.query.limit, 10, 50);

    const customer = await User.collection.findOne(
      customerFilter(id),
      {
        projection: {
          loyaltyPoints: 1,
          loyaltyPointsDebt: 1,
        },
      }
    );

    if (!customer) {
      fail(404, "Không tìm thấy khách hàng.");
    }

    const filter = {
      userId: customer._id,
    };

    const [transactions, total] = await Promise.all([
      PointTransaction.find(filter)
        .select(
          "_id type points description bookingCode " +
          "balanceBefore balanceAfter debtBefore debtAfter " +
          "performedBy createdAt"
        )
        .populate("performedBy", "fullName")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      PointTransaction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        balance: customer.loyaltyPoints ?? null,
        debt: customer.loyaltyPointsDebt ?? null,
        canAdjust:
          validBalance(customer.loyaltyPoints) &&
          validBalance(customer.loyaltyPointsDebt),
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;