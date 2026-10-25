import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';

import Splash from './splash';
import Login from './login';
import Register from './register';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (currentScreen !== 'splash') {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen('login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentScreen]);

  // Nhận toàn bộ dữ liệu phản hồi từ API đăng nhập
  const handleLoginSuccess = (data) => {
    if (!data?.user || !data?.token) {
      Alert.alert(
        'Đăng nhập thất bại',
        'Dữ liệu người dùng hoặc token không hợp lệ.',
      );
      return;
    }

    setUser(data.user);
    setToken(data.token);
    setCurrentScreen('home');
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
            setToken(null);
            setCurrentScreen('login');
          },
        },
      ],
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

  // Màn hình chính sau đăng nhập
  if (currentScreen === 'home') {
    return (
      <View style={styles.homeContainer}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0B0B0B"
        />

        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▶</Text>
          </View>

          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>
            Chào mừng đến với CineNow!
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Xin chào, {user?.fullName || 'bạn'}!
          </Text>

          <Text style={styles.description}>
            Bạn đã đăng nhập thành công.
            {'\n'}
            Hãy sẵn sàng cho những trải nghiệm điện ảnh tuyệt vời.
          </Text>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎬</Text>

            <Text style={styles.featureTitle}>
              Khám phá phim
            </Text>

            <Text style={styles.featureDescription}>
              Các tính năng xem phim và đặt vé sẽ được phát triển ở bước tiếp theo.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>
              ĐĂNG XUẤT
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          © CineNow · Mỗi tấm vé, một câu chuyện.
        </Text>
      </View>
    );
  }

  // Màn hình chào mừng
  return (
    <Splash
      onStart={() => setCurrentScreen('login')}
    />
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 25,
    paddingTop: 65,
    paddingBottom: 25,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },

  logoRed: {
    color: '#E50914',
  },

  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  welcomeSubtitle: {
    color: '#E50914',
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 16,
  },

  description: {
    color: '#A5A5A5',
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 30,
  },

  featureCard: {
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#353535',
    borderRadius: 16,
    padding: 22,
    marginBottom: 28,
  },

  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },

  featureTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  featureDescription: {
    color: '#A5A5A5',
    fontSize: 13,
    lineHeight: 21,
  },

  logoutButton: {
    height: 52,
    backgroundColor: '#E50914',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  footer: {
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
});
