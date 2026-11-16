import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { checkShowtimeConflictApi, fetchRoomTimelineApi } from '../api';

const ROOM_OPTIONS = ['PHÒNG 01', 'PHÒNG 02', 'PHÒNG 03', 'IMAX 01'];

export default function ShowtimeConflictModal({
  visible,
  movie,
  defaultCinema = 'CineNow Landmark 81',
  defaultDate = '2026-10-16',
  onClose,
  onApplyShowtime,
}) {
  const [cinemaName, setCinemaName] = useState(defaultCinema);
  const [selectedRoom, setSelectedRoom] = useState('PHÒNG 01');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('10:00');
  const [bufferMinutes, setBufferMinutes] = useState('15');

  const [loading, setLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const movieId = movie?._id || movie?.id || 'mem_movie_1';

  const handleCheck = async () => {
    try {
      setLoading(true);
      setCheckResult(null);

      const res = await checkShowtimeConflictApi({
        movieId,
        cinemaName,
        room: selectedRoom,
        date,
        startTime,
        bufferMinutes: Number(bufferMinutes) || 15,
      });

      setCheckResult(res);
    } catch (err) {
      Alert.alert('Lỗi kiểm tra', err.message || 'Không thể kiểm tra xung đột.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTimeline = async () => {
    try {
      setTimelineLoading(true);
      const data = await fetchRoomTimelineApi({
        cinemaName,
        room: selectedRoom,
        date,
      });
      setTimeline(data);
    } catch (err) {
      Alert.alert('Lỗi tải timeline', err.message || 'Không thể tải lịch phòng chiếu.');
    } finally {
      setTimelineLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚡ Kiểm tra Xung Đột Phòng Chiếu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Phim đang xét */}
            <View style={styles.movieInfoBox}>
              <Text style={styles.movieLabel}>Phim dự kiến chiếu:</Text>
              <Text style={styles.movieTitleText}>{movie?.title || 'Hành Tinh Đỏ'}</Text>
              <Text style={styles.movieDurationText}>
                Thời lượng: {movie?.duration || '128 phút'} • Buffer: {bufferMinutes} phút
              </Text>
            </View>

            {/* Inputs */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rạp chiếu:</Text>
              <TextInput
                style={styles.input}
                value={cinemaName}
                onChangeText={setCinemaName}
                placeholder="Tên rạp chiếu"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phòng chiếu:</Text>
              <View style={styles.roomRow}>
                {ROOM_OPTIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roomChip, selectedRoom === r && styles.roomChipActive]}
                    onPress={() => setSelectedRoom(r)}
                  >
                    <Text style={[styles.roomChipText, selectedRoom === r && styles.roomChipTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Ngày chiếu (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-10-16"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={[styles.formGroup, { flex: 0.8 }]}>
                <Text style={styles.label}>Giờ bắt đầu (HH:mm):</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.checkBtn}
                onPress={handleCheck}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.checkBtnText}>🔍 Kiểm tra ngay</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timelineBtn}
                onPress={handleLoadTimeline}
                disabled={timelineLoading}
                activeOpacity={0.8}
              >
                {timelineLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.timelineBtnText}>📅 Xem Timeline</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Kết quả kiểm tra */}
            {checkResult && (
              <View
                style={[
                  styles.resultBox,
                  checkResult.hasConflict ? styles.resultConflict : styles.resultSuccess,
                ]}
              >
                <Text
                  style={[
                    styles.resultTitle,
                    checkResult.hasConflict ? styles.resultTitleConflict : styles.resultTitleSuccess,
                  ]}
                >
                  {checkResult.hasConflict ? '⚠️ PHÁT HIỆN XUNG ĐỘT' : '✅ PHÒNG CHIẾU HỢP LỆ'}
                </Text>

                <Text style={styles.resultReason}>
                  {checkResult.reason ||
                    `Phòng "${selectedRoom}" hoàn toàn trống từ ${startTime} đến ${checkResult.proposedSlot?.endTime || ''}. Không bị xung đột!`}
                </Text>

                {/* Gợi ý khung giờ nếu bị xung đột */}
                {checkResult.hasConflict && checkResult.suggestedStartTime && (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionTitle}>💡 GỢI Ý KHUNG GIỜ TIẾP THEO:</Text>
                    <Text style={styles.suggestionText}>
                      Bắt đầu lúc:{' '}
                      <Text style={styles.suggestionHighlight}>
                        {checkResult.suggestedStartTime}
                      </Text>{' '}
                      (Kết thúc: {checkResult.suggestedSlot?.suggestedEndTime})
                    </Text>

                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={() => {
                        setStartTime(checkResult.suggestedStartTime);
                        if (onApplyShowtime) {
                          onApplyShowtime(checkResult.suggestedStartTime);
                        }
                      }}
                    >
                      <Text style={styles.applyBtnText}>
                        Áp dụng giờ {checkResult.suggestedStartTime}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Timeline phòng chiếu */}
            {timeline && (
              <View style={styles.timelineContainer}>
                <Text style={styles.timelineHeader}>
                  📊 LỊCH PHÒNG {timeline.room} ({timeline.date}):
                </Text>

                <Text style={styles.timelineSub}>
                  Ca bận ({timeline.busySlots?.length || 0}):
                </Text>
                {timeline.busySlots?.length === 0 ? (
                  <Text style={styles.timelineEmpty}>Chưa có ca chiếu nào đã đặt.</Text>
                ) : (
                  timeline.busySlots?.map((slot, i) => (
                    <View key={i} style={styles.busyCard}>
                      <Text style={styles.busySlotTime}>
                        ⏰ {slot.startTime} - {slot.endTime}
                      </Text>
                      <Text style={styles.busyMovieTitle}>{slot.movieTitle}</Text>
                    </View>
                  ))
                )}

                <Text style={[styles.timelineSub, { marginTop: 10 }]}>
                  Khoảng trống khả dụng ({timeline.freeSlots?.length || 0}):
                </Text>
                {timeline.freeSlots?.length === 0 ? (
                  <Text style={styles.timelineEmpty}>Không còn khoảng trống lớn hơn 30 phút.</Text>
                ) : (
                  timeline.freeSlots?.map((slot, i) => (
                    <View key={i} style={styles.freeCard}>
                      <Text style={styles.freeSlotTime}>
                        🟢 {slot.startTime} - {slot.endTime}
                      </Text>
                      <Text style={styles.freeSlotDur}>Trống {slot.availableMinutes} phút</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#AAAAAA',
    fontSize: 18,
  },
  scrollBody: {
    marginTop: 12,
  },
  movieInfoBox: {
    backgroundColor: '#27272A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#E50914',
  },
  movieLabel: {
    color: '#8E8E93',
    fontSize: 11,
  },
  movieTitleText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 2,
  },
  movieDurationText: {
    color: '#BBBBBB',
    fontSize: 12,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 13,
  },
  roomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roomChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#222222',
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  roomChipActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  roomChipText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
  },
  roomChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 14,
  },
  checkBtn: {
    flex: 1.2,
    backgroundColor: '#E50914',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  timelineBtn: {
    flex: 1,
    backgroundColor: '#27272A',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  timelineBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  resultBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  resultConflict: {
    backgroundColor: '#2C1416',
    borderColor: '#E50914',
  },
  resultSuccess: {
    backgroundColor: '#102517',
    borderColor: '#22C55E',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultTitleConflict: {
    color: '#FF5B65',
  },
  resultTitleSuccess: {
    color: '#4CD964',
  },
  resultReason: {
    color: '#DDDDDD',
    fontSize: 12,
    lineHeight: 17,
  },
  suggestionBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#4A1D20',
  },
  suggestionTitle: {
    color: '#EAB308',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  suggestionHighlight: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applyBtn: {
    marginTop: 8,
    backgroundColor: '#EAB308',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  applyBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  timelineContainer: {
    backgroundColor: '#1F1F23',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D2D32',
  },
  timelineHeader: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  timelineSub: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineEmpty: {
    color: '#666666',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  busyCard: {
    backgroundColor: '#2B1E20',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#E50914',
  },
  busySlotTime: {
    color: '#FF7B7F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  busyMovieTitle: {
    color: '#CCCCCC',
    fontSize: 11,
    marginTop: 2,
  },
  freeCard: {
    backgroundColor: '#16281D',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  freeSlotTime: {
    color: '#4CD964',
    fontSize: 12,
    fontWeight: 'bold',
  },
  freeSlotDur: {
    color: '#A1A1AA',
    fontSize: 11,
  },
});
