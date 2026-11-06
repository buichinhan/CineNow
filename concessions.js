import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { fetchConcessions, createBooking } from './api';

// Dữ liệu dự phòng khi ngoại tuyến
const FALLBACK_CONCESSIONS = [
  {
    id: 'cb-01',
    name: 'Combo Solo (1 Bắp + 1 Nước)',
    category: 'combo',
    price: 85000,
    badge: 'Tiết kiệm 20k',
    description: '1 Bắp rang bơ ngọt (Lớn) + 1 Nước ngọt có gas 32oz',
    image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=400',
    isAvailable: true,
  },
  {
    id: 'cb-02',
    name: 'Combo Couple (1 Bắp + 2 Nước)',
    category: 'combo',
    price: 115000,
    badge: 'Bán chạy nhất 🔥',
    description: '1 Bắp phô mai đặc biệt (Lớn) + 2 Nước ngọt tuỳ chọn 32oz',
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400',
    isAvailable: true,
  },
  {
    id: 'cb-03',
    name: 'Combo CineParty (2 Bắp + 3 Nước + 1 Snack)',
    category: 'combo',
    price: 189000,
    badge: 'Ưu đãi nhóm',
    description: '2 Bắp lớn (Phô mai/Caramel) + 3 Nước ngọt + 1 Snack Lay\'s',
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-01',
    name: 'Bắp rang bơ Ngọt truyền thống (Lớn)',
    category: 'popcorn',
    price: 55000,
    badge: 'Truyền thống',
    description: 'Hạt bắp nổ giòn xốp phủ bơ vàng thơm nức mũi.',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-02',
    name: 'Bắp rang Phô Mai béo ngậy (Lớn)',
    category: 'popcorn',
    price: 65000,
    badge: 'Yêu thích ⭐',
    description: 'Lắc bột phô mai Cheddar hảo hạng đậm đà từng hạt bắp.',
    image: 'https://images.unsplash.com/photo-1585647347414-6726d8232217?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-03',
    name: 'Bắp rang Caramel giòn ngọt (Lớn)',
    category: 'popcorn',
    price: 65000,
    badge: 'Hot',
    description: 'Phủ sốt caramel đường nâu giòn rụm bóng bẩy ngọt lịm.',
    image: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=400',
    isAvailable: true,
  },
  {
    id: 'drk-01',
    name: 'Coca-Cola mát lạnh (Lớn 32oz)',
    category: 'drink',
    price: 35000,
    badge: '',
    description: 'Ly lớn 32oz đá mát lạnh sảng khoái đánh thức vị giác.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
    isAvailable: true,
  },
  {
    id: 'drk-02',
    name: 'Pepsi Không Calo (Lớn 32oz)',
    category: 'drink',
    price: 35000,
    badge: 'Zero Calo',
    description: 'Vị nguyên bản cực đã, hoàn toàn không đường không calo.',
    image: 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=400',
    isAvailable: true,
  },
  {
    id: 'drk-03',
    name: 'Trà Đào Cam Sả mát thanh',
    category: 'drink',
    price: 45000,
    badge: 'Thanh mát',
    description: 'Trà hoa quả đào giòn kèm hương sả cam tươi giải nhiệt.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
    isAvailable: true,
  },
  {
    id: 'drk-04',
    name: 'Nước khoáng Aquafina 500ml',
    category: 'drink',
    price: 20000,
    badge: '',
    description: 'Nước tinh khiết đóng chai mát lành.',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400',
    isAvailable: true,
  },
  {
    id: 'snk-01',
    name: 'Snack Khoai tây Lay\'s Tảo Biển',
    category: 'snack',
    price: 28000,
    badge: 'Giòn tan',
    description: 'Lát khoai tây mỏng giòn tẩm gia vị tảo biển thơm ngon.',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
    isAvailable: true,
  },
  {
    id: 'snk-02',
    name: 'Xúc xích nướng tiêu đen Đức',
    category: 'snack',
    price: 35000,
    badge: 'Nóng giòn',
    description: 'Xúc xích xông khói nướng nóng hổi, thơm bùi cay nhẹ tiêu đen.',
    image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400',
    isAvailable: true,
  },
  {
    id: 'snk-03',
    name: 'Bánh que Socola Pocky Nhật Bản',
    category: 'snack',
    price: 25000,
    badge: '',
    description: 'Bánh que quy giòn bọc socola thơm ngon dễ ăn trong rạp.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
    isAvailable: true,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'combo', label: 'Combo ưu đãi 🍿' },
  { key: 'popcorn', label: 'Bắp rang' },
  { key: 'drink', label: 'Nước ngọt' },
  { key: 'snack', label: 'Snack' },
];

