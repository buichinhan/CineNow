
const express = require("express");
const router = express.Router();

const {
  requireAuth,
  requireAdmin,
} = require("../middleware/adminAuth");

const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Cinema = require("../models/Cinema");
const Showtime = require("../models/Showtime");
const User = require("../models/User");
const Voucher = require("../models/Voucher");
// ==================== HELPERS ====================

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

function getVNDate(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getVNTime(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.hour}:${values.minute}`;
}

// ==================== AUTH MIDDLEWARE ====================

// Tat ca API trong router nay deu yeu cau quyen Admin.
router.use(requireAuth, requireAdmin);

// ==================== ADMIN PROFILE ====================

router.get("/me", (req, res) => {
  const user = req.authUser;

  return res.json({
    success: true,
    message: "Xác thực Admin thành công.",
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  });
});

// ==================== DASHBOARD STATS ====================

router.get("/dashboard/stats", async (req, res) => {
  try {
    const now = new Date();

    const today = getVNDate(now);
    const currentTime = getVNTime(now);

    const validBooking = {
      status: "confirmed",
      paymentStatus: "paid",
    };

    // Lay ngay bat dau cua 7 ngay gan nhat theo gio VN.
    const todayStartUTC = new Date(
      `${today}T00:00:00+07:00`
    );

    const chartStart = new Date(
      todayStartUTC.getTime() - 6 * 86400000
    );

    const [
      totalMovies,
      totalCinemas,
      totalShowtimes,
      totalCustomers,
      totalBookings,
      cancelledBookings,
      pendingPayments,
      revenueResult,
      dailyRevenue,
      recentBookings,
      upcomingShowtimes,
    ] = await Promise.all([
      Movie.countDocuments(),

      Cinema.countDocuments(),

      Showtime.countDocuments(),

      User.countDocuments({
        role: "customer",
      }),

      Booking.countDocuments(),

      Booking.countDocuments({
        status: "cancelled",
      }),

      Booking.countDocuments({
        status: "confirmed",
        paymentStatus: "pending",
      }),

      // Doanh thu va so ghe da ban.
      Booking.aggregate([
        {
          $match: validBooking,
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
              },
            },
            ticketsSold: {
              $sum: {
                $size: {
                  $ifNull: ["$seats", []],
                },
              },
            },
            paidBookings: {
              $sum: 1,
            },
          },
        },
      ]),

      // Doanh thu theo ngay.
      Booking.aggregate([
        {
          $match: {
            ...validBooking,
            createdAt: {
              $gte: chartStart,
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: VN_TIMEZONE,
              },
            },
            revenue: {
              $sum: {
                $ifNull: ["$totalPrice", 0],
              },
            },
            tickets: {
              $sum: {
                $size: {
                  $ifNull: ["$seats", []],
                },
              },
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      // 5 don dat ve gan nhat.
      Booking.find()
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .select(
          "bookingCode movieTitle cinemaName totalPrice status paymentStatus createdAt seats"
        )
        .lean(),

      // 5 suat chieu sap toi.
      Showtime.find({
        status: "scheduled",
        $or: [
          {
            date: {
              $gt: today,
            },
          },
          {
            date: today,
            startTime: {
              $gte: currentTime,
            },
          },
        ],
      })
        .sort({
          date: 1,
          startTime: 1,
        })
        .limit(5)
        .select(
          "movieTitle cinemaName room date startTime price status"
        )
        .lean(),
    ]);

    // ==================== REVENUE CHART ====================

    const revenueMap = new Map(
      dailyRevenue.map((item) => [
        item._id,
        item,
      ])
    );

    const revenueChart = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(
        todayStartUTC.getTime() - i * 86400000
      );

      const date = getVNDate(day);
      const item = revenueMap.get(date);

      revenueChart.push({
        date,
        revenue: item?.revenue || 0,
        tickets: item?.tickets || 0,
      });
    }

    const revenue = revenueResult[0] || {};

    // ==================== RESPONSE ====================

    return res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: revenue.totalRevenue || 0,
          totalBookings,
          ticketsSold: revenue.ticketsSold || 0,
          paidBookings: revenue.paidBookings || 0,
          cancelledBookings,
          pendingPayments,
          totalMovies,
          totalCinemas,
          totalShowtimes,
          totalCustomers,
        },

        revenueChart,

        recentBookings,

        upcomingShowtimes,

        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "[ADMIN DASHBOARD ERROR]",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Không thể tải dữ liệu Dashboard.",
    });
  }
});

const mongoose = require("mongoose");

// ==================== BOOKING MANAGEMENT ====================

// Danh sách booking, tìm kiếm, lọc và phân trang
router.get("/bookings", async (req, res) => {
  try {
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const paymentStatus = String(
      req.query.paymentStatus || ""
    ).trim();

    const filter = {};

    if (search) {
      const safeSearch = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { bookingCode: { $regex: safeSearch, $options: "i" } },
        { movieTitle: { $regex: safeSearch, $options: "i" } },
        { cinemaName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (["confirmed", "cancelled"].includes(status)) {
      filter.status = status;
    }

    if (
      ["pending", "paid", "refunded"].includes(paymentStatus)
    ) {
      filter.paymentStatus = paymentStatus;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("userId", "fullName email phone")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Booking.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách đặt vé.",
    });
  }
});

// Chi tiết một booking
router.get("/bookings/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID đặt vé không hợp lệ.",
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate("userId", "fullName email phone")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt vé.",
      });
    }

    return res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Admin booking detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tải chi tiết đặt vé.",
    });
  }
});

// Admin hủy booking
router.patch("/bookings/:id/cancel", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID đặt vé không hợp lệ.",
      });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "confirmed",
      },
      {
        $set: {
          status: "cancelled",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!booking) {
      return res.status(409).json({
        success: false,
        message:
          "Đơn không tồn tại hoặc đã được hủy trước đó.",
      });
    }

    return res.json({
      success: true,
      message: "Đã hủy đơn đặt vé.",
      data: booking,
    });
  } catch (error) {
    console.error("Admin cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể hủy đơn đặt vé.",
    });
  }
});
// =====================================================
// ADMIN - QUẢN LÝ VOUCHER
// =====================================================

const validateVoucherInput = (body) => {
  const errors = [];

  const code = String(body.code || "").trim().toUpperCase();
  const title = String(body.title || "").trim();
  const discountType = body.discountType;

  const discountValue = Number(body.discountValue);
  const minOrderAmount = Number(body.minOrderAmount ?? 0);
  const maxDiscountAmount = Number(body.maxDiscountAmount ?? 0);
  const totalLimit = Number(body.totalLimit ?? 100);
  const usageLimitPerUser = Number(body.usageLimitPerUser ?? 1);

  const startDate = new Date(body.startDate);
  const endDate = new Date(body.endDate);

  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    errors.push("Mã voucher phải có 3-30 ký tự, chỉ gồm chữ, số, _ hoặc -.");
  }

  if (!title) {
    errors.push("Tên voucher không được để trống.");
  }

  if (!["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM"].includes(discountType)) {
    errors.push("Loại voucher không hợp lệ.");
  }

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    errors.push("Giá trị giảm không hợp lệ.");
  }

  if (discountType === "PERCENTAGE" &&
      (discountValue <= 0 || discountValue > 100)) {
    errors.push("Phần trăm giảm phải lớn hơn 0 và không vượt quá 100.");
  }

  if (discountType === "FIXED_AMOUNT" && discountValue <= 0) {
    errors.push("Số tiền giảm phải lớn hơn 0.");
  }

  if (
    discountType === "FREE_ITEM" &&
    !String(body.freeItemName || "").trim()
  ) {
    errors.push("Voucher tặng quà phải có tên quà tặng.");
  }

  if (
    !Number.isFinite(minOrderAmount) ||
    minOrderAmount < 0 ||
    !Number.isFinite(maxDiscountAmount) ||
    maxDiscountAmount < 0
  ) {
    errors.push("Giá trị đơn tối thiểu hoặc mức giảm tối đa không hợp lệ.");
  }

  if (!Number.isInteger(totalLimit) || totalLimit < 0) {
    errors.push("Số lượng voucher phải là số nguyên không âm.");
  }

  if (!Number.isInteger(usageLimitPerUser) || usageLimitPerUser < 1) {
    errors.push("Giới hạn mỗi người phải là số nguyên lớn hơn 0.");
  }

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    errors.push("Ngày bắt đầu và kết thúc không hợp lệ.");
  }

  if (
    body.applicableCinemas !== undefined &&
    !Array.isArray(body.applicableCinemas)
  ) {
    errors.push("Danh sách rạp áp dụng không hợp lệ.");
  }

  if (
    body.applicableFormats !== undefined &&
    !Array.isArray(body.applicableFormats)
  ) {
    errors.push("Danh sách định dạng phòng chiếu không hợp lệ.");
  }

  return errors;
};

const buildVoucherData = (body) => ({
  code: String(body.code).trim().toUpperCase(),
  title: String(body.title).trim(),
  description: String(body.description || "").trim(),
  discountType: body.discountType,
  discountValue:
    body.discountType === "FREE_ITEM" ? 0 : Number(body.discountValue),
  maxDiscountAmount:
    body.discountType === "PERCENTAGE"
      ? Number(body.maxDiscountAmount ?? 0)
      : 0,
  minOrderAmount: Number(body.minOrderAmount ?? 0),
  startDate: new Date(body.startDate),
  endDate: new Date(body.endDate),
  totalLimit: Number(body.totalLimit ?? 100),
  usageLimitPerUser: Number(body.usageLimitPerUser ?? 1),
  applicableCinemas: (body.applicableCinemas || []).map(
    (name) => String(name).trim()
  ).filter(Boolean),
  applicableFormats: (body.applicableFormats || []).map(
    (format) => String(format).trim()
  ).filter(Boolean),
  freeItemName:
    body.discountType === "FREE_ITEM"
      ? String(body.freeItemName || "").trim()
      : "",
  isActive: body.isActive === undefined ? true : body.isActive === true,
});

// GET /api/admin/vouchers
router.get("/vouchers", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "all");

    const filter = {};

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { code: { $regex: escaped, $options: "i" } },
        { title: { $regex: escaped, $options: "i" } },
      ];
    }

    const now = new Date();

    if (status === "active") {
      filter.isActive = true;
      filter.startDate = { $lte: now };
      filter.endDate = { $gt: now };
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "expired") {
      filter.endDate = { $lte: now };
    } else if (status === "upcoming") {
      filter.isActive = true;
      filter.startDate = { $gt: now };
    }

    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: vouchers.length,
      data: vouchers,
    });
  } catch (error) {
    console.error("Admin get vouchers error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách voucher.",
    });
  }
});

// POST /api/admin/vouchers
router.post("/vouchers", async (req, res) => {
  try {
    const errors = validateVoucherInput(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    const data = buildVoucherData(req.body);

    const existing = await Voucher.findOne({ code: data.code });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Mã voucher đã tồn tại.",
      });
    }

    const voucher = await Voucher.create(data);

    return res.status(201).json({
      success: true,
      message: "Tạo voucher thành công.",
      data: voucher,
    });
  } catch (error) {
    console.error("Admin create voucher error:", error);

    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Mã voucher đã tồn tại."
          : "Không thể tạo voucher.",
    });
  }
});

// PUT /api/admin/vouchers/:id
router.put("/vouchers/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID voucher không hợp lệ.",
      });
    }

    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher.",
      });
    }

    const errors = validateVoucherInput(req.body || {});

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    const data = buildVoucherData(req.body);

    // Không cho sửa mã voucher đã được sử dụng.
    if (voucher.usedCount > 0 && data.code !== voucher.code) {
      return res.status(409).json({
        success: false,
        message: "Không thể đổi mã voucher đã được sử dụng.",
      });
    }

    if (data.totalLimit > 0 && data.totalLimit < voucher.usedCount) {
      return res.status(400).json({
        success: false,
        message: "Số lượng phát hành không được nhỏ hơn số lượt đã dùng.",
      });
    }

    const updated = await Voucher.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Cập nhật voucher thành công.",
      data: updated,
    });
  } catch (error) {
    console.error("Admin update voucher error:", error);

    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Mã voucher đã tồn tại."
          : "Không thể cập nhật voucher.",
    });
  }
});

// PATCH /api/admin/vouchers/:id/status
router.patch("/vouchers/:id/status", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID voucher không hợp lệ.",
      });
    }

    if (typeof req.body?.isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Trạng thái phải là true hoặc false.",
      });
    }

    const voucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: req.body.isActive } },
      { new: true, runValidators: true }
    );

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher.",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật trạng thái voucher thành công.",
      data: voucher,
    });
  } catch (error) {
    console.error("Admin voucher status error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái voucher.",
    });
  }
});

// DELETE /api/admin/vouchers/:id
router.delete("/vouchers/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID voucher không hợp lệ.",
      });
    }

    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy voucher.",
      });
    }

    if (voucher.usedCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Voucher đã được sử dụng. Hãy tạm dừng thay vì xóa.",
      });
    }

    await Voucher.deleteOne({ _id: voucher._id });

    return res.json({
      success: true,
      message: "Xóa voucher thành công.",
    });
  } catch (error) {
    console.error("Admin delete voucher error:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể xóa voucher.",
    });
  }
});
module.exports = router;
