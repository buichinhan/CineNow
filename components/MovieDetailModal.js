import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const getAgeRatingColor = (rating) => {
  switch (rating) {
    case 'P':
      return '#2ECC71';
    case 'K':
      return '#3498DB';
    case 'T13':
      return '#F39C12';
    case 'T16':
      return '#E67E22';
    case 'T18':
      return '#E74C3C';
    default:
      return '#95A5A6';
  }
};

export default function MovieDetailModal({ visible, movie, onClose, onBookNow }) {
  if (!movie) return null;

  const ageBgColor = getAgeRatingColor(movie.ageRating);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

        {/* NÚT ĐÓNG */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* BANNER / POSTER HEADER */}
          <View style={styles.bannerContainer}>
            <Image
              source={{ uri: movie.bannerUrl || movie.posterUrl }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay} />

            {/* POSTER NỔI */}
            <View style={styles.floatingPosterContainer}>
              <Image source={{ uri: movie.posterUrl }} style={styles.floatingPoster} />
              <View style={[styles.ageBadge, { backgroundColor: ageBgColor }]}>
                <Text style={styles.ageBadgeText}>{movie.ageRating || 'P'}</Text>
              </View>
            </View>
          </View>

          {/* TIÊU ĐỀ & ĐIỂM SỐ */}
          <View style={styles.contentBody}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.originalTitle}>{movie.originalTitle}</Text>

            {/* RATING & STATS */}
            <View style={styles.statsRow}>
              <View style={styles.ratingBadge}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.ratingText}>{movie.rating ? movie.rating.toFixed(1) : '8.0'}</Text>
                <Text style={styles.ratingMax}>/10</Text>
              </View>

              <View style={styles.statChip}>
                <Text style={styles.statChipText}>⏱️ {movie.duration} phút</Text>
              </View>

              <View style={styles.statChip}>
                <Text style={styles.statChipText}>
                  {movie.status === 'NOW_SHOWING' ? '🟢 Đang chiếu' : '⏳ Sắp chiếu'}
                </Text>
              </View>
            </View>

            {/* ĐỊNH DẠNG */}
            <View style={styles.formatRow}>
              <Text style={styles.formatLabel}>Định dạng hỗ trợ:</Text>
              {movie.formats &&
                movie.formats.map((fmt, i) => (
                  <View key={i} style={styles.formatTag}>
                    <Text style={styles.formatTagText}>{fmt}</Text>
                  </View>
                ))}
            </View>

            {/* THÔNG TIN CHI TIẾT */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Đạo diễn:</Text>
                <Text style={styles.infoValue}>{movie.director || 'Chưa cập nhật'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diễn viên:</Text>
                <Text style={styles.infoValue}>
                  {Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || 'Chưa cập nhật'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Thể loại:</Text>
                <Text style={styles.infoValue}>
                  {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Khởi chiếu:</Text>
                <Text style={styles.infoValue}>
                  {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN') : 'Sắp chiếu'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngôn ngữ:</Text>
                <Text style={styles.infoValue}>{movie.language || 'Tiếng Việt'}</Text>
              </View>
            </View>

            {/* TÓM TẮT NỘI DUNG */}
            <Text style={styles.sectionTitle}>Nội Dung Phim</Text>
            <Text style={styles.synopsisText}>{movie.synopsis || 'Đang cập nhật nội dung...'}</Text>
          </View>
        </ScrollView>

        {/* NÚT FOOTER ĐẶT VÉ */}
        <View style={styles.footerBar}>
          <TouchableOpacity
            style={styles.bookNowBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              onBookNow && onBookNow(movie);
            }}
          >
            <Text style={styles.bookNowBtnText}>
              {movie.status === 'NOW_SHOWING' ? '🎟️ ĐẶT VÉ NGAY' : '🔔 XEM SUẤT CHIẾU SỚM'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 99,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerContainer: {
    width: '100%',
    height: height * 0.3,
    position: 'relative',
    backgroundColor: '#1E1E1E',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 11, 11, 0.45)',
  },
  floatingPosterContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 90,
    height: 135,
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E50914',
  },
  floatingPoster: {
    width: '100%',
    height: '100%',
  },
  ageBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentBody: {
    marginTop: 50,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  originalTitle: {
    color: '#8E8E93',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1F0D',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
  },
  starIcon: {
    color: '#FFD700',
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ratingMax: {
    color: '#A08020',
    fontSize: 11,
    marginLeft: 2,
  },
  statChip: {
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#303030',
  },
  statChipText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formatLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginRight: 8,
  },
  formatTag: {
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  formatTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#161616',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 13,
    width: 90,
  },
  infoValue: {
    color: '#E0E0E0',
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  synopsisText: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 22,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141414',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  bookNowBtn: {
    backgroundColor: '#E50914',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
