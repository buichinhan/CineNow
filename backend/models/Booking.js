const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    movieTitle: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      default: '',
    },
    cinemaName: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      default: 'PHÒNG 03',
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    seats: [
      {
        type: String,
        required: true,
      },
    ],
    seatTotal: {
      type: Number,
      default: 0,
    },
    concessions: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        category: { type: String },
      },
    ],
    concessionsTotal: {
      type: Number,
      default: 0,
    },
    // Tổng giá trước khi giảm (seatTotal + concessionsTotal)
    subtotal: {
      type: Number,
      default: 0,
    },
    // Thông tin Voucher
    voucherCode: {
      type: String,
      default: null,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
    },
    voucherDiscount: {
      type: Number,
      default: 0,
    },
    freeItem: {
      type: String,
      default: null,
    },
    // Thông tin Điểm thành viên
    pointsUsed: {
      type: Number,
      default: 0,
    },
    pointsDiscount: {
      type: Number,
      default: 0,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    // Tổng tiền thanh toán thực tế
    totalPrice: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'CinePay / Thẻ ngân hàng / Ví điện tử',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'paid',
    },
    refundStatus: {
      type: String,
      default: 'Chưa yêu cầu',
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
