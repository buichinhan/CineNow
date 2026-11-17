const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Voucher = require('../models/Voucher');
const UserVoucher = require('../models/UserVoucher');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');
const { requireAuth, requireAdmin } = require('../middleware/adminAuth');
const { sampleVouchers } = require('../seedVouchers');

// Bộ nhớ dự phòng khi MongoDB chưa kết nối
const memoryUserVouchers = [];

/**
 * 1. LẤY DANH SÁCH VOUCHER KHUYẾN MÃI CÔNG KHAI
 * GET /api/vouchers
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const now = new Date();
    let vouchers = [];

    if (mongoose.connection.readyState === 1) {
      vouchers = await Voucher.find({
        isActive: true,
        endDate: { $gte: now },
      }).sort({ createdAt: -1 });
    } else {
      vouchers = sampleVouchers.filter(
        (v) => v.isActive && new Date(v.endDate) >= now
      );
    }

    let claimedVoucherMap = {};
    if (req.userId) {
      if (mongoose.connection.readyState === 1) {
        const userClaims = await UserVoucher.find({
          userId: req.userId,
        });

        userClaims.forEach((claim) => {
          const vId = (claim.voucherId || '').toString();
          claimedVoucherMap[vId] = (claimedVoucherMap[vId] || 0) + 1;
        });
      } else {
        memoryUserVouchers
          .filter((uv) => uv.userId === req.userId)
          .forEach((uv) => {
            const vId = uv.voucherId?.toString() || uv.code;
            claimedVoucherMap[vId] = (claimedVoucherMap[vId] || 0) + 1;
          });
      }
    }

    const result = vouchers.map((v) => {
      const vObj = typeof v.toObject === 'function' ? v.toObject() : { ...v };
      const vId = (vObj._id || vObj.code || '').toString();
      const userClaimCount = claimedVoucherMap[vId] || 0;
      const isClaimedMax = userClaimCount >= (vObj.usageLimitPerUser || 1);
      const isOutOfStock = vObj.totalLimit > 0 && (vObj.usedCount || 0) >= vObj.totalLimit;

      return {
        ...vObj,
        _id: vObj._id || vObj.code,
        userClaimCount,
        isClaimed: userClaimCount > 0,
        canClaim: !isClaimedMax && !isOutOfStock,
      };
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách voucher:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy voucher.' });
  }
});

/**
 * 2. THU THẬP / LƯU VOUCHER VÀO VÍ CỦA TÀI KHOẢN
 * POST /api/vouchers/claim
 */
router.post('/claim', authMiddleware, async (req, res) => {
  try {
    const { voucherId, code } = req.body;
    let voucher = null;

    if (mongoose.connection.readyState === 1) {
      const query = voucherId ? { _id: voucherId } : { code: code?.toUpperCase()?.trim() };
      voucher = await Voucher.findOne(query);
    } else {
      voucher = sampleVouchers.find(
        (v) =>
          (voucherId && (v._id === voucherId || v.code === voucherId)) ||
          (code && v.code.toUpperCase() === code.toUpperCase().trim())
      );
    }

    if (!voucher || !voucher.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mã voucher không tồn tại hoặc đã ngừng áp dụng.',
      });
    }

    const now = new Date();
    if (now > new Date(voucher.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher này đã hết hạn sử dụng.',
      });
    }

    if (now < new Date(voucher.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Chương trình ưu đãi này chưa bắt đầu.',
      });
    }

    if (voucher.totalLimit > 0 && (voucher.usedCount || 0) >= voucher.totalLimit) {
      return res.status(400).json({
        success: false,
        message: 'Voucher này đã hết lượt thu thập trên hệ thống.',
      });
    }

    // Kiểm tra số lần người dùng đã nhận
    let claimedCount = 0;
    if (mongoose.connection.readyState === 1) {
      claimedCount = await UserVoucher.countDocuments({
        userId: req.userId,
        voucherId: voucher._id,
      });
    } else {
      claimedCount = memoryUserVouchers.filter(
        (uv) => uv.userId === req.userId && (uv.voucherId === voucher._id || uv.code === voucher.code)
      ).length;
    }

    if (claimedCount >= (voucher.usageLimitPerUser || 1)) {
      return res.status(400).json({
        success: false,
        message: `Bạn đã lưu voucher này ${claimedCount} lần (tối đa ${voucher.usageLimitPerUser} lần).`,
      });
    }

    let newClaim;
    if (mongoose.connection.readyState === 1) {
      newClaim = await UserVoucher.create({
        userId: req.userId,
        voucherId: voucher._id,
        status: 'AVAILABLE',
        claimedAt: new Date(),
      });
    } else {
      newClaim = {
        _id: `mem_uv_${Date.now()}`,
        userId: req.userId,
        voucherId: voucher._id || voucher.code,
        code: voucher.code,
        status: 'AVAILABLE',
        claimedAt: new Date(),
      };
      memoryUserVouchers.push(newClaim);
    }

    return res.status(201).json({
      success: true,
      message: 'Thu thập voucher thành công! Đã thêm vào ví của bạn.',
      data: newClaim,
    });
  } catch (error) {
    console.error('Lỗi thu thập voucher:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi thu thập voucher.' });
  }
});

