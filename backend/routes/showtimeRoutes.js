const express = require('express');
const router = express.Router();

const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');

const {
  DEFAULT_BUFFER_MINUTES,
  timeToMinutes,
  minutesToTime,
  calculateEndTime,
  validateMovieData,
  validateCinemaAndRoomData,
  detectShowtimeConflict,
} = require('../services/showtimeService');

const { SHOWTIME_DATES, SHOWTIME_CINEMAS } = require('../seedData');

// Khởi tạo bộ nhớ tạm (runtime in-memory) cho showtimes khi chưa kết nối MongoDB
let inMemoryShowtimes = [];

// Helper lấy danh sách showtimes hiện tại (từ DB hoặc in-memory)
async function getExistingShowtimes({ date, cinemaName, room, isMongoConnected }) {
  if (isMongoConnected) {
    const query = { status: { $ne: 'cancelled' } };
    if (date) query.date = date;
    if (cinemaName) query.cinemaName = new RegExp(`^${cinemaName.trim()}$`, 'i');
    if (room) query.room = new RegExp(`^${room.trim()}$`, 'i');
    return await Showtime.find(query).lean();
  }
  return inMemoryShowtimes.filter((s) => s.status !== 'cancelled');
}

/**
 * 1. POST /api/showtimes/check-conflict
 * Kiểm tra xem một khung giờ dự kiến có bị trùng hay không (Preview check)
 */
router.post('/check-conflict', async (req, res) => {
  try {
    const {
      movieId,
      cinemaName,
      room,
      date,
      startTime,
      bufferMinutes = DEFAULT_BUFFER_MINUTES,
      excludeShowtimeId,
    } = req.body;

    const isMongo = req.app.locals.isMongoConnected;
    const memoryStore = req.app.locals.memoryStore;

    // 1. Kiểm tra dữ liệu phim
    const movieValidation = await validateMovieData(movieId, memoryStore);
    if (!movieValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: movieValidation.message,
      });
    }

    // 2. Kiểm tra dữ liệu rạp và phòng chiếu
    const roomValidation = validateCinemaAndRoomData({ cinemaName, room, date, startTime });
    if (!roomValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: roomValidation.message,
      });
    }

    const { durationMinutes } = movieValidation.movie;
    const normalizedRoom = roomValidation.normalized;

    // 3. Tính toán khoảng thời gian
    const timeCalculation = calculateEndTime(
      normalizedRoom.startTime,
      durationMinutes,
      bufferMinutes
    );

    // 4. Lấy các suất chiếu đã có cùng ngày/rạp/phòng
    const existingShowtimes = await getExistingShowtimes({
      date: normalizedRoom.date,
      cinemaName: normalizedRoom.cinemaName,
      room: normalizedRoom.room,
      isMongoConnected: isMongo,
    });

    // 5. Kiểm tra xung đột
    const conflictResult = detectShowtimeConflict({
      cinemaName: normalizedRoom.cinemaName,
      room: normalizedRoom.room,
      date: normalizedRoom.date,
      startMinutes: timeCalculation.startMinutes,
      endMinutes: timeCalculation.endMinutes,
      excludeShowtimeId,
      existingShowtimes,
    });

    return res.json({
      success: true,
      hasConflict: conflictResult.hasConflict,
      reason: conflictResult.reason,
      proposedSlot: {
        movieTitle: movieValidation.movie.title,
        cinemaName: normalizedRoom.cinemaName,
        room: normalizedRoom.room,
        date: normalizedRoom.date,
        startTime: normalizedRoom.startTime,
        endTime: timeCalculation.endTime,
        durationMinutes,
        bufferMinutes,
      },
      overlapDetails: conflictResult.overlapDetails || null,
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra xung đột lịch chiếu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi kiểm tra xung đột.',
      error: error.message,
    });
  }
});

/**
 * 2. POST /api/showtimes
 * Tạo mới một lịch chiếu
 */
