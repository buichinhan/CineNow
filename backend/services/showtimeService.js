const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const Showtime = require('../models/Showtime');

/**
 * THỜI GIAN ĐỆM MẶC ĐỊNH (phút)
 * Giữa 2 suất chiếu liên tiếp trong cùng 1 phòng, cần một khoảng thời gian
 * để khán giả rời phòng, nhân viên dọn dẹp và chiếu trailer/quảng cáo.
 */
const DEFAULT_BUFFER_MINUTES = 15;

/**
 * 1. Chuyển đổi chuỗi thời lượng (ví dụ: "128 phút", "128 min", 128) thành số nguyên phút.
 * @param {string|number} duration
 * @returns {number} Thời lượng tính theo phút (mặc định 120 phút nếu không hợp lệ)
 */
function parseDurationMinutes(duration) {
  if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
    return Math.round(duration);
  }
  if (typeof duration === 'string') {
    const match = duration.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed > 0) return parsed;
    }
  }
  return 120; // Giá trị fallback mặc định
}

/**
 * 2. Chuyển đổi định dạng giờ "HH:mm" thành tổng số phút tính từ đầu ngày (00:00).
 * Ví dụ: "09:30" -> 9 * 60 + 30 = 570 phút.
 * @param {string} timeStr - Định dạng "HH:mm"
 * @returns {number} Số phút từ 0 đến 1439
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error('Định dạng thời gian không hợp lệ. Kỳ vọng "HH:mm".');
  }
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) {
    throw new Error(`Thời gian "${timeStr}" không đúng định dạng "HH:mm".`);
  }
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Thời gian "${timeStr}" không hợp lệ (Giờ: 0-23, Phút: 0-59).`);
  }
  return hours * 60 + minutes;
}

/**
 * 3. Chuyển đổi số phút trong ngày thành chuỗi "HH:mm".
 * Ví dụ: 570 -> "09:30".
 * @param {number} totalMinutes
 * @returns {string} Chuỗi "HH:mm"
 */
