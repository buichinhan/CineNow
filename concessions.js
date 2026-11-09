import React, { useState, useEffect, useMemo } from 'react';
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
  TextInput,
  Modal,
} from 'react-native';
import { fetchConcessions, createBooking } from './api';

// Dữ liệu bắp nước dự phòng cao cấp
const FALLBACK_CONCESSIONS = [
  {
    id: 'cb-01',
    name: 'Combo Solo (1 Bắp + 1 Nước)',
    category: 'combo',
    price: 85000,
    badge: 'Tiết kiệm 20k',
    description: '1 Bắp rang bơ ngọt (Lớn) + 1 Nước ngọt có gas 32oz.',
    image: 'https://images.unsplash.com/photo-1572177812156-58036aae439c?w=400',
    isAvailable: true,
    flavors: ['Bơ ngọt truyền thống', 'Phô mai (+10k)', 'Caramel (+10k)'],
    drinks: ['Coca-Cola', 'Sprite', 'Fanta Cam', 'Nước khoáng'],
  },
  {
    id: 'cb-02',
    name: 'Combo Couple (1 Bắp + 2 Nước)',
    category: 'combo',
    price: 115000,
    badge: 'Bán chạy nhất 🔥',
    description: '1 Bắp phô mai đặc biệt (Lớn) + 2 Nước ngọt tuỳ chọn 32oz.',
    image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400',
    isAvailable: true,
    flavors: ['Phô mai hảo hạng', 'Bơ ngọt truyền thống', 'Caramel'],
    drinks: ['Coca-Cola & Sprite', '2x Coca-Cola', 'Coca-Cola & Fanta'],
  },
  {
    id: 'cb-03',
    name: 'Combo CineParty (2 Bắp + 3 Nước + 1 Snack)',
    category: 'combo',
    price: 189000,
    badge: 'Ưu đãi nhóm',
    description: '2 Bắp lớn (Phô mai/Caramel) + 3 Nước ngọt + 1 Snack Lay\'s giòn tan.',
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=400',
    isAvailable: true,
    flavors: ['1 Phô mai + 1 Caramel', '2 Bắp phô mai', '2 Bắp ngọt bơ'],
    drinks: ['3x Nước ngọt tuỳ chọn'],
  },
  {
    id: 'cb-04',
    name: 'Combo Gia Đình (3 Bắp + 4 Nước + 2 Snack)',
    category: 'combo',
    price: 259000,
    badge: 'Tiết kiệm 65k ⭐',
    description: '3 Bắp lớn vị tuỳ chọn + 4 Ly nước 32oz + 2 Gói bánh Snack Lay\'s.',
    image: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-01',
    name: 'Bắp rang bơ Ngọt truyền thống (Lớn)',
    category: 'popcorn',
    price: 55000,
    badge: 'Truyền thống',
    description: 'Hạt bắp nổ giòn xốp phủ bơ vàng óng thơm nức mũi.',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-02',
    name: 'Bắp rang Phô Mai béo ngậy (Lớn)',
    category: 'popcorn',
    price: 65000,
    badge: 'Yêu thích ⭐',
    description: 'Lắc bột phô mai Cheddar hảo hạng đậm đà từng hạt bắp giòn rụm.',
    image: 'https://images.unsplash.com/photo-1585647347414-6726d8232217?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-03',
    name: 'Bắp rang Caramel giòn ngọt (Lớn)',
    category: 'popcorn',
    price: 65000,
    badge: 'Hot',
    description: 'Phủ sốt caramel đường nâu giòn rụm bóng bẩy ngọt lịm khó cưỡng.',
    image: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=400',
    isAvailable: true,
  },
  {
    id: 'pop-04',
    name: 'Bắp rang Socola đậm vị (Lớn)',
    category: 'popcorn',
    price: 69000,
    badge: 'Mới ra mắt',
    description: 'Phủ socola nguyên chất thơm bùi, vị ngọt đắng tinh tế.',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400',
    isAvailable: true,
  },
  {
    id: 'drk-01',
    name: 'Coca-Cola mát lạnh (Lớn 32oz)',
    category: 'drink',
    price: 35000,
    badge: '',
    description: 'Ly lớn 32oz đá mát lạnh sảng khoái đánh thức mọi giác quan.',
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
    description: 'Trà hoa quả đào giòn kèm hương sả cam tươi ngọt thanh giải nhiệt.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
    isAvailable: true,
  },
  {
    id: 'drk-04',
    name: 'Nước khoáng Aquafina 500ml',
    category: 'drink',
    price: 20000,
    badge: '',
    description: 'Nước tinh khiết đóng chai mát lành, tiện lợi mang theo.',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=400',
    isAvailable: true,
  },
  {
    id: 'snk-01',
    name: 'Snack Khoai tây Lay\'s Tảo Biển',
    category: 'snack',
    price: 28000,
    badge: 'Giòn tan',
    description: 'Lát khoai tây mỏng giòn tẩm gia vị tảo biển thơm ngon đậm đà.',
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
    description: 'Bánh que quy giòn bọc socola thơm ngon dễ ăn khi xem phim.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400',
    isAvailable: true,
  },
  {
    id: 'snk-04',
    name: 'Khô bò xé sợi cay Tứ Xuyên',
    category: 'snack',
    price: 45000,
    badge: 'Cay nồng 🌶️',
    description: 'Thịt bò tẩm ướp thơm cay đậm vị, món nhâm nhi số 1 trong rạp.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    isAvailable: true,
  },
];

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'combo', label: 'Combo ưu đãi 🍿' },
  { key: 'popcorn', label: 'Bắp rang' },
  { key: 'drink', label: 'Nước ngọt' },
  { key: 'snack', label: 'Snack & Ăn vặt' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({}); // { [itemId]: { quantity: number, note: string } }
  const [submitting, setSubmitting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Đếm ngược thời gian giữ ghế (5 phút)
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
      'Đã hết thời gian giữ ghế (5 phút). Các ghế của bạn đã được tự động giải phóng. Vui lòng chọn lại ghế.',
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
      console.warn('Lỗi tải bắp nước, dùng dữ liệu dự phòng:', err.message);
      setItems(FALLBACK_CONCESSIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = (itemId) => {
    setCart((prev) => {
      const current = prev[itemId]?.quantity || 0;
      return {
        ...prev,
        [itemId]: {
          quantity: current + 1,
          note: prev[itemId]?.note || '',
        },
      };
    });
  };

  const handleDecrement = (itemId) => {
    setCart((prev) => {
      const current = prev[itemId]?.quantity || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: current - 1,
        },
      };
    });
  };

  const handleClearItem = (itemId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Danh sách các món bắp nước đã chọn
  const selectedConcessionsList = useMemo(() => {
    return Object.entries(cart)
      .filter(([_, data]) => data && data.quantity > 0)
      .map(([id, data]) => {
        const item = items.find((i) => i.id === id) || FALLBACK_CONCESSIONS.find((i) => i.id === id);
        return {
          id,
          name: item?.name || 'Món',
          price: item?.price || 0,
          quantity: data.quantity,
          category: item?.category,
          note: data.note || '',
          total: (item?.price || 0) * data.quantity,
          image: item?.image,
        };
      });
  }, [cart, items]);

  const concessionsTotal = useMemo(() => {
    return selectedConcessionsList.reduce((sum, item) => sum + item.total, 0);
  }, [selectedConcessionsList]);

  const totalQuantity = useMemo(() => {
    return selectedConcessionsList.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedConcessionsList]);

  const grandTotal = seatTotal + concessionsTotal;

  const movieTitle = movie?.title || bookingData?.movie?.title || 'Hành Tinh Đỏ';
  const moviePoster =
    movie?.poster ||
    movie?.posterUrl ||
    bookingData?.movie?.poster ||
    bookingData?.movie?.posterUrl ||
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500';
  const cinemaName = bookingData?.cinema?.name || 'CineNow Landmark 81';
  const roomName = bookingData?.room || 'PHÒNG 03';
  const showDate = bookingData?.date || '16.10.2026';
  const showTime = bookingData?.time || '19:00';

  const handleOpenConfirmModal = (skip = false) => {
    if (skip) {
      handleConfirmOrder(true);
    } else {
      setShowOrderModal(true);
    }
  };

  const handleConfirmOrder = async (skipConcessions = false) => {
    try {
      setShowOrderModal(false);
      setSubmitting(true);

      const finalConcessions = skipConcessions ? [] : selectedConcessionsList;
      const finalConcessionsTotal = skipConcessions ? 0 : concessionsTotal;
      const finalGrandTotal = skipConcessions ? seatTotal : grandTotal;

      const payload = {
        userId: user?._id || user?.id,
        movieTitle,
        poster: moviePoster,
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

      const bookingCode =
        res.data?.bookingCode || 'CN-' + Math.floor(100000 + Math.random() * 900000);
      const snackSummary =
        finalConcessions.length > 0
          ? `\n🍿 Bắp nước: ${finalConcessions
              .map((c) => `${c.quantity}x ${c.name}`)
              .join(', ')}`
          : '\n🍿 Bắp nước: Không';

      const bookingResult = {
        ...res.data,
        id: res.data?.id || res.data?._id || `booking_${Date.now()}`,
        bookingCode,
        movieTitle,
        poster: moviePoster,
        cinemaName,
        room: roomName,
        date: showDate,
        time: showTime,
        seats: selectedSeats,
        seatTotal,
        concessions: finalConcessions,
        concessionsTotal: finalConcessionsTotal,
        totalPrice: finalGrandTotal,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      Alert.alert(
        'Đặt vé thành công! 🎉',
        `Mã vé: ${bookingCode}\nPhim: ${movieTitle}\nSuất: ${showTime} (${showDate})\nGhế: ${selectedSeats.join(', ')}${snackSummary}\nTổng tiền: ${finalGrandTotal.toLocaleString('vi-VN')}đ\n\nQuý khách vui lòng quét mã vé tại quầy để nhận bắp nước.`,
        [
          {
            text: 'Xem vé của tôi',
            onPress: () => onComplete && onComplete(bookingResult),
          },
        ]
      );
    } catch (err) {
      Alert.alert('Lỗi đặt vé', err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc theo Category và Từ khóa tìm kiếm
  const filteredItems = items.filter((item) => {
    const matchCategory =
      selectedCategory === 'all' ? true : item.category === selectedCategory;
    const matchQuery =
      searchQuery.trim() === ''
        ? true
        : item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description &&
            item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>❮</Text>
          <Text style={styles.topBarTitle}>Bắp nước & Combo</Text>
        </TouchableOpacity>

        {totalQuantity > 0 && (
          <TouchableOpacity
            style={styles.cartHeaderButton}
            onPress={() => setShowCartDrawer(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.cartHeaderIcon}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalQuantity}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Breadcrumb Steps: Phim -> Suất -> Ghế -> Combo -> Trả tiền -> Vé QR */}
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
          <Text style={styles.stepText}>Xác nhận</Text>
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm combo, bắp rang, nước ngọt, snack..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
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
          <Text style={styles.loadingText}>Đang tải danh mục bắp nước & combo...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🍿</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy món phù hợp</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn mục khác.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.itemsScroll}
          contentContainerStyle={styles.itemsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((item) => {
            const quantity = cart[item.id]?.quantity || 0;
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

          {/* Quick Counter Info */}
          <View style={styles.counterNoticeBox}>
            <Text style={styles.counterNoticeIcon}>🥤</Text>
            <Text style={styles.counterNoticeText}>
              Bắp nước sẽ được chuẩn bị sẵn sàng và nhận tại Quầy Bắp Nước CineNow bằng cách quét mã vé khi tới rạp.
            </Text>
          </View>

          <View style={{ height: 140 }} />
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
            <TouchableOpacity
              style={styles.breakdownRow}
              onPress={() => setShowCartDrawer(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.breakdownLabelConcession}>
                🍿 Bắp nước ({totalQuantity} món) ▾
              </Text>
              <Text style={styles.breakdownValueConcession}>
                +{concessionsTotal.toLocaleString('vi-VN')}đ
              </Text>
            </TouchableOpacity>
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
            onPress={() => handleOpenConfirmModal(true)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
            onPress={() => handleOpenConfirmModal(false)}
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

      {/* Cart Drawer / Bottom Sheet Modal */}
      <Modal
        visible={showCartDrawer}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCartDrawer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cartModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🍿 Giỏ hàng bắp nước ({totalQuantity})</Text>
              <TouchableOpacity
                onPress={() => setShowCartDrawer(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedConcessionsList.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Text style={styles.emptyCartText}>Chưa có món bắp nước nào được chọn.</Text>
              </View>
            ) : (
              <ScrollView style={styles.cartList} showsVerticalScrollIndicator={false}>
                {selectedConcessionsList.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <Image source={{ uri: item.image }} style={styles.cartItemImg} />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        {item.price.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>

                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleDecrement(item.id)}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, styles.stepperBtnPlus]}
                        onPress={() => handleIncrement(item.id)}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleClearItem(item.id)}
                      style={styles.deleteCartItemBtn}
                    >
                      <Text style={styles.deleteCartItemText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.cartModalFooter}>
              <View style={styles.cartModalTotalRow}>
                <Text style={styles.cartModalTotalLabel}>Tiền bắp nước:</Text>
                <Text style={styles.cartModalTotalValue}>
                  {concessionsTotal.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cartModalConfirmBtn}
                onPress={() => setShowCartDrawer(false)}
              >
                <Text style={styles.cartModalConfirmText}>Xong</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Order Confirmation Summary Modal */}
      <Modal
        visible={showOrderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.summaryModalBox}>
            <Text style={styles.summaryModalTitle}>XÁC NHẬN ĐƠN ĐẶT VÉ</Text>

            <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>🎬 Thông tin suất chiếu</Text>
                <Text style={styles.summaryLineBold}>{movieTitle}</Text>
                <Text style={styles.summaryLine}>{cinemaName} • {roomName}</Text>
                <Text style={styles.summaryLine}>Suất: {showTime} ({showDate})</Text>
                <Text style={styles.summaryLine}>Ghế: <Text style={styles.highlightRed}>{selectedSeats.join(', ')}</Text></Text>
                <Text style={styles.summaryLinePrice}>Tiền vé: {seatTotal.toLocaleString('vi-VN')}đ</Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>🍿 Bắp nước & Combo</Text>
                {selectedConcessionsList.length === 0 ? (
                  <Text style={styles.summaryLineMuted}>Không chọn bắp nước</Text>
                ) : (
                  selectedConcessionsList.map((c) => (
                    <View key={c.id} style={styles.summaryConcessionRow}>
                      <Text style={styles.summaryConcessionName}>
                        {c.quantity}x {c.name}
                      </Text>
                      <Text style={styles.summaryConcessionPrice}>
                        {c.total.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  ))
                )}
                {concessionsTotal > 0 && (
                  <Text style={styles.summaryLinePrice}>
                    Tiền bắp nước: +{concessionsTotal.toLocaleString('vi-VN')}đ
                  </Text>
                )}
              </View>

              <View style={styles.summaryNoticeBox}>
                <Text style={styles.summaryNoticeText}>
                  🎟️ Quý khách xuất trình mã vé tại cổng soát vé và quầy bắp nước để nhận dịch vụ.
                </Text>
              </View>

              <View style={styles.summaryTotalBox}>
                <Text style={styles.summaryTotalLabel}>TỔNG THANH TOÁN:</Text>
                <Text style={styles.summaryTotalValue}>
                  {grandTotal.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>
            </ScrollView>

            <View style={styles.summaryModalActions}>
              <TouchableOpacity
                style={styles.summaryCancelBtn}
                onPress={() => setShowOrderModal(false)}
                disabled={submitting}
              >
                <Text style={styles.summaryCancelText}>Xem lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.summarySubmitBtn, submitting && styles.confirmButtonDisabled]}
                onPress={() => handleConfirmOrder(false)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.summarySubmitText}>Hoàn tất đặt vé</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
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
  cartHeaderButton: {
    position: 'relative',
    padding: 6,
  },
  cartHeaderIcon: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#E50914',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchText: {
    color: '#71717A',
    fontSize: 14,
    paddingHorizontal: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
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
    borderWidth: 1,
    borderColor: '#3F3F46',
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#1F1F23',
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
  counterNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1E',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  counterNoticeIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  counterNoticeText: {
    color: '#A1A1AA',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#121214',
    borderTopWidth: 1,
    borderTopColor: '#222226',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
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
    color: '#A1A1AA',
    fontSize: 12,
  },
  breakdownValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  breakdownLabelConcession: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownValueConcession: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  totalTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalPrice: {
    color: '#4CD964',
    fontSize: 18,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  skipButtonText: {
    color: '#D4D4D8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  cartModalBox: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    color: '#A1A1AA',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCartBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyCartText: {
    color: '#71717A',
    fontSize: 14,
  },
  cartList: {
    maxHeight: 280,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222226',
  },
  cartItemImg: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#27272A',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  cartItemName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cartItemPrice: {
    color: '#4CD964',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  deleteCartItemBtn: {
    padding: 8,
    marginLeft: 6,
  },
  deleteCartItemText: {
    fontSize: 16,
  },
  cartModalFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  cartModalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartModalTotalLabel: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  cartModalTotalValue: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartModalConfirmBtn: {
    backgroundColor: '#E50914',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryModalBox: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  summaryModalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.8,
  },
  summaryScroll: {
    maxHeight: 380,
  },
  summarySection: {
    backgroundColor: '#202024',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  summarySectionTitle: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  summaryLineBold: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  summaryLine: {
    color: '#D4D4D8',
    fontSize: 12,
    marginBottom: 2,
  },
  summaryLineMuted: {
    color: '#71717A',
    fontSize: 12,
    fontStyle: 'italic',
  },
  highlightRed: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  summaryLinePrice: {
    color: '#4CD964',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'right',
  },
  summaryConcessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryConcessionName: {
    color: '#D4D4D8',
    fontSize: 12,
    flex: 1,
  },
  summaryConcessionPrice: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryNoticeBox: {
    backgroundColor: '#1E1B15',
    borderWidth: 1,
    borderColor: '#78350F',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  summaryNoticeText: {
    color: '#FBBF24',
    fontSize: 11,
    lineHeight: 16,
  },
  summaryTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  summaryTotalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    color: '#4CD964',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  summaryCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCancelText: {
    color: '#D4D4D8',
    fontSize: 14,
    fontWeight: '600',
  },
  summarySubmitBtn: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
