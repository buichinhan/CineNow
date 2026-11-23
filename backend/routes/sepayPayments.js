const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const PaymentIntent = require('../models/PaymentIntent');
const SeatReservation = require('../models/SeatReservation');
const { persistBookingData } = require('../services/bookingPersistence');
const {
  hasValidSePayWebhookAuth,
  readSePayTransfer,
} = require('../services/sepayPaymentService');

const router = express.Router();

function releaseIntentSeats(intent, session) {
  const options = session ? { session } : {};
  return SeatReservation.deleteMany({ bookingId: intent.bookingId }, options);
}

router.get('/:id', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để kiểm tra thanh toán.',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(
      authHeader.slice(7).trim(),
      process.env.JWT_SECRET || 'cinenow_secret_key_2026'
    );
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
  }

  if (!decoded?.userId) {
    return res.status(401).json({
      success: false,
      message: 'Token không chứa thông tin người dùng hợp lệ.',
    });
  }

  try {
    let intent = await PaymentIntent.findOne({
      _id: req.params.id,
      userId: decoded.userId,
    });

    if (!intent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch thanh toán.',
      });
    }

    if (
      intent.status === 'pending' &&
      intent.expiresAt.getTime() <= Date.now()
    ) {
      const expiredIntent = await PaymentIntent.findOneAndUpdate(
        {
          _id: intent._id,
          status: 'pending',
          expiresAt: { $lte: new Date() },
        },
        { $set: { status: 'expired' } },
        { new: true }
      );
      if (expiredIntent) {
        await releaseIntentSeats(expiredIntent);
      }
      intent = expiredIntent || await PaymentIntent.findById(intent._id);
      if (!intent) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch thanh toán.',
        });
      }
    }

    const booking =
      intent.status === 'paid'
        ? await Booking.findById(intent.bookingId).lean()
        : null;

    return res.json({
      success: true,
      data: {
        status: intent.status,
        reference: intent.reference,
        expiresAt: intent.expiresAt,
        booking,
      },
    });
  } catch (error) {
    console.error('Failed to read SePay payment status:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể kiểm tra trạng thái thanh toán.',
    });
  }
});

router.post('/webhook', async (req, res) => {
  if (
    !hasValidSePayWebhookAuth({
      headers: req.headers,
      rawBody: req.rawBody,
    })
  ) {
    return res.status(401).json({
      success: false,
      message: 'Webhook authentication failed.',
    });
  }

  const transfer = readSePayTransfer(req.body);
  if (!transfer) {
    return res.status(400).json({
      success: false,
      message: 'Invalid incoming transfer notification.',
    });
  }
  if (transfer.transferType !== 'IN' || !transfer.reference) {
    return res.status(200).json({ success: true, ignored: true });
  }
  if (transfer.amount <= 0) {
    return res.status(200).json({ success: true, ignored: true });
  }

  let session;
  let intent;
  try {
    intent = await PaymentIntent.findOne({
      reference: transfer.reference,
    });

    if (!intent) {
      return res.status(200).json({ success: true, ignored: true });
    }

    if (
      intent.status === 'paid' &&
      intent.sepayTransactionId === transfer.transactionId
    ) {
      return res.status(200).json({ success: true, duplicate: true });
    }

    if (intent.status !== 'pending') {
      return res.status(200).json({ success: true, ignored: true });
    }

    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const currentIntent = await PaymentIntent.findOne({
        _id: intent._id,
        status: 'pending',
      }).session(session);

      if (!currentIntent) {
        return;
      }

      if (
        currentIntent.expiresAt.getTime() <= Date.now() ||
        transfer.amount !== currentIntent.amount
      ) {
        currentIntent.status = 'needs_review';
        currentIntent.reviewReason =
          transfer.amount !== currentIntent.amount
            ? 'Received amount did not match the payment intent.'
            : 'Payment arrived after the QR reservation expired.';
        await currentIntent.save({ session });
        await releaseIntentSeats(currentIntent, session);
        return;
      }

      await persistBookingData(currentIntent.bookingData, session);
      currentIntent.status = 'paid';
      currentIntent.sepayTransactionId = transfer.transactionId;
      currentIntent.paidAt = new Date();
      await currentIntent.save({ session });
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('SePay webhook processing failed:', error.message);

    if (intent && (error.statusCode === 409 || error.code === 11000)) {
      await PaymentIntent.updateOne(
        { _id: intent._id, status: 'pending' },
        {
          $set: {
            status: 'needs_review',
            reviewReason:
              error.statusCode === 409
                ? error.message
                : 'A database uniqueness conflict occurred while finalizing payment.',
          },
        }
      );
      await releaseIntentSeats(intent);
      return res.status(200).json({ success: true, reviewRequired: true });
    }

    return res.status(500).json({
      success: false,
      message: 'Webhook processing failed.',
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

module.exports = router;
