import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { fetchShowtimes } from './api';
import ShowtimeConflictModal from './components/ShowtimeConflictModal';

// Danh sách rạp & suất chiếu chuẩn CineNow theo đúng thiết kế
const DEFAULT_CINEMAS = [
  {
    id: 'cinema-landmark-81',
    name: 'CineNow Landmark 81',
    district: 'Bình Thạnh • 1,2 km',
    room: '2D PHỤ ĐỀ • PHÒNG 03',
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
    room: '2D PHỤ ĐỀ • PHÒNG 03',
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

// Danh sách 5 ngày chuẩn như ảnh: T4 16 (Hôm nay), T5 17, T6 18, T7 19, CN 20
const FIXED_DATES = [
  { id: '2026-10-16', dayOfWeek: 'T4', dayNumber: '16', label: 'Hôm nay' },
  { id: '2026-10-17', dayOfWeek: 'T5', dayNumber: '17', label: '' },
  { id: '2026-10-18', dayOfWeek: 'T6', dayNumber: '18', label: '' },
  { id: '2026-10-19', dayOfWeek: 'T7', dayNumber: '19', label: '' },
  { id: '2026-10-20', dayOfWeek: 'CN', dayNumber: '20', label: '' },
];

export default function ShowtimeScreen({
  movie,
  onBack,
  onSelectMovie,
  onContinue,
}) {
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState(FIXED_DATES);
  const [selectedDate, setSelectedDate] = useState('2026-10-16');
  const [cinemas, setCinemas] = useState(DEFAULT_CINEMAS);

  // Mặc định chọn CineNow Landmark 81 và suất 19:00 đúng như ảnh
  const [selectedCinema, setSelectedCinema] = useState(DEFAULT_CINEMAS[0]);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [ticketPrice, setTicketPrice] = useState(95000);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);

  useEffect(() => {
    loadShowtimes(selectedDate);
  }, [movie]);

  const loadShowtimes = async (date) => {
    try {
      setLoading(true);
      const movieId = movie?._id || movie?.id || movie?.slug || 'hanh-tinh-do';
      const data = await fetchShowtimes(movieId, date);

      if (data) {
        if (Array.isArray(data.dates) && data.dates.length > 0) {
          setDates(data.dates);
        }
        if (Array.isArray(data.cinemas) && data.cinemas.length > 0) {
          setCinemas(data.cinemas);
        }
      }
    } catch (err) {
      console.warn('Dùng dữ liệu suất chiếu chuẩn CineNow:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dateId) => {
    setSelectedDate(dateId);
    loadShowtimes(dateId);
  };

  const handleSelectTime = (cinema, timeObj) => {
    if (!timeObj.isAvailable) {
      Alert.alert('Suất chiếu đã hết vé', 'Vui lòng chọn khung giờ chiếu khác còn vé.');
      return;
    }
    setSelectedCinema(cinema);
    setSelectedTime(timeObj.time);
    setTicketPrice(timeObj.price || 95000);
  };

  const handleNext = () => {
    const bookingData = {
      movie: movie || {
        title: 'Hành Tinh Đỏ',
        duration: '128 phút',
        ageRating: '16+',
        format: '2D',
      },
      cinema: selectedCinema || cinemas[0] || DEFAULT_CINEMAS[0],
      cinemaName: selectedCinema?.name || DEFAULT_CINEMAS[0].name,
      room: selectedCinema?.room || 'PHÒNG 03',
      format: '2D',
      date: selectedDate,
      time: selectedTime,
      basePrice: ticketPrice,
    };
    onContinue(bookingData);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Bar đúng mẫu ảnh */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circularBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backChevron}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Chọn suất chiếu</Text>
      </View>

      {/* Breadcrumb Steps: Phim | Rạp | Suất (Active) | Ghế | Combo | Trả tiền | Vé QR */}
      <View style={styles.breadcrumbBar}>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Phim</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Rạp</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepText, styles.stepActive]}>Suất</Text>
          <View style={styles.activeUnderline} />
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Movie Info Box */}
        <View style={styles.movieCard}>
          <View style={styles.movieIconBox}>
            <Text style={styles.movieIconText}>🎟️</Text>
          </View>
          <View style={styles.movieTextBox}>
            <Text style={styles.movieTitle}>{movie?.title || 'Hành Tinh Đỏ'}</Text>
            <Text style={styles.movieMeta}>
              {movie?.duration || '128 phút'} • {movie?.ageRating || '16+'} • {movie?.format || '2D'}
            </Text>
          </View>
          <TouchableOpacity onPress={onSelectMovie} activeOpacity={0.7}>
            <Text style={styles.changeMovieText}>Đổi phim</Text>
          </TouchableOpacity>
        </View>

        {/* 5 Date Selector Cards (T4 16, T5 17, T6 18, T7 19, CN 20) */}
        <View style={styles.datesRow}>
          {dates.map((item) => {
            const isSelected = item.id === selectedDate;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.dateCard, isSelected && styles.dateCardActive]}
                onPress={() => handleDateChange(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateDayOfWeek, isSelected && styles.textWhite]}>
                  {item.dayOfWeek}
                </Text>
                <Text style={[styles.dateDayNumber, isSelected && styles.textWhite]}>
                  {item.dayNumber}
                </Text>
                {item.label ? (
                  <Text style={[styles.dateLabel, isSelected && styles.textWhite]}>
                    {item.label}
                  </Text>
                ) : (
                  <View style={styles.dateLabelPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#E50914" />
          </View>
        ) : (
          /* Danh sách Rạp chiếu chuẩn CineNow */
          <View style={styles.cinemasList}>
            {cinemas.map((cinema) => (
              <View key={cinema.id} style={styles.cinemaCard}>
                {/* Cinema Header */}
                <View style={styles.cinemaHeader}>
                  <View style={styles.cinemaIconBox}>
                    <Text style={styles.cinemaIconText}>🏛️</Text>
                  </View>
                  <View style={styles.cinemaTitleBox}>
                    <Text style={styles.cinemaName}>{cinema.name}</Text>
                    <Text style={styles.cinemaDistance}>{cinema.district}</Text>
                  </View>
                </View>

                {/* Room Title */}
                <Text style={styles.roomLabel}>{cinema.room}</Text>

                {/* Times Grid */}
                <View style={styles.timesGrid}>
                  {(cinema.times || []).map((t, idx) => {
                    const isPicked =
                      selectedCinema?.id === cinema.id && selectedTime === t.time;

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.timeBtn,
                          !t.isAvailable && styles.timeBtnDisabled,
                          isPicked && styles.timeBtnActive,
                        ]}
                        disabled={!t.isAvailable}
                        onPress={() => handleSelectTime(cinema, t)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            !t.isAvailable && styles.timeTextDisabled,
                            isPicked && styles.timeTextActive,
                          ]}
                        >
                          {t.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Legend Row */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.legendText}>Còn vé</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#555555' }]} />
                    <Text style={styles.legendText}>Hết vé</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Fixed Bottom Total & Continue Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalAmount}>
            {ticketPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.continueBtnText}>Tiếp tục chọn ghế</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Xung Đột (giữ nguyên để không gây lỗi logic) */}
      <ShowtimeConflictModal
        visible={conflictModalVisible}
        movie={movie}
        defaultCinema={selectedCinema?.name || 'CineNow Landmark 81'}
        defaultDate={selectedDate}
        onClose={() => setConflictModalVisible(false)}
        onApplyShowtime={(time) => {
          setSelectedTime(time);
          setConflictModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  topBar: {
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#0B0B0B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  backChevron: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 4,
  },
  stepText: {
    color: '#555555',
    fontSize: 11,
    fontWeight: '600',
  },
  stepActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -6,
    height: 2,
    width: '100%',
    backgroundColor: '#E50914',
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  movieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#202020',
  },
  movieIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movieIconText: {
    fontSize: 20,
  },
  movieTextBox: {
    flex: 1,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  movieMeta: {
    color: '#777777',
    fontSize: 12,
  },
  changeMovieText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#202020',
    minHeight: 74,
    justifyContent: 'center',
  },
  dateCardActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  dateDayOfWeek: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateDayNumber: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  dateLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
  },
  dateLabelPlaceholder: {
    height: 12,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  cinemasList: {
    gap: 16,
  },
  cinemaCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#202020',
  },
  cinemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cinemaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cinemaIconText: {
    fontSize: 18,
  },
  cinemaTitleBox: {
    flex: 1,
  },
  cinemaName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cinemaDistance: {
    color: '#777777',
    fontSize: 12,
    marginTop: 1,
  },
  roomLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  timeBtn: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2B2B2B',
    minWidth: 72,
    alignItems: 'center',
  },
  timeBtnActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  timeBtnDisabled: {
    backgroundColor: '#161616',
    borderColor: '#1E1E1E',
    opacity: 0.4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timeTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeTextDisabled: {
    color: '#555555',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    color: '#777777',
    fontSize: 11,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#101010',
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    color: '#777777',
    fontSize: 13,
  },
  totalAmount: {
    color: '#E50914',
    fontSize: 20,
    fontWeight: 'bold',
  },
  continueBtn: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
