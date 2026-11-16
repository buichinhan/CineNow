import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

export default function MovieDetailScreen({ route, navigation }) {
  // Dữ liệu mẫu (mock data) hiển thị chi tiết phim và kiểm duyệt
  // Sau này bạn có thể thay thế bằng dữ liệu nhận từ API hoặc props (route.params)
  const movie = {
    title: 'Avengers: Endgame',
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    genre: 'Hành động, Viễn tưởng, Phiêu lưu',
    duration: '181 phút',
    releaseDate: '26/04/2019',
    director: 'Anthony Russo, Joe Russo',
    cast: 'Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth',
    language: 'Tiếng Anh - Phụ đề tiếng Việt',
    synopsis:
      'Trận chiến cuối cùng sau khi Thanos quét sạch một nửa vũ trụ trong Infinity War. Các siêu anh hùng còn lại phải tập hợp lại một lần nữa để đảo ngược hành động của Thanos và khôi phục lại trật tự cho vũ trụ.',
    ageRating: 'T13', // Phân loại độ tuổi: Khán giả từ đủ 13 tuổi trở lên
    moderationInfo: 'Phim có chứa các cảnh hành động, bạo lực giả tưởng và ngôn từ không phù hợp với khán giả nhỏ tuổi.',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Poster Phim */}
        <Image source={{ uri: movie.poster }} style={styles.poster} resizeMode="cover" />

        <View style={styles.contentContainer}>
          {/* Tên Phim */}
          <Text style={styles.title}>{movie.title}</Text>

          {/* Thông tin kiểm duyệt & Độ tuổi */}
          <View style={styles.moderationContainer}>
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>{movie.ageRating}</Text>
            </View>
            <Text style={styles.moderationText}>{movie.moderationInfo}</Text>
          </View>

          {/* Thông tin chung */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thể loại:</Text>
            <Text style={styles.value}>{movie.genre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời lượng:</Text>
            <Text style={styles.value}>{movie.duration}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngày khởi chiếu:</Text>
            <Text style={styles.value}>{movie.releaseDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Đạo diễn:</Text>
            <Text style={styles.value}>{movie.director}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Diễn viên:</Text>
            <Text style={styles.value}>{movie.cast}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngôn ngữ:</Text>
            <Text style={styles.value}>{movie.language}</Text>
          </View>

          {/* Nội dung phim */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nội dung phim</Text>
            <Text style={styles.synopsisText}>{movie.synopsis}</Text>
          </View>

          {/* Nút chuyển sang màn hình chọn suất chiếu */}
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => {
              // Điều hướng sang màn hình chọn suất chiếu (nếu đã tích hợp stack navigator)
              // navigation.navigate('Showtime', { movieId: movie.id });
              alert('Chuyển đến màn hình chọn suất chiếu!');
            }}
          >
            <Text style={styles.bookButtonText}>ĐẶT VÉ NGAY</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  poster: {
    width: '100vw',
    height: 400,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  moderationContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#E50914',
  },
  ageBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  moderationText: {
    flex: 1,
    color: '#AAAAAA',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 120,
    color: '#888888',
    fontSize: 14,
  },
  value: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  synopsisText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#E50914',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});