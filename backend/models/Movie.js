const mongoose = require('mongoose');

const showtimeSubSchema = new mongoose.Schema({
  cinemaName: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    enum: ['2D', '3D', 'IMAX'],
    default: '2D',
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  times: [
    {
      time: String, // HH:mm
      price: Number,
      room: String,
    },
  ],
});

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    director: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    cast: {
      type: [String],
      default: [],
      index: true,
    },
    genres: {
      type: [String],
      required: true,
      index: true,
    },
    formats: {
      type: [String],
      enum: ['2D', '3D', 'IMAX'],
      default: ['2D'],
      index: true,
    },
    ageRating: {
      type: String,
      enum: ['P', 'K', 'T13', 'T16', 'T18'],
      default: 'P',
      index: true,
    },
    duration: {
      type: Number, // phút
      required: true,
    },
    rating: {
      type: Number, // thang điểm 10
      default: 8.0,
      min: 0,
      max: 10,
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    posterUrl: {
      type: String,
      required: true,
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    synopsis: {
      type: String,
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['NOW_SHOWING', 'COMING_SOON'],
      required: true,
      index: true,
    },
    language: {
      type: String,
      default: 'Tiếng Việt - Phụ đề Tiếng Anh',
    },
    showtimes: [showtimeSubSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', movieSchema);
