import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import apiService from "@/services/api";
import { useFocusEffect } from "@react-navigation/native";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface MonthlyEarnings {
  month: string;
  amount: number;
  height: number;
}

export default function RewardManagementScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [predictedEarnings, setPredictedEarnings] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRewardSummary = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getRewardSummary();

      if (response.data) {
        setAvailableBalance(response.data.availableBalance);
        setPredictedEarnings(response.data.predictedEarnings);
        setMonthlyData(response.data.monthlyData);
      }
    } catch (error) {
      console.error("Failed to fetch reward summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRewardSummary();
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          <ScreenScrollView contentContainerStyle={styles.content}>
            <View style={styles.balanceCard}>
              <View
                style={[
                  styles.balanceCardInner,
                  { backgroundColor: theme.primary },
                ]}
              >
                <View style={styles.balanceOverlay1} />
                <View style={styles.balanceOverlay2} />
                <View style={styles.balanceContent}>
                  <View style={styles.availableBadge}>
                    <ThemedText style={styles.availableBadgeText}>
                      Available Balance
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.balanceLabel}>
                    出金可能額
                  </ThemedText>
                  <ThemedText style={styles.balanceAmount}>
                    ¥{availableBalance.toLocaleString()}
                  </ThemedText>
                  <View style={styles.infoBox}>
                    <Feather
                      name="info"
                      size={12}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                    <ThemedText style={styles.infoText}>
                      振込申請は月1回まで可能です
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.chartHeader}>
                <View>
                  <ThemedText
                    style={[styles.chartLabel, { color: theme.textSecondary }]}
                  >
                    月ごとの収益推移
                  </ThemedText>
                  <View style={styles.chartTitleRow}>
                    <ThemedText style={styles.chartAmount}>
                      ¥{predictedEarnings.toLocaleString()}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.chartSubtext,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {" "}
                      今月の予測
                    </ThemedText>
                  </View>
                </View>
                <Feather
                  name="trending-up"
                  size={24}
                  color={theme.textSecondary}
                />
              </View>

              <View style={styles.chartContainer}>
                {monthlyData.map((data, index) => (
                  <View key={index} style={styles.chartBar}>
                    <View
                      style={[
                        styles.chartBarInner,
                        {
                          height: `${data.height}%`,
                          backgroundColor:
                            index === monthlyData.length - 1
                              ? theme.primary
                              : theme.border,
                        },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.chartMonth,
                        {
                          color:
                            index === monthlyData.length - 1
                              ? theme.primary
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {data.month}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>

            <Pressable
              style={styles.historyLink}
              onPress={() => navigation.navigate("RewardHistory")}
            >
              <ThemedText
                style={[styles.historyLinkText, { color: theme.primary }]}
              >
                報酬履歴確認
              </ThemedText>
              <Feather name="external-link" size={16} color={theme.primary} />
            </Pressable>

            <View style={{ height: 120 }} />
          </ScreenScrollView>

          <View
            style={[styles.footer, { backgroundColor: theme.backgroundRoot }]}
          >
            <Pressable
              style={[
                styles.transferButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => navigation.navigate("TransferRequest")}
            >
              <Feather name="dollar-sign" size={20} color="#ffffff" />
              <ThemedText style={styles.transferButtonText}>
                振込申請をする
              </ThemedText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  balanceCard: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  balanceCardInner: {
    borderRadius: BorderRadius["2xl"],
    padding: Spacing["2xl"],
    position: "relative",
    overflow: "hidden",
  },
  balanceOverlay1: {
    position: "absolute",
    right: -48,
    top: -48,
    width: 192,
    height: 192,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9999,
  },
  balanceOverlay2: {
    position: "absolute",
    left: -48,
    bottom: -48,
    width: 192,
    height: 192,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 9999,
  },
  balanceContent: {
    alignItems: "center",
  },
  availableBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: Spacing.md,
  },
  availableBadgeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
    lineHeight: 44,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 9999,
    marginTop: Spacing.lg,
  },
  infoText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
  },
  chartCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  chartLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  chartAmount: {
    fontSize: 20,
    fontWeight: "800",
  },
  chartSubtext: {
    fontSize: 12,
    fontWeight: "500",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 128,
    gap: 12,
    paddingHorizontal: 4,
  },
  chartBar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  chartBarInner: {
    width: "100%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartMonth: {
    fontSize: 10,
    fontWeight: "700",
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: Spacing["2xl"],
    padding: Spacing.md,
  },
  historyLinkText: {
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing["2xl"],
    paddingTop: Spacing.md,
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
  },
  transferButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
