const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
  type: String,
  required: true,
  
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
