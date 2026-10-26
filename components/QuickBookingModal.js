import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';

export default function QuickBookingModal({ visible, movie, onClose, onSelectShowtime }) {
  if (!movie) return null;

  // Lấy danh sách ngày chiếu mẫu
  const showtimes = movie.showtimes || [];
  const uniqueDates = [...new Set(showtimes.map((s) => s.date))];
  const defaultDate = uniqueDates.length > 0 ? uniqueDates[0] : 'Hôm nay';

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedFormat, setSelectedFormat] = useState('Tất cả');

  // Lọc showtime theo ngày và định dạng
  const filteredShowtimes = showtimes.filter((st) => {
    const matchDate = !st.date || st.date === selectedDate;
    const matchFormat = selectedFormat === 'Tất cả' || st.format === selectedFormat;
    return matchDate && matchFormat;
  });

  const handleTimePick = (cinema, timeItem) => {
    Alert.alert(
      'Chọn suất chiếu thành công',
      `Phim: ${movie.title}\nRạp: ${cinema.cinemaName}\nĐịnh dạng: ${cinema.format}\nSuất chiếu: ${timeItem.time} (${timeItem.room})\nGiá vé: ${timeItem.price ? timeItem.price.toLocaleString('vi-VN') + 'đ' : 'Tiêu chuẩn'}`,
      [
        {
          text: 'Đóng',
          style: 'cancel',
        },
        {
          text: 'Tiếp tục chọn ghế ›',
          onPress: () => {
            onClose();
            if (onSelectShowtime) {
              onSelectShowtime({
                movie,
                cinemaName: cinema.cinemaName,
                format: cinema.format,
                date: selectedDate,
                time: timeItem.time,
                room: timeItem.room,
                price: timeItem.price,
              });
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

          {/* HEADER MODAL */}
          <View style={styles.header}>
            <View style={styles.movieHeaderRow}>
              <Image source={{ uri: movie.posterUrl }} style={styles.miniPoster} />
              <View style={styles.movieHeaderInfo}>
                <Text style={styles.sheetTitle}>ĐẶT VÉ NHANH</Text>
                <Text style={styles.movieTitle} numberOfLines={1}>
                  {movie.title}
                </Text>
                <Text style={styles.movieSubtitle}>
                  ⏱️ {movie.duration} phút · {movie.ageRating}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* 1. CHỌN NGÀY CHIẾU */}
            <Text style={styles.sectionHeader}>📅 Chọn ngày xem:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {uniqueDates.length > 0 ? (
                uniqueDates.map((dateStr, idx) => {
                  const isSelected = selectedDate === dateStr;
                  const d = new Date(dateStr);
                  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                  const label = !isNaN(d.getTime())
                    ? `${dayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`
                    : dateStr;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.dateChip, isSelected && styles.dateChipActive]}
                      onPress={() => setSelectedDate(dateStr)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipText, isSelected && styles.dateChipTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.dateChipActive}>
                  <Text style={styles.dateChipTextActive}>Hôm nay</Text>
                </View>
              )}
            </ScrollView>

            {/* 2. CHỌN ĐỊNH DẠNG */}
            <Text style={styles.sectionHeader}>🎬 Định dạng chiếu:</Text>
            <View style={styles.formatFilterRow}>
              {['Tất cả', '2D', '3D', 'IMAX'].map((fmt, idx) => {
                const isSelected = selectedFormat === fmt;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.formatBtn, isSelected && styles.formatBtnActive]}
                    onPress={() => setSelectedFormat(fmt)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.formatBtnText, isSelected && styles.formatBtnTextActive]}>
                      {fmt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. DANH SÁCH RẠP & SUẤT CHIẾU */}
            <Text style={styles.sectionHeader}>📍 Rạp & Suất chiếu có sẵn:</Text>
            {filteredShowtimes.length === 0 ? (
              <View style={styles.emptyShowtimeContainer}>
                <Text style={styles.emptyIcon}>🎬</Text>
                <Text style={styles.emptyText}>
                  Hiện chưa có suất chiếu phù hợp cho định dạng này vào ngày đã chọn.
                </Text>
              </View>
            ) : (
              filteredShowtimes.map((cinema, idx) => (
                <View key={idx} style={styles.cinemaCard}>
                  <View style={styles.cinemaCardHeader}>
                    <Text style={styles.cinemaName}>{cinema.cinemaName}</Text>
                    <View style={styles.cinemaFormatBadge}>
                      <Text style={styles.cinemaFormatText}>{cinema.format}</Text>
                    </View>
                  </View>

                  <View style={styles.timeGrid}>
                    {cinema.times &&
                      cinema.times.map((item, tIdx) => (
                        <TouchableOpacity
                          key={tIdx}
                          style={styles.timeSlotBtn}
                          activeOpacity={0.7}
                          onPress={() => handleTimePick(cinema, item)}
                        >
                          <Text style={styles.timeSlotHour}>{item.time}</Text>
                          <Text style={styles.timeSlotPrice}>
                            {item.price ? `${Math.round(item.price / 1000)}k` : 'Ghế'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '82%',
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#282828',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  movieHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniPoster: {
    width: 44,
    height: 60,
    borderRadius: 6,
    marginRight: 12,
  },
  movieHeaderInfo: {
    flex: 1,
  },
  sheetTitle: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  movieSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeBtnText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10,
  },
  dateScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dateChip: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#303030',
  },
  dateChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  dateChipText: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  formatFilterRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  formatBtn: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303030',
  },
  formatBtnActive: {
    backgroundColor: '#2E1517',
    borderColor: '#E50914',
  },
  formatBtnText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '600',
  },
  formatBtnTextActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  emptyShowtimeContainer: {
    backgroundColor: '#181818',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  cinemaCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  cinemaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cinemaName: {
    color: '#EEEEEE',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cinemaFormatBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3C3C3C',
  },
  cinemaFormatText: {
    color: '#00A8FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeSlotBtn: {
    backgroundColor: '#242424',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#383838',
    minWidth: 64,
  },
  timeSlotHour: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  timeSlotPrice: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 2,
  },
});
