require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinenow';

// Tạo danh sách ngày chiếu mẫu: Hôm nay, ngày mai, ngày mốt
const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];

const dateToday = formatDate(today);
const dateTomorrow = formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000));
const dateDayAfter = formatDate(new Date(today.getTime() + 48 * 60 * 60 * 1000));

const sampleShowtimes = [
  {
    cinemaName: 'CineNow Landmark 81',
    format: 'IMAX',
    date: dateToday,
    times: [
      { time: '10:15', price: 160000, room: 'Phòng IMAX Laser 01' },
      { time: '13:45', price: 180000, room: 'Phòng IMAX Laser 01' },
      { time: '17:30', price: 210000, room: 'Phòng IMAX Laser 01' },
      { time: '20:45', price: 210000, room: 'Phòng IMAX Laser 01' },
    ],
  },
  {
    cinemaName: 'CineNow Vincom Đồng Khởi',
    format: '2D',
    date: dateToday,
    times: [
      { time: '09:30', price: 95000, room: 'Cinema 03 (Dolby Atmos)' },
      { time: '12:00', price: 110000, room: 'Cinema 03 (Dolby Atmos)' },
      { time: '15:15', price: 110000, room: 'Cinema 03 (Dolby Atmos)' },
      { time: '18:30', price: 125000, room: 'Cinema 03 (Dolby Atmos)' },
      { time: '21:15', price: 125000, room: 'Cinema 03 (Dolby Atmos)' },
    ],
  },
  {
    cinemaName: 'CineNow Crescent Mall Q7',
    format: '3D',
    date: dateTomorrow,
    times: [
      { time: '11:00', price: 130000, room: 'Screen 05' },
      { time: '14:30', price: 145000, room: 'Screen 05' },
      { time: '19:00', price: 160000, room: 'Screen 05' },
    ],
  },
];

