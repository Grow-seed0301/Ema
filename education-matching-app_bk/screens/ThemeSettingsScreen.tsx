import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

type ThemeOption = 'light' | 'dark' | 'system';

export default function ThemeSettingsScreen() {
  const { theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('light');

  const ThemeOptionCard = ({
    icon,
    title,
    subtitle,
    value,
    iconColor,
    iconBgColor,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    subtitle: string;
    value: ThemeOption;
    iconColor: string;
    iconBgColor: string;
  }) => {
    const isSelected = selectedTheme === value;
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.optionCard,
          { 
            backgroundColor: theme.backgroundDefault,
            borderColor: isSelected ? theme.primary : theme.border,
            borderWidth: isSelected ? 2 : 1,
            opacity: pressed ? 0.9 : 1
          }
        ]}
        onPress={() => setSelectedTheme(value)}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.optionInfo}>
          <ThemedText style={styles.optionTitle}>{title}</ThemedText>
          <ThemedText style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </View>
        <View style={[
          styles.radioOuter,
          { borderColor: isSelected ? theme.primary : theme.border }
        ]}>
          {isSelected ? (
            <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
        アプリの表示テーマを選択してください
      </ThemedText>

      <View style={styles.optionsContainer}>
        <ThemeOptionCard
          icon="white-balance-sunny"
          title="ライト"
          subtitle="明るい表示テーマ"
          value="light"
          iconColor={theme.primary}
          iconBgColor={theme.primary + '1A'}
        />
        
        <ThemeOptionCard
          icon="moon-waning-crescent"
          title="ダーク"
          subtitle="暗い表示テーマ"
          value="dark"
          iconColor={theme.primary}
          iconBgColor={theme.primary + '1A'}
        />
        
        <ThemeOptionCard
          icon="cellphone"
          title="システム"
          subtitle="デバイスの設定に合わせる"
          value="system"
          iconColor={theme.primary}
          iconBgColor={theme.primary + '1A'}
        />
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 9999,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
});
