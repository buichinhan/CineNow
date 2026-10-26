import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { fetchShowtimes } from './api';

export default function ShowtimeScreen({
  movie,
  onBack,
  onSelectMovie,
  onContinue,
}) {
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('2026-10-16');
  const [cinemas, setCinemas] = useState([]);

  // Selected cinema and time
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [ticketPrice, setTicketPrice] = useState(95000);

  useEffect(() => {
    loadShowtimes(selectedDate);
  }, [movie]);

  const loadShowtimes = async (date) => {
    try {
      setLoading(true);
      const data = await fetchShowtimes(movie?._id || movie?.slug || 'hanh-tinh-do', date);
      if (data) {
        setDates(data.dates || []);
        setCinemas(data.cinemas || []);
        if (data.cinemas?.length > 0 && !selectedCinema) {
          setSelectedCinema(data.cinemas[0]);
        }
      }
    } catch (err) {
      console.warn('Lỗi gọi API suất chiếu, dùng dữ liệu mẫu:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dateId) => {
    setSelectedDate(dateId);
    loadShowtimes(dateId);
  };

  const handleSelectTime = (cinema, timeObj) => {
    if (!timeObj.isAvailable) return;
    setSelectedCinema(cinema);
    setSelectedTime(timeObj.time);
    setTicketPrice(timeObj.price || 95000);
  };

  const handleNext = () => {
    const bookingData = {
      movie: movie || { title: 'Hành Tinh Đỏ' },
      cinema: selectedCinema || cinemas[0] || { name: 'CineNow Landmark 81' },
      room: selectedCinema?.room || 'PHÒNG 03',
      date: selectedDate,
      time: selectedTime,
      basePrice: ticketPrice,
    };
    onContinue(bookingData);
  };

  const activeDateObj = dates.find((d) => d.id === selectedDate) || dates[0];
  const dateDisplay = activeDateObj ? `${activeDateObj.dayNumber}.10.2026` : '16.10.2026';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>❮</Text>
          <Text style={styles.topBarTitle}>Chọn suất chiếu</Text>
        </TouchableOpacity>
      </View>

      {/* Breadcrumb Steps (Đã bỏ chọn rạp theo yêu cầu: Phim -> Suất -> Ghế -> Combo -> Trả tiền -> Vé QR) */}
      <View style={styles.breadcrumbContainer}>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Phim</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepText, styles.stepActive]}>Suất</Text>
          <View style={styles.stepIndicatorActive} />
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
        {/* Selected Movie Bar */}
        <View style={styles.movieInfoBar}>
          <View style={styles.movieIconBox}>
            <Text style={styles.movieIcon}>🎬</Text>
          </View>
          <View style={styles.movieDetails}>
            <Text style={styles.movieTitle}>{movie?.title || 'Hành Tinh Đỏ'}</Text>
            <Text style={styles.movieMeta}>
              {movie?.duration || '128 phút'} • {movie?.ageRating || '16+'} • 2D
            </Text>
          </View>
          <TouchableOpacity onPress={onSelectMovie} activeOpacity={0.7}>
            <Text style={styles.changeMovieText}>Đổi phim</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selector Row */}
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
                <Text style={[styles.dateDayOfWeek, isSelected && styles.dateTextActive]}>
                  {item.dayOfWeek}
                </Text>
                <Text style={[styles.dateDayNumber, isSelected && styles.dateTextActive]}>
                  {item.dayNumber}
                </Text>
                {item.label ? (
                  <Text style={[styles.dateLabel, isSelected && styles.dateTextActive]}>
                    {item.label}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Đang tải suất chiếu...</Text>
          </View>
        ) : (
          /* Cinemas and Showtimes list */
          <View style={styles.cinemasList}>
            {cinemas.map((cinema) => (
              <View key={cinema.id} style={styles.cinemaBlock}>
                {/* Cinema Header */}
                <View style={styles.cinemaHeader}>
                  <View style={styles.cinemaIconSquare}>
                    <Text style={styles.cinemaIconText}>🏛️</Text>
                  </View>
                  <View style={styles.cinemaTextContainer}>
                    <Text style={styles.cinemaName}>{cinema.name}</Text>
                    <Text style={styles.cinemaDistance}>{cinema.district}</Text>
                  </View>
                </View>

                {/* Room Tag */}
                <Text style={styles.roomTag}>{cinema.room}</Text>

                {/* Time Chips Grid */}
                <View style={styles.timesGrid}>
                  {cinema.times.map((t, idx) => {
                    const isPicked =
                      selectedCinema?.id === cinema.id && selectedTime === t.time;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.timeChip,
                          !t.isAvailable && styles.timeChipDisabled,
                          isPicked && styles.timeChipActive,
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

                {/* Availability Legend */}
                <View style={styles.legendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.legendText}>Còn vé</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#52525B' }]} />
                    <Text style={styles.legendText}>Hết vé</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed Bottom Total & Continue Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalInfo}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalPrice}>
            {ticketPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.continueButtonText}>Tiếp tục chọn ghế</Text>
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
  topBar: {
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#0B0B0B',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  movieInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  movieIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movieIcon: {
    fontSize: 18,
  },
  movieDetails: {
    flex: 1,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  movieMeta: {
    color: '#71717A',
    fontSize: 12,
  },
  changeMovieText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#18181B',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  dateCardActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  dateDayOfWeek: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateDayNumber: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  dateLabel: {
    color: '#A1A1AA',
    fontSize: 10,
    marginTop: 2,
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#71717A',
    marginTop: 10,
  },
  cinemasList: {
    gap: 16,
  },
  cinemaBlock: {
    backgroundColor: '#18181B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cinemaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cinemaIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cinemaIconText: {
    fontSize: 16,
  },
  cinemaTextContainer: {
    flex: 1,
  },
  cinemaName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cinemaDistance: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  roomTag: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  timeChip: {
    backgroundColor: '#27272A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  timeChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  timeChipDisabled: {
    backgroundColor: '#141416',
    borderColor: '#222225',
    opacity: 0.5,
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
    color: '#52525B',
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
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#71717A',
    fontSize: 11,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalInfo: {
    justifyContent: 'center',
  },
  totalLabel: {
    color: '#71717A',
    fontSize: 12,
  },
  totalPrice: {
    color: '#E50914',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
