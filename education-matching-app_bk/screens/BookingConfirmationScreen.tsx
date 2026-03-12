import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type BookingConfirmationRouteProp = RouteProp<MainStackParamList, 'BookingConfirmation'>;

export default function BookingConfirmationScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookingConfirmationRouteProp>();

  const { teacherName, lessonType, date, time, format, teacherAvatar, avatarColor } = route.params;

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleViewHistory = () => {
    navigation.navigate('BookingHistory');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>予約完了</ThemedText>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.successSection}>
          <View style={[styles.successIconOuter, { backgroundColor: '#22c55e1A' }]}>
            <View style={[styles.successIconInner, { backgroundColor: '#22c55e33' }]}>
              <Feather name="check" size={32} color="#22c55e" />
            </View>
          </View>
          <ThemedText style={styles.successTitle}>予約が完了しました</ThemedText>
          <ThemedText style={[styles.successSubtitle, { color: theme.textSecondary }]}>
            レッスンの予約が正常に完了しました。詳細は下記をご確認ください。
          </ThemedText>
        </View>

        <View style={[styles.bookingCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.cardTitle}>予約内容</ThemedText>
          
          <View style={styles.teacherRow}>
            <View style={[styles.teacherAvatar, { backgroundColor: (avatarColor || theme.primary) + '1A' }]}>
              {teacherAvatar ? (
                <Image
                  source={{ uri: teacherAvatar }}
                  style={styles.teacherAvatarImage}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={24} color={avatarColor || theme.primary} />
              )}
            </View>
            <View style={styles.teacherInfo}>
              <ThemedText style={styles.teacherName}>{teacherName} 先生</ThemedText>
              <ThemedText style={[styles.lessonType, { color: theme.textSecondary }]}>
                {lessonType}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.detailText, { color: theme.text }]}>
                {date} {time}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="video-outline" size={20} color={theme.textSecondary} />
              <ThemedText style={[styles.detailText, { color: theme.text }]}>
                {format}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleGoHome}
        >
          <ThemedText style={styles.primaryButtonText}>ホームに戻る</ThemedText>
        </Pressable>
        <Pressable 
          style={styles.secondaryButton}
          onPress={handleViewHistory}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: theme.primary }]}>
            授業履歴を確認する
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  successSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  bookingCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  teacherAvatar: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  teacherAvatarImage: {
    width: '100%',
    height: '100%',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  lessonType: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  detailsSection: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  detailText: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  primaryButton: {
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
