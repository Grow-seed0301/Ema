import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import apiService from "@/services/api";
import { getStudentGrade } from "@/utils/learningGoalUtils";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type ThemeMode = "light" | "dark" | "system";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MyPageScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);

  // Refresh user data when screen comes into focus
  // Note: Empty dependency array intentional - we only want this to run on focus,
  // not when refreshUser reference changes (which would cause infinite loop)
  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Get user role from apiService since it's no longer in the user object
  // The role determines which table the user data comes from (users or teachers)
  const userRole = apiService.getUserRole();
  const isTeacher = userRole === "teacher";
  const isStudent = userRole === "student";

  // Constants
  const MAX_DISPLAYED_SUBJECTS = 3;

  // Helper function to format subjects display for teachers
  const getSubjectsDisplayText = () => {
    if (!user?.subjects || user.subjects.length === 0) {
      return "未設定";
    }
    
    // Show up to MAX_DISPLAYED_SUBJECTS subjects
    const displaySubjects = user.subjects.slice(0, MAX_DISPLAYED_SUBJECTS);
    const text = displaySubjects.join(", ");
    
    if (user.subjects.length > MAX_DISPLAYED_SUBJECTS) {
      return `${text}... (+${user.subjects.length - MAX_DISPLAYED_SUBJECTS})`;
    }
    
    return text;
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    badge,
    badgeColor,
    onPress,
    showArrow = true,
  }: {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
      onPress={onPress}
    >
      <Feather
        name={icon}
        size={20}
        color={theme.textSecondary}
        style={styles.menuIcon}
      />
      <ThemedText style={styles.menuItemText}>{title}</ThemedText>
      {badge ? (
        <ThemedText
          style={[styles.badgeText, { color: badgeColor || theme.primary }]}
        >
          {badge}
        </ThemedText>
      ) : null}
      {subtitle ? (
        <ThemedText
          style={[styles.menuItemSubtext, { color: theme.textSecondary }]}
        >
          {subtitle}
        </ThemedText>
      ) : null}
      {showArrow ? (
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );

  const ThemeToggle = () => (
    <View style={styles.menuItem}>
      <Feather
        name="sun"
        size={20}
        color={theme.textSecondary}
        style={styles.menuIcon}
      />
      <ThemedText style={styles.menuItemText}>テーマ設定</ThemedText>
      <View
        style={[
          styles.themeToggleContainer,
          { backgroundColor: theme.backgroundTertiary },
        ]}
      >
        <Pressable
          style={[
            styles.themeButton,
            themeMode === "light" && {
              backgroundColor: theme.backgroundDefault,
            },
          ]}
          onPress={() => setThemeMode("light")}
        >
          <Feather
            name="sun"
            size={16}
            color={themeMode === "light" ? theme.primary : theme.textSecondary}
          />
        </Pressable>
        <Pressable
          style={[
            styles.themeButton,
            themeMode === "dark" && {
              backgroundColor: theme.backgroundDefault,
            },
          ]}
          onPress={() => setThemeMode("dark")}
        >
          <Feather
            name="moon"
            size={16}
            color={themeMode === "dark" ? theme.primary : theme.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );

  const LogoutConfirmModal = () => (
    <Modal
      visible={showLogoutModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={[
            styles.modalContent,
            { backgroundColor: theme.backgroundDefault },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[styles.modalHandle, { backgroundColor: theme.border }]}
          />

          <View
            style={[styles.logoutIconContainer, { backgroundColor: "#fef2f2" }]}
          >
            <Feather name="log-out" size={28} color="#ef4444" />
          </View>

          <ThemedText style={styles.modalTitle}>
            ログアウトしますか？
          </ThemedText>

          <Pressable
            style={({ pressed }) => [
              styles.logoutConfirmButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutConfirmText}>
              ログアウトする
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              {
                backgroundColor: theme.backgroundTertiary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => setShowLogoutModal(false)}
          >
            <ThemedText style={styles.cancelText}>キャンセル</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const RankModal = () => {
    const RankBenefit = ({
      text,
      icon,
      rank,
    }: {
      text: string;
      icon?: string;
      rank: "bronze" | "silver" | "gold" | "platinum";
    }) => {
      // Theme-aware benefit text colors
      const benefitColors = {
        bronze: isDark ? "#d6c0b3" : "#8b6f47",
        silver: isDark ? "#cbd5e1" : "#475569",
        gold: isDark ? "#fef3c7" : "#92400e",
        platinum: isDark ? "#e0e7ff" : "#4338ca",
      };

      return (
        <View style={styles.rankBenefitRow}>
          <MaterialCommunityIcons
            name={(icon as any) || "check-circle"}
            size={16}
            color={benefitColors[rank]}
            style={{ marginTop: 1 }}
          />
          <ThemedText style={[styles.rankBenefitText, { color: benefitColors[rank] }]}>
            {text}
          </ThemedText>
        </View>
      );
    };

    const RankCondition = ({
      text,
      rank,
    }: {
      text: string;
      rank: "silver" | "gold" | "platinum";
    }) => {
      // Theme-aware condition colors
      const conditionColors = {
        silver: { dot: isDark ? "#64748b" : "#94a3b8", text: isDark ? "#cbd5e1" : "#475569" },
        gold: { dot: isDark ? "#d97706" : "#f59e0b", text: isDark ? "#fde68a" : "#92400e" },
        platinum: { dot: isDark ? "#6366f1" : "#818cf8", text: isDark ? "#c7d2fe" : "#4338ca" },
      };

      return (
        <View style={styles.rankConditionRow}>
          <View
            style={[styles.rankConditionDot, { backgroundColor: conditionColors[rank].dot }]}
          />
          <ThemedText
            style={[
              styles.rankConditionText,
              { color: conditionColors[rank].text },
            ]}
          >
            {text}
          </ThemedText>
        </View>
      );
    };

    return (
      <Modal
        visible={showRankModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRankModal(false)}
      >
        <View style={styles.rankModalOverlay}>
          <View style={[styles.rankModalContainer, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.rankModalHeader, { borderBottomColor: theme.border }]}>
              <View style={[styles.rankModalHandle, { backgroundColor: theme.border }]} />
              <ThemedText style={styles.rankModalTitle}>ランク制度</ThemedText>
              <ThemedText style={[styles.rankModalSubtitle, { color: theme.textSecondary }]}>
                現在のランクと次の目標を確認しましょう
              </ThemedText>
            </View>

            <ScrollView
              style={styles.rankModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.rankCardsContainer}>
                <View style={[
                  styles.bronzeCard,
                  {
                    backgroundColor: isDark ? "#1c1614" : "#fef7f3",
                    borderColor: isDark ? "#5d463850" : "#cd7f3220",
                  }
                ]}>
                  <View style={styles.rankCardHeader}>
                    <View style={[
                      styles.bronzeIconContainer,
                      {
                        backgroundColor: isDark ? "#4a3b32" : "#f4e6da",
                        borderColor: isDark ? "#75594830" : "#cd7f3230",
                      }
                    ]}>
                      <MaterialCommunityIcons
                        name="medal"
                        size={22}
                        color="#cd7f32"
                      />
                    </View>
                    <View>
                      <ThemedText style={[
                        styles.bronzeTitle,
                        { color: isDark ? "#e8bfa0" : "#8b6f47" }
                      ]}>
                        ブロンズ
                      </ThemedText>
                      <ThemedText style={[
                        styles.bronzeSubtitle,
                        { color: isDark ? "#a88d7d" : "#9c8070" }
                      ]}>
                        生徒数目安: 1-2人
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.rankBenefitsSection}>
                    <ThemedText style={[
                      styles.bronzeSectionLabel,
                      { color: isDark ? "#8c7060" : "#a88d7d" }
                    ]}>
                      特典
                    </ThemedText>
                    <RankBenefit
                      text="基本機能の利用"
                      rank="bronze"
                      icon="check-circle"
                    />
                  </View>
                </View>

                <View style={[
                  styles.silverCard,
                  {
                    backgroundColor: isDark ? "#181f29" : "#f1f5f9",
                    borderColor: isDark ? "#47556950" : "#cbd5e150",
                  }
                ]}>
                  <View style={styles.rankCardHeader}>
                    <View style={[
                      styles.silverIconContainer,
                      {
                        backgroundColor: isDark ? "#334155" : "#e2e8f0",
                        borderColor: isDark ? "#64748b30" : "#94a3b830",
                      }
                    ]}>
                      <MaterialCommunityIcons
                        name="medal"
                        size={22}
                        color="#94a3b8"
                      />
                    </View>
                    <View>
                      <ThemedText style={[
                        styles.silverTitle,
                        { color: isDark ? "#e2e8f0" : "#334155" }
                      ]}>
                        シルバー
                      </ThemedText>
                      <ThemedText style={[
                        styles.silverSubtitle,
                        { color: isDark ? "#94a3b8" : "#64748b" }
                      ]}>
                        生徒数目安: 3-5人
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[
                    styles.silverConditionsBox,
                    {
                      backgroundColor: isDark ? "#1e293b50" : "#e2e8f050",
                      borderColor: isDark ? "#33415550" : "#cbd5e150",
                    }
                  ]}>
                    <ThemedText style={[
                      styles.silverConditionLabel,
                      { color: isDark ? "#64748b" : "#94a3b8" }
                    ]}>
                      昇格条件
                    </ThemedText>
                    <RankCondition text="平均評価 3.0以上" rank="silver" />
                    <RankCondition text="登録料: ¥3,000" rank="silver" />
                  </View>
                  <View style={styles.rankBenefitsSection}>
                    <ThemedText style={[
                      styles.silverSectionLabel,
                      { color: isDark ? "#64748b" : "#94a3b8" }
                    ]}>
                      特典
                    </ThemedText>
                    <RankBenefit
                      text="シルバーバッジ表示"
                      rank="silver"
                      icon="check-circle"
                    />
                    <RankBenefit
                      text="マッチング 1.2倍 優先"
                      rank="silver"
                      icon="check-circle"
                    />
                    <RankBenefit
                      text="週次レポート配信"
                      rank="silver"
                      icon="check-circle"
                    />
                  </View>
                </View>

                <View style={[
                  styles.goldCard,
                  {
                    backgroundColor: isDark ? "#211806" : "#fffbeb",
                    borderColor: isDark ? "#d9770640" : "#fbbf2440",
                  }
                ]}>
                  <View style={styles.rankCardHeader}>
                    <View style={[
                      styles.goldIconContainer,
                      {
                        backgroundColor: isDark ? "#78350f50" : "#fef3c7",
                        borderColor: isDark ? "#f59e0b30" : "#fbbf2430",
                      }
                    ]}>
                      <MaterialCommunityIcons
                        name="trophy"
                        size={22}
                        color="#fbbf24"
                      />
                    </View>
                    <View>
                      <ThemedText style={[
                        styles.goldTitle,
                        { color: isDark ? "#fcd34d" : "#b45309" }
                      ]}>ゴールド</ThemedText>
                      <ThemedText style={[
                        styles.goldSubtitle,
                        { color: isDark ? "#f59e0b80" : "#d97706" }
                      ]}>
                        生徒数目安: 6-9人
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[
                    styles.goldConditionsBox,
                    {
                      backgroundColor: isDark ? "#78350f40" : "#fef3c750",
                      borderColor: isDark ? "#92400e30" : "#fbbf2430",
                    }
                  ]}>
                    <ThemedText style={[
                      styles.goldConditionLabel,
                      { color: isDark ? "#b45309" : "#d97706" }
                    ]}>
                      昇格条件
                    </ThemedText>
                    <RankCondition text="平均評価 4.0以上" rank="gold" />
                    <RankCondition text="登録料: ¥1,000" rank="gold" />
                  </View>
                  <View style={styles.rankBenefitsSection}>
                    <ThemedText style={[
                      styles.goldSectionLabel,
                      { color: isDark ? "#b45309" : "#d97706" }
                    ]}>
                      特典
                    </ThemedText>
                    <RankBenefit
                      text="ゴールドバッジ +「人気教師」タグ"
                      rank="gold"
                      icon="check-circle"
                    />
                    <RankBenefit
                      text="マッチング 1.5倍 優先"
                      rank="gold"
                      icon="check-circle"
                    />
                    <RankBenefit
                      text="詳細分析レポート"
                      rank="gold"
                      icon="check-circle"
                    />
                    <RankBenefit
                      text="キャンセル時50%保証 / メール12h対応"
                      rank="gold"
                      icon="shield-check"
                    />
                  </View>
                </View>

                <View style={[
                  styles.platinumCard,
                  {
                    backgroundColor: isDark ? "#100e2e" : "#f5f3ff",
                    borderColor: isDark ? "#6366f140" : "#a5b4fc40",
                  }
                ]}>
                  <View style={styles.rankCardHeader}>
                    <View style={[
                      styles.platinumIconContainer,
                      {
                        backgroundColor: isDark ? "#312e8150" : "#e0e7ff",
                        borderColor: isDark ? "#818cf830" : "#a5b4fc30",
                      }
                    ]}>
                      <MaterialCommunityIcons
                        name="diamond-stone"
                        size={22}
                        color="#a5b4fc"
                      />
                    </View>
                    <View>
                      <ThemedText style={[
                        styles.platinumTitle,
                        { color: isDark ? "#c7d2fe" : "#4338ca" }
                      ]}>
                        プラチナ
                      </ThemedText>
                      <ThemedText style={[
                        styles.platinumSubtitle,
                        { color: isDark ? "#818cf8" : "#6366f1" }
                      ]}>
                        生徒数目安: 10人以上
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[
                    styles.platinumConditionsBox,
                    {
                      backgroundColor: isDark ? "#1e1b4b50" : "#e0e7ff50",
                      borderColor: isDark ? "#3730a330" : "#a5b4fc30",
                    }
                  ]}>
                    <ThemedText style={[
                      styles.platinumConditionLabel,
                      { color: isDark ? "#818cf8" : "#6366f1" }
                    ]}>
                      昇格条件
                    </ThemedText>
                    <RankCondition text="平均評価 4.5以上" rank="platinum" />
                    <RankCondition text="登録料完全無料" rank="platinum" />
                  </View>
                  <View style={styles.rankBenefitsSection}>
                    <ThemedText style={[
                      styles.platinumSectionLabel,
                      { color: isDark ? "#818cf8" : "#6366f1" }
                    ]}>
                      特典
                    </ThemedText>
                    <RankBenefit
                      text="プラチナバッジ +「トップ教師」タグ"
                      rank="platinum"
                      icon="check-decagram"
                    />
                    <RankBenefit
                      text="マッチング 最優先（2倍）"
                      rank="platinum"
                      icon="rocket-launch"
                    />
                    <RankBenefit
                      text="リアルタイムダッシュボード"
                      rank="platinum"
                      icon="chart-line"
                    />
                    <RankBenefit
                      text="キャンセル時80%保証 / メール6h対応"
                      rank="platinum"
                      icon="shield-lock"
                    />
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </View>
            </ScrollView>

            <View style={[
              styles.rankModalFooter,
              {
                backgroundColor: theme.backgroundDefault,
                borderTopColor: theme.border,
              }
            ]}>
              <Pressable
                style={({ pressed }) => [
                  styles.closeRankButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.9 : 1
                  },
                ]}
                onPress={() => setShowRankModal(false)}
              >
                <ThemedText style={styles.closeRankButtonText}>
                  閉じる
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: theme.backgroundRoot }]}
    >
      <ScreenScrollView contentContainerStyle={styles.container}>
        <Pressable
          style={({ pressed }) => [
            styles.profileCard,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => navigation.navigate("ProfileEdit")}
        >
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: theme.primary + "1A" },
              ]}
            >
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={32} color={theme.primary} />
              )}
            </View>
            <View
              style={[styles.editBadge, { backgroundColor: theme.primary }]}
            >
              <Feather name="edit-2" size={10} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>
              {user?.name || "ゲスト"}
            </ThemedText>
            <ThemedText
              style={[styles.profileSubtext, { color: theme.textSecondary }]}
            >
              プロフィールを編集
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        {isStudent && (
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <MenuItem
              icon="book-open"
              title="勉強可能なレッスン"
              badge={
                user?.totalLessons !== undefined
                  ? `残り${user.totalLessons}回`
                  : "未設定"
              }
              badgeColor={theme.primary}
              onPress={() => navigation.navigate("PlanSelection")}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="heart"
              title="お気に入りの教師"
              onPress={() => navigation.navigate("FavoriteTeachers")}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="calendar"
              title="授業履歴"
              onPress={() => navigation.navigate("BookingHistory")}
            />
          </View>
        )}
{/* TODO : ランク機能を未実装 */}
{/* 
        {isTeacher && (
          <View style={styles.section}>
            <ThemedText
              style={[styles.sectionTitle, { color: theme.textSecondary }]}
            >
              現在のランク
            </ThemedText>
            <View
              style={[
                styles.rankCard,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View
                style={[
                  styles.rankIconContainer,
                  { backgroundColor: "#fef3c7" },
                ]}
              >
                <Feather name="award" size={24} color="#f59e0b" />
              </View>
              <View style={styles.rankInfo}>
                <ThemedText style={styles.rankTitle}>ゴールドランク</ThemedText>
                <ThemedText
                  style={[styles.rankSubtext, { color: theme.textSecondary }]}
                >
                  素晴らしい成果です！
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowRankModal(true)}>
                <ThemedText
                  style={[styles.detailLink, { color: theme.primary }]}
                >
                  詳細
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )} */}

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            設定
          </ThemedText>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            {isTeacher && (
              <>
                <MenuItem
                  icon="briefcase"
                  title="指導経歴"
                  subtitle={getSubjectsDisplayText()}
                  onPress={() => navigation.navigate("TeacherProfileEdit")}
                />
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />
                <MenuItem
                  icon="dollar-sign"
                  title="報酬管理"
                  onPress={() => navigation.navigate("RewardManagement")}
                />
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />
              </>
            )}
            {isStudent && (
              <>
                <MenuItem
                  icon="user"
                  title="生徒用プロフィール"
                  subtitle={getStudentGrade(user?.learningGoalText, "未設定")}
                  onPress={() => navigation.navigate("StudentProfileEdit")}
                />
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />
              </>
            )}
            {isStudent && (
              <>
                <MenuItem
                  icon="credit-card"
                  title="プランを購入"
                  onPress={() => navigation.navigate("PlanSelection")}
                />
                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />
              </>
            )}
            <ThemeToggle />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionTitle, { color: theme.textSecondary }]}
          >
            その他
          </ThemedText>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <MenuItem
              icon="help-circle"
              title="よくある質問"
              onPress={() => navigation.navigate("FAQ")}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="mail"
              title="お問い合わせ"
              onPress={() => navigation.navigate("HelpSupport")}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="file-text"
              title="利用規約"
              onPress={() => navigation.navigate("TermsOfService")}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem
              icon="shield"
              title="プライバシーポリシー"
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => setShowLogoutModal(true)}
        >
          <Feather name="log-out" size={20} color="#ef4444" />
          <ThemedText style={styles.logoutText}>ログアウト</ThemedText>
        </Pressable>
        <View style={{ height: 100 }} />
      </ScreenScrollView>

      <LogoutConfirmModal />
      <RankModal />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing["2xl"],
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileSubtext: {
    fontSize: 13,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  rankCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  rankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  rankInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  rankTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  rankSubtext: {
    fontSize: 13,
  },
  detailLink: {
    fontSize: 14,
    fontWeight: "500",
  },
  menuCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  menuIcon: {
    marginRight: Spacing.lg,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
  },
  menuItemSubtext: {
    fontSize: 13,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    marginRight: Spacing.sm,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 20 + Spacing.lg,
  },
  themeToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 9999,
    gap: 2,
  },
  themeButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing["2xl"],
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xl,
  },
  logoutIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xl,
  },
  logoutConfirmButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    paddingVertical: Spacing.lg,
    borderRadius: 9999,
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  logoutConfirmText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: 9999,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "500",
  },
  rankModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  rankModalContainer: {
    height: SCREEN_HEIGHT * 0.92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  rankModalHeader: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  rankModalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    marginBottom: Spacing.lg,
  },
  rankModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  rankModalSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  rankModalScroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  rankCardsContainer: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  rankCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  bronzeCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  bronzeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  bronzeTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  bronzeSubtitle: {
    fontSize: 11,
  },
  bronzeSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  silverCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  silverIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  silverTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  silverSubtitle: {
    fontSize: 11,
  },
  silverConditionsBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  silverConditionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  silverSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  goldCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  goldIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  goldTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  goldSubtitle: {
    fontSize: 11,
  },
  goldConditionsBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  goldConditionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  goldSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  platinumCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  platinumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  platinumTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  platinumSubtitle: {
    fontSize: 11,
  },
  platinumConditionsBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  platinumConditionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  platinumSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  rankBenefitsSection: {
    marginTop: 4,
  },
  rankBenefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  rankBenefitText: {
    fontSize: 14,
    flex: 1,
  },
  rankConditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  rankConditionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  rankConditionText: {
    fontSize: 12,
  },
  rankModalFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  closeRankButton: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  closeRankButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
