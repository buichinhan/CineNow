
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
} from 'react-native';

export default function RegisterScreen({ onLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
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

    if (password.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu cần có ít nhất 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    Alert.alert(
      'Thông tin hợp lệ',
      'Giao diện đăng ký đã hoạt động. Chức năng tạo tài khoản sẽ được kết nối sau.'
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo CineNow */}
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▷</Text>
          </View>

          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>

        {/* Tiêu đề */}
        <Text style={styles.title}>Tạo tài khoản</Text>

        <Text style={styles.subtitle}>
          Tham gia CineNow để đặt vé xem phim dễ dàng
        </Text>

        {/* Họ tên */}
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

        {/* Email */}
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

        {/* Mật khẩu */}
        <Text style={styles.label}>Mật khẩu</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Ít nhất 6 ký tự"
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

        {/* Xác nhận mật khẩu */}
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

        {/* Nút đăng ký */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>ĐĂNG KÝ</Text>
        </TouchableOpacity>

        {/* Quay lại đăng nhập */}
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
    </View>
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
    paddingTop: 55,
    paddingBottom: 30,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#E51B23',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 2,
    marginTop: -2,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoRed: {
    color: '#E51B23',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 9,
  },
  subtitle: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 27,
  },
  label: {
    color: '#EEEEEE',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
  },
  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 9,
    backgroundColor: '#171717',
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 19,
  },
  passwordContainer: {
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 9,
    backgroundColor: '#171717',
    paddingHorizontal: 14,
    marginBottom: 19,
  },
  passwordInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  showPassword: {
    color: '#E51B23',
    fontSize: 11,
    fontWeight: '800',
    paddingLeft: 10,
  },
  registerButton: {
    height: 50,
    backgroundColor: '#E51B23',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#999999',
    fontSize: 13,
  },
  loginLink: {
    color: '#E51B23',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    color: '#555555',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 30,
  },
});
