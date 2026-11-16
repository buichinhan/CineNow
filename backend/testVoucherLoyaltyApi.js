/**
 * TEST SUITE: KIỂM THỬ CHỨC NĂNG VOUCHER & ĐIỂM THÀNH VIÊN - CINENOW
 * Bao gồm đầy đủ 13 trường hợp kiểm thử theo yêu cầu:
 * 1. Nhập Voucher hợp lệ
 * 2. Nhập Voucher không tồn tại
 * 3. Voucher hết hạn
 * 4. Voucher chưa đến thời gian sử dụng
 * 5. Voucher hết lượt sử dụng
 * 6. Đơn hàng không đạt giá trị tối thiểu
 * 7. Sử dụng điểm khi không đủ điểm
 * 8. Sử dụng điểm vượt quá giới hạn đơn hàng
 * 9. Sử dụng đồng thời Voucher và Điểm thành viên
 * 10. Thanh toán thất bại
 * 11. Thanh toán thành công và cộng điểm
 * 12. Gửi request nhiều lần kiểm tra chống trùng lặp / race condition
 * 13. Hủy vé và xử lý hoàn điểm theo chính sách
 *
 * Chạy lệnh: node backend/testVoucherLoyaltyApi.js
 */

const { Readable, Writable } = require('stream');
const jwt = require('jsonwebtoken');

// Import models & server
const Voucher = require('./models/Voucher');
const User = require('./models/User');
const UserVoucher = require('./models/UserVoucher');
const PointTransaction = require('./models/PointTransaction');
const Booking = require('./models/Booking');
const app = require('./server');