/**
 * 3. XEM VÍ VOUCHER CỦA TÔI
 * GET /api/vouchers/my-vouchers
 */
router.get('/my-vouchers', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query; // 'AVAILABLE', 'USED', 'EXPIRED', hoặc bỏ trống
    const now = new Date();

    if (mongoose.connection.readyState === 1) {
      const filter = { userId: req.userId };
      if (status) {
        filter.status = status.toUpperCase();
      }

      const userVouchers = await UserVoucher.find(filter)
        .populate('voucherId')
        .sort({ createdAt: -1 });

      const formatted = await Promise.all(
        userVouchers.map(async (item) => {
          const v = item.voucherId;
          if (!v) return null;

          let currentStatus = item.status;
          if (currentStatus === 'AVAILABLE' && now > new Date(v.endDate)) {
            currentStatus = 'EXPIRED';
            item.status = 'EXPIRED';
            await item.save();
          }

          return {
            userVoucherId: item._id,
            status: currentStatus,
            claimedAt: item.claimedAt,
            usedAt: item.usedAt,
            voucher: v,
          };
        })
      );

      return res.json({
        success: true,
        data: formatted.filter(Boolean),
      });
    }

    // Fallback in-memory
    const filtered = memoryUserVouchers
      .filter((uv) => uv.userId === req.userId && (!status || uv.status === status.toUpperCase()))
      .map((item) => {
        const v = sampleVouchers.find((sv) => sv.code === item.code || sv._id === item.voucherId);
        return {
          userVoucherId: item._id,
          status: item.status,
          claimedAt: item.claimedAt,
          usedAt: item.usedAt,
          voucher: v || null,
        };
      })
      .filter((item) => item.voucher);

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error('Lỗi lấy ví voucher:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy ví voucher.' });
  }
});

/**
 * 4. KIỂM TRA & TÍNH TOÁN GIẢM GIÁ (ÁP DỤNG TRONG QUY TRÌNH CHECKOUT)
 * POST /api/vouchers/validate
 */
