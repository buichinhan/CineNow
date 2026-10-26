require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');
const Showtime = require('./models/Showtime');
const Booking = require('./models/Booking');

const {
  INITIAL_MOVIES,
  INITIAL_CINEMAS,
  SHOWTIME_DATES,
  SHOWTIME_CINEMAS,
  INITIAL_SEAT_LAYOUT,
} = require('./seedData');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory runtime store fallback (used if MongoDB is connecting or offline)
let memoryStore = {
  movies: [...INITIAL_MOVIES.map((m, idx) => ({ ...m, _id: `mem_movie_${idx + 1}` }))],
  cinemas: [...INITIAL_CINEMAS.map((c, idx) => ({ ...c, _id: `mem_cinema_${idx + 1}` }))],
  seatLayout: JSON.parse(JSON.stringify(INITIAL_SEAT_LAYOUT)),
  bookings: [],
};

let isMongoConnected = false;

// Auto-seed database when MongoDB connects
async function seedDatabaseIfEmpty() {
  try {
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('Chưa có dữ liệu phim, đang khởi tạo seed data...');
      await Movie.insertMany(INITIAL_MOVIES);
      console.log(`Đã tạo ${INITIAL_MOVIES.length} phim mẫu.`);
    }

    const cinemaCount = await Cinema.countDocuments();
    if (cinemaCount === 0) {
      await Cinema.insertMany(INITIAL_CINEMAS);
      console.log(`Đã tạo ${INITIAL_CINEMAS.length} rạp mẫu.`);
    }
  } catch (err) {
    console.error('Lỗi khi seed data:', err.message);
  }
}

// ---------------------- HEALTH CHECK ----------------------
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CineNow API đang hoạt động',
    database: isMongoConnected ? 'MongoDB Connected' : 'In-Memory Ready',
  });
});

// ---------------------- AUTH ROUTES ----------------------
// ĐĂNG KÝ
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ thông tin.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 8 ký tự.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (isMongoConnected) {
      const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'Email hoặc số điện thoại đã được sử dụng.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: hashedPassword,
      });

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công.',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      });
    } else {
      // In-memory fallback
      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công (Demo).',
        user: {
          id: 'demo_user_1',
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
        },
      });
    }
  } catch (error) {
    console.error('Lỗi đăng ký:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Email hoặc số điện thoại đã được sử dụng.',
      });
    }
    return res.status(500).json({
      message: 'Lỗi máy chủ. Vui lòng thử lại.',
    });
  }
});

// ĐĂNG NHẬP BẰNG EMAIL HOẶC SỐ ĐIỆN THOẠI
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrPhone, email, password } = req.body;
    const identifier = (emailOrPhone || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập tài khoản và mật khẩu.',
      });
    }

    if (isMongoConnected) {
      const isEmail = identifier.includes('@');
      const user = await User.findOne(
        isEmail ? { email: identifier.toLowerCase() } : { phone: identifier }
      );

      if (!user) {
        return res.status(401).json({
          message: 'Tài khoản hoặc mật khẩu không chính xác.',
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({
          message: 'Tài khoản hoặc mật khẩu không chính xác.',
        });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return res.json({
        success: true,
        message: 'Đăng nhập thành công.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        },
      });
    } else {
      // In-memory fallback login
      return res.json({
        success: true,
        message: 'Đăng nhập thành công (Demo).',
        token: 'demo_jwt_token',
        user: {
          id: 'demo_user_1',
          fullName: 'Nguyễn An',
          email: identifier.includes('@') ? identifier : 'nguyenan@cinenow.vn',
          phone: '0901234567',
        },
      });
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({
      message: 'Lỗi máy chủ. Vui lòng thử lại.',
    });
  }
});

// ---------------------- TRANG CHỦ API (HOME API) ----------------------
/**
 * GET /api/home
 * Lấy toàn bộ dữ liệu động cho Trang Chủ:
 * - featuredMovie (Phim nổi bật Hero Banner)
 * - nowShowing (Danh sách Phim đang chiếu)
 * - upcoming (Danh sách Phim sắp chiếu)
 * - nearbyCinemas (Danh sách Rạp gần bạn)
 */
app.get('/api/home', async (req, res) => {
  try {
    let movies = [];
    let cinemas = [];

    if (isMongoConnected) {
      movies = await Movie.find().lean();
      cinemas = await Cinema.find().lean();
    } else {
      movies = memoryStore.movies;
      cinemas = memoryStore.cinemas;
    }

    const featuredMovie =
      movies.find((m) => m.isFeatured || m.status === 'featured') || movies[0];
    const nowShowing = movies.filter((m) => m.status === 'now_showing');
    const upcoming = movies.filter((m) => m.status === 'upcoming');
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

// ---------------------- MOVIES API ----------------------
/**
 * GET /api/movies
 * Lấy danh sách phim có lọc status: ?status=now_showing|upcoming
 */
app.get('/api/movies', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;

    let movies = [];
    if (isMongoConnected) {
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }
      movies = await Movie.find(query).lean();
    } else {
      movies = memoryStore.movies.filter((m) => {
        let match = true;
        if (status && m.status !== status) match = false;
        if (search && !m.title.toLowerCase().includes(search.toLowerCase()))
          match = false;
        return match;
      });
    }

    return res.json({
      success: true,
      data: movies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải danh sách phim.',
    });
  }
});

/**
 * GET /api/movies/:id
 * Lấy chi tiết 1 phim theo ID hoặc slug
 */
app.get('/api/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let movie = null;

    if (isMongoConnected) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        movie = await Movie.findById(id).lean();
      }
      if (!movie) {
        movie = await Movie.findOne({ slug: id }).lean();
      }
    } else {
      movie = memoryStore.movies.find(
        (m) => m._id === id || m.slug === id || m.id === id
      );
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim.',
      });
    }

    return res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải chi tiết phim.',
    });
  }
});

