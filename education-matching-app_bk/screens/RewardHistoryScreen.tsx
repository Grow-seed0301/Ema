import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
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

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface RewardHistoryItem {
  id: string;
  date: string;
  studentName: string;
  lessonType: string;
  amount: number;
  status: string;
}

export default function RewardHistoryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [historyData, setHistoryData] = useState<RewardHistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    // Generate month list for the selector (last 6 months)
    const monthList: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, "0")}`;
      monthList.push(monthStr);
    }
    setMonths(monthList);
    setSelectedMonth(monthList[0]);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchHistoryData();
    }
  }, [selectedMonth]);

  const fetchHistoryData = async (page: number = 1) => {
    try {
      setIsLoading(true);
      const response = await apiService.getRewardHistory({
        month: selectedMonth,
        page,
        limit: 20,
      });

      if (response.data) {
        if (page === 1) {
          setHistoryData(response.data.items);
        } else {
          setHistoryData((prev) => [...prev, ...response.data.items]);
        }
        setMonthlyTotal(response.data.monthlyTotal);
        setHistoryCount(response.data.count);
        setHasMore(response.data.hasMore);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Failed to fetch reward history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchHistoryData(currentPage + 1);
    }
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const now = new Date();
    if (
      parseInt(year) === now.getFullYear() &&
      parseInt(month) === now.getMonth() + 1
    ) {
      return `${year}年${parseInt(month)}月`;
    }
    return `${parseInt(month)}月`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.monthSelector,
          { backgroundColor: theme.backgroundDefault },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthList}
        >
          {months.map((month, index) => (
            <Pressable
              key={month}
              style={[
                styles.monthButton,
                selectedMonth === month
                  ? { backgroundColor: theme.primary }
                  : {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                      borderWidth: 1,
                    },
              ]}
              onPress={() => setSelectedMonth(month)}
            >
              <ThemedText
                style={[
                  styles.monthButtonText,
                  {
                    color:
                      selectedMonth === month ? "#ffffff" : theme.textSecondary,
                  },
                ]}
              >
                {formatMonthDisplay(month)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScreenScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.summaryLeft}>
            <ThemedText
              style={[styles.summaryLabel, { color: theme.textSecondary }]}
            >
              {selectedMonth
                ? `${formatMonthDisplay(selectedMonth)}の合計獲得報酬`
                : "合計獲得報酬"}
            </ThemedText>
            <ThemedText style={styles.summaryAmount}>
              ¥{monthlyTotal.toLocaleString()}
            </ThemedText>
          </View>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: theme.primary + "1A" },
            ]}
          >
            <Feather name="bar-chart-2" size={24} color={theme.primary} />
          </View>
        </View>

        <View style={styles.listHeader}>
          <ThemedText style={styles.listTitle}>レッスン完了履歴</ThemedText>
          <View style={styles.listCount}>
            <ThemedText
              style={[styles.listCountText, { color: theme.textSecondary }]}
            >
              {historyCount}件
            </ThemedText>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : (
          <View style={styles.historyList}>
            {historyData.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.historyItem,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.historyLeft}>
                  <View style={styles.historyHeader}>
                    <ThemedText
                      style={[
                        styles.historyDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.date}
                    </ThemedText>
                    <View style={styles.statusBadge}>
                      <ThemedText style={styles.statusText}>
                        {item.status}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.studentName}>
                    {item.studentName}
                  </ThemedText>
                  <ThemedText
                    style={[styles.lessonType, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.lessonType}
                  </ThemedText>
                </View>
                <View style={styles.historyRight}>
                  <ThemedText style={styles.historyAmount}>
                    ¥{item.amount.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isLoading && historyData.length > 0 && hasMore && (
          <Pressable
            style={[
              styles.loadMoreButton,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
              },
            ]}
            onPress={handleLoadMore}
          >
            <Feather
              name="chevron-down"
              size={18}
              color={theme.textSecondary}
            />
            <ThemedText
              style={[styles.loadMoreText, { color: theme.textSecondary }]}
            >
              さらに読み込む
            </ThemedText>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthSelector: {
    paddingVertical: Spacing.md,
  },
  monthList: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  monthButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  summaryCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLeft: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: "800",
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  listCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listCountText: {
    fontSize: 12,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  historyList: {
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  historyItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyLeft: {
    flex: 1,
    gap: 2,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 10,
    fontWeight: "700",
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    color: "#15803d",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
  },
  lessonType: {
    fontSize: 12,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  loadMoreButton: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing["2xl"],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
