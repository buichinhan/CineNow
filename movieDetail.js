import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { fetchMovieDetail } from './api';

export default function MovieDetailScreen({
  movie: initialMovie,
  movieId,
  onBack,
  onBookTicket,
}) {
  const [movie, setMovie] = useState(initialMovie || null);
  const [loading, setLoading] = useState(!initialMovie);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const id = initialMovie?._id || initialMovie?.slug || initialMovie?.id || movieId;
    if (id) {
      fetchMovieDetail(id)
        .then((data) => {
          if (data) setMovie(data);
        })
        .catch((err) => {
          console.warn('Lỗi tải chi tiết phim:', err.message);
        })
        .finally(() => setLoading(false));
    }
  }, [movieId, initialMovie]);

  if (loading && !movie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
        <Text style={styles.loadingText}>Đang tải chi tiết phim...</Text>
      </View>
    );
  }

  const currentMovie = movie || {
    title: 'Hành Tinh Đỏ',
    ageRating: '16+',
    format: '2D - IMAX',
    genre: 'Khoa học viễn tưởng • Phiêu lưu',
    duration: '128 phút',
    rating: '8.8',
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
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>❮</Text>
          <Text style={styles.topBarTitle}>Chi tiết phim</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.heartButton}
          onPress={() => setIsFavorite(!isFavorite)}
          activeOpacity={0.7}
        >
          <Text style={styles.heartIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Backdrop & Trailer Player Header */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: currentMovie.backdrop || currentMovie.poster }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <View style={styles.backdropOverlay} />

          {/* Center Play Button */}
          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Trailer', `Phát trailer ${currentMovie.title}`)}
          >
            <View style={styles.playCircle}>
              <Text style={styles.playTriangle}>▶</Text>
            </View>
          </TouchableOpacity>

          {/* Trailer Duration Badge */}
          <View style={styles.trailerBadge}>
            <Text style={styles.trailerText}>
              XEM TRAILER - {currentMovie.trailerTime || '02:14'}
            </Text>
          </View>
        </View>

        {/* Breadcrumb Steps (Đã bỏ chọn rạp theo yêu cầu: Phim -> Suất -> Ghế -> Combo -> Trả tiền -> Vé QR) */}
        <View style={styles.breadcrumbContainer}>
          <View style={styles.stepItem}>
            <Text style={[styles.stepText, styles.stepActive]}>Phim</Text>
            <View style={styles.stepIndicatorActive} />
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepText}>Suất</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepText}>Ghế</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepText}>Combo</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepText}>Trả tiền</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepText}>Vé QR</Text>
          </View>
        </View>

        {/* Movie Info */}
        <View style={styles.infoSection}>
          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tagRed}>
              <Text style={styles.tagRedText}>{currentMovie.ageRating || '16+'}</Text>
            </View>
            <View style={styles.tagDark}>
              <Text style={styles.tagDarkText}>{currentMovie.format || '2D - IMAX'}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.movieTitle}>{currentMovie.title}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingScore}>⭐ {currentMovie.rating || '8.8'}/10</Text>
            <Text style={styles.voteCount}>{currentMovie.votes || '1.248 đánh giá'}</Text>
          </View>

          {/* Genre and Duration */}
          <Text style={styles.genreDuration}>
            {currentMovie.genre} • {currentMovie.duration}
          </Text>

          {/* Metadata Table */}
          <View style={styles.metaTable}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Khởi chiếu</Text>
              <Text style={styles.metaValue}>{currentMovie.releaseDate || '16.10.2026'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Đạo diễn</Text>
              <Text style={styles.metaValue}>{currentMovie.director || 'Lê Minh Khang'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Diễn viên</Text>
              <Text style={styles.metaValue}>{currentMovie.cast || 'Thanh Vân, Quốc Huy'}</Text>
            </View>
          </View>

          {/* Nội dung phim */}
          <Text style={styles.synopsisHeader}>Nội dung phim</Text>
          <Text style={styles.synopsisText}>{currentMovie.description}</Text>

          {/* Tech Badges */}
          <View style={styles.techBoxesRow}>
            <View style={styles.techBox}>
              <Text style={styles.techBoxLabel}>NGÔN NGỮ</Text>
              <Text style={styles.techBoxValue}>{currentMovie.language || 'Tiếng Việt'}</Text>
            </View>
            <View style={styles.techBox}>
              <Text style={styles.techBoxLabel}>ĐỊNH DẠNG</Text>
              <Text style={styles.techBoxValue}>{currentMovie.format || '2D - IMAX'}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed Bottom Booking Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.85}
          onPress={() => onBookTicket(currentMovie)}
        >
          <Text style={styles.bookTicketIcon}>🎟️</Text>
          <Text style={styles.bookButtonText}>Đặt vé ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    marginTop: 12,
  },
  topBar: {
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11,11,11,0.95)',
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 8,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  heartButton: {
    padding: 6,
  },
  heartIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  backdropContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: '#1C1917',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  playButton: {
    zIndex: 5,
  },
  playCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  playTriangle: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 3,
  },
  trailerBadge: {
    position: 'absolute',
    bottom: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  trailerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '600',
  },
  stepActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  stepIndicatorActive: {
    height: 2,
    width: '100%',
    backgroundColor: '#E50914',
    marginTop: 4,
    borderRadius: 1,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagRed: {
    backgroundColor: '#E50914',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagRedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tagDark: {
    backgroundColor: '#18181B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  tagDarkText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '600',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  ratingScore: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  voteCount: {
    color: '#71717A',
    fontSize: 13,
  },
  genreDuration: {
    color: '#A1A1AA',
    fontSize: 13,
    marginBottom: 16,
  },
  metaTable: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#71717A',
    fontSize: 13,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  synopsisHeader: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  synopsisText: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  techBoxesRow: {
    flexDirection: 'row',
    gap: 14,
  },
  techBox: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  techBoxLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  techBoxValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121214',
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  bookButton: {
    backgroundColor: '#E50914',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTicketIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
