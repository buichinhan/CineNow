import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function CancelModal({
  visible,
  ticket,
  onClose,
  onConfirm,
}) {
  if (!ticket) return null;

  const estimatedRefund = Math.round(ticket.totalPrice * 0.9);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.warningIcon}>!</Text>
          </View>

          <Text style={styles.title}>Xác nhận hủy vé?</Text>

          <Text style={styles.description}>
            Bạn có chắc chắn muốn yêu cầu hủy vé xem phim này không?
          </Text>

          <View style={styles.ticketInfo}>
            <Text style={styles.movieTitle}>
              {ticket.movieTitle}
            </Text>

            <Text style={styles.infoText}>
              Mã vé: {ticket.bookingCode}
            </Text>

            <Text style={styles.infoText}>
              Suất chiếu: {ticket.time} - {ticket.date}
            </Text>

            <Text style={styles.infoText}>
              Ghế: {ticket.seats.join(', ')}
            </Text>
          </View>

          <View style={styles.refundBox}>
            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>Giá vé</Text>
              <Text style={styles.refundValue}>
                {ticket.totalPrice.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>

            <View style={styles.refundRow}>
              <Text style={styles.refundLabel}>
                Phí hủy dự kiến (10%)
              </Text>
              <Text style={styles.feeValue}>
                {Math.round(ticket.totalPrice * 0.1).toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>

            <View style={[styles.refundRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>
                Tiền dự kiến được hoàn
              </Text>
              <Text style={styles.totalValue}>
                {estimatedRefund.toLocaleString('vi-VN')} VNĐ
              </Text>
            </View>
          </View>

          <Text style={styles.policy}>
            Lưu ý: Đây chỉ là số tiền minh họa theo mức hoàn 90%.
            Chính sách hủy và hoàn tiền thực tế cần được xác nhận
            trước khi triển khai chức năng thanh toán.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.keepButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.keepButtonText}>Giữ vé</Text>
            </TouchableOpacity>

          <TouchableOpacity
  style={[
    styles.cancelButton,
    loading && { opacity: 0.5 },
  ]}
  onPress={() => onConfirm(ticket.id)}
  disabled={loading}
  activeOpacity={0.8}
>
  <Text style={styles.cancelButtonText}>
    {loading ? 'Đang hủy vé...' : 'Xác nhận hủy'}
  </Text>
</TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#353535',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#351719',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  warningIcon: {
    color: '#E50914',
    fontSize: 30,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  ticketInfo: {
    backgroundColor: '#242424',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#BDBDBD',
    fontSize: 13,
    marginTop: 5,
  },
  refundBox: {
    backgroundColor: '#222222',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refundLabel: {
    flex: 1,
    color: '#AAAAAA',
    fontSize: 12,
    marginRight: 8,
  },
  refundValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  feeValue: {
    color: '#FF7777',
    fontSize: 12,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
    paddingTop: 12,
    marginTop: 2,
    marginBottom: 0,
  },
  totalLabel: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  totalValue: {
    color: '#4CD964',
    fontSize: 14,
    fontWeight: 'bold',
  },
  policy: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  keepButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});