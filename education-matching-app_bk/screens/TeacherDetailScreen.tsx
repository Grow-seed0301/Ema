import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { SubjectDisplay } from "@/components/SubjectDisplay";
import { Calendar } from "@/components/Calendar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import { apiService } from "@/services/api";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type TabType = "details" | "experience" | "reviews";

interface Review {
  id: string;
  userType: string;
  gender: string;
  timeAgo: string;
  rating: number;
  content: string;
  avatarColor: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
}

// Default rating to display when teacher has no reviews
const DEFAULT_RATING = 3;

export default function TeacherDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<MainStackParamList, "TeacherDetail">>();

  const teacherId = route.params?.teacherId || "1";

  // Teacher data state
  const [teacherData, setTeacherData] = useState<{
    id: string;
    name: string;
    specialty: string;
    avatarUrl: string | null;
    avatarColor: string;
    bio: string;
    subjects: string[];
    subjectGroups: Record<string, string[]>;
    teachingStyles: string[];
    credentials: Array<{
      id: string;
      teacherId: string;
      type: string;
      title: string;
      organization?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      sortOrder: number;
    }>;
    experience: string;
    experienceYears: number;
    totalStudents: number;
    totalLessons: number;
  } | null>(null);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  // Schedule data state
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
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Use teacher data from state or fallback to defaults
  const teacherName = teacherData?.name || "田中 圭";
  const teacherSpecialty = teacherData?.specialty || "数学専門";
  const teacherAvatarUrl = teacherData?.avatarUrl || null;
  const teacherAvatarColor = teacherData?.avatarColor || "#3B82F6";
  const teacherBio = teacherData?.bio || "自己紹介が登録されていません。";
  const subjects = teacherData?.subjects || [];
  const subjectGroups = teacherData?.subjectGroups || {};
  const teachingStyles = teacherData?.teachingStyles || [];
  const credentials = teacherData?.credentials || [];
  const experienceYears = teacherData?.experienceYears || 0;
  const totalStudents = teacherData?.totalStudents || 0;
  const totalLessons = teacherData?.totalLessons || 0;

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // UI state - must be declared before useEffect that uses them
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const fetchTeacherData = useCallback(async () => {
    try {
      setLoadingTeacher(true);
      const response = await apiService.getTeacherDetails(teacherId);

      if (response.success && response.data) {
        setTeacherData({
          id: response.data.id,
          name: response.data.name,
          specialty: response.data.specialty,
          avatarUrl: response.data.avatarUrl,
          avatarColor: response.data.avatarColor,
          bio: response.data.bio,
          subjects: response.data.subjects,
          subjectGroups: response.data.subjectGroups,
          teachingStyles: response.data.teachingStyles,
          credentials: response.data.credentials,
          experience: response.data.experience,
          experienceYears: response.data.experienceYears,
          totalStudents: response.data.totalStudents,
          totalLessons: response.data.totalLessons,
        });
        setIsFavorite(response.data.isFavorite);
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoadingTeacher(false);
    }
  }, [teacherId]);

  const fetchScheduleData = useCallback(async () => {
    try {
      setLoadingSchedule(true);
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
            setSelectedTimeSlot(
              `${daySchedule.timeSlots[0].startTime} - ${daySchedule.timeSlots[0].endTime}`,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoadingSchedule(false);
    }
  }, [teacherId, currentMonth, selectedDate]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoadingReviews(true);
      setReviewsError(null);

      const response = await apiService.getTeacherReviews(teacherId, {
        filter: reviewFilter,
        page: 1,
        limit: 20,
      });

      if (response.success && response.data) {
        setReviews(response.data.reviews);
        setReviewStats(response.data.stats);
      } else {
        setReviewsError(
          response.error?.message || "レビューの取得に失敗しました",
        );
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviewsError("レビューの取得中にエラーが発生しました");
    } finally {
      setLoadingReviews(false);
    }
  }, [teacherId, reviewFilter]);

  // Fetch teacher data when component mounts
  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  // Fetch schedule data when month changes
  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  // Fetch reviews when the reviews tab becomes active or filter changes
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviews();
    }
  }, [activeTab, fetchReviews]);

  const handleMessagePress = async () => {
    try {
      // Get or create chat with the teacher
      const response = await apiService.getOrCreateChat(teacherId);

      if (response.success && response.data) {
        navigation.navigate("Chat", {
          chatId: response.data.id,
          name: teacherName,
          participantId: teacherId,
        });
      } else {
        Alert.alert(
          "エラー",
          response.error?.message || "チャットの作成に失敗しました",
        );
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      Alert.alert("エラー", "チャットの作成中にエラーが発生しました");
    }
  };

  // Extract available dates and time slots from scheduleData for current month
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

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  const handleToggleFavorite = async () => {
    const newFavoriteState = !isFavorite;

    try {
      // Optimistically update the UI
      setIsFavorite(newFavoriteState);

      // Call the API
      const response = await apiService.toggleFavoriteTeacher(
        teacherId,
        newFavoriteState,
      );

      if (!response.success) {
        // Revert on error
        setIsFavorite(!newFavoriteState);
        Alert.alert(
          "エラー",
          response.error?.message || "お気に入りの更新に失敗しました",
        );
      }
    } catch {
      // Revert on error
      setIsFavorite(!newFavoriteState);
      Alert.alert("エラー", "お気に入りの更新に失敗しました");
    }
  };

  const getDayOfWeek = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    return dayNames[date.getDay()];
  };

  const getCredentialIcon = (type: string): "book" | "briefcase" | "award" => {
    switch (type) {
      case "education":
        return "book";
      case "career":
        return "briefcase";
      default:
        return "award";
    }
  };

  const renderStars = (count: number, size: number = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={size}
          color={i <= count ? "#f59e0b" : theme.border}
        />,
      );
    }
    return stars;
  };

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <Pressable
      style={[
        styles.tabButton,
        activeTab === tab && {
          borderBottomColor: theme.primary,
          borderBottomWidth: 2,
        },
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <ThemedText
        style={[
          styles.tabButtonText,
          { color: activeTab === tab ? theme.primary : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.profileHeader,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <View
          style={[styles.avatar, { backgroundColor: theme.primary + "1A" }]}
        >
          {teacherAvatarUrl ? (
            <Image
              source={{ uri: teacherAvatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <Feather name="user" size={40} color={theme.primary} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <ThemedText style={styles.profileName}>{teacherName}</ThemedText>
          <ThemedText
            style={[styles.profileSpecialty, { color: theme.textSecondary }]}
          >
            {teacherSpecialty}
          </ThemedText>
        </View>
        <Pressable
          style={[
            styles.favoriteButton,
            { backgroundColor: theme.backgroundDefault },
          ]}
          onPress={handleToggleFavorite}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? theme.danger : theme.textSecondary}
          />
        </Pressable>
      </View>

      <View style={[styles.tabsContainer, { borderBottomColor: theme.border }]}>
        <TabButton tab="details" label="詳細" />
        <TabButton tab="experience" label="経験" />
        <TabButton tab="reviews" label="レビュー" />
      </View>

      {activeTab === "details" ? (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>自己紹介</ThemedText>
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <ThemedText
                style={[styles.bioText, { color: theme.textSecondary }]}
              >
                {teacherBio}
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>対応科目</ThemedText>
            {subjects.length > 0 ? (
              <SubjectDisplay
                subjects={subjects}
                subjectGroups={subjectGroups}
              />
            ) : (
              <ThemedText
                style={[styles.bioText, { color: theme.textSecondary }]}
              >
                科目情報が登録されていません
              </ThemedText>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>スケジュール</ThemedText>
            <View
              style={[
                styles.calendarCard,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <Calendar
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onDateSelect={(day) => {
                  setSelectedDate(day);
                  // Auto-select first time slot for the selected date
                  const dateKey = day.toString();
                  const daySchedule = scheduleData[dateKey];
                  if (daySchedule && daySchedule.timeSlots.length > 0) {
                    const firstAvailableSlot = daySchedule.timeSlots.find(
                      (slot) => !slot.isBooked,
                    );
                    if (firstAvailableSlot) {
                      setSelectedTimeSlot(
                        `${firstAvailableSlot.startTime} - ${firstAvailableSlot.endTime}`,
                      );
                    }
                  }
                }}
                onMonthChange={setCurrentMonth}
                unavailableDates={unavailableDatesForMonth}
                showDayIndicators={true}
                dayStatuses={Object.fromEntries(
                  availableDatesForMonth.map((day) => [day, 'available'])
                )}
              />
            </View>

            {selectedDate && timeSlotsForSelectedDate.length > 0 ? (
              <>
                <ThemedText
                  style={[styles.availableTimeTitle, { marginTop: Spacing.lg }]}
                >
                  {currentMonth.getMonth() + 1}月{selectedDate}日（
                  {getDayOfWeek(selectedDate)}）の空き時間
                </ThemedText>
                <View style={styles.timeSlotsGrid}>
                  {timeSlotsForSelectedDate.map((slot) => (
                    <Pressable
                      key={slot}
                      style={[
                        styles.timeSlotBtn,
                        selectedTimeSlot === slot
                          ? { backgroundColor: theme.primary }
                          : {
                              backgroundColor: theme.backgroundDefault,
                              borderColor: theme.border,
                              borderWidth: 1,
                            },
                      ]}
                      onPress={() => setSelectedTimeSlot(slot)}
                    >
                      <ThemedText
                        style={[
                          styles.timeSlotText,
                          {
                            color:
                              selectedTimeSlot === slot
                                ? "#ffffff"
                                : theme.text,
                          },
                        ]}
                      >
                        {slot}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : selectedDate ? (
              <ThemedText
                style={[
                  styles.availableTimeTitle,
                  { marginTop: Spacing.lg, color: theme.textSecondary },
                ]}
              >
                {currentMonth.getMonth() + 1}月{selectedDate}日（
                {getDayOfWeek(selectedDate)}）の空き時間はありません
              </ThemedText>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
      {activeTab === "experience" ? (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                指導年数
              </ThemedText>
              <View style={styles.statValueRow}>
                <ThemedText
                  style={[styles.statValue, { color: theme.primary }]}
                >
                  {experienceYears > 0 ? experienceYears : "-"}
                </ThemedText>
                {experienceYears > 0 && (
                  <ThemedText style={[styles.statUnit, { color: theme.text }]}>
                    年
                  </ThemedText>
                )}
              </View>
            </View>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.statLabel, { color: theme.textSecondary }]}
              >
                合格実績
              </ThemedText>
              <View style={styles.statValueRow}>
                <ThemedText style={styles.statValue}>
                  {totalStudents.toLocaleString()}
                </ThemedText>
                <ThemedText style={[styles.statUnit, { color: theme.text }]}>
                  名
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>実績・資格</ThemedText>
            {credentials.length > 0 ? (
              credentials.map((credential) => (
                <View
                  key={credential.id}
                  style={[
                    styles.achievementItem,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIcon,
                      { backgroundColor: theme.primary + "1A" },
                    ]}
                  >
                    <Feather
                      name={getCredentialIcon(credential.type)}
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.achievementTextContainer}>
                    <ThemedText style={styles.achievementTitle}>
                      {credential.title}
                    </ThemedText>
                    {credential.organization && (
                      <ThemedText
                        style={[
                          styles.achievementOrganization,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {credential.organization}
                      </ThemedText>
                    )}
                    {(credential.startDate || credential.endDate) && (
                      <ThemedText
                        style={[
                          styles.achievementDate,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {credential.startDate || ""}
                        {credential.endDate && credential.startDate && " - "}
                        {credential.endDate || ""}
                      </ThemedText>
                    )}
                    {credential.description && (
                      <ThemedText
                        style={[
                          styles.achievementDescription,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {credential.description}
                      </ThemedText>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <ThemedText
                style={[styles.bioText, { color: theme.textSecondary }]}
              >
                実績・資格が登録されていません
              </ThemedText>
            )}
          </View>
        </ScrollView>
      ) : null}
      {activeTab === "reviews" ? (
        <ScrollView
          style={styles.tabContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.ratingOverview}>
            <View style={styles.ratingLeft}>
              <ThemedText style={styles.ratingBig}>
                {reviewStats?.totalReviews && reviewStats.totalReviews > 0
                  ? reviewStats.averageRating.toFixed(1)
                  : DEFAULT_RATING.toFixed(1)}
              </ThemedText>
              <View style={styles.starsRow}>
                {renderStars(
                  reviewStats && reviewStats.totalReviews > 0
                    ? Math.round(reviewStats.averageRating * 2) / 2
                    : DEFAULT_RATING,
                  16,
                )}
              </View>
              <ThemedText
                style={[styles.reviewCountText, { color: theme.textSecondary }]}
              >
                {reviewStats?.totalReviews || 0}件のレビュー
              </ThemedText>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count =
                  reviewStats?.ratingDistribution?.[String(stars)] || 0;
                // When no reviews exist, show 100% for DEFAULT_RATING to visually represent
                // the default 3-star rating. This helps users understand the baseline rating.
                const percent = reviewStats?.totalReviews
                  ? Math.round((count / reviewStats.totalReviews) * 100)
                  : stars === DEFAULT_RATING
                    ? 100
                    : 0;
                return (
                  <View key={stars} style={styles.ratingBarRow}>
                    <ThemedText
                      style={[
                        styles.ratingBarLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {stars}
                    </ThemedText>
                    <View
                      style={[
                        styles.ratingBarBg,
                        { backgroundColor: theme.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.ratingBarFill,
                          {
                            width: `${percent}%`,
                            backgroundColor: theme.primary,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.ratingBarPercent,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {percent}%
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterChips}>
              {[
                { key: "all", label: "すべて" },
                { key: "5", label: "★★★★★" },
                { key: "4", label: "★★★★" },
              ].map((filter) => (
                <Pressable
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    reviewFilter === filter.key
                      ? { backgroundColor: theme.primary }
                      : {
                          backgroundColor: theme.backgroundDefault,
                          borderColor: theme.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => setReviewFilter(filter.key)}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      {
                        color:
                          reviewFilter === filter.key ? "#ffffff" : theme.text,
                      },
                    ]}
                  >
                    {filter.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <View style={styles.sortButton}>
              <Feather
                name="arrow-down"
                size={14}
                color={theme.textSecondary}
              />
              <ThemedText
                style={[styles.sortText, { color: theme.textSecondary }]}
              >
                新着順
              </ThemedText>
            </View>
          </View>

          {loadingReviews ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : reviewsError ? (
            <View style={styles.errorContainer}>
              <ThemedText style={[styles.errorText, { color: theme.danger }]}>
                {reviewsError}
              </ThemedText>
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                レビューがまだありません
              </ThemedText>
            </View>
          ) : (
            reviews.map((review) => (
              <View
                key={review.id}
                style={[
                  styles.reviewCard,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <View style={styles.reviewHeader}>
                  <View
                    style={[
                      styles.reviewAvatar,
                      { backgroundColor: review.avatarColor + "33" },
                    ]}
                  >
                    <Feather name="user" size={20} color={review.avatarColor} />
                  </View>
                  <View style={styles.reviewUserInfo}>
                    <ThemedText style={styles.reviewUserType}>
                      {review.userType} / {review.gender}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.reviewTime,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {review.timeAgo}
                    </ThemedText>
                  </View>
                  <View style={styles.starsRow}>
                    {renderStars(review.rating, 12)}
                  </View>
                </View>
                <ThemedText
                  style={[styles.reviewContent, { color: theme.textSecondary }]}
                >
                  {review.content}
                </ThemedText>
              </View>
            ))
          )}
        </ScrollView>
      ) : null}

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <Pressable
          style={[styles.messageButton, { borderColor: theme.primary }]}
          onPress={handleMessagePress}
        >
          <Feather name="message-circle" size={20} color={theme.primary} />
          <ThemedText
            style={[styles.messageButtonText, { color: theme.primary }]}
          >
            メッセージ
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.bookButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            navigation.navigate("LessonBooking", {
              teacherId,
              teacherName,
              lessonType: teacherSpecialty,
              teacherAvatar: teacherAvatarUrl || undefined,
              avatarColor: teacherAvatarColor,
            });
          }}
        >
          <ThemedText style={styles.bookButtonText}>予約する</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileSpecialty: {
    fontSize: 15,
  },
  profileRate: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 36,
    fontWeight: "700",
    lineHeight: 40,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "flex-start", // Top-align for multi-line credential content
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementTextContainer: {
    flex: 1,
    gap: 4,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  achievementOrganization: {
    fontSize: 13,
  },
  achievementDate: {
    fontSize: 12,
  },
  achievementDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  ratingOverview: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  ratingLeft: {
    alignItems: "center",
    minWidth: 100,
  },
  ratingBig: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 50,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewCountText: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingBars: {
    flex: 1,
    gap: 4,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  ratingBarLabel: {
    fontSize: 12,
    width: 12,
    textAlign: "right",
  },
  ratingBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  ratingBarPercent: {
    fontSize: 12,
    width: 32,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  filterChips: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 9999,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontSize: 13,
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserType: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewTime: {
    fontSize: 12,
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  bookButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: 9999,
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  calendarCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  availableTimeTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  timeSlotBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
