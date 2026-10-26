require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Movie = require('./models/Movie');
const movieRoutes = require('./routes/movieRoutes');
const { seedMovies } = require('./seedMovies');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinenow';
const JWT_SECRET = process.env.JWT_SECRET || 'cinenow_secret_key_2026';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/movies', movieRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CineNow API đang hoạt động',
  });
});

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

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
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

    const isEmail = identifier.includes('@');

    const user = await User.findOne(
      isEmail
        ? { email: identifier.toLowerCase() }
        : { phone: identifier }
    );

    if (!user) {
      return res.status(401).json({
        message: 'Tài khoản hoặc mật khẩu không chính xác.',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

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
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);

    return res.status(500).json({
      message: 'Lỗi máy chủ. Vui lòng thử lại.',
    });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Đã kết nối MongoDB');

    // Tự động kiểm tra và khởi tạo dữ liệu phim mẫu nếu trống
    try {
      const movieCount = await Movie.countDocuments();
      if (movieCount === 0) {
        console.log('Chưa có phim trong CSDL, đang khởi tạo dữ liệu mẫu...');
        await seedMovies();
      }
    } catch (err) {
      console.warn('Lưu ý kiểm tra dữ liệu phim:', err.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CineNow API đang chạy tại cổng ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Không thể kết nối MongoDB:', error.message);
  });
