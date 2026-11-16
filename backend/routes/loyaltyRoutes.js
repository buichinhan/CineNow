const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const { authMiddleware } = require('../middleware/auth');

const POINT_EXCHANGE_RATE = 1000; // 1 điểm = 1.000 VNĐ
const memoryPointTransactions = [];

/**
 * 1. GET /api/loyalty/balance
 * Lấy số dư điểm thành viên và quy tắc quy đổi hiện tại của người dùng
 */
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    let points = 120;
    let fullName = 'Người dùng CineNow';

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.userId).select('fullName email phone loyaltyPoints');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tài khoản người dùng.',
        });
      }
      points = user.loyaltyPoints || 0;
      fullName = user.fullName;
    }

    return res.json({
      success: true,
      data: {
        userId: req.userId,
        fullName,
        loyaltyPoints: points,
        pointExchangeRate: POINT_EXCHANGE_RATE,
        equivalentVnd: points * POINT_EXCHANGE_RATE,
      },
    });
  } catch (error) {
    console.error('Lỗi lấy số dư điểm:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy số dư điểm.',
    });
  }
});

/**
 * 2. GET /api/loyalty/history
 * Lấy lịch sử biến động điểm thưởng (tích điểm, sử dụng điểm, hoàn điểm)
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const transactions = await PointTransaction.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      return res.json({
        success: true,
        data: transactions,
      });
    }

    // In-memory fallback
    const userHistory = memoryPointTransactions
      .filter((t) => t.userId === req.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      data: userHistory,
    });
  } catch (error) {
    console.error('Lỗi lấy lịch sử điểm:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy lịch sử điểm.',
    });
  }
});

/**
 * 3. POST /api/loyalty/calculate
 * Tính toán nhanh số tiền giảm khi muốn sử dụng số điểm cụ thể
 */
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const { pointsToUse = 0, orderAmount = 0 } = req.body;
    const numPoints = Math.max(0, parseInt(pointsToUse, 10) || 0);
    const numOrderAmount = Math.max(0, parseInt(orderAmount, 10) || 0);

    let userAvailablePoints = 120;
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng.',
        });
      }
      userAvailablePoints = user.loyaltyPoints || 0;
    }

    if (numPoints > userAvailablePoints) {
      return res.status(400).json({
        success: false,
        message: `Số điểm muốn dùng (${numPoints} điểm) vượt quá số dư hiện có (${userAvailablePoints} điểm).`,
      });
    }

    // Giá trị quy đổi tối đa không được vượt quá giá trị đơn hàng
    const maxUsablePoints = Math.floor(numOrderAmount / POINT_EXCHANGE_RATE);
    const actualPointsUsed = Math.min(numPoints, maxUsablePoints);
    const discountAmount = actualPointsUsed * POINT_EXCHANGE_RATE;
    const finalAmount = Math.max(0, numOrderAmount - discountAmount);

    return res.json({
      success: true,
      data: {
        pointsToUse: actualPointsUsed,
        discountAmount,
        originalAmount: numOrderAmount,
        finalAmount,
        remainingPoints: userAvailablePoints - actualPointsUsed,
      },
    });
  } catch (error) {
    console.error('Lỗi tính điểm quy đổi:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tính điểm quy đổi.',
    });
  }
});

module.exports = router;
