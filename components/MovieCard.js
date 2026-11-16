import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const getAgeRatingColor = (rating) => {
  switch (rating) {
    case 'P':
      return '#2ECC71'; // Xanh lá - Mọi lứa tuổi
    case 'K':
      return '#3498DB'; // Xanh dương - Dưới 13 tuổi có người kèm
    case 'T13':
      return '#F39C12'; // Vàng cam - 13+
    case 'T16':
      return '#E67E22'; // Cam - 16+
    case 'T18':
      return '#E74C3C'; // Đỏ - 18+
    default:
      return '#95A5A6';
  }
};

export default function MovieCard({ movie, onPress, onQuickBooking }) {
  if (!movie) return null;

  const ageBgColor = getAgeRatingColor(movie.ageRating);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPress && onPress(movie)}
    >
      {/* POSTER CÓ BADGE ĐỘ TUỔI */}
      <View style={styles.posterContainer}>
        <Image
          source={{ uri: movie.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />

        {/* BADGE ĐỘ TUỔI NỔI BẬT */}
        <View style={[styles.ageBadge, { backgroundColor: ageBgColor }]}>
          <Text style={styles.ageBadgeText}>{movie.ageRating || 'P'}</Text>
        </View>

        {/* BADGE ĐỊNH DẠNG (VD: IMAX, 3D) */}
        {movie.formats && movie.formats.includes('IMAX') && (
          <View style={styles.imaxBadge}>
            <Text style={styles.imaxBadgeText}>IMAX</Text>
          </View>
        )}
      </View>

      {/* THÔNG TIN PHIM */}
      <View style={styles.infoContainer}>
        {/* Tên phim Việt & Anh */}
        <Text style={styles.title} numberOfLines={1}>
          {movie.title}
        </Text>
        <Text style={styles.originalTitle} numberOfLines={1}>
          {movie.originalTitle}
        </Text>

        {/* THÔNG SỐ: THỜI LƯỢNG & ĐIỂM ĐÁNH GIÁ */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaIcon}>⏱️</Text>
            <Text style={styles.metaText}>{movie.duration} phút</Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.starIcon}>★</Text>
            <Text style={styles.ratingText}>
              {movie.rating ? movie.rating.toFixed(1) : '8.0'}
            </Text>
          </View>
        </View>

        {/* THỂ LOẠI */}
        <Text style={styles.genres} numberOfLines={1}>
          🎭 {Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}
        </Text>

        {/* ĐỊNH DẠNG HỖ TRỢ */}
        <View style={styles.formatRow}>
          {movie.formats &&
            movie.formats.map((fmt, idx) => (
              <View key={idx} style={styles.formatChip}>
                <Text style={styles.formatChipText}>{fmt}</Text>
              </View>
            ))}
        </View>

        {/* NÚT ĐẶT VÉ NHANH */}
        <TouchableOpacity
          style={styles.quickBookBtn}
          activeOpacity={0.8}
          onPress={() => onQuickBooking && onQuickBooking(movie)}
        >
          <Text style={styles.quickBookText}>ĐẶT VÉ NHANH</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  posterContainer: {
    width: 110,
    height: 165,
    position: 'relative',
    backgroundColor: '#222222',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  ageBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  imaxBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderWidth: 1,
    borderColor: '#00A8FF',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imaxBadgeText: {
    color: '#00A8FF',
    fontSize: 9,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  originalTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1F0D',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  starIcon: {
    color: '#FFD700',
    fontSize: 12,
    marginRight: 3,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  genres: {
    color: '#9E9E9E',
    fontSize: 11,
    marginBottom: 6,
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  formatChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#3D3D3D',
  },
  formatChipText: {
    color: '#E0E0E0',
    fontSize: 10,
    fontWeight: '600',
  },
  quickBookBtn: {
    backgroundColor: '#E50914',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBookText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
