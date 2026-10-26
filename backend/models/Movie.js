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
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    badge: {
      type: String,
      default: '',
    },
    ageRating: {
      type: String,
      default: '16+',
    },
    format: {
      type: String,
      default: '2D - IMAX',
    },
    formats: {
      type: [String],
      default: ['2D'],
    },
    genre: {
      type: String,
      default: 'Khoa học viễn tưởng',
    },
    genres: {
      type: [String],
      default: [],
    },
    duration: {
      type: mongoose.Schema.Types.Mixed,
      default: '128 phút',
    },
    rating: {
      type: Number,
      default: 8.5,
    },
    votes: {
      type: String,
      default: '1.000 đánh giá',
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    releaseDate: {
      type: mongoose.Schema.Types.Mixed,
      default: '16.10.2026',
    },
    director: {
      type: String,
      default: 'Lê Minh Khang',
    },
    cast: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Thanh Vân, Quốc Huy',
    },
    language: {
      type: String,
      default: 'Tiếng Việt',
    },
    trailerTime: {
      type: String,
      default: '02:14',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    synopsis: {
      type: String,
      default: '',
    },
    poster: {
      type: String,
      default: '',
    },
    posterUrl: {
      type: String,
      default: '',
    },
    backdrop: {
      type: String,
      default: '',
    },
    bannerUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'now_showing',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    showtimes: [showtimeSubSchema],
  },
  {
    timestamps: true,
  }
);

// Tự động đồng bộ các trường tương đương để cả 2 tính năng đều hoạt động
movieSchema.pre('save', function (next) {
  if (!this.posterUrl && this.poster) this.posterUrl = this.poster;
  if (!this.poster && this.posterUrl) this.poster = this.posterUrl;

  if (!this.bannerUrl && this.backdrop) this.bannerUrl = this.backdrop;
  if (!this.backdrop && this.bannerUrl) this.backdrop = this.bannerUrl;

  if (!this.synopsis && this.description) this.synopsis = this.description;
  if (!this.description && this.synopsis) this.description = this.synopsis;

  next();
});

module.exports = mongoose.model('Movie', movieSchema);
