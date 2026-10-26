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
import VoucherScreen from './screens/VoucherScreen';
import BookingCheckoutDemoScreen from './screens/BookingCheckoutDemoScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash'); // 'splash' | 'login' | 'register' | 'main'
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'vouchers' | 'checkout' | 'profile'
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedVoucherForCheckout, setSelectedVoucherForCheckout] = useState(null);

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
    setCurrentScreen('main');
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
            setSelectedVoucherForCheckout(null);
            setCurrentScreen('login');
          },
        },
      ]
    );
  };

  // Chuyển từ tab Voucher sang màn hình Checkout để dùng voucher
  const handleUseVoucherAtCheckout = (voucher) => {
    setSelectedVoucherForCheckout(voucher);
    setActiveTab('checkout');
  };

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

  if (currentScreen === 'splash') {
    return <Splash onStart={() => setCurrentScreen('login')} />;
  }

  // Giao diện chính sau khi đăng nhập thành công
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerUserBadge}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={styles.headerUserIcon}>👤</Text>
          <Text style={styles.headerUserName} numberOfLines={1}>
            {user?.fullName?.split(' ')?.pop() || 'User'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT */}
      <View style={styles.contentArea}>
        {activeTab === 'home' && (
          <ScrollView
            style={styles.homeScroll}
            contentContainerStyle={styles.homeScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Chào mừng */}
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeGreeting}>Xin chào,</Text>
              <Text style={styles.welcomeName}>{user?.fullName || 'bạn'}! 👋</Text>
              <Text style={styles.welcomeSub}>
                Sẵn sàng cho những thước phim điện ảnh đỉnh cao hôm nay chưa?
              </Text>
            </View>

            {/* Banner Ưu Đãi Nổi Bật */}
            <TouchableOpacity
              style={styles.promoBannerCard}
              activeOpacity={0.85}
              onPress={() => setActiveTab('vouchers')}
            >
              <View style={styles.promoBannerTag}>
                <Text style={styles.promoBannerTagText}>HOT DEALS</Text>
              </View>
              <Text style={styles.promoBannerTitle}>
                🎁 Ưu đãi độc quyền CineNow
              </Text>
              <Text style={styles.promoBannerDesc}>
                Nhận ngay voucher giảm đến 50.000đ và tặng bắp nước miễn phí khi đặt vé.
              </Text>
              <View style={styles.promoBannerBtn}>
                <Text style={styles.promoBannerBtnText}>Khám phá kho Voucher ›</Text>
              </View>
            </TouchableOpacity>

            {/* Phím tắt nhanh các phân hệ */}
            <Text style={styles.quickSectionTitle}>Khám phá các phân hệ</Text>
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => setActiveTab('vouchers')}
              >
                <Text style={styles.quickCardIcon}>🎟️</Text>
                <Text style={styles.quickCardTitle}>Kho Voucher</Text>
                <Text style={styles.quickCardDesc}>
                  Săn mã & quản lý ví ưu đãi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                activeOpacity={0.8}
                onPress={() => setActiveTab('checkout')}
              >
                <Text style={styles.quickCardIcon}>💳</Text>
                <Text style={styles.quickCardTitle}>Thử Áp Mã</Text>
                <Text style={styles.quickCardDesc}>
                  Giả lập đặt vé & trừ tiền live
                </Text>
              </TouchableOpacity>
            </View>

            {/* Thông tin Hạng Thành Viên */}
            <View style={styles.membershipCard}>
              <View style={styles.memberHeader}>
                <View>
                  <Text style={styles.memberTier}>THÀNH VIÊN BẠC (SILVER)</Text>
                  <Text style={styles.memberId}>ID: {user?.id?.slice(-8)?.toUpperCase() || 'CN-2026'}</Text>
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

        {activeTab === 'vouchers' && (
          <VoucherScreen
            user={user}
            token={token}
            onNavigateToCheckout={handleUseVoucherAtCheckout}
          />
        )}

        {activeTab === 'checkout' && (
          <BookingCheckoutDemoScreen
            token={token}
            initialVoucher={selectedVoucherForCheckout}
            onNavigateToVoucherList={() => setActiveTab('vouchers')}
          />
        )}

        {activeTab === 'profile' && (
          <ScrollView style={styles.profileContainer} contentContainerStyle={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={styles.profileName}>{user?.fullName}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profilePhone}>📱 {user?.phone}</Text>
            </View>

            <View style={styles.profileMenu}>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => setActiveTab('vouchers')}
              >
                <Text style={styles.profileMenuIcon}>🎟️</Text>
                <Text style={styles.profileMenuText}>Ví Voucher của tôi</Text>
                <Text style={styles.profileMenuArrow}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() => setActiveTab('checkout')}
              >
                <Text style={styles.profileMenuIcon}>🍿</Text>
                <Text style={styles.profileMenuText}>Thử Đặt Vé & Áp Voucher</Text>
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

      {/* BOTTOM NAVIGATION BAR */}
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
            🎬
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
          onPress={() => setActiveTab('checkout')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'checkout' && styles.navIconActive,
            ]}
          >
            💳
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'checkout' && styles.navLabelActive,
            ]}
          >
            Thử Đặt Vé
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
    color: '#D1D1D1',
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
    color: '#8A8A8A',
    fontSize: 14,
  },
  welcomeName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  welcomeSub: {
    color: '#A0A0A0',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 19,
  },
  promoBannerCard: {
    backgroundColor: '#201013',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#521D24',
    marginBottom: 24,
  },
  promoBannerTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  promoBannerTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  promoBannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  promoBannerDesc: {
    color: '#C0A0A5',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  promoBannerBtn: {
    alignSelf: 'flex-start',
  },
  promoBannerBtnText: {
    color: '#FF5C65',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  quickCardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  quickCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickCardDesc: {
    color: '#8A8A8A',
    fontSize: 11,
    lineHeight: 16,
  },
  membershipCard: {
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2B2B2B',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberTier: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  memberId: {
    color: '#777777',
    fontSize: 11,
    marginTop: 2,
  },
  memberBadge: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
  },
  memberProgressBg: {
    height: 6,
    backgroundColor: '#2A2A2A',
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
    fontSize: 34,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#8A8A8A',
    fontSize: 13,
    marginTop: 4,
  },
  profilePhone: {
    color: '#A0A0A0',
    fontSize: 13,
    marginTop: 4,
  },
  profileMenu: {
    width: '100%',
    backgroundColor: '#161616',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
    marginBottom: 30,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
  },
  profileMenuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  profileMenuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#222222',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#777777',
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },
});