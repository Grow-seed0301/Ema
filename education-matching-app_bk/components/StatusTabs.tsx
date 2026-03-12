import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Spacing } from '@/constants/theme';
import { StatusTabKey } from '@/constants/tabs';

export interface StatusTab {
  key: string;
  label: string;
  color?: string;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  selectedTab: string;
  onTabSelect: (tabKey: string) => void;
  theme: any;
  badgeCount?: { [key: string]: number };
}

export default function StatusTabs({
  tabs,
  selectedTab,
  onTabSelect,
  theme,
  badgeCount = {},
}: StatusTabsProps) {
  return (
    <View
      style={[
        styles.tabContainer,
        {
          backgroundColor: theme.backgroundDefault,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.key;
          const count = badgeCount[tab.key] || 0;

          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                isActive && [
                  styles.tabActive,
                  { borderBottomColor: theme.primary },
                ],
              ]}
              onPress={() => onTabSelect(tab.key)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  isActive && [
                    styles.tabTextActive,
                    { color: theme.primary },
                  ],
                ]}
              >
                {tab.label}
              </ThemedText>
              {count > 0 && tab.key !== StatusTabKey.REVIEWED && (
                <View
                  style={[styles.badge, { backgroundColor: theme.primary }]}
                >
                  <ThemedText style={styles.badgeText}>{count}</ThemedText>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    borderBottomWidth: 1,
  },
  tabScrollContent: {
    paddingHorizontal: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
});
