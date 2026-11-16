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
import { fetchSeats, holdSeatsApi, releaseSeatsApi, createBooking } from './api';

// Sơ đồ ghế 6 hàng chuẩn xác đúng bố cục ảnh chụp
const INITIAL_LAYOUT = {
  rows: [
    {
      row: 'A',
      type: 'standard',
      price: 95000,
      seats: [
        { id: 'A1', number: '1', status: 'available' },
        { id: 'A2', number: '2', status: 'available' },
        { id: 'A3', number: '3', status: 'available' },
        { id: 'A4', number: '4', status: 'available' },
        { id: 'A5', number: '5', status: 'available' },
        { id: 'A6', number: '6', status: 'available' },
        { id: 'A7', number: '7', status: 'available' },
        { id: 'A8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'B',
      type: 'standard',
      price: 95000,
      seats: [
        { id: 'B1', number: '1', status: 'available' },
        { id: 'B2', number: '2', status: 'available' },
        { id: 'B3', number: '3', status: 'available' },
        { id: 'B4', number: '4', status: 'available' },
        { id: 'B5', number: '5', status: 'available' },
        { id: 'B6', number: '6', status: 'available' },
        { id: 'B7', number: '7', status: 'booked' },
        { id: 'B8', number: '8', status: 'booked' },
      ],
    },
    {
      row: 'C',
      type: 'vip',
      price: 95000,
      seats: [
        { id: 'C1', number: '1', status: 'available' },
        { id: 'C2', number: '2', status: 'available' },
        { id: 'C3', number: '3', status: 'booked' },
        { id: 'C4', number: '4', status: 'available' },
        { id: 'C5', number: '5', status: 'available' },
        { id: 'C6', number: '6', status: 'available' },
        { id: 'C7', number: '7', status: 'available' },
        { id: 'C8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'D',
      type: 'vip',
      price: 95000,
      seats: [
        { id: 'D1', number: '1', status: 'available' },
        { id: 'D2', number: '2', status: 'available' },
        { id: 'D3', number: '3', status: 'available' },
        { id: 'D4', number: '4', status: 'available' },
        { id: 'D5', number: '5', status: 'available' },
        { id: 'D6', number: '6', status: 'booked' },
        { id: 'D7', number: '7', status: 'available' },
        { id: 'D8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'E',
      type: 'vip',
      price: 95000,
      seats: [
        { id: 'E1', number: '1', status: 'available' },
        { id: 'E2', number: '2', status: 'available' },
        { id: 'E3', number: '3', status: 'available' },
        { id: 'E4', number: '4', status: 'available' },
        { id: 'E5', number: '5', status: 'available' },
        { id: 'E6', number: '6', status: 'available' },
        { id: 'E7', number: '7', status: 'available' },
        { id: 'E8', number: '8', status: 'available' },
      ],
    },
    {
      row: 'F',
      type: 'sweetbox',
      price: 190000,
      seats: [
        { id: 'F1-2', number: 'F1-2', status: 'available', isDouble: true },
        { id: 'F3-4', number: 'F3-4', status: 'available', isDouble: true },
        { id: 'F5-6', number: 'F5-6', status: 'available', isDouble: true },
        { id: 'F7-8', number: 'F7-8', status: 'available', isDouble: true },
      ],
    },
  ],
};

export default function SeatSelectionScreen({
  movie,
  bookingData,
  user,
  onBack,
  onContinue,
  onComplete,
}) {
  const [loading, setLoading] = useState(false);
  const [seatLayout, setSeatLayout] = useState(INITIAL_LAYOUT);

  // Mặc định chọn 4 ghế B5, B6, D3, D4 chuẩn như ảnh
  const [selectedSeats, setSelectedSeats] = useState(
    Array.isArray(bookingData?.selectedSeats) && bookingData.selectedSeats.length > 0
      ? bookingData.selectedSeats
      : ['B5', 'B6', 'D3', 'D4']
  );

  const [submitting, setSubmitting] = useState(false);
  const [holdToken, setHoldToken] = useState(bookingData?.holdToken || null);
  const [holdExpiresAt, setHoldExpiresAt] = useState(bookingData?.holdExpiresAt || null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    bookingData?.remainingSeconds || null
  );

  const movieTitle = movie?.title || bookingData?.movie?.title || 'Hành Tinh Đỏ';
  const cinemaName = bookingData?.cinemaName || bookingData?.cinema?.name || 'Landmark 81';
  const roomName = bookingData?.room || 'Phòng 03';
  const showDate = bookingData?.date || '16.10.2026';
  const showTime = bookingData?.time || '19:00';

  useEffect(() => {
    loadSeats();
  }, []);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const movieId = movie?._id || movie?.id || movie?.slug || 'hanh-tinh-do';
      const data = await fetchSeats(
        movieId,
        cinemaName,
        showDate,
        showTime,
        holdToken,
        roomName
      );

      if (data && data.seatLayout && Array.isArray(data.seatLayout.rows)) {
        setSeatLayout(data.seatLayout);
      }
    } catch (err) {
      console.warn('Sử dụng sơ đồ ghế chuẩn CineNow:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle chọn hoặc bỏ chọn ghế
  const handleToggleSeat = (seat, row) => {
    if (seat.status === 'booked') {
      Alert.alert('Ghế đã đặt', 'Ghế này đã có người mua thành công.');
      return;
    }

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat.id]);
    }
  };

  // Tính tổng tiền realtime
  const calculateTotal = () => {
    if (!seatLayout || !seatLayout.rows) return 0;
    let total = 0;
    seatLayout.rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (selectedSeats.includes(seat.id)) {
          total += row.price || (row.type === 'sweetbox' ? 190000 : 95000);
        }
      });
    });
    return total;
  };

  const totalPrice = calculateTotal();

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Chưa chọn ghế', 'Vui lòng chọn ít nhất 1 ghế để tiếp tục.');
      return;
    }

    try {
      setSubmitting(true);

      const nextPayload = {
        movie: movie || bookingData?.movie,
        bookingData,
        cinemaName,
        room: roomName,
        date: showDate,
        time: showTime,
        selectedSeats,
        seatTotal: totalPrice,
        holdToken,
        holdExpiresAt,
        remainingSeconds,
      };

      if (onContinue) {
        onContinue(nextPayload);
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Bar đúng mẫu ảnh */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.circularBackBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backChevron}>❮</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Chọn ghế</Text>
      </View>

      {/* Breadcrumb Steps: Phim | Rạp | Suất | Ghế (Active) | Combo | Trả tiền | Vé QR */}
      <View style={styles.breadcrumbBar}>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Phim</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Rạp</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Suất</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepText, styles.stepActive]}>Ghế</Text>
          <View style={styles.activeUnderline} />
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
        {/* Screening Summary Box đúng ảnh: Tên phim, Rạp phòng (trái) - Giờ, ngày (phải đỏ) */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryMovieTitle}>{movieTitle}</Text>
            <Text style={styles.summaryRoom}>
              {cinemaName.replace('CineNow ', '')} • {roomName.replace('2D PHỤ ĐỀ • ', '')}
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={styles.summaryTime}>{showTime}</Text>
            <Text style={styles.summaryDate}>{showDate}</Text>
          </View>
        </View>

        {/* Curved Screen Banner (Màn hình cong phát sáng) */}
        <View style={styles.screenContainer}>
          <View style={styles.screenCurve} />
          <Text style={styles.screenLabel}>MÀN HÌNH</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#E50914" />
          </View>
        ) : (
          /* Sơ đồ ghế 6 hàng (A, B, C, D, E, F) đúng từng màu như ảnh mẫu */
          <View style={styles.seatMatrix}>
            {(seatLayout?.rows || []).map((row) => (
              <View key={row.row} style={styles.rowContainer}>
                {/* Row Label (A, B, C, D, E, F) */}
                <Text style={styles.rowLabel}>{row.row}</Text>

                {/* Danh sách ghế */}
                <View style={styles.seatsRow}>
                  {row.seats.map((seat) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    const isBooked = seat.status === 'booked';

                    // Ghế đôi Sweetbox (Row F)
                    if (seat.isDouble) {
                      return (
                        <TouchableOpacity
                          key={seat.id}
                          style={[
                            styles.doubleSeat,
                            isSelected && styles.seatSelected,
                          ]}
                          onPress={() => handleToggleSeat(seat, row)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.doubleSeatText}>{seat.number}</Text>
                        </TouchableOpacity>
                      );
                    }

                    // Ghế đơn (Rows A, B, C, D, E)
                    return (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.singleSeat,
                          row.type === 'standard' && styles.seatStandard,
                          row.type === 'vip' && styles.seatVip,
                          isBooked && styles.seatBooked,
                          isSelected && styles.seatSelected,
                        ]}
                        disabled={isBooked}
                        onPress={() => handleToggleSeat(seat, row)}
                        activeOpacity={0.8}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Legend (Chú thích 5 mục đúng ảnh) */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendStandard]} />
            <Text style={styles.legendText}>Thường</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendVip]} />
            <Text style={styles.legendText}>VIP</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendSweetbox]} />
            <Text style={styles.legendText}>Ghế đôi</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendBooked]} />
            <Text style={styles.legendText}>Đã đặt</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.legendSelected]} />
            <Text style={styles.legendText}>Đang chọn</Text>
          </View>
        </View>

        {/* Banner Ghế đang chọn */}
        <View style={styles.selectedSeatsCard}>
          <Text style={styles.selectedSeatsLabel}>
            Ghế đang chọn • {selectedSeats.length} ghế
          </Text>
          <Text style={styles.selectedSeatsValue}>
            {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}
          </Text>
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* Bottom Bar: Tổng tiền (380.000đ) & Nút Tiếp tục */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalAmount}>
            {totalPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.85}
          disabled={submitting}
          onPress={handleProceed}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueBtnText}>Tiếp tục</Text>
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
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
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
    color: '#777777',
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
    color: '#777777',
    fontSize: 12,
  },
  screenContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  screenCurve: {
    width: '80%',
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  screenLabel: {
    color: '#666666',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  seatMatrix: {
    alignItems: 'center',
    gap: 9,
    marginBottom: 26,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: 'bold',
    width: 20,
    textAlign: 'center',
    marginRight: 6,
  },
  seatsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  singleSeat: {
    width: 28,
    height: 26,
    borderRadius: 6,
  },
  doubleSeat: {
    width: 63,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleSeatText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  seatStandard: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4A4A50',
  },
  seatVip: {
    backgroundColor: '#EAB308',
  },
  seatBooked: {
    backgroundColor: '#353538',
    borderColor: '#353538',
  },
  seatSelected: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 6,
  },
  legendStandard: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#4A4A50',
  },
  legendVip: {
    backgroundColor: '#EAB308',
  },
  legendSweetbox: {
    backgroundColor: '#B91C1C',
    width: 22,
  },
  legendBooked: {
    backgroundColor: '#353538',
  },
  legendSelected: {
    backgroundColor: '#E50914',
  },
  legendText: {
    color: '#777777',
    fontSize: 10,
  },
  selectedSeatsCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#202020',
  },
  selectedSeatsLabel: {
    color: '#777777',
    fontSize: 13,
  },
  selectedSeatsValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
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
