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
import { fetchSeats, createBooking } from './api';

export default function SeatSelectionScreen({
  movie,
  bookingData,
  onBack,
  onComplete,
}) {
  const [loading, setLoading] = useState(true);
  const [seatLayout, setSeatLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(['B5', 'B6', 'D3', 'D4']);
  const [submitting, setSubmitting] = useState(false);

  const movieTitle = movie?.title || bookingData?.movie?.title || 'Hành Tinh Đỏ';
  const cinemaName = bookingData?.cinema?.name || 'CineNow Landmark 81';
  const roomName = bookingData?.room || 'Landmark 81 - Phòng 03';
  const showDate = bookingData?.date || '16.10.2026';
  const showTime = bookingData?.time || '19:00';

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await fetchSeats(
        movie?._id || movie?.slug || 'hanh-tinh-do',
        cinemaName,
        showDate,
        showTime
      );
      if (data && data.seatLayout) {
        setSeatLayout(data.seatLayout);
      }
    } catch (err) {
      console.warn('Lỗi tải sơ đồ ghế từ API:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle seat selection
  const handleToggleSeat = (seat, row) => {
    if (seat.status === 'booked') return;

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat.id]);
    }
  };

  // Calculate total price dynamically
  const calculateTotal = () => {
    if (!seatLayout) return 0;
    let total = 0;
    seatLayout.rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (selectedSeats.includes(seat.id)) {
          total += row.price;
        }
      });
    });
    return total;
  };

  const totalPrice = calculateTotal();

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 ghế để tiếp tục.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        movieTitle,
        cinemaName,
        room: roomName,
        date: showDate,
        time: showTime,
        seats: selectedSeats,
        totalPrice,
      };

      const res = await createBooking(payload);

      Alert.alert(
        'Đặt vé thành công! 🎉',
        `Mã vé: ${res.data?.bookingCode || 'CN-886912'}\nPhim: ${movieTitle}\nSuất: ${showTime} - ${showDate}\nGhế: ${selectedSeats.join(', ')}\nTổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ`,
        [
          {
            text: 'Về trang chủ',
            onPress: () => onComplete && onComplete(),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Lỗi đặt vé', err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeatColor = (seat, row, isSelected) => {
    if (isSelected) return '#E50914';
    if (seat.status === 'booked') return '#18181B';
    if (row.type === 'vip') return '#EAB308';
    if (row.type === 'sweetbox') return '#881337';
    return '#3F3F46'; // standard
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>❮</Text>
          <Text style={styles.topBarTitle}>Chọn ghế</Text>
        </TouchableOpacity>
      </View>

      {/* Breadcrumb Steps (Đã bỏ chọn rạp theo yêu cầu: Phim -> Suất -> Ghế -> Combo -> Trả tiền -> Vé QR) */}
      <View style={styles.breadcrumbContainer}>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Phim</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Suất</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepText, styles.stepActive]}>Ghế</Text>
          <View style={styles.stepIndicatorActive} />
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
        {/* Booking Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryMovieTitle}>{movieTitle}</Text>
            <Text style={styles.summaryRoom}>{roomName}</Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryTime}>{showTime}</Text>
            <Text style={styles.summaryDate}>{showDate}</Text>
          </View>
        </View>

        {/* Curved Screen Banner */}
        <View style={styles.screenContainer}>
          <View style={styles.screenCurve} />
          <Text style={styles.screenLabel}>MÀN HÌNH</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Đang tải sơ đồ ghế...</Text>
          </View>
        ) : (
          /* Seats Matrix */
          <View style={styles.seatMatrix}>
            {(seatLayout?.rows || []).map((row) => (
              <View key={row.row} style={styles.rowContainer}>
                <Text style={styles.rowLabel}>{row.row}</Text>

                <View style={styles.seatsRow}>
                  {row.seats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    const isBooked = seat.status === 'booked';
                    const bgColor = getSeatColor(seat, row, isSelected);

                    if (seat.isDouble) {
                      // Sweetbox / Double seat
                      return (
                        <TouchableOpacity
                          key={seat.id}
                          style={[
                            styles.doubleSeat,
                            { backgroundColor: bgColor },
                            isSelected && styles.seatBorderSelected,
                          ]}
                          disabled={isBooked}
                          onPress={() => handleToggleSeat(seat, row)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.seatNumberText,
                              isSelected && styles.seatNumberTextWhite,
                            ]}
                          >
                            {seat.number}
                          </Text>
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.singleSeat,
                          { backgroundColor: bgColor },
                          isSelected && styles.seatBorderSelected,
                        ]}
                        disabled={isBooked}
                        onPress={() => handleToggleSeat(seat, row)}
                        activeOpacity={0.8}
                      >
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#3F3F46' }]} />
            <Text style={styles.legendText}>Thường</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#EAB308' }]} />
            <Text style={styles.legendText}>VIP</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#881337' }]} />
            <Text style={styles.legendText}>Ghế đôi</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#18181B' }]} />
            <Text style={styles.legendText}>Đã đặt</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#E50914' }]} />
            <Text style={styles.legendText}>Đang chọn</Text>
          </View>
        </View>

        {/* Selected Seats Banner */}
        <View style={styles.selectedSeatsBanner}>
          <Text style={styles.selectedSeatsLabel}>
            Ghế đang chọn - {selectedSeats.length} ghế
          </Text>
          <Text style={styles.selectedSeatsList}>
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Bottom Bar: Total Price & Continue Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalAmount}>
            {totalPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, submitting && { opacity: 0.6 }]}
          disabled={submitting}
          activeOpacity={0.85}
          onPress={handleConfirmBooking}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payButtonText}>Tiếp tục</Text>
          )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  summaryLeft: {
    flex: 1,
  },
  summaryMovieTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryRoom: {
    color: '#71717A',
    fontSize: 12,
  },
  summaryRight: {
    alignItems: 'flex-end',
  },
  summaryTime: {
    color: '#E50914',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryDate: {
    color: '#71717A',
    fontSize: 12,
  },
  screenContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  screenCurve: {
    width: '88%',
    height: 5,
    backgroundColor: '#E4E4E7',
    borderRadius: 5,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  screenLabel: {
    color: '#71717A',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#71717A',
    marginTop: 10,
  },
  seatMatrix: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
  },
  seatsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  singleSeat: {
    width: 32,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleSeat: {
    width: 70,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatBorderSelected: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  seatNumberText: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '600',
  },
  seatNumberTextWhite: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
    paddingVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#71717A',
    fontSize: 11,
  },
  selectedSeatsBanner: {
    backgroundColor: '#18181B',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  selectedSeatsLabel: {
    color: '#71717A',
    fontSize: 13,
  },
  selectedSeatsList: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBlock: {
    justifyContent: 'center',
  },
  totalLabel: {
    color: '#71717A',
    fontSize: 12,
  },
  totalAmount: {
    color: '#E50914',
    fontSize: 20,
    fontWeight: '900',
  },
  payButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
