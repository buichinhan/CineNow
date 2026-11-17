
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import Splash from './splash';
import Login from './login';
import Register from './register';
import HomeScreen from './home';
import MovieDetailScreen from './movieDetail';
import ShowtimeScreen from './showtime';
import SeatSelectionScreen from './seatSelection';
import ConcessionsScreen from './concessions';
import MovieCatalogScreen from './screens/MovieCatalogScreen';
import MyTicketsScreen from './screens/MyTicketsScreen';
import VoucherScreen from './screens/VoucherScreen';
import BookingCheckoutDemoScreen from './screens/BookingCheckoutDemoScreen';

import { API_BASE_URL } from './apiConfig';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedVoucherForCheckout, setSelectedVoucherForCheckout] = useState(null);

  // Modal lịch sử điểm
  const [loyaltyHistoryVisible, setLoyaltyHistoryVisible] = useState(false);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (currentScreen !== 'splash') return;

    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentScreen]);

  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setToken(data.token);
    setCurrentScreen('home');
    setActiveTab('home');
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            setUser(null);
            setToken(null);
            setSelectedMovie(null);
            setSelectedBooking(null);
            setSelectedVoucherForCheckout(null);
            setCurrentScreen('login');
          },
        },
      ]
    );
  };

  const handleBookingComplete = (newBooking) => {
    if (!newBooking?._id && !newBooking?.id && !newBooking?.bookingCode) {
      Alert.alert(
        'Chưa xác nhận được vé',
        'Vui lòng kiểm tra Vé của tôi trước khi đặt lại.'
      );
      return;
    }

    setSelectedBooking(null);
    setSelectedVoucherForCheckout(null);
    setCurrentScreen('home');
    setActiveTab('tickets');
  };
  const handleOpenLoyaltyHistory = async () => {
    setLoyaltyHistoryVisible(true);
    if (!token) {
      setLoyaltyHistory([
        {
          _id: 'tx_demo_1',
          type: 'EARN',
          points: 120,
          balanceAfter: user?.loyaltyPoints || 120,
          description: 'Thưởng điểm hội viên CineNow mới',
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }
    try {
      setLoadingHistory(true);
      const res = await fetch(`${API_BASE_URL}/loyalty/history`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setLoyaltyHistory(json.data || []);
      }
    } catch (err) {
      console.warn('Lỗi tải lịch sử điểm:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 1. Màn hình Đăng ký
  if (currentScreen === 'register') {
    return (
      <Register
        onLogin={() => setCurrentScreen('login')}
        onRegisterSuccess={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'login') {
    return (
      <Login
        onRegister={() => setCurrentScreen('register')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentScreen === 'movieDetail') {
    return (
      <MovieDetailScreen
        movie={selectedMovie}
        onBack={() => setCurrentScreen('home')}
        onBookTicket={(movie) => {
          setSelectedMovie(movie);
          setCurrentScreen('showtime');
        }}
      />
    );
  }

  if (currentScreen === 'showtime') {
    return (
      <ShowtimeScreen
        movie={selectedMovie}
        onBack={() => setCurrentScreen('movieDetail')}
        onSelectMovie={() => setCurrentScreen('home')}
        onContinue={(bookingData) => {
  console.log('=== SHOWTIME → SEAT ===');
  console.log('Ngày:', bookingData.date);
  console.log('Giờ:', bookingData.time);
  console.log('Phim:', bookingData.movie?.title);

  setSelectedBooking(bookingData);
  setCurrentScreen('seatSelection');
}}
      />
    );
  }

  if (currentScreen === 'seatSelection') {
    return (
      <SeatSelectionScreen
        movie={selectedMovie}
        bookingData={selectedBooking}
        user={user}
        onBack={() => setCurrentScreen('showtime')}
        onContinue={(seatData) => {
          setSelectedBooking((prev) => ({
            ...prev,
            ...seatData,
          }));
          setCurrentScreen('concessions');
        }}
        onComplete={handleBookingComplete}
      />
    );
  }

  // 6. Màn hình Bắp nước & Snack (Concessions)
  if (currentScreen === 'concessions') {
    return (
      <ConcessionsScreen
        movie={selectedMovie}
        bookingData={selectedBooking}
        selectedSeats={selectedBooking?.selectedSeats || []}
        seatTotal={selectedBooking?.seatTotal || 0}
        user={user}
        onBack={() => setCurrentScreen('seatSelection')}
        onContinueToCheckout={(concessionsData) => {
          setSelectedBooking((prev) => ({
            ...prev,
            ...concessionsData,
          }));
          setCurrentScreen('checkout');
        }}
        onComplete={handleBookingComplete}
      />
    );
  }

  // 7. Màn hình Thanh toán, Áp Voucher & Điểm thành viên (Checkout)
  if (currentScreen === 'checkout') {
    return (
      <BookingCheckoutDemoScreen
        movie={selectedMovie}
        bookingData={selectedBooking}
        selectedSeats={selectedBooking?.selectedSeats || []}
        seatTotal={selectedBooking?.seatTotal || 0}
        concessions={selectedBooking?.concessions || []}
        concessionsTotal={selectedBooking?.concessionsTotal || 0}
        user={user}
        token={token}
        initialVoucher={selectedVoucherForCheckout}
        onBack={() => {
          if (selectedBooking) {
            setCurrentScreen('concessions');
          } else {
            setCurrentScreen('home');
          }
        }}
        onNavigateToVoucherList={() => {
          setCurrentScreen('home');
          setActiveTab('vouchers');
        }}
        onComplete={handleBookingComplete}
      />
    );
  }

  // 8. Ứng dụng chính
  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0B0B0B"
        />

        <View style={styles.contentArea}>
          {activeTab === 'home' && (
            <HomeScreen
              user={user}
              onSelectMovie={(movie) => {
                setSelectedMovie(movie);
                setCurrentScreen('movieDetail');
              }}
              onQuickBooking={(movie) => {
                setSelectedMovie(movie);
                setCurrentScreen('showtime');
              }}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'movies' && (
            <MovieCatalogScreen
              onSelectShowtime={(showtimeInfo) => {
                setSelectedMovie(
                  showtimeInfo.movie || showtimeInfo
                );
                setCurrentScreen('showtime');
              }}
            />
          )}

          {/* TAB 3: ƯU ĐÃI & VOUCHER */}
          {activeTab === 'vouchers' && (
            <VoucherScreen
              user={user}
              token={token}
              onNavigateToCheckout={(voucher) => {
                setSelectedVoucherForCheckout(voucher);
                setCurrentScreen('checkout');
              }}
            />
          )}

          {/* TAB 4: VÉ CỦA TÔI */}
          {activeTab === 'tickets' && (
            <MyTicketsScreen
              user={user}
              token={token}
              onBack={() => setActiveTab('home')}
            />
          )}

          {/* TAB 5: TÀI KHOẢN & ĐIỂM THÀNH VIÊN */}
          {activeTab === 'profile' && (
            <ScrollView
              style={styles.profileContainer}
              contentContainerStyle={styles.profileContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>

                <Text style={styles.profileName}>
                  {user?.fullName || 'Người dùng CineNow'}
                </Text>

                <Text style={styles.profileEmail}>
                  {user?.email || 'user@cinenow.vn'}
                </Text>

                <Text style={styles.profilePhone}>
                  📱 {user?.phone || 'Chưa cập nhật'}
                </Text>
              </View>

              {/* THẺ ĐIỂM THÀNH VIÊN */}
              <View style={styles.memberCard}>
                <View style={styles.memberCardHeader}>
                  <Text style={styles.memberCardTitle}>⭐ HỘI VIÊN CINENOW</Text>
                  <Text style={styles.memberTierBadge}>GOLD VIP</Text>
                </View>
                <View style={styles.memberPointsRow}>
                  <View>
                    <Text style={styles.memberPointsLabel}>Điểm tích lũy hiện có</Text>
                    <Text style={styles.memberPointsValue}>
                      {(user?.loyaltyPoints || 120).toLocaleString('vi-VN')}{' '}
                      <Text style={styles.memberPointsUnit}>điểm</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.memberHistoryBtn}
                    onPress={handleOpenLoyaltyHistory}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.memberHistoryBtnText}>Lịch sử điểm ›</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.memberRateNote}>
                  Tương đương {((user?.loyaltyPoints || 120) * 1000).toLocaleString('vi-VN')}đ tiền giảm giá khi đặt vé (1 điểm = 1.000đ)
                </Text>
              </View>

              <View style={styles.profileMenu}>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => setActiveTab('vouchers')}
                >
                  <Text style={styles.profileMenuIcon}>🎟️</Text>
                  <Text style={styles.profileMenuText}>
                    Kho Voucher & Ví ưu đãi
                  </Text>
                  <Text style={styles.profileMenuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => {
                    setSelectedBooking(null);
                    setSelectedVoucherForCheckout(null);
                    setCurrentScreen('checkout');
                  }}
                >
                  <Text style={styles.profileMenuIcon}>🍿</Text>
                  <Text style={styles.profileMenuText}>
                    Thử Đặt Vé & Áp Voucher (Demo)
                  </Text>
                  <Text style={styles.profileMenuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => setActiveTab('movies')}
                >
                  <Text style={styles.profileMenuIcon}>🎬</Text>
                  <Text style={styles.profileMenuText}>
                    Duyệt danh mục phim
                  </Text>
                  <Text style={styles.profileMenuArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.profileMenuItem,
                    styles.lastProfileMenuItem,
                  ]}
                  onPress={() => setActiveTab('tickets')}
                >
                  <Text style={styles.profileMenuIcon}>🎫</Text>
                  <Text style={styles.profileMenuText}>
                    Vé của tôi
                  </Text>
                  <Text style={styles.profileMenuArrow}>›</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>
                  ĐĂNG XUẤT
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* MODAL LỊCH SỬ ĐIỂM THÀNH VIÊN */}
        {loyaltyHistoryVisible && (
          <View style={styles.historyModalOverlay}>
            <View style={styles.historyModalContent}>
              <View style={styles.historyModalHeader}>
                <Text style={styles.historyModalTitle}>Lịch sử biến động điểm</Text>
                <TouchableOpacity
                  onPress={() => setLoyaltyHistoryVisible(false)}
                  style={styles.historyCloseBtn}
                >
                  <Text style={styles.historyCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {loadingHistory ? (
                <View style={styles.historyLoadingBox}>
                  <Text style={styles.historyLoadingText}>Đang tải lịch sử điểm...</Text>
                </View>
              ) : loyaltyHistory.length === 0 ? (
                <View style={styles.historyEmptyBox}>
                  <Text style={styles.historyEmptyText}>Chưa có giao dịch điểm nào.</Text>
                </View>
              ) : (
                <ScrollView style={styles.historyList}>
                  {loyaltyHistory.map((item, idx) => (
                    <View key={item._id || idx} style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <Text style={styles.historyItemDesc}>{item.description}</Text>
                        <Text style={styles.historyItemDate}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : 'Gần đây'}
                        </Text>
                      </View>
                      <View style={styles.historyItemRight}>
                        <Text
                          style={[
                            styles.historyItemPoints,
                            item.points > 0 ? styles.pointsEarn : styles.pointsSpend,
                          ]}
                        >
                          {item.points > 0 ? `+${item.points}` : `${item.points}`} điểm
                        </Text>
                        <Text style={styles.historyBalanceAfter}>
                          Dư: {item.balanceAfter} điểm
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* THANH ĐIỀU HƯỚNG DƯỚI */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === 'home' && styles.navIconActive,
              ]}
            >
              🏠
            </Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'home' && styles.navLabelActive,
              ]}
            >
              Trang chủ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('movies')}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === 'movies' && styles.navIconActive,
              ]}
            >
              🔍
            </Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'movies' && styles.navLabelActive,
              ]}
            >
              Duyệt phim
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('vouchers')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === 'vouchers' && styles.navIconActive,
              ]}
            >
              🎟️
            </Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'vouchers' && styles.navLabelActive,
              ]}
            >
              Voucher
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('tickets')}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === 'tickets' && styles.navIconActive,
              ]}
            >
              🎫
            </Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'tickets' && styles.navLabelActive,
              ]}
            >
              Vé của tôi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === 'profile' && styles.navIconActive,
              ]}
            >
              👤
            </Text>
            <Text
              style={[
                styles.navLabel,
                activeTab === 'profile' && styles.navLabelActive,
              ]}
            >
              Tài khoản
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return <Splash onStart={() => setCurrentScreen('login')} />;
}