router.post('/validate', optionalAuthMiddleware, async (req, res) => {
  try {
    const { code, orderAmount = 0, cinema = '', format = '' } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã giảm giá.',
      });
    }

    const cleanCode = code.toUpperCase().trim();
    let voucher = null;

    if (mongoose.connection.readyState === 1) {
      voucher = await Voucher.findOne({ code: cleanCode });
    } else {
      voucher = sampleVouchers.find((v) => v.code.toUpperCase() === cleanCode);
    }

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: `Mã giảm giá '${cleanCode}' không tồn tại trong hệ thống.`,
      });
    }

    if (!voucher.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher này hiện đang tạm ngừng hoạt động.',
      });
    }

    const now = new Date();
    if (now < new Date(voucher.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Chương trình ưu đãi này chưa đến thời gian áp dụng.',
      });
    }

    if (now > new Date(voucher.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher này đã hết hạn sử dụng.',
      });
    }

    // Kiểm tra tổng lượt dùng hệ thống
    const currentUsedCount = voucher.usedCount || 0;
    if (voucher.totalLimit > 0 && currentUsedCount >= voucher.totalLimit) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã hết lượt sử dụng trên hệ thống.',
      });
    }

    // Kiểm tra đơn tối thiểu
    const minOrder = voucher.minOrderAmount || 0;
    if (orderAmount < minOrder) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu phải từ ${minOrder.toLocaleString('vi-VN')}đ để sử dụng mã này.`,
      });
    }

    // Kiểm tra rạp áp dụng
    if (voucher.applicableCinemas && voucher.applicableCinemas.length > 0 && cinema) {
      const matchCinema = voucher.applicableCinemas.some(
        (c) => c.toLowerCase() === cinema.toLowerCase()
      );
      if (!matchCinema) {
        return res.status(400).json({
          success: false,
          message: `Mã này chỉ áp dụng tại cụm rạp: ${voucher.applicableCinemas.join(', ')}.`,
        });
      }
    }

    // Kiểm tra định dạng phòng chiếu (2D, 3D, IMAX)
    if (voucher.applicableFormats && voucher.applicableFormats.length > 0 && format) {
      const matchFormat = voucher.applicableFormats.some(
        (f) => f.toUpperCase() === format.toUpperCase()
      );
      if (!matchFormat) {
        return res.status(400).json({
          success: false,
          message: `Mã này chỉ áp dụng cho định dạng: ${voucher.applicableFormats.join(', ')}.`,
        });
      }
    }

    // Nếu người dùng đã đăng nhập, kiểm tra số lần sử dụng của user
    if (req.userId) {
      let usedCountByUser = 0;
      if (mongoose.connection.readyState === 1) {
        usedCountByUser = await UserVoucher.countDocuments({
          userId: req.userId,
          voucherId: voucher._id,
          status: 'USED',
        });
      } else {
        usedCountByUser = memoryUserVouchers.filter(
          (uv) => uv.userId === req.userId && (uv.code === cleanCode || uv.voucherId === voucher._id) && uv.status === 'USED'
        ).length;
      }

      if (usedCountByUser >= (voucher.usageLimitPerUser || 1)) {
        return res.status(400).json({
          success: false,
          message: `Bạn đã sử dụng tối đa (${voucher.usageLimitPerUser} lần) voucher này.`,
        });
      }
    }

    // Tính toán số tiền được giảm
    let discountAmount = 0;
    if (voucher.discountType === 'FIXED_AMOUNT') {
      discountAmount = Math.min(voucher.discountValue, orderAmount);
    } else if (voucher.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((orderAmount * voucher.discountValue) / 100);
      if (voucher.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
      }
    } else if (voucher.discountType === 'FREE_ITEM') {
      discountAmount = 0;
    }

    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return res.json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      data: {
        code: voucher.code,
        title: voucher.title,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount,
        originalAmount: orderAmount,
        finalAmount,
        freeItem: voucher.freeItemName || null,
        voucherId: voucher._id || voucher.code,
      },
    });
  } catch (error) {
    console.error('Lỗi kiểm tra voucher:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra mã.' });
  }
});

/**
 * 5. TẠO VOUCHER MỚI (Dành cho Quản trị viên)
 * POST /api/vouchers/admin
 */
router.post('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      startDate,
      endDate,
      totalLimit,
      usageLimitPerUser,
      applicableCinemas,
      applicableFormats,
      freeItemName,
    } = req.body;

    if (!code || !title || !discountType || discountValue === undefined || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (code, title, discountType, discountValue, endDate).',
      });
    }

    const cleanCode = code.toUpperCase().trim();
    if (mongoose.connection.readyState === 1) {
      const existing = await Voucher.findOne({ code: cleanCode });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `Mã voucher '${cleanCode}' đã tồn tại trong hệ thống.`,
        });
      }

      const newVoucher = await Voucher.create({
        code: cleanCode,
        title: title.trim(),
        description,
        discountType,
        discountValue,
        maxDiscountAmount: maxDiscountAmount || 0,
        minOrderAmount: minOrderAmount || 0,
        startDate: startDate || new Date(),
        endDate: new Date(endDate),
        totalLimit: totalLimit || 0,
        usageLimitPerUser: usageLimitPerUser || 1,
        applicableCinemas: applicableCinemas || [],
        applicableFormats: applicableFormats || [],
        freeItemName: freeItemName || '',
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo voucher mới thành công.',
        data: newVoucher,
      });
    }

    // In-memory
    const newVoucher = {
      _id: `mem_v_${Date.now()}`,
      code: cleanCode,
      title: title.trim(),
      description,
      discountType,
      discountValue,
      maxDiscountAmount: maxDiscountAmount || 0,
      minOrderAmount: minOrderAmount || 0,
      startDate: startDate || new Date(),
      endDate: new Date(endDate),
      totalLimit: totalLimit || 0,
      usedCount: 0,
      usageLimitPerUser: usageLimitPerUser || 1,
      applicableCinemas: applicableCinemas || [],
      applicableFormats: applicableFormats || [],
      freeItemName: freeItemName || '',
      isActive: true,
    };
    sampleVouchers.push(newVoucher);

    return res.status(201).json({
      success: true,
      message: 'Tạo voucher mới thành công (Demo).',
      data: newVoucher,
    });
  } catch (error) {
    console.error('Lỗi tạo voucher:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo voucher.' });
  }
});

module.exports = router;
