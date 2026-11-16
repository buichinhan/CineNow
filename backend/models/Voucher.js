const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM'],
      default: 'FIXED_AMOUNT',
      required: true,
    },
    // Giá trị giảm: VD 20 (nếu %) hoặc 30000 (nếu số tiền cố định)
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Giới hạn giảm tối đa nếu discountType là PERCENTAGE (VD: giảm 20% tối đa 50.000đ)
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    // Giá trị đơn hàng tối thiểu để áp dụng voucher
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    // Tổng số lượng phát hành (0 = vô hạn)
    totalLimit: {
      type: Number,
      default: 100,
    },
    // Số lần đã sử dụng trên toàn hệ thống
    usedCount: {
      type: Number,
      default: 0,
    },
    // Giới hạn số lần mỗi user được dùng voucher này
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    // Danh sách rạp áp dụng (trống = tất cả các rạp)
    applicableCinemas: {
      type: [String],
      default: [],
    },
    // Định dạng phòng chiếu áp dụng (VD: ['2D', '3D', 'IMAX'] - trống = tất cả)
    applicableFormats: {
      type: [String],
      default: [],
    },
    // Tặng kèm quà/bắp nước nếu là FREE_ITEM
    freeItemName: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Voucher', voucherSchema);
