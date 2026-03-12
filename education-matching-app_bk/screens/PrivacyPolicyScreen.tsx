import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiService from '@/services/api';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { createHtmlTagStyles } from '@/utils/htmlRenderStyles';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [policyData, setPolicyData] = useState<{
    title: string;
    content: string;
    updatedAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPrivacyPolicy();
        if (response.success && response.data) {
          setPolicyData(response.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch policy:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          読み込み中...
        </ThemedText>
      </View>
    );
  }

  if (error || !policyData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          プライバシーポリシーを読み込めませんでした
        </ThemedText>
        <ThemedText style={[styles.errorSubtext, { color: theme.textSecondary }]}>
          ネットワーク接続を確認してください
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>{policyData.title}</ThemedText>
        <ThemedText style={[styles.lastUpdated, { color: theme.textSecondary }]}>
          最終更新日: {formatDate(policyData.updatedAt)}
        </ThemedText>

        <View style={styles.section}>
          {/* Note: HTML content is from trusted admin sources only.
              RenderHtml library provides basic XSS protection. */}
          <RenderHtml
            contentWidth={width - (Spacing.lg * 2)}
            source={{ html: policyData.content }}
            baseStyle={{
              color: theme.textSecondary,
              fontSize: 15,
              lineHeight: 26,
            }}
            tagsStyles={createHtmlTagStyles(theme)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    lineHeight: 40,
  },
  lastUpdated: {
    fontSize: 13,
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    fontSize: 15,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 26,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 26,
    marginTop: Spacing.xs,
  },
});
