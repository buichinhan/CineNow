const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ĐĂNG KÝ
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
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
        success: false,
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
        loyaltyPoints: user.loyaltyPoints,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ. Vui lòng thử lại.',
    });
  }
});

// ĐĂNG NHẬP
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, email, password } = req.body;
    const identifier = (emailOrPhone || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tài khoản và mật khẩu.',
      });
    }

   const user = await User.findOne(
  identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier }
).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản hoặc mật khẩu không chính xác.',
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET chưa được cấu hình.');
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
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
        loyaltyPoints: user.loyaltyPoints,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ. Vui lòng thử lại.',
    });
  }
});

module.exports = router;