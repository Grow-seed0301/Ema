import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import apiService from '@/services/api';
import TeacherHomeScreen from './TeacherHomeScreen';
import { getLearningGoal } from '@/utils/learningGoalUtils';
import { getTimeUntilLesson } from '@/utils/timeUtils';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Teacher {
  id: string;
  name: string;
  avatarUrl?: string | null;
  avatarColor: string;
  specialty: string;
  subjects?: string[];
  rating: number;
  reviewCount: number;
}

interface Booking {
  id: string;
  teacherId: string;
  teacherName: string;
  lessonTitle: string;
  date: string;
  time: string;
  dayOfWeek: string;
}

interface Review {
  id: string;
  teacherName?: string;
  userType?: string;
  rating: number;
  content: string;
  timeAgo: string;
  avatarColor?: string;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  
  // Check if user is a teacher
  const isTeacher = apiService.getUserRole() === 'teacher';
  
  // If user is a teacher, render TeacherHomeScreen
  if (isTeacher) {
    return <TeacherHomeScreen />;
  }
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh user data when screen comes into focus
  // Note: Empty dependency array intentional - we only want this to run on focus,
  // not when refreshUser reference changes (which would cause infinite loop)
  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teachersRes, bookingsRes, reviewsRes] = await Promise.all([
        apiService.getRecommendedTeachers(10),
        apiService.getUpcomingBookings(),
        apiService.getLatestReviews(10),
      ]);

      if (teachersRes.success && teachersRes.data) {
        setTeachers(teachersRes.data);
      } else if (teachersRes.error) {
        setError(teachersRes.error.message);
      }

      if (bookingsRes.success && bookingsRes.data && bookingsRes.data.length > 0) {
        const booking = bookingsRes.data[0];
        setUpcomingBooking({
          id: booking.id,
          teacherId: booking.teacherId,
          teacherName: booking.teacherName,
          lessonTitle: booking.lessonTitle,
          date: booking.date,
          time: booking.time,
          dayOfWeek: booking.dayOfWeek,
        });
      }

      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data.map(r => ({
          id: r.id,
          teacherName: r.teacherName,
          userType: r.userType,
          rating: r.rating,
          content: r.content,
          timeAgo: r.timeAgo,
          avatarColor: r.avatarColor,
        })));
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'データの取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch home data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherPress = (teacherId: string) => {
    navigation.navigate('TeacherDetail', { teacherId });
  };

  const handleContactTeacher = async () => {
    if (!upcomingBooking) return;

    try {
      // Get or create chat with the teacher
      const response = await apiService.getOrCreateChat(upcomingBooking.teacherId);

      if (response.success && response.data) {
        navigation.navigate("Chat", {
          chatId: response.data.id,
          name: upcomingBooking.teacherName,
          participantId: upcomingBooking.teacherId,
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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={12}
          color={i <= rating ? '#F5A623' : theme.border}
          style={{ marginRight: 1 }}
        />
      );
    }
    return stars;
  };



  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
          <Feather name="alert-circle" size={20} color="#dc2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable onPress={fetchData} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>再試行</ThemedText>
          </Pressable>
        </View>
      ) : null}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.profileAvatar, { backgroundColor: theme.backgroundTertiary }]}>
            <Feather name="user" size={20} color={theme.textSecondary} />
          </View>
          <Pressable style={[styles.notificationBtn, { backgroundColor: 'transparent' }]}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.text} />
          </Pressable>
        </View>
        <ThemedText style={styles.greeting}>こんにちは、{user?.name || 'ゲスト'}さん</ThemedText>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="crown-outline" size={18} color={theme.primary} />
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>現在のプラン</ThemedText>
          </View>
          <ThemedText style={styles.statValue}>{user?.plan?.name || '未購入'}</ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.statHeader}>
            <MaterialCommunityIcons name="calendar-check-outline" size={18} color="#7ED321" />
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>勉強可能なレッスン</ThemedText>
          </View>
          <ThemedText style={styles.statValue}>{user?.totalLessons ?? 0} 回</ThemedText>
        </View>
      </View>

      <View style={[styles.goalCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleSection}>
            <ThemedText style={[styles.goalLabel, { color: theme.textSecondary }]}>学習目標</ThemedText>
            <ThemedText style={styles.goalTitle}>{getLearningGoal(user?.learningGoalText, '未設定')}</ThemedText>
          </View>
        </View>
      </View>

      {upcomingBooking && (
        <View style={[styles.lessonCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={styles.lessonContent}>
            <View style={styles.lessonTagRow}>
              <View style={[styles.lessonDot, { backgroundColor: '#7ED321' }]} />
              <ThemedText style={[styles.lessonTag, { color: theme.textSecondary }]}>次の予約レッスン</ThemedText>
            </View>
            <ThemedText style={styles.lessonTitle}>{upcomingBooking.lessonTitle}</ThemedText>
            <View style={styles.lessonInfoRow}>
              <MaterialCommunityIcons name="account-outline" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.lessonInfoText, { color: theme.textSecondary }]}>{upcomingBooking.teacherName}</ThemedText>
            </View>
            <View style={styles.lessonInfoRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.lessonInfoText, { color: theme.textSecondary }]}>
                {upcomingBooking.date} {upcomingBooking.time}
              </ThemedText>
            </View>
            <ThemedText style={[styles.lessonCountdown, { color: '#7ED321' }]}>
              {getTimeUntilLesson(upcomingBooking.date, upcomingBooking.time)}
            </ThemedText>
            <Pressable
              onPress={handleContactTeacher}
              style={({ pressed }) => [
                styles.joinButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 }
              ]}
            >
              <ThemedText style={styles.joinButtonText}>教師に連絡する</ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>あなたへのおすすめ教師</ThemedText>
        <Pressable onPress={() => navigation.navigate('MainTabs', { screen: 'TeacherSearch' } as any)}>
          <ThemedText style={[styles.moreLink, { color: theme.primary }]}>もっと見る</ThemedText>
        </Pressable>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.teachersScroll}
        >
          {teachers.map((teacher) => (
            <Pressable
              key={teacher.id}
              style={({ pressed }) => [
                styles.teacherCard,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={() => handleTeacherPress(teacher.id)}
            >
              <View style={[styles.teacherAvatar, { backgroundColor: teacher.avatarColor }]}>
                {teacher.avatarUrl ? (
                  <Image
                    source={{ uri: teacher.avatarUrl }}
                    style={styles.teacherAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="user" size={32} color={theme.textSecondary} />
                )}
              </View>
              <ThemedText style={styles.teacherName}>{teacher.name}</ThemedText>
              <ThemedText style={[styles.teacherSubject, { color: theme.textSecondary }]}>
                {teacher.specialty || (teacher.subjects && teacher.subjects[0]) || ''}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>ユーザーレビュー</ThemedText>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reviewsScroll}
      >
        {reviews.map((review) => (
          <View
            key={review.id}
            style={[styles.reviewCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <View style={[styles.reviewerAvatar, { backgroundColor: review.avatarColor || '#E3F2FD' }]}>
                  <Feather name="user" size={18} color={theme.textSecondary} />
                </View>
                <View>
                  <ThemedText style={styles.reviewerName}>{review.teacherName || review.userType || 'ユーザー'}</ThemedText>
                  <ThemedText style={[styles.reviewSubject, { color: theme.textSecondary }]}>
                    {review.userType || ''}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.reviewTimeAgo, { color: theme.textSecondary }]}>{review.timeAgo}</ThemedText>
            </View>
            <View style={styles.reviewStars}>
              {renderStars(review.rating)}
            </View>
            <ThemedText style={[styles.reviewComment, { color: theme.textSecondary }]} numberOfLines={4}>
              {review.content}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={{ height: 100 }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  goalCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  goalTitleSection: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  lessonCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lessonImage: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonContent: {
    padding: Spacing.lg,
  },
  lessonTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  lessonDot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  lessonTag: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.md,
  },
  lessonInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  lessonInfoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lessonCountdown: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  joinButton: {
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  moreLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  teachersScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  teacherCard: {
    width: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  teacherAvatar: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  teacherAvatarImage: {
    width: '100%',
    height: '100%',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  teacherSubject: {
    fontSize: 12,
    textAlign: 'center',
  },
  reviewsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  reviewCard: {
    width: 280,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewSubject: {
    fontSize: 12,
  },
  reviewTimeAgo: {
    fontSize: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#dc2626',
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