const sampleMovies = [
  // --- PHIM ĐANG CHIẾU (NOW_SHOWING) ---
  {
    title: 'Lật Mặt 7: Một Điều Ước',
    originalTitle: 'Face Off 7: One Wish',
    director: 'Lý Hải',
    cast: ['Thanh Hiền', 'Trương Minh Cường', 'Đinh Y Nhung', 'Quách Ngọc Tuyên', 'Trần Kim Hải'],
    genres: ['Tình cảm', 'Hài'],
    formats: ['2D'],
    ageRating: 'K',
    duration: 138,
    rating: 9.2,
    votesCount: 3420,
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    synopsis: 'Câu chuyện cảm động về bà Hai 73 tuổi cùng 5 người con đã trưởng thành. Biến cố xảy đến khi bà Hai gặp tai nạn, buộc những người con phải đối diện với tình cảm gia đình và trách nhiệm phụng dưỡng mẹ già.',
    releaseDate: new Date('2024-04-26'),
    status: 'NOW_SHOWING',
    language: 'Tiếng Việt - Phụ đề Tiếng Anh',
    showtimes: sampleShowtimes,
  },
  {
    title: 'Dune: Hành Tinh Cát - Phần 2',
    originalTitle: 'Dune: Part Two',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
    genres: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
    formats: ['2D', 'IMAX'],
    ageRating: 'T16',
    duration: 166,
    rating: 9.0,
    votesCount: 5210,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    synopsis: 'Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy hoại gia tộc mình. Đứng trước sự lựa chọn giữa tình yêu và số phận vũ trụ, anh phải ngăn chặn một tương lai đen tối chỉ mình thấy trước.',
    releaseDate: new Date('2024-03-01'),
    status: 'NOW_SHOWING',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    showtimes: sampleShowtimes,
  },
  {
    title: 'Godzilla x Kong: Đế Chế Mới',
    originalTitle: 'Godzilla x Kong: The New Empire',
    director: 'Adam Wingard',
    cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens', 'Kaylee Hottle'],
    genres: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
    formats: ['2D', '3D', 'IMAX'],
    ageRating: 'T13',
    duration: 115,
    rating: 8.4,
    votesCount: 2980,
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=lV1OOlGwExg',
    synopsis: 'Kong và Godzilla bất ngờ phải tạm gác lại mối thù để liên minh chống lại một hiểm họa khổng lồ bí ẩn trỗi dậy từ sâu thẳm Trái Đất Rỗng, đe dọa sự sống còn của cả nhân loại và loài Titan.',
    releaseDate: new Date('2024-03-29'),
    status: 'NOW_SHOWING',
    language: 'Tiếng Anh - Phụ đề & Lồng tiếng',
    showtimes: sampleShowtimes,
  },
  {
    title: 'Kung Fu Panda 4',
    originalTitle: 'Kung Fu Panda 4',
    director: 'Mike Mitchell',
    cast: ['Jack Black', 'Awkwafina', 'Viola Davis', 'Dustin Hoffman', 'Bryan Cranston'],
    genres: ['Hoạt hình', 'Hành động', 'Hài'],
    formats: ['2D', '3D'],
    ageRating: 'P',
    duration: 94,
    rating: 8.3,
    votesCount: 1850,
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
    synopsis: 'Po được chọn trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên và cần tìm một Thần Long Đại Hiệp kế vị. Cùng lúc đó, mụ phù thủy tắc kè hoa Tắc Kè Biến Hình đe dọa đánh cắp võ công của tất cả ác nhân.',
    releaseDate: new Date('2024-03-08'),
    status: 'NOW_SHOWING',
    language: 'Tiếng Việt Lồng tiếng & Phụ đề',
    showtimes: sampleShowtimes,
  },
  {
    title: 'Quỷ Cẩu',
    originalTitle: 'The Hound',
    director: 'Lưu Thành Luân',
    cast: ['Quang Tuấn', 'NSND Kim Xuân', 'Vân Dung', 'Nam Thư', 'Mie'],
    genres: ['Kinh dị'],
    formats: ['2D'],
    ageRating: 'T18',
    duration: 108,
    rating: 8.1,
    votesCount: 2100,
    posterUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=example',
    synopsis: 'Lấy cảm hứng từ truyền thuyết linh dị chó đội nón mê dân gian. Sau cái chết đột ngột của người cha làm nghề mổ chó, gia đình Nam liên tiếp gặp phải những hiện tượng kỳ quái rùng rợn và nghiệp báo oan nghiệt.',
    releaseDate: new Date('2023-12-29'),
    status: 'NOW_SHOWING',
    language: 'Tiếng Việt',
    showtimes: sampleShowtimes,
  },

  // --- PHIM SẮP CHIẾU (COMING_SOON) ---
  {
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Morena Baccarin'],
    genres: ['Hành động', 'Hài', 'Khoa học viễn tưởng'],
    formats: ['2D', '3D', 'IMAX'],
    ageRating: 'T18',
    duration: 127,
    rating: 9.3,
    votesCount: 8400,
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    synopsis: 'Cơ quan Phương sai Thời gian (TVA) lôi kéo gã phản anh hùng mồm mép Deadpool vào một sứ mệnh lớn lao, buộc anh phải hợp tác cùng Người Sói Wolverine huyền thoại để cứu lấy vũ trụ.',
    releaseDate: new Date('2024-07-26'),
    status: 'COMING_SOON',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    showtimes: [],
  },
  {
    title: 'Những Mảnh Ghép Cảm Xúc 2',
    originalTitle: 'Inside Out 2',
    director: 'Kelsey Mann',
    cast: ['Amy Poehler', 'Maya Hawke', 'Phyllis Smith', 'Lewis Black', 'Tony Hale'],
    genres: ['Hoạt hình', 'Hài', 'Tình cảm'],
    formats: ['2D', '3D'],
    ageRating: 'P',
    duration: 96,
    rating: 8.9,
    votesCount: 4120,
    posterUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    synopsis: 'Riley bước vào tuổi dậy thì và Trụ sở Não bộ bất ngờ đón nhận một cuộc cải tổ với sự xuất hiện của những cảm xúc hoàn toàn mới: Lo Âu (Anxiety), Ganh Tị, Xấu Hổ và Chán Nản.',
    releaseDate: new Date('2024-06-14'),
    status: 'COMING_SOON',
    language: 'Tiếng Việt Lồng tiếng & Phụ đề',
    showtimes: [],
  },
  {
    title: 'Kẻ Trộm Mặt Trăng 4',
    originalTitle: 'Despicable Me 4',
    director: 'Chris Renaud',
    cast: ['Steve Carell', 'Kristen Wiig', 'Will Ferrell', 'Sofia Vergara', 'Joey King'],
    genres: ['Hoạt hình', 'Hài', 'Phiêu lưu'],
    formats: ['2D', '3D'],
    ageRating: 'P',
    duration: 95,
    rating: 8.5,
    votesCount: 2300,
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=LtNYaH61dXY',
    synopsis: 'Gru và Lucy cùng ba cô con gái Margo, Edith, Agnes chào đón thành viên mới Gru Jr. Cả gia đình buộc phải chạy trốn khi tên phản diện nguy hiểm Maxime Le Mal vượt ngục cùng bạn gái Valentina để báo thù.',
    releaseDate: new Date('2024-07-05'),
    status: 'COMING_SOON',
    language: 'Tiếng Việt Lồng tiếng & Phụ đề',
    showtimes: [],
  },
  {
    title: 'Furiosa: Câu Chuyện Từ Max Điên',
    originalTitle: 'Furiosa: A Mad Max Saga',
    director: 'George Miller',
    cast: ['Anya Taylor-Joy', 'Chris Hemsworth', 'Tom Burke', 'Lachy Hulme'],
    genres: ['Hành động', 'Khoa học viễn tưởng', 'Phiêu lưu'],
    formats: ['2D', 'IMAX'],
    ageRating: 'T18',
    duration: 148,
    rating: 8.7,
    votesCount: 3100,
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=XJMuhwVlca4',
    synopsis: 'Khi thế giới sụp đổ, cô gái trẻ Furiosa bị cướp khỏi Nơi Xanh của Nhiều Bà Mẹ và rơi vào tay Băng đảng Xe máy Vĩ đại do Warlord Dementus cầm đầu. Cô phải tìm đường trở về nhà qua Vùng Đất Hoang tàn khốc.',
    releaseDate: new Date('2024-05-24'),
    status: 'COMING_SOON',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    showtimes: [],
  },
];

async function seedMovies() {
  try {
    console.log('Đang kết nối MongoDB để nạp dữ liệu phim...');
    await mongoose.connect(MONGODB_URI);
    console.log('Kết nối MongoDB thành công!');

    for (const item of sampleMovies) {
      await Movie.findOneAndUpdate(
        { originalTitle: item.originalTitle },
        { $set: item },
        { upsert: true, new: true }
      );
      console.log(`✓ Đã nạp phim: [${item.status}] ${item.title} (${item.originalTitle})`);
    }

    console.log('\n=== KHỞI TẠO DANH MỤC PHIM THÀNH CÔNG ===');
  } catch (error) {
    console.error('Lỗi khi nạp dữ liệu phim:', error);
  }
}

module.exports = { seedMovies, sampleMovies };

if (require.main === module) {
  seedMovies().then(() => process.exit(0)).catch(() => process.exit(1));
}
