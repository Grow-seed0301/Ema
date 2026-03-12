import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { gradeLevels } from '@/constants/subjects';
import type { RouteProp } from '@react-navigation/native';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { apiService } from '@/services/api';
import { getSubjectIcon, getCategoryIcon } from '@/utils/subjectIcons';

type SubjectSelectionScreenRouteProp = RouteProp<MainStackParamList, 'SubjectSelection'>;

interface SubjectGroup {
  id: string;
  name: string;
  sortOrder: number;
}

interface Subject {
  id: string;
  name: string;
  isPopular: boolean;
  targetElementary: boolean;
  targetJuniorHigh: boolean;
  targetHighSchool: boolean;
  targetUniversityAdult: boolean;
  sortOrder: number;
  icon: string; // Added for display
  grades: string[]; // Added for filtering
  groups: SubjectGroup[]; // Sub-groups for the subject
}

interface SubjectCategory {
  id: string;
  name: string;
  sortOrder: number;
  subjects: Subject[];
  icon: string; // Added for display
}

// Helper function to convert target flags to grades array
const getGradesFromTargets = (subject: Omit<Subject, 'icon' | 'grades'>): string[] => {
  const grades: string[] = [];
  if (subject.targetElementary) grades.push('elementary');
  if (subject.targetJuniorHigh) grades.push('junior_high');
  if (subject.targetHighSchool) grades.push('high_school');
  if (subject.targetUniversityAdult) grades.push('university_adult');
  return grades;
};