function minutesToTime(totalMinutes) {
  const normalized = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(normalized / 60) % 24;
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 4. Tính toán thời gian kết thúc của suất chiếu.
 * Giờ kết thúc = Giờ bắt đầu + Thời lượng phim + Thời gian đệm dọn phòng (buffer).
 * @param {string} startTime - "HH:mm"
 * @param {number} durationMinutes - Thời lượng phim (phút)
 * @param {number} bufferMinutes - Thời gian chuẩn bị/vệ sinh phòng (phút)
 * @returns {{ endMinutes: number, endTime: string, totalOccupiedMinutes: number }}
 */
function calculateEndTime(startTime, durationMinutes, bufferMinutes = DEFAULT_BUFFER_MINUTES) {
  const startMinutes = timeToMinutes(startTime);
  const totalOccupiedMinutes = durationMinutes + bufferMinutes;
  const endMinutes = startMinutes + totalOccupiedMinutes;
  const endTime = minutesToTime(endMinutes);
  return {
    startMinutes,
    endMinutes,
    endTime,
    totalOccupiedMinutes,
  };
}

/**
 * 5. Thuật toán kiểm tra 2 khoảng thời gian [startA, endA) và [startB, endB) có giao nhau hay không.
 * Hai khoảng giao nhau KHI VÀ CHỈ KHI: max(startA, startB) < min(endA, endB)
 * Tức là: startA < endB && startB < endA.
 */
function isTimeOverlapping(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * 6. Kiểm tra tính hợp lệ của Dữ liệu Phim.
 * - Phim phải tồn tại trong cơ sở dữ liệu.
 * - Trạng thái phim không bị vô hiệu hóa / đã bị xóa.
 * - Phim phải có thông tin thời lượng hợp lệ.
 */
async function validateMovieData(movieId, memoryStore = null) {
  if (!movieId) {
    return { isValid: false, message: 'Vui lòng cung cấp mã phim (movieId).' };
  }

  let movie = null;
  // Kiểm tra trong MongoDB nếu có kết nối
  try {
    if (Movie && typeof Movie.findById === 'function') {
      movie = await Movie.findById(movieId).lean();
    }
  } catch (err) {
    // Có thể là id dạng string in-memory
  }

  // Fallback in-memory nếu chưa tìm thấy
  if (!movie && memoryStore?.movies) {
    movie = memoryStore.movies.find(
      (m) => m._id?.toString() === movieId?.toString() || m.id === movieId || m.slug === movieId
    );
  }

  if (!movie) {
    return {
      isValid: false,
      message: `Không tìm thấy phim với mã ID "${movieId}". Vui lòng kiểm tra lại.`,
    };
  }

  const durationMinutes = parseDurationMinutes(movie.duration);
  if (!durationMinutes || durationMinutes <= 0) {
    return {
      isValid: false,
      message: `Phim "${movie.title}" chưa có thông tin thời lượng hợp lệ.`,
    };
  }

  return {
    isValid: true,
    movie: {
      id: movie._id?.toString() || movie.id,
      title: movie.title,
      duration: movie.duration,
      durationMinutes,
      status: movie.status || 'now_showing',
      posterUrl: movie.posterUrl || movie.poster || '',
      formats: movie.formats || ['2D'],
    },
  };
}

/**
 * 7. Kiểm tra tính hợp lệ của Rạp và Phòng chiếu.
 * - Tên rạp hoặc cinemaId phải hợp lệ.
 * - Phòng chiếu không được để trống và phải theo chuẩn định danh (ví dụ: "PHÒNG 01", "PHÒNG 03", "IMAX 01").
 * - Ngày chiếu phải đúng chuẩn YYYY-MM-DD.
 * - Giờ chiếu phải đúng chuẩn HH:mm.
 */
function validateCinemaAndRoomData({ cinemaName, room, date, startTime }) {
  if (!cinemaName || !cinemaName.trim()) {
    return { isValid: false, message: 'Tên rạp chiếu không được để trống.' };
  }

  if (!room || !room.trim()) {
    return { isValid: false, message: 'Phòng chiếu không được để trống.' };
  }

  // Kiểm tra định dạng ngày: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date.trim())) {
    return {
      isValid: false,
      message: `Ngày chiếu "${date}" không hợp lệ. Định dạng yêu cầu là YYYY-MM-DD (ví dụ: 2026-10-16).`,
    };
  }

  // Kiểm tra định dạng giờ: HH:mm
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!startTime || !timeRegex.test(startTime.trim())) {
    return {
      isValid: false,
      message: `Giờ bắt đầu "${startTime}" không hợp lệ. Định dạng yêu cầu là HH:mm (từ 00:00 đến 23:59).`,
    };
  }

  return {
    isValid: true,
    normalized: {
      cinemaName: cinemaName.trim(),
      room: room.trim().toUpperCase(),
      date: date.trim(),
      startTime: startTime.trim(),
    },
  };
}

/**
 * 8. THUẬT TOÁN KIỂM TRA XUNG ĐỘT LỊCH CHIẾU (Core Conflict Checker)
 * Kiểm tra xem trong cùng 1 rạp, cùng 1 phòng chiếu, cùng 1 ngày,
 * khoảng thời gian [startMinutes, endMinutes) có bị trùng với suất chiếu nào khác không.
 *
 * @param {Object} options
 * @param {string} options.cinemaName - Tên rạp
 * @param {string} options.room - Phòng chiếu (e.g. "PHÒNG 01")
 * @param {string} options.date - Ngày chiếu "YYYY-MM-DD"
 * @param {number} options.startMinutes - Phút bắt đầu tính từ 00:00
 * @param {number} options.endMinutes - Phút kết thúc tính từ 00:00
 * @param {string} [options.excludeShowtimeId] - Mã lịch chiếu loại trừ (khi đang cập nhật chính nó)
 * @param {Array} [options.existingShowtimes] - Danh sách lịch chiếu sẵn có (cho in-memory hoặc MongoDB)
 */
