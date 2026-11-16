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
import { initialTickets } from './data/mockTickets';
import { API_BASE_URL } from './apiConfig';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedVoucherForCheckout, setSelectedVoucherForCheckout] = useState(null);

  // Modal lịch sử điểm
  const [loyaltyHistoryVisible, setLoyaltyHistoryVisible] = useState(false);
  const [loyaltyHistory, setLoyaltyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (currentScreen !== 'splash') {
      return;
    }

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
        {
          text: 'Hủy',
          style: 'cancel',
        },
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
    if (newBooking) {
      const ticketToAdd = {
        id: newBooking.id || newBooking._id || `booking_${Date.now()}`,
        bookingCode:
          newBooking.bookingCode ||
          `CN-${Math.floor(100000 + Math.random() * 900000)}`,
        movieTitle:
          newBooking.movieTitle || selectedMovie?.title || 'Phim CineNow',
        poster:
          newBooking.poster ||
          selectedMovie?.poster ||
          selectedMovie?.posterUrl ||
          'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500',
        cinemaName:
          newBooking.cinemaName ||
          selectedBooking?.cinema?.name ||
          'CineNow Landmark 81',
        room: newBooking.room || selectedBooking?.room || 'PHÒNG 03',
        date: newBooking.date || selectedBooking?.date || 'Hôm nay',
        time: newBooking.time || selectedBooking?.time || '19:00',
        seats: newBooking.seats || selectedBooking?.selectedSeats || [],
        seatTotal: newBooking.seatTotal || selectedBooking?.seatTotal || 0,
        concessions: newBooking.concessions || [],
        concessionsTotal: newBooking.concessionsTotal || 0,
        totalPrice: newBooking.totalPrice || 0,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        refundStatus: 'Chưa yêu cầu',
      };

      setTickets((prev) => [ticketToAdd, ...prev]);
    }
    setSelectedBooking(null);
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

  // 2. Màn hình Đăng nhập
  if (currentScreen === 'login') {
    return (
      <Login
        onRegister={() => setCurrentScreen('register')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 3. Màn hình Chi tiết phim
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

  // 4. Màn hình Chọn suất chiếu
  if (currentScreen === 'showtime') {
    return (
      <ShowtimeScreen
        movie={selectedMovie}
        onBack={() => setCurrentScreen('movieDetail')}
        onSelectMovie={() => setCurrentScreen('home')}
        onContinue={(bookingData) => {
          setSelectedBooking(bookingData);
          setCurrentScreen('seatSelection');
        }}
      />
    );
  }

  // 5. Màn hình Chọn ghế
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
          {/* TAB 1: TRANG CHỦ */}
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

          {/* TAB 2: DUYỆT PHIM */}
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
              tickets={tickets}
              token={token}
              onTicketsChange={setTickets}
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
            activeOpacity={0.8}
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
            activeOpacity={0.8}
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
            activeOpacity={0.8}
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
            activeOpacity={0.8}
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

  // Mặc định: Màn hình Splash
  return <Splash onStart={() => setCurrentScreen('login')} />;
}

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

  navIconActive: {
    color: '#E50914',
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
