require('dotenv').config();
const mongoose = require('mongoose');
const Voucher = require('./models/Voucher');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinenow';

const sampleVouchers = [
  {
    code: 'CINENEW50',
    title: 'Ưu đãi chào bạn mới - Giảm ngay 50.000đ',
    description: 'Áp dụng cho khách hàng mới của CineNow khi đặt vé xem phim lần đầu tiên.',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000,
    maxDiscountAmount: 50000,
    minOrderAmount: 120000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày tới
    totalLimit: 500,
    usageLimitPerUser: 1,
    applicableFormats: ['2D', '3D', 'IMAX'],
  },
  {
    code: 'CINEVIP20',
    title: 'Giảm 20% cho tín đồ điện ảnh',
    description: 'Giảm 20% tổng hóa đơn vé xem phim, mức giảm tối đa lên đến 40.000đ.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountAmount: 40000,
    minOrderAmount: 100000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 ngày tới
    totalLimit: 1000,
    usageLimitPerUser: 2,
    applicableFormats: ['2D', '3D'],
  },
  {
    code: 'POPCORNFREE',
    title: 'Tặng 01 Bắp rang vị Phô mai lớn',
    description: 'Tặng miễn phí 01 phần Bắp vị Phô Mai hảo hạng cho đơn hàng từ 150.000đ.',
    discountType: 'FREE_ITEM',
    discountValue: 0,
    freeItemName: '01 Bắp Rang Phô Mai Lớn',
    minOrderAmount: 150000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    totalLimit: 300,
    usageLimitPerUser: 1,
  },
  {
    code: 'WEDHAPPY',
    title: 'Thứ Tư Vui Vẻ - Giảm trực tiếp 30.000đ',
    description: 'Ưu đãi đồng giá ngày vàng Thứ Tư hàng tuần tại tất cả các cụm rạp CineNow.',
    discountType: 'FIXED_AMOUNT',
    discountValue: 30000,
    minOrderAmount: 80000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    totalLimit: 2000,
    usageLimitPerUser: 5,
    applicableFormats: ['2D'],
  },
  {
    code: 'IMAXVIP',
    title: 'Trải nghiệm đỉnh cao IMAX - Giảm 15%',
    description: 'Giảm 15% tối đa 60.000đ khi thưởng thức các bom tấn điện ảnh phòng chiếu IMAX đỉnh cao.',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    maxDiscountAmount: 60000,
    minOrderAmount: 180000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    totalLimit: 200,
    usageLimitPerUser: 2,
    applicableFormats: ['IMAX'],
  },
];

async function seed() {
  try {
    console.log('Đang kết nối MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Kết nối MongoDB thành công!');

    for (const item of sampleVouchers) {
      await Voucher.findOneAndUpdate(
        { code: item.code },
        { $set: item },
        { upsert: true, new: true }
      );
      console.log(`✓ Đã nạp voucher: ${item.code} - ${item.title}`);
    }

    console.log('\n=== KHỞI TẠO VOUCHER THÀNH CÔNG ===');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi seed voucher:', err);
    process.exit(1);
  }
}

seed();
