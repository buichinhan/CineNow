const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
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
    genre: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 8.5,
    },
    votes: {
      type: String,
      default: '1.000 đánh giá',
    },
    releaseDate: {
      type: String,
      default: '16.10.2026',
    },
    director: {
      type: String,
      default: 'Lê Minh Khang',
    },
    cast: {
      type: String,
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
    description: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      required: true,
    },
    backdrop: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['featured', 'now_showing', 'upcoming'],
      default: 'now_showing',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Movie', movieSchema);
