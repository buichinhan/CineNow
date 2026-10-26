const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
    },
    cinemaName: {
      type: String,
      required: true,
    },
    cinemaAddress: {
      type: String,
      default: '',
    },
    cinemaDistance: {
      type: String,
      default: '1,2 km',
    },
    room: {
      type: String,
      default: 'PHÒNG 03',
    },
    format: {
      type: String,
      default: '2D PHỤ ĐỀ',
    },
    date: {
      type: String,
      required: true, // e.g. "2026-10-16" or "16"
    },
    times: [
      {
        time: { type: String, required: true }, // e.g. "09:00", "19:00"
        price: { type: Number, default: 95000 },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Showtime', showtimeSchema);
