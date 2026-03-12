import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Switch, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import apiService from '@/services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type WriteReviewRouteProp = RouteProp<MainStackParamList, 'WriteReview'>;

export default function WriteReviewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WriteReviewRouteProp>();

  const { bookingId, teacherId, teacherName, lessonType, teacherAvatar, avatarColor } = route.params;

  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate rating
    if (rating < 1 || rating > 5) {
      Alert.alert('エラー', '評価を選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.postReview({
        bookingId,
        teacherId,
        rating,
        content: comment,
      });

      if (response.success) {
        Alert.alert(
          '成功',
          'レビューを投稿しました',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('エラー', response.error?.message || 'レビューの投稿に失敗しました');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      Alert.alert('エラー', error?.message || 'レビューの投稿に失敗しました');
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Pressable
          key={i}
          onPress={() => setRating(i)}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <Feather
            name="star"
            size={36}
            color={i <= rating ? '#F5A623' : theme.border}
            style={{ marginHorizontal: 4 }}
          />
        </Pressable>
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>レビューを投稿する</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScreenKeyboardAwareScrollView contentContainerStyle={styles.content}>
        <View style={[styles.teacherCard, { backgroundColor: theme.backgroundDefault }]}>
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
            <ThemedText style={styles.teacherName}>{teacherName}</ThemedText>
            <ThemedText style={[styles.lessonType, { color: theme.textSecondary }]}>
              {lessonType}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.ratingCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.cardTitle}>教師の評価</ThemedText>
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
        </View>

        <View style={[styles.commentCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.cardTitle}>コメント</ThemedText>
          <TextInput
            style={[
              styles.commentInput,
              { 
                backgroundColor: theme.backgroundRoot,
                borderColor: theme.border,
                color: theme.text,
              }
            ]}
            placeholder="レッスンの感想をご自由にお書きください"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <View style={[styles.anonymousCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={styles.anonymousLabel}>匿名で投稿する</ThemedText>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScreenKeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Pressable 
          style={[
            styles.submitButton, 
            { 
              backgroundColor: isSubmitting ? theme.border : theme.primary,
              opacity: isSubmitting ? 0.7 : 1,
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>投稿する</ThemedText>
          )}
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
  backButton: {
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
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
  ratingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  commentInput: {
    minHeight: 140,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 14,
  },
  anonymousCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  anonymousLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
