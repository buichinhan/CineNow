import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';

import { API_BASE_URL } from '../apiConfig';
import MovieCard from '../components/MovieCard';
import MovieDetailModal from '../components/MovieDetailModal';
import QuickBookingModal from '../components/QuickBookingModal';

const GENRES = [
  'Tất cả',
  'Hành động',
  'Hài',
  'Kinh dị',
  'Hoạt hình',
  'Tình cảm',
  'Phiêu lưu',
  'Khoa học viễn tưởng',
];

const FORMATS = ['Tất cả', '2D', '3D', 'IMAX'];

const AGE_RATINGS = ['Tất cả', 'P', 'K', 'T13', 'T16', 'T18'];

export default function MovieCatalogScreen({ onSelectShowtime }) {
  // 1. Quản lý Tab: Phim đang chiếu (NOW_SHOWING) | Phim sắp chiếu (COMING_SOON)
  const [activeTab, setActiveTab] = useState('NOW_SHOWING');

  // 2. Từ khóa tìm kiếm & giá trị debounced
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 3. Bộ lọc kết hợp AND
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [selectedFormat, setSelectedFormat] = useState('Tất cả');
  const [selectedAgeRating, setSelectedAgeRating] = useState('Tất cả');

  // 4. Trạng thái dữ liệu
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // 5. Trạng thái Modal UC_MOVIE_02 và UC_MOVIE_03
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState(null);
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState(null);

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Tải danh sách phim khi tab, từ khóa hoặc bộ lọc AND thay đổi
  useEffect(() => {
    fetchMovies();
  }, [activeTab, debouncedSearch, selectedGenre, selectedFormat, selectedAgeRating]);

  const fetchMovies = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      // Xây dựng query params
      const params = new URLSearchParams();
      params.append('status', activeTab);

      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (selectedGenre !== 'Tất cả') {
        params.append('genre', selectedGenre);
      }
      if (selectedFormat !== 'Tất cả') {
        params.append('format', selectedFormat);
      }
      if (selectedAgeRating !== 'Tất cả') {
        params.append('ageRating', selectedAgeRating);
      }

      const url = `${API_BASE_URL}/movies?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải danh sách phim từ máy chủ.');
      }

      setMovies(data.data || []);
    } catch (err) {
      console.error('Lỗi fetchMovies:', err);
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ CineNow.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedGenre('Tất cả');
    setSelectedFormat('Tất cả');
    setSelectedAgeRating('Tất cả');
  };

  const hasActiveFilters =
    searchInput.trim().length > 0 ||
    selectedGenre !== 'Tất cả' ||
    selectedFormat !== 'Tất cả' ||
    selectedAgeRating !== 'Tất cả';

  return (
    <View style={styles.container}>
      {/* 1. THANH TÌM KIẾM (DEBOUNCE 300MS) */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên phim Việt/Anh, diễn viên, đạo diễn..."
          placeholderTextColor="#777777"
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchInput.length > 0 && (
          <TouchableOpacity onPress={() => setSearchInput('')} style={styles.clearSearchBtn}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. TAB PHIM ĐANG CHIẾU & PHIM SẮP CHIẾU */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'NOW_SHOWING' && styles.tabButtonActive]}
          onPress={() => setActiveTab('NOW_SHOWING')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'NOW_SHOWING' && styles.tabTextActive]}>
            🎬 Phim Đang Chiếu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'COMING_SOON' && styles.tabButtonActive]}
          onPress={() => setActiveTab('COMING_SOON')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'COMING_SOON' && styles.tabTextActive]}>
            ⏳ Phim Sắp Chiếu
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. BỘ LỌC KẾT HỢP AND (THỂ LOẠI, ĐỊNH DẠNG, ĐỘ TUỔI) */}
      <View style={styles.filterSection}>
        {/* Bộ lọc Thể loại */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterGroupLabel}>Thể loại:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {GENRES.map((g) => {
              const isSelected = selectedGenre === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => setSelectedGenre(g)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Hàng kết hợp: Định dạng (2D, 3D, IMAX) & Độ tuổi (P, K, T13, T16, T18) */}
        <View style={styles.multiFilterRow}>
          {/* Định dạng */}
          <View style={styles.subFilter}>
            <Text style={styles.filterGroupLabel}>Định dạng:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt;
                return (
                  <TouchableOpacity
                    key={fmt}
                    style={[styles.smallChip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedFormat(fmt)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{fmt}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Độ tuổi */}
          <View style={styles.subFilter}>
            <Text style={styles.filterGroupLabel}>Độ tuổi:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {AGE_RATINGS.map((age) => {
                const isSelected = selectedAgeRating === age;
                return (
                  <TouchableOpacity
                    key={age}
                    style={[styles.smallChip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedAgeRating(age)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{age}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* 4. KẾT QUẢ TÌM KIẾM / DANH SÁCH THẺ PHIM */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCountText}>
          Tìm thấy <Text style={styles.resultCountNumber}>{movies.length}</Text> phim
          {hasActiveFilters ? ' theo bộ lọc' : ''}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={handleResetFilters} activeOpacity={0.7}>
            <Text style={styles.resetFilterText}>↺ Đặt lại bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* LOADING STATE */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Đang tải danh mục phim CineNow...</Text>
        </View>
      )}

      {/* ERROR STATE */}
      {!loading && errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorDesc}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchMovies()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>THỬ LẠI</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* EMPTY STATE */}
      {!loading && !errorMessage && movies.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy phim phù hợp</Text>
          <Text style={styles.emptyDesc}>
            Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc bên trên.
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>XÓA BỘ LỌC TÌM KIẾM</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* DANH SÁCH PHIM */}
      {!loading && !errorMessage && movies.length > 0 && (
        <FlatList
          data={movies}
          keyExtractor={(item) => item._id || item.originalTitle}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={(m) => setSelectedMovieForDetail(m)}
              onQuickBooking={(m) => setSelectedMovieForBooking(m)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMovies(true)}
              tintColor="#E50914"
              colors={['#E50914']}
            />
          }
        />
      )}

      {/* MODAL CHI TIẾT PHIM (UC_MOVIE_02) */}
      <MovieDetailModal
        visible={!!selectedMovieForDetail}
        movie={selectedMovieForDetail}
        onClose={() => setSelectedMovieForDetail(null)}
        onBookNow={(m) => setSelectedMovieForBooking(m)}
      />

      {/* MODAL ĐẶT VÉ NHANH (UC_MOVIE_03) */}
      <QuickBookingModal
        visible={!!selectedMovieForBooking}
        movie={selectedMovieForBooking}
        onClose={() => setSelectedMovieForBooking(null)}
        onSelectShowtime={onSelectShowtime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 6,
  },
  clearSearchText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#242424',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#E50914',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterSection: {
    backgroundColor: '#141414',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222222',
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterGroupLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#202020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  smallChip: {
    backgroundColor: '#202020',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2E2E2E',
  },
  chipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  chipText: {
    color: '#9E9E9E',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  multiFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subFilter: {
    flex: 1,
    marginRight: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  resultCountText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  resultCountNumber: {
    color: '#E50914',
    fontWeight: 'bold',
  },
  resetFilterText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 50,
  },
  errorIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorDesc: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDesc: {
    color: '#777777',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  resetBtn: {
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#E50914',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 30,
  },
});
