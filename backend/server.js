require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');
const Booking = require('./models/Booking');
const jwt = require('jsonwebtoken');
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/auth');
const showtimeRoutes = require('./routes/showtimeRoutes');

const {
  INITIAL_MOVIES,
  INITIAL_CINEMAS,
  INITIAL_SEAT_LAYOUT,
  INITIAL_CONCESSIONS,
} = require('./seedData');

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

// ====================== SEATS API ======================

app.get('/api/seats', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        room: 'PHÒNG 03',
        seatLayout: memoryStore.seatLayout,

        legend: [
          {
            type: 'standard',
            label: 'Thường',
            color: '#3F3F46',
            price: 85000,
          },
          {
            type: 'vip',
            label: 'VIP',
            color: '#EAB308',
            price: 95000,
          },
          {
            type: 'sweetbox',
            label: 'Ghế đôi',
            color: '#881337',
            price: 190000,
          },
          {
            type: 'booked',
            label: 'Đã đặt',
            color: '#18181B',
          },
          {
            type: 'selected',
            label: 'Đang chọn',
            color: '#E50914',
          },
        ],
      },
    });
  } catch (error) {
    console.error('Lỗi /api/seats:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Lỗi tải sơ đồ ghế.',
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
      cinemaName,
      room,
      date,
      time,
      seats,
      seatTotal,
      concessions = [],
      concessionsTotal,
      totalPrice,
    } = req.body;

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

    const bookingCode =
      `CN-${Math.floor(100000 + Math.random() * 900000)}`;

    const calcConcessionsTotal = Array.isArray(concessions)
      ? concessions.reduce(
          (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
          0
        )
      : 0;

    const finalConcessionsTotal =
      concessionsTotal !== undefined ? Number(concessionsTotal) : calcConcessionsTotal;
    const finalSeatTotal =
      seatTotal !== undefined ? Number(seatTotal) : (Number(totalPrice) || 0) - finalConcessionsTotal;
    const finalTotalPrice =
      totalPrice !== undefined
        ? Number(totalPrice)
        : finalSeatTotal + finalConcessionsTotal;

    const newBooking = {
      id: `booking_${Date.now()}`,
      bookingCode,
      userId,
      movieTitle,
      cinemaName,
      room: room || 'PHÒNG 03',
      date: date || '16.10.2026',
      time: time || '19:00',
      seats,
      seatTotal: Math.max(0, finalSeatTotal),
      concessions: Array.isArray(concessions) ? concessions : [],
      concessionsTotal: finalConcessionsTotal,
      totalPrice: finalTotalPrice,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    if (mongoose.connection.readyState === 1) {
      // Chỉ trả thành công khi lưu được đơn vào MongoDB.
      const savedBooking = await Booking.create(newBooking);

      return res.status(201).json({
        success: true,
        message: 'Đặt vé thành công!',
        data: savedBooking,
      });
    }

    // Chế độ dự phòng phục vụ demo khi MongoDB chưa kết nối.
    memoryStore.bookings.push(newBooking);

    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công (Demo)!',
      data: newBooking,
    });
  } catch (error) {
    console.error('Lỗi đặt vé:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Không thể tạo đơn đặt vé.',
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