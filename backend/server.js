require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Voucher = require('./models/Voucher');
const UserVoucher = require('./models/UserVoucher');
const PointTransaction = require('./models/PointTransaction');
const jwt = require('jsonwebtoken');
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/auth');
const showtimeRoutes = require('./routes/showtimeRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');

const {
  INITIAL_MOVIES,
  INITIAL_CINEMAS,
  INITIAL_SEAT_LAYOUT,
  INITIAL_CONCESSIONS,
} = require('./seedData');

const {
  holdSeats,
  releaseSeats,
  confirmBookedSeats,
  getSeatsWithHoldStatus,
} = require('./services/seatHoldService');

// ====================== APP CONFIGURATION ======================

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// ====================== DATABASE STATUS ======================

let isMongoConnected = false;

// ====================== IN-MEMORY DATA ======================
// Dữ liệu dự phòng khi MongoDB chưa kết nối.
// Đăng ký và đăng nhập vẫn yêu cầu MongoDB hoạt động.

const memoryStore = {
  movies: INITIAL_MOVIES.map((movie, index) => ({
    ...movie,
    _id: `mem_movie_${index + 1}`,
  })),

  cinemas: INITIAL_CINEMAS.map((cinema, index) => ({
    ...cinema,
    _id: `mem_cinema_${index + 1}`,
  })),

  seatLayout: JSON.parse(JSON.stringify(INITIAL_SEAT_LAYOUT)),
  concessions: [...INITIAL_CONCESSIONS],
  bookings: [],
};

// Cho phép các router truy cập dữ liệu và trạng thái chung.
app.locals.memoryStore = memoryStore;
app.locals.isMongoConnected = false;

// ====================== SEED DATABASE ======================

async function seedDatabaseIfEmpty() {
  try {
    const movieCount = await Movie.countDocuments();

    if (movieCount === 0) {
      console.log(
        'Chưa có dữ liệu phim, đang khởi tạo dữ liệu mẫu...'
      );

      await Movie.insertMany(INITIAL_MOVIES);

      console.log(`Đã tạo ${INITIAL_MOVIES.length} phim mẫu.`);
    }

    const cinemaCount = await Cinema.countDocuments();

    if (cinemaCount === 0) {
      await Cinema.insertMany(INITIAL_CINEMAS);

      console.log(`Đã tạo ${INITIAL_CINEMAS.length} rạp mẫu.`);
    }

    const voucherCount = await Voucher.countDocuments();
    if (voucherCount === 0) {
      const { sampleVouchers } = require('./seedVouchers');
      await Voucher.insertMany(sampleVouchers);
      console.log(`Đã tạo ${sampleVouchers.length} voucher khuyến mãi mẫu.`);
    }
  } catch (error) {
    console.error(
      'Lỗi khi khởi tạo dữ liệu mẫu:',
      error.message
    );
  }
}

// ====================== HEALTH CHECK ======================

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;

  return res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected
      ? 'CineNow API đang hoạt động'
      : 'CineNow API đang chạy nhưng MongoDB chưa sẵn sàng',
    database: connected
      ? 'MongoDB Connected'
      : 'Disconnected',
  });
});

// ====================== AUTH ROUTES ======================
// Đăng ký và đăng nhập yêu cầu MongoDB hoạt động.

app.use('/api/auth', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        'Cơ sở dữ liệu chưa sẵn sàng. Vui lòng thử lại sau.',
    });
  }

  next();
}, authRoutes);

// ====================== MOVIE ROUTES ======================

app.use('/api/movies', movieRoutes);

// ====================== SHOWTIME ROUTES ======================
// Tích hợp router suất chiếu từ nhánh main.
// Không đăng ký thêm API GET /api/showtimes cũ tại đây.

app.use('/api/showtimes', showtimeRoutes);

