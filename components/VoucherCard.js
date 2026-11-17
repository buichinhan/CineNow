
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const COLORS = {
  background: '#17191E',
  surface: '#202329',
  red: '#E50914',
  redLight: '#FF4D57',
  white: '#FFFFFF',
  muted: '#9297A3',
  border: '#343740',
};

const formatMoney = (value) => {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('vi-VN')}đ`;
};

const formatDate = (value) => {
  if (!value) return 'Không giới hạn';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định';

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/');
};

export default function VoucherCard({
  voucher,
  isClaimed = false,
  canClaim = true,
  onClaim,
  onApply,
  onPress,
  isClaiming = false,
  mode = 'public',
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
    status,
  } = voucher || {};

  const isUsed = status === 'USED';
  const isExpired =
    status === 'EXPIRED' ||
    (endDate &&
      !Number.isNaN(new Date(endDate).getTime()) &&
      new Date(endDate).getTime() < Date.now());

  const isUnavailable = isUsed || isExpired;
  const isPublicClaimed = mode === 'public' && isClaimed;
  const isPublicDisabled =
    mode === 'public' && (!canClaim || isClaiming);

  const discountNumber = Number(discountValue) || 0;

  let discountLabel = 'QUÀ';
  let discountUnit = 'TẶNG KÈM';

  if (discountType === 'PERCENTAGE') {
    discountLabel = `${discountNumber}%`;
    discountUnit = 'GIẢM GIÁ';
  } else if (discountType === 'FIXED_AMOUNT') {
    discountLabel =
      discountNumber >= 1000
        ? `${Number((discountNumber / 1000).toFixed(1))}K`
        : `${discountNumber}đ`;
    discountUnit = 'GIẢM THẲNG';
  }

  let buttonText = 'Lưu voucher';
  let buttonDisabled = false;

  if (mode === 'public') {
    if (isUnavailable) {
      buttonText = isUsed ? 'Đã sử dụng' : 'Đã hết hạn';
      buttonDisabled = true;
    } else if (isClaimed) {
      buttonText = '✓ Đã trong ví';
      buttonDisabled = true;
    } else if (!canClaim) {
      buttonText = 'Hết lượt';
      buttonDisabled = true;
    } else {
      buttonDisabled = isClaiming;
    }
  } else if (isUnavailable) {
    buttonText = isUsed ? 'Đã sử dụng' : 'Đã hết hạn';
    buttonDisabled = true;
  } else if (mode === 'select') {
    buttonText = isSelected ? '✓ Đang áp dụng' : 'Chọn mã';
  } else {
    buttonText = 'Dùng ngay';
  }

  const handleAction = () => {
    if (buttonDisabled || isClaiming) return;

    if (mode === 'public') {
      onClaim?.(voucher);
    } else {
      onApply?.(voucher);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isUnavailable && styles.cardUnavailable,
      ]}
    >
      <View style={styles.topAccent} />

      <View style={styles.mainRow}>
        <View style={styles.discountSection}>
          <View style={styles.discountCircle}>
            <Text style={styles.discountValue} numberOfLines={1}>
              {discountLabel}
            </Text>
            <Text style={styles.discountUnit}>
              {discountUnit}
            </Text>
          </View>
          <Text style={styles.cinemaLabel}>CINENOW</Text>
        </View>

        <View style={styles.verticalDivider}>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>ƯU ĐÃI ĐẶC BIỆT</Text>
            {isSelected && (
              <View style={styles.selectedPill}>
                <Text style={styles.selectedPillText}>ĐÃ CHỌN</Text>
              </View>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {title || 'Ưu đãi CineNow'}
          </Text>

          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>MÃ</Text>
            <Text style={styles.codeText} numberOfLines={1}>
              {code || 'CINENOW'}
            </Text>
          </View>

          <Text style={styles.conditionText}>
            Đơn từ{' '}
            <Text style={styles.conditionStrong}>
              {formatMoney(minOrderAmount)}
            </Text>
          </Text>

          {discountType === 'PERCENTAGE' &&
            Number(maxDiscountAmount) > 0 && (
              <Text style={styles.conditionText}>
                Giảm tối đa{' '}
                <Text style={styles.conditionStrong}>
                  {formatMoney(maxDiscountAmount)}
                </Text>
              </Text>
            )}

          {!!freeItemName && (
            <Text style={styles.giftText} numberOfLines={2}>
              🎁 Tặng {freeItemName}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.horizontalDivider}>
        <View style={styles.cutoutLeft} />
        <View style={styles.dashedHorizontal} />
        <View style={styles.cutoutRight} />
      </View>

      {Array.isArray(applicableFormats) &&
        applicableFormats.length > 0 && (
          <View style={styles.formatRow}>
            {applicableFormats.map((format, index) => (
              <View
                key={`${String(format)}-${index}`}
                style={styles.formatChip}
              >
                <Text style={styles.formatText}>
                  {String(format)}
                </Text>
              </View>
            ))}
          </View>
        )}

      <View style={styles.footer}>
        <View style={styles.expiryBlock}>
          <Text style={styles.expiryLabel}>HẠN SỬ DỤNG</Text>
          <Text style={styles.expiryValue}>
            {formatDate(endDate)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            (buttonDisabled || isPublicClaimed || isPublicDisabled) &&
              styles.actionButtonDisabled,
            isSelected &&
              !buttonDisabled &&
              styles.actionButtonSelected,
          ]}
          activeOpacity={0.8}
          disabled={buttonDisabled}
          onPress={handleAction}
        >
          {isClaiming && mode === 'public' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.actionText,
                buttonDisabled && styles.actionTextDisabled,
              ]}
            >
              {buttonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  cardSelected: {
    borderColor: COLORS.red,
    borderWidth: 1.5,
  },
  cardUnavailable: {
    opacity: 0.55,
  },
  topAccent: {
    height: 3,
    backgroundColor: COLORS.red,
  },
  mainRow: {
    flexDirection: 'row',
    minHeight: 158,
  },
  discountSection: {
    width: 108,
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25171B',
  },
  discountCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#431B22',
    borderWidth: 1,
    borderColor: '#78303A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  discountValue: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
    includeFontPadding: false,
  },
  discountUnit: {
    color: '#FF9DA3',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: 0.7,
  },
  cinemaLabel: {
    marginTop: 12,
    color: '#E9A0A6',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  verticalDivider: {
    width: 1,
    paddingVertical: 14,
    backgroundColor: '#25171B',
  },
  dividerLine: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: '#5C343A',
    borderStyle: 'dashed',
  },
  infoSection: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 13,
    paddingTop: 17,
    paddingBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 5,
  },
  eyebrow: {
    fontSize: 9,
    color: COLORS.redLight,
    fontWeight: '900',
    letterSpacing: 1,
  },
  selectedPill: {
    backgroundColor: '#173A2A',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  selectedPillText: {
    color: '#6EE7A5',
    fontSize: 8,
    fontWeight: '800',
  },
  title: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 11,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: '#302025',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 11,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F4A2A8',
    marginRight: 7,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  conditionText: {
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 17,
  },
  conditionStrong: {
    color: '#E7E8EC',
    fontWeight: '700',
  },
  giftText: {
    fontSize: 11,
    color: '#80E6AC',
    fontWeight: '700',
    marginTop: 7,
  },
  horizontalDivider: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cutoutLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0B0B0B',
    marginLeft: -8,
  },
  dashedHorizontal: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4A4D55',
  },
  cutoutRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0B0B0B',
    marginRight: -8,
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingBottom: 7,
    gap: 6,
  },
  formatChip: {
    backgroundColor: '#292C33',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  formatText: {
    fontSize: 10,
    color: '#C8CBD3',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 15,
    gap: 10,
  },
  expiryBlock: {
    flex: 1,
  },
  expiryLabel: {
    fontSize: 9,
    color: '#818691',
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  expiryValue: {
    fontSize: 12,
    color: '#E1E3E8',
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: COLORS.red,
    minWidth: 106,
    minHeight: 38,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#383B43',
  },
  actionButtonSelected: {
    backgroundColor: '#167A4C',
  },
  actionText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionTextDisabled: {
    color: '#B7BBC4',
  },
});
