import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { SubjectDisplay } from '@/components/SubjectDisplay';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type SearchFilterRouteProp = RouteProp<MainStackParamList, 'SearchFilter'>;

const experienceOptions = ['1年未満', '1年以上', '3年以上', '5年以上'];

// Mapping between display text and numeric values for experience years
const experienceTextToValue: Record<string, string> = {
  '1年未満': '0',
  '1年以上': '1',
  '3年以上': '3',
  '5年以上': '5',
};

// Generate reverse mapping from numeric values to display text
const experienceValueToText: Record<string, string> = Object.fromEntries(
  Object.entries(experienceTextToValue).map(([text, value]) => [value, text])
);

export default function SearchFilterScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SearchFilterRouteProp>();
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  // Track selected groups per subject: { subjectName: [groupName1, groupName2] }
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string[]>>({});
  const [minRating, setMinRating] = useState(4);
  const [selectedExperience, setSelectedExperience] = useState('3年以上');

  // Initialize with current filters from route params
  useEffect(() => {
    if (route.params?.currentFilters) {
      const { currentFilters } = route.params;
      if (currentFilters.keyword) setSearchKeyword(currentFilters.keyword);
      if (currentFilters.subjects) setSelectedSubjects(currentFilters.subjects);
      if (currentFilters.subjectGroups) setSelectedGroups(currentFilters.subjectGroups);
      if (currentFilters.ratingMin) setMinRating(currentFilters.ratingMin);
      if (currentFilters.experienceYears) {
        // Convert numeric value back to Japanese display text
        const experienceText = experienceValueToText[currentFilters.experienceYears] || currentFilters.experienceYears;
        setSelectedExperience(experienceText);
      }
    }
  }, [route.params]);

  const handleSubjectSelection = () => {
    navigation.navigate('SubjectSelection' as never, {
      selectedSubjects,
      selectedGroups,
      onSelect: (subjects: string[], groups: Record<string, string[]>) => {
        setSelectedSubjects(subjects);
        setSelectedGroups(groups);
      },
    } as never);
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSelectedSubjects([]);
    setSelectedGroups({});
    setMinRating(3);
    setSelectedExperience('');
  };

  const handleSearch = () => {
    // Convert experience years text to numeric value for API
    const experienceYearsValue = selectedExperience ? experienceTextToValue[selectedExperience] : undefined;

    // Navigate back to the TeacherSearch tab with the selected filters
    navigation.navigate('MainTabs' as never, {
      screen: 'TeacherSearch',
      params: {
        filters: {
          keyword: searchKeyword || undefined,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          subjectGroups: Object.keys(selectedGroups).length > 0 ? selectedGroups : undefined,
          ratingMin: minRating,
          experienceYears: experienceYearsValue,
        },
      },
    } as never);
  };

  // Memoize the total count of selected groups for performance
  const selectedGroupsCount = useMemo(() => {
    return Object.values(selectedGroups).reduce((acc, groups) => acc + groups.length, 0);
  }, [selectedGroups]);

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={24}
          color={i <= minRating ? '#f59e0b' : theme.border}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="キーワード、教師名"
            placeholderTextColor={theme.textSecondary}
            value={searchKeyword}
            onChangeText={setSearchKeyword}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>科目</ThemedText>
          
          <Pressable
            style={[styles.subjectSelectionButton, { 
              backgroundColor: theme.backgroundDefault, 
              borderColor: theme.border 
            }]}
            onPress={handleSubjectSelection}
          >
            <View style={styles.subjectSelectionContent}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primary + '1A' }]}>
                <Feather name="book-open" size={24} color={theme.primary} />
              </View>
              <View style={styles.subjectSelectionTextContainer}>
                <ThemedText style={styles.subjectSelectionTitle}>科目を選択</ThemedText>
                <ThemedText style={[styles.subjectSelectionSubtitle, { color: theme.textSecondary }]}>
                  {selectedSubjects.length > 0 
                    ? `${selectedSubjects.length}科目選択中${selectedGroupsCount > 0 ? ` (${selectedGroupsCount}個の小グループ)` : ''}`
                    : '指導を希望する科目を選択'}
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>

          {selectedSubjects.length > 0 && (
            <View style={styles.selectedSubjectsContainer}>
              <SubjectDisplay
                subjects={selectedSubjects}
                subjectGroups={selectedGroups}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>評価</ThemedText>
          <View style={styles.ratingContainer}>
            <Pressable style={styles.starsContainer} onPress={() => setMinRating(prev => prev === 5 ? 1 : prev + 1)}>
              {renderStars()}
            </Pressable>
            <ThemedText style={[styles.ratingText, { color: theme.textSecondary }]}>
              {minRating}.0 以上
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>経験年数</ThemedText>
          <View style={styles.chipsContainer}>
            {experienceOptions.map((exp) => (
              <Pressable
                key={exp}
                style={[
                  styles.chip,
                  selectedExperience === exp
                    ? { backgroundColor: theme.primary + '1A', borderColor: theme.primary }
                    : { backgroundColor: theme.backgroundDefault, borderColor: theme.border }
                ]}
                onPress={() => setSelectedExperience(exp)}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: selectedExperience === exp ? theme.primary : theme.text }
                  ]}
                >
                  {exp}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          style={[styles.resetButton, { borderColor: theme.primary }]}
          onPress={handleReset}
        >
          <ThemedText style={[styles.resetButtonText, { color: theme.primary }]}>リセット</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={handleSearch}
        >
          <ThemedText style={styles.searchButtonText}>検索</ThemedText>
        </Pressable>
      </View>
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
    padding: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  subjectSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  subjectSelectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectSelectionTextContainer: {
    flex: 1,
  },
  subjectSelectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subjectSelectionSubtitle: {
    fontSize: 13,
  },
  selectedSubjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