// ====================== VOUCHER & LOYALTY ROUTES ======================
app.use('/api/vouchers', voucherRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// ====================== HOME API ======================

app.get('/api/home', async (req, res) => {
  try {
    let movies;
    let cinemas;

    if (mongoose.connection.readyState === 1) {
      movies = await Movie.find().lean();
      cinemas = await Cinema.find().lean();
    } else {
      movies = memoryStore.movies;
      cinemas = memoryStore.cinemas;
    }

    const featuredMovie =
      movies.find(
        (movie) =>
          movie.isFeatured || movie.status === 'featured'
      ) ||
      movies[0] ||
      null;

    const nowShowing = movies.filter(
      (movie) =>
        movie.status === 'now_showing' ||
        movie.status === 'NOW_SHOWING'
    );

    const upcoming = movies.filter(
      (movie) =>
        movie.status === 'upcoming' ||
        movie.status === 'COMING_SOON'
    );

    const nearbyCinemas = cinemas.slice(0, 3);

    return res.json({
      success: true,
      data: {
        featuredMovie,
        nowShowing,
        upcoming,
        nearbyCinemas,
      },
    });
  } catch (error) {
    console.error('Lỗi /api/home:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Lỗi tải dữ liệu trang chủ.',
    });
  }
});

// ====================== SEATS & TEMPORARY HOLD API ======================

async function getBookedSeatsForScreening({ cinemaName, room, date, time }) {
  const booked = [];
  if (mongoose.connection.readyState === 1) {
    try {
      const bookings = await Booking.find({
        cinemaName,
        date,
        time,
        status: 'confirmed',
      }).lean();
      bookings.forEach((b) => {
        if (Array.isArray(b.seats)) booked.push(...b.seats);
      });
      return booked;
    } catch (err) {
      console.warn('Lỗi lấy danh sách ghế đã đặt từ DB:', err.message);
    }
  }

  // Fallback in-memory
  memoryStore.bookings
    .filter(
      (b) =>
        b.cinemaName === cinemaName &&
        b.date === date &&
        b.time === time &&
        b.status === 'confirmed'
    )
    .forEach((b) => {
      if (Array.isArray(b.seats)) booked.push(...b.seats);
    });

  return booked;
}

/**
 * 1. GET /api/seats
 * Lấy sơ đồ ghế, trạng thái đã đặt / đang giữ tạm thời
 */
app.get('/api/seats', async (req, res) => {
  try {
    const {
      cinemaName = 'CineNow Landmark 81',
      room = 'PHÒNG 03',
      date = '16.10.2026',
      time = '19:00',
      holdToken,
    } = req.query;

    const bookedSeatsList = await getBookedSeatsForScreening({
      cinemaName,
      room,
      date,
      time,
    });

    const data = getSeatsWithHoldStatus({
      cinemaName,
      room,
      date,
      time,
      holdToken,
      initialLayout: INITIAL_SEAT_LAYOUT,
      bookedSeatsList,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Lỗi /api/seats:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải sơ đồ ghế.',
    });
  }
});

/**
 * 2. POST /api/seats/hold
 * Giữ ghế tạm thời (Kiểm soát đồng thời, ngăn chặn 2 người cùng chọn 1 ghế)
 */
app.post('/api/seats/hold', async (req, res) => {
  try {
    const {
      cinemaName = 'CineNow Landmark 81',
      room = 'PHÒNG 03',
      date = '16.10.2026',
      time = '19:00',
      seats,
      holdToken,
      userId,
      durationSeconds,
    } = req.body;

    const bookedSeatsList = await getBookedSeatsForScreening({
      cinemaName,
      room,
      date,
      time,
    });

    const result = holdSeats({
      cinemaName,
      room,
      date,
      time,
      seats,
      holdToken,
      userId,
      durationSeconds,
      initialLayout: INITIAL_SEAT_LAYOUT,
      bookedSeatsList,
    });

    if (!result.success) {
      return res.status(409).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi /api/seats/hold:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi giữ ghế tạm thời.',
      error: error.message,
    });
  }
});

