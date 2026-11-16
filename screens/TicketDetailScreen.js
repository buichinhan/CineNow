import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';

export default function TicketDetailScreen({
  ticket,
  onBack,
  onOpenCancelModal,
  onRateMovie,
}) {
  if (!ticket) return null;

  const isConfirmed = ticket.status === 'confirmed';
  const isUsed = ticket.status === 'used';
  const isCancelled = ticket.status === 'cancelled';

  const statusText = isConfirmed
    ? 'SẮP TỚI'
    : isUsed
      ? 'ĐÃ SỬ DỤNG'
      : 'ĐÃ HỦY';

  const statusColor = isConfirmed
    ? '#4CD964'
    : isUsed
      ? '#54A0FF'
      : '#FF5B65';

  const formattedPrice = Number(ticket.totalPrice || 0).toLocaleString('vi-VN');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Chi tiết vé</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>

        <View style={styles.movieCard}>
          {ticket.poster ? (
            <Image
              source={{ uri: ticket.poster }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.placeholderText}>CINENOW</Text>
            </View>
          )}

          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>{ticket.movieTitle}</Text>
            <Text style={styles.bookingCode}>
              Mã vé: {ticket.bookingCode}
            </Text>
            <Text style={styles.cinemaName}>{ticket.cinemaName}</Text>
          </View>
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>MÃ VÉ ĐIỆN TỬ</Text>

          <View style={styles.qrPlaceholder}>
            <View style={styles.qrCornerTopLeft} />
            <View style={styles.qrCornerTopRight} />
            <View style={styles.qrCornerBottomLeft} />
            <Text style={styles.qrIcon}>▦</Text>
            <Text style={styles.qrCode}>{ticket.bookingCode}</Text>
          </View>

          <Text style={styles.qrDescription}>
            {isConfirmed
              ? 'Xuất trình thông tin vé khi đến rạp'
              : isUsed
                ? 'Vé này đã được sử dụng'
                : 'Vé này đã bị hủy'}
          </Text>

          <Text style={styles.qrNotice}>
            Mã QR ở đây chỉ là hình minh họa cho giao diện.
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>THÔNG TIN SUẤT CHIẾU</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rạp chiếu</Text>
            <Text style={styles.detailValue}>{ticket.cinemaName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phòng chiếu</Text>
            <Text style={styles.detailValue}>{ticket.room}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ngày chiếu</Text>
            <Text style={styles.detailValue}>{ticket.date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Giờ chiếu</Text>
            <Text style={styles.detailValue}>{ticket.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ghế ngồi</Text>
            <Text style={styles.seatValue}>
              {Array.isArray(ticket.seats)
                ? ticket.seats.join(', ')
                : ticket.seats || 'Chưa xác định'}
            </Text>
          </View>

          {Array.isArray(ticket.concessions) && ticket.concessions.length > 0 && (
            <View style={styles.concessionsSection}>
              <View style={styles.concessionDivider} />
              <Text style={styles.concessionsHeader}>🍿 BẮP NƯỚC & SNACK</Text>
              {ticket.concessions.map((item, idx) => (
                <View key={idx} style={styles.concessionRow}>
                  <Text style={styles.concessionItemName} numberOfLines={1}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={styles.concessionItemPrice}>
                    {(Number(item.price) * Number(item.quantity)).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              ))}
              <View style={styles.concessionDivider} />
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>
              {formattedPrice} VNĐ
            </Text>
          </View>

          {isCancelled && (
            <View style={styles.refundContainer}>
              <Text style={styles.refundLabel}>Trạng thái hoàn tiền</Text>
              <Text style={styles.refundValue}>
                {ticket.refundStatus || 'Chưa có thông tin'}
              </Text>
            </View>
          )}
        </View>

        {isConfirmed && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onOpenCancelModal(ticket)}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Yêu cầu hủy vé</Text>
          </TouchableOpacity>
        )}

        {isUsed && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => onRateMovie?.(ticket)}
            activeOpacity={0.8}
          >
            <Text style={styles.rateButtonText}>Đánh giá phim ⭐</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footerText}>
          Cảm ơn bạn đã lựa chọn CineNow!
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#292929',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    color: '#E50914',
    fontSize: 36,
    lineHeight: 40,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#252525',
    marginBottom: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  movieCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#303030',
    marginBottom: 16,
  },
  poster: {
    width: 88,
    height: 120,
    borderRadius: 9,
    backgroundColor: '#292929',
  },
  posterPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#E50914',
    fontSize: 11,
    fontWeight: 'bold',
  },
  movieInfo: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 14,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 25,
    marginBottom: 8,
  },
  bookingCode: {
    color: '#E50914',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cinemaName: {
    color: '#AAAAAA',
    fontSize: 12,
    lineHeight: 18,
  },
  qrCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 16,
  },
  qrTitle: {
    color: '#222222',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  qrPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#F1F1F1',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 25,
    height: 25,
    borderWidth: 5,
    borderColor: '#111111',
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 25,
    height: 25,
    borderWidth: 5,
    borderColor: '#111111',
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 25,
    height: 25,
    borderWidth: 5,
    borderColor: '#111111',
  },
  qrIcon: {
    color: '#111111',
    fontSize: 70,
  },
  qrCode: {
    color: '#222222',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -5,
    letterSpacing: 1,
  },
  qrDescription: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
  qrNotice: {
    color: '#777777',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#303030',
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2B2B',
  },
  detailLabel: {
    color: '#999999',
    fontSize: 13,
    flex: 1,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1.3,
    textAlign: 'right',
  },
  seatValue: {
    color: '#E50914',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1.3,
    textAlign: 'right',
  },
  concessionsSection: {
    marginVertical: 4,
  },
  concessionDivider: {
    height: 1,
    backgroundColor: '#2B2B2B',
    marginVertical: 8,
  },
  concessionsHeader: {
    color: '#EAB308',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  concessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  concessionItemName: {
    color: '#CCCCCC',
    fontSize: 13,
    flex: 1.4,
  },
  concessionItemPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 0.8,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#444444',
    marginTop: 6,
    paddingTop: 16,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  totalValue: {
    color: '#4CD964',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1.3,
  },
  refundContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#292929',
    borderRadius: 8,
  },
  refundLabel: {
    color: '#AAAAAA',
    fontSize: 12,
    marginBottom: 5,
  },
  refundValue: {
    color: '#FFB74D',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#E50914',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  rateButton: {
    backgroundColor: '#292929',
    borderWidth: 1,
    borderColor: '#E50914',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  rateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
