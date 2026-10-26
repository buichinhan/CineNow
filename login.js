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

export default function LoginScreen({ onRegister, onLoginSuccess }) {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!account.trim() || !password) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập tài khoản và mật khẩu.',
      );
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
          emailOrPhone: account.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Đăng nhập thất bại',
          data.message || 'Tài khoản hoặc mật khẩu không chính xác.',
        );
        return;
      }

      Alert.alert(
        'Đăng nhập thành công',
        `Xin chào ${data.user?.fullName || 'bạn'}!`,
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
        'Hãy kiểm tra backend đang chạy và địa chỉ API.',
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▶</Text>
          </View>

          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>

        <View style={styles.headingContainer}>
          <Text style={styles.title}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>
            Đăng nhập để tiếp tục hành trình điện ảnh của bạn.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email hoặc số điện thoại</Text>

          <TextInput
            style={styles.input}
            placeholder="Nhập email hoặc số điện thoại"
            placeholderTextColor="#777777"
            value={account}
            onChangeText={setAccount}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
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
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showPasswordButton}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() =>
              Alert.alert(
                'Quên mật khẩu',
                'Chức năng này sẽ được bổ sung sau.',
              )
            }
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>

            <TouchableOpacity
              onPress={onRegister}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            Mỗi tấm vé, một câu chuyện.
          </Text>
          <Text style={styles.footerCopyright}>© CineNow</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 65,
    paddingBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 55,
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
    letterSpacing: 0.5,
  },
  logoRed: {
    color: '#E50914',
  },
  headingContainer: {
    marginBottom: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: '#A5A5A5',
    fontSize: 14,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#F0F0F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 18,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#353535',
    borderRadius: 12,
    backgroundColor: '#171717',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  passwordContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#353535',
    borderRadius: 12,
    backgroundColor: '#171717',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  showPasswordButton: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  showPasswordText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 16,
    marginBottom: 28,
  },
  forgotText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    height: 54,
    backgroundColor: '#E50914',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 28,
  },
  registerText: {
    color: '#A5A5A5',
    fontSize: 13,
  },
  registerLink: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 55,
  },
  footerLine: {
    width: 45,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E50914',
    marginBottom: 16,
  },
  footerText: {
    color: '#A5A5A5',
    fontSize: 13,
    fontStyle: 'italic',
  },
  footerCopyright: {
    color: '#555555',
    fontSize: 11,
    marginTop: 12,
  },
});