const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const SeatReservation = require('../models/SeatReservation');
const User = require('../models/User');
const PointTransaction = require('../models/PointTransaction');
const Voucher = require('../models/Voucher');
const UserVoucher = require('../models/UserVoucher');
const { getScreeningKey } = require('./seatHoldService');

async function persistBookingData(bookingData, session) {
  const bookingId = bookingData._id || new mongoose.Types.ObjectId();
  const {
    bookingCode,
    userId,
    cinemaName,
    room,
    date,
    time,
    seats,
    pointsUsed,
    pointsEarned,
    voucherId,
  } = bookingData;
  const normalizedSeats = seats.map((seat) =>
    String(seat).trim().toUpperCase()
  );
  const screeningKey = getScreeningKey({
    cinemaName,
    room,
    date,
    time,
  });
  const activeReservationFilter = {
    screeningKey,
    seatId: { $in: normalizedSeats },
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  };

  const legacyBookings = await Booking.find({
    cinemaName,
    room,
    date,
    time,
    status: 'confirmed',
  })
    .select('seats')
    .session(session)
    .lean();
  const requestedSeatSet = new Set(normalizedSeats);
  const legacyConflict = legacyBookings.some((existing) =>
    (existing.seats || []).some((seat) =>
      requestedSeatSet.has(String(seat).trim().toUpperCase())
    )
  );

  if (legacyConflict) {
    const error = new Error('Một hoặc nhiều ghế đã được đặt.');
    error.statusCode = 409;
    throw error;
  }

  await SeatReservation.deleteMany(
    {
      screeningKey,
      seatId: { $in: normalizedSeats },
      expiresAt: { $lte: new Date() },
    },
    { session }
  );

  const reservations = await SeatReservation.find(activeReservationFilter)
    .session(session)
    .lean();
  const foreignReservation = reservations.find(
    (reservation) => String(reservation.bookingId) !== String(bookingId)
  );

  if (foreignReservation) {
    const error = new Error('Một hoặc nhiều ghế đã được đặt.');
    error.statusCode = 409;
    throw error;
  }

  const reservedSeatSet = new Set(
    reservations
      .filter(
        (reservation) =>
          String(reservation.bookingId) === String(bookingId)
      )
      .map((reservation) => reservation.seatId)
  );
  const missingSeats = normalizedSeats.filter(
    (seat) => !reservedSeatSet.has(seat)
  );

  if (missingSeats.length > 0) {
    await SeatReservation.insertMany(
      missingSeats.map((seatId) => ({
        screeningKey,
        seatId,
        bookingId,
      })),
      { session, ordered: true }
    );
  }

  await SeatReservation.updateMany(
    { screeningKey, bookingId, seatId: { $in: normalizedSeats } },
    { $set: { expiresAt: null } },
    { session }
  );

  const bookingDocument = new Booking({
    ...bookingData,
    _id: bookingId,
  });
  const savedBooking = await bookingDocument.save({ session });

  if (pointsUsed > 0) {
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        loyaltyPoints: { $gte: pointsUsed },
      },
      { $inc: { loyaltyPoints: -pointsUsed } },
      { new: true, session }
    );

    if (!updatedUser) {
      const error = new Error(
        'Số dư điểm không đủ để hoàn tất đặt vé.'
      );
      error.statusCode = 409;
      throw error;
    }

    await PointTransaction.create(
      [{
        userId,
        bookingId,
        bookingCode,
        type: 'REDEEM',
        points: -pointsUsed,
        balanceAfter: updatedUser.loyaltyPoints,
        description: `Sử dụng điểm cho đơn đặt vé ${bookingCode}`,
      }],
      { session }
    );
  }

  if (pointsEarned > 0) {
    if (!Number.isSafeInteger(pointsEarned) || pointsEarned < 0) {
      throw new Error('Số điểm tích lũy không hợp lệ.');
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('Không tìm thấy người dùng để tích điểm.');
    }

    const currentPoints = Number(user.loyaltyPoints);
    const currentDebt = Number(user.loyaltyPointsDebt ?? 0);
    if (
      !Number.isSafeInteger(currentPoints) ||
      !Number.isSafeInteger(currentDebt) ||
      currentPoints < 0 ||
      currentDebt < 0
    ) {
      throw new Error('Dữ liệu điểm của tài khoản không hợp lệ.');
    }

    const debtPaid = Math.min(pointsEarned, currentDebt);
    const pointsAdded = pointsEarned - debtPaid;
    const finalPoints = currentPoints + pointsAdded;
    const finalDebt = currentDebt - debtPaid;
    if (
      !Number.isSafeInteger(finalPoints) ||
      !Number.isSafeInteger(finalDebt)
    ) {
      throw new Error('Kết quả tính điểm vượt giới hạn an toàn.');
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        loyaltyPoints: currentPoints,
        loyaltyPointsDebt: currentDebt,
      },
      {
        $set: {
          loyaltyPoints: finalPoints,
          loyaltyPointsDebt: finalDebt,
        },
      },
      { new: true, runValidators: true, session }
    );

    if (!updatedUser) {
      const error = new Error(
        'Số dư điểm đã thay đổi. Vui lòng thử lại.'
      );
      error.statusCode = 409;
      throw error;
    }

    await PointTransaction.create(
      [{
        userId,
        bookingId,
        bookingCode,
        type: 'EARN',
        points: pointsAdded,
        balanceAfter: finalPoints,
        description:
          `Tích lũy ${pointsEarned} điểm từ đơn đặt vé ${bookingCode}. ` +
          `Đã dùng ${debtPaid} điểm để thanh toán nợ.`,
      }],
      { session }
    );
  }

  if (voucherId) {
    const voucherFilter = {
      _id: voucherId,
      isActive: true,
      endDate: { $gte: new Date() },
    };
    const voucher = await Voucher.findById(voucherId).session(session);
    if (voucher && voucher.totalLimit > 0) {
      voucherFilter.usedCount = { $lt: voucher.totalLimit };
    }

    const updatedVoucher = await Voucher.findOneAndUpdate(
      voucherFilter,
      { $inc: { usedCount: 1 } },
      { new: true, session }
    );
    if (!updatedVoucher) {
      const error = new Error(
        'Voucher đã hết lượt hoặc không còn hiệu lực.'
      );
      error.statusCode = 409;
      throw error;
    }

    const usedUserVoucher = await UserVoucher.findOneAndUpdate(
      {
        userId,
        voucherId,
        status: 'AVAILABLE',
      },
      {
        $set: {
          status: 'USED',
          usedAt: new Date(),
          orderId: bookingCode,
        },
      },
      { new: true, runValidators: true, session }
    );
    if (!usedUserVoucher) {
      const error = new Error(
        'Voucher không thuộc tài khoản hoặc đã được sử dụng.'
      );
      error.statusCode = 409;
      throw error;
    }
  }

  return savedBooking;
}

module.exports = { persistBookingData };
