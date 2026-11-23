const mongoose = require('mongoose');

const paymentIntentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'needs_review'],
      default: 'pending',
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    bookingData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    sepayTransactionId: {
      type: String,
      sparse: true,
      unique: true,
    },
    paidAt: Date,
    reviewReason: String,
  },
  { timestamps: true }
);

paymentIntentSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('PaymentIntent', paymentIntentSchema);
