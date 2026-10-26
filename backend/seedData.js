const INITIAL_MOVIES = [
  {
    slug: 'hanh-tinh-do',
    title: 'Hành Tinh Đỏ',
    badge: 'Nổi bật',
    ageRating: '16+',
    format: '2D - IMAX',
    genre: 'Khoa học viễn tưởng • Phiêu lưu',
    duration: '128 phút',
    rating: 8.8,
    votes: '1.248 đánh giá',
    releaseDate: '16.10.2026',
    director: 'Lê Minh Khang',
    cast: 'Thanh Vân, Quốc Huy',
    language: 'Tiếng Việt',
    trailerTime: '02:14',
    description:
      'Năm 2086, phi hành gia An trở thành hy vọng cuối cùng của đoàn thám hiểm Sao Hỏa sau một tín hiệu bí ẩn làm thay đổi mọi quy luật về thời gian. Một lựa chọn duy nhất có thể cứu Trái Đất — hoặc xóa sổ nó mãi mãi.',
    poster:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
    status: 'now_showing',
    isFeatured: true,
  },
  {
    slug: 'ke-giu-thoi-gian',
    title: 'Kẻ Giữ Thời Gian',
    badge: 'Hot',
    ageRating: '13+',
    format: '2D Digital',
    genre: 'Hành động • Viễn tưởng',
    duration: '116 phút',
    rating: 8.4,
    votes: '956 đánh giá',
    releaseDate: '18.10.2026',
    director: 'Trần Vũ Hoàng',
    cast: 'Tuấn Khang, Mai Chi',
    language: 'Phụ đề Tiếng Việt',
    trailerTime: '01:52',
    description:
      'Một thợ sửa đồng hồ vô tình khám phá ra chiếc máy có khả năng đảo ngược thời gian và bước vào cuộc chiến không hồi kết với thế lực bóng đêm.',
    poster:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    status: 'now_showing',
    isFeatured: false,
  },
  {
    slug: 'mua-he-cuoi',
    title: 'Mùa Hè Cuối',
    badge: 'Sắp chiếu',
    ageRating: 'P',
    format: '2D',
    genre: 'Tình cảm',
    duration: '105 phút',
    rating: 8.0,
    votes: 'Chưa có đánh giá',
    releaseDate: '20.10.2026',
    director: 'Nguyễn Hoàng Nam',
    cast: 'Lan Ngọc, Bình An',
    language: 'Tiếng Việt',
    trailerTime: '02:00',
    description:
      'Câu chuyện tình yêu đầy nuối tiếc nhưng đong đầy cảm xúc của đôi bạn trẻ trước ngưỡng cửa trưởng thành trong mùa hè rực rỡ cuối cùng bên nhau.',
    poster:
      'https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?auto=format&fit=crop&w=800&q=80',
    backdrop:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    status: 'upcoming',
    isFeatured: false,
  },
];

const INITIAL_CINEMAS = [
  {
    name: 'CineNow Landmark 81',
    address: 'Tầng B1, Landmark 81, 720A Điện Biên Phủ, Bình Thạnh',
    district: 'Bình Thạnh',
    distance: '1,2 km',
    city: 'TP. Hồ Chí Minh',
  },
  {
    name: 'CineNow Vincom Đồng Khởi',
    address: 'Tầng 5, 72 Lê Thánh Tôn, Bến Nghé, Quận 1',
    district: 'Quận 1',
    distance: '2,8 km',
    city: 'TP. Hồ Chí Minh',
  },
  {
    name: 'CineNow Pearl Plaza',
    address: '561A Điện Biên Phủ, Phường 25, Bình Thạnh',
    district: 'Bình Thạnh',
    distance: '3,4 km',
    city: 'TP. Hồ Chí Minh',
  },
];

const SHOWTIME_DATES = [
  { id: '2026-10-16', dayOfWeek: 'T4', dayNumber: '16', label: 'Hôm nay' },
  { id: '2026-10-17', dayOfWeek: 'T5', dayNumber: '17', label: '' },
  { id: '2026-10-18', dayOfWeek: 'T6', dayNumber: '18', label: '' },
  { id: '2026-10-19', dayOfWeek: 'T7', dayNumber: '19', label: '' },
  { id: '2026-10-20', dayOfWeek: 'CN', dayNumber: '20', label: '' },
];