export default function SubjectSelectionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<SubjectSelectionScreenRouteProp>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  // Work with subject names directly as that's what's stored in the database
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(route.params?.selectedSubjects || []);
  // Track selected groups per subject: { subjectName: [groupName1, groupName2] }
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string[]>>(route.params?.selectedGroups || {});
  // Track which subjects are expanded to show their groups
  // Auto-expand subjects that have selected groups so users can see their previous selections
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>(Object.keys(route.params?.selectedGroups || {}));
  const [subjectCategories, setSubjectCategories] = useState<SubjectCategory[]>([]);
  const [popularSubjects, setPopularSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Fetch subjects from API
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await apiService.getSubjects();
        
        if (response.success && response.data) {
          // Transform the data to include icons and grades
          const categoriesWithIcons = response.data.categories.map(category => ({
            ...category,
            icon: getCategoryIcon(category.name),
            subjects: category.subjects.map(subject => ({
              ...subject,
              icon: getSubjectIcon(subject.name),
              grades: getGradesFromTargets(subject),
            })),
          }));
          
          setSubjectCategories(categoriesWithIcons);
          
          // Extract popular subjects from all categories
          const allPopularSubjects: Subject[] = [];
          categoriesWithIcons.forEach(category => {
            category.subjects.forEach(subject => {
              if (subject.isPopular) {
                allPopularSubjects.push(subject);
              }
            });
          });
          setPopularSubjects(allPopularSubjects);
          
          // Expand all categories by default
          setExpandedCategories(categoriesWithIcons.map(cat => cat.id));
        } else {
          setError(response.error?.message || 'Failed to fetch subjects');
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to fetch subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const toggleSubject = (subjectName: string, hasGroups: boolean) => {
    const isCurrentlySelected = selectedSubjects.includes(subjectName);
    
    if (isCurrentlySelected) {
      // Deselect subject and clear its groups
      setSelectedSubjects(prev => prev.filter(name => name !== subjectName));
      setSelectedGroups(prev => {
        const newGroups = { ...prev };
        delete newGroups[subjectName];
        return newGroups;
      });
      setExpandedSubjects(prev => prev.filter(name => name !== subjectName));
    } else {
      // Select subject
      setSelectedSubjects(prev => [...prev, subjectName]);
      // If subject has groups, expand it to show groups
      if (hasGroups) {
        setExpandedSubjects(prev => [...prev, subjectName]);
      }
    }
  };

  const toggleSubjectExpansion = (subjectName: string) => {
    setExpandedSubjects(prev => 
      prev.includes(subjectName)
        ? prev.filter(name => name !== subjectName)
        : [...prev, subjectName]
    );
  };

  const toggleGroup = (subjectName: string, groupName: string) => {
    setSelectedGroups(prev => {
      const currentGroups = prev[subjectName] || [];
      const isSelected = currentGroups.includes(groupName);
      
      if (isSelected) {
        // Remove group
        const newGroups = currentGroups.filter(g => g !== groupName);
        if (newGroups.length === 0) {
          // Remove subject key from groups object when no groups are selected
          const { [subjectName]: _removedSubjectGroups, ...rest } = prev;
          return rest;
        }
        return { ...prev, [subjectName]: newGroups };
      } else {
        // Add group
        return { ...prev, [subjectName]: [...currentGroups, groupName] };
      }
    });
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = () => {
    // Navigate back and pass selected subject names and groups
    if (route.params?.onSelect) {
      route.params.onSelect(selectedSubjects, selectedGroups);
    }
    navigation.goBack();
  };

  // Memoize the total count of selected groups for performance
  const selectedGroupsCount = useMemo(() => {
    return Object.values(selectedGroups).reduce((acc, groups) => acc + groups.length, 0);
  }, [selectedGroups]);

  // Filter subjects based on search query and grade level
  const filterSubjects = (subjects: Subject[]) => {
    let filtered = subjects;
    
    // Filter by grade level
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(subject => 
        // If subject has no grades defined, it's available for all levels
        !subject.grades || subject.grades.includes(selectedGrade)
      );
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const renderSubjectCard = (subject: Subject) => {
    const isSelected = selectedSubjects.includes(subject.name);
    const isExpanded = expandedSubjects.includes(subject.name);
    const hasGroups = subject.groups && subject.groups.length > 0;
    const subjectSelectedGroups = selectedGroups[subject.name] || [];
    
    return (
      <View key={subject.name} style={styles.subjectCardContainer}>
        <View
          style={[
            styles.subjectCard,
            {
              backgroundColor: isSelected ? theme.primary + '1A' : theme.backgroundDefault,
              borderColor: isSelected ? theme.primary : theme.border,
            }
          ]}
        >
          <Pressable
            style={styles.subjectCardPressable}
            onPress={() => toggleSubject(subject.name, hasGroups)}
          >
            <View style={styles.subjectCardContent}>
              <ThemedText style={styles.subjectIcon}>{subject.icon}</ThemedText>
              <ThemedText 
                style={[
                  styles.subjectName,
                  { color: isSelected ? theme.primary : theme.text }
                ]}
              >
                {subject.name}
              </ThemedText>
            </View>
          </Pressable>
          {hasGroups && isSelected && (
            <Pressable 
              style={styles.expandButton}
              onPress={() => toggleSubjectExpansion(subject.name)}
              hitSlop={Spacing.sm}
            >
              <Feather 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={theme.primary} 
              />
            </Pressable>
          )}
        </View>
        
        {isSelected && isExpanded && hasGroups && (
          <View style={[styles.groupsContainer, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.groupsTitle, { color: theme.textSecondary }]}>
              小グループを選択:
            </ThemedText>
            <View style={styles.groupsGrid}>
              {subject.groups.map((group) => {
                const isGroupSelected = subjectSelectedGroups.includes(group.name);
                return (
                  <Pressable
                    key={group.id}
                    style={[
                      styles.groupChip,
                      {
                        backgroundColor: isGroupSelected ? theme.primary : theme.backgroundRoot,
                        borderColor: isGroupSelected ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => toggleGroup(subject.name, group.name)}
                  >
                    <ThemedText 
                      style={[
                        styles.groupChipText,
                        { color: isGroupSelected ? theme.buttonText : theme.text }
                      ]}
                    >
                      {group.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>専門科目を選択</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          指導可能な科目を選択してください
        </ThemedText>
        
        <View style={[
          styles.searchContainer, 
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border }
        ]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="科目を検索..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable 
              onPress={clearSearch} 
              hitSlop={Spacing.xs}
              accessibilityLabel="検索をクリア"
              accessibilityHint="検索結果がリセットされます"
            >
              <Feather name="x-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.gradeTabsContainer}
          contentContainerStyle={styles.gradeTabsContent}
        >
          {gradeLevels.map((grade) => {
            const isSelected = selectedGrade === grade.id;
            return (
              <Pressable
                key={grade.id}
                style={[
                  styles.gradeTab,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }
                ]}
                onPress={() => setSelectedGrade(grade.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${grade.name}の科目を表示`}
              >
                <ThemedText 
                  style={[
                    styles.gradeTabText,
                    { color: isSelected ? theme.buttonText : theme.text }
                  ]}
                >
                  {grade.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            科目を読み込んでいます...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Popular subjects */}
        {popularSubjects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="star" size={16} color={theme.warning} />
              <ThemedText style={[styles.sectionTitle, { color: theme.warning }]}>人気の科目</ThemedText>
            </View>
            <View style={styles.popularGrid}>
              {filterSubjects(popularSubjects).map((subject) => renderSubjectCard(subject))}
            </View>
          </View>
        )}

        {/* Subject categories */}
        {subjectCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const filteredSubjects = filterSubjects(category.subjects);
          
          // Hide category if no subjects match search
          if (searchQuery.trim() && filteredSubjects.length === 0) {
            return null;
          }
          
          return (
            <View key={category.id} style={styles.section}>
              <Pressable 
                style={[styles.categoryHeader, { backgroundColor: theme.backgroundDefault }]}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryHeaderLeft}>
                  <ThemedText style={styles.categoryIcon}>{category.icon}</ThemedText>
                  <ThemedText style={styles.categoryTitle}>{category.name}</ThemedText>
                </View>
                <Feather 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </Pressable>
              
              {isExpanded && (
                <View style={styles.subjectsGrid}>
                  {filteredSubjects.map((subject) => 
                    renderSubjectCard(subject)
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      )}

      <View style={[
        styles.footer,
        { 
          backgroundColor: theme.backgroundRoot,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + Spacing.md 
        }
      ]}>
        <View style={styles.footerInfo}>
          <ThemedText style={[styles.selectedCount, { color: theme.primary }]}>
            {selectedSubjects.length}科目選択中
          </ThemedText>
          {selectedGroupsCount > 0 && (
            <ThemedText style={[styles.selectedGroupsCount, { color: theme.textSecondary }]}>
              {selectedGroupsCount}個の小グループ選択中
            </ThemedText>
          )}
        </View>
        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary }
          ]}
          onPress={handleSave}
        >
          <ThemedText style={[styles.saveButtonText, { color: theme.buttonText }]}>決定</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  gradeTabsContainer: {
    marginTop: Spacing.md,
  },
  gradeTabsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  gradeTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  gradeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subjectCardContainer: {
    width: '47.5%',
    marginBottom: Spacing.sm,
  },
  subjectCard: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  subjectCardPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectCardContent: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '100%',
  },
  subjectIcon: {
    fontSize: 28,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  expandButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  groupsContainer: {
    width: '100%',
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  groupsTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  groupChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  groupChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  footerInfo: {
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedGroupsCount: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.xs / 2,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
