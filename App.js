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
import MovieCatalogScreen from './screens/MovieCatalogScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'login' | 'register' | 'home'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'movies' | 'profile'
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (currentScreen !== 'splash') {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentScreen]);

  // Nhận dữ liệu phản hồi từ API đăng nhập
  const handleLoginSuccess = (data) => {
    if (!data?.user || !data?.token) {
      Alert.alert(
        'Đăng nhập thất bại',
        'Dữ liệu người dùng hoặc token không hợp lệ.',
      );
      return;
    }

    setUser(data.user);
    setCurrentScreen('home');
    setActiveTab('home');
  };

  // Đăng xuất
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
            setCurrentScreen('login');
          },
        },
      ]
    );
  };

  // Màn hình đăng ký
  if (currentScreen === 'register') {
    return (
      <Register
        onLogin={() => setCurrentScreen('login')}
        onRegisterSuccess={() => setCurrentScreen('login')}
      />
    );
  }

  // Màn hình đăng nhập
  if (currentScreen === 'login') {
    return (
      <Login
        onRegister={() => setCurrentScreen('register')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Màn hình ứng dụng chính sau khi đăng nhập thành công
  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

        {/* 1. TOP HEADER CINENOW */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.logoRow}
            activeOpacity={0.8}
            onPress={() => setActiveTab('home')}
          >
            <View style={styles.logoIcon}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
            <Text style={styles.logoText}>
              Cine<Text style={styles.logoRed}>Now</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerUserBadge}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.headerUserIcon}>👤</Text>
            <Text style={styles.headerUserName} numberOfLines={1}>
              {user?.fullName?.split(' ')?.pop() || 'User'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. NỘI DUNG TỪNG TAB */}
        <View style={styles.contentArea}>
          {/* TAB 1: TRANG CHỦ */}
          {activeTab === 'home' && (
            <ScrollView
              style={styles.homeScroll}
              contentContainerStyle={styles.homeScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Lời chào */}
              <View style={styles.welcomeBanner}>
                <Text style={styles.welcomeGreeting}>Xin chào,</Text>
                <Text style={styles.welcomeName}>{user?.fullName || 'bạn'}! 👋</Text>
                <Text style={styles.welcomeSub}>
                  Sẵn sàng khám phá những siêu phẩm điện ảnh đỉnh cao hôm nay chưa?
                </Text>
              </View>

              {/* Banner Nổi Bật Dẫn Vào Kho Phim */}
              <TouchableOpacity
                style={styles.promoBannerCard}
                activeOpacity={0.85}
                onPress={() => setActiveTab('movies')}
              >
                <View style={styles.promoBannerTag}>
                  <Text style={styles.promoBannerTagText}>HOT MOVIES</Text>
                </View>
                <Text style={styles.promoBannerTitle}>
                  🎬 Khám phá phim đang chiếu & sắp chiếu
                </Text>
                <Text style={styles.promoBannerDesc}>
                  Tìm kiếm thông minh theo tên, diễn viên, đạo diễn. Lọc chuẩn 2D, 3D, IMAX và đặt vé nhanh trong tích tắc.
                </Text>
                <View style={styles.promoBannerBtn}>
                  <Text style={styles.promoBannerBtnText}>Duyệt danh mục phim ngay ›</Text>
                </View>
              </TouchableOpacity>

              {/* Lối tắt nhanh */}
              <Text style={styles.quickSectionTitle}>Lối tắt tính năng</Text>
              <View style={styles.quickGrid}>
                <TouchableOpacity
                  style={styles.quickCard}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('movies')}
                >
                  <Text style={styles.quickCardIcon}>🔍</Text>
                  <Text style={styles.quickCardTitle}>Tìm Kiếm Phim</Text>
                  <Text style={styles.quickCardDesc}>
                    Bộ lọc thể loại, định dạng & độ tuổi
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickCard}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab('profile')}
                >
                  <Text style={styles.quickCardIcon}>⭐</Text>
                  <Text style={styles.quickCardTitle}>Hạng Hội Viên</Text>
                  <Text style={styles.quickCardDesc}>
                    Tích điểm đổi vé xem phim & quà tặng
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Thẻ Hội Viên */}
              <View style={styles.membershipCard}>
                <View style={styles.memberHeader}>
                  <View>
                    <Text style={styles.memberTier}>THÀNH VIÊN BẠC (SILVER)</Text>
                    <Text style={styles.memberId}>
                      ID: {user?.id?.slice(-8)?.toUpperCase() || 'CN-2026'}
                    </Text>
                  </View>
                  <Text style={styles.memberBadge}>⭐ 120 Điểm</Text>
                </View>
                <View style={styles.memberProgressBg}>
                  <View style={styles.memberProgressBar} />
                </View>
                <Text style={styles.memberProgressHint}>
                  Tích thêm 80 điểm để nâng hạng Thành Viên Vàng (Gold)
                </Text>
              </View>
            </ScrollView>
          )}

          {/* TAB 2: TÌM KIẾM & DUYỆT DANH MỤC PHIM */}
          {activeTab === 'movies' && (
            <MovieCatalogScreen
              onSelectShowtime={(showtimeInfo) => {
                console.log('Đã chọn suất chiếu:', showtimeInfo);
              }}
            />
          )}

          {/* TAB 3: TÀI KHOẢN CÁ NHÂN */}
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
                <Text style={styles.profileName}>{user?.fullName}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Text style={styles.profilePhone}>📱 {user?.phone || 'Chưa cập nhật'}</Text>
              </View>

              <View style={styles.profileMenu}>
                <TouchableOpacity
                  style={styles.profileMenuItem}
                  onPress={() => setActiveTab('movies')}
                >
                  <Text style={styles.profileMenuIcon}>🎬</Text>
                  <Text style={styles.profileMenuText}>Duyệt danh mục phim</Text>
                  <Text style={styles.profileMenuArrow}>›</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>ĐĂNG XUẤT</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* 3. BOTTOM NAVIGATION BAR */}
        <View style={styles.bottomNav}>
          {/* TAB TRANG CHỦ */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>
              🎬
            </Text>
            <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
              Trang chủ
            </Text>
          </TouchableOpacity>

          {/* TAB DUYỆT PHIM */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('movies')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navIcon, activeTab === 'movies' && styles.navIconActive]}>
              🔍
            </Text>
            <Text style={[styles.navLabel, activeTab === 'movies' && styles.navLabelActive]}>
              Duyệt Phim
            </Text>
          </TouchableOpacity>

          {/* TAB TÀI KHOẢN */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navIcon, activeTab === 'profile' && styles.navIconActive]}>
              👤
            </Text>
            <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
              Tài khoản
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Mặc định: Màn hình Splash chào mừng
  return <Splash onStart={() => setCurrentScreen('login')} />;
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#0E0E0E',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoRed: {
    color: '#E50914',
  },
  headerUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#303030',
    maxWidth: 130,
  },
  headerUserIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  headerUserName: {
    color: '#EEEEEE',
    fontSize: 12,
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
  },
  homeScroll: {
    flex: 1,
  },
  homeScrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  welcomeBanner: {
    marginBottom: 20,
  },
  welcomeGreeting: {
    color: '#8E8E93',
    fontSize: 14,
  },
  welcomeName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  welcomeSub: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  promoBannerCard: {
    backgroundColor: '#1C1214',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3A1E22',
    marginBottom: 24,
  },
  promoBannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  promoBannerTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  promoBannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  promoBannerDesc: {
    color: '#CCCCCC',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  promoBannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E1517',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E50914',
  },
  promoBannerBtnText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickCard: {
    width: '48%',
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  quickCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickCardDesc: {
    color: '#8E8E93',
    fontSize: 11,
    lineHeight: 16,
  },
  membershipCard: {
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberTier: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  memberId: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2,
  },
  memberBadge: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberProgressBg: {
    height: 6,
    backgroundColor: '#262626',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  memberProgressBar: {
    width: '60%',
    height: '100%',
    backgroundColor: '#E50914',
  },
  memberProgressHint: {
    color: '#777777',
    fontSize: 11,
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
    marginTop: 10,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 2,
  },
  profilePhone: {
    color: '#777777',
    fontSize: 12,
  },
  profileMenu: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 24,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    height: 60,
    backgroundColor: '#0E0E0E',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 2,
  },
  navIconActive: {
    color: '#E50914',
  },
  navLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },
});
