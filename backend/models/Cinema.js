const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    distance: {
      type: String,
      default: '1,2 km',
    },
    city: {
      type: String,
      default: 'TP. Hồ Chí Minh',
    },
    status: {
  type: String,
  enum: ['ACTIVE', 'INACTIVE'],
  default: 'ACTIVE',
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Cinema', cinemaSchema);
