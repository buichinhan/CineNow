/**
 * TEST SEAT HOLD: KIỂM THỬ CHỨC NĂNG GIỮ GHẾ TẠM THỜI & KIỂM SOÁT ĐỒNG THỜI
 * Chạy lệnh: node backend/testSeatHold.js
 */

const http = require('http');
const app = require('./server');
const {
  DEFAULT_HOLD_DURATION_SECONDS,
  getScreeningKey,
  cleanupExpiredHolds,
  holdSeats,
  releaseSeats,
  confirmBookedSeats,
  getSeatsWithHoldStatus,
  resetAllHolds,
} = require('./services/seatHoldService');
const { INITIAL_SEAT_LAYOUT } = require('./seedData');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

async function startTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: GIỮ GHẾ TẠM THỜI & KIỂM SOÁT ĐỒNG THỜI');
  console.log('===========================================================\n');

  resetAllHolds();

  const screeningParams = {
    cinemaName: 'CineNow Landmark 81',
    room: 'PHÒNG 03',
    date: '16.10.2026',
    time: '19:00',
  };

  // NHÓM 1: CƠ CHẾ GIỮ GHẾ TẠM THỜI (SEAT HOLD)
  console.log('👉 NHÓM 1: Cơ chế Giữ ghế tạm thời (Seat Hold)');
  {
    // Khách A giữ ghế A1, A2
    const resA = holdSeats({
      ...screeningParams,
      seats: ['A1', 'A2'],
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    assert(resA.success === true, 'Khách A giữ ghế A1, A2 thành công');
    assert(Boolean(resA.data.holdToken), `Được cấp mã giữ ghế holdToken: ${resA.data.holdToken}`);
    assert(resA.data.expiresInSeconds === DEFAULT_HOLD_DURATION_SECONDS, 'Thời gian giữ mặc định 300 giây (5 phút)');
    assert(resA.data.remainingSeconds > 290, 'Thời gian còn lại được tính chính xác');

    // Kiểm tra trạng thái sơ đồ ghế của phòng chiếu
    const statusData = getSeatsWithHoldStatus({
      ...screeningParams,
      holdToken: resA.data.holdToken,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    const rowA = statusData.seatLayout.rows.find((r) => r.row === 'A');
    const seatA1 = rowA.seats.find((s) => s.id === 'A1');
    const seatA2 = rowA.seats.find((s) => s.id === 'A2');
    const seatA3 = rowA.seats.find((s) => s.id === 'A3');

    assert(seatA1.status === 'holding', 'Ghế A1 chuyển sang trạng thái "holding"');
    assert(seatA2.status === 'holding', 'Ghế A2 chuyển sang trạng thái "holding"');
    assert(seatA1.isMine === true, 'Ghế A1 thuộc sở hữu của Khách A (isMine = true)');
    assert(seatA3.status === 'available', 'Ghế A3 vẫn còn trống (available)');
  }

  // NHÓM 2: KIỂM SOÁT ĐỒNG THỜI (CONCURRENCY CONTROL)
  console.log('\n👉 NHÓM 2: Kiểm soát đồng thời - Ngăn chặn 2 người cùng chọn 1 ghế');
  {
    // Lấy holdToken của khách A từ lượt trước
    const statusBefore = getSeatsWithHoldStatus({
      ...screeningParams,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const rowA = statusBefore.seatLayout.rows.find((r) => r.row === 'A');
    const seatA1 = rowA.seats.find((s) => s.id === 'A1');
    assert(seatA1.isMine === false, 'Người xem khác thấy ghế A1 không phải của mình (isMine = false)');

    // Khách B cố tình giữ ghế A1 (đang bị khách A giữ)
    const resB_conflict = holdSeats({
      ...screeningParams,
      seats: ['A1', 'A3'],
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    assert(resB_conflict.success === false, 'Từ chối khách B chọn ghế A1');
    assert(resB_conflict.code === 'SEAT_ALREADY_HELD', 'Mã lỗi chuẩn: SEAT_ALREADY_HELD');
    assert(resB_conflict.conflictingSeats.includes('A1'), 'Báo chính xác ghế xung đột là A1');

    // Khách B chọn ghế khác (A3, A4) không bị ai giữ -> THÀNH CÔNG
    const resB_ok = holdSeats({
      ...screeningParams,
      seats: ['A3', 'A4'],
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    assert(resB_ok.success === true, 'Khách B chọn ghế A3, A4 trống thành công');
    assert(resB_ok.data.holdToken !== undefined, 'Khách B nhận holdToken riêng biệt');
  }

  // NHÓM 3: KHÁCH CẬP NHẬT HOẶC GIẢI PHÓNG GHẾ (UPDATE & RELEASE)
  console.log('\n👉 NHÓM 3: Cập nhật ghế đang giữ & Giải phóng ghế (Release)');
  {
    // Khách C giữ C1, C2
    const resC = holdSeats({
      ...screeningParams,
      seats: ['C1', 'C2'],
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const tokenC = resC.data.holdToken;

    // Khách C đổi ý, bỏ C2 và thêm C3 (dùng lại cùng tokenC)
    const resC_update = holdSeats({
      ...screeningParams,
      seats: ['C1', 'C3'],
      holdToken: tokenC,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    assert(resC_update.success === true, 'Khách C cập nhật ghế thành công');

    const statusC = getSeatsWithHoldStatus({
      ...screeningParams,
      holdToken: tokenC,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const rowC = statusC.seatLayout.rows.find((r) => r.row === 'C');
    const seatC2 = rowC.seats.find((s) => s.id === 'C2');
    const seatC3 = rowC.seats.find((s) => s.id === 'C3');

    assert(seatC2.status === 'available', 'Ghế C2 đã tự động được hoàn trả về "available"');
    assert(seatC3.status === 'holding', 'Ghế C3 được chuyển sang "holding"');

    // Khách C chủ động bấm giải phóng ghế C1
    const releaseRes = releaseSeats({
      ...screeningParams,
      seats: ['C1'],
      holdToken: tokenC,
    });
    assert(releaseRes.success === true, 'Khách C giải phóng C1 thành công');

    const statusAfterRelease = getSeatsWithHoldStatus({
      ...screeningParams,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const seatC1After = statusAfterRelease.seatLayout.rows
      .find((r) => r.row === 'C')
      .seats.find((s) => s.id === 'C1');
    assert(seatC1After.status === 'available', 'Ghế C1 đã khả dụng trở lại');
  }

  // NHÓM 4: TỰ ĐỘNG GIẢI PHÓNG KHI HẾT THỜI GIAN (AUTO-RELEASE EXPIRED)
  console.log('\n👉 NHÓM 4: Tự động giải phóng ghế khi hết hạn giữ (TTL Expired)');
  {
    // Giữ ghế D1 với thời gian hết hạn trong 1 giây
    const resD = holdSeats({
      ...screeningParams,
      seats: ['D1'],
      durationSeconds: 1, // 1 giây
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    assert(resD.success === true, 'Giữ ghế D1 với thời hạn 1 giây');

    // Đợi 1.2 giây để ghế hết hạn
    await new Promise((r) => setTimeout(r, 1200));

    // Gọi dọn dẹp hoặc query sơ đồ ghế
    const releasedCount = cleanupExpiredHolds();
    assert(releasedCount >= 1, `Hệ thống tự động quét và giải phóng ${releasedCount} ghế hết hạn`);

    // Kiểm tra ghế D1 đã trở lại available
    const statusD = getSeatsWithHoldStatus({
      ...screeningParams,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const seatD1 = statusD.seatLayout.rows
      .find((r) => r.row === 'D')
      .seats.find((s) => s.id === 'D1');
    assert(seatD1.status === 'available', 'Ghế D1 đã tự động hoàn trả về "available"');
  }

  // NHÓM 5: TỪ GIỮ GHẾ ĐẾN THANH TOÁN THÀNH CÔNG (CONFIRM BOOKING)
  console.log('\n👉 NHÓM 5: Chuyển đổi từ Giữ ghế sang Đã đặt (Confirm Booked)');
  {
    const resE = holdSeats({
      ...screeningParams,
      seats: ['E1', 'E2'],
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const tokenE = resE.data.holdToken;

    // Xác nhận đã đặt vé
    confirmBookedSeats({
      ...screeningParams,
      seats: ['E1', 'E2'],
      holdToken: tokenE,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });

    const statusE = getSeatsWithHoldStatus({
      ...screeningParams,
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    const seatE1 = statusE.seatLayout.rows
      .find((r) => r.row === 'E')
      .seats.find((s) => s.id === 'E1');
    const seatE2 = statusE.seatLayout.rows
      .find((r) => r.row === 'E')
      .seats.find((s) => s.id === 'E2');

    assert(seatE1.status === 'booked', 'Ghế E1 chuyển thành "booked" vĩnh viễn');
    assert(seatE2.status === 'booked', 'Ghế E2 chuyển thành "booked" vĩnh viễn');

    // Thử giữ lại ghế E1 đã booked -> Phải bị từ chối
    const retryHold = holdSeats({
      ...screeningParams,
      seats: ['E1'],
      initialLayout: INITIAL_SEAT_LAYOUT,
    });
    assert(retryHold.success === false, 'Từ chối giữ ghế đã booked');
    assert(retryHold.code === 'SEAT_ALREADY_BOOKED', 'Mã lỗi chuẩn: SEAT_ALREADY_BOOKED');
  }

  // NHÓM 6: KIỂM THỬ TÍCH HỢP HTTP API (/api/seats/hold, /api/seats/release, /api/bookings)
  console.log('\n👉 NHÓM 6: Kiểm thử Tích hợp HTTP REST APIs');
  const { server, port } = await startTestServer();
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Giữ ghế qua HTTP POST /api/seats/hold
    const holdRes = await fetch(`${baseUrl}/seats/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...screeningParams,
        seats: ['F1-2'],
        durationSeconds: 300,
      }),
    });
    const holdJson = await holdRes.json();
    assert(holdRes.status === 200, 'HTTP POST /api/seats/hold trả về 200 OK');
    assert(holdJson.success === true, 'Giữ ghế đôi F1-2 thành công');
    const apiHoldToken = holdJson.data.holdToken;

    // 2. Người khác cố giữ F1-2 qua HTTP -> Nhận 409 Conflict
    const conflictRes = await fetch(`${baseUrl}/seats/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...screeningParams,
        seats: ['F1-2'],
      }),
    });
    const conflictJson = await conflictRes.json();
    assert(conflictRes.status === 409, 'HTTP POST /api/seats/hold trùng ghế trả về 409 Conflict');
    assert(conflictJson.code === 'SEAT_ALREADY_HELD', 'Code lỗi SEAT_ALREADY_HELD');

    // 3. Đặt vé hoàn tất kèm holdToken
    const bookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        movieTitle: 'Hành Tinh Đỏ',
        ...screeningParams,
        seats: ['F1-2'],
        seatTotal: 190000,
        totalPrice: 190000,
        holdToken: apiHoldToken,
      }),
    });
    const bookingJson = await bookingRes.json();
    assert(bookingRes.status === 201, 'HTTP POST /api/bookings trả về 201 Created');
    assert(bookingJson.success === true, 'Đặt vé thành công từ ghế đang giữ');

    // 4. Kiểm tra lại GET /api/seats: ghế F1-2 giờ đã là 'booked'
    const seatsRes = await fetch(
      `${baseUrl}/seats?cinemaName=${encodeURIComponent(screeningParams.cinemaName)}&room=${encodeURIComponent(screeningParams.room)}&date=${screeningParams.date}&time=${screeningParams.time}`
    );
    const seatsJson = await seatsRes.json();
    const rowF = seatsJson.data.seatLayout.rows.find((r) => r.row === 'F');
    const seatF = rowF.seats.find((s) => s.id === 'F1-2');
    assert(seatF.status === 'booked', 'Ghế F1-2 đã chuyển thành "booked" trên API /seats');

  } finally {
    server.close();
  }

  console.log('\n===========================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU!`);
  console.log('===========================================================');
}

runTests();
