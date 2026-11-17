import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { API_BASE_URL } from '../apiConfig';
import VoucherCard from '../components/VoucherCard';

const MOCK_MOVIES = [
  {
    id: 'm1',
    name: 'Avatar: Dòng Chảy Của Nước',
    format: '3D',
    price: 110000,
    cinema: 'CineNow Landmark 81',
    room: 'PHÒNG 03',
    date: '16.10.2026',
    time: '19:00',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
  },
  {
    id: 'm2',
    name: 'Dune: Hành Tinh Cát - Phần 2',
    format: 'IMAX',
    price: 150000,
    cinema: 'CineNow Vincom Center',
    room: 'PHÒNG IMAX 01',
    date: '16.10.2026',
    time: '20:30',
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=400',
  },
  {
    id: 'm3',
    name: 'Godzilla x Kong: Đế Chế Mới',
    format: '2D',
    price: 85000,
    cinema: 'CineNow Thảo Điền',
    room: 'PHÒNG 02',
    date: '16.10.2026',
    time: '18:15',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
  },
];

const POINT_RATE = 1000; // 1 điểm = 1.000 VNĐ

export default function BookingCheckoutDemoScreen({
  movie,
  bookingData,
  selectedSeats: initialSeats,
  seatTotal: initialSeatTotal,
  concessions: initialConcessions,
  concessionsTotal: initialConcessionsTotal,
  user,
  token,
  initialVoucher,
  onNavigateToVoucherList,
  onBack,
  onComplete,
}) {
  // Xác định chế độ: Dữ liệu thật từ quy trình đặt vé hay Chế độ Giả lập (Demo)
  const isRealFlow = Boolean(movie || bookingData);

  // 1. Phim và Suất chiếu
  const [selectedMovie, setSelectedMovie] = useState(() => {
    if (movie) {
      return {
        id: movie._id || movie.id,
        name: movie.title || movie.name,
        format: bookingData?.format || movie.format || '2D',
        price: movie.price || 95000,
        cinema: bookingData?.cinema?.name || bookingData?.cinemaName || 'CineNow Landmark 81',
        room: bookingData?.room || 'PHÒNG 03',
        date: bookingData?.date || '16.10.2026',
        time: bookingData?.time || '19:00',
        poster: movie.posterUrl || movie.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
      };
    }
    return MOCK_MOVIES[0];
  });

  // 2. Ghế đã chọn
  const [ticketCount, setTicketCount] = useState(
    initialSeats?.length || (bookingData?.selectedSeats?.length || 2)
  );
  const [seatsList, setSeatsList] = useState(
    initialSeats || bookingData?.selectedSeats || ['D5', 'D6']
  );

  // 3. Combo bắp nước
  const [demoHasCombo, setDemoHasCombo] = useState(true);
  const realConcessions = initialConcessions || bookingData?.concessions || [];

  // Tính tiền vé & combo
  const ticketSubtotal = useMemo(() => {
    if (initialSeatTotal !== undefined) return Number(initialSeatTotal);
    if (bookingData?.seatTotal !== undefined) return Number(bookingData.seatTotal);
    return selectedMovie.price * ticketCount;
  }, [initialSeatTotal, bookingData?.seatTotal, selectedMovie.price, ticketCount]);

  const comboSubtotal = useMemo(() => {
    if (isRealFlow) {
      if (initialConcessionsTotal !== undefined) return Number(initialConcessionsTotal);
      return realConcessions.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );
    }
    return demoHasCombo ? 65000 : 0;
  }, [isRealFlow, initialConcessionsTotal, realConcessions, demoHasCombo]);

  const originalTotal = ticketSubtotal + comboSubtotal;

  // 4. Voucher State
  const [promoCodeInput, setPromoCodeInput] = useState(initialVoucher?.code || '');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // Danh sách voucher khả dụng (Modal chọn voucher)
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  // 5. Điểm thành viên State
  const [userPoints, setUserPoints] = useState(user?.loyaltyPoints || 120);
  const [pointsInput, setPointsInput] = useState('');
  const [pointsToUse, setPointsToUse] = useState(0);

  // Trạng thái xác nhận thanh toán
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Tải thông tin số dư điểm từ Backend
  useEffect(() => {
    let isMounted = true;
    async function loadUserPoints() {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/loyalty/balance`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (json.success && isMounted) {
          setUserPoints(json.data.loyaltyPoints);
        }
      } catch (err) {
        // Fallback to local user prop
      }
    }
    loadUserPoints();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Áp dụng voucher khởi tạo nếu được truyền vào
  useEffect(() => {
    if (initialVoucher && initialVoucher.code) {
      handleApplyVoucher(initialVoucher.code);
    }
  }, [initialVoucher]);

  // Tải danh sách Voucher để hiển thị modal chọn nhanh
  const loadAvailableVouchers = async () => {
    try {
      setLoadingVouchers(true);
      setShowVoucherModal(true);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/vouchers`, { headers });
      const json = await res.json();
      if (json.success) {
        setAvailableVouchers(json.data || []);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải danh sách voucher.');
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Tính giảm giá Voucher
  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.discountType === 'FIXED_AMOUNT') {
      return Math.min(appliedVoucher.discountValue, originalTotal);
    }
    if (appliedVoucher.discountType === 'PERCENTAGE') {
      let discount = Math.round((originalTotal * appliedVoucher.discountValue) / 100);
      if (appliedVoucher.maxDiscountAmount > 0) {
        discount = Math.min(discount, appliedVoucher.maxDiscountAmount);
      }
      return discount;
    }
    return 0; // FREE_ITEM
  }, [appliedVoucher, originalTotal]);

  const amountAfterVoucher = Math.max(0, originalTotal - voucherDiscount);

  // Tính số điểm tối đa có thể sử dụng cho đơn hàng này
  const maxUsablePoints = useMemo(() => {
    const pointsNeededForFullDiscount = Math.floor(amountAfterVoucher / POINT_RATE);
    return Math.min(userPoints, pointsNeededForFullDiscount);
  }, [amountAfterVoucher, userPoints]);

  // Giảm giá từ điểm thành viên
  const pointsDiscount = Math.min(pointsToUse, maxUsablePoints) * POINT_RATE;

  // Tổng thanh toán cuối cùng (Không âm)
  const finalTotal = Math.max(0, amountAfterVoucher - pointsDiscount);

  // Điểm tích lũy dự kiến sau khi thanh toán thành công (1 điểm cho mỗi 10.000đ thực trả)
  const expectedPointsEarned = Math.floor(finalTotal / 10000);

  // Xử lý áp dụng mã Voucher
  const handleApplyVoucher = async (codeToUse) => {
    const code = (codeToUse || promoCodeInput).trim().toUpperCase();
    if (!code) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá.');
      return;
    }

    try {
      setValidatingVoucher(true);
      const res = await fetch(`${API_BASE_URL}/vouchers/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          orderAmount: originalTotal,
          cinema: selectedMovie.cinema,
          format: selectedMovie.format,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setAppliedVoucher(result.data);
        setPromoCodeInput(code);
        setShowVoucherModal(false);
        Alert.alert(
          'Áp dụng thành công! 🎉',
          `Voucher [${code}] đã được kích hoạt!\nGiảm: ${result.data.discountAmount.toLocaleString('vi-VN')}đ${
            result.data.freeItem ? `\nQuà tặng: ${result.data.freeItem}` : ''
          }`
        );
      } else {
        setAppliedVoucher(null);
        Alert.alert('Không thể áp dụng', result.message || 'Mã không đủ điều kiện.');
      }
    } catch (error) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ kiểm tra voucher.');
    } finally {
      setValidatingVoucher(false);
    }
  };

  // Hủy áp dụng Voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setPromoCodeInput('');
  };

  // Thay đổi số điểm muốn sử dụng
  const handleSetPoints = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      setPointsToUse(0);
      setPointsInput('');
      return;
    }
    if (num > userPoints) {
      Alert.alert('Số điểm không đủ', `Bạn chỉ có tối đa ${userPoints} điểm.`);
      setPointsToUse(userPoints);
      setPointsInput(String(userPoints));
      return;
    }
    if (num > maxUsablePoints) {
      Alert.alert(
        'Đạt giới hạn đơn hàng',
        `Đơn hàng này chỉ cần dùng tối đa ${maxUsablePoints} điểm để thanh toán.`
      );
      setPointsToUse(maxUsablePoints);
      setPointsInput(String(maxUsablePoints));
      return;
    }
    setPointsToUse(num);
    setPointsInput(String(num));
  };

  const handleUseMaxPoints = () => {
    if (maxUsablePoints <= 0) {
      Alert.alert('Thông báo', 'Đơn hàng không cần thêm điểm để thanh toán hoặc số dư điểm bằng 0.');
      return;
    }
    setPointsToUse(maxUsablePoints);
    setPointsInput(String(maxUsablePoints));
  };

  // XÁC NHẬN THANH TOÁN
  const handleConfirmPayment = async () => {
    try {
      setSubmittingPayment(true);

      const concessionsPayload = isRealFlow
        ? realConcessions
        : demoHasCombo
        ? [{ id: 'combo-demo', name: 'Combo Solo (1 Bắp + 1 Nước)', price: 65000, quantity: 1 }]
        : [];

      const payload = {
        userId: user?._id || user?.id,
        movieTitle: selectedMovie.name,
        poster: selectedMovie.poster,
        cinemaName: selectedMovie.cinema,
        room: selectedMovie.room,
        date: selectedMovie.date,
        time: selectedMovie.time,
        seats: seatsList,
        seatTotal: ticketSubtotal,
        concessions: concessionsPayload,
        concessionsTotal: comboSubtotal,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        pointsToUse: pointsToUse > 0 ? pointsToUse : 0,
        paymentMethod: 'CinePay / Thẻ ngân hàng / Ví MoMo',
        holdToken: bookingData?.holdToken,
      };

if (!token) {
  Alert.alert(
    'Phiên đăng nhập không hợp lệ',
    'Vui lòng đăng nhập lại trước khi đặt vé.'
  );
  return;
}
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const booking = json.data;
const bookingCode = booking?.bookingCode;

if (!bookingCode || !booking?._id) {
  Alert.alert(
    'Không thể xác nhận vé',
    'Máy chủ chưa trả về thông tin đặt vé hợp lệ. Vui lòng kiểm tra Vé của tôi trước khi thử lại.'
  );
  return;
}
        let detailMsg = `Mã vé: ${bookingCode}\n`;
        detailMsg += `Phim: ${selectedMovie.name}\n`;
        detailMsg += `Ghế: ${seatsList.join(', ')}\n`;
        detailMsg += `Tổng thanh toán: ${finalTotal.toLocaleString('vi-VN')}đ\n`;
        if (appliedVoucher) {
          detailMsg += `Tiết kiệm Voucher: -${voucherDiscount.toLocaleString('vi-VN')}đ\n`;
        }
        if (pointsDiscount > 0) {
          detailMsg += `Điểm sử dụng: ${pointsToUse} điểm (-${pointsDiscount.toLocaleString('vi-VN')}đ)\n`;
        }
        if (expectedPointsEarned > 0) {
          detailMsg += `Điểm tích lũy mới: +${expectedPointsEarned} điểm ⭐\n`;
        }
        detailMsg += `\nChúc bạn có trải nghiệm xem phim tuyệt vời tại CineNow!`;

        Alert.alert('Thanh toán thành công! 🎬🎉', detailMsg, [
          {
            text: 'Xem vé của tôi',
            onPress: () => {

if (onComplete) {
  onComplete(booking);
}

            },
          },
        ]);
      } else {
        Alert.alert('Thanh toán thất bại', json.message || 'Đã có lỗi xảy ra khi tạo đơn.');
      }
    } catch (err) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ thanh toán.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Header thanh điều hướng */}
      <View style={styles.topBar}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>‹ Quay lại</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.topBarTitle}>
          {isRealFlow ? 'Xác Nhận & Thanh Toán' : 'Thanh Toán & Ưu Đãi (Demo)'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 1. THÔNG TIN PHIM & SUẤT CHIẾU */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Thông tin phim & Suất chiếu</Text>
          <View style={styles.movieHeaderCard}>
            <Image
              source={{ uri: selectedMovie.poster }}
              style={styles.moviePoster}
              resizeMode="cover"
            />
            <View style={styles.movieHeaderInfo}>
              <Text style={styles.movieName} numberOfLines={2}>
                {selectedMovie.name}
              </Text>
              <Text style={styles.movieMetaHighlight}>
                {selectedMovie.cinema}
              </Text>
              <Text style={styles.movieMeta}>
                {selectedMovie.room} ·{' '}
                <Text style={styles.formatBadge}>[{selectedMovie.format}]</Text>
              </Text>
              <Text style={styles.showtimeBadge}>
                🕒 {selectedMovie.time} | 📅 {selectedMovie.date}
              </Text>
            </View>
          </View>

          {/* Nếu là chế độ demo, cho phép chuyển đổi phim để thử nghiệm nhiều rạp/định dạng */}
          {!isRealFlow && (
            <View style={styles.demoPickerRow}>
              <Text style={styles.demoPickerLabel}>Đổi phim thử nghiệm:</Text>
              <View style={styles.demoPickerChips}>
                {MOCK_MOVIES.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.demoChip,
                      selectedMovie.id === m.id && styles.demoChipActive,
                    ]}
                    onPress={() => {
                      setSelectedMovie(m);
                      setAppliedVoucher(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.demoChipText,
                        selectedMovie.id === m.id && styles.demoChipTextActive,
                      ]}
                    >
                      {m.format}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 2. THÔNG TIN GHẾ ĐÃ CHỌN */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>2. Ghế đã chọn</Text>
            <Text style={styles.seatCountBadge}>{seatsList.length} ghế</Text>
          </View>
          <View style={styles.seatsRow}>
            <Text style={styles.seatsListText}>
              Ghế: <Text style={styles.seatsHighlight}>{seatsList.join(', ')}</Text>
            </Text>
            <Text style={styles.seatsPriceText}>
              {ticketSubtotal.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* 3. THÔNG TIN COMBO BẮP NƯỚC */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Bắp nước & Combo</Text>
          {isRealFlow ? (
            realConcessions.length > 0 ? (
              realConcessions.map((item, idx) => (
                <View key={idx} style={styles.concessionItemRow}>
                  <Text style={styles.concessionName}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={styles.concessionPrice}>
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyConcessionText}>Không chọn bắp nước</Text>
            )
          ) : (
            <TouchableOpacity
              style={[
                styles.comboCheckbox,
                demoHasCombo && styles.comboCheckboxActive,
              ]}
              onPress={() => setDemoHasCombo(!demoHasCombo)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  demoHasCombo && styles.checkboxBoxChecked,
                ]}
              >
                {demoHasCombo && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.comboInfo}>
                <Text style={styles.comboName}>Combo Solo (1 Bắp + 1 Nước)</Text>
                <Text style={styles.comboPrice}>65.000đ</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. KHU VỰC VOUCHER / MÃ GIẢM GIÁ */}
        <View style={styles.sectionCard}>
          <View style={styles.voucherHeaderRow}>
            <Text style={styles.sectionTitle}>4. Mã giảm giá (Voucher)</Text>
            <TouchableOpacity
              onPress={loadAvailableVouchers}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Kho voucher ›</Text>
            </TouchableOpacity>
          </View>

          {appliedVoucher ? (
            <View style={styles.appliedVoucherBox}>
              <View style={styles.appliedVoucherLeft}>
                <View style={styles.appliedTagRow}>
                  <Text style={styles.appliedVoucherCode}>
                    🏷️ {appliedVoucher.code}
                  </Text>
                  <Text style={styles.appliedBadge}>Đã áp dụng</Text>
                </View>
                <Text style={styles.appliedVoucherTitle}>
                  {appliedVoucher.title}
                </Text>
                {appliedVoucher.freeItem && (
                  <Text style={styles.appliedFreeItem}>
                    🎁 Quà tặng: {appliedVoucher.freeItem}
                  </Text>
                )}
                <Text style={styles.appliedSavingText}>
                  Tiết kiệm: -{voucherDiscount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeVoucherBtn}
                onPress={handleRemoveVoucher}
              >
                <Text style={styles.removeVoucherText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.promoInput}
                  placeholder="Nhập mã ưu đãi (VD: CINENEW50)..."
                  placeholderTextColor="#777777"
                  value={promoCodeInput}
                  onChangeText={setPromoCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.applyCodeBtn}
                  onPress={() => handleApplyVoucher()}
                  disabled={validatingVoucher}
                  activeOpacity={0.8}
                >
                  {validatingVoucher ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.applyCodeBtnText}>Áp dụng</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Gợi ý mã hot nhanh */}
              <View style={styles.quickCodeList}>
                <Text style={styles.quickCodeLabel}>Mã hot:</Text>
                {['CINENEW50', 'CINEVIP20', 'WEDHAPPY'].map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={styles.quickCodeChip}
                    onPress={() => {
                      setPromoCodeInput(code);
                      handleApplyVoucher(code);
                    }}
                  >
                    <Text style={styles.quickCodeText}>{code}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* 5. KHU VỰC ĐIỂM THÀNH VIÊN (LOYALTY POINTS) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>5. Điểm thành viên CineNow</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>
                Số dư: {userPoints} điểm
              </Text>
            </View>
          </View>

          <Text style={styles.pointsExchangeNote}>
            Tỷ lệ quy đổi: <Text style={styles.boldWhite}>1 điểm = 1.000 VNĐ</Text>.
            Dùng tối đa: <Text style={styles.boldRed}>{maxUsablePoints} điểm</Text> cho đơn này.
          </Text>

          <View style={styles.pointsActionRow}>
            <TextInput
              style={styles.pointsInput}
              placeholder="0"
              placeholderTextColor="#666666"
              keyboardType="numeric"
              value={pointsInput}
              onChangeText={handleSetPoints}
            />
            <Text style={styles.pointsUnitText}>điểm</Text>

            <TouchableOpacity
              style={styles.useMaxPointsBtn}
              onPress={handleUseMaxPoints}
              activeOpacity={0.8}
            >
              <Text style={styles.useMaxPointsBtnText}>Dùng tối đa</Text>
            </TouchableOpacity>

            {pointsToUse > 0 && (
              <TouchableOpacity
                style={styles.resetPointsBtn}
                onPress={() => handleSetPoints(0)}
              >
                <Text style={styles.resetPointsBtnText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>

          {pointsDiscount > 0 && (
            <View style={styles.pointsDiscountApplied}>
              <Text style={styles.pointsDiscountAppliedText}>
                ✓ Đã trừ {pointsToUse} điểm (Quy đổi: -{pointsDiscount.toLocaleString('vi-VN')}đ)
              </Text>
            </View>
          )}
        </View>

        {/* 6. CHI TIẾT GIÁ TIỀN & TỔNG THANH TOÁN */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>6. Chi tiết thanh toán</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền vé xem phim</Text>
            <Text style={styles.summaryValue}>
              {ticketSubtotal.toLocaleString('vi-VN')}đ
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền bắp nước & combo</Text>
            <Text style={styles.summaryValue}>
              {comboSubtotal.toLocaleString('vi-VN')}đ
            </Text>
          </View>

          {voucherDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>
                Giảm giá Voucher ({appliedVoucher?.code})
              </Text>
              <Text style={styles.discountValue}>
                -{voucherDiscount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}

          {appliedVoucher?.freeItem && (
            <View style={styles.summaryRow}>
              <Text style={styles.freeItemLabel}>Quà tặng kèm</Text>
              <Text style={styles.freeItemValue}>
                {appliedVoucher.freeItem} (0đ)
              </Text>
            </View>
          )}

          {pointsDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>
                Giảm từ điểm thành viên ({pointsToUse} điểm)
              </Text>
              <Text style={styles.discountValue}>
                -{pointsDiscount.toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}

          {expectedPointsEarned > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.pointRewardLabel}>⭐ Điểm tích lũy nhận được</Text>
              <Text style={styles.pointRewardValue}>
                +{expectedPointsEarned} điểm
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.finalTotalValue}>
              {finalTotal.toLocaleString('vi-VN')}đ
            </Text>
          </View>

          {/* 7. NÚT XÁC NHẬN THANH TOÁN */}
          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              submittingPayment && styles.checkoutBtnDisabled,
            ]}
            onPress={handleConfirmPayment}
            disabled={submittingPayment}
            activeOpacity={0.85}
          >
            {submittingPayment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.checkoutBtnText}>
                XÁC NHẬN THANH TOÁN ({finalTotal.toLocaleString('vi-VN')}đ)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL CHỌN VOUCHER TỪ DANH SÁCH KHẢ DỤNG */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn mã giảm giá</Text>
              <TouchableOpacity
                onPress={() => setShowVoucherModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#E50914" />
                <Text style={styles.modalLoadingText}>Đang tải kho ưu đãi...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {availableVouchers.length === 0 ? (
                  <Text style={styles.emptyModalText}>
                    Không có voucher khả dụng nào.
                  </Text>
                ) : (
                  availableVouchers.map((v) => (
                    <VoucherCard
                      key={v._id || v.code}
                      voucher={v}
                      mode="select"
                      isSelected={appliedVoucher?.code === v.code}
                      onApply={(selected) => handleApplyVoucher(selected.code)}
                    />
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  backBtnText: {
    color: '#E50914',
    fontSize: 15,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#242424',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  movieHeaderCard: {
    flexDirection: 'row',
    gap: 12,
  },
  moviePoster: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  movieHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  movieName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  movieMetaHighlight: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  movieMeta: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 2,
  },
  formatBadge: {
    color: '#FFB800',
    fontWeight: 'bold',
  },
  showtimeBadge: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  demoPickerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#262626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoPickerLabel: {
    color: '#8A8A8A',
    fontSize: 11,
  },
  demoPickerChips: {
    flexDirection: 'row',
    gap: 8,
  },
  demoChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
  demoChipActive: {
    backgroundColor: '#E50914',
  },
  demoChipText: {
    color: '#CCCCCC',
    fontSize: 11,
    fontWeight: 'bold',
  },
  demoChipTextActive: {
    color: '#FFFFFF',
  },
  seatCountBadge: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: 'bold',
  },
  seatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
  },
  seatsListText: {
    color: '#D1D1D1',
    fontSize: 14,
  },
  seatsHighlight: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  seatsPriceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  concessionItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  concessionName: {
    color: '#D1D1D1',
    fontSize: 13,
  },
  concessionPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyConcessionText: {
    color: '#777777',
    fontSize: 13,
    fontStyle: 'italic',
  },
  comboCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#2F2F2F',
  },
  comboCheckboxActive: {
    borderColor: '#E50914',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#777777',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  comboInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comboName: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  comboPrice: {
    color: '#FF767D',
    fontWeight: 'bold',
    fontSize: 13,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#201617',
    borderWidth: 1,
    borderColor: '#4A2528',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  applyCodeBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  applyCodeBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  quickCodeList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  quickCodeLabel: {
    color: '#8A8A8A',
    fontSize: 11,
  },
  quickCodeChip: {
    backgroundColor: '#2E191B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4E272B',
  },
  quickCodeText: {
    color: '#FFA3A8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  appliedVoucherBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#201517',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  appliedVoucherLeft: {
    flex: 1,
  },
  appliedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedVoucherCode: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 15,
  },
  appliedBadge: {
    backgroundColor: '#1E3A25',
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  appliedVoucherTitle: {
    color: '#D1D1D1',
    fontSize: 12,
    marginTop: 4,
  },
  appliedFreeItem: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  appliedSavingText: {
    color: '#FF4A52',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  removeVoucherBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2E181A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#592023',
  },
  removeVoucherText: {
    color: '#FF4A52',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsBadge: {
    backgroundColor: '#242012',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#54461B',
  },
  pointsBadgeText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsExchangeNote: {
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  boldRed: {
    color: '#FF6B72',
    fontWeight: 'bold',
  },
  pointsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pointsInput: {
    width: 90,
    height: 44,
    backgroundColor: '#202020',
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pointsUnitText: {
    color: '#8A8A8A',
    fontSize: 13,
  },
  useMaxPointsBtn: {
    backgroundColor: '#292929',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  useMaxPointsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resetPointsBtn: {
    paddingHorizontal: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetPointsBtnText: {
    color: '#8A8A8A',
    fontSize: 12,
  },
  pointsDiscountApplied: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#152519',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#23442A',
  },
  pointsDiscountAppliedText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#9E9E9E',
    fontSize: 13,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  discountLabel: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '600',
  },
  discountValue: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: 'bold',
  },
  freeItemLabel: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '600',
  },
  freeItemValue: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pointRewardLabel: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: '600',
  },
  pointRewardValue: {
    color: '#FACC15',
    fontSize: 13,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 12,
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  finalTotalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    color: '#E50914',
    fontSize: 22,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    backgroundColor: '#E50914',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#661519',
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    color: '#8A8A8A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalList: {
    paddingBottom: 20,
  },
  modalLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    color: '#8A8A8A',
    marginTop: 10,
    fontSize: 13,
  },
  emptyModalText: {
    color: '#8A8A8A',
    textAlign: 'center',
    paddingVertical: 30,
    fontSize: 13,
  },
});