const SHOWTIME_CINEMAS = [
  {
    id: 'cinema-landmark-81',
    name: 'CineNow Landmark 81',
    district: 'Bình Thạnh • 1,2 km',
    room: '2D PHỤ ĐỀ - PHÒNG 03',
    times: [
      { time: '09:00', price: 95000, isAvailable: true },
      { time: '11:30', price: 95000, isAvailable: true },
      { time: '14:00', price: 95000, isAvailable: true },
      { time: '16:30', price: 95000, isAvailable: true },
      { time: '19:00', price: 95000, isAvailable: true },
      { time: '21:30', price: 95000, isAvailable: false },
    ],
  },
  {
    id: 'cinema-vincom-dong-khoi',
    name: 'CineNow Vincom Đồng Khởi',
    district: 'Quận 1 • 2,8 km',
    room: '2D PHỤ ĐỀ - PHÒNG 03',
    times: [
      { time: '09:00', price: 95000, isAvailable: true },
      { time: '11:30', price: 95000, isAvailable: true },
      { time: '14:00', price: 95000, isAvailable: true },
      { time: '16:30', price: 95000, isAvailable: true },
      { time: '19:00', price: 95000, isAvailable: true },
      { time: '21:30', price: 95000, isAvailable: true },
    ],
  },
];

const INITIAL_SEAT_LAYOUT = {
  rows: [
    {
      row: 'A',
      type: 'standard',
      price: 85000,
      seats: [
        { id: 'A1', number: '1', status: 'available' },
        { id: 'A2', number: '2', status: 'available' },
        { id: 'A3', number: '3', status: 'available' },
        { id: 'A4', number: '4', status: 'available' },
        { id: 'A5', number: '5', status: 'available' },
        { id: 'A6', number: '6', status: 'available' },
        { id: 'A7', number: '7', status: 'available' },
        { id: 'A8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'B',
      type: 'standard',
      price: 85000,
      seats: [
        { id: 'B1', number: '1', status: 'available' },
        { id: 'B2', number: '2', status: 'available' },
        { id: 'B3', number: '3', status: 'available' },
        { id: 'B4', number: '4', status: 'available' },
        { id: 'B5', number: '5', status: 'available' },
        { id: 'B6', number: '6', status: 'available' },
        { id: 'B7', number: '7', status: 'booked' },
        { id: 'B8', number: '8', status: 'booked' },
      ],
    },
    {
      row: 'C',
      type: 'vip',
      price: 95000,
      seats: [
        { id: 'C1', number: '1', status: 'available' },
        { id: 'C2', number: '2', status: 'available' },
        { id: 'C3', number: '3', status: 'available' },
        { id: 'C4', number: '4', status: 'available' },
        { id: 'C5', number: '5', status: 'available' },
        { id: 'C6', number: '6', status: 'available' },
        { id: 'C7', number: '7', status: 'available' },
        { id: 'C8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'D',
      type: 'vip',
      price: 95000,
      seats: [
        { id: 'D1', number: '1', status: 'available' },
        { id: 'D2', number: '2', status: 'available' },
        { id: 'D3', number: '3', status: 'available' },
        { id: 'D4', number: '4', status: 'available' },
        { id: 'D5', number: '5', status: 'booked' },
        { id: 'D6', number: '6', status: 'booked' },
        { id: 'D7', number: '7', status: 'available' },
        { id: 'D8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'E',
      type: 'vip',
      price: 95000,
      seats: [
        { id: 'E1', number: '1', status: 'available' },
        { id: 'E2', number: '2', status: 'available' },
        { id: 'E3', number: '3', status: 'available' },
        { id: 'E4', number: '4', status: 'available' },
        { id: 'E5', number: '5', status: 'available' },
        { id: 'E6', number: '6', status: 'available' },
        { id: 'E7', number: '7', status: 'available' },
        { id: 'E8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'F',
      type: 'sweetbox',
      price: 190000,
      seats: [
        { id: 'F1-2', number: 'F1-2', status: 'available', isDouble: true },
        { id: 'F3-4', number: 'F3-4', status: 'available', isDouble: true },
        { id: 'F5-6', number: 'F5-6', status: 'booked', isDouble: true },
        { id: 'F7-8', number: 'F7-8', status: 'available', isDouble: true },
      ],
    },
  ],
};

module.exports = {
  INITIAL_MOVIES,
  INITIAL_CINEMAS,
  SHOWTIME_DATES,
  SHOWTIME_CINEMAS,
  INITIAL_SEAT_LAYOUT,
};
