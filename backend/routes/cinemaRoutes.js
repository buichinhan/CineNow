
const express = require("express");
const mongoose = require("mongoose");
const Cinema = require("../models/Cinema");
const Showtime = require("../models/Showtime");
const { requireAuth, requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();
const adminOnly = [requireAuth, requireAdmin];

const isActive = (cinema) => cinema.status !== "INACTIVE";

function validateCinema(body) {
  const errors = [];

  if (!String(body.name || "").trim()) {
    errors.push("Tên rạp không được để trống.");
  }

  if (!String(body.address || "").trim()) {
    errors.push("Địa chỉ không được để trống.");
  }

  if (!String(body.district || "").trim()) {
    errors.push("Quận/huyện không được để trống.");
  }

  if (
    body.status !== undefined &&
    !["ACTIVE", "INACTIVE"].includes(body.status)
  ) {
    errors.push("Trạng thái rạp không hợp lệ.");
  }

  return errors;
}

function cinemaData(body) {
  return {
    name: String(body.name).trim(),
    address: String(body.address).trim(),
    district: String(body.district).trim(),
    city: String(body.city || "TP. Hồ Chí Minh").trim(),
    distance: String(body.distance || "1,2 km").trim(),
    status: body.status || "ACTIVE",
  };
}
router.get("/", async (req, res) => {
  try {
    const cinemas = await Cinema.find({
      status: { $ne: "INACTIVE" },
    }).sort({ createdAt: -1 }).lean();

    return res.json({ success: true, data: cinemas });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách rạp.",
    });
  }
});
router.get("/manage/all", adminOnly, async (req, res) => {
  try {
    const cinemas = await Cinema.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: cinemas });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách rạp.",
    });
  }
});

// Thêm rạp
router.post("/", adminOnly, async (req, res) => {
  try {
    const errors = validateCinema(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    const cinema = await Cinema.create(cinemaData(req.body));

    return res.status(201).json({
      success: true,
      message: "Đã thêm rạp thành công.",
      data: cinema,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể thêm rạp.",
    });
  }
});

// Chỉnh sửa rạp
router.put("/:id", adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID rạp không hợp lệ.",
      });
    }

    const errors = validateCinema(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    const cinema = await Cinema.findById(req.params.id);

    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy rạp.",
      });
    }

    // Không đổi tên rạp khi đã có suất chiếu liên kết.
    // Showtime đang lưu cả cinemaId và cinemaName.
    const linkedShowtimes = await Showtime.countDocuments({
      $or: [
        { cinemaId: cinema._id },
        { cinemaName: cinema.name },
      ],
    });

    if (linkedShowtimes > 0 && cinema.name !== req.body.name.trim()) {
      return res.status(409).json({
        success: false,
        message:
          "Rạp đã có suất chiếu. Không thể đổi tên để tránh sai lệch dữ liệu.",
      });
    }

    Object.assign(cinema, cinemaData(req.body));
    await cinema.save();

    return res.json({
      success: true,
      message: "Đã cập nhật rạp.",
      data: cinema,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật rạp.",
    });
  }
});

// Ngừng hoạt động / Mở lại
router.patch("/:id/status", adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID rạp không hợp lệ.",
      });
    }

    const cinema = await Cinema.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy rạp.",
      });
    }

    return res.json({
      success: true,
      message:
        status === "ACTIVE"
          ? "Đã mở lại rạp."
          : "Đã ngừng hoạt động rạp.",
      data: cinema,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể thay đổi trạng thái rạp.",
    });
  }
});

// Xóa rạp: chỉ cho phép khi không còn suất chiếu liên kết.
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID rạp không hợp lệ.",
      });
    }

    const cinema = await Cinema.findById(req.params.id);

    if (!cinema) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy rạp.",
      });
    }

    if (isActive(cinema)) {
      return res.status(409).json({
        success: false,
        message: "Hãy ngừng hoạt động rạp trước khi xóa.",
      });
    }

    const showtimeCount = await Showtime.countDocuments({
      $or: [
        { cinemaId: cinema._id },
        { cinemaName: cinema.name },
      ],
    });

    if (showtimeCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Rạp đã có suất chiếu. Không thể xóa để bảo vệ dữ liệu.",
      });
    }

    await cinema.deleteOne();

    return res.json({
      success: true,
      message: "Đã xóa rạp.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể xóa rạp.",
    });
  }
});

module.exports = router;
