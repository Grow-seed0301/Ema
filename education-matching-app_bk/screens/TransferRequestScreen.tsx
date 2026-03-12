import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  ACCOUNT_TYPE_LABELS,
  TRANSFER_FEE,
  ESTIMATED_PROCESSING_DAYS,
} from "@/constants/rewards";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import apiService from "@/services/api";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface BankAccountInfo {
  bankName: string;
  branchName: string;
  branchCode: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
}

export default function TransferRequestScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [requestAmount, setRequestAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [bankInfo, setBankInfo] = useState<BankAccountInfo>({
    bankName: "",
    branchName: "",
    branchCode: "",
    accountType: "1",
    accountNumber: "",
    accountHolder: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch reward summary and bank account in parallel
      const [summaryResponse, bankResponse] = await Promise.all([
        apiService.getRewardSummary(),
        apiService.getBankAccount(),
      ]);

      if (summaryResponse.data) {
        setAvailableBalance(summaryResponse.data.availableBalance);
      }

      if (bankResponse.data) {
        setBankInfo({
          bankName: bankResponse.data.bankName || "",
          branchName: bankResponse.data.branchName || "",
          branchCode: bankResponse.data.branchCode || "",
          accountType: bankResponse.data.accountType || "1",
          accountNumber: bankResponse.data.accountNumber || "",
          accountHolder: bankResponse.data.accountHolder || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      Alert.alert("エラー", "データの取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestFullAmount = () => {
    setRequestAmount(availableBalance.toString());
  };

  const handleSubmit = async () => {
    const amount = parseInt(requestAmount);

    if (!requestAmount || isNaN(amount)) {
      Alert.alert("エラー", "申請金額を入力してください。");
      return;
    }

    if (amount <= 0) {
      Alert.alert("エラー", "申請金額は0円より大きい必要があります。");
      return;
    }

    if (amount > availableBalance) {
      Alert.alert("エラー", "申請金額が出金可能額を超えています。");
      return;
    }

    Alert.alert(
      "振込申請の確認",
      `¥${amount.toLocaleString()}を申請しますか？\n\n手数料¥${TRANSFER_FEE}が差し引かれます。\n実際の振込金額: ¥${(amount - TRANSFER_FEE).toLocaleString()}`,
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "申請する",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const response = await apiService.createTransferRequest({
                amount,
              });

              if (response.data?.success) {
                Alert.alert(
                  "成功",
                  `振込申請が完了しました。\n通常${response.data.estimatedProcessingDays}に振り込まれます。`,
                );
                navigation.goBack();
              } else {
                Alert.alert(
                  "エラー",
                  response.error?.message || "申請に失敗しました。",
                );
              }
            } catch (error) {
              console.error("Failed to submit transfer request:", error);
              Alert.alert("エラー", "申請に失敗しました。");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

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
                  <ThemedText style={styles.balanceBadge}>
                    Available Balance
                  </ThemedText>
                  <ThemedText style={styles.balanceLabel}>
                    出金可能額
                  </ThemedText>
                  <ThemedText style={styles.balanceAmount}>
                    ¥{availableBalance.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.amountCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText
                style={[styles.sectionLabel, { color: theme.textSecondary }]}
              >
                申請金額
              </ThemedText>
              <View
                style={[
                  styles.amountInput,
                  {
                    backgroundColor: theme.backgroundTertiary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.currencySymbol,
                    { color: theme.textSecondary },
                  ]}
                >
                  ¥
                </ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  value={requestAmount}
                  onChangeText={setRequestAmount}
                  keyboardType="number-pad"
                />
              </View>
              <Pressable
                style={[
                  styles.fullAmountButton,
                  {
                    backgroundColor: theme.primary + "0D",
                    borderColor: theme.primary + "33",
                  },
                ]}
                onPress={handleRequestFullAmount}
              >
                <Feather name="dollar-sign" size={18} color={theme.primary} />
                <ThemedText
                  style={[styles.fullAmountText, { color: theme.primary }]}
                >
                  全額申請する
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.bankSection}>
              <View style={styles.bankHeader}>
                <ThemedText style={styles.bankTitle}>振込先口座情報</ThemedText>
                <Pressable
                  onPress={() => navigation.navigate("BankAccountEdit")}
                >
                  <View style={styles.editButton}>
                    <ThemedText
                      style={[styles.editButtonText, { color: theme.primary }]}
                    >
                      変更
                    </ThemedText>
                    <Feather name="edit-2" size={12} color={theme.primary} />
                  </View>
                </Pressable>
              </View>
              <View
                style={[
                  styles.bankCard,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[styles.bankRow, { borderBottomColor: theme.border }]}
                >
                  <ThemedText
                    style={[styles.bankLabel, { color: theme.textSecondary }]}
                  >
                    銀行名
                  </ThemedText>
                  <ThemedText style={styles.bankValue}>
                    {bankInfo.bankName}
                  </ThemedText>
                </View>
                <View
                  style={[styles.bankRow, { borderBottomColor: theme.border }]}
                >
                  <ThemedText
                    style={[styles.bankLabel, { color: theme.textSecondary }]}
                  >
                    支店名
                  </ThemedText>
                  <ThemedText style={styles.bankValue}>
                    {bankInfo.branchName} ({bankInfo.branchCode})
                  </ThemedText>
                </View>
                <View
                  style={[styles.bankRow, { borderBottomColor: theme.border }]}
                >
                  <ThemedText
                    style={[styles.bankLabel, { color: theme.textSecondary }]}
                  >
                    口座種別
                  </ThemedText>
                  <ThemedText style={styles.bankValue}>
                    {ACCOUNT_TYPE_LABELS[
                      bankInfo.accountType as keyof typeof ACCOUNT_TYPE_LABELS
                    ] || bankInfo.accountType}
                  </ThemedText>
                </View>
                <View
                  style={[styles.bankRow, { borderBottomColor: theme.border }]}
                >
                  <ThemedText
                    style={[styles.bankLabel, { color: theme.textSecondary }]}
                  >
                    口座番号
                  </ThemedText>
                  <ThemedText style={styles.bankValue}>
                    {bankInfo.accountNumber}
                  </ThemedText>
                </View>
                <View style={styles.bankRow}>
                  <ThemedText
                    style={[styles.bankLabel, { color: theme.textSecondary }]}
                  >
                    名義
                  </ThemedText>
                  <ThemedText style={styles.bankValue}>
                    {bankInfo.accountHolder}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.noticeBox,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              <Feather
                name="info"
                size={20}
                color={theme.textSecondary}
                style={styles.noticeIcon}
              />
              <View style={styles.noticeContent}>
                <ThemedText
                  style={[styles.noticeTitle, { color: theme.textSecondary }]}
                >
                  注意事項
                </ThemedText>
                <View style={styles.noticeList}>
                  <ThemedText
                    style={[styles.noticeText, { color: theme.textSecondary }]}
                  >
                    ・振込手数料として一律{" "}
                    <ThemedText style={{ fontWeight: "700" }}>
                      ¥{TRANSFER_FEE}
                    </ThemedText>{" "}
                    が差し引かれます。
                  </ThemedText>
                  <ThemedText
                    style={[styles.noticeText, { color: theme.textSecondary }]}
                  >
                    ・申請後、通常{" "}
                    <ThemedText style={{ fontWeight: "700" }}>
                      {ESTIMATED_PROCESSING_DAYS}
                    </ThemedText>{" "}
                    に指定の口座へ振り込まれます。
                  </ThemedText>
                  <ThemedText
                    style={[styles.noticeText, { color: theme.textSecondary }]}
                  >
                    ・入力内容に誤りがある場合、組戻し手数料が発生することがあります。
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScreenScrollView>

          <View
            style={[styles.footer, { backgroundColor: theme.backgroundRoot }]}
          >
            <Pressable
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Feather name="check-circle" size={20} color="#ffffff" />
              <ThemedText style={styles.submitButtonText}>
                申請内容を確定する
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
    padding: Spacing.lg,
    position: "relative",
    overflow: "hidden",
  },
  balanceOverlay1: {
    position: "absolute",
    right: -32,
    top: -32,
    width: 128,
    height: 128,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9999,
  },
  balanceOverlay2: {
    position: "absolute",
    left: -32,
    bottom: -32,
    width: 128,
    height: 128,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 9999,
  },
  balanceContent: {
    alignItems: "center",
  },
  balanceBadge: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  balanceAmount: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 4,
    lineHeight: 44,
  },
  amountCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  fullAmountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  fullAmountText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bankSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  bankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bankCard: {
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    overflow: "hidden",
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  bankValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  noticeBox: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius["2xl"],
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: 12,
  },
  noticeIcon: {
    flexShrink: 0,
  },
  noticeContent: {
    flex: 1,
    gap: 8,
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noticeList: {
    gap: 6,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
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
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
