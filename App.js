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
import MovieCatalogScreen from './screens/MovieCatalogScreen';
import MyTicketsScreen from './screens/MyTicketsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
            setSelectedMovie(null);
            setSelectedBooking(null);
            setCurrentScreen('login');
          },
        },
      ]
    );
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
        onBack={() => setCurrentScreen('showtime')}
        onComplete={() => {
          setCurrentScreen('home');
          setActiveTab('tickets');
        }}
      />
    );
  }

  // 6. Ứng dụng chính
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

          {/* TAB 3: VÉ CỦA TÔI */}
          {activeTab === 'tickets' && (
            <MyTicketsScreen
              onBack={() => setActiveTab('home')}
            />
          )}

          {/* TAB 4: TÀI KHOẢN */}
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

              <View style={styles.profileMenu}>
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
                  style={styles.profileMenuItem}
                  onPress={() => setActiveTab('home')}
                >
                  <Text style={styles.profileMenuIcon}>🎟️</Text>
                  <Text style={styles.profileMenuText}>
                    Phim đang chiếu & Đặt vé
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
});
