/**
 * SEAT HOLD SERVICE: DỊCH VỤ GIỮ GHẾ TẠM THỜI VÀ KIỂM SOÁT ĐỒNG THỜI
 * - Xử lý trạng thái ghế: available, holding (đang giữ), booked (đã đặt).
 * - Kiểm soát nhiều người cùng chọn một ghế (ngăn chặn double-booking).
 * - Tự động giải phóng ghế khi hết thời gian giữ (TTL: mặc định 5 phút).
 */

const DEFAULT_HOLD_DURATION_SECONDS = 300; // 5 phút (300 giây)

// Quản lý bộ nhớ các suất chiếu và ghế giữ tạm
const screeningLayouts = new Map();
const activeHolds = new Map();

/**
 * 1. Chuẩn hóa định danh suất chiếu (Screening Key)
 */
function getScreeningKey({ cinemaName = '', room = '', date = '', time = '' }) {
  const normCinema = String(cinemaName || '').trim().toLowerCase();
  const normRoom = String(room || '').trim().toLowerCase();
  const normDate = String(date || '').trim().toLowerCase();
  const normTime = String(time || '').trim().toLowerCase();
  return `${normCinema}__${normRoom}__${normDate}__${normTime}`;
}

/**
 * 2. Lấy hoặc khởi tạo sơ đồ ghế cho một suất chiếu cụ thể
 */
function getOrCreateScreeningLayout(screeningKey, initialLayout, bookedSeatsList = []) {
  if (!screeningLayouts.has(screeningKey)) {
    // Clone sâu từ initialLayout
    const layout = JSON.parse(JSON.stringify(initialLayout));

    // Đánh dấu các ghế đã đặt trong CSDL (nếu có)
    if (Array.isArray(bookedSeatsList) && bookedSeatsList.length > 0 && layout.rows) {
      layout.rows.forEach((row) => {
        row.seats.forEach((seat) => {
          if (bookedSeatsList.includes(seat.id)) {
            seat.status = 'booked';
          }
        });
      });
    }

    screeningLayouts.set(screeningKey, layout);
  }
  return screeningLayouts.get(screeningKey);
}

/**
 * 3. Tự động giải phóng các ghế giữ tạm đã hết thời gian (Auto-Release Expired Holds)
 */
function cleanupExpiredHolds() {
  const now = Date.now();
  let releasedCount = 0;

  for (const [holdToken, hold] of activeHolds.entries()) {
    if (now >= hold.expiresAt) {
      // Hết hạn -> hoàn trả trạng thái các ghế về 'available'
      const layout = screeningLayouts.get(hold.screeningKey);
      if (layout && layout.rows) {
        layout.rows.forEach((row) => {
          row.seats.forEach((seat) => {
            if (hold.seats.includes(seat.id) && seat.status === 'holding') {
              seat.status = 'available';
              delete seat.heldByToken;
              delete seat.holdExpiresAt;
              releasedCount++;
            }
          });
        });
      }
      activeHolds.delete(holdToken);
    }
  }

  return releasedCount;
}

/**
 * 4. Kiểm tra và thực hiện Giữ ghế tạm thời (Hold Seats)
 * Kiểm soát đồng thời: nếu ghế đã bị người khác đặt hoặc đang giữ, từ chối ngay.
 */