router.post('/', async (req, res) => {
  try {
    const {
      movieId,
      cinemaId,
      cinemaName,
      room,
      format = '2D PHỤ ĐỀ',
      date,
      startTime,
      price = 95000,
      bufferMinutes = DEFAULT_BUFFER_MINUTES,
    } = req.body;

    const isMongo = req.app.locals.isMongoConnected;
    const memoryStore = req.app.locals.memoryStore;

    // Bước 1: Kiểm tra tính hợp lệ của phim
    const movieValidation = await validateMovieData(movieId, memoryStore);
    if (!movieValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: movieValidation.message,
      });
    }

    // Bước 2: Kiểm tra dữ liệu rạp, phòng, ngày, giờ
    const roomValidation = validateCinemaAndRoomData({ cinemaName, room, date, startTime });
    if (!roomValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: roomValidation.message,
      });
    }

    const movie = movieValidation.movie;
    const norm = roomValidation.normalized;

    // Bước 3: Tính toán giờ kết thúc dựa trên thời lượng phim + thời gian đệm
    const timeCalc = calculateEndTime(norm.startTime, movie.durationMinutes, bufferMinutes);

    // Bước 4: Lấy danh sách lịch chiếu hiện có để kiểm tra trùng lặp
    const existingShowtimes = await getExistingShowtimes({
      date: norm.date,
      cinemaName: norm.cinemaName,
      room: norm.room,
      isMongoConnected: isMongo,
    });

    const conflict = detectShowtimeConflict({
      cinemaName: norm.cinemaName,
      room: norm.room,
      date: norm.date,
      startMinutes: timeCalc.startMinutes,
      endMinutes: timeCalc.endMinutes,
      existingShowtimes,
    });

    // Nếu phát hiện trùng phòng chiếu & trùng thời gian -> Từ chối tạo và báo lỗi 409
    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        code: 'SHOWTIME_CONFLICT',
        message: conflict.reason,
        overlapDetails: conflict.overlapDetails,
      });
    }

    // Bước 5: Lưu dữ liệu lịch chiếu
    const showtimeData = {
      movieId: movie.id,
      movieTitle: movie.title,
      cinemaId: cinemaId || null,
      cinemaName: norm.cinemaName,
      room: norm.room,
      format,
      date: norm.date,
      startTime: norm.startTime,
      endTime: timeCalc.endTime,
      durationMinutes: movie.durationMinutes,
      bufferMinutes,
      price: Number(price) || 95000,
      status: 'scheduled',
      times: [
        {
          time: norm.startTime,
          price: Number(price) || 95000,
          isAvailable: true,
        },
      ],
    };

    if (isMongo) {
      const created = await Showtime.create(showtimeData);
      return res.status(201).json({
        success: true,
        message: 'Tạo lịch chiếu thành công!',
        data: created,
      });
    } else {
      const created = {
        ...showtimeData,
        _id: `mem_showtime_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
      };
      inMemoryShowtimes.push(created);
      return res.status(201).json({
        success: true,
        message: 'Tạo lịch chiếu thành công (In-Memory)!',
        data: created,
      });
    }
  } catch (error) {
    console.error('Lỗi khi tạo lịch chiếu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo lịch chiếu.',
      error: error.message,
    });
  }
});

/**
 * 3. GET /api/showtimes
 * Lấy danh sách lịch chiếu:
 * - Hỗ trợ view=manage (quản lý): trả về danh sách mảng showtimes đầy đủ
 * - Hỗ trợ view=client (hoặc mặc định cho app di động): trả về cấu trúc dates, cinemas, list
 */
router.get('/', async (req, res) => {
  try {
    const { movieId, cinemaName, date, room, status, manage } = req.query;
    const isMongo = req.app.locals.isMongoConnected;

    let showtimes = [];

    if (isMongo) {
      const filter = {};
      if (movieId) filter.movieId = movieId;
      if (
  date &&
  (manage === 'true' || req.query.view === 'manage' || room)
) {
  filter.date = date;
}
      if (cinemaName) filter.cinemaName = new RegExp(cinemaName.trim(), 'i');
      if (room) filter.room = new RegExp(room.trim(), 'i');
      if (status) filter.status = status;

      showtimes = await Showtime.find(filter).sort({ date: 1, startTime: 1 }).lean();
    } else {
      let result = [...inMemoryShowtimes];
      if (movieId) result = result.filter((s) => s.movieId === movieId);
if (
  date &&
  (manage === 'true' || req.query.view === 'manage' || room)
) {
  result = result.filter((s) => s.date === date);
}      if (cinemaName)
        result = result.filter((s) =>
          s.cinemaName.toLowerCase().includes(cinemaName.trim().toLowerCase())
        );
      if (room)
        result = result.filter((s) =>
          s.room.toUpperCase().includes(room.trim().toUpperCase())
        );
      if (status) result = result.filter((s) => s.status === status);

      showtimes = result;
    }

    // Nếu là truy vấn từ màn hình quản trị / quản lý lịch chiếu
    if (manage === 'true' || req.query.view === 'manage' || room) {
      return res.json({
        success: true,
        count: showtimes.length,
        data: showtimes,
      });
    }

    // Mặc định hoặc cho client app: Đảm bảo tương thích cả dữ liệu chọn rạp của App và danh sách mới
   const now = new Date();
const vietnamToday = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(now);

const availableShowtimes = showtimes.filter((s) => {
  if (s.status !== 'scheduled') return false;
  if (s.date < vietnamToday) return false;

  if (s.date === vietnamToday) {
    const currentTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(now);

    return s.startTime > currentTime;
  }

  return true;
});

const uniqueDates = [...new Set(availableShowtimes.map((s) => s.date))]
  .sort();

const dates = uniqueDates.map((id) => {
  const [year, month, day] = id.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return {
    id,
    dayOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][weekday],
    dayNumber: String(day).padStart(2, '0'),
    label: '',
  };
});

const selectedDate = date || dates[0]?.id || null;

const selectedShowtimes = availableShowtimes.filter(
  (s) => s.date === selectedDate
);

const cinemaMap = new Map();

selectedShowtimes.forEach((s) => {
  const key = `${s.cinemaName}__${s.room}`;

  if (!cinemaMap.has(key)) {
    cinemaMap.set(key, {
      id: key,
      name: s.cinemaName,
      district: s.cinemaDistance || s.cinemaAddress || '',
      room: s.room,
      times: [],
    });
  }

  const cinema = cinemaMap.get(key);

  cinema.times.push({
    time: s.startTime,
    price: s.price,
    isAvailable: true,
  });
});

const cinemas = [...cinemaMap.values()];
return res.json({
  success: true,
  count: availableShowtimes.length,
  data: {
    dates,
    selectedDate,
    cinemas,
    list: selectedShowtimes,
  },
  showtimes: selectedShowtimes,
});
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch chiếu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lịch chiếu.',
      error: error.message,
    });
  }
});
/**
 * 4. GET /api/showtimes/:id
 * Lấy chi tiết một lịch chiếu
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = req.app.locals.isMongoConnected;

    let showtime = null;

    if (isMongo) {
      showtime = await Showtime.findById(id);
    } else {
      showtime = inMemoryShowtimes.find(
        (s) =>
          String(s._id) === String(id) ||
          String(s.id) === String(id)
      );
    }

    if (!showtime) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch chiếu với mã này.',
      });
    }

    return res.json({
      success: true,
      data: showtime,
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết lịch chiếu:', error);

    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết lịch chiếu.',
      error: error.message,
    });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      movieId,
      cinemaName,
      room,
      format,
      date,
      startTime,
      price,
      status,
      bufferMinutes = DEFAULT_BUFFER_MINUTES,
    } = req.body;

    const isMongo = req.app.locals.isMongoConnected;
    const memoryStore = req.app.locals.memoryStore;

    // Tìm lịch chiếu hiện có
    let currentShowtime = null;
    if (isMongo) {
      currentShowtime = await Showtime.findById(id);
    } else {
      currentShowtime = inMemoryShowtimes.find(
        (s) => s._id?.toString() === id || s.id?.toString() === id
      );
    }

    if (!currentShowtime) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch chiếu cần cập nhật.',
      });
    }

    const targetMovieId = movieId || currentShowtime.movieId;
    const targetCinemaName = cinemaName || currentShowtime.cinemaName;
    const targetRoom = room || currentShowtime.room;
    const targetDate = date || currentShowtime.date;
    const targetStartTime = startTime || currentShowtime.startTime;

    // 1. Kiểm tra phim
    const movieValidation = await validateMovieData(targetMovieId, memoryStore);
    if (!movieValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: movieValidation.message,
      });
    }

    // 2. Kiểm tra rạp và phòng chiếu
    const roomValidation = validateCinemaAndRoomData({
      cinemaName: targetCinemaName,
      room: targetRoom,
      date: targetDate,
      startTime: targetStartTime,
    });
    if (!roomValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: roomValidation.message,
      });
    }

    const movie = movieValidation.movie;
    const norm = roomValidation.normalized;
    const timeCalc = calculateEndTime(norm.startTime, movie.durationMinutes, bufferMinutes);

    // 3. Kiểm tra xung đột (loại trừ chính showtime đang sửa)
    const existingShowtimes = await getExistingShowtimes({
      date: norm.date,
      cinemaName: norm.cinemaName,
      room: norm.room,
      isMongoConnected: isMongo,
    });

    const conflict = detectShowtimeConflict({
      cinemaName: norm.cinemaName,
      room: norm.room,
      date: norm.date,
      startMinutes: timeCalc.startMinutes,
      endMinutes: timeCalc.endMinutes,
      excludeShowtimeId: id,
      existingShowtimes,
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        code: 'SHOWTIME_CONFLICT',
        message: conflict.reason,
        overlapDetails: conflict.overlapDetails,
      });
    }

    // 4. Cập nhật dữ liệu
    const updatedFields = {
      movieId: movie.id,
      movieTitle: movie.title,
      cinemaName: norm.cinemaName,
      room: norm.room,
      date: norm.date,
      startTime: norm.startTime,
      endTime: timeCalc.endTime,
      durationMinutes: movie.durationMinutes,
      bufferMinutes,
      times: [
        {
          time: norm.startTime,
          price: price !== undefined ? Number(price) : currentShowtime.price,
          isAvailable: true,
        },
      ],
    };

    if (format) updatedFields.format = format;
    if (price !== undefined) updatedFields.price = Number(price);
    if (status) updatedFields.status = status;

    if (isMongo) {
      const updated = await Showtime.findByIdAndUpdate(id, updatedFields, { new: true });
      return res.json({
        success: true,
        message: 'Cập nhật lịch chiếu thành công!',
        data: updated,
      });
    } else {
      Object.assign(currentShowtime, updatedFields);
      return res.json({
        success: true,
        message: 'Cập nhật lịch chiếu thành công (In-Memory)!',
        data: currentShowtime,
      });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch chiếu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật lịch chiếu.',
      error: error.message,
    });
  }
});

/**
 * 6. DELETE /api/showtimes/:id
 * Xóa lịch chiếu
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = req.app.locals.isMongoConnected;

    if (isMongo) {
      const deleted = await Showtime.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch chiếu để xóa.',
        });
      }
      return res.json({
        success: true,
        message: 'Đã xóa lịch chiếu thành công.',
        deletedId: id,
      });
    } else {
      const index = inMemoryShowtimes.findIndex(
        (s) => s._id?.toString() === id || s.id?.toString() === id
      );
      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy lịch chiếu để xóa.',
        });
      }
      inMemoryShowtimes.splice(index, 1);
      return res.json({
        success: true,
        message: 'Đã xóa lịch chiếu thành công (In-Memory).',
        deletedId: id,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xóa lịch chiếu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa lịch chiếu.',
      error: error.message,
    });
  }
});

module.exports = router;