export default function ConcessionsScreen({
  movie,
  bookingData,
  selectedSeats = [],
  seatTotal = 0,
  user,
  onBack,
  onComplete,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState({}); // { [itemId]: quantity }
  const [submitting, setSubmitting] = useState(false);

  // Đếm ngược thời gian giữ ghế
  const [remainingSeconds, setRemainingSeconds] = useState(
    bookingData?.remainingSeconds ||
      (bookingData?.holdExpiresAt
        ? Math.max(0, Math.round((bookingData.holdExpiresAt - Date.now()) / 1000))
        : 300)
  );

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleHoldExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const handleHoldExpired = () => {
    Alert.alert(
      'Hết thời gian giữ ghế! ⏳',
      'Đã hết thời gian giữ ghế (5 phút). Các ghế của bạn đã được tự động giải phóng.',
      [
        {
          text: 'Quay lại chọn ghế',
          onPress: () => onBack && onBack(),
        },
      ]
    );
  };

  const formatCountdown = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return '00:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    loadConcessions();
  }, []);

  const loadConcessions = async () => {
    try {
      setLoading(true);
      const data = await fetchConcessions();
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        setItems(FALLBACK_CONCESSIONS);
      }
    } catch (err) {
      console.warn('Lỗi tải bắp nước, dùng dữ liệu mẫu:', err.message);
      setItems(FALLBACK_CONCESSIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = (itemId) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const handleDecrement = (itemId) => {
    setCart((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: current - 1,
      };
    });
  };

  // Tính toán tiền bắp nước
  const selectedConcessionsList = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = items.find((i) => i.id === id);
      return {
        id,
        name: item?.name || 'Món',
        price: item?.price || 0,
        quantity: qty,
        category: item?.category,
        total: (item?.price || 0) * qty,
      };
    });

  const concessionsTotal = selectedConcessionsList.reduce(
    (sum, item) => sum + item.total,
    0
  );

  const totalQuantity = selectedConcessionsList.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const grandTotal = seatTotal + concessionsTotal;

  const movieTitle = movie?.title || bookingData?.movie?.title || 'Hành Tinh Đỏ';
  const cinemaName = bookingData?.cinema?.name || 'CineNow Landmark 81';
  const roomName = bookingData?.room || 'PHÒNG 03';
  const showDate = bookingData?.date || '16.10.2026';
  const showTime = bookingData?.time || '19:00';

  const handleConfirmOrder = async (skipConcessions = false) => {
    try {
      setSubmitting(true);

      const finalConcessions = skipConcessions ? [] : selectedConcessionsList;
      const finalConcessionsTotal = skipConcessions ? 0 : concessionsTotal;
      const finalGrandTotal = skipConcessions ? seatTotal : grandTotal;

      const payload = {
        userId: user?._id || user?.id,
        movieTitle,
        cinemaName,
        room: roomName,
        date: showDate,
        time: showTime,
        seats: selectedSeats,
        seatTotal,
        concessions: finalConcessions,
        concessionsTotal: finalConcessionsTotal,
        totalPrice: finalGrandTotal,
        holdToken: bookingData?.holdToken,
      };

      const res = await createBooking(payload);

      const bookingCode = res.data?.bookingCode || 'CN-' + Math.floor(100000 + Math.random() * 900000);
      const snackSummary = finalConcessions.length > 0
        ? `\nBắp nước: ${finalConcessions.map((c) => `${c.quantity}x ${c.name}`).join(', ')}`
        : '';

      Alert.alert(
        'Đặt vé thành công! 🎉',
        `Mã vé: ${bookingCode}\nPhim: ${movieTitle}\nSuất: ${showTime} - ${showDate}\nGhế: ${selectedSeats.join(', ')}${snackSummary}\nTổng tiền: ${finalGrandTotal.toLocaleString('vi-VN')}đ`,
        [
          {
            text: 'Xem vé của tôi',
            onPress: () => onComplete && onComplete(res.data),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Lỗi đặt vé', err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>❮</Text>
          <Text style={styles.topBarTitle}>Bắp nước & Snack</Text>
        </TouchableOpacity>
      </View>

      {/* Breadcrumb Steps (Phim -> Suất -> Ghế -> Combo -> Trả tiền -> Vé QR) */}
      <View style={styles.breadcrumbContainer}>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Phim</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Suất</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Ghế</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={[styles.stepText, styles.stepActive]}>Combo</Text>
          <View style={styles.stepIndicatorActive} />
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Trả tiền</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepText}>Vé QR</Text>
        </View>
      </View>

      {/* Countdown Timer Banner */}
      {remainingSeconds !== null && remainingSeconds > 0 && (
        <View style={styles.holdTimerBanner}>
          <Text style={styles.holdTimerIcon}>⏳</Text>
          <View style={styles.holdTimerTextContainer}>
            <Text style={styles.holdTimerTitle}>ĐANG GIỮ GHẾ TẠM THỜI</Text>
            <Text style={styles.holdTimerSubtitle}>
              Thời gian giữ ghế còn lại:{' '}
              <Text style={styles.holdTimerHighlight}>
                {formatCountdown(remainingSeconds)}
              </Text>
            </Text>
          </View>
        </View>
      )}

      {/* Booking Quick Pill */}
      <View style={styles.pillContainer}>
        <View style={styles.pillBox}>
          <Text style={styles.pillMovieTitle} numberOfLines={1}>🎬 {movieTitle}</Text>
          <Text style={styles.pillDetails}>
            {cinemaName} • {roomName} • {showTime} ({showDate}) • Ghế: {selectedSeats.join(', ')}
          </Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Items List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải danh mục bắp nước...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.itemsScroll}
          contentContainerStyle={styles.itemsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((item) => {
            const quantity = cart[item.id] || 0;
            const isPicked = quantity > 0;

            return (
              <View key={item.id} style={[styles.itemCard, isPicked && styles.itemCardActive]}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />

                <View style={styles.itemDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </View>

                  {item.badge ? (
                    <View style={styles.badgeWrapper}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.itemActionRow}>
                    <Text style={styles.itemPrice}>
                      {item.price.toLocaleString('vi-VN')}đ
                    </Text>

                    {/* Stepper */}
                    {quantity === 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleIncrement(item.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addButtonText}>+ Thêm</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleDecrement(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepperQty}>{quantity}</Text>

                        <TouchableOpacity
                          style={[styles.stepperBtn, styles.stepperBtnPlus]}
                          onPress={() => handleIncrement(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          <View style={{ height: 130 }} />
        </ScrollView>
      )}

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceBreakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Vé ({selectedSeats.length} ghế):</Text>
            <Text style={styles.breakdownValue}>{seatTotal.toLocaleString('vi-VN')}đ</Text>
          </View>
          {concessionsTotal > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Bắp & Nước ({totalQuantity} món):</Text>
              <Text style={styles.breakdownValue}>+{concessionsTotal.toLocaleString('vi-VN')}đ</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalTitle}>Tổng cộng:</Text>
            <Text style={styles.grandTotalPrice}>
              {grandTotal.toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleConfirmOrder(true)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
            onPress={() => handleConfirmOrder(false)}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>
                {concessionsTotal > 0 ? 'Xác nhận đặt vé' : 'Tiếp tục'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 10,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
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
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 2,
    backgroundColor: '#E50914',
    borderRadius: 1,
  },
  holdTimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#271708',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  holdTimerIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  holdTimerTextContainer: {
    flex: 1,
  },
  holdTimerTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  holdTimerSubtitle: {
    color: '#D4D4D8',
    fontSize: 12,
    marginTop: 1,
  },
  holdTimerHighlight: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pillContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  pillBox: {
    backgroundColor: '#18181B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E50914',
  },
  pillMovieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  pillDetails: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  categoryBar: {
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#18181B',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  categoryChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  categoryText: {
    color: '#A1A1AA',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    marginTop: 12,
    fontSize: 14,
  },
  itemsScroll: {
    flex: 1,
  },
  itemsScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  itemCardActive: {
    borderColor: '#E50914',
    backgroundColor: '#1C1617',
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#262626',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    flex: 1,
  },
  badgeWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: '#3F1214',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
    marginBottom: 3,
  },
  badgeText: {
    color: '#FF7B7F',
    fontSize: 10,
    fontWeight: '700',
  },
  itemDesc: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 15,
    marginVertical: 2,
  },
  itemActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  itemPrice: {
    color: '#4CD964',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#27272A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272A',
    borderRadius: 6,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#333338',
  },
  stepperBtnPlus: {
    backgroundColor: '#E50914',
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepperQty: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  priceBreakdown: {
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  breakdownLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  breakdownValue: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  totalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalPrice: {
    color: '#E50914',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#222222',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  skipButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#E50914',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#77151A',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
