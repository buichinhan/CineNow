
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Movie = require("../models/Movie");
const Showtime = require("../models/Showtime");
const Booking = require("../models/Booking");
const { requireAuth, requireAdmin } = require("../middleware/adminAuth");

const VALID_STATUSES = [
  "NOW_SHOWING",
  "COMING_SOON",
  "ENDED",
];

function normalizeStatus(value) {
  const status = String(value || "").trim();

  if (["NOW_SHOWING", "now_showing"].includes(status)) {
    return "NOW_SHOWING";
  }

  if (["COMING_SOON", "upcoming"].includes(status)) {
    return "COMING_SOON";
  }

  if (["ENDED", "ended"].includes(status)) {
    return "ENDED";
  }

  return null;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAdminManage(req) {
  return req.query.manage === "true";
}

function adminOnly(req, res, next) {
  return requireAuth(req, res, (error) => {
    if (error) return next(error);
    return requireAdmin(req, res, next);
  });
}

function isValidUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function validateMovie(body, isCreate = false) {
  const errors = [];

  if (
    (isCreate || body.title !== undefined) &&
    !String(body.title || "").trim()
  ) {
    errors.push("TĂªn phim khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.");
  }

  if (body.duration !== undefined) {
    const duration = Number(body.duration);

    if (!Number.isInteger(duration) || duration <= 0) {
      errors.push("Thá»i lÆ°á»£ng pháº£i lĂ  sá»‘ phĂºt há»£p lá»‡.");
    }
  }

  if (body.status !== undefined && !normalizeStatus(body.status)) {
    errors.push("Tráº¡ng thĂ¡i phim khĂ´ng há»£p lá»‡.");
  }

  if (
    body.releaseDate !== undefined &&
    body.releaseDate !== "" &&
    Number.isNaN(Date.parse(body.releaseDate))
  ) {
    errors.push("NgĂ y phĂ¡t hĂ nh khĂ´ng há»£p lá»‡.");
  }

  for (const field of ["posterUrl", "bannerUrl", "trailerUrl"]) {
    if (body[field] !== undefined && !isValidUrl(body[field])) {
      errors.push(`${field} pháº£i lĂ  URL HTTP hoáº·c HTTPS há»£p lá»‡.`);
    }
  }

  for (const field of ["genres", "formats", "cast"]) {
    if (
      body[field] !== undefined &&
      !Array.isArray(body[field]) &&
      typeof body[field] !== "string"
    ) {
      errors.push(`${field} pháº£i lĂ  danh sĂ¡ch hoáº·c chuá»—i.`);
    }
  }

  return errors;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildMoviePayload(body) {
  const allowedFields = [
    "title",
    "originalTitle",
    "director",
    "language",
    "ageRating",
    "posterUrl",
    "bannerUrl",
    "trailerUrl",
    "synopsis",
    "isFeatured",
  ];

  const payload = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  if (body.title !== undefined) {
    payload.title = String(body.title).trim();
  }

  if (body.duration !== undefined) {
    payload.duration = Number(body.duration);
  }

  if (body.releaseDate !== undefined) {
    payload.releaseDate = body.releaseDate;
  }

  if (body.status !== undefined) {
    payload.status = normalizeStatus(body.status);
  }

  for (const field of ["genres", "formats", "cast"]) {
    if (body[field] !== undefined) {
      payload[field] = toArray(body[field]);
    }
  }

  // Äá»“ng bá»™ cĂ¡c trÆ°á»ng mĂ  Mobile cÅ© Ä‘ang sá»­ dá»¥ng.
  if (payload.posterUrl !== undefined) {
    payload.poster = payload.posterUrl;
  }

  if (payload.bannerUrl !== undefined) {
    payload.backdrop = payload.bannerUrl;
  }

  if (payload.synopsis !== undefined) {
    payload.description = payload.synopsis;
  }

  if (payload.genres !== undefined) {
    payload.genre = payload.genres[0] || "";
  }

  if (payload.formats !== undefined) {
    payload.format = payload.formats.join(" - ");
  }

  return payload;
}

// GET /api/movies
// Public: khĂ´ng tráº£ vá» phim Ä‘Ă£ ngá»«ng chiáº¿u.
// Admin ?manage=true: xem toĂ n bá»™ phim.
router.get('/', async (req, res) => {

    if (req.query.manage === "true") {
      return adminOnly(req, res, async () => {
        try {
          const movies = await Movie.find({})
            .sort({ rating: -1, releaseDate: -1 });

          return res.json({
            success: true,
            count: movies.length,
            data: movies,
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            message: "Cannot load admin movies.",
          });
        }
      });
    }

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
router.post("/", adminOnly, async (req, res) => {
  try {
    const errors = validateMovie(req.body, true);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    const payload = buildMoviePayload(req.body);

    const movie = await Movie.create({
      ...payload,
      status: payload.status || "COMING_SOON",
    });

    return res.status(201).json({
      success: true,
      message: "ThĂªm phim thĂ nh cĂ´ng.",
      data: movie,
    });
  } catch (error) {
    console.error("POST movie:", error);

    return res.status(500).json({
      success: false,
      message: "KhĂ´ng thá»ƒ thĂªm phim.",
    });
  }
});

// PUT /api/movies/:id
router.put("/:id", adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID phim khĂ´ng há»£p lá»‡.",
      });
    }

    const errors = validateMovie(req.body);

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors.join(" "),
      });
    }

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "KhĂ´ng tĂ¬m tháº¥y phim.",
      });
    }

    Object.assign(movie, buildMoviePayload(req.body));

    await movie.save();

    return res.json({
      success: true,
      message: "Cáº­p nháº­t phim thĂ nh cĂ´ng.",
      data: movie,
    });
  } catch (error) {
    console.error("PUT movie:", error);

    return res.status(500).json({
      success: false,
      message: "KhĂ´ng thá»ƒ cáº­p nháº­t phim.",
    });
  }
});

// PATCH /api/movies/:id/status
router.patch("/:id/status", adminOnly, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID phim khĂ´ng há»£p lá»‡.",
      });
    }

    const status = normalizeStatus(req.body.status);

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Tráº¡ng thĂ¡i phim khĂ´ng há»£p lá»‡.",
      });
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "KhĂ´ng tĂ¬m tháº¥y phim.",
      });
    }

    return res.json({
      success: true,
      message: "ÄĂ£ cáº­p nháº­t tráº¡ng thĂ¡i phim.",
      data: movie,
    });
  } catch (error) {
    console.error("PATCH movie status:", error);

    return res.status(500).json({
      success: false,
      message: "KhĂ´ng thá»ƒ Ä‘á»•i tráº¡ng thĂ¡i phim.",
    });
  }
});

// DELETE /api/movies/:id
// KhĂ´ng xĂ³a náº¿u phim cĂ²n suáº¥t chiáº¿u nhĂºng hoáº·c cĂ³ vĂ© Ä‘áº·t.

router.delete("/:id", adminOnly, (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Permanent deletion is temporarily disabled.",
  });
});

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
