const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    movieTitle: {
      type: String,
      required: true,
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
    totalPrice: {
      type: Number,
      required: true,
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
