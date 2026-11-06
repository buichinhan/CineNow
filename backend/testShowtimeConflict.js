/**
 * TEST SCRIPT: KIỂM THỬ CHỨC NĂNG QUẢN LÝ LỊCH CHIẾU & KIỂM TRA XUNG ĐỘT
 * Chạy lệnh: node backend/testShowtimeConflict.js
 */

const {
  parseDurationMinutes,
  timeToMinutes,
  minutesToTime,
  calculateEndTime,
  isTimeOverlapping,
  validateMovieData,
  validateCinemaAndRoomData,
  detectShowtimeConflict,
  suggestNextAvailableSlot,
  getRoomScheduleTimeline,
} = require('./services/showtimeService');

const { INITIAL_MOVIES, INITIAL_CINEMAS } = require('./seedData');

// Giả lập mock memoryStore
const mockMemoryStore = {
  movies: INITIAL_MOVIES.map((m, idx) => ({ ...m, _id: `mem_movie_${idx + 1}` })),
  cinemas: INITIAL_CINEMAS,
};

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

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ: LỊCH CHIẾU VÀ KIỂM TRA XUNG ĐỘT');
  console.log('===========================================================\n');

  // TEST 1: CHUYỂN ĐỔI THỜI GIAN VÀ TÍNH TOÁN GIỜ KẾT THÚC
  console.log('👉 NHÓM 1: Tính toán thời gian & Giờ kết thúc (End Time)');
  {
    const dur1 = parseDurationMinutes('128 phút');
    assert(dur1 === 128, 'Phân tích "128 phút" -> 128');

    const dur2 = parseDurationMinutes(105);
    assert(dur2 === 105, 'Phân tích 105 -> 105');

    const min1 = timeToMinutes('09:30');
    assert(min1 === 570, 'Chuyển "09:30" -> 570 phút');

    const str1 = minutesToTime(570);
    assert(str1 === '09:30', 'Chuyển 570 phút -> "09:30"');

    // Suất chiếu bắt đầu lúc 09:00, thời lượng 128 phút, buffer 15 phút
    // 09:00 (540p) + 128p + 15p = 683p = 11:23
    const calc = calculateEndTime('09:00', 128, 15);
    assert(calc.endTime === '11:23', 'Tính giờ kết thúc: 09:00 + 128p + 15p buffer = 11:23');
  }

  // TEST 2: KIỂM TRA TÍNH HỢP LỆ DỮ LIỆU PHIM
  console.log('\n👉 NHÓM 2: Kiểm tra dữ liệu Phim');
  {
    // Phim tồn tại
    const validMovie = await validateMovieData('mem_movie_1', mockMemoryStore);
    assert(validMovie.isValid === true, 'Phim "mem_movie_1" tồn tại và hợp lệ');
    assert(validMovie.movie.title === 'Hành Tinh Đỏ', 'Tên phim chính xác: Hành Tinh Đỏ');
    assert(validMovie.movie.durationMinutes === 128, 'Thời lượng chuẩn: 128 phút');

    // Phim không tồn tại
    const invalidMovie = await validateMovieData('non_existent_id', mockMemoryStore);
    assert(invalidMovie.isValid === false, 'Từ chối mã phim không tồn tại');
  }

  // TEST 3: KIỂM TRA DỮ LIỆU RẠP VÀ PHÒNG CHIẾU
  console.log('\n👉 NHÓM 3: Kiểm tra dữ liệu Rạp, Phòng, Ngày, Giờ');
  {
    const validRoom = validateCinemaAndRoomData({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startTime: '09:30',
    });
    assert(validRoom.isValid === true, 'Dữ liệu rạp và phòng hợp lệ');

    const emptyRoom = validateCinemaAndRoomData({
      cinemaName: 'CineNow Landmark 81',
      room: '',
      date: '2026-10-16',
      startTime: '09:30',
    });
    assert(emptyRoom.isValid === false, 'Từ chối phòng chiếu bị để trống');

    const invalidDate = validateCinemaAndRoomData({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '16-10-2026', // Sai format YYYY-MM-DD
      startTime: '09:30',
    });
    assert(invalidDate.isValid === false, 'Từ chối ngày sai định dạng');

    const invalidTime = validateCinemaAndRoomData({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startTime: '25:99', // Sai format HH:mm
    });
    assert(invalidTime.isValid === false, 'Từ chối giờ bắt đầu không hợp lệ');
  }

  // TEST 4: THUẬT TOÁN PHÁT HIỆN TRÙNG LỊCH CHIẾU (CONFLICT DETECTION)
  console.log('\n👉 NHÓM 4: Kiểm tra trùng phòng chiếu & trùng thời gian');
  {
    // Tạo 1 suất chiếu cơ sở:
    // Rạp: CineNow Landmark 81, Phòng: PHÒNG 01, Ngày: 2026-10-16, Giờ: 09:00 - 11:23
    const baseShowtime = {
      _id: 'show_001',
      movieTitle: 'Hành Tinh Đỏ',
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startTime: '09:00',
      endTime: '11:23',
      status: 'scheduled',
    };

    const existingList = [baseShowtime];

    // Case 4.1: Xếp suất mới lúc 10:00 (chồng lấn vào giữa 09:00 - 11:23) -> Phải phát hiện XUNG ĐỘT
    const conflictOverlap = detectShowtimeConflict({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startMinutes: timeToMinutes('10:00'),
      endMinutes: timeToMinutes('10:00') + 120,
      existingShowtimes: existingList,
    });
    assert(conflictOverlap.hasConflict === true, 'Phát hiện xung đột khi giờ chiếu bắt đầu giữa ca trước');

    // Case 4.2: Xếp suất mới lúc 08:00 đến 10:00 (chồng lấn đoạn đầu 09:00) -> Phải phát hiện XUNG ĐỘT
    const conflictFront = detectShowtimeConflict({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startMinutes: timeToMinutes('08:00'),
      endMinutes: timeToMinutes('10:00'),
      existingShowtimes: existingList,
    });
    assert(conflictFront.hasConflict === true, 'Phát hiện xung đột khi ca chiếu kéo dài đè vào ca sau');

    // Case 4.3: Xếp suất mới lúc 11:25 (sau khi ca trước kết thúc lúc 11:23) cùng PHÒNG 01 -> HỢP LỆ (Không trùng)
    const noConflictAfter = detectShowtimeConflict({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startMinutes: timeToMinutes('11:25'),
      endMinutes: timeToMinutes('13:30'),
      existingShowtimes: existingList,
    });
    assert(noConflictAfter.hasConflict === false, 'Hợp lệ: Ca sau bắt đầu sau khi ca trước kết thúc');

    // Case 4.4: Cùng giờ 09:00 - 11:23 nhưng ở PHÒNG 02 (khác phòng chiếu) -> HỢP LỆ (Không trùng)
    const noConflictDifferentRoom = detectShowtimeConflict({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 02', // Khác phòng
      date: '2026-10-16',
      startMinutes: timeToMinutes('09:00'),
      endMinutes: timeToMinutes('11:23'),
      existingShowtimes: existingList,
    });
    assert(noConflictDifferentRoom.hasConflict === false, 'Hợp lệ: Cùng giờ nhưng chiếu tại phòng khác');

    // Case 4.5: Cùng giờ 09:00 - 11:23, cùng PHÒNG 01 nhưng KHÁC NGÀY (2026-10-17) -> HỢP LỆ (Không trùng)
    const noConflictDifferentDate = detectShowtimeConflict({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-17', // Khác ngày
      startMinutes: timeToMinutes('09:00'),
      endMinutes: timeToMinutes('11:23'),
      existingShowtimes: existingList,
    });
    assert(noConflictDifferentDate.hasConflict === false, 'Hợp lệ: Cùng phòng nhưng chiếu ở ngày khác');

    // Case 4.6: Chỉnh sửa chính suất 'show_001' (excludeShowtimeId = 'show_001') -> Không tự báo trùng với mình
    const selfUpdateCheck = detectShowtimeConflict({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      startMinutes: timeToMinutes('09:00'),
      endMinutes: timeToMinutes('11:23'),
      excludeShowtimeId: 'show_001',
      existingShowtimes: existingList,
    });
    assert(selfUpdateCheck.hasConflict === false, 'Hợp lệ: Chỉnh sửa chính nó không bị xung đột với chính nó');
  }

  // TEST 5: GỢI Ý KHUNG GIỜ KHẢ DỤNG TIẾP THEO (SLOT SUGGESTION)
  console.log('\n👉 NHÓM 5: Gợi ý khung giờ khả dụng tiếp theo (Slot Suggestion)');
  {
    const existingList = [
      {
        _id: 'show_001',
        movieTitle: 'Hành Tinh Đỏ',
        cinemaName: 'CineNow Landmark 81',
        room: 'PHÒNG 01',
        date: '2026-10-16',
        startTime: '09:00',
        endTime: '11:23',
        status: 'scheduled',
      },
      {
        _id: 'show_002',
        movieTitle: 'Kẻ Giữ Thời Gian',
        cinemaName: 'CineNow Landmark 81',
        room: 'PHÒNG 01',
        date: '2026-10-16',
        startTime: '14:00',
        endTime: '16:11',
        status: 'scheduled',
      },
    ];

    // Gợi ý sau khi ca 1 kết thúc lúc 11:23 cho phim thời lượng 105 phút (+ 15p buffer = 120p)
    const suggestion = suggestNextAvailableSlot({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      durationMinutes: 105,
      bufferMinutes: 15,
      afterMinutes: timeToMinutes('11:23'),
      existingShowtimes: existingList,
    });

    assert(suggestion.found === true, 'Tìm thấy khung giờ gợi ý khả dụng');
    assert(suggestion.suggestedStartTime === '11:23', `Giờ gợi ý bắt đầu chính xác ngay sau ca trước (11:23 vs ${suggestion.suggestedStartTime})`);
    assert(suggestion.suggestedEndTime === '13:23', `Giờ kết thúc dự kiến chính xác (13:23 vs ${suggestion.suggestedEndTime})`);
  }

  // TEST 6: LẬP TIMELINE PHÒNG CHIẾU (TIMELINE & FREE SLOTS)
  console.log('\n👉 NHÓM 6: Timeline phòng chiếu & Khoảng thời gian trống (Free Slots)');
  {
    const existingList = [
      {
        _id: 'show_001',
        movieTitle: 'Hành Tinh Đỏ',
        cinemaName: 'CineNow Landmark 81',
        room: 'PHÒNG 01',
        date: '2026-10-16',
        startTime: '09:00',
        endTime: '11:23',
        status: 'scheduled',
      },
      {
        _id: 'show_002',
        movieTitle: 'Kẻ Giữ Thời Gian',
        cinemaName: 'CineNow Landmark 81',
        room: 'PHÒNG 01',
        date: '2026-10-16',
        startTime: '14:00',
        endTime: '16:11',
        status: 'scheduled',
      },
    ];

    const timeline = getRoomScheduleTimeline({
      cinemaName: 'CineNow Landmark 81',
      room: 'PHÒNG 01',
      date: '2026-10-16',
      existingShowtimes: existingList,
    });

    assert(timeline.totalOccupiedShows === 2, 'Tổng số ca chiếu đã đặt là 2');
    assert(timeline.busySlots.length === 2, 'Danh sách ca bận có đúng 2 ca');
    assert(timeline.freeSlots.length > 0, 'Phát hiện các khoảng thời gian trống trong ngày');

    // Khoảng trống giữa 11:23 và 14:00 (157 phút)
    const midSlot = timeline.freeSlots.find((s) => s.startTime === '11:23' && s.endTime === '14:00');
    assert(Boolean(midSlot), 'Xác định chính xác khoảng trống giữa ca sáng và ca chiều (11:23 - 14:00)');
    assert(midSlot?.availableMinutes === 157, 'Thời lượng khoảng trống chính xác (157 phút)');
  }

  console.log('\n===========================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU!`);
  console.log('===========================================================');
}

runTests();
