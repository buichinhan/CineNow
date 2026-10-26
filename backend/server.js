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

const movieRoutes = require('./routes/movieRoutes');
const { seedMovies } = require('./seedMovies');

const {
  INITIAL_MOVIES,
  INITIAL_CINEMAS,
  SHOWTIME_DATES,
  SHOWTIME_CINEMAS,
  INITIAL_SEAT_LAYOUT,
} = require('./seedData');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/cinenow';
const JWT_SECRET = process.env.JWT_SECRET || 'cinenow_secret_key_2026';

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
      if (typeof seedMovies === 'function') {
        await seedMovies();
      }
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

// ---------------------- ROUTES ----------------------
app.use('/api/movies', movieRoutes);

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
        JWT_SECRET,
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
    const nowShowing = movies.filter(
      (m) => m.status === 'now_showing' || m.status === 'NOW_SHOWING'
    );
    const upcoming = movies.filter(
      (m) => m.status === 'upcoming' || m.status === 'COMING_SOON'
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

// ---------------------- SHOWTIMES API ----------------------
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

// ---------------------- SEATS API ----------------------
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

// ---------------------- BOOKINGS API ----------------------
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
        console.warn('Ghi booking vào Mongo thất bại:', e.message);
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
mongoose
  .connect(MONGODB_URI, {
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
    });
  });
