
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

import { fetchSeats } from './api';

export default function SeatSelectionScreen({
  movie,
  bookingData,
  onBack,
  onContinue,
}) {
  const [loading, setLoading] = useState(true);
  const [seatLayout, setSeatLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadError, setLoadError] = useState('');

  const movieTitle =
    movie?.title ||
    bookingData?.movie?.title ||
    'Chưa chọn phim';

  const cinemaName =
    bookingData?.cinema?.name ||
    bookingData?.cinemaName ||
    '';

  const roomName = bookingData?.room || '';

  const showDate = bookingData?.date || '';
  const showTime = bookingData?.time || '';

  const movieId =
    movie?._id ||
    movie?.id ||
    movie?.slug ||
    bookingData?.movieId ||
    '';

  useEffect(() => {
    let active = true;

    const loadSeats = async () => {
      setLoading(true);
      setLoadError('');
      setSeatLayout(null);
      setSelectedSeats([]);

      if (
        !movieId ||
        !cinemaName ||
        !showDate ||
        !showTime
      ) {
        setLoadError(
          'Thiếu thông tin phim hoặc suất chiếu. Vui lòng quay lại chọn suất.'
        );
        setLoading(false);
        return;
      }

      try {
        const data = await fetchSeats(
          movieId,
          cinemaName,
          showDate,
          showTime
        );

        if (!active) return;

        if (
          !data?.seatLayout ||
          !Array.isArray(data.seatLayout.rows)
        ) {
          throw new Error('Sơ đồ ghế không hợp lệ.');
        }

        setSeatLayout(data.seatLayout);
      } catch (error) {
        if (!active) return;

        console.warn(
          'Lỗi tải sơ đồ ghế:',
          error?.message
        );

        setLoadError(
          error?.message ||
          'Không thể tải sơ đồ ghế. Vui lòng thử lại.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSeats();

    return () => {
      active = false;
    };
  }, [movieId, cinemaName, showDate, showTime]);

  const handleToggleSeat = (seat) => {
    if (
      !seat?.id ||
      seat.status === 'booked'
    ) {
      return;
    }

    setSelectedSeats((previous) => {
      if (previous.includes(seat.id)) {
        return previous.filter(
          (id) => id !== seat.id
        );
      }

      return [...previous, seat.id];
    });
  };

  const calculateTotal = () => {
    if (!seatLayout?.rows) return 0;

    let total = 0;

    seatLayout.rows.forEach((row) => {
      (row.seats || []).forEach((seat) => {
        if (
          selectedSeats.includes(seat.id) &&
          seat.status !== 'booked'
        ) {
          total += Number(row.price || 0);
        }
      });
    });

    return total;
  };

  const totalPrice = calculateTotal();

  const handleConfirmBooking = () => {
    if (loading || !seatLayout) {
      Alert.alert(
        'Thông báo',
        'Chưa tải được sơ đồ ghế. Vui lòng thử lại.'
      );
      return;
    }

    if (selectedSeats.length === 0) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chọn ít nhất một ghế.'
      );
      return;
    }

    if (
      !movieId ||
      !cinemaName ||
      !showDate ||
      !showTime
    ) {
      Alert.alert(
        'Thông báo',
        'Thông tin suất chiếu không hợp lệ.'
      );
      return;
    }

    const availableSeats = new Set();

    seatLayout.rows.forEach((row) => {
      (row.seats || []).forEach((seat) => {
        if (seat.status !== 'booked') {
          availableSeats.add(seat.id);
        }
      });
    });

    if (
      selectedSeats.some(
        (seatId) => !availableSeats.has(seatId)
      )
    ) {
      Alert.alert(
        'Ghế không hợp lệ',
        'Một số ghế không còn khả dụng. Vui lòng chọn lại.'
      );
      return;
    }

    if (
      !Number.isFinite(totalPrice) ||
      totalPrice <= 0
    ) {
      Alert.alert(
        'Thông báo',
        'Giá vé không hợp lệ.'
      );
      return;
    }

    const bookingSummary = {
      ...bookingData,
      movieId,
      movieTitle,
      cinemaName,
      room: roomName,
      date: showDate,
      time: showTime,
      seats: [...selectedSeats],
      ticketPrice: totalPrice,
    };

    if (typeof onContinue === 'function') {
      onContinue(bookingSummary);
    } else {
      Alert.alert(
        'Lỗi điều hướng',
        'Chưa kết nối được màn hình Combo.'
      );
    }
  };

  const getSeatColor = (seat, row, isSelected) => {
    if (seat.status === 'booked') {
      return '#18181B';
    }

    if (isSelected) {
      return '#E50914';
    }

    if (row.type === 'vip') {
      return '#EAB308';
    }

    if (row.type === 'sweetbox') {
      return '#881337';
    }

    return '#3F3F46';
  };

  const canContinue =
    !loading &&
    !loadError &&
    selectedSeats.length > 0 &&
    totalPrice > 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0B0B"
      />

      {/* Thanh tiêu đề */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>❮</Text>
          <Text style={styles.topBarTitle}>
            Chọn ghế
          </Text>
        </TouchableOpacity>
      </View>

      {/* Các bước đặt vé */}
      <View style={styles.breadcrumbContainer}>
        {[
          'Phim',
          'Suất',
          'Ghế',
          'Combo',
          'Trả tiền',
          'Vé QR',
        ].map((step) => (
          <View
            key={step}
            style={styles.stepItem}
          >
            <Text
              style={[
                styles.stepText,
                step === 'Ghế' && styles.stepActive,
              ]}
            >
              {step}
            </Text>

            {step === 'Ghế' && (
              <View
                style={styles.stepIndicatorActive}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Thông tin suất chiếu */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryMovieTitle}>
              {movieTitle}
            </Text>

            <Text style={styles.summaryRoom}>
              {roomName || cinemaName}
            </Text>
          </View>

          <View style={styles.summaryRight}>
            <Text style={styles.summaryTime}>
              {showTime || '--:--'}
            </Text>

            <Text style={styles.summaryDate}>
              {showDate || 'Chưa chọn ngày'}
            </Text>
          </View>
        </View>

        {/* Màn hình chiếu */}
        <View style={styles.screenContainer}>
          <View style={styles.screenCurve} />

          <Text style={styles.screenLabel}>
            MÀN HÌNH
          </Text>
        </View>

        {/* Sơ đồ ghế */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#E50914"
            />

            <Text style={styles.loadingText}>
              Đang tải sơ đồ ghế...
            </Text>
          </View>
        ) : loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {loadError}
            </Text>

            <TouchableOpacity
              style={styles.errorButton}
              onPress={onBack}
            >
              <Text style={styles.errorButtonText}>
                Quay lại chọn suất
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.seatMatrix}>
            {(seatLayout?.rows || []).map(
              (row, rowIndex) => (
                <View
                  key={`${row.row}-${rowIndex}`}
                  style={styles.rowContainer}
                >
                  <Text style={styles.rowLabel}>
                    {row.row}
                  </Text>

                  <View style={styles.seatsRow}>
                    {(row.seats || []).map((seat) => {
                      const isBooked =
                        seat.status === 'booked';

                      const isSelected =
                        !isBooked &&
                        selectedSeats.includes(seat.id);

                      const bgColor = getSeatColor(
                        seat,
                        row,
                        isSelected
                      );

                      if (seat.isDouble) {
                        return (
                          <TouchableOpacity
                            key={seat.id}
                            style={[
                              styles.doubleSeat,
                              {
                                backgroundColor: bgColor,
                              },
                              isSelected &&
                                styles.seatBorderSelected,
                            ]}
                            disabled={isBooked}
                            onPress={() =>
                              handleToggleSeat(seat)
                            }
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.seatNumberText,
                                isSelected &&
                                  styles.seatNumberTextWhite,
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
                            {
                              backgroundColor: bgColor,
                            },
                            isSelected &&
                              styles.seatBorderSelected,
                          ]}
                          disabled={isBooked}
                          onPress={() =>
                            handleToggleSeat(seat)
                          }
                          activeOpacity={0.8}
                        >
                          {isSelected && (
                            <Text style={styles.checkIcon}>
                              ✓
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )
            )}
          </View>
        )}

        {/* Chú thích ghế */}
        <View style={styles.legendContainer}>
          {[
            {
              label: 'Thường',
              color: '#3F3F46',
            },
            {
              label: 'VIP',
              color: '#EAB308',
            },
            {
              label: 'Ghế đôi',
              color: '#881337',
            },
            {
              label: 'Đã đặt',
              color: '#18181B',
            },
            {
              label: 'Đang chọn',
              color: '#E50914',
            },
          ].map((item) => (
            <View
              key={item.label}
              style={styles.legendItem}
            >
              <View
                style={[
                  styles.legendBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />

              <Text style={styles.legendText}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Ghế đã chọn */}
        <View style={styles.selectedSeatsBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedSeatsLabel}>
              Ghế đang chọn - {selectedSeats.length} ghế
            </Text>

            <Text style={styles.selectedSeatsList}>
              {selectedSeats.length > 0
                ? selectedSeats.join(', ')
                : 'Chưa chọn ghế'}
            </Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Thanh tổng tiền */}
      <View style={styles.bottomBar}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>
            Tổng tiền vé
          </Text>

          <Text style={styles.totalAmount}>
            {totalPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.payButton,
            !canContinue && styles.payButtonDisabled,
          ]}
          disabled={!canContinue}
          activeOpacity={0.85}
          onPress={handleConfirmBooking}
        >
          <Text style={styles.payButtonText}>
            Tiếp tục
          </Text>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  errorBox: {
    backgroundColor: '#18181B',
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: 'center',
  },

  errorText: {
    color: '#FF6B72',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  errorButton: {
    marginTop: 16,
    backgroundColor: '#E50914',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  errorButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    marginBottom: 5,
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

  payButtonDisabled: {
    opacity: 0.45,
  },

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
