import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { fetchHomeData } from './api';

export default function HomeScreen({
  user,
  onSelectMovie,
  onQuickBooking,
  onLogout,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Dynamic server data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [homeData, setHomeData] = useState({
    featuredMovie: null,
    nowShowing: [],
    upcoming: [],
    nearbyCinemas: [],
  });

  const displayName = user?.fullName || 'Nguyễn An';

  const loadData = async () => {
    try {
      setError(null);
      const data = await fetchHomeData();
      if (data) {
        setHomeData(data);
      }
    } catch (err) {
      console.warn('Không thể tải từ API server, dùng dữ liệu khởi tạo dự phòng:', err.message);
      setError('Đang kết nối lại server...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'account') {
      setShowAccountModal(true);
    }
  };

  const featuredMovie = homeData.featuredMovie || homeData.nowShowing?.[0];

  // Lọc phim theo tìm kiếm
  const filteredNowShowing = (homeData.nowShowing || []).filter((m) =>
    searchQuery
      ? m.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E50914"
            colors={['#E50914']}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Chào buổi tối,</Text>
            <Text style={styles.userName}>{displayName} 👋</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            activeOpacity={0.8}
            onPress={() => setShowAccountModal(true)}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm phim, rạp chiếu..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E50914" />
            <Text style={styles.loadingText}>Đang tải dữ liệu từ máy chủ...</Text>
          </View>
        ) : (
          <>
            {/* Featured Hero Banner */}
            {featuredMovie && (
              <TouchableOpacity
                style={styles.featuredCard}
                activeOpacity={0.92}
                onPress={() => onSelectMovie(featuredMovie)}
              >
                <Image
                  source={{ uri: featuredMovie.backdrop || featuredMovie.poster }}
                  style={styles.featuredImage}
                  resizeMode="cover"
                />

                <View style={styles.featuredOverlay} />

                {/* Badges on Top */}
                <View style={styles.featuredBadgesRow}>
                  <View style={styles.featuredBadgeRed}>
                    <Text style={styles.featuredBadgeRedText}>
                      {featuredMovie.badge || 'Nổi bật'}
                    </Text>
                  </View>
                  <View style={styles.featuredBadgeDark}>
                    <Text style={styles.featuredBadgeDarkText}>
                      {featuredMovie.ageRating || '16+'}
                    </Text>
                  </View>
                </View>

                {/* Featured Info Bottom */}
                <View style={styles.featuredContent}>
                  <Text style={styles.featuredTitle}>
                    {featuredMovie.title.toUpperCase()}
                  </Text>
                  <Text style={styles.featuredMeta}>
                    {featuredMovie.genre?.split('•')[0]?.trim()} •{' '}
                    {featuredMovie.duration} •{' '}
                    <Text style={styles.starText}>⭐ {featuredMovie.rating}</Text>
                  </Text>

                  <TouchableOpacity
                    style={styles.bookNowButton}
                    activeOpacity={0.85}
                    onPress={() =>
                      onQuickBooking
                        ? onQuickBooking(featuredMovie)
                        : onSelectMovie(featuredMovie)
                    }
                  >
                    <Text style={styles.ticketIcon}>🎟️</Text>
                    <Text style={styles.bookNowButtonText}>Đặt vé</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}

            {/* Section: Phim đang chiếu */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phim đang chiếu</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.movieCardsRow}
            >
              {filteredNowShowing.map((movie) => (
                <TouchableOpacity
                  key={movie._id || movie.slug || movie.id}
                  style={styles.movieCard}
                  activeOpacity={0.85}
                  onPress={() => onSelectMovie(movie)}
                >
                  <View style={styles.posterContainer}>
                    <Image
                      source={{ uri: movie.poster }}
                      style={styles.moviePoster}
                      resizeMode="cover"
                    />
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {movie.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.movieCardTitle} numberOfLines={1}>
                    {movie.title}
                  </Text>
                  <Text style={styles.movieCardSubtitle} numberOfLines={1}>
                    {movie.genre?.split('•')[0]?.trim()} • {movie.duration}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Section: Phim sắp chiếu */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Phim sắp chiếu</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>Xem lịch</Text>
              </TouchableOpacity>
            </View>

            {(homeData.upcoming || []).map((movie) => (
              <View
                key={movie._id || movie.slug || movie.id}
                style={styles.upcomingCard}
              >
                <Image
                  source={{ uri: movie.poster }}
                  style={styles.upcomingPoster}
                  resizeMode="cover"
                />
                <View style={styles.upcomingInfo}>
                  <View style={styles.upcomingDateBadge}>
                    <Text style={styles.upcomingDateText}>
                      {movie.releaseDate}
                    </Text>
                  </View>
                  <Text style={styles.upcomingTitle}>{movie.title}</Text>
                  <Text style={styles.upcomingSubtitle}>
                    {movie.genre} • {movie.duration}
                  </Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.remindText}>Nhắc tôi khi mở bán</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Section: Rạp gần bạn */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Rạp gần bạn</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAllText}>Bản đồ</Text>
              </TouchableOpacity>
            </View>

            {(homeData.nearbyCinemas || []).map((cinema, idx) => (
              <TouchableOpacity
                key={cinema._id || cinema.id || `cin_${idx}`}
                style={styles.cinemaCard}
                activeOpacity={0.85}
              >
                <View style={styles.cinemaIconBox}>
                  <Text style={styles.cinemaBuildingIcon}>🏛️</Text>
                </View>
                <View style={styles.cinemaInfo}>
                  <Text style={styles.cinemaName}>{cinema.name}</Text>
                  <Text style={styles.cinemaAddress}>
                    {cinema.district} • Cách {cinema.distance}
                  </Text>
                </View>
                <Text style={styles.navigateArrow}>➤</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('home')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}
          >
            🏠
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
          onPress={() => handleTabPress('movies')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'movies' && styles.navIconActive,
            ]}
          >
            🎬
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'movies' && styles.navLabelActive,
            ]}
          >
            Phim
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('tickets')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'tickets' && styles.navIconActive,
            ]}
          >
            🎟️
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'tickets' && styles.navLabelActive,
            ]}
          >
            Vé của tôi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('account')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.navIcon,
              activeTab === 'account' && styles.navIconActive,
            ]}
          >
            👤
          </Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'account' && styles.navLabelActive,
            ]}
          >
            Tài khoản
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal Profile / Logout */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalAvatar}>
              <Text style={styles.modalAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.modalName}>{displayName}</Text>
            <Text style={styles.modalEmail}>
              {user?.email || 'user@cinenow.vn'}
            </Text>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalLogoutButton}
              activeOpacity={0.8}
              onPress={() => {
                setShowAccountModal(false);
                if (onLogout) onLogout();
              }}
            >
              <Text style={styles.modalLogoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              activeOpacity={0.8}
              onPress={() => setShowAccountModal(false)}
            >
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '400',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  filterButton: {
    padding: 6,
  },
  filterIcon: {
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#A1A1AA',
    marginTop: 12,
    fontSize: 14,
  },
  featuredCard: {
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 26,
    backgroundColor: '#1C1917',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredBadgesRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredBadgeRed: {
    backgroundColor: '#E50914',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  featuredBadgeRedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredBadgeDark: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featuredBadgeDarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    right: 18,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  featuredMeta: {
    color: '#D4D4D8',
    fontSize: 13,
    marginBottom: 16,
  },
  starText: {
    color: '#FACC15',
    fontWeight: 'bold',
  },
  bookNowButton: {
    backgroundColor: '#E50914',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  ticketIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bookNowButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
  },
  movieCardsRow: {
    gap: 16,
    paddingBottom: 24,
  },
  movieCard: {
    width: 170,
  },
  posterContainer: {
    width: 170,
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#27272A',
    marginBottom: 10,
  },
  moviePoster: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  movieCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieCardSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  upcomingPoster: {
    width: 80,
    height: 90,
    borderRadius: 12,
    marginRight: 14,
  },
  upcomingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  upcomingDateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#27272A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  upcomingDateText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  upcomingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  upcomingSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    marginBottom: 6,
  },
  remindText: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: '600',
  },
  cinemaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cinemaIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cinemaBuildingIcon: {
    fontSize: 20,
  },
  cinemaInfo: {
    flex: 1,
  },
  cinemaName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cinemaAddress: {
    color: '#A1A1AA',
    fontSize: 12,
  },
  navigateArrow: {
    color: '#E50914',
    fontSize: 18,
    marginLeft: 8,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#121214',
    borderTopWidth: 1,
    borderTopColor: '#222226',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  navIcon: {
    fontSize: 19,
    marginBottom: 3,
    opacity: 0.6,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#18181B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  modalName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalEmail: {
    color: '#A1A1AA',
    fontSize: 14,
    marginBottom: 20,
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#27272A',
    marginBottom: 20,
  },
  modalLogoutButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#E50914',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalLogoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272A',
  },
  modalCloseText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '600',
  },
});
