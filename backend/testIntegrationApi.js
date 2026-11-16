/**
 * TEST INTEGRATION API: KIỂM THỬ TÍCH HỢP BẮP NƯỚC (CONCESSIONS) VÀ LỊCH CHIẾU XUNG ĐỘT
 * Chạy lệnh: node backend/testIntegrationApi.js
 */

const http = require('http');
const app = require('./server');

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
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TÍCH HỢP: API BẮP NƯỚC & LỊCH CHIẾU');
  console.log('===========================================================\n');

  const { server, port } = await startTestServer();
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. KIỂM THỬ API BẮP NƯỚC (CONCESSIONS)
    console.log('👉 NHÓM 1: API Danh mục Bắp nước & Snack (/api/concessions)');
    {
      const res = await fetch(`${baseUrl}/concessions`);
      const json = await res.json();

      assert(res.status === 200, 'GET /api/concessions trả về status 200');
      assert(json.success === true, 'Trả về thuộc tính success: true');
      assert(Array.isArray(json.data) && json.data.length >= 10, `Có đầy đủ danh sách món (${json.data.length} món)`);

      // Lọc theo combo
      const resCombo = await fetch(`${baseUrl}/concessions?category=combo`);
      const jsonCombo = await resCombo.json();
      assert(jsonCombo.data.every((i) => i.category === 'combo'), 'Lọc chính xác category=combo');
      assert(jsonCombo.data.some((i) => i.name.includes('Combo Solo')), 'Có món Combo Solo');
      assert(jsonCombo.data.some((i) => i.name.includes('Combo Couple')), 'Có món Combo Couple');

      // Lọc theo bắp rang
      const resPopcorn = await fetch(`${baseUrl}/concessions?category=popcorn`);
      const jsonPopcorn = await resPopcorn.json();
      assert(jsonPopcorn.data.every((i) => i.category === 'popcorn'), 'Lọc chính xác category=popcorn');
      assert(jsonPopcorn.data.some((i) => i.name.includes('Phô Mai')), 'Có bắp rang Phô Mai');

      // Lọc theo snack
      const resSnack = await fetch(`${baseUrl}/concessions?category=snack`);
      const jsonSnack = await resSnack.json();
      assert(jsonSnack.data.every((i) => i.category === 'snack'), 'Lọc chính xác category=snack');
      assert(jsonSnack.data.some((i) => i.name.includes('Xúc xích')), 'Có món Xúc xích nướng tiêu đen');
    }

    // 2. KIỂM THỬ ĐẶT VÉ KÈM BẮP NƯỚC (/api/bookings)
    console.log('\n👉 NHÓM 2: API Đặt vé kèm Bắp Nước & Snack (/api/bookings)');
    {
      const bookingPayload = {
        movieTitle: 'Hành Tinh Đỏ',
        cinemaName: 'CineNow Landmark 81',
        room: 'PHÒNG 03',
        date: '16.10.2026',
        time: '19:00',
        seats: ['B5', 'B6'],
        seatTotal: 190000,
        concessions: [
          {
            id: 'cb-02',
            name: 'Combo Couple (1 Bắp + 2 Nước)',
            price: 115000,
            quantity: 1,
            category: 'combo',
          },
          {
            id: 'snk-01',
            name: 'Snack Khoai tây Lay\'s Tảo Biển',
            price: 28000,
            quantity: 2,
            category: 'snack',
          },
        ],
        concessionsTotal: 171000, // 115000 + 28000*2 = 171000
        totalPrice: 361000, // 190000 + 171000 = 361000
      };

      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const json = await res.json();
      assert(res.status === 201, 'POST /api/bookings trả về status 201 Created');
      assert(json.success === true, 'Đặt vé thành công');
      assert(Boolean(json.data?.bookingCode), `Tạo mã vé hợp lệ: ${json.data?.bookingCode}`);
      assert(json.data?.concessions?.length === 2, 'Lưu đúng 2 món bắp nước');
      assert(json.data?.concessionsTotal === 171000, 'Tổng tiền bắp nước chính xác 171.000đ');
      assert(json.data?.totalPrice === 361000, 'Tổng tiền đơn đặt chính xác 361.000đ');
    }

    // 3. KIỂM THỬ XUNG ĐỘT LỊCH CHIẾU VÀ GỢI Ý GIỜ (/api/showtimes/check-conflict)
    console.log('\n👉 NHÓM 3: Kiểm tra Xung Đột Lịch Chiếu & Gợi ý khung giờ');
    {
      // 1. Tạo 1 suất chiếu trước lúc 09:00
      const createRes = await fetch(`${baseUrl}/showtimes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: 'mem_movie_1',
          cinemaName: 'CineNow Landmark 81',
          room: 'PHÒNG 01',
          date: '2026-10-16',
          startTime: '09:00',
          price: 95000,
          bufferMinutes: 15,
        }),
      });
      const createJson = await createRes.json();
      assert(createRes.status === 201, 'Tạo suất chiếu ca sáng 09:00 thành công');

      // 2. Thử tạo suất mới lúc 10:00 (đè vào ca 09:00 - 11:23)
      const conflictRes = await fetch(`${baseUrl}/showtimes/check-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: 'mem_movie_1',
          cinemaName: 'CineNow Landmark 81',
          room: 'PHÒNG 01',
          date: '2026-10-16',
          startTime: '10:00',
          bufferMinutes: 15,
        }),
      });
      const conflictJson = await conflictRes.json();

      assert(conflictJson.hasConflict === true, 'Phát hiện xung đột phòng chiếu lúc 10:00');
      assert(Boolean(conflictJson.suggestedStartTime), `Có giờ gợi ý tiếp theo: ${conflictJson.suggestedStartTime}`);
      assert(conflictJson.suggestedStartTime === '11:23', `Giờ gợi ý chính xác ngay sau ca trước (11:23 vs ${conflictJson.suggestedStartTime})`);
      assert(Boolean(conflictJson.overlapDetails), 'Có chi tiết ca chiếu bị đè trùng');
    }

    // 4. KIỂM THỬ TIMELINE PHÒNG CHIẾU (/api/showtimes/timeline)
    console.log('\n👉 NHÓM 4: Timeline phòng chiếu ca bận & ca trống (/api/showtimes/timeline)');
    {
      const timelineRes = await fetch(
        `${baseUrl}/showtimes/timeline?cinemaName=CineNow+Landmark+81&room=PHÒNG+01&date=2026-10-16`
      );
      const timelineJson = await timelineRes.json();

      assert(timelineRes.status === 200, 'GET /api/showtimes/timeline trả về status 200');
      assert(timelineJson.success === true, 'Lấy timeline thành công');
      assert(timelineJson.data?.busySlots?.length >= 1, 'Có ít nhất 1 ca bận đã xếp lịch');
      assert(timelineJson.data?.freeSlots?.length >= 1, 'Có danh sách các khoảng thời gian trống khả dụng');
    }

  } catch (err) {
    console.error('Lỗi khi chạy bài test:', err);
  } finally {
    server.close();
    console.log('\n===========================================================');
    console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU!`);
    console.log('===========================================================');
  }
}

runTests();