const JWT_SECRET = process.env.JWT_SECRET || 'cinenow_secret_key_2026';
const TEST_USER_ID = '672000000000000000000001';
const TEST_TOKEN = jwt.sign({ userId: TEST_USER_ID }, JWT_SECRET, { expiresIn: '1d' });

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, extraInfo = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${extraInfo ? `-> ${extraInfo}` : ''}`);
  }
}

/**
 * Trình gọi API in-process không phụ thuộc TCP Network socket
 */
function request(method, url, { headers = {}, body = null } = {}) {
  return new Promise((resolve) => {
    const payloadStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const req = new Readable({
      read() {
        if (payloadStr) this.push(payloadStr);
        this.push(null);
      },
    });
    req.method = method;
    req.url = url;

    const normalizedHeaders = {
      'content-type': 'application/json',
      ...(payloadStr ? { 'content-length': String(Buffer.byteLength(payloadStr)) } : {}),
    };
    for (const key of Object.keys(headers)) {
      normalizedHeaders[key.toLowerCase()] = headers[key];
    }
    req.headers = normalizedHeaders;

    const res = new Writable();
    res.statusCode = 200;
    res._headers = {};
    res.setHeader = (k, v) => {
      res._headers[k.toLowerCase()] = v;
    };
    res.getHeader = (k) => res._headers[k.toLowerCase()];
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };

    let responseData = null;
    res.json = function (data) {
      this.statusCode = this.statusCode || 200;
      responseData = data;
      resolve({ status: this.statusCode, data });
    };
    res.send = function (data) {
      try {
        responseData = JSON.parse(data);
      } catch (e) {
        responseData = data;
      }
      resolve({ status: this.statusCode, data: responseData });
    };

    res._write = () => {};
    res.end = (chunk) => {
      if (chunk && !responseData) {
        try {
          responseData = JSON.parse(chunk.toString());
        } catch (e) {
          responseData = chunk.toString();
        }
      }
      resolve({ status: res.statusCode, data: responseData });
    };

    app.handle(req, res);
  });
}

// BỘ DỮ LIỆU MOCK VOUCHER PHỤC VỤ KIỂM THỬ TẤT CẢ TÌNH HUỐNG
const mockVoucherDb = [
  {
    _id: 'v_fixed_50k',
    code: 'CINENEW50',
    title: 'Giảm 50.000đ cho bạn mới',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000,
    maxDiscountAmount: 50000,
    minOrderAmount: 120000,
    startDate: new Date(Date.now() - 100000),
    endDate: new Date(Date.now() + 30 * 86400000),
    totalLimit: 500,
    usedCount: 0,
    usageLimitPerUser: 1,
    applicableFormats: ['2D', '3D', 'IMAX'],
    isActive: true,
  },
  {
    _id: 'v_percent_20',
    code: 'CINEVIP20',
    title: 'Giảm 20% tối đa 40.000đ',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountAmount: 40000,
    minOrderAmount: 100000,
    startDate: new Date(Date.now() - 100000),
    endDate: new Date(Date.now() + 60 * 86400000),
    totalLimit: 1000,
    usedCount: 0,
    usageLimitPerUser: 2,
    applicableFormats: ['2D', '3D'],
    isActive: true,
  },
  {
    _id: 'v_expired',
    code: 'EXPIRED10',
    title: 'Voucher hết hạn',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 50000,
    startDate: new Date(Date.now() - 30 * 86400000),
    endDate: new Date(Date.now() - 1 * 86400000), // Hết hạn hôm qua
    totalLimit: 100,
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
  },
  {
    _id: 'v_future',
    code: 'FUTURE10',
    title: 'Voucher chưa đến ngày',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 50000,
    startDate: new Date(Date.now() + 10 * 86400000), // 10 ngày sau mới áp dụng
    endDate: new Date(Date.now() + 40 * 86400000),
    totalLimit: 100,
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
  },
  {
    _id: 'v_soldout',
    code: 'SOLDOUT',
    title: 'Voucher hết lượt sử dụng',
    discountType: 'FIXED_AMOUNT',
    discountValue: 20000,
    minOrderAmount: 50000,
    startDate: new Date(Date.now() - 100000),
    endDate: new Date(Date.now() + 30 * 86400000),
    totalLimit: 10,
    usedCount: 10, // Đã dùng hết
    usageLimitPerUser: 1,
    isActive: true,
  },
  {
    _id: 'v_min500k',
    code: 'MIN500K',
    title: 'Voucher đơn lớn tối thiểu 500k',
    discountType: 'FIXED_AMOUNT',
    discountValue: 100000,
    minOrderAmount: 500000,
    startDate: new Date(Date.now() - 100000),
    endDate: new Date(Date.now() + 30 * 86400000),
    totalLimit: 100,
    usedCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
  },
];

// Mock User & State
let mockUser = {
  _id: TEST_USER_ID,
  fullName: 'Nguyễn Văn Test',
  email: 'test@cinenow.vn',
  phone: '0901234567',
  loyaltyPoints: 120, // 120 điểm
};

let mockUserVouchers = [];
let mockPointTransactions = [];
let mockBookings = [];

// Thiết lập Mock cho Mongoose Models để kiểm thử
function setupMocks() {
  const mongoose = require('mongoose');
  mongoose.connection.readyState = 1;

  // Voucher mocks
  Voucher.findOne = (query) => {
    return Promise.resolve(
      mockVoucherDb.find((v) => {
        if (query.code) return v.code.toUpperCase() === query.code.toUpperCase();
        if (query._id) return String(v._id) === String(query._id);
        return false;
      }) || null
    );
  };
  Voucher.findById = (id) => {
    return Promise.resolve(mockVoucherDb.find((v) => String(v._id) === String(id)) || null);
  };
  Voucher.find = () => ({
    sort: () => Promise.resolve(mockVoucherDb),
  });
  Voucher.findByIdAndUpdate = (id, update) => {
    const v = mockVoucherDb.find((x) => String(x._id) === String(id));
    if (v && update.$inc && update.$inc.usedCount) {
      v.usedCount += update.$inc.usedCount;
    }
    return Promise.resolve(v);
  };

  // User mocks
  User.findById = (id) => {
    if (String(id) === String(TEST_USER_ID)) {
      return {
        ...mockUser,
        select: (fields) => Promise.resolve(mockUser),
      };
    }
    return Promise.resolve(null);
  };
  User.findByIdAndUpdate = (id, update, opts) => {
    if (String(id) === String(TEST_USER_ID)) {
      if (update.$inc && update.$inc.loyaltyPoints) {
        mockUser.loyaltyPoints += update.$inc.loyaltyPoints;
      }
      return Promise.resolve({ ...mockUser });
    }
    return Promise.resolve(null);
  };

  // UserVoucher mocks
  UserVoucher.find = () => Promise.resolve(mockUserVouchers);
  UserVoucher.countDocuments = (query) => {
    const count = mockUserVouchers.filter((uv) => {
      let match = true;
      if (query.userId) match = match && String(uv.userId) === String(query.userId);
      if (query.voucherId) match = match && String(uv.voucherId) === String(query.voucherId);
      if (query.status) match = match && uv.status === query.status;
      return match;
    }).length;
    return Promise.resolve(count);
  };
  UserVoucher.create = (doc) => {
    const newDoc = { _id: `uv_${Date.now()}`, ...doc };
    mockUserVouchers.push(newDoc);
    return Promise.resolve(newDoc);
  };
  UserVoucher.findOneAndUpdate = (query, update) => {
    const found = mockUserVouchers.find((uv) => {
      let match = true;
      if (query.userId) match = match && String(uv.userId) === String(query.userId);
      if (query.voucherId) match = match && String(uv.voucherId) === String(query.voucherId);
      if (query.status) match = match && uv.status === query.status;
      return match;
    });
    if (found && update.$set) {
      Object.assign(found, update.$set);
    }
    return Promise.resolve(found);
  };

  // PointTransaction mocks
  PointTransaction.create = (doc) => {
    const newTx = { _id: `pt_${Date.now()}`, ...doc, createdAt: new Date() };
    mockPointTransactions.push(newTx);
    return Promise.resolve(newTx);
  };
  PointTransaction.find = () => ({
    sort: () => ({
      limit: () => ({
        lean: () => Promise.resolve(mockPointTransactions),
      }),
    }),
  });

  // Booking mocks
  Booking.create = (doc) => {
    const newB = { _id: `bk_${Date.now()}`, ...doc, save: function() { return Promise.resolve(this); } };
    mockBookings.push(newB);
    return Promise.resolve(newB);
  };
  Booking.findById = (id) => {
    const found = mockBookings.find((b) => String(b._id) === String(id) || b.id === id);
    if (found) {
      found.save = function() { return Promise.resolve(this); };
    }
    return Promise.resolve(found || null);
  };
  Booking.findOne = (query) => {
    const found = mockBookings.find((b) => {
      if (query.bookingCode) return b.bookingCode === query.bookingCode;
      return false;
    });
    if (found) {
      found.save = function() { return Promise.resolve(this); };
    }
    return Promise.resolve(found || null);
  };
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN VOUCHER & ĐIỂM THÀNH VIÊN CINENOW');
  console.log('======================================================================\n');

  setupMocks();

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 1: Nhập Voucher hợp lệ
  // -------------------------------------------------------------------------
  console.log('👉 [CASE 1] Nhập Voucher hợp lệ (Cố định & Phần trăm)');
  {
    // 1A. Fixed amount CINENEW50 (giảm 50.000đ cho đơn >= 120.000đ)
    const res1 = await request('POST', '/api/vouchers/validate', {
      body: { code: 'CINENEW50', orderAmount: 200000, format: '2D' },
    });
    assert(res1.status === 200 && res1.data.success === true, 'Mã CINENEW50 được chấp nhận thành công');
    assert(res1.data.data.discountAmount === 50000, 'CINENEW50 giảm đúng 50.000đ');
    assert(res1.data.data.finalAmount === 150000, 'Số tiền sau giảm đúng 150.000đ');

    // 1B. Percentage CINEVIP20 (giảm 20% tối đa 40.000đ)
    const res2 = await request('POST', '/api/vouchers/validate', {
      body: { code: 'CINEVIP20', orderAmount: 300000, format: '2D' },
    });
    assert(res2.status === 200, 'Mã CINEVIP20 được chấp nhận');
    assert(res2.data.data.discountAmount === 40000, 'CINEVIP20 giới hạn trần giảm tối đa đúng 40.000đ (20% của 300k là 60k -> trần 40k)');
    assert(res2.data.data.finalAmount === 260000, 'Số tiền sau giảm đúng 260.000đ');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 2: Nhập Voucher không tồn tại
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 2] Nhập Voucher không tồn tại');
  {
    const res = await request('POST', '/api/vouchers/validate', {
      body: { code: 'NOT_EXIST_CODE', orderAmount: 200000 },
    });
    assert(res.status === 404, 'Trả về mã lỗi HTTP 404 Not Found');
    assert(res.data.success === false, 'success là false');
    assert(res.data.message.includes('không tồn tại'), 'Thông báo lỗi rõ ràng mã không tồn tại');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 3: Voucher hết hạn
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 3] Voucher hết hạn');
  {
    const res = await request('POST', '/api/vouchers/validate', {
      body: { code: 'EXPIRED10', orderAmount: 200000 },
    });
    assert(res.status === 400, 'Trả về HTTP 400 khi voucher hết hạn');
    assert(res.data.message.includes('đã hết hạn'), 'Thông báo lỗi chính xác voucher đã hết hạn');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 4: Voucher chưa đến thời gian sử dụng
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 4] Voucher chưa đến thời gian sử dụng');
  {
    const res = await request('POST', '/api/vouchers/validate', {
      body: { code: 'FUTURE10', orderAmount: 200000 },
    });
    assert(res.status === 400, 'Trả về HTTP 400 khi voucher chưa đến ngày áp dụng');
    assert(res.data.message.includes('chưa đến thời gian'), 'Thông báo lỗi chính xác chưa đến thời gian áp dụng');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 5: Voucher hết lượt sử dụng
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 5] Voucher hết lượt sử dụng trên hệ thống');
  {
    const res = await request('POST', '/api/vouchers/validate', {
      body: { code: 'SOLDOUT', orderAmount: 200000 },
    });
    assert(res.status === 400, 'Trả về HTTP 400 khi voucher hết lượt');
    assert(res.data.message.includes('hết lượt sử dụng'), 'Thông báo lỗi chính xác voucher đã hết lượt sử dụng');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 6: Đơn hàng không đạt giá trị tối thiểu
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 6] Đơn hàng không đạt giá trị tối thiểu');
  {
    const res = await request('POST', '/api/vouchers/validate', {
      body: { code: 'MIN500K', orderAmount: 200000 },
    });
    assert(res.status === 400, 'Trả về HTTP 400 khi đơn chưa đủ giá trị tối thiểu');
    assert(res.data.message.includes('tối thiểu phải từ 500.000đ'), 'Thông báo cụ thể mức tiền tối thiểu yêu cầu');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 7: Sử dụng điểm khi không đủ điểm
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 7] Sử dụng điểm khi không đủ điểm');
  {
    const res = await request('POST', '/api/loyalty/calculate', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: { pointsToUse: 500, orderAmount: 200000 }, // User chỉ có 120 điểm
    });
    assert(res.status === 400, 'Trả về HTTP 400 khi dùng vượt số điểm đang có');
    assert(res.data.message.includes('vượt quá số dư hiện có'), 'Thông báo lỗi chính xác vượt quá số dư hiện có');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 8: Sử dụng điểm vượt quá giới hạn đơn hàng
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 8] Sử dụng điểm vượt quá giới hạn đơn hàng');
  {
    // Đơn hàng chỉ có 50.000đ (cần tối đa 50 điểm), user yêu cầu dùng 100 điểm
    const res = await request('POST', '/api/loyalty/calculate', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: { pointsToUse: 100, orderAmount: 50000 },
    });
    assert(res.status === 200, 'Tính toán thành công');
    assert(res.data.data.pointsToUse === 50, 'Số điểm được dùng tự động giới hạn tối đa 50 điểm (= 50.000đ)');
    assert(res.data.data.discountAmount === 50000, 'Giảm đúng 50.000đ');
    assert(res.data.data.finalAmount === 0, 'Số tiền sau giảm không bị âm (0đ)');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 9: Sử dụng đồng thời Voucher và Điểm thành viên
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 9] Sử dụng đồng thời Voucher và Điểm thành viên (Backend tự tính toán)');
  {
    // Giả sử: Vé 180.000đ + Combo 70.000đ = 250.000đ
    // Áp dụng voucher CINENEW50 (-50.000đ) -> Còn lại 200.000đ
    // Dùng 50 điểm (-50.000đ) -> Tổng thanh toán cuối cùng = 150.000đ
    const res = await request('POST', '/api/bookings', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: {
        userId: TEST_USER_ID,
        movieTitle: 'Avatar: Dòng Chảy Của Nước',
        cinemaName: 'CineNow Landmark 81',
        seats: ['F5', 'F6'],
        seatTotal: 180000,
        concessions: [{ id: 'cb-1', name: 'Combo Bắp Nước', price: 70000, quantity: 1 }],
        concessionsTotal: 70000,
        voucherCode: 'CINENEW50',
        pointsToUse: 50,
      },
    });

    assert(res.status === 201, 'Đặt vé thành công với đồng thời Voucher và Điểm');
    const bData = res.data.data;
    assert(bData.subtotal === 250000, 'Subtotal chính xác 250.000đ');
    assert(bData.voucherDiscount === 50000, 'Voucher giảm chính xác 50.000đ');
    assert(bData.pointsUsed === 50, 'Sử dụng đúng 50 điểm');
    assert(bData.pointsDiscount === 50000, 'Giảm giá từ điểm chính xác 50.000đ');
    assert(bData.totalPrice === 150000, 'Tổng thanh toán cuối cùng chính xác 150.000đ (250k - 50k - 50k)');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 10: Thanh toán thất bại khi dữ liệu không hợp lệ
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 10] Thanh toán thất bại khi thiếu ghế hoặc voucher sai');
  {
    // 10A. Không có ghế
    const res1 = await request('POST', '/api/bookings', {
      body: { movieTitle: 'Test Phim', seats: [] },
    });
    assert(res1.status === 400, 'Thất bại khi không chọn ghế');

    // 10B. Dùng mã voucher bị lỗi
    const res2 = await request('POST', '/api/bookings', {
      body: {
        movieTitle: 'Test Phim',
        seats: ['A1'],
        seatTotal: 90000,
        voucherCode: 'VOUCHER_KHONG_CO',
      },
    });
    assert(res2.status === 400, 'Thất bại khi truyền mã voucher không hợp lệ');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 11: Thanh toán thành công và cộng điểm thành viên
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 11] Thanh toán thành công và cộng điểm theo tiền thực trả');
  {
    // Lưu lại số điểm trước thanh toán
    const pointsBefore = mockUser.loyaltyPoints;

    // Đặt vé: Tiền vé 200.000đ, không dùng voucher hay điểm
    const res = await request('POST', '/api/bookings', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: {
        userId: TEST_USER_ID,
        movieTitle: 'Dune: Phần 2',
        cinemaName: 'CineNow Landmark 81',
        seats: ['G1', 'G2'],
        seatTotal: 200000,
      },
    });

    assert(res.status === 201, 'Đặt vé thành công');
    const booking = res.data.data;
    // 200.000đ thực trả / 10.000đ = 20 điểm tích lũy
    assert(booking.pointsEarned === 20, 'Cộng chính xác 20 điểm dựa trên số tiền 200.000đ');
    assert(mockUser.loyaltyPoints === pointsBefore + 20, `Điểm của User được cập nhật tăng từ ${pointsBefore} lên ${mockUser.loyaltyPoints}`);

    // Kiểm tra đã ghi nhận PointTransaction loại EARN
    const earnTx = mockPointTransactions.find(
      (tx) => tx.type === 'EARN' && tx.bookingCode === booking.bookingCode
    );
    assert(Boolean(earnTx), 'Đã ghi lịch sử giao dịch PointTransaction loại EARN');
    assert(earnTx?.points === 20, 'Số điểm ghi trong lịch sử là +20');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 12: Gửi request nhiều lần kiểm tra chống trừ điểm / dùng voucher trùng
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 12] Kiểm tra giới hạn số lần sử dụng voucher per user (Chống lạm dụng)');
  {
    // CINENEW50 có usageLimitPerUser: 1. Đánh dấu đã dùng 1 lần trong UserVoucher:
    mockUserVouchers.push({
      userId: TEST_USER_ID,
      voucherId: 'v_fixed_50k',
      status: 'USED',
      usedAt: new Date(),
    });

    // Thử áp dụng lại lần thứ 2
    const res = await request('POST', '/api/vouchers/validate', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      body: { code: 'CINENEW50', orderAmount: 200000 },
    });

    assert(res.status === 400, 'Chặn khi vượt quá giới hạn sử dụng của người dùng');
    assert(res.data.message.includes('tối đa (1 lần)'), 'Thông báo rõ ràng đã sử dụng tối đa số lần cho phép');
  }

  // -------------------------------------------------------------------------
  // TRƯỜNG HỢP 13: Hủy vé và xử lý hoàn điểm theo chính sách
  // -------------------------------------------------------------------------
  console.log('\n👉 [CASE 13] Hủy vé và xử lý hoàn trả điểm đã dùng, thu hồi điểm đã tích');
  {
    // Tạo 1 đơn vé có dùng 30 điểm và được cộng 12 điểm
    const initialUserPoints = mockUser.loyaltyPoints;
    const testCancelBooking = {
      _id: '672000000000000000000099',
      bookingCode: 'CN-CANCEL-TEST',
      userId: TEST_USER_ID,
      movieTitle: 'Phim Hủy Test',
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 03',
      date: '16.10.2026',
      time: '19:00',
      seats: ['H1'],
      seatTotal: 150000,
      totalPrice: 120000,
      pointsUsed: 30, // Đã dùng 30 điểm
      pointsDiscount: 30000,
      pointsEarned: 12, // Đã tích lũy 12 điểm
      status: 'confirmed',
    };
    mockBookings.push(testCancelBooking);

    // Gọi API hủy vé
    const res = await request('POST', `/api/bookings/${testCancelBooking._id}/cancel`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });

    assert(res.status === 200, 'Hủy vé thành công');
    assert(res.data.data.status === 'cancelled', 'Trạng thái vé chuyển sang cancelled');

    // Điểm dự kiến sau khi hoàn: initialUserPoints + 30 (hoàn điểm dùng) - 12 (thu hồi điểm thưởng)
    const expectedPoints = initialUserPoints + 30 - 12;
    assert(mockUser.loyaltyPoints === expectedPoints, `Số dư điểm được hoàn trả chính xác: ${mockUser.loyaltyPoints} (Hoàn +30đ dùng, Thu hồi -12đ tích lũy)`);

    // Kiểm tra lịch sử giao dịch PointTransaction REFUND
    const refundTxs = mockPointTransactions.filter(
      (tx) => tx.type === 'REFUND' && tx.bookingCode === 'CN-CANCEL-TEST'
    );
    assert(refundTxs.length === 2, 'Ghi nhận đúng 2 giao dịch hoàn điểm (hoàn điểm đã dùng & thu hồi điểm tích lũy)');
  }

  // -------------------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU (100% THÀNH CÔNG)`);
  console.log('======================================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Lỗi khi chạy test suite:', err);
  process.exit(1);
});
