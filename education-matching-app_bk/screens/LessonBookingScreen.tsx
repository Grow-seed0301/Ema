import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Calendar } from '@/components/Calendar';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import apiService from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type LessonBookingRouteProp = RouteProp<MainStackParamList, 'LessonBooking'>;

export default function LessonBookingScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LessonBookingRouteProp>();
  const { user, refreshUser } = useAuth();
  const { teacherName, lessonType, teacherAvatar, teacherId, avatarColor } = route.params;

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [scheduleData, setScheduleData] = useState<
    Record<
      string,
      {
        date: string;
        timeSlots: Array<{
          id: string;
          startTime: string;
          endTime: string;
          isBooked?: boolean;
        }>;
        repeatEnabled: boolean;
        dayOfWeek: string | null;
        hasBookedSlots?: boolean;
        hasAvailableSlots?: boolean;
      }
    >
  >({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const getDayOfWeek = (day: number) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return dayNames[date.getDay()];
  };

  // Get remaining lessons from user context
  const remainingLessons = user?.totalLessons ?? null;

  // Fetch teacher schedule
  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      if (!teacherId) return;
      
      try {
        setLoadingSlots(true);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const response = await apiService.getTeacherScheduleForStudent(
          teacherId,
          year,
          month,
        );
        
        if (response.success && response.data) {
          setScheduleData(response.data.schedule);
          
          // Auto-select first available date if any
          const availableDays = Object.keys(response.data.schedule)
            .map((key) => parseInt(key))
            .filter((day) => {
              const daySchedule = response.data.schedule[day.toString()];
              return (
                daySchedule &&
                daySchedule.hasAvailableSlots &&
                daySchedule.timeSlots.length > 0
              );
            })
            .sort((a, b) => a - b);

          if (availableDays.length > 0 && !selectedDate) {
            const firstAvailableDay = availableDays[0];
            setSelectedDate(firstAvailableDay);
            const daySchedule = response.data.schedule[firstAvailableDay.toString()];
            if (
              daySchedule &&
              daySchedule.timeSlots.length > 0 &&
              !daySchedule.timeSlots[0].isBooked
            ) {
              setSelectedTime(
                `${daySchedule.timeSlots[0].startTime} - ${daySchedule.timeSlots[0].endTime}`,
              );
            }
          }
        }
      } catch (error) {
        console.error('Error fetching teacher schedule:', error);
        Alert.alert('エラー', '先生のスケジュールの取得に失敗しました');
      } finally {
        setLoadingSlots(false);
      }
    };
    
    fetchTeacherSchedule();
  }, [teacherId, currentMonth]);

  // Calculate available dates for current month
  const availableDatesForMonth = useMemo(() => {
    const dates: number[] = [];

    Object.keys(scheduleData).forEach((dateKey) => {
      const dayNum = parseInt(dateKey, 10);
      if (!isNaN(dayNum)) {
        const daySchedule = scheduleData[dateKey];
        // Only include dates that have available (non-booked) slots
        if (daySchedule && daySchedule.hasAvailableSlots) {
          dates.push(dayNum);
        }
      }
    });

    return dates;
  }, [scheduleData]);

  // Calculate unavailable dates (all dates in month that are NOT available)
  const unavailableDatesForMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const unavailable: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const daySchedule = scheduleData[day.toString()];
      // Mark as unavailable if there's no schedule or no available slots
      if (!daySchedule || !daySchedule.hasAvailableSlots) {
        unavailable.push(day);
      }
    }

    return unavailable;
  }, [scheduleData, currentMonth]);

  // Get time slots for selected date
  const timeSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];

    const dateKey = selectedDate.toString();
    const daySchedule = scheduleData[dateKey];

    if (!daySchedule) return [];

    // Return only available (non-booked) time slots formatted as strings
    return daySchedule.timeSlots
      .filter((slot) => !slot.isBooked)
      .map((slot) => `${slot.startTime} - ${slot.endTime}`);
  }, [selectedDate, scheduleData]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !teacherId) {
      Alert.alert('エラー', '日付と時間を選択してください');
      return;
    }

    setIsBooking(true);
    try {
      const dayOfWeek = getDayOfWeek(selectedDate);
      const bookingDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
      const formattedDate = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}-${String(bookingDate.getDate()).padStart(2, '0')}`;

      const response = await apiService.createBooking({
        teacherId,
        lessonType,
        date: formattedDate,
        timeSlot: selectedTime,
        format: 'オンライン (Zoom)',
      });

      if (response.success && response.data) {
        // Refresh user data to get updated totalLessons
        await refreshUser();
        
        navigation.navigate('BookingConfirmation', {
          teacherName,
          lessonType,
          date: `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月${selectedDate}日（${dayOfWeek}）`,
          time: selectedTime,
          format: 'オンライン (Zoom)',
          teacherAvatar,
          avatarColor,
        });
      } else {
        // Check if error is due to insufficient lessons
        const errorCode = response.error?.code;
        const errorMessage = response.error?.message || '予約の作成に失敗しました';
        
        if (errorCode === 'INSUFFICIENT_LESSONS') {
          // Show alert and navigate to plan selection screen
          Alert.alert(
            'レッスンが不足しています',
            errorMessage,
            [
              {
                text: 'キャンセル',
                style: 'cancel'
              },
              {
                text: 'プランを購入',
                onPress: () => navigation.navigate('PlanSelection')
              }
            ]
          );
        } else {
          Alert.alert('エラー', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert('エラー', error?.message || '予約の作成に失敗しました');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView 
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={styles.content}
    >
      {loadingSlots ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            スケジュールを読み込み中...
          </ThemedText>
        </View>
      ) : (
        <>
          {remainingLessons !== null && (
            <View style={[styles.lessonInfo, { backgroundColor: theme.primary + '0A', borderColor: theme.primary + '20' }]}>
              <Feather name="book-open" size={20} color={theme.primary} />
              <ThemedText style={[styles.lessonInfoText, { color: theme.text }]}>
                残りレッスン数: <ThemedText style={[styles.lessonCount, { color: theme.primary }]}>{remainingLessons}回</ThemedText>
              </ThemedText>
            </View>
          )}
          
          <View style={styles.teacherInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '1A' }]}>
              <Feather name="user" size={32} color={theme.primary} />
            </View>
            <View style={styles.teacherDetails}>
              <ThemedText style={styles.teacherName}>{teacherName}</ThemedText>
              <ThemedText style={[styles.lessonType, { color: theme.primary }]}>{lessonType}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>日付を選択</ThemedText>
            <View style={[{ backgroundColor: theme.backgroundRoot }]}>
              <Calendar
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onDateSelect={(day) => {
                  setSelectedDate(day);
                  // Auto-select first time slot for the selected date
                  const daySchedule = scheduleData[day.toString()];
                  if (daySchedule && daySchedule.timeSlots.length > 0) {
                    const availableSlots = daySchedule.timeSlots
                      .filter((slot) => !slot.isBooked)
                      .map((slot) => `${slot.startTime} - ${slot.endTime}`);
                    if (availableSlots.length > 0) {
                      setSelectedTime(availableSlots[0]);
                    } else {
                      setSelectedTime('');
                    }
                  } else {
                    setSelectedTime('');
                  }
                }}
                onMonthChange={setCurrentMonth}
                unavailableDates={unavailableDatesForMonth}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>時間を選択</ThemedText>
            {timeSlotsForSelectedDate.length > 0 ? (
              <View style={styles.timeSlotsGrid}>
                {timeSlotsForSelectedDate.map((slot) => {
                  const isSelected = selectedTime === slot;
                  
                  return (
                    <Pressable
                      key={slot}
                      style={[
                        styles.timeSlotBtn,
                        isSelected && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.primary + '0A' },
                        !isSelected && { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.backgroundRoot },
                      ]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <ThemedText style={[
                        styles.timeSlotText,
                        isSelected && { color: theme.primary, fontWeight: '600' },
                      ]}>
                        {slot}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <ThemedText style={[styles.noSlotsText, { color: theme.textSecondary }]}>
                {selectedDate 
                  ? `${currentMonth.getMonth() + 1}月${selectedDate}日の空き時間はありません`
                  : '日付を選択してください'}
              </ThemedText>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>先生へのメッセージ（任意）</ThemedText>
            <TextInput
              style={[
                styles.messageInput,
                { 
                  backgroundColor: theme.backgroundRoot, 
                  borderColor: theme.border,
                  color: theme.text,
                }
              ]}
              placeholder="レッスンで特に学びたいことなどがあればご記入ください"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <Pressable 
            style={[
              styles.bookButton, 
              { backgroundColor: theme.primary },
              (!selectedDate || !selectedTime || isBooking) && { opacity: 0.5 }
            ]}
            onPress={handleBooking}
            disabled={!selectedDate || !selectedTime || isBooking}
          >
            {isBooking ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.bookButtonText}>この内容で予約する</ThemedText>
            )}
          </Pressable>
        </>
      )}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  lessonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  lessonInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lessonCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  lessonType: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlotBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 14,
  },
  noSlotsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 100,
  },
  bookButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