/**
 * 3. POST /api/seats/release
 * Giải phóng ghế giữ tạm (Khi hủy chọn, nhấn Back hoặc hết hạn)
 */
app.post('/api/seats/release', async (req, res) => {
  try {
    const {
      cinemaName = 'CineNow Landmark 81',
      room = 'PHÒNG 03',
      date = '16.10.2026',
      time = '19:00',
      seats,
      holdToken,
    } = req.body;

    const result = releaseSeats({
      cinemaName,
      room,
      date,
      time,
      seats,
      holdToken,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi /api/seats/release:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi giải phóng ghế.',
      error: error.message,
    });
  }
});

// ====================== CONCESSIONS (BẮP NƯỚC & SNACK) API ======================
app.get('/api/concessions', (req, res) => {
  try {
    const { category } = req.query;
    let list = memoryStore.concessions || INITIAL_CONCESSIONS;
    if (category && category !== 'all') {
      list = list.filter((item) => item.category === category);
    }
    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    console.error('Lỗi lấy danh mục bắp nước:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách bắp nước và snack.',
    });
  }
});

// ====================== BOOKINGS API ======================
app.get('/api/bookings', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để xem vé.',
      });
    }

    const token = authorization.slice(7).trim();

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không hợp lệ.',
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
      });
    }

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Không xác định được tài khoản.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Cơ sở dữ liệu tạm thời không khả dụng.',
      });
    }

   const bookings = await Booking.find({
  userId: decoded.userId,
})
  .sort({ createdAt: -1 })
  .lean();

// Lấy tên phim từ danh sách vé
const movieTitles = [
  ...new Set(
    bookings
      .map((booking) => booking.movieTitle)
      .filter(Boolean)
  ),
];

// Tìm poster tương ứng trong MongoDB
const movies = movieTitles.length
  ? await Movie.find({
      title: { $in: movieTitles },
    })
      .select('title poster posterUrl')
      .lean()
  : [];

// Tạo bảng tra cứu poster
const posterMap = new Map(
  movies.map((movie) => [
    movie.title,
    movie.posterUrl || movie.poster || '',
  ])
);

// Bổ sung poster vào từng vé
const bookingsWithPoster = bookings.map((booking) => ({
  ...booking,
  poster:
    booking.poster ||
    posterMap.get(booking.movieTitle) ||
    '',
}));

