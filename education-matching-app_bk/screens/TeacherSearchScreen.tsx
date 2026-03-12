import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { TeacherCard } from '@/components/TeacherCard';
import type { TeacherCardData } from '@/components/TeacherCard';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList, SearchFilterParams } from '@/navigation/RootNavigator';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';
import apiService from '@/services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type TeacherSearchRouteProp = RouteProp<MainTabParamList, 'TeacherSearch'>;

type SortType = 'rating' | 'new';

// Debounce time in ms for route params updates to avoid duplicate API calls
const ROUTE_PARAMS_DEBOUNCE_MS = 50;

export default function TeacherSearchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<TeacherSearchRouteProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('rating');
  const [teachers, setTeachers] = useState<TeacherCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilterParams>({});
  const lastRouteParamsUpdate = useRef(0);

  // Update filters when route params change
  useEffect(() => {
    if (route.params?.filters) {
      // Mark the timestamp of this route params update
      lastRouteParamsUpdate.current = Date.now();
      setFilters(route.params.filters);
      if (route.params.filters.keyword) {
        setSearchQuery(route.params.filters.keyword);
      }
    }
  }, [route.params]);

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sortBy = sortType === 'new' ? 'createdAt' : sortType;
      const response = await apiService.searchTeachers({
        q: searchQuery || undefined,
        subjects: filters.subjects?.join(',') || undefined,
        subjectGroups: filters.subjectGroups ? JSON.stringify(filters.subjectGroups) : undefined,
        ratingMin: filters.ratingMin || undefined,
        experienceYears: filters.experienceYears || undefined,
        sortBy,
        sortOrder: 'desc',
        limit: 20,
      });

      if (response.success && response.data) {
        setTeachers(response.data.teachers.map(t => ({
          id: t.id,
          name: t.name,
          age: t.age,
          specialty: t.specialty,
          subjects: t.subjects || [],
          subjectGroups: t.subjectGroups || {},
          rating: t.rating || 3,
          reviewCount: t.reviewCount,
          totalLessons: t.totalLessons || 0,
          favorites: t.favorites,
          isFavorite: t.isFavorite,
          avatarUrl: t.avatarUrl,
          avatarColor: t.avatarColor,
          experienceYears: t.experienceYears,
        })));
        setTotalCount(response.data.pagination.totalItems);
      } else if (response.error) {
        setError(response.error.message);
      }
    } catch (err: any) {
      const errorMessage = err?.message || '教師の取得に失敗しました';
      setError(errorMessage);
      console.error('Failed to fetch teachers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortType, filters]);

  useEffect(() => {
    // Debounce API calls after route params update to avoid duplicate calls
    // when both filters and searchQuery are updated from route params
    const timeSinceRouteUpdate = Date.now() - lastRouteParamsUpdate.current;
    if (timeSinceRouteUpdate < ROUTE_PARAMS_DEBOUNCE_MS) {
      // Wait for the remaining time for all state updates from route params to complete
      const remainingTime = ROUTE_PARAMS_DEBOUNCE_MS - timeSinceRouteUpdate;
      const timeoutId = setTimeout(() => {
        fetchTeachers();
      }, remainingTime);
      return () => clearTimeout(timeoutId);
    }
    fetchTeachers();
  }, [fetchTeachers]);

  // Debounced search effect for real-time search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== (route.params?.filters?.keyword || '')) {
        fetchTeachers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const toggleFavorite = async (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;

    const newFavoriteState = !teacher.isFavorite;
    setTeachers(prev => 
      prev.map(t => t.id === id ? { ...t, isFavorite: newFavoriteState } : t)
    );

    try {
      await apiService.toggleFavoriteTeacher(id, newFavoriteState);
    } catch (error) {
      setTeachers(prev => 
        prev.map(t => t.id === id ? { ...t, isFavorite: !newFavoriteState } : t)
      );
    }
  };

  const SortButton = ({ type, label }: { type: SortType; label: string }) => (
    <Pressable
      style={[
        styles.sortButton,
        sortType === type 
          ? { backgroundColor: theme.primary }
          : { backgroundColor: theme.backgroundDefault, borderColor: theme.border, borderWidth: 1 }
      ]}
      onPress={() => setSortType(type)}
    >
      <ThemedText 
        style={[
          styles.sortButtonText,
          { color: sortType === type ? '#ffffff' : theme.text }
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="キーワードで検索"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={fetchTeachers}
            returnKeyType="search"
          />
          <Pressable 
            style={[styles.filterButton, { backgroundColor: theme.backgroundTertiary }]}
            onPress={() => navigation.navigate('SearchFilter', {
              currentFilters: {
                ...filters,
                keyword: searchQuery,
              },
            } as never)}
          >
            <Feather name="sliders" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <ThemedText style={[styles.resultsCount, { color: theme.textSecondary }]}>
          {totalCount > 0 ? `${totalCount}人の教師` : `${teachers.length}人の教師`}
        </ThemedText>
        <View style={styles.sortButtons}>
          <SortButton type="rating" label="評価順" />
          <SortButton type="new" label="新着順" />
        </View>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
          <Feather name="alert-circle" size={20} color="#dc2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable onPress={fetchTeachers} style={styles.retryButton}>
            <ThemedText style={styles.retryText}>再試行</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
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
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>教師が見つかりませんでした</ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.sm,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  resultsCount: {
    fontSize: 13,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  sortButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 9999,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