// ---------------------- SHOWTIMES API (CHỌN SUẤT CHIẾU) ----------------------
/**
 * GET /api/showtimes
 * Lấy danh sách ngày chiếu và các rạp kèm khung giờ chiếu cho phim
 * Query: ?movieId=...&date=...
 */
app.get('/api/showtimes', async (req, res) => {
  try {
    const { movieId, date } = req.query;

    return res.json({
      success: true,
      data: {
        dates: SHOWTIME_DATES,
        selectedDate: date || SHOWTIME_DATES[0].id,
        cinemas: SHOWTIME_CINEMAS,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải suất chiếu.',
    });
  }
});

// ---------------------- SEATS API (CHỌN GHẾ) ----------------------
/**
 * GET /api/seats
 * Lấy sơ đồ ghế, trạng thái ghế (ghế thường, VIP, đôi, đã đặt, còn trống)
 * Query: ?movieId=...&cinemaName=...&date=...&time=...
 */
app.get('/api/seats', async (req, res) => {
  try {
    const { movieId, cinemaName, date, time } = req.query;

    return res.json({
      success: true,
      data: {
        room: 'PHÒNG 03',
        seatLayout: memoryStore.seatLayout,
        legend: [
          { type: 'standard', label: 'Thường', color: '#3F3F46', price: 85000 },
          { type: 'vip', label: 'VIP', color: '#EAB308', price: 95000 },
          { type: 'sweetbox', label: 'Ghế đôi', color: '#881337', price: 190000 },
          { type: 'booked', label: 'Đã đặt', color: '#18181B' },
          { type: 'selected', label: 'Đang chọn', color: '#E50914' },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải sơ đồ ghế.',
    });
  }
});

// ---------------------- BOOKINGS API (ĐẶT VÉ) ----------------------
/**
 * POST /api/bookings
 * Đặt vé và cập nhật trạng thái ghế
 */
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
      totalPrice,
    } = req.body;

    if (!seats || !seats.length || !movieTitle) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất 1 ghế.',
      });
    }

    // Cập nhật trạng thái ghế trong layout thành 'booked'
    memoryStore.seatLayout.rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (seats.includes(seat.id)) {
          seat.status = 'booked';
        }
      });
    });

    const bookingCode = `CN-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = {
      id: `booking_${Date.now()}`,
      bookingCode,
      movieTitle,
      cinemaName,
      room: room || 'PHÒNG 03',
      date: date || '16.10.2026',
      time: time || '19:00',
      seats,
      totalPrice,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    memoryStore.bookings.push(newBooking);

    if (isMongoConnected) {
      try {
        await Booking.create(newBooking);
      } catch (e) {
        console.warn('Ghi booking vào Mongo thất bại, đã lưu ram:', e.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt vé thành công!',
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

// ---------------------- SERVER STARTUP ----------------------
const mongoURI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/cinenow';

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 2000,
  })
  .then(async () => {
    isMongoConnected = true;
    console.log('Đã kết nối MongoDB thành công');
    await seedDatabaseIfEmpty();
  })
  .catch((error) => {
    console.warn(
      'Chưa thể kết nối MongoDB:',
      error.message,
      '- Server sẽ chạy chế độ In-Memory API sẵn sàng phục vụ frontend ngay!'
    );
  })
  .finally(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CineNow API đang chạy tại http://0.0.0.0:${PORT}`);
      console.log(`Endpoint Trang chủ: http://localhost:${PORT}/api/home`);
      console.log(`Endpoint Suất chiếu: http://localhost:${PORT}/api/showtimes`);
      console.log(`Endpoint Chọn ghế: http://localhost:${PORT}/api/seats`);
    });
  });
