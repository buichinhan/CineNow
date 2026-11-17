
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
  Keyboard,
} from 'react-native';

import VoucherCard from '../components/VoucherCard';
import { API_BASE_URL } from '../apiConfig';

const COLORS = {
  bg: '#0B0B0D',
  surface: '#181A1F',
  surfaceAlt: '#22252C',
  border: '#30333B',
  red: '#E50914',
  white: '#FFFFFF',
  muted: '#9296A1',
};

const WALLET_FILTERS = [
  { key: 'AVAILABLE', label: 'Khả dụng' },
  { key: 'USED', label: 'Đã sử dụng' },
  { key: 'EXPIRED', label: 'Hết hạn' },
];

export default function VoucherScreen({
  user,
  token,
  onNavigateToCheckout,
}) {
  const [activeTab, setActiveTab] = useState('public');
  const [walletFilter, setWalletFilter] = useState('AVAILABLE');
  const [promoCodeInput, setPromoCodeInput] = useState('');

  const [publicVouchers, setPublicVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [claimingCode, setClaimingCode] = useState(false);

  const fetchPublicVouchers = useCallback(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/vouchers`, {
        headers,
      });

      const data = await res.json();

      if (data.success) {
        setPublicVouchers(data.data || []);
      }
    } catch (error) {
      console.warn('Lỗi tải ưu đãi:', error.message);
    }
  }, [token]);

  const fetchMyVouchers = useCallback(async () => {
    if (!token) {
      setMyVouchers([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/vouchers/my-vouchers`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    try {
      await Promise.all([
        fetchPublicVouchers(),
        fetchMyVouchers(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchPublicVouchers, fetchMyVouchers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchPublicVouchers(),
        fetchMyVouchers(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleClaimVoucher = async (voucher) => {
    if (!token) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để lưu voucher vào ví.'
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
        Alert.alert(
          'Thành công 🎉',
          data.message || 'Đã lưu voucher vào ví!'
        );

        await Promise.all([
          fetchPublicVouchers(),
          fetchMyVouchers(),
        ]);
      } else {
        Alert.alert(
          'Không thể lưu',
          data.message || 'Đã có lỗi xảy ra.'
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleClaimByCode = async () => {
    const code = promoCodeInput.trim();

    if (!code) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã khuyến mãi.');
      return;
    }

    if (!token) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để nhận mã voucher.'
      );
      return;
    }

    if (claimingCode) return;

    Keyboard.dismiss();
    setClaimingCode(true);

    try {
      const res = await fetch(`${API_BASE_URL}/vouchers/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(
          'Thành công 🎉',
          data.message || 'Đã lưu mã vào ví!'
        );

        setPromoCodeInput('');

        await Promise.all([
          fetchPublicVouchers(),
          fetchMyVouchers(),
        ]);

        setWalletFilter('AVAILABLE');
        setActiveTab('wallet');
      } else {
        Alert.alert(
          'Không hợp lệ',
          data.message || 'Mã không tồn tại hoặc đã hết hạn.'
        );
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ.');
    } finally {
      setClaimingCode(false);
    }
  };

  const filteredWalletList = myVouchers.filter(
    (item) => item.status === walletFilter
  );

  const availableCount = myVouchers.filter(
    (item) => item.status === 'AVAILABLE'
  ).length;

  const currentList =
    activeTab === 'public'
      ? publicVouchers
      : filteredWalletList;

  const renderVoucher = ({ item }) => {
    if (activeTab === 'public') {
      return (
        <VoucherCard
          voucher={item}
          mode="public"
          isClaimed={item.isClaimed}
          canClaim={item.canClaim}
          isClaiming={claimingId === item._id}
          onClaim={handleClaimVoucher}
        />
      );
    }

    return (
      <VoucherCard
        voucher={{
          ...item.voucher,
          status: item.status,
        }}
        mode="wallet"
        onApply={(voucher) => {
          if (onNavigateToCheckout) {
            onNavigateToCheckout(voucher);
          } else {
            Alert.alert(
              'Sử dụng voucher',
              `Mã ${voucher.code} đã sẵn sàng. Hãy chọn phim và suất chiếu để áp dụng khi thanh toán!`
            );
          }
        }}
      />
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Text style={styles.emptyIcon}>
          {activeTab === 'public' ? '🎟️' : '🎫'}
        </Text>
      </View>

      <Text style={styles.emptyTitle}>
        {activeTab === 'public'
          ? 'Chưa có ưu đãi mới'
          : walletFilter === 'AVAILABLE'
          ? 'Chưa có voucher khả dụng'
          : walletFilter === 'USED'
          ? 'Chưa có voucher đã dùng'
          : 'Chưa có voucher hết hạn'}
      </Text>

      <Text style={styles.emptyDescription}>
        {activeTab === 'public'
          ? 'Các chương trình khuyến mãi mới sẽ xuất hiện tại đây.'
          : walletFilter === 'AVAILABLE'
          ? 'Khám phá kho ưu đãi và lưu những mã giảm giá yêu thích.'
          : 'Danh sách voucher của bạn hiện đang trống.'}
      </Text>

      {activeTab === 'wallet' &&
        walletFilter === 'AVAILABLE' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setActiveTab('public')}
          >
            <Text style={styles.emptyButtonText}>
              Khám phá ưu đãi
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.bg}
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerEyebrow}>
              CINENOW REWARDS
            </Text>

            <Text style={styles.headerTitle}>
              Kho ưu đãi
            </Text>

            <Text style={styles.headerSubtitle}>
              Săn mã hay, xem phim tiết kiệm hơn.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🎟️</Text>
          </View>
        </View>

        <View style={styles.promoBox}>
          <View style={styles.promoLabelRow}>
            <View style={styles.promoDot} />
            <Text style={styles.promoLabel}>
              BẠN CÓ MÃ ƯU ĐÃI?
            </Text>
          </View>

          <View style={styles.promoInputRow}>
            <TextInput
              style={styles.promoInput}
              placeholder="Nhập mã của bạn"
              placeholderTextColor="#777C87"
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleClaimByCode}
              editable={!claimingCode}
            />

            <TouchableOpacity
              style={[
                styles.promoButton,
                claimingCode && styles.promoButtonDisabled,
              ]}
              onPress={handleClaimByCode}
              disabled={claimingCode}
              activeOpacity={0.8}
            >
              {claimingCode ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.promoButtonText}>
                  Nhận mã
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'public' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('public')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'public' && styles.tabTextActive,
            ]}
          >
            Khám phá
          </Text>

          <View
            style={[
              styles.countBadge,
              activeTab === 'public' && styles.countBadgeActive,
            ]}
          >
            <Text style={styles.countText}>
              {publicVouchers.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'wallet' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('wallet')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'wallet' && styles.tabTextActive,
            ]}
          >
            Ví của tôi
          </Text>

          <View
            style={[
              styles.countBadge,
              activeTab === 'wallet' && styles.countBadgeActive,
            ]}
          >
            <Text style={styles.countText}>
              {myVouchers.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'wallet' && (
        <View style={styles.filterRow}>
          {WALLET_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                walletFilter === filter.key &&
                  styles.filterChipActive,
              ]}
              onPress={() => setWalletFilter(filter.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  walletFilter === filter.key &&
                    styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionTitle}>
            {activeTab === 'public'
              ? 'Ưu đãi dành cho bạn'
              : 'Voucher của tôi'}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {activeTab === 'public'
              ? 'Chọn ưu đãi và lưu vào ví'
              : `${availableCount} voucher đang khả dụng`}
          </Text>
        </View>

        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>
            {currentList.length} mã
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.red}
          />
          <Text style={styles.loadingText}>
            Đang tải ưu đãi...
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item, index) =>
            String(
              activeTab === 'public'
                ? item._id || index
                : item.userVoucherId || index
            )
          }
          renderItem={renderVoucher}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            currentList.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.red}
              colors={[COLORS.red]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF4D57',
    letterSpacing: 2,
    marginBottom: 7,
  },
  headerTitle: {
    fontSize: 29,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#351B22',
    borderWidth: 1,
    borderColor: '#64303A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 28,
  },
  promoBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  promoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  promoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.red,
    marginRight: 8,
  },
  promoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C8CBD2',
    letterSpacing: 1.2,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  promoInput: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#101115',
    borderWidth: 1,
    borderColor: '#383B44',
    paddingHorizontal: 13,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  promoButton: {
    height: 44,
    minWidth: 88,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoButtonDisabled: {
    opacity: 0.6,
  },
  promoButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    padding: 4,
    marginHorizontal: 18,
    marginBottom: 17,
  },
  tab: {
    flex: 1,
    minHeight: 43,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  tabActive: {
    backgroundColor: '#383039',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  countBadge: {
    minWidth: 21,
    height: 21,
    borderRadius: 7,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30333B',
  },
  countBadgeActive: {
    backgroundColor: COLORS.red,
  },
  countText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 7,
    marginBottom: 17,
  },
  filterChip: {
    flex: 1,
    minHeight: 35,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterChipActive: {
    borderColor: '#7B2C35',
    backgroundColor: '#3B1C23',
  },
  filterText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FF6D76',
    fontWeight: '800',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 19,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },
  sectionCount: {
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4D6DC',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 3,
    paddingBottom: 35,
  },
  emptyList: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 65,
    paddingHorizontal: 22,
  },
  emptyIconCircle: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#281C23',
    borderWidth: 1,
    borderColor: '#48303A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 35,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 9,
  },
  emptyButton: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    paddingHorizontal: 19,
    paddingVertical: 12,
    marginTop: 22,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