function CheckoutShell({ title, onBack, children }) {
  return (
    <SafeAreaView style={checkoutStyles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0B0B"
      />

      <View style={checkoutStyles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={checkoutStyles.back}
        >
          <Text style={checkoutStyles.text}>‹ Quay lại</Text>
        </TouchableOpacity>

        <Text style={checkoutStyles.heading}>{title}</Text>
      </View>

      {children}
    </SafeAreaView>
  );
}

function SummaryLine({ label, value, prominent }) {
  return (
    <View style={checkoutStyles.summaryLine}>
      <Text
        style={
          prominent
            ? checkoutStyles.itemTitle
            : checkoutStyles.muted
        }
      >
        {label}
      </Text>
      <Text
        style={
          prominent
            ? checkoutStyles.price
            : checkoutStyles.text
        }
      >
        {value}
      </Text>
    </View>
  );
}

function ComboStep({ data, onBack, onContinue }) {
  const [quantities, setQuantities] = useState({});

  const combos = COMBO_OPTIONS
    .filter((item) => (quantities[item.id] || 0) > 0)
    .map((item) => ({
      ...item,
      quantity: quantities[item.id],
    }));

  const comboPrice = combos.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const ticketPrice = Number(data?.ticketPrice || 0);

  const changeQuantity = (id, difference) => {
    setQuantities((previous) => ({
      ...previous,
      [id]: Math.max(
        0,
        (previous[id] || 0) + difference
      ),
    }));
  };

  return (
    <CheckoutShell title="Chọn combo" onBack={onBack}>
      <ScrollView contentContainerStyle={checkoutStyles.body}>
        <Text style={checkoutStyles.muted}>
          Chọn đồ ăn, nước uống hoặc bỏ qua.
        </Text>

        {COMBO_OPTIONS.map((item) => (
          <View key={item.id} style={checkoutStyles.card}>
            <Text style={checkoutStyles.itemTitle}>
              {item.name}
            </Text>

            <Text style={checkoutStyles.muted}>
              {item.detail}
            </Text>

            <Text style={checkoutStyles.price}>
              {vnd(item.price)}
            </Text>

            <View style={checkoutStyles.counter}>
              <TouchableOpacity
                onPress={() =>
                  changeQuantity(item.id, -1)
                }
                style={checkoutStyles.counterButton}
              >
                <Text style={checkoutStyles.text}>−</Text>
              </TouchableOpacity>

              <Text style={checkoutStyles.text}>
                {quantities[item.id] || 0}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  changeQuantity(item.id, 1)
                }
                style={checkoutStyles.counterButton}
              >
                <Text style={checkoutStyles.text}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={checkoutStyles.card}>
          <SummaryLine
            label="Tiền ghế"
            value={vnd(ticketPrice)}
          />
          <SummaryLine
            label="Tiền combo"
            value={vnd(comboPrice)}
          />
          <SummaryLine
            label="Tổng cộng"
            value={vnd(ticketPrice + comboPrice)}
            prominent
          />
        </View>

        <TouchableOpacity
          style={checkoutStyles.primaryButton}
          onPress={() =>
            onContinue(combos, comboPrice)
          }
        >
          <Text style={checkoutStyles.primaryText}>
            Tiếp tục thanh toán
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </CheckoutShell>
  );
}

function parseShowtime(date, time) {
  if (!date || !time) return null;

  const day = String(date).trim();
  const clock = String(time).match(/^(\d{1,2}):(\d{2})/);

  if (!clock) return null;

  let y, m, d;

  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    [y, m, d] = day.split('-').map(Number);
  } else if (
    /^\d{1,2}[./]\d{1,2}[./]\d{4}$/.test(day)
  ) {
    [d, m, y] = day.split(/[./]/).map(Number);
  } else {
    return null;
  }

  const result = new Date(
    y,
    m - 1,
    d,
    Number(clock[1]),
    Number(clock[2])
  );

  if (
    result.getFullYear() !== y ||
    result.getMonth() !== m - 1 ||
    result.getDate() !== d
  ) {
    return null;
  }

  return result;
}

function PaymentStep({ data, user, onBack, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);

  const ticketPrice = Number(data?.ticketPrice || 0);
  const comboPrice = Number(data?.comboPrice || 0);
  const totalPrice = ticketPrice + comboPrice;

  const confirm = async () => {
    if (submitting) return;

    if (
      !data?.seats?.length ||
      !data?.movieTitle ||
      !data?.cinemaName
    ) {
      Alert.alert(
        'Thiếu thông tin',
        'Vui lòng quay lại chọn suất và ghế.'
      );
      return;
    }

    const showtime = parseShowtime(
      data.date,
      data.time);
 console.log('=== KIỂM TRA SUẤT CHIẾU ===');
console.log('Ngày nhận được:', data.date);
console.log('Giờ nhận được:', data.time);
console.log('Ngày giờ sau khi chuyển:', showtime?.toString());
console.log('Thời gian thiết bị:', new Date().toString());


    if (!showtime || showtime <= new Date()) {
      Alert.alert(
        'Suất chiếu không hợp lệ',
        'Suất chiếu đã qua hoặc ngày giờ không hợp lệ. Vui lòng chọn lại suất chiếu.'
      );
      return;
    }

    if (
      !Number.isFinite(totalPrice) ||
      totalPrice <= 0
    ) {
      Alert.alert(
        'Giá vé không hợp lệ',
        'Vui lòng kiểm tra lại giá ghế.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...(user?._id || user?.id
          ? { userId: user._id || user.id }
          : {}),
        movieTitle: data.movieTitle,
        cinemaName: data.cinemaName,
        room: data.room,
        date: data.date,
        time: data.time,
        seats: data.seats,
        totalPrice,
      };

      // Backend hiện chưa được xác minh có lưu
      // danh sách combo riêng biệt.
      const response = await createBooking(payload);
      const saved = response?.data || {};

      if (!response?.success || !saved.bookingCode) {
        throw new Error(
          'Máy chủ chưa trả về mã đặt vé hợp lệ. Hãy kiểm tra Vé của tôi trước khi thử lại.'
        );
      }

      onSuccess({
        ...data,
        ...saved,
        bookingCode: saved.bookingCode,
        ticketPrice,
        comboPrice,
        totalPrice,
      });
    } catch (error) {
      Alert.alert(
        'Không thể xác nhận đặt vé',
        error?.message || 'Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CheckoutShell title="Thanh toán" onBack={onBack}>
      <ScrollView contentContainerStyle={checkoutStyles.body}>
        <View style={checkoutStyles.card}>
          <Text style={checkoutStyles.itemTitle}>
            {data?.movieTitle || 'Phim'}
          </Text>
          <Text style={checkoutStyles.muted}>
            {data?.cinemaName || ''}
          </Text>
          <Text style={checkoutStyles.text}>
            {data?.date} • {data?.time}
          </Text>
          <Text style={checkoutStyles.text}>
            Ghế: {(data?.seats || []).join(', ')}
          </Text>
        </View>

        <View style={checkoutStyles.card}>
          <Text style={checkoutStyles.itemTitle}>
            Combo đã chọn
          </Text>

          {data?.combos?.length ? (
            data.combos.map((item) => (
              <SummaryLine
                key={item.id}
                label={`${item.name} × ${item.quantity}`}
                value={vnd(
                  item.price * item.quantity
                )}
              />
            ))
          ) : (
            <Text style={checkoutStyles.muted}>
              Không chọn combo
            </Text>
          )}
        </View>

        <View style={checkoutStyles.card}>
          <SummaryLine
            label="Tiền ghế"
            value={vnd(ticketPrice)}
          />
          <SummaryLine
            label="Tiền combo"
            value={vnd(comboPrice)}
          />
          <SummaryLine
            label="Tổng cộng"
            value={vnd(totalPrice)}
            prominent
          />
        </View>

        <Text style={checkoutStyles.warning}>
          Đây là thanh toán mô phỏng phục vụ thử nghiệm.
          Không có giao dịch ngân hàng hoặc ví điện tử.
        </Text>

        <Text style={checkoutStyles.warning}>
          Combo được tính vào tổng tiền nhưng chưa được
          xác nhận lưu riêng trên backend.
        </Text>

        <TouchableOpacity
          disabled={submitting}
          style={[
            checkoutStyles.primaryButton,
            submitting && { opacity: 0.5 },
          ]}
          onPress={confirm}
        >
          <Text style={checkoutStyles.primaryText}>
            {submitting
              ? 'Đang xác nhận...'
              : 'Xác nhận đặt vé (mô phỏng)'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </CheckoutShell>
  );
}

function TicketResult({ ticket, onTickets }) {
  return (
    <CheckoutShell
      title="Đặt vé thành công"
      onBack={onTickets}
    >
      <ScrollView contentContainerStyle={checkoutStyles.body}>
        <View style={checkoutStyles.card}>
          <Text style={checkoutStyles.itemTitle}>
            Mã đặt vé
          </Text>

          <Text style={checkoutStyles.code}>
            {ticket?.bookingCode || 'Chưa có mã'}
          </Text>

          <Text style={checkoutStyles.itemTitle}>
            {ticket?.movieTitle}
          </Text>

          <Text style={checkoutStyles.text}>
            {ticket?.cinemaName}
          </Text>

          <Text style={checkoutStyles.text}>
            {ticket?.date} • {ticket?.time}
          </Text>

          <Text style={checkoutStyles.text}>
            Ghế: {(ticket?.seats || []).join(', ')}
          </Text>

          <SummaryLine
            label="Tổng tiền"
            value={vnd(ticket?.totalPrice)}
            prominent
          />

          <Text style={checkoutStyles.muted}>
            Mã QR cần được bổ sung sau khi xác nhận
            định dạng vé với backend.
          </Text>
        </View>

        <TouchableOpacity
          style={checkoutStyles.primaryButton}
          onPress={onTickets}
        >
          <Text style={checkoutStyles.primaryText}>
            Đến Vé của tôi
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </CheckoutShell>
  );
}

const checkoutStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#28282C',
  },
  back: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '700',
    marginTop: 10,
  },
  body: {
    padding: 18,
    paddingBottom: 48,
    gap: 14,
  },
  card: {
    backgroundColor: '#19191E',
    padding: 16,
    borderRadius: 14,
    gap: 9,
    borderWidth: 1,
    borderColor: '#292930',
  },
  itemTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  muted: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  price: {
    color: '#FF4A52',
    fontWeight: '700',
    fontSize: 16,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
  },
  counterButton: {
    backgroundColor: '#33333A',
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  warning: {
    color: '#FBBF24',
    fontSize: 12,
    lineHeight: 19,
  },
  code: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 10,
  },
});

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  contentArea: {
    flex: 1,
  },
  profileContainer: {
    flex: 1,
  },
  profileContent: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  profilePhone: {
    color: '#777777',
    fontSize: 13,
  },
  profileMenu: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 24,
    overflow: 'hidden',
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  lastProfileMenuItem: {
    borderBottomWidth: 0,
  },
  profileMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  profileMenuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  profileMenuArrow: {
    color: '#666666',
    fontSize: 18,
  },
  logoutBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#261214',
    borderWidth: 1,
    borderColor: '#E50914',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FF4A52',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#121214',
    borderTopWidth: 1,
    borderTopColor: '#222226',
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    color: '#71717A',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },

  // THẺ HỘI VIÊN & ĐIỂM
  memberCard: {
    width: '100%',
    backgroundColor: '#1E1810',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4A3B18',
    padding: 16,
    marginBottom: 20,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberCardTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  memberTierBadge: {
    backgroundColor: '#FFD700',
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberPointsLabel: {
    color: '#A09882',
    fontSize: 12,
  },
  memberPointsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  memberPointsUnit: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'normal',
  },
  memberHistoryBtn: {
    backgroundColor: '#352912',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#614B1F',
  },
  memberHistoryBtnText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberRateNote: {
    color: '#8A8068',
    fontSize: 11,
    marginTop: 4,
  },

  // MODAL LỊCH SỬ ĐIỂM
  historyModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  historyModalContent: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    padding: 16,
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
    marginBottom: 12,
  },
  historyModalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  historyCloseBtn: {
    padding: 4,
  },
  historyCloseText: {
    color: '#8A8A8A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyLoadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  historyLoadingText: {
    color: '#8A8A8A',
    fontSize: 13,
  },
  historyEmptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  historyEmptyText: {
    color: '#777777',
    fontSize: 13,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  historyItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  historyItemDesc: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyItemDate: {
    color: '#777777',
    fontSize: 11,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyItemPoints: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pointsEarn: {
    color: '#4ADE80',
  },
  pointsSpend: {
    color: '#FF6B72',
  },
  historyBalanceAfter: {
    color: '#8A8A8A',
    fontSize: 11,
    marginTop: 2,
  },
});
