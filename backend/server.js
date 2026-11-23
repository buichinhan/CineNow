require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');

const Booking = require('./models/Booking');
const SeatReservation = require('./models/SeatReservation');
const PaymentIntent = require('./models/PaymentIntent');
const User = require('./models/User');

const Voucher = require('./models/Voucher');
const UserVoucher = require('./models/UserVoucher');
const PointTransaction = require('./models/PointTransaction');
const jwt = require('jsonwebtoken');
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/auth');
const showtimeRoutes = require('./routes/showtimeRoutes');

// Router từ nhánh main
const cinemaRoutes = require('./routes/cinemaRoutes');
const adminRoutes = require('./routes/admin');

// Router từ nhánh feature/manhtoan
const voucherRoutes = require('./routes/voucherRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const sepayPaymentRoutes = require('./routes/sepayPayments');
const { persistBookingData } = require('./services/bookingPersistence');
const { buildSePayQrUrl } = require('./services/sepayPaymentService');

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
app.use(express.json({
  verify(req, res, buffer) {
    req.rawBody = Buffer.from(buffer);
  },
}));

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
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/admin', adminRoutes);

// ====================== VOUCHER & LOYALTY ROUTES ======================
app.use('/api/vouchers', voucherRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/payments/sepay', sepayPaymentRoutes);

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

    const nearbyCinemas = cinemas.filter(cinema => cinema.status !== 'INACTIVE');

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
  if (mongoose.connection.readyState !== 1) {
    const error = new Error(
      'MongoDB không khả dụng, không thể xác minh trạng thái ghế.'
    );
    error.statusCode = 503;
    throw error;
  }

  const { getScreeningKey } = require('./services/seatHoldService');

  const screeningKey = getScreeningKey({
    cinemaName,
    room,
    date,
    time,
  });

  // Giữ tương thích với các booking đã tồn tại.
  const bookings = await Booking.find({
    cinemaName,
    room,
    date,
    time,
    status: 'confirmed',
  })
    .select('seats')
    .lean();

  // Đọc những ghế đã được khóa bằng unique index.
  const reservations = await SeatReservation.find({
    screeningKey,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } },
    ],
  })
    .select('seatId')
    .lean();

  const bookedSeats = new Set();

  for (const booking of bookings) {
    if (!Array.isArray(booking.seats)) continue;

    for (const seat of booking.seats) {
      bookedSeats.add(String(seat).trim());
    }
  }

  for (const reservation of reservations) {
    bookedSeats.add(String(reservation.seatId).trim());
  }

  return [...bookedSeats];
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
    // Không cho phép tạo vé khi MongoDB chưa sẵn sàng.
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Hệ thống đặt vé tạm thời không khả dụng. Vui lòng thử lại sau.',
      });
    }

    // Lấy userId từ token nếu có (bảo mật xác thực)

    // Bắt buộc xác thực JWT trước khi tạo booking.
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập trước khi đặt vé.',
      });
    }

    const token = authHeader.slice(7).trim();
    let decoded;

    try {
      decoded = jwt.verify(
        token,
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

    const effectiveUserId = decoded.userId;

    // Đọc dữ liệu đặt vé từ request.
    // userId luôn lấy từ JWT, không lấy từ client.
    const {
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
    } = req.body || {};


    if (
      !Array.isArray(seats) ||
      seats.length === 0 ||
      !movieTitle
    ) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 ghế và cung cấp thông tin phim.',
      });
    }

    // Chuẩn hóa mã ghế trước khi kiểm tra và khóa trong MongoDB.
    const normalizedSeats = seats.map((seat) =>
      typeof seat === 'string' ? seat.trim().toUpperCase() : ''
    );
    if (
  normalizedSeats.some(
    (seat) => !/^[A-Z]+[1-9][0-9]*(?:-[1-9][0-9]*)?$/.test(seat)
  )
) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ghế có mã không hợp lệ.',
      });
    }

    if (new Set(normalizedSeats).size !== normalizedSeats.length) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách đặt vé chứa ghế bị trùng.',
      });
    }

    // Kiểm tra ghế đã được đặt trong MongoDB,
    // bao gồm cả các booking lịch sử chưa có SeatReservation.
    if (!cinemaName || !room || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin rạp, phòng hoặc suất chiếu.',
      });
    }

    const alreadyBookedSeats = await getBookedSeatsForScreening({
      cinemaName,
      room,
      date,
      time,
    });

    const bookedSeatSet = new Set(
      alreadyBookedSeats.map((seat) =>
        String(seat).trim().toUpperCase()
      )
    );

    const conflictingSeats = normalizedSeats.filter((seat) =>
      bookedSeatSet.has(seat)
    );

    if (conflictingSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ghế ${conflictingSeats.join(', ')} đã có người đặt. Vui lòng chọn ghế khác.`,
        conflictingSeats,
      });
    }



    // 2. TÍNH TOÁN GIÁ TIỀN ĐỘC LẬP TRÊN BACKEND (BẢO MẬT KHÔNG TIN TƯỞNG CLIENT)
   // 2. BACKEND TU TINH GIA GHE VA COMBO

// Tao bang gia ghe tu du lieu server
const seatPriceMap = new Map();

for (const row of INITIAL_SEAT_LAYOUT.rows) {
  for (const seat of row.seats) {
    seatPriceMap.set(
      String(seat.id).toUpperCase(),
      {
        price: Number(row.price),
        status: seat.status,
      }
    );
  }
}

// Kiem tra va tinh gia tung ghe
let finalSeatTotal = 0;

for (const seatId of normalizedSeats) {
  const seatInfo = seatPriceMap.get(seatId);

  if (!seatInfo || !Number.isSafeInteger(seatInfo.price) || seatInfo.price <= 0) {
    return res.status(400).json({
      success: false,
      message: `Ghe ${seatId} khong hop le hoac chua co gia.`,
    });
  }

  if (seatInfo.status === 'booked') {
    return res.status(409).json({
      success: false,
      message: `Ghe ${seatId} khong kha dung.`,
    });
  }

  finalSeatTotal += seatInfo.price;
}

// Tao bang gia combo tu du lieu server
const concessionMap = new Map(
  INITIAL_CONCESSIONS.map((item) => [
    String(item.id),
    item,
  ])
);

if (!Array.isArray(concessions)) {
  return res.status(400).json({
    success: false,
    message: 'Danh sach bap nuoc khong hop le.',
  });
}

let finalConcessionsTotal = 0;
const verifiedConcessions = [];

for (const item of concessions) {
  const product = concessionMap.get(String(item.id));
  const quantity = Number(item.quantity);

  if (
    !product ||
    product.isAvailable === false ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 20 ||
    !Number.isSafeInteger(Number(product.price)) ||
    Number(product.price) < 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'San pham hoac so luong khong hop le.',
    });
  }

  finalConcessionsTotal += Number(product.price) * quantity;

  verifiedConcessions.push({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    quantity,
  });
}

const subtotal = finalSeatTotal + finalConcessionsTotal;

if (!Number.isSafeInteger(subtotal)) {
  return res.status(400).json({
    success: false,
    message: 'Tong tien khong hop le.',
  });
}

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
      seats: normalizedSeats,
      seatTotal: finalSeatTotal,
concessions: verifiedConcessions,
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

    if (paymentMethod === 'SePay QR' && finalTotalPrice > 0) {
      const reference =
        `CN${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const bookingId = new mongoose.Types.ObjectId();
      const paymentIntentId = new mongoose.Types.ObjectId();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const bookingData = {
        ...newBookingData,
        _id: bookingId,
        bookingCode: reference,
        paymentMethod: 'SePay QR',
      };
      let qrUrl;

      try {
        qrUrl = buildSePayQrUrl({
          amount: finalTotalPrice,
          reference,
        });
      } catch (error) {
        return res.status(error.statusCode || 500).json({
          success: false,
          message: error.message,
        });
      }

      const { getScreeningKey } = require('./services/seatHoldService');
      const screeningKey = getScreeningKey({
        cinemaName,
        room,
        date,
        time,
      });
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
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
              requestedSeatSet.has(
                String(seat).trim().toUpperCase()
              )
            )
          );

          if (legacyConflict) {
            const error = new Error(
              'Một hoặc nhiều ghế đã được đặt.'
            );
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

          const activeReservations = await SeatReservation.find({
            screeningKey,
            seatId: { $in: normalizedSeats },
            $or: [
              { expiresAt: { $exists: false } },
              { expiresAt: null },
              { expiresAt: { $gt: new Date() } },
            ],
          })
            .session(session)
            .lean();

          if (activeReservations.length > 0) {
            const error = new Error(
              'Một hoặc nhiều ghế đang được giữ hoặc đã đặt.'
            );
            error.statusCode = 409;
            throw error;
          }

          await SeatReservation.insertMany(
            normalizedSeats.map((seatId) => ({
              screeningKey,
              seatId,
              bookingId,
              expiresAt,
            })),
            { session, ordered: true }
          );

          await PaymentIntent.create(
            [{
              _id: paymentIntentId,
              userId: effectiveUserId,
              reference,
              amount: finalTotalPrice,
              bookingId,
              bookingData,
              expiresAt,
            }],
            { session }
          );
        }, {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });

        return res.status(201).json({
          success: true,
          message: 'Đã tạo QR. Vé sẽ được xác nhận sau khi SePay báo nhận tiền.',
          data: {
            paymentIntentId: String(paymentIntentId),
            reference,
            amount: finalTotalPrice,
            qrUrl,
            expiresAt,
            status: 'pending',
          },
        });
      } catch (error) {
        console.error('Failed to create SePay payment intent:', error.message);
        if (error.code === 11000 || error.statusCode === 409) {
          return res.status(409).json({
            success: false,
            message:
              error.statusCode === 409
                ? error.message
                : 'Ghế vừa được người khác giữ hoặc đặt. Vui lòng chọn ghế khác.',
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Không thể tạo yêu cầu thanh toán SePay.',
        });
      } finally {
        await session.endSession();
      }
    }

    // 6. Persist the booking and related account changes atomically.
    if (mongoose.connection.readyState === 1) {
      const session = await mongoose.startSession();
      let savedBooking;

      try {
        await session.withTransaction(async () => {
          savedBooking = await persistBookingData(
            newBookingData,
            session
          );
        }, {
          readConcern: { level: 'snapshot' },
          writeConcern: { w: 'majority' },
        });

        return res.status(201).json({
          success: true,
          message: 'Đặt vé và thanh toán thành công!',
          data: savedBooking,
        });
      } catch (error) {
        console.error('Booking transaction failed:', error);

        if (error.code === 11000) {
          return res.status(409).json({
            success: false,
            message:
              'Ghế vừa được người khác đặt. Vui lòng chọn ghế khác.',
          });
        }

        return res.status(error.statusCode || 500).json({
          success: false,
          message:
            error.statusCode
              ? error.message
              : 'Không thể hoàn tất đặt vé. Giao dịch đã được hủy.',
        });
      } finally {
        await session.endSession();
      }
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

async function cancelBookingHandler(req, res) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập trước khi hủy vé.',
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Hệ thống xác thực chưa sẵn sàng.',
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(
      authorization.slice(7).trim(),
      process.env.JWT_SECRET
    );
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
  }

  if (!decoded?.userId || !mongoose.isValidObjectId(decoded.userId)) {
    return res.status(401).json({
      success: false,
      message: 'Thông tin tài khoản không hợp lệ.',
    });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Cơ sở dữ liệu chưa sẵn sàng.',
    });
  }

  const bookingIdentifier = String(req.params.id || '').trim();

  const bookingFilter = mongoose.isValidObjectId(bookingIdentifier)
    ? {
        $or: [
          { _id: bookingIdentifier },
          { bookingCode: bookingIdentifier },
        ],
      }
    : { bookingCode: bookingIdentifier };

  const session = await mongoose.startSession();

  try {
    let cancelledBooking = null;

    await session.withTransaction(async () => {
      const booking = await Booking.findOne(bookingFilter)
        .session(session);

      if (!booking) {
        const error = new Error('Không tìm thấy vé.');
        error.statusCode = 404;
        throw error;
      }

      if (String(booking.userId || '') !== String(decoded.userId)) {
        const error = new Error('Bạn không có quyền hủy vé này.');
        error.statusCode = 403;
        throw error;
      }

      if (booking.status !== 'confirmed') {
        const error = new Error(
          'Vé không còn ở trạng thái có thể hủy.'
        );
        error.statusCode = 409;
        throw error;
      }

      // Kiểm tra thời hạn hủy trước giờ chiếu hơn 30 phút.
      const rawDate = String(booking.date || '').trim();
      const rawTime = String(booking.time || '').trim();

      let isoDate = rawDate;

      if (/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)) {
        const [day, month, year] = rawDate.split('.');
        isoDate = `${year}-${month}-${day}`;
      }

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(isoDate) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime)
      ) {
        const error = new Error('Ngày hoặc giờ chiếu không hợp lệ.');
        error.statusCode = 422;
        throw error;
      }

      const showtime = new Date(`${isoDate}T${rawTime}:00+07:00`);

      if (
        Number.isNaN(showtime.getTime()) ||
        showtime.toISOString().slice(0, 10) === ''
      ) {
        const error = new Error('Không xác định được thời gian chiếu.');
        error.statusCode = 422;
        throw error;
      }

      if (showtime.getTime() - Date.now() <= 30 * 60 * 1000) {
        const error = new Error(
          'Chỉ được hủy vé trước giờ chiếu hơn 30 phút.'
        );
        error.statusCode = 409;
        throw error;
      }

      // Chỉ chuyển trạng thái nếu booking vẫn confirmed.
      cancelledBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          userId: decoded.userId,
          status: 'confirmed',
        },
        {
          $set: {
            status: 'cancelled',
            refundStatus: 'Đã hủy và hoàn trả điểm',
          },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!cancelledBooking) {
        const error = new Error(
          'Trạng thái vé đã thay đổi. Vui lòng tải lại.'
        );
        error.statusCode = 409;
        throw error;
      }

      const bUserId = booking.userId;
      const pointsUsed = Number(booking.pointsUsed) || 0;
      const pointsEarned = Number(booking.pointsEarned) || 0;

      // Hoàn điểm đã dùng và thu hồi điểm tích lũy.
