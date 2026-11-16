const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    movieTitle: {
      type: String,
      required: true,
      trim: true,
    },
    cinemaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cinema',
    },
    cinemaName: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
      trim: true,
      default: 'PHÒNG 01',
    },
    format: {
      type: String,
      default: '2D PHỤ ĐỀ',
    },
    date: {
      type: String,
      required: true, // Định dạng "YYYY-MM-DD", ví dụ: "2026-10-16"
      index: true,
    },
    startTime: {
      type: String, // Định dạng "HH:mm", ví dụ: "09:30"
      required: true,
    },
    endTime: {
      type: String, // Định dạng "HH:mm", ví dụ: "11:53" (bao gồm thời lượng phim + thời gian đệm)
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 120,
    },
    bufferMinutes: {
      type: Number,
      default: 15,
    },
    price: {
      type: Number,
      default: 95000,
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
    // Duy trì mảng times để đảm bảo tương thích ngược hoàn toàn với mã nguồn cũ
    times: [
      {
        time: { type: String, required: true },
        price: { type: Number, default: 95000 },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Tạo index kép để tối ưu tốc độ tìm kiếm lịch theo rạp, phòng và ngày
showtimeSchema.index({ cinemaName: 1, room: 1, date: 1 });

module.exports = mongoose.model('Showtime', showtimeSchema);