function holdSeats({
  cinemaName,
  room,
  date,
  time,
  seats = [],
  holdToken = null,
  userId = null,
  durationSeconds = DEFAULT_HOLD_DURATION_SECONDS,
  initialLayout,
  bookedSeatsList = [],
}) {
  cleanupExpiredHolds();

  if (!Array.isArray(seats) || seats.length === 0) {
    return {
      success: false,
      code: 'INVALID_SEATS',
      message: 'Vui lòng chọn ít nhất 1 ghế để giữ.',
    };
  }

  const screeningKey = getScreeningKey({ cinemaName, room, date, time });
  const layout = getOrCreateScreeningLayout(screeningKey, initialLayout, bookedSeatsList);

  const seatMap = new Map();
  layout.rows.forEach((row) => {
    row.seats.forEach((s) => {
      seatMap.set(s.id, s);
    });
  });

  const bookedConflicts = [];
  const heldConflicts = [];
  const validSeats = [];

  for (const seatId of seats) {
    const seat = seatMap.get(seatId);
    if (!seat) {
      return {
        success: false,
        code: 'SEAT_NOT_FOUND',
        message: `Mã ghế "${seatId}" không tồn tại trong sơ đồ phòng chiếu.`,
      };
    }

    if (seat.status === 'booked') {
      bookedConflicts.push(seatId);
      continue;
    }

    if (seat.status === 'holding') {
      // Nếu chính holdToken hiện tại đang giữ thì vẫn hợp lệ (gia hạn)
      if (holdToken && seat.heldByToken === holdToken) {
        validSeats.push(seat);
        continue;
      }
      heldConflicts.push(seatId);
      continue;
    }

    validSeats.push(seat);
  }

  // 1. Kiểm tra xung đột ghế đã đặt
  if (bookedConflicts.length > 0) {
    return {
      success: false,
      code: 'SEAT_ALREADY_BOOKED',
      message: `Ghế [${bookedConflicts.join(', ')}] đã được đặt mua thành công bởi khách hàng khác.`,
      conflictingSeats: bookedConflicts,
    };
  }

  // 2. Kiểm tra xung đột ghế đang được người khác giữ tạm
  if (heldConflicts.length > 0) {
    return {
      success: false,
      code: 'SEAT_ALREADY_HELD',
      message: `Ghế [${heldConflicts.join(', ')}] đang được khách hàng khác giữ tạm. Vui lòng chọn ghế khác hoặc chờ hết thời gian giữ.`,
      conflictingSeats: heldConflicts,
    };
  }

  // 3. Khóa giữ ghế thành công!
  const now = Date.now();
  const token = holdToken || `hold_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const expiresAt = now + durationSeconds * 1000;

  // Nếu người dùng trước đó đang giữ các ghế khác cùng screening, giải phóng những ghế không còn chọn
  const existingHold = activeHolds.get(token);
  if (existingHold && existingHold.screeningKey === screeningKey) {
    existingHold.seats.forEach((oldSeatId) => {
      if (!seats.includes(oldSeatId)) {
        const oldSeat = seatMap.get(oldSeatId);
        if (oldSeat && oldSeat.status === 'holding' && oldSeat.heldByToken === token) {
          oldSeat.status = 'available';
          delete oldSeat.heldByToken;
          delete oldSeat.holdExpiresAt;
        }
      }
    });
  }

  // Đánh dấu các ghế mới là 'holding'
  validSeats.forEach((seat) => {
    seat.status = 'holding';
    seat.heldByToken = token;
    seat.holdExpiresAt = expiresAt;
  });

  const holdData = {
    holdToken: token,
    screeningKey,
    cinemaName,
    room,
    date,
    time,
    seats: [...seats],
    userId,
    createdAt: now,
    expiresAt,
    durationSeconds,
  };

  activeHolds.set(token, holdData);

  return {
    success: true,
    message: 'Giữ ghế tạm thời thành công!',
    data: {
      holdToken: token,
      seats: [...seats],
      expiresAt,
      expiresInSeconds: durationSeconds,
      remainingSeconds: Math.max(0, Math.round((expiresAt - now) / 1000)),
    },
  };
}

/**
 * 5. Giải phóng ghế giữ tạm (Release Seats)
 * Khi người dùng bấm bỏ chọn ghế, nhấn nút Back hoặc hủy phiên đặt
 */
function releaseSeats({ cinemaName, room, date, time, seats = null, holdToken }) {
  cleanupExpiredHolds();

  if (!holdToken) {
    return { success: false, message: 'Thiếu mã giữ ghế (holdToken).' };
  }

  const hold = activeHolds.get(holdToken);
  if (!hold) {
    return { success: true, message: 'Ghế đã được giải phóng hoặc không còn hiệu lực.' };
  }

  const screeningKey = getScreeningKey({ cinemaName, room, date, time });
  const layout = screeningLayouts.get(screeningKey || hold.screeningKey);

  const releasedList = [];

  if (layout && layout.rows) {
    const seatsToRelease = Array.isArray(seats) && seats.length > 0 ? seats : hold.seats;

    layout.rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (seatsToRelease.includes(seat.id) && seat.heldByToken === holdToken) {
          seat.status = 'available';
          delete seat.heldByToken;
          delete seat.holdExpiresAt;
          releasedList.push(seat.id);
        }
      });
    });

    // Cập nhật lại danh sách ghế còn giữ trong hold
    hold.seats = hold.seats.filter((id) => !releasedList.includes(id));
    if (hold.seats.length === 0) {
      activeHolds.delete(holdToken);
    }
  }

  return {
    success: true,
    message: `Đã giải phóng ${releasedList.length} ghế.`,
    data: {
      releasedSeats: releasedList,
      remainingHeldSeats: hold ? hold.seats : [],
    },
  };
}

/**
 * 6. Xác nhận ghế đã đặt thành công (Confirm Booked Seats)
 * Chuyển trạng thái từ 'holding' sang 'booked' vĩnh viễn khi thanh toán hoàn tất.
 */
function confirmBookedSeats({ cinemaName, room, date, time, seats = [], holdToken = null, initialLayout }) {
  cleanupExpiredHolds();

  const screeningKey = getScreeningKey({ cinemaName, room, date, time });
  const layout = getOrCreateScreeningLayout(screeningKey, initialLayout);

  if (layout && layout.rows) {
    layout.rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (seats.includes(seat.id)) {
          seat.status = 'booked';
          delete seat.heldByToken;
          delete seat.holdExpiresAt;
        }
      });
    });
  }

  if (holdToken) {
    activeHolds.delete(holdToken);
  }

  return { success: true };
}

/**
 * 7. Lấy danh sách ghế kèm trạng thái giữ tạm & thời gian còn lại
 */
function getSeatsWithHoldStatus({
  cinemaName,
  room = 'PHÒNG 03',
  date = '16.10.2026',
  time = '19:00',
  holdToken = null,
  initialLayout,
  bookedSeatsList = [],
}) {
  cleanupExpiredHolds();

  const screeningKey = getScreeningKey({ cinemaName, room, date, time });
  const layout = getOrCreateScreeningLayout(screeningKey, initialLayout, bookedSeatsList);

  const now = Date.now();
  let myActiveHold = null;

  if (holdToken && activeHolds.has(holdToken)) {
    const hold = activeHolds.get(holdToken);
    if (hold.screeningKey === screeningKey && hold.expiresAt > now) {
      myActiveHold = {
        holdToken,
        seats: hold.seats,
        expiresAt: hold.expiresAt,
        remainingSeconds: Math.max(0, Math.round((hold.expiresAt - now) / 1000)),
      };
    }
  }

  // Clone layout và gắn cờ isMine cho các ghế do client này giữ
  const publicLayout = {
    rows: layout.rows.map((row) => ({
      ...row,
      seats: row.seats.map((seat) => {
        const isMine = Boolean(
          seat.status === 'holding' && holdToken && seat.heldByToken === holdToken
        );
        return {
          id: seat.id,
          number: seat.number,
          status: seat.status,
          isDouble: Boolean(seat.isDouble),
          isMine,
        };
      }),
    })),
  };

  const legend = [
    { type: 'standard', label: 'Thường', color: '#3F3F46', price: 85000 },
    { type: 'vip', label: 'VIP', color: '#EAB308', price: 95000 },
    { type: 'sweetbox', label: 'Ghế đôi', color: '#881337', price: 190000 },
    { type: 'holding', label: 'Đang giữ', color: '#F59E0B' },
    { type: 'booked', label: 'Đã đặt', color: '#18181B' },
    { type: 'selected', label: 'Đang chọn', color: '#E50914' },
  ];

  return {
    room,
    seatLayout: publicLayout,
    legend,
    activeHold: myActiveHold,
  };
}

/**
 * 8. Đặt lại bộ nhớ (cho Unit Tests)
 */
function resetAllHolds() {
  screeningLayouts.clear();
  activeHolds.clear();
}

// Khởi chạy dọn dẹp định kỳ mỗi 15 giây (unref để không giữ tiến trình kiểm thử)
if (typeof setInterval !== 'undefined') {
  const cleaner = setInterval(() => {
    cleanupExpiredHolds();
  }, 15000);
  if (typeof cleaner.unref === 'function') {
    cleaner.unref();
  }
}

module.exports = {
  DEFAULT_HOLD_DURATION_SECONDS,
  getScreeningKey,
  getOrCreateScreeningLayout,
  cleanupExpiredHolds,
  holdSeats,
  releaseSeats,
  confirmBookedSeats,
  getSeatsWithHoldStatus,
  resetAllHolds,
};