return res.json({
  success: true,
  data: bookingsWithPoster,
});
  } catch (error) {
    console.error('Lỗi lấy lịch sử vé:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể tải lịch sử đặt vé.',
    });
  }
});
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      userId,
      movieTitle,
      poster,
      cinemaName,
      room,
      date,
      time,
      seats,
      seatTotal,
      concessions = [],
      concessionsTotal,
      voucherCode,
      pointsToUse = 0,
      paymentMethod,
      holdToken,
    } = req.body;

    // Lấy userId từ token nếu có (bảo mật xác thực)
    let effectiveUserId = userId;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cinenow_secret_key_2026');
        if (decoded?.userId) {
          effectiveUserId = decoded.userId;
        }
      } catch (e) {
        // Token không hợp lệ bỏ qua nếu đã truyền userId
      }
    }

    if (
      !Array.isArray(seats) ||
      seats.length === 0 ||
      !movieTitle
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 ghế.',
      });
    }

    // 1. Chuyển trạng thái ghế từ holding sang booked và giải phóng khóa giữ
    confirmBookedSeats({
      cinemaName: cinemaName || 'CineNow Landmark 81',
      room: room || 'PHÒNG 03',
      date: date || '16.10.2026',
      time: time || '19:00',
      seats,
      holdToken,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    // Cập nhật trạng thái ghế trong dữ liệu dự phòng.
    const seatLayout = memoryStore.seatLayout;
    if (seatLayout?.rows) {
      seatLayout.rows.forEach((row) => {
        row.seats.forEach((seat) => {
          if (seats.includes(seat.id)) {
            seat.status = 'booked';
          }
        });
      });
    }

    // 2. TÍNH TOÁN GIÁ TIỀN ĐỘC LẬP TRÊN BACKEND (BẢO MẬT KHÔNG TIN TƯỞNG CLIENT)
    const calcConcessionsTotal = Array.isArray(concessions)
      ? concessions.reduce(
          (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0
        )
      : 0;

    const finalConcessionsTotal =
      concessionsTotal !== undefined ? Math.max(0, Number(concessionsTotal)) : calcConcessionsTotal;
    const finalSeatTotal = Math.max(0, Number(seatTotal) || 0);
    const subtotal = finalSeatTotal + finalConcessionsTotal;

    // 3. KIỂM TRA & TÍNH TOÁN VOUCHER TRÊN DATABASE
    let voucher = null;
    let voucherDiscount = 0;
    let freeItem = null;

    if (voucherCode && String(voucherCode).trim()) {
      const cleanCode = String(voucherCode).trim().toUpperCase();
      if (mongoose.connection.readyState === 1) {
        voucher = await Voucher.findOne({ code: cleanCode });
      } else {
        const { sampleVouchers } = require('./seedVouchers');
        voucher = sampleVouchers.find((v) => v.code.toUpperCase() === cleanCode) || null;
      }

      if (!voucher) {
        return res.status(400).json({
          success: false,
          message: `Mã giảm giá '${cleanCode}' không tồn tại hoặc không hợp lệ.`,
        });
      }

      if (!voucher.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher này hiện đang tạm ngừng hoạt động.',
        });
      }

      const now = new Date();
      if (now < new Date(voucher.startDate)) {
        return res.status(400).json({
          success: false,
          message: 'Chương trình ưu đãi này chưa bắt đầu.',
        });
      }

      if (now > new Date(voucher.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher này đã hết hạn sử dụng.',
        });
      }

      if (voucher.totalLimit > 0 && (voucher.usedCount || 0) >= voucher.totalLimit) {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher đã hết lượt sử dụng trên hệ thống.',
        });
      }

      if (subtotal < (voucher.minOrderAmount || 0)) {
        return res.status(400).json({
          success: false,
          message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này.`,
        });
      }

      // Kiểm tra rạp áp dụng
      if (voucher.applicableCinemas && voucher.applicableCinemas.length > 0 && cinemaName) {
        const matchCinema = voucher.applicableCinemas.some(
          (c) => c.toLowerCase() === cinemaName.toLowerCase()
        );
        if (!matchCinema) {
          return res.status(400).json({
            success: false,
            message: `Mã này chỉ áp dụng tại cụm rạp: ${voucher.applicableCinemas.join(', ')}.`,
          });
        }
      }

      // Kiểm tra giới hạn số lần sử dụng của user
      if (effectiveUserId && mongoose.connection.readyState === 1) {
        const userUsedVoucherCount = await UserVoucher.countDocuments({
          userId: effectiveUserId,
          voucherId: voucher._id,
          status: 'USED',
        });

        if (userUsedVoucherCount >= voucher.usageLimitPerUser) {
          return res.status(400).json({
            success: false,
            message: `Bạn đã sử dụng tối đa (${voucher.usageLimitPerUser} lần) voucher này.`,
          });
        }
      }

      // Tính số tiền giảm của Voucher
      if (voucher.discountType === 'FIXED_AMOUNT') {
        voucherDiscount = Math.min(voucher.discountValue, subtotal);
      } else if (voucher.discountType === 'PERCENTAGE') {
        voucherDiscount = Math.round((subtotal * voucher.discountValue) / 100);
        if (voucher.maxDiscountAmount > 0) {
          voucherDiscount = Math.min(voucherDiscount, voucher.maxDiscountAmount);
        }
      } else if (voucher.discountType === 'FREE_ITEM') {
        voucherDiscount = 0;
        freeItem = voucher.freeItemName || null;
      }
    }

    // 4. KIỂM TRA & TÍNH TOÁN ĐIỂM THÀNH VIÊN TRÊN DATABASE
    let userDoc = null;
    let pointsActuallyUsed = 0;
    let pointsDiscount = 0;
    const requestedPoints = Math.max(0, parseInt(pointsToUse, 10) || 0);

    const remainingAfterVoucher = Math.max(0, subtotal - voucherDiscount);

    if (requestedPoints > 0) {
      if (!effectiveUserId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng đăng nhập để sử dụng điểm thành viên.',
        });
      }

      if (mongoose.connection.readyState === 1) {
        userDoc = await User.findById(effectiveUserId);
      }

      const currentPoints = userDoc
        ? (userDoc.loyaltyPoints || 0)
        : (app.locals.mockUserPoints !== undefined ? app.locals.mockUserPoints : 120);
      if (requestedPoints > currentPoints) {
        return res.status(400).json({
          success: false,
          message: `Số điểm muốn dùng (${requestedPoints} điểm) vượt quá số dư hiện có (${currentPoints} điểm).`,
        });
      }

      // Quy đổi: 1 điểm = 1.000 VNĐ. Điểm sử dụng không được vượt quá số tiền còn lại sau voucher
      const maxAllowedPoints = Math.floor(remainingAfterVoucher / 1000);
      pointsActuallyUsed = Math.min(requestedPoints, maxAllowedPoints);
      pointsDiscount = pointsActuallyUsed * 1000;
    }

    // 5. TÍNH TỔNG TIỀN THANH TOÁN CUỐI CÙNG & ĐIỂM TÍCH LŨY
    const finalTotalPrice = Math.max(0, remainingAfterVoucher - pointsDiscount);

    // Tích điểm: 1 điểm cho mỗi 10.000 VNĐ thanh toán thực tế
    const pointsEarned = Math.floor(finalTotalPrice / 10000);

    const bookingCode = `CN-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBookingData = {
      bookingCode,
      userId: effectiveUserId || null,
      movieTitle,
      poster: poster || '',
      cinemaName: cinemaName || 'CineNow Landmark 81',
      room: room || 'PHÒNG 03',
      date: date || '16.10.2026',
      time: time || '19:00',
      seats,
      seatTotal: finalSeatTotal,
      concessions: Array.isArray(concessions) ? concessions : [],
      concessionsTotal: finalConcessionsTotal,
      subtotal,
      voucherCode: voucher ? voucher.code : null,
      voucherId: voucher ? voucher._id : null,
      voucherDiscount,
      freeItem,
      pointsUsed: pointsActuallyUsed,
      pointsDiscount,
      pointsEarned,
      totalPrice: finalTotalPrice,
      paymentMethod: paymentMethod || 'CinePay / Thẻ ngân hàng / Ví điện tử',
      paymentStatus: 'paid',
      refundStatus: 'Chưa yêu cầu',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      // 6. LƯU ĐƠN VÀO MONGODB & CẬP NHẬT ĐIỂM / VOUCHER (ATOMIC)
      const savedBooking = await Booking.create(newBookingData);

      // Cập nhật trừ điểm đã dùng
      if (pointsActuallyUsed > 0 && effectiveUserId) {
        const updatedUser = await User.findByIdAndUpdate(
          effectiveUserId,
          { $inc: { loyaltyPoints: -pointsActuallyUsed } },
          { new: true }
        );

        await PointTransaction.create({
          userId: effectiveUserId,
          bookingId: savedBooking._id,
          bookingCode,
          type: 'REDEEM',
          points: -pointsActuallyUsed,
          balanceAfter: updatedUser ? updatedUser.loyaltyPoints : 0,
          description: `Sử dụng điểm cho đơn đặt vé ${bookingCode}`,
        });
      }

      // Cập nhật cộng điểm tích lũy sau thanh toán thành công
      if (pointsEarned > 0 && effectiveUserId) {
        const updatedUser = await User.findByIdAndUpdate(
          effectiveUserId,
          { $inc: { loyaltyPoints: pointsEarned } },
          { new: true }
        );

        await PointTransaction.create({
          userId: effectiveUserId,
          bookingId: savedBooking._id,
          bookingCode,
          type: 'EARN',
          points: pointsEarned,
          balanceAfter: updatedUser ? updatedUser.loyaltyPoints : pointsEarned,
          description: `Tích lũy điểm từ đơn đặt vé ${bookingCode}`,
        });
      }

      // Cập nhật lượt sử dụng voucher
      if (voucher) {
        await Voucher.findByIdAndUpdate(voucher._id, { $inc: { usedCount: 1 } });
        if (effectiveUserId) {
          await UserVoucher.findOneAndUpdate(
            { userId: effectiveUserId, voucherId: voucher._id, status: 'AVAILABLE' },
            { $set: { status: 'USED', usedAt: new Date(), orderId: bookingCode } }
          );
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Đặt vé và thanh toán thành công!',
        data: savedBooking,
      });
    }

    // Chế độ dự phòng in-memory
    const memoryBooking = {
      ...newBookingData,
      id: `booking_${Date.now()}`,
      _id: `mem_booking_${Date.now()}`,
    };
    memoryStore.bookings.push(memoryBooking);

    if (voucher) {
      voucher.usedCount = (voucher.usedCount || 0) + 1;
    }
    if (pointsActuallyUsed > 0) {
      app.locals.mockUserPoints =
        (app.locals.mockUserPoints !== undefined ? app.locals.mockUserPoints : 120) - pointsActuallyUsed;
    }
    if (pointsEarned > 0) {
      app.locals.mockUserPoints =
        (app.locals.mockUserPoints !== undefined ? app.locals.mockUserPoints : 120) + pointsEarned;
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công (Demo)!',
      data: memoryBooking,
    });
  } catch (error) {
    console.error('Lỗi đặt vé:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn đặt vé.',
      error: error.message,
    });
  }
});

