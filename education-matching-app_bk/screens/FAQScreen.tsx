import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

interface FaqCategory {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

interface AccordionItemProps {
  title: string;
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function AccordionItem({ title, content, isExpanded, onToggle }: AccordionItemProps) {
  const { theme } = useTheme();
  const rotation = useSharedValue(isExpanded ? 180 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 300 });
  }, [isExpanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      style={[styles.accordionItem, { backgroundColor: theme.backgroundDefault }]}
      onPress={onToggle}
    >
      <View style={styles.accordionHeader}>
        <ThemedText style={styles.accordionTitle}>{title}</ThemedText>
        <Animated.View style={animatedStyle}>
          <Feather name="chevron-down" size={20} color={theme.text} />
        </Animated.View>
      </View>
      {isExpanded ? (
        <ThemedText style={[styles.accordionContent, { color: theme.textSecondary }]}>
          {content}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export default function FAQScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch FAQ Categories from API
  const { data: categoriesData = [] } = useQuery<FaqCategory[]>({
    queryKey: ['/api/faq-categories'],
    queryFn: async () => {
      const response = await apiService.getFaqCategories();
      if (!response.success) {
        // Fallback to default categories if API fails
        return [];
      }
      return response.data || [];
    },
  });

  // Use fetched categories or fallback to the first category
  const categories = categoriesData.length > 0 
    ? categoriesData.map(cat => cat.name) 
    : ['すべて'];
  
  const initialCategorySet = React.useRef(false);

  // Set initial category when categories are first loaded
  React.useEffect(() => {
    if (categories.length > 0 && !initialCategorySet.current && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
      initialCategorySet.current = true;
    }
  }, [categories]);

  // Fetch FAQs from API
  const { data: faqs = [], isLoading, error } = useQuery<FAQ[]>({
    queryKey: ['/api/faqs', selectedCategory],
    queryFn: async () => {
      const category = selectedCategory === 'すべて' ? undefined : selectedCategory;
      const response = await apiService.getFAQs(category);
      if (!response.success) {
        throw new Error(response.error?.message || 'FAQの取得に失敗しました');
      }
      return response.data || [];
    },
  });

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter FAQs by search query
  const filteredFaqs = faqs.filter((faq) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.wrapper}>
      <ScreenScrollView contentContainerStyle={styles.container}>
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="キーワードで検索"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === category 
                    ? theme.primary 
                    : theme.backgroundDefault,
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <ThemedText
                style={[
                  styles.categoryText,
                  { color: selectedCategory === category ? '#ffffff' : theme.text }
                ]}
              >
                {category}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={styles.loadingText}>読み込み中...</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={48} color={theme.textSecondary} />
            <ThemedText style={styles.errorText}>FAQの読み込みに失敗しました</ThemedText>
          </View>
        ) : filteredFaqs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="help-circle" size={48} color={theme.textSecondary} />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? '検索結果が見つかりませんでした' : 'FAQがまだ登録されていません'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.accordionList}>
            {filteredFaqs.map((item) => (
              <AccordionItem
                key={item.id}
                title={item.question}
                content={item.answer}
                isExpanded={expandedId === item.id}
                onToggle={() => toggleAccordion(item.id)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScreenScrollView>

      <View style={[styles.fabContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            { opacity: pressed ? 0.9 : 1 }
          ]}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <Feather name="headphones" size={20} color="#333333" />
          <ThemedText style={styles.fabText}>お問い合わせ</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    // height: 40,
  },
  categoriesContainer: {
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 9999,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accordionList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  accordionItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: Spacing.md,
  },
  accordionContent: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: Spacing.lg,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5A623',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 9999,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 14,
    textAlign: 'center',
  },
});
