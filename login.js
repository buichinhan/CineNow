import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { API_BASE_URL } from './apiConfig';

const API_URL = API_BASE_URL;

export default function Login({ onRegister, onLoginSuccess }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const identifier = emailOrPhone.trim();

    if (!identifier || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập email/số điện thoại và mật khẩu.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrPhone: identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Đăng nhập thất bại',
          data.message || 'Thông tin đăng nhập không chính xác.',
        );
        return;
      }

      if (!data.user || !data.token) {
        Alert.alert(
          'Lỗi dữ liệu',
          'Máy chủ chưa trả về đầy đủ thông tin người dùng và token.',
        );
        return;
      }

      Alert.alert(
        'Đăng nhập thành công',
        `Xin chào ${data.user.fullName || 'bạn'}!`,
        [
          {
            text: 'Tiếp tục',
            onPress: () => {
              if (onLoginSuccess) {
                onLoginSuccess(data);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Không kết nối được máy chủ',
        'Vui lòng kiểm tra kết nối Internet hoặc thử lại sau.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▶</Text>
          </View>

          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Chào mừng trở lại!</Text>

          <Text style={styles.subtitle}>
            Đăng nhập để tiếp tục hành trình điện ảnh của bạn.
          </Text>
        </View>

        <Text style={styles.label}>Email hoặc số điện thoại</Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập email hoặc số điện thoại"
          placeholderTextColor="#777777"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
        />

        <Text style={styles.label}>Mật khẩu</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#777777"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            <Text style={styles.showPassword}>
              {showPassword ? 'ẨN' : 'HIỆN'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() =>
            Alert.alert(
              'Quên mật khẩu',
              'Tính năng khôi phục mật khẩu sẽ được phát triển sau.',
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>HOẶC</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() =>
            Alert.alert(
              'Đăng nhập Google',
              'Tính năng đăng nhập Google chưa được tích hợp.',
            )
          }
          activeOpacity={0.8}
        >
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleButtonText}>
            Tiếp tục với Google
          </Text>
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>

          <TouchableOpacity onPress={onRegister} activeOpacity={0.7}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          CineNow · Mỗi tấm vé, một câu chuyện.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 45,
    paddingBottom: 30,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 45,
  },

  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '800',
  },

  logoRed: {
    color: '#E50914',
  },

  heading: {
    marginBottom: 30,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 10,
  },

  subtitle: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 21,
  },

  label: {
    color: '#EEEEEE',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    backgroundColor: '#171717',
    paddingHorizontal: 15,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 22,
  },

  passwordContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    backgroundColor: '#171717',
    paddingHorizontal: 15,
  },

  passwordInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },

  showPassword: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: '800',
    paddingLeft: 10,
    paddingVertical: 12,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 15,
    marginBottom: 8,
  },

  forgotText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },

  loginButton: {
    height: 52,
    backgroundColor: '#E50914',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#303030',
  },

  dividerText: {
    color: '#777777',
    fontSize: 10,
    marginHorizontal: 14,
    fontWeight: '600',
  },

  googleButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#393939',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151515',
  },

  googleIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 12,
  },

  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },

  registerText: {
    color: '#999999',
    fontSize: 13,
  },

  registerLink: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '700',
  },

  footer: {
    color: '#555555',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 35,
  },
});