// ====================== CANCEL BOOKING & REFUND POINTS API ======================
app.post('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const bookingIdentifier = req.params.id;

    let booking = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(bookingIdentifier)) {
        booking = await Booking.findById(bookingIdentifier).catch(() => null);
      }
      if (!booking) {
        booking = await Booking.findOne({ bookingCode: bookingIdentifier });
      }
      if (!booking) {
        booking = await Booking.findById(bookingIdentifier).catch(() => null);
      }
    } else {
      booking = memoryStore.bookings.find(
        (b) => b.id === bookingIdentifier || b.bookingCode === bookingIdentifier
      );
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin đơn đặt vé.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn đặt vé này đã được hủy trước đó.',
      });
    }

    // Cập nhật trạng thái vé thành cancelled
    booking.status = 'cancelled';
    booking.refundStatus = 'Đã hủy và hoàn trả điểm';

    if (mongoose.connection.readyState === 1) {
      await booking.save();

      const bUserId = booking.userId;

      // 1. Hoàn lại số điểm đã sử dụng
      if (booking.pointsUsed > 0 && bUserId) {
        const u = await User.findByIdAndUpdate(
          bUserId,
          { $inc: { loyaltyPoints: booking.pointsUsed } },
          { new: true }
        );

        await PointTransaction.create({
          userId: bUserId,
          bookingId: booking._id,
          bookingCode: booking.bookingCode,
          type: 'REFUND',
          points: booking.pointsUsed,
          balanceAfter: u ? u.loyaltyPoints : 0,
          description: `Hoàn ${booking.pointsUsed} điểm do hủy vé ${booking.bookingCode}`,
        });
      }

      // 2. Thu hồi số điểm đã tích lũy từ đơn này
      if (booking.pointsEarned > 0 && bUserId) {
        const u = await User.findByIdAndUpdate(
          bUserId,
          { $inc: { loyaltyPoints: -booking.pointsEarned } },
          { new: true }
        );

        await PointTransaction.create({
          userId: bUserId,
          bookingId: booking._id,
          bookingCode: booking.bookingCode,
          type: 'REFUND',
          points: -booking.pointsEarned,
          balanceAfter: u ? Math.max(0, u.loyaltyPoints) : 0,
          description: `Thu hồi ${booking.pointsEarned} điểm tích lũy do hủy vé ${booking.bookingCode}`,
        });
      }

      // 3. Hoàn lại lượt sử dụng voucher
      if (booking.voucherId) {
        await Voucher.findByIdAndUpdate(booking.voucherId, {
          $inc: { usedCount: -1 },
        });

        if (bUserId) {
          await UserVoucher.findOneAndUpdate(
            { userId: bUserId, voucherId: booking.voucherId, orderId: booking.bookingCode },
            { $set: { status: 'AVAILABLE', usedAt: null, orderId: null } }
          );
        }
      }
    } else {
      if (booking.pointsUsed > 0) {
        app.locals.mockUserPoints =
          (app.locals.mockUserPoints !== undefined ? app.locals.mockUserPoints : 120) + booking.pointsUsed;
      }
      if (booking.pointsEarned > 0) {
        app.locals.mockUserPoints = Math.max(
          0,
          (app.locals.mockUserPoints !== undefined ? app.locals.mockUserPoints : 120) - booking.pointsEarned
        );
      }
      if (booking.voucherCode) {
        const { sampleVouchers } = require('./seedVouchers');
        const v = sampleVouchers.find((x) => x.code === booking.voucherCode);
        if (v && v.usedCount > 0) v.usedCount -= 1;
      }
    }

    // Giải phóng ghế
    releaseSeats({
      cinemaName: booking.cinemaName,
      room: booking.room,
      date: booking.date,
      time: booking.time,
      seats: booking.seats,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    return res.json({
      success: true,
      message: 'Hủy vé và xử lý hoàn điểm thành công.',
      data: booking,
    });
  } catch (error) {
    console.error('Lỗi hủy vé:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xử lý hủy vé.',
    });
  }
});

