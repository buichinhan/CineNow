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
    usedCount: 0,
    usageLimitPerUser: 1,
    applicableFormats: ['2D', '3D', 'IMAX'],
    isActive: true,
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
    usedCount: 0,
    usageLimitPerUser: 2,
    applicableFormats: ['2D', '3D'],
    isActive: true,
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
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
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
    usedCount: 0,
    usageLimitPerUser: 5,
    applicableFormats: ['2D'],
    isActive: true,
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
    usedCount: 0,
    usageLimitPerUser: 2,
    applicableFormats: ['IMAX'],
    isActive: true,
  },
  // Voucher kiểm thử các trường hợp ngoại lệ
  {
    code: 'EXPIRED10',
    title: 'Voucher đã hết hạn thử nghiệm',
    description: 'Dùng để kiểm thử hệ thống báo lỗi khi voucher hết hạn.',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 50000,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Đã hết hạn hôm qua
    totalLimit: 100,
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
  },
  {
    code: 'FUTURE10',
    title: 'Voucher chưa đến ngày sử dụng',
    description: 'Dùng để kiểm thử hệ thống báo lỗi khi voucher chưa đến ngày áp dụng.',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 50000,
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 ngày sau mới bắt đầu
    endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    totalLimit: 100,
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
  },
  {
    code: 'SOLDOUT',
    title: 'Voucher hết lượt sử dụng',
    description: 'Dùng để kiểm thử hệ thống báo lỗi khi voucher đã hết số lượt phát hành.',
    discountType: 'FIXED_AMOUNT',
    discountValue: 20000,
    minOrderAmount: 50000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    totalLimit: 10,
    usedCount: 10, // Đã dùng hết 10/10
    usageLimitPerUser: 1,
    isActive: true,
  },
  {
    code: 'MIN500K',
    title: 'Voucher đơn lớn tối thiểu 500.000đ',
    description: 'Dùng để kiểm thử điều kiện giá trị đơn hàng tối thiểu.',
    discountType: 'FIXED_AMOUNT',
    discountValue: 100000,
    minOrderAmount: 500000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    totalLimit: 100,
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
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

if (require.main === module) {
  seed();
}

module.exports = { sampleVouchers, seed };
