import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import BookingCard, { UserBooking } from '@/components/BookingCard';
import StatusTabs from '@/components/StatusTabs';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { BOOKING_STATUS } from '@/constants/booking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import apiService from '@/services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Status filter tabs
const STATUS_TABS = [
  { key: 'pending', label: '承認待ち', color: '#F59E0B' },
  { key: 'upcoming', label: '予定', color: '#3B82F6' },
  { key: 'completed', label: 'レビュー待ち', color: '#6366F1' },
  { key: 'reviewed', label: '履歴', color: '#6B7280' },
];

export default function BookingHistoryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await apiService.getBookingHistory({ status: 'all' });
      if (response.success && response.data) {
        setBookings(response.data.bookings.map(b => ({
          id: b.id,
          teacherId: b.teacherId,
          teacherName: b.teacherName,
          teacherAvatar: b.teacherAvatar,
          lessonTitle: b.lessonTitle,
          date: b.date,
          time: b.time,
          startTime: b.startTime,
          endTime: b.endTime,
          dayOfWeek: b.dayOfWeek,
          status: b.status,
          isCompleted: b.isCompleted,
          hasReview: b.hasReview,
          avatarColor: b.avatarColor,
        })));
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err: any) {
      const errorMessage = err?.message || '授業履歴の取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const handleBookingPress = (teacherId: string) => {
    navigation.navigate('TeacherDetail', { teacherId });
  };

  const handleReviewPress = (bookingId: string, teacherId: string, teacherName: string, lessonType: string, teacherAvatar?: string | null, avatarColor?: string) => {
    navigation.navigate('WriteReview', { bookingId, teacherId, teacherName, lessonType, teacherAvatar, avatarColor });
  };

  // Helper function to check if lesson time has passed
  const hasLessonTimePassed = useCallback((booking: UserBooking) => {
    try {
      const now = new Date();
      // Parse date in format YYYY/MM/DD
      const bookingDate = new Date(booking.date.replace(/\//g, '-'));
      // Get endTime from booking or parse from time string
      const endTime = booking.endTime || booking.time.split('〜')[1]?.trim() || '23:59';
      const [hours, minutes] = endTime.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      return now > bookingDate;
    } catch (error) {
      console.error('Error parsing booking date:', error);
      return false; // If there's an error, assume time hasn't passed
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchBookings(true);
  }, [fetchBookings]);

  // Filter bookings based on selected status
  const filteredBookings = useMemo(() => {
    if (selectedStatus === 'pending') {
      // Show lessons waiting for approval
      return bookings.filter(b => b.status === BOOKING_STATUS.PENDING);
    } else if (selectedStatus === 'upcoming') {
      // Show approved lessons before lesson time
      return bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED && !hasLessonTimePassed(b));
    } else if (selectedStatus === 'completed') {
      // Show approved lessons after lesson time without review
      return bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED && hasLessonTimePassed(b) && !b.hasReview);
    } else if (selectedStatus === 'reviewed') {
      // Show lessons that have been reviewed
      return bookings.filter(b => b.hasReview);
    }
    return bookings;
  }, [bookings, selectedStatus, hasLessonTimePassed]);

  // Calculate badge counts
  const badgeCount = useMemo(() => {
    const pendingCount = bookings.filter(b => b.status === BOOKING_STATUS.PENDING).length;
    const upcomingCount = bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED && !hasLessonTimePassed(b)).length;
    const completedCount = bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED && hasLessonTimePassed(b) && !b.hasReview).length;
    const reviewedCount = bookings.filter(b => b.hasReview).length;
    return {
      pending: pendingCount,
      upcoming: upcomingCount,
      completed: completedCount,
      reviewed: reviewedCount,
    };
  }, [bookings, hasLessonTimePassed]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Status Tabs */}
      <StatusTabs
        tabs={STATUS_TABS}
        selectedTab={selectedStatus}
        onTabSelect={setSelectedStatus}
        theme={theme}
        badgeCount={badgeCount}
      />

      {/* Bookings List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Feather name="alert-circle" size={20} color="#dc2626" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              授業履歴がありません
            </ThemedText>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.cardWrapper}>
              <BookingCard
                booking={booking}
                theme={theme}
                mode="user"
                onPress={() => handleBookingPress(booking.teacherId)}
                onReviewPress={
                  selectedStatus === 'completed'
                    ? () => handleReviewPress(booking.id, booking.teacherId, booking.teacherName, booking.lessonTitle, booking.teacherAvatar, booking.avatarColor)
                    : undefined
                }
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
});