// ====================== ERROR HANDLER ======================

// Xử lý JSON không hợp lệ.
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu JSON không hợp lệ.',
    });
  }

  console.error('Lỗi server:', error.message);

  return res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi máy chủ.',
  });
});

// ====================== MONGODB CONNECTION ======================

async function connectDatabase() {
  if (!MONGODB_URI) {
    console.error(
      'Thiếu MONGODB_URI. Hãy cấu hình biến môi trường trong file .env hoặc trên Render.'
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    isMongoConnected = true;
    app.locals.isMongoConnected = true;

    console.log('Đã kết nối MongoDB thành công.');
    console.log('Database:', mongoose.connection.name);

    await seedDatabaseIfEmpty();
  } catch (error) {
    isMongoConnected = false;
    app.locals.isMongoConnected = false;

    console.error(
      'Không thể kết nối MongoDB:',
      error.message
    );
  }
}

// Theo dõi trạng thái kết nối khi MongoDB ngắt hoặc kết nối lại.
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  app.locals.isMongoConnected = false;

  console.warn('MongoDB đã ngắt kết nối.');
});

mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  app.locals.isMongoConnected = true;

  console.log('MongoDB đã kết nối.');
});

// ====================== START SERVER ======================

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CineNow API đang chạy trên cổng ${PORT}.`);
    console.log(`Health check: /api/health`);
  });

  // Khởi động kết nối database sau khi mở HTTP server.
  connectDatabase();
}

module.exports = app;