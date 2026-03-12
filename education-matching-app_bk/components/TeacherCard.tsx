import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { SubjectDisplay } from '@/components/SubjectDisplay';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

export interface TeacherCardData {
  id: string;
  name: string;
  age?: number;
  specialty?: string;
  subjects?: string[];
  subjectGroups?: Record<string, string[]>;
  rating: number;
  reviewCount: number;
  totalLessons?: number;
  favorites: string;
  isFavorite: boolean;
  avatarUrl?: string | null;
  avatarColor: string;
  experienceYears?: number;
}

interface TeacherCardProps {
  teacher: TeacherCardData;
  onPress: () => void;
  onToggleFavorite: (id: string) => void;
}

export function TeacherCard({ teacher, onPress, onToggleFavorite }: TeacherCardProps) {
  const { theme } = useTheme();

  return (
    <Pressable 
      style={[styles.teacherCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
    >
      <View style={[styles.teacherAvatar, { backgroundColor: teacher.avatarColor + '33' }]}>
        {teacher.avatarUrl ? (
          <Image
            source={{ uri: teacher.avatarUrl }}
            style={styles.teacherAvatarImage}
            contentFit="cover"
          />
        ) : (
          <Feather name="user" size={32} color={teacher.avatarColor} />
        )}
      </View>
      <View style={styles.teacherInfo}>
        <View style={styles.teacherNameRow}>
          <ThemedText style={styles.teacherName}>{teacher.name}</ThemedText>
          {teacher.age ? (
            <ThemedText style={[styles.teacherAge, { color: theme.textSecondary }]}>
              {teacher.age}歳
            </ThemedText>
          ) : null}
        </View>
        
        {teacher.subjects && teacher.subjects.length > 0 ? (
          <SubjectDisplay 
            subjects={teacher.subjects}
            subjectGroups={teacher.subjectGroups}
          />
        ) : teacher.specialty ? (
          <ThemedText style={[styles.teacherSpecialty, { color: theme.textSecondary }]}>
            {teacher.specialty}
          </ThemedText>
        ) : null}
        
        <View style={styles.ratingRow}>
          <Feather name="star" size={14} color="#f59e0b" />
          <ThemedText style={styles.ratingText}>{teacher.rating}</ThemedText>
          <ThemedText style={[styles.reviewCount, { color: theme.textSecondary }]}>
            ({teacher.reviewCount})
          </ThemedText>
        </View>
        
        {teacher.experienceYears !== undefined && teacher.experienceYears > 0 ? (
          <View style={styles.experienceRow}>
            <Feather name="award" size={14} color={theme.primary} />
            <ThemedText style={[styles.experienceText, { color: theme.text }]}>
              {teacher.experienceYears}
              <ThemedText style={[styles.experienceUnit, { color: theme.textSecondary }]}> 年の経験</ThemedText>
            </ThemedText>
          </View>
        ) : null}
        
        {teacher.totalLessons !== undefined ? (
          <View style={styles.lessonRow}>
            <Feather name="book" size={14} color={theme.primary} />
            <ThemedText style={[styles.lessonText, { color: theme.text }]}>
              {teacher.totalLessons}
              <ThemedText style={[styles.lessonUnit, { color: theme.textSecondary }]}> レッスン</ThemedText>
            </ThemedText>
          </View>
        ) : null}
      </View>
      <Pressable
        style={[
          styles.favoriteButton,
          { 
            backgroundColor: teacher.isFavorite ? '#fce7f3' : theme.backgroundTertiary,
          }
        ]}
        onPress={() => onToggleFavorite(teacher.id)}
      >
        <Feather 
          name="heart"
          size={14} 
          color={teacher.isFavorite ? '#ec4899' : theme.textSecondary}
          style={teacher.isFavorite ? { opacity: 1 } : { opacity: 0.6 }}
        />
        <ThemedText 
          style={[
            styles.favoriteCount, 
            { color: teacher.isFavorite ? '#ec4899' : theme.textSecondary }
          ]}
        >
          {teacher.favorites}
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  teacherCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  teacherAvatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
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
    marginLeft: Spacing.md,
    gap: 4,
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  teacherName: {
    fontSize: 15,
    fontWeight: '700',
  },
  teacherAge: {
    fontSize: 13,
  },
  teacherSpecialty: {
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  experienceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  experienceUnit: {
    fontSize: 13,
    fontWeight: '400',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lessonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lessonUnit: {
    fontSize: 13,
    fontWeight: '400',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '400',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  favoriteCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});
