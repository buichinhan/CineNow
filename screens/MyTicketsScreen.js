import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';

import { initialTickets } from '../data/mockTickets';
import TicketDetailScreen from './TicketDetailScreen';
import CancelModal from '../components/CancelModal';

const RED = '#E50914';
const BG = '#0B0B0B';
const CARD = '#171717';
const MUTED = '#999999';

const TABS = [
  { key: 'confirmed', label: 'Vé đã đặt' },
  { key: 'used', label: 'Đã sử dụng' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function MyTicketsScreen({ onBack }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTab, setActiveTab] = useState('confirmed');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const filteredTickets = tickets.filter(
    (ticket) => ticket.status === activeTab
  );

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString('vi-VN') + 'đ';

  const openCancelModal = (ticket) => {
    setTicketToCancel(ticket);
    setCancelModalVisible(true);
  };

  const confirmCancel = (ticketId) => {
    const ticket = tickets.find((item) => item.id === ticketId);

    if (!ticket || ticket.status !== 'confirmed') {
      setCancelModalVisible(false);
      setTicketToCancel(null);
      return;
    }

    setTickets((previousTickets) =>
      previousTickets.map((item) =>
        item.id === ticketId
          ? {
              ...item,
              status: 'cancelled',
              refundStatus: 'Đang xử lý hoàn tiền (90%)',
            }
          : item
      )
    );

    setCancelModalVisible(false);
    setTicketToCancel(null);
    setSelectedTicket(null);
    setActiveTab('cancelled');

    Alert.alert(
      'Đã cập nhật vé',
      'Vé đã được chuyển sang mục Đã hủy trong dữ liệu mẫu. Chưa có giao dịch hoàn tiền thực tế.'
    );
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      activeOpacity={0.85}
      onPress={() => setSelectedTicket(item)}
    >
      <Image
        source={{ uri: item.poster }}
        style={styles.poster}
        resizeMode="cover"
      />

      <View style={styles.ticketInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.movieTitle}
        </Text>

        <Text style={styles.bookingCode}>
          Mã vé: {item.bookingCode}
        </Text>

        <Text style={styles.infoText}>
          {item.date} · {item.time}
        </Text>

        <Text style={styles.infoText}>
          {item.room} · Ghế {item.seats.join(', ')}
        </Text>

        {Array.isArray(item.concessions) && item.concessions.length > 0 && (
          <Text style={styles.concessionBadgeText}>
            🍿 +{item.concessions.reduce((acc, c) => acc + (c.quantity || 1), 0)} bắp nước & snack
          </Text>
        )}

        <Text style={styles.price}>
          {formatPrice(item.totalPrice)}
        </Text>

        <View style={styles.cardBottom}>
          <Text
            style={[
              styles.statusText,
              item.status === 'confirmed' && styles.confirmedText,
              item.status === 'used' && styles.usedText,
              item.status === 'cancelled' && styles.cancelledText,
            ]}
          >
            {item.status === 'confirmed'
              ? '● Đã xác nhận'
              : item.status === 'used'
              ? '● Đã sử dụng'
              : '● Đã hủy'}
          </Text>

          <Text style={styles.detailLink}>Chi tiết ›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (selectedTicket) {
    const currentTicket =
      tickets.find((item) => item.id === selectedTicket.id) ||
      selectedTicket;

    return (
      <>
        <TicketDetailScreen
          ticket={currentTicket}
          onBack={() => setSelectedTicket(null)}
          onOpenCancelModal={openCancelModal}
          onRateMovie={(ticket) =>
            Alert.alert(
              'Đánh giá phim',
              'Chức năng đánh giá "' +
                ticket.movieTitle +
                '" sẽ được bổ sung sau.'
            )
          }
        />

        <CancelModal
          visible={cancelModalVisible}
          ticket={ticketToCancel}
          onClose={() => {
            setCancelModalVisible(false);
            setTicketToCancel(null);
          }}
          onConfirm={confirmCancel}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <Text style={styles.headerTitle}>Vé của tôi</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const count = tickets.filter(
            (ticket) => ticket.status === tab.key
          ).length;

          const isActive = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>

              <View
                style={[
                  styles.countBadge,
                  isActive && styles.activeCountBadge,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    isActive && styles.activeCountText,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={renderTicket}
        contentContainerStyle={[
          styles.listContent,
          filteredTickets.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'confirmed'
                ? '🎟️'
                : activeTab === 'used'
                ? '🎬'
                : '📋'}
            </Text>

            <Text style={styles.emptyTitle}>
              {activeTab === 'confirmed'
                ? 'Bạn chưa có vé nào'
                : activeTab === 'used'
                ? 'Chưa có vé đã sử dụng'
                : 'Chưa có vé đã hủy'}
            </Text>

            <Text style={styles.emptyDescription}>
              Các vé thuộc trạng thái này sẽ xuất hiện tại đây.
            </Text>

            {onBack && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={onBack}
              >
                <Text style={styles.browseButtonText}>
                  Quay lại trang chủ
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <CancelModal
        visible={cancelModalVisible}
        ticket={ticketToCancel}
        onClose={() => {
          setCancelModalVisible(false);
          setTicketToCancel(null);
        }}
        onConfirm={confirmCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },

  backButton: {
    width: 36,
    height: 40,
    justifyContent: 'center',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 36,
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 6,
  },

  tab: {
    flex: 1,
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: CARD,
    paddingHorizontal: 4,
    gap: 5,
  },

  activeTab: {
    backgroundColor: RED,
  },

  tabText: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '600',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  countBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#303030',
  },

  activeCountBadge: {
    backgroundColor: '#FFFFFF',
  },

  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  activeCountText: {
    color: RED,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 28,
  },

  ticketCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 14,
    marginBottom: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#292929',
    overflow: 'hidden',
  },

  poster: {
    width: 100,
    height: 150,
    borderRadius: 9,
    backgroundColor: '#252525',
  },

  ticketInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },

  movieTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 7,
  },

  bookingCode: {
    color: '#BBBBBB',
    fontSize: 11,
    marginBottom: 7,
  },

  infoText: {
    color: '#A6A6A6',
    fontSize: 11,
    lineHeight: 18,
  },

  concessionBadgeText: {
    color: '#EAB308',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  price: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 7,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },

  confirmedText: {
    color: '#48D597',
  },

  usedText: {
    color: '#75B9FF',
  },

  cancelledText: {
    color: '#FF7777',
  },

  detailLink: {
    color: RED,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 35,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 18,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyDescription: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },

  browseButton: {
    backgroundColor: RED,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9,
    marginTop: 20,
  },

  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});