const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// GET /api/movies - Tìm kiếm và lọc danh mục phim (AND filter)
router.get('/', async (req, res) => {
  try {
    const { status, search, genre, format, ageRating } = req.query;

    const query = {};

    // 1. Lọc theo trạng thái phim (Đang chiếu / Sắp chiếu)
    if (status && ['NOW_SHOWING', 'COMING_SOON'].includes(status)) {
      query.status = status;
    }

    // 2. Tìm kiếm theo tên Việt/Anh, diễn viên và đạo diễn
    if (search && search.trim()) {
      const term = search.trim();
      // Thoát các ký tự đặc biệt trong regex
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedTerm, 'i');

      query.$or = [
        { title: searchRegex },
        { originalTitle: searchRegex },
        { director: searchRegex },
        { cast: { $elemMatch: { $regex: searchRegex } } },
      ];
    }

    // 3. Bộ lọc kết hợp AND - Thể loại
    if (genre && genre !== 'Tất cả') {
      query.genres = genre;
    }

    // 4. Bộ lọc kết hợp AND - Định dạng (2D, 3D, IMAX)
    if (format && format !== 'Tất cả') {
      query.formats = format;
    }

    // 5. Bộ lọc kết hợp AND - Độ tuổi (P, K, T13, T16, T18)
    if (ageRating && ageRating !== 'Tất cả') {
      query.ageRating = ageRating;
    }

    const movies = await Movie.find(query).sort({ rating: -1, releaseDate: -1 });

    return res.json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh mục phim:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tải danh mục phim.',
      error: error.message,
    });
  }
});

// GET /api/movies/:id - Chi tiết phim (UC_MOVIE_02)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim.',
      });
    }

    return res.json({
      success: true,
      data: movie,
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phim:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy chi tiết phim.',
    });
  }
});

// GET /api/movies/:id/showtimes - Lấy suất chiếu cho phim (UC_MOVIE_03)
router.get('/:id/showtimes', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim.',
      });
    }

    return res.json({
      success: true,
      movieTitle: movie.title,
      posterUrl: movie.posterUrl,
      formats: movie.formats,
      showtimes: movie.showtimes || [],
    });
  } catch (error) {
    console.error('Lỗi khi lấy suất chiếu phim:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy suất chiếu.',
    });
  }
});

module.exports = router;
