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
} from 'react-native';

export default function LoginScreen() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!account.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tài khoản và mật khẩu.');
      return;
    }

    Alert.alert(
      'CineNow',
      'Giao diện đã hoạt động! Chức năng đăng nhập sẽ được kết nối backend sau.'
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0B0B0B"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.playIcon}>▶</Text>
          </View>

          <Text style={styles.logoText}>
            Cine<Text style={styles.logoRed}>Now</Text>
          </Text>
        </View>

        {/* TIÊU ĐỀ */}
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Chào mừng trở lại!</Text>

          <Text style={styles.subtitle}>
            Đăng nhập để tiếp tục hành trình điện ảnh của bạn.
          </Text>
        </View>

        {/* FORM ĐĂNG NHẬP */}
        <View style={styles.form}>
          <Text style={styles.label}>Email hoặc số điện thoại</Text>

          <TextInput
            style={styles.input}
            placeholder="Nhập email hoặc số điện thoại"
            placeholderTextColor="#777777"
            value={account}
            onChangeText={setAccount}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showPasswordButton}
            >
              <Text style={styles.showPasswordText}>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* QUÊN MẬT KHẨU */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() =>
              Alert.alert(
                'Quên mật khẩu',
                'Chức năng này sẽ được bổ sung sau.'
              )
            }
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* NÚT ĐĂNG NHẬP */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
          </TouchableOpacity>

          {/* ĐĂNG KÝ */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>
              Chưa có tài khoản?{' '}
            </Text>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Đăng ký',
                  'Chúng ta sẽ xây dựng màn hình đăng ký tiếp theo.'
                )
              }
            >
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerText}>
            Mỗi tấm vé, một câu chuyện.
          </Text>

          <Text style={styles.footerCopyright}>
            © CineNow
          </Text>
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