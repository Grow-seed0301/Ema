import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import { ThemedText } from "@/components/ThemedText";
import BookingCard, { TeacherBooking } from "@/components/BookingCard";
import StatusTabs from "@/components/StatusTabs";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { BOOKING_STATUS } from "@/constants/booking";
import apiService from "@/services/api";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Status filter tabs
const STATUS_TABS = [
  { key: "pending", label: "未承認", color: "#F59E0B" },
  { key: "confirmed", label: "承認済み", color: "#10B981" },
  { key: "completed", label: "授業完了", color: "#6366F1" },
  { key: "reviewed", label: "レビュー済み", color: "#6B7280" },
];

export default function TeacherLessonManagementScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp>();
  const [selectedStatus, setSelectedStatus] = useState("pending");

  // Fetch bookings
  const {
    data: bookingsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["teacher-bookings"],
    queryFn: async () => {
      const result = await apiService.getTeacherBookings({
        status: "all",
        page: 1,
        limit: 100,
      });
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch bookings");
      }
      return result.data;
    },
  });

  // Approve booking mutation
  const approveMutation = useMutation({
    mutationFn: (bookingId: string) => apiService.approveBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-bookings"] });
      Alert.alert("承認完了", "授業リクエストを承認しました", [{ text: "OK" }]);
    },
    onError: (error: any) => {
      Alert.alert("エラー", error.message || "承認に失敗しました", [
        { text: "OK" },
      ]);
    },
  });

  // Reject booking mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason: string;
    }) => apiService.rejectBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-bookings"] });
      Alert.alert("お断り完了", "授業リクエストをお断りしました", [
        { text: "OK" },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("エラー", error.message || "お断りに失敗しました", [
        { text: "OK" },
      ]);
    },
  });

  const handleApprove = useCallback(
    (bookingId: string) => {
      Alert.alert("承認確認", "この授業リクエストを承認しますか？", [
        { text: "キャンセル", style: "cancel" },
        {
          text: "承認する",
          onPress: () => approveMutation.mutate(bookingId),
        },
      ]);
    },
    [approveMutation],
  );

  const handleReject = useCallback(
    (bookingId: string) => {
      Alert.alert(
        "お断り理由を選択",
        "この授業リクエストをお断りする理由を選択してください",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "スケジュールが合わない",
            onPress: () =>
              rejectMutation.mutate({
                bookingId,
                reason: "スケジュールが合わない",
              }),
          },
          {
            text: "専門外の内容",
            onPress: () =>
              rejectMutation.mutate({
                bookingId,
                reason: "専門外の内容",
              }),
          },
          {
            text: "その他",
            onPress: () =>
              rejectMutation.mutate({
                bookingId,
                reason: "その他の理由",
              }),
          },
        ],
      );
    },
    [rejectMutation],
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleViewStudentDetails = useCallback(
    (studentId: string) => {
      navigation.navigate("StudentDetail", { studentId });
    },
    [navigation],
  );

  // Helper function to check if lesson time has passed
  const hasLessonTimePassed = useCallback((booking: TeacherBooking) => {
    try {
      const now = new Date();
      // Parse date in format YYYY/MM/DD
      const bookingDate = new Date(booking.date.replace(/\//g, '-'));
      const [hours, minutes] = booking.endTime.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      return now > bookingDate;
    } catch (error) {
      console.error('Error parsing booking date:', error);
      return false; // If there's an error, assume time hasn't passed
    }
  }, []);

  const allBookings: TeacherBooking[] = bookingsData?.bookings || [];
  
  // Filter bookings based on selected tab
  const bookings = useMemo(() => {
    if (selectedStatus === "confirmed") {
      // Show approved lessons before lesson time
      return allBookings.filter(
        (b) => b.status === BOOKING_STATUS.CONFIRMED && !hasLessonTimePassed(b)
      );
    } else if (selectedStatus === "completed") {
      // Show approved lessons after lesson time (completed) but not yet reviewed
      return allBookings.filter(
        (b) => b.status === BOOKING_STATUS.CONFIRMED && hasLessonTimePassed(b) && !b.hasReview
      );
    } else if (selectedStatus === "reviewed") {
      // Show lessons that have been reviewed by students
      return allBookings.filter((b) => b.hasReview);
    } else if (selectedStatus === "pending") {
      return allBookings.filter((b) => b.status === BOOKING_STATUS.PENDING);
    }
    return allBookings;
  }, [allBookings, selectedStatus, hasLessonTimePassed]);
  
  // Calculate badge counts for each tab
  const tabBadgeCounts = useMemo(
    () => ({
      pending: allBookings.filter((b) => b.status === BOOKING_STATUS.PENDING).length,
      confirmed: allBookings.filter(
        (b) => b.status === BOOKING_STATUS.CONFIRMED && !hasLessonTimePassed(b)
      ).length,
      completed: allBookings.filter(
        (b) => b.status === BOOKING_STATUS.CONFIRMED && hasLessonTimePassed(b) && !b.hasReview
      ).length,
      reviewed: allBookings.filter((b) => b.hasReview).length,
    }),
    [allBookings, hasLessonTimePassed]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Status Tabs */}
      <StatusTabs
        tabs={STATUS_TABS}
        selectedTab={selectedStatus}
        onTabSelect={setSelectedStatus}
        theme={theme}
        badgeCount={tabBadgeCounts}
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
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={styles.loadingText}>読み込み中...</ThemedText>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color={theme.textSecondary} />
            <ThemedText
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              授業リクエストはありません
            </ThemedText>
          </View>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.cardWrapper}>
              <BookingCard
                booking={booking}
                theme={theme}
                mode="teacher"
                onApprove={() => handleApprove(booking.id)}
                onReject={() => handleReject(booking.id)}
                onViewStudentDetails={() => handleViewStudentDetails(booking.studentId)}
                isProcessing={
                  approveMutation.isPending || rejectMutation.isPending
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
});
