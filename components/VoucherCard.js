import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

export default function VoucherCard({
  voucher,
  isClaimed = false,
  canClaim = true,
  onClaim,
  onApply,
  onPress,
  isClaiming = false,
  mode = 'public', // 'public' | 'wallet' | 'select'
  isSelected = false,
}) {
  const {
    code,
    title,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    endDate,
    freeItemName,
    applicableFormats = [],
  } = voucher || {};

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const renderBadge = () => {
    if (discountType === 'PERCENTAGE') {
      return (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeLarge}>{discountValue}%</Text>
          <Text style={styles.badgeSmall}>GIẢM GIÁ</Text>
        </View>
      );
    }
    if (discountType === 'FIXED_AMOUNT') {
      const displayValue =
        discountValue >= 1000
          ? `${Math.round(discountValue / 1000)}K`
          : `${discountValue}đ`;
      return (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeLarge}>{displayValue}</Text>
          <Text style={styles.badgeSmall}>GIẢM THẲNG</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeLarge}>QUÀ</Text>
        <Text style={styles.badgeSmall}>TẶNG KÈM</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[
        styles.cardContainer,
        isSelected && styles.cardContainerSelected,
      ]}
    >
      {/* Cạnh vé bên trái */}
      <View style={styles.leftStub}>
        {renderBadge()}
        <View style={styles.ticketPerforations}>
          <View style={[styles.notch, styles.notchTop]} />
          <View style={[styles.notch, styles.notchBottom]} />
        </View>
      </View>

      {/* Đường nét đứt xé vé */}
      <View style={styles.dashedLineContainer}>
        <View style={styles.dashedLine} />
      </View>

      {/* Thông tin vé bên phải */}
      <View style={styles.rightContent}>
        <View style={styles.headerRow}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
          <Text style={styles.expiryText}>HSD: {formatDate(endDate)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {freeItemName ? (
          <Text style={styles.freeItemText}>🎁 Tặng: {freeItemName}</Text>
        ) : null}

        <View style={styles.conditionRow}>
          <Text style={styles.conditionText}>
            Đơn tối thiểu:{' '}
            <Text style={styles.conditionBold}>
              {minOrderAmount
                ? `${minOrderAmount.toLocaleString('vi-VN')}đ`
                : '0đ'}
            </Text>
          </Text>
          {discountType === 'PERCENTAGE' && maxDiscountAmount > 0 && (
            <Text style={styles.conditionText}>
              {' · '}Tối đa:{' '}
              <Text style={styles.conditionBold}>
                {maxDiscountAmount.toLocaleString('vi-VN')}đ
              </Text>
            </Text>
          )}
        </View>

        {applicableFormats && applicableFormats.length > 0 && (
          <View style={styles.formatsContainer}>
            {applicableFormats.map((f, i) => (
              <View key={i} style={styles.formatChip}>
                <Text style={styles.formatChipText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Nút hành động tuỳ chế độ */}
        <View style={styles.actionRow}>
          {mode === 'public' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isClaimed && styles.actionBtnClaimed,
                !canClaim && !isClaimed && styles.actionBtnDisabled,
              ]}
              disabled={isClaimed || !canClaim || isClaiming}
              onPress={() => onClaim && onClaim(voucher)}
              activeOpacity={0.8}
            >
              {isClaiming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.actionBtnText,
                    isClaimed && styles.actionBtnTextClaimed,
                  ]}
                >
                  {isClaimed
                    ? '✓ Đã trong ví'
                    : canClaim
                    ? 'Lưu voucher'
                    : 'Hết lượt'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {mode === 'wallet' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onApply && onApply(voucher)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Dùng ngay</Text>
            </TouchableOpacity>
          )}

          {mode === 'select' && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                isSelected && styles.actionBtnSelected,
              ]}
              onPress={() => onApply && onApply(voucher)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>
                {isSelected ? '✓ Đang áp dụng' : 'Chọn mã'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#181818',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2E2E2E',
    flexDirection: 'row',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  cardContainerSelected: {
    borderColor: '#E50914',
    borderWidth: 1.5,
  },
  leftStub: {
    width: 95,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  badgeContainer: {
    alignItems: 'center',
  },
  badgeLarge: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  badgeSmall: {
    color: '#FFD7D7',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  ticketPerforations: {
    position: 'absolute',
    right: -10,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  notch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0B0B0B',
  },
  notchTop: {
    marginTop: -10,
  },
  notchBottom: {
    marginBottom: -10,
  },
  dashedLineContainer: {
    width: 1,
    height: '100%',
    overflow: 'hidden',
  },
  dashedLine: {
    height: '100%',
    width: 1,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderStyle: 'dashed',
  },
  rightContent: {
    flex: 1,
    padding: 14,
    backgroundColor: '#1E1E1E',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeBadge: {
    backgroundColor: '#2D1618',
    borderColor: '#E50914',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codeText: {
    color: '#FF4A52',
    fontWeight: 'bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  expiryText: {
    color: '#8E8E8E',
    fontSize: 11,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 19,
    marginBottom: 6,
  },
  freeItemText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  conditionText: {
    color: '#9E9E9E',
    fontSize: 11,
  },
  conditionBold: {
    color: '#D1D1D1',
    fontWeight: '600',
  },
  formatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  formatChip: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  formatChipText: {
    color: '#C0C0C0',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  actionBtn: {
    backgroundColor: '#E50914',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 85,
    alignItems: 'center',
  },
  actionBtnClaimed: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3F3F3F',
  },
  actionBtnDisabled: {
    backgroundColor: '#333333',
  },
  actionBtnSelected: {
    backgroundColor: '#16A34A',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtnTextClaimed: {
    color: '#9E9E9E',
  },
});
