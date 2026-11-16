import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MovieModeration({ ageRating, moderationInfo }) {
  // Hàm xác định màu sắc nhãn độ tuổi theo chuẩn kiểm duyệt
  const getBadgeColor = (rating) => {
    switch (rating?.toUpperCase()) {
      case 'P':
        return '#28a745'; // Phí mọi lứa tuổi (Xanh lá)
      case 'T13':
        return '#ffc107'; // Khán giả từ đủ 13 tuổi trở lên (Vàng)
      case 'T16':
        return '#fd7e14'; // Khán giả từ đủ 16 tuổi trở lên (Cam)
      case 'T18':
        return '#dc3545'; // Khán giả từ đủ 18 tuổi trở lên (Đỏ)
      default:
        return '#6c757d'; // Mặc định (Xám)
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Thông tin kiểm duyệt</Text>
        <View style={[styles.ageBadge, { backgroundColor: getBadgeColor(ageRating) }]}>
          <Text style={styles.ageBadgeText}>{ageRating || 'P'}</Text>
        </View>
      </View>
      
      <View style={styles.contentBox}>
        <Text style={styles.moderationText}>
          {moderationInfo || 'Phim được phép phổ biến đến người xem theo quy định phân loại độ tuổi.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ageBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  contentBox: {
    marginTop: 4,
  },
  moderationText: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
  },
});