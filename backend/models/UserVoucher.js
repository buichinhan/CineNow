const mongoose = require('mongoose');

const userVoucherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'USED', 'EXPIRED'],
      default: 'AVAILABLE',
      index: true,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
    },
    orderId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userVoucherSchema.index({ userId: 1, voucherId: 1 });

module.exports = mongoose.model('UserVoucher', userVoucherSchema);
