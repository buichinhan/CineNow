
const mongoose = require('mongoose');

const seatReservationSchema = new mongoose.Schema(
  {
    screeningKey: {
      type: String,
      required: true,
      trim: true,
    },
    seatId: {
      type: String,
      required: true,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Một ghế chỉ có một chủ sở hữu trong cùng suất chiếu.
seatReservationSchema.index(
  { screeningKey: 1, seatId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'SeatReservation',
  seatReservationSchema
);
