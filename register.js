import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const API_URL = 'https://cinenow-backend-9on6.onrender.com/api';

export default function Register({ onLogin, onRegisterSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Thông báo', 'Email chưa đúng định dạng.');
      return;
    }

    if (!/^\d{10,11}$/.test(phone.trim())) {
      Alert.alert(
        'Thông báo',
        'Số điện thoại phải gồm 10 hoặc 11 chữ số.',
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Thông báo',
        'Mật khẩu phải có ít nhất 8 ký tự.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Thông báo',
        'Mật khẩu xác nhận không khớp.',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Đăng ký chưa thành công',
          data.message || 'Vui lòng thử lại.',
        );
        return;
      }

      Alert.alert(
        'Thành công',
        'Tạo tài khoản CineNow thành công! Bạn có thể đăng nhập.',
        [
          {
            text: 'Đăng nhập',
            onPress: () => {
              if (onRegisterSuccess) {
                onRegisterSuccess();
              } else if (onLogin) {
                onLogin();
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Không kết nối được máy chủ',
        'Vui lòng kiểm tra Internet hoặc thử lại sau.',
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

        <Text style={styles.title}>Tạo tài khoản</Text>

        <Text style={styles.subtitle}>
          Đăng ký một lần, đặt vé trong vài chạm.
        </Text>

        <Text style={styles.label}>Họ và tên</Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên"
          placeholderTextColor="#777777"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor="#777777"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />

        <Text style={styles.label}>Số điện thoại</Text>

        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          placeholderTextColor="#777777"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={11}
          returnKeyType="next"
        />

        <Text style={styles.label}>Mật khẩu</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Ít nhất 8 ký tự"
            placeholderTextColor="#777777"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="next"
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

        <Text style={styles.passwordHint}>
          {password.length >= 8
            ? '✓ Độ dài mật khẩu hợp lệ'
            : 'Mật khẩu cần ít nhất 8 ký tự'}
        </Text>

        <Text style={styles.label}>Xác nhận mật khẩu</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor="#777777"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            onPress={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            activeOpacity={0.7}
          >
            <Text style={styles.showPassword}>
              {showConfirmPassword ? 'ẨN' : 'HIỆN'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>ĐĂNG KÝ</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          Bằng việc đăng ký, bạn đồng ý với các điều khoản sử dụng CineNow.
        </Text>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Đã có tài khoản? </Text>

          <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          CineNow · Trải nghiệm điện ảnh trọn vẹn
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
    paddingHorizontal: 25,
    paddingTop: 45,
    paddingBottom: 30,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },

  logoRed: {
    color: '#E50914',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 8,
  },

  subtitle: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },

  label: {
    color: '#EEEEEE',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    backgroundColor: '#171717',
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 15,
  },

  passwordContainer: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    backgroundColor: '#171717',
    paddingHorizontal: 14,
    marginBottom: 8,
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
    paddingVertical: 10,
  },

  passwordHint: {
    color: '#999999',
    fontSize: 11,
    marginBottom: 15,
  },

  registerButton: {
    height: 50,
    backgroundColor: '#E50914',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  disabledButton: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  terms: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 23,
  },

  loginText: {
    color: '#999999',
    fontSize: 13,
  },

  loginLink: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '700',
  },

  footer: {
    color: '#555555',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 28,
  },
});