// Không cho phép số dư điểm âm; phần chưa thu hồi được ghi thành nợ.
if (pointsUsed > 0 || pointsEarned > 0) {
  if (
    !Number.isSafeInteger(pointsUsed) ||
    !Number.isSafeInteger(pointsEarned) ||
    pointsUsed < 0 ||
    pointsEarned < 0
  ) {
    const error = new Error('Dữ liệu điểm của booking không hợp lệ.');
    error.statusCode = 422;
    throw error;
  }

  const user = await User.findById(bUserId).session(session);

  if (!user) {
    throw new Error('Không tìm thấy tài khoản để hoàn điểm.');
  }

  const currentPoints = Number(user.loyaltyPoints);
  const currentDebt = Number(user.loyaltyPointsDebt ?? 0);

  if (
    !Number.isSafeInteger(currentPoints) ||
    !Number.isSafeInteger(currentDebt) ||
    currentPoints < 0 ||
    currentDebt < 0
  ) {
    throw new Error('Số dư điểm của tài khoản không hợp lệ.');
  }

  // Điểm được hoàn trước hết dùng để thanh toán nợ điểm cũ.
  const debtPaid = Math.min(pointsUsed, currentDebt);
  const pointsRefundedToBalance = pointsUsed - debtPaid;

  const balanceAfterRefund = currentPoints + pointsRefundedToBalance;
  const debtAfterRefund = currentDebt - debtPaid;

  // Thu hồi điểm từng được cộng từ booking đang hủy.
  const pointsReclaimed = Math.min(
    pointsEarned,
    balanceAfterRefund
  );

  const pointsAddedToDebt = pointsEarned - pointsReclaimed;

  const finalPoints = balanceAfterRefund - pointsReclaimed;
  const finalDebt = debtAfterRefund + pointsAddedToDebt;

  if (
    !Number.isSafeInteger(finalPoints) ||
    !Number.isSafeInteger(finalDebt)
  ) {
    throw new Error('Kết quả tính điểm vượt giới hạn an toàn.');
  }

  // Cập nhật điểm và nợ trong cùng transaction.
  // Điều kiện số dư giúp phát hiện thay đổi ngoài dự kiến.
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: bUserId,
      loyaltyPoints: currentPoints,
      loyaltyPointsDebt: currentDebt,
    },
    {
      $set: {
        loyaltyPoints: finalPoints,
        loyaltyPointsDebt: finalDebt,
      },
    },
    {
      new: true,
      runValidators: true,
      session,
    }
  );

  if (!updatedUser) {
    const error = new Error(
      'Số dư điểm đã thay đổi. Vui lòng thử lại.'
    );
    error.statusCode = 409;
    throw error;
  }

  if (pointsUsed > 0) {
    await PointTransaction.create(
      [{
        userId: bUserId,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        type: 'REFUND',
        points: pointsRefundedToBalance,
        balanceAfter: balanceAfterRefund,
        description:
          `Hoàn ${pointsUsed} điểm do hủy vé ${booking.bookingCode}. ` +
          `Bù nợ ${debtPaid} điểm.`,
      }],
      { session }
    );
  }

  if (pointsEarned > 0) {
    await PointTransaction.create(
      [{
        userId: bUserId,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        type: 'REFUND',
        points: -pointsReclaimed,
        balanceAfter: finalPoints,
        description:
          `Thu hồi ${pointsEarned} điểm tích lũy do hủy vé ` +
          `${booking.bookingCode}. ` +
          `Ghi nợ ${pointsAddedToDebt} điểm.`,
      }],
      { session }
    );
  }
}

      // Hoàn lượt sử dụng voucher.
      if (booking.voucherId) {
        const updatedVoucher = await Voucher.findOneAndUpdate(
          {
            _id: booking.voucherId,
            usedCount: { $gt: 0 },
          },
          {
            $inc: { usedCount: -1 },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedVoucher) {
          throw new Error(
            'Không thể hoàn lượt sử dụng voucher.'
          );
        }

        const restoredUserVoucher = await UserVoucher.findOneAndUpdate(
  {
    userId: bUserId,
    voucherId: booking.voucherId,
    orderId: booking.bookingCode,
    status: 'USED',
  },
  {
    $set: {
      status: 'AVAILABLE',
      usedAt: null,
      orderId: null,
    },
  },
  {
    new: true,
    runValidators: true,
    session,
  }
);

if (!restoredUserVoucher) {
  const error = new Error(
    'Không tìm thấy voucher đã sử dụng để hoàn trả.'
  );
  error.statusCode = 409;
  throw error;
}
      }


      // Giải phóng khóa ghế thuộc chính booking này.
      await SeatReservation.deleteMany(
        { bookingId: booking._id },
        { session }
      );
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    });

    // Chỉ cập nhật sơ đồ ghế trong RAM sau khi commit.
    // MongoDB vẫn là nguồn dữ liệu chính.
    try {
      releaseSeats({
        cinemaName: cancelledBooking.cinemaName,
        room: cancelledBooking.room,
        date: cancelledBooking.date,
        time: cancelledBooking.time,
        seats: cancelledBooking.seats,
        initialLayout: INITIAL_SEAT_LAYOUT,
      });
    } catch (error) {
      console.warn('Không thể đồng bộ trạng thái ghế RAM:', error.message);
    }

    return res.json({
      success: true,
      message: 'Hủy vé và xử lý hoàn điểm thành công.',
      data: cancelledBooking,
    });
  } catch (error) {
    console.error('Cancel transaction failed:', error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : 'Không thể hoàn tất hủy vé. Giao dịch đã được rollback.',
    });
    } finally {
    await session.endSession();
  }
}

app.route('/api/bookings/:id/cancel')
  .post(cancelBookingHandler)
  .patch(cancelBookingHandler);


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