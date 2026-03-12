import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { TeacherCard } from '@/components/TeacherCard';
import type { TeacherCardData } from '@/components/TeacherCard';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import apiService from '@/services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function FavoriteTeachersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [teachers, setTeachers] = useState<TeacherCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getFavoriteTeachers();
      if (response.success && response.data) {
        setTeachers(response.data.map(t => ({
          id: t.id,
          name: t.name,
          age: t.age,
          specialty: t.specialty,
          rating: t.rating,
          reviewCount: t.reviewCount,
          favorites: t.favorites,
          isFavorite: t.isFavorite,
          avatarUrl: t.avatarUrl,
          avatarColor: t.avatarColor,
          experienceYears: t.experienceYears,
        })));
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'お気に入りの取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch favorites:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  const toggleFavorite = async (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;

    setTeachers(prev => prev.filter(t => t.id !== id));

    try {
      await apiService.toggleFavoriteTeacher(id, false);
    } catch (error) {
      fetchFavorites();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
          <Feather name="alert-circle" size={20} color="#dc2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable onPress={fetchFavorites} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>再試行</ThemedText>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            onPress={() => navigation.navigate('TeacherDetail', { teacherId: item.id })}
            onToggleFavorite={toggleFavorite}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="heart" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              お気に入りの教師がいません
            </ThemedText>
          </View>
        }
      />
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
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
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
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: '#dc2626',
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
