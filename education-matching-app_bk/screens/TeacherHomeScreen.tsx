import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import apiService from '@/services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string | null;
  avatarColor: string;
  subject: string;
  date: string;
  time: string;
}

interface Message {
  id: string;
  participantId: string;
  senderName: string;
  senderAvatar?: string | null;
  avatarColor?: string;
  message: string;
  timeAgo: string;
  isUnread: boolean;
}

interface TeacherStats {
  unreadMessages: number;
  upcomingLessons: number;
}

export default function TeacherHomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  
  const [stats, setStats] = useState<TeacherStats>({
    unreadMessages: 0,
    upcomingLessons: 0,
  });
  const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
  const [pendingLessons, setPendingLessons] = useState<Lesson[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch confirmed/upcoming lessons
      const upcomingResponse = await apiService.getTeacherBookings({
        status: 'confirmed',
        page: 1,
        limit: 10,
      });

      if (upcomingResponse.success && upcomingResponse.data) {
        const formattedLessons = upcomingResponse.data.bookings.map((booking) => ({
          id: booking.id,
          studentId: booking.studentId,
          studentName: booking.studentName,
          studentAvatar: booking.studentAvatar,
          avatarColor: booking.avatarColor,
          subject: booking.lessonType,
          date: booking.date,
          time: booking.time,
        }));
        setUpcomingLessons(formattedLessons);
        setStats(prev => ({ ...prev, upcomingLessons: formattedLessons.length }));
      }

      // Fetch pending lessons
      const pendingResponse = await apiService.getTeacherBookings({
        status: 'pending',
        page: 1,
        limit: 10,
      });

      if (pendingResponse.success && pendingResponse.data) {
        const formattedPending = pendingResponse.data.bookings.map((booking) => ({
          id: booking.id,
          studentId: booking.studentId,
          studentName: booking.studentName,
          studentAvatar: booking.studentAvatar,
          avatarColor: booking.avatarColor,
          subject: booking.lessonType,
          date: booking.date,
          time: booking.time,
        }));
        setPendingLessons(formattedPending);
      }

      // Fetch messages
      const messagesResponse = await apiService.getChats();
      if (messagesResponse.success && messagesResponse.data) {
        const formattedMessages = messagesResponse.data.slice(0, 5).map((chat) => ({
          id: chat.id,
          participantId: chat.participantId,
          senderName: chat.participantName,
          senderAvatar: chat.participantAvatar,
          avatarColor: chat.participantAvatarColor,
          message: chat.lastMessage,
          timeAgo: chat.timeAgo,
          isUnread: chat.unreadCount > 0,
        }));
        setMessages(formattedMessages);
        
        const totalUnread = messagesResponse.data.reduce((sum, chat) => sum + chat.unreadCount, 0);
        setStats(prev => ({ ...prev, unreadMessages: totalUnread }));
      }
    } catch (error) {
      console.error('Error loading teacher home data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Generate random avatar colors
  const getAvatarColor = (name: string) => {
    const colors = ['#E3F2FD', '#F3E5F5', '#E8F5E9', '#FFF3E0', '#FCE4EC'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.content}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View style={[styles.profileAvatar, { backgroundColor: theme.backgroundTertiary }]}>
            <Feather name="user" size={20} color={theme.textSecondary} />
          </View>
          <Pressable 
            style={[styles.notificationBtn, { backgroundColor: 'transparent' }]}
            onPress={() => {}}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.text} />
            {stats.unreadMessages > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.badgeText}>{stats.unreadMessages}</ThemedText>
              </View>
            )}
          </Pressable>
        </View>
        <ThemedText style={styles.greeting}>こんにちは、{user?.name || '田中'}先生</ThemedText>
      </View>

      <View style={styles.statsRow}>
        <Pressable
          style={[styles.statCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Messages' })}
        >
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>未読メッセージ</ThemedText>
          <ThemedText style={styles.statValue}>{stats.unreadMessages}</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.statCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          onPress={() => (navigation as any).navigate('MainTabs', { screen: 'Schedule' })}
        >
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>今後のレッスン</ThemedText>
          <ThemedText style={styles.statValue}>{stats.upcomingLessons}</ThemedText>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>今後のレッスン</ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : upcomingLessons.length > 0 ? (
        upcomingLessons.map((lesson) => (
          <Pressable
            key={lesson.id}
            style={({ pressed }) => [
              styles.lessonCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => {}}
          >
            <View style={styles.lessonContent}>
              <View style={styles.lessonLeft}>
                <View style={[styles.lessonAvatar, { backgroundColor: lesson.avatarColor || getAvatarColor(lesson.studentName) }]}>
                  <Feather name="user" size={24} color={theme.textSecondary} />
                </View>
                <View style={styles.lessonInfo}>
                  <ThemedText style={styles.lessonName}>{lesson.studentName}</ThemedText>
                  <ThemedText style={[styles.lessonSubject, { color: theme.textSecondary }]}>
                    {lesson.subject} - {lesson.date} {lesson.time}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                style={[styles.detailBtn, { borderColor: theme.primary }]}
                onPress={() => navigation.navigate('StudentDetail', { studentId: lesson.studentId })}
              >
                <ThemedText style={[styles.detailBtnText, { color: theme.primary }]}>詳細</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            予定されているレッスンはありません
          </ThemedText>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>リクエスト中のレッスン一覧</ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      ) : pendingLessons.length > 0 ? (
        pendingLessons.map((lesson) => (
          <Pressable
            key={lesson.id}
            style={({ pressed }) => [
              styles.lessonCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => {}}
          >
            <View style={styles.lessonContent}>
              <View style={styles.lessonLeft}>
                <View style={[styles.lessonAvatar, { backgroundColor: lesson.avatarColor || getAvatarColor(lesson.studentName) }]}>
                  <Feather name="user" size={24} color={theme.textSecondary} />
                </View>
                <View style={styles.lessonInfo}>
                  <ThemedText style={styles.lessonName}>{lesson.studentName}</ThemedText>
                  <ThemedText style={[styles.lessonSubject, { color: theme.textSecondary }]}>
                    {lesson.subject} - {lesson.date} {lesson.time}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                style={[styles.detailBtn, { borderColor: theme.primary }]}
                onPress={() => navigation.navigate('StudentDetail', { studentId: lesson.studentId })}
              >
                <ThemedText style={[styles.detailBtnText, { color: theme.primary }]}>詳細</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            リクエスト中のレッスンはありません
          </ThemedText>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>新着メッセージ</ThemedText>
        <Pressable onPress={() => {
          // Navigate to Messages tab - uses type assertion since MainTabs navigation is complex
          (navigation as any).navigate('MainTabs', { screen: 'Messages' });
        }}>
          <ThemedText style={[styles.moreLink, { color: theme.primary }]}>すべて表示</ThemedText>
        </Pressable>
      </View>

      {messages.length > 0 ? (
        messages.map((message) => (
          <Pressable
            key={message.id}
            style={({ pressed }) => [
              styles.messageCard,
              { backgroundColor: theme.backgroundDefault, borderColor: theme.border, opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => {
              // Navigate to Messages tab in MainTabs
              (navigation as any).navigate('MainTabs', { screen: 'Messages' });
            }}
          >
            <View style={styles.messageContent}>
              <View style={[styles.messageAvatar, { backgroundColor: message.avatarColor || getAvatarColor(message.senderName) }]}>
                <Feather name="user" size={20} color={theme.textSecondary} />
              </View>
              <View style={styles.messageInfo}>
                <View style={styles.messageHeader}>
                  <ThemedText style={styles.messageName}>{message.senderName}</ThemedText>
                  <ThemedText style={[styles.messageTime, { color: theme.textSecondary }]}>{message.timeAgo}</ThemedText>
                </View>
                <ThemedText 
                  style={[styles.messageText, { color: theme.textSecondary }]} 
                  numberOfLines={2}
                >
                  {message.message}
                </ThemedText>
              </View>
              {message.isUnread && (
                <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
              )}
            </View>
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            メッセージはありません
          </ThemedText>
        </View>
      )}

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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
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
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    maxWidth: 300,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  statCardWide: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
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
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  lessonCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  lessonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  lessonSubject: {
    fontSize: 14,
  },
  detailBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  messageInfo: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 14,
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