function detectShowtimeConflict({
  cinemaName,
  room,
  date,
  startMinutes,
  endMinutes,
  excludeShowtimeId = null,
  existingShowtimes = [],
}) {
  const normalizedCinema = cinemaName.trim().toLowerCase();
  const normalizedRoom = room.trim().toUpperCase();

  for (const show of existingShowtimes) {
    // 1. Loại trừ chính suất chiếu đang được chỉnh sửa
    const showId = show._id?.toString() || show.id?.toString();
    if (excludeShowtimeId && showId === excludeShowtimeId.toString()) {
      continue;
    }

    // 2. Bỏ qua các suất chiếu đã bị hủy
    if (show.status === 'cancelled') {
      continue;
    }

    // 3. Kiểm tra cùng ngày chiếu
    if (show.date !== date) {
      continue;
    }

    // 4. Kiểm tra cùng rạp chiếu
    const showCinema = (show.cinemaName || '').trim().toLowerCase();
    if (showCinema !== normalizedCinema) {
      continue;
    }

    // 5. Kiểm tra cùng phòng chiếu
    const showRoom = (show.room || '').trim().toUpperCase();
    if (showRoom !== normalizedRoom) {
      continue;
    }

    // 6. Tính toán khoảng thời gian của suất chiếu hiện có
    let existingStart = 0;
    let existingEnd = 0;

    if (show.startTime) {
      existingStart = timeToMinutes(show.startTime);
      if (show.endTime) {
        existingEnd = timeToMinutes(show.endTime);
      } else {
        const dur = parseDurationMinutes(show.durationMinutes || 120);
        const buf = show.bufferMinutes || DEFAULT_BUFFER_MINUTES;
        existingEnd = existingStart + dur + buf;
      }
    } else if (Array.isArray(show.times) && show.times.length > 0) {
      // Hỗ trợ cấu trúc mảng times cũ
      for (const t of show.times) {
        const tStart = timeToMinutes(t.time);
        const tEnd = tStart + 120 + DEFAULT_BUFFER_MINUTES;
        if (isTimeOverlapping(startMinutes, endMinutes, tStart, tEnd)) {
          return {
            hasConflict: true,
            conflictingShowtime: show,
            reason: `Phòng "${room}" tại rạp "${cinemaName}" đã có suất chiếu lúc ${t.time} vào ngày ${date}.`,
            overlapDetails: {
              existingStartTime: t.time,
              existingEndTime: minutesToTime(tEnd),
              movieTitle: show.movieTitle || 'Phim khác',
            },
          };
        }
      }
      continue;
    }

    // 7. Áp dụng công thức kiểm tra giao nhau giữa 2 khoảng thời gian
    if (isTimeOverlapping(startMinutes, endMinutes, existingStart, existingEnd)) {
      const existingStartTimeStr = show.startTime || minutesToTime(existingStart);
      const existingEndTimeStr = show.endTime || minutesToTime(existingEnd);

      return {
        hasConflict: true,
        conflictingShowtime: show,
        reason:
          `Xung đột lịch chiếu: Phòng "${room}" tại rạp "${cinemaName}" đã được xếp lịch cho phim ` +
          `"${show.movieTitle || 'Chưa đặt tên'}" từ ${existingStartTimeStr} đến ${existingEndTimeStr} ` +
          `(đã bao gồm thời gian dọn phòng/nghỉ).`,
        overlapDetails: {
          existingStartTime: existingStartTimeStr,
          existingEndTime: existingEndTimeStr,
          movieTitle: show.movieTitle || 'Phim khác',
          room: show.room,
          cinemaName: show.cinemaName,
        },
      };
    }
  }

  return {
    hasConflict: false,
    conflictingShowtime: null,
    reason: null,
  };
}

module.exports = {
  DEFAULT_BUFFER_MINUTES,
  parseDurationMinutes,
  timeToMinutes,
  minutesToTime,
  calculateEndTime,
  isTimeOverlapping,
  validateMovieData,
  validateCinemaAndRoomData,
  detectShowtimeConflict,
};
