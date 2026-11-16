import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import VoucherCard from '../components/VoucherCard';
import { API_BASE_URL } from '../apiConfig';

export default function VoucherScreen({ user, token, onNavigateToCheckout }) {
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'wallet'
  const [walletFilter, setWalletFilter] = useState('AVAILABLE'); // 'AVAILABLE' | 'USED' | 'EXPIRED'
  const [promoCodeInput, setPromoCodeInput] = useState('');

  const [publicVouchers, setPublicVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  // Lấy danh sách voucher công khai
  const fetchPublicVouchers = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/vouchers`, { headers });
      const data = await res.json();
      if (data.success) {
        setPublicVouchers(data.data || []);
      }
    } catch (error) {
      console.warn('Lỗi tải ưu đãi hot:', error.message);
    }
  }, [token]);

  // Lấy danh sách voucher trong ví của user
  const fetchMyVouchers = useCallback(async () => {
    if (!token) {
      setMyVouchers([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/my-vouchers`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setMyVouchers(data.data || []);
      }
    } catch (error) {
      console.warn('Lỗi tải ví voucher:', error.message);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPublicVouchers(), fetchMyVouchers()]);
    setLoading(false);
  }, [fetchPublicVouchers, fetchMyVouchers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPublicVouchers(), fetchMyVouchers()]);
    setRefreshing(false);
  };

  // Nhận/Lưu voucher vào ví
  const handleClaimVoucher = async (voucher) => {
    if (!token) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để lưu voucher vào ví cá nhân.'
      );
      return;
    }

    try {
      setClaimingId(voucher._id);
      const res = await fetch(`${API_BASE_URL}/vouchers/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ voucherId: voucher._id }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Thành công 🎉', data.message || 'Đã lưu voucher vào ví!');
        await Promise.all([fetchPublicVouchers(), fetchMyVouchers()]);
      } else {
        Alert.alert('Không thể lưu', data.message || 'Đã có lỗi xảy ra.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setClaimingId(null);
    }
  };

  // Nhập mã thủ công để lưu vào ví
  const handleClaimByCode = async () => {
    if (!promoCodeInput.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi.');
      return;
    }

    if (!token) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để nhập mã voucher.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: promoCodeInput.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Thành công 🎉', data.message || 'Đã lưu mã vào ví!');
        setPromoCodeInput('');
        await Promise.all([fetchPublicVouchers(), fetchMyVouchers()]);
        setActiveTab('wallet');
      } else {
        Alert.alert('Không hợp lệ', data.message || 'Mã không tồn tại hoặc đã hết hạn.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    }
  };

  // Lọc voucher trong ví theo trạng thái
  const filteredWalletList = myVouchers.filter((item) => {
    if (!walletFilter) return true;
    return item.status === walletFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ưu Đãi & Voucher</Text>
        <Text style={styles.headerSubtitle}>
          Thu thập mã giảm giá và áp dụng khi đặt vé xem phim
        </Text>
      </View>

      {/* Ô nhập mã Voucher trực tiếp để lưu vào ví */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nhập mã voucher (VD: CINENEW50)..."
          placeholderTextColor="#777777"
          value={promoCodeInput}
          onChangeText={setPromoCodeInput}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={handleClaimByCode}
          activeOpacity={0.8}
        >
          <Text style={styles.applyBtnText}>Nhận mã</Text>
        </TouchableOpacity>
      </View>

      {/* Tab chuyển đổi: Kho ưu đãi / Ví của tôi */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.tabActive]}
          onPress={() => setActiveTab('public')}
        >
          <Text
            style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}
          >
            Ưu đãi CineNow ({publicVouchers.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'wallet' && styles.tabActive]}
          onPress={() => setActiveTab('wallet')}
        >
          <Text
            style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}
          >
            Ví của tôi ({myVouchers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Thanh lọc trạng thái trong ví */}
      {activeTab === 'wallet' && (
        <View style={styles.filterRow}>
          {[
            { key: 'AVAILABLE', label: 'Khả dụng' },
            { key: 'USED', label: 'Đã sử dụng' },
            { key: 'EXPIRED', label: 'Hết hạn' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                walletFilter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setWalletFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  walletFilter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Danh sách Voucher */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải danh sách voucher...</Text>
        </View>
      ) : activeTab === 'public' ? (
        <FlatList
          data={publicVouchers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E50914"
            />
          }
          renderItem={({ item }) => (
            <VoucherCard
              voucher={item}
              mode="public"
              isClaimed={item.isClaimed}
              canClaim={item.canClaim}
              isClaiming={claimingId === item._id}
              onClaim={handleClaimVoucher}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyText}>Hiện chưa có chương trình ưu đãi nào mới.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredWalletList}
          keyExtractor={(item) => item.userVoucherId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E50914"
            />
          }
          renderItem={({ item }) => (
            <VoucherCard
              voucher={item.voucher}
              mode="wallet"
              onApply={(v) => {
                if (onNavigateToCheckout) {
                  onNavigateToCheckout(v);
                } else {
                  Alert.alert(
                    'Sử dụng voucher',
                    `Mã [${v.code}] đã sẵn sàng. Hãy chọn phim và suất chiếu để áp dụng khi thanh toán!`
                  );
                }
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyText}>
                {walletFilter === 'AVAILABLE'
                  ? 'Ví của bạn chưa có voucher khả dụng nào. Hãy vào tab "Ưu đãi CineNow" để lưu voucher nhé!'
                  : 'Không có voucher nào trong mục này.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#8A8A8A',
    fontSize: 13,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#303030',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#E50914',
  },
  tabText: {
    color: '#777777',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
  },
  filterChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  filterChipText: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    color: '#8A8A8A',
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyText: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
