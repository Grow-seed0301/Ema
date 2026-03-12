import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { SUBSCRIPTION_STATUS } from "@/constants/subscription";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import { apiService } from "@/services/api";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "@/contexts/AuthContext";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  lessonsPerMonth: number;
  features: string[];
  isRecommended: boolean;
}

interface OptionItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
  features: string[];
}

interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  price: number;
  remainingLessons: number;
  totalLessons: number;
  startDate: string;
  expiryDate: string | null;
  status: string;
}

export default function PlanSelectionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { refreshUser, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"monthly" | "options">(
    "monthly",
  );
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [optionQuantity, setOptionQuantity] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [optionItems, setOptionItems] = useState<OptionItem[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchAdditionalOptions();
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const response = await apiService.getCurrentSubscription();
      if (response.success && response.data) {
        setCurrentSubscription(response.data);
      }
    } catch (err) {
      console.error("Error fetching current subscription:", err);
      // Don't show error for subscription fetch as it's not critical
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getPlans();

      if (response.success && response.data) {
        setPlans(response.data);
        // Set default selected plan to the first plan or recommended plan
        const recommendedPlan = response.data.find((p) => p.isRecommended);
        if (recommendedPlan) {
          setSelectedPlan(recommendedPlan.id);
        } else if (response.data.length > 0) {
          setSelectedPlan(response.data[0].id);
        }
      } else {
        setError(response.error?.message || "プランの読み込みに失敗しました");
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError("プランの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalOptions = async () => {
    try {
      const response = await apiService.getAdditionalOptions();
      
      if (response.success && response.data) {
        setOptionItems(response.data);
        return;
      }
      // If response is not successful, log the error and fall through to set empty array
      console.error("Failed to fetch additional options:", response.error);
    } catch (err) {
      console.error("Error fetching additional options:", err);
    }
    // Set empty array to allow the UI to show "no options available" message
    setOptionItems([]);
  };

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const selectedOptionData = optionItems.find((o) => o.id === selectedOption);

  const getTotalPrice = () => {
    if (selectedTab === "monthly") {
      return selectedPlanData?.price || 0;
    } else {
      return selectedOptionData ? selectedOptionData.price * optionQuantity : 0;
    }
  };

  const handleCheckout = async () => {
    if (selectedTab === "monthly" && !selectedPlan) {
      Alert.alert("エラー", "プランを選択してください");
      return;
    }

    if (selectedTab === "options" && !selectedOption) {
      Alert.alert("エラー", "オプションを選択してください");
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Create Stripe Checkout session
      // Use selectedOption for options tab, selectedPlan for monthly tab
      const planId = selectedTab === "options" ? selectedOption! : selectedPlan;
      const quantity = selectedTab === "options" ? optionQuantity : 1;
      const response = await apiService.createCheckoutSession(planId, quantity);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "チェックアウトセッションの作成に失敗しました");
      }

      const { url, sessionId } = response.data;
      setCurrentSessionId(sessionId);

      // Open Stripe Checkout in browser
      const result = await WebBrowser.openBrowserAsync(url);

      // After browser closes, show verification modal
      setShowVerifyModal(true);
    } catch (error: any) {
      console.error("Checkout error:", error);
      Alert.alert(
        "エラー",
        error.message || "決済の処理中にエラーが発生しました"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleManualVerify = async () => {
    if (!currentSessionId) {
      Alert.alert("エラー", "セッションIDが見つかりません");
      return;
    }

    try {
      setVerifying(true);

      const response = await apiService.verifyPayment(currentSessionId);

      if (!response.success) {
        throw new Error(response.error?.message || "支払いの確認に失敗しました");
      }

      if (response.data?.payment.status === "completed") {
        // Refresh user data to update totalLessons in UI
        await refreshUser();
        
        setShowVerifyModal(false);
        // Navigate to success screen
        navigation.navigate("PaymentComplete", { 
          sessionId: currentSessionId,
          planName: selectedPlanData?.name,
          amount: getTotalPrice(),
        });
      } else {
        Alert.alert(
          "お知らせ",
          "まだ支払いが完了していません。Stripeでの決済を完了してから再度お試しください。"
        );
      }
    } catch (error: any) {
      console.error("Verify error:", error);
      Alert.alert(
        "エラー",
        error.message || "支払いの確認中にエラーが発生しました"
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelVerify = () => {
    setShowVerifyModal(false);
    setCurrentSessionId(null);
  };

  const handleUnsubscribe = () => {
    if (!currentSubscription) return;

    Alert.alert(
      "サブスクリプションの解約",
      "本当にサブスクリプションを解約しますか？解約後も、残りの勉強可能なレッスンをすべて使い切るまでサービスをご利用いただけます。",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "解約する",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.unsubscribePlan(currentSubscription.id);
              if (response.success) {
                Alert.alert("成功", "サブスクリプションが解約されました");
                // Refresh subscription status
                await fetchCurrentSubscription();
              } else {
                Alert.alert(
                  "エラー",
                  response.error?.message || "解約に失敗しました"
                );
              }
            } catch (error: any) {
              console.error("Unsubscribe error:", error);
              Alert.alert("エラー", "解約中にエラーが発生しました");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.wrapper}>
      <ScreenScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
      >
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: theme.backgroundTertiary },
          ]}
        >
          <Pressable
            style={[
              styles.segmentButton,
              selectedTab === "monthly" && [
                styles.segmentButtonActive,
                { backgroundColor: theme.backgroundDefault },
              ],
            ]}
            onPress={() => setSelectedTab("monthly")}
          >
            <ThemedText
              style={[
                styles.segmentText,
                {
                  color:
                    selectedTab === "monthly"
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              月額プラン
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.segmentButton,
              selectedTab === "options" && [
                styles.segmentButtonActive,
                { backgroundColor: theme.backgroundDefault },
              ],
            ]}
            onPress={() => setSelectedTab("options")}
          >
            <ThemedText
              style={[
                styles.segmentText,
                {
                  color:
                    selectedTab === "options"
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              追加オプション
            </ThemedText>
          </Pressable>
        </View>

        {/* Current Subscription Display */}
        {currentSubscription && selectedTab === "monthly" && (
          <View
            style={[
              styles.currentSubscriptionCard,
              {
                backgroundColor: theme.backgroundTertiary,
                borderColor: theme.primary,
              },
            ]}
          >
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionBadge}>
                <Feather name="check-circle" size={16} color={theme.primary} />
                <ThemedText
                  style={[
                    styles.subscriptionBadgeText,
                    { color: theme.primary },
                  ]}
                >
                  現在のプラン
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.subscriptionPlanName}>
              {currentSubscription.planName}
            </ThemedText>
            <View style={styles.subscriptionDetailsRow}>
              <View style={styles.subscriptionDetail}>
                <ThemedText
                  style={[
                    styles.subscriptionDetailLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  有効期限
                </ThemedText>
                <ThemedText style={styles.subscriptionDetailValue}>
                  {new Date(currentSubscription.expiryDate).toLocaleDateString('ja-JP')}
                </ThemedText>
              </View>
            </View>
            {currentSubscription.status !== SUBSCRIPTION_STATUS.CANCELLED && (
              <Pressable
                style={[
                  styles.unsubscribeButton,
                  { borderColor: theme.error },
                ]}
                onPress={handleUnsubscribe}
              >
                <ThemedText
                  style={[styles.unsubscribeButtonText, { color: theme.error }]}
                >
                  解約する
                </ThemedText>
              </Pressable>
            )}
            {currentSubscription.status === SUBSCRIPTION_STATUS.CANCELLED && (
              <View style={[styles.cancelledBadge, { backgroundColor: theme.error + "1A" }]}>
                <ThemedText style={[styles.cancelledBadgeText, { color: theme.error }]}>
                  解約済み（残り{user?.totalLessons || 0}レッスン利用可能）
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {selectedTab === "monthly" ? (
          <View style={styles.plansContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText
                  style={[styles.loadingText, { color: theme.textSecondary }]}
                >
                  プランを読み込んでいます...
                </ThemedText>
              </View>
            ) : error ? (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <Feather name="alert-circle" size={48} color={theme.error} />
                <ThemedText style={[styles.errorText, { color: theme.text }]}>
                  {error}
                </ThemedText>
                <Pressable
                  style={[
                    styles.retryButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={fetchPlans}
                >
                  <ThemedText style={styles.retryButtonText}>再試行</ThemedText>
                </Pressable>
              </View>
            ) : plans.length === 0 ? (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText style={[styles.errorText, { color: theme.text }]}>
                  利用可能なプランがありません
                </ThemedText>
              </View>
            ) : (
              plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: theme.backgroundDefault,
                        borderColor: isSelected ? theme.primary : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                  >
                    <View style={styles.planHeader}>
                      <View style={styles.planTitleRow}>
                        <ThemedText style={styles.planName}>
                          {plan.name}
                        </ThemedText>
                        {plan.isRecommended ? (
                          <View
                            style={[
                              styles.popularBadge,
                              { backgroundColor: theme.primary + "1A" },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.popularText,
                                { color: theme.primary },
                              ]}
                            >
                              一番人気
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.priceRow}>
                        <ThemedText style={styles.price}>
                          {formatPrice(plan.price)}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.priceUnit,
                            { color: theme.textSecondary },
                          ]}
                        >
                          /月
                        </ThemedText>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: isSelected
                            ? theme.primary
                            : theme.border,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <View
                          style={[
                            styles.radioInner,
                            { backgroundColor: theme.primary },
                          ]}
                        />
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.featuresSection,
                        { borderTopColor: theme.border },
                      ]}
                    >
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Feather
                            name="check-circle"
                            size={16}
                            color={theme.primary}
                          />
                          <ThemedText
                            style={[
                              styles.featureText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {feature}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {optionItems.length === 0 ? (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <ThemedText
                  style={[styles.errorText, { color: theme.textSecondary }]}
                >
                  現在、追加オプションはありません
                </ThemedText>
              </View>
            ) : (
              optionItems.map((option) => {
              const isSelected = selectedOption === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() =>
                    setSelectedOption(isSelected ? null : option.id)
                  }
                >
                  <View style={styles.planHeader}>
                    <ThemedText style={styles.planName}>
                      {option.name}
                    </ThemedText>
                    <View style={styles.priceRow}>
                      <ThemedText style={styles.price}>
                        {formatPrice(option.price)}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.priceUnit,
                          { color: theme.textSecondary },
                        ]}
                      >
                        /{option.unit}
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected ? (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.featuresSection,
                      { borderTopColor: theme.border },
                    ]}
                  >
                    {option.features && option.features.length > 0 ? (
                      option.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Feather
                            name="check-circle"
                            size={16}
                            color={theme.primary}
                          />
                          <ThemedText
                            style={[
                              styles.featureText,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {feature}
                          </ThemedText>
                        </View>
                      ))
                    ) : (
                      <ThemedText
                        style={[
                          styles.optionDescription,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {option.description}
                      </ThemedText>
                    )}
                    {isSelected ? (
                      <View style={styles.quantityRow}>
                        <ThemedText style={styles.quantityLabel}>
                          数量
                        </ThemedText>
                        <View style={styles.quantityControls}>
                          <Pressable
                            style={[
                              styles.quantityButton,
                              { backgroundColor: theme.backgroundTertiary },
                            ]}
                            onPress={() =>
                              setOptionQuantity(Math.max(1, optionQuantity - 1))
                            }
                          >
                            <Feather
                              name="minus"
                              size={16}
                              color={theme.text}
                            />
                          </Pressable>
                          <ThemedText style={styles.quantityValue}>
                            {optionQuantity}
                          </ThemedText>
                          <Pressable
                            style={[
                              styles.quantityButton,
                              { backgroundColor: theme.backgroundTertiary },
                            ]}
                            onPress={() =>
                              setOptionQuantity(optionQuantity + 1)
                            }
                          >
                            <Feather name="plus" size={16} color={theme.text} />
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            }))}
          </View>
        )}
      </ScreenScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed || isProcessingPayment ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={handleCheckout}
          disabled={isProcessingPayment}
        >
          {isProcessingPayment ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              この内容で決済する
            </ThemedText>
          )}
        </Pressable>
      </View>

      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelVerify}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.modalIcon, { backgroundColor: theme.primary + "1A" }]}>
              <Feather name="credit-card" size={32} color={theme.primary} />
            </View>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>お支払いは完了しましたか？</ThemedText>
            <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Stripeでの決済が完了した場合は「確認する」を押してください。ポイントが反映されます。
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalCancelButton, { backgroundColor: theme.backgroundTertiary }]}
                onPress={handleCancelVerify}
                disabled={verifying}
              >
                <ThemedText style={[styles.modalCancelButtonText, { color: theme.textSecondary }]}>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmButton, { backgroundColor: theme.primary }, verifying ? styles.modalButtonDisabled : null]}
                onPress={handleManualVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.modalConfirmButtonText}>確認する</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  segmentButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  plansContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    position: "relative",
  },
  planHeader: {
    marginBottom: Spacing.md,
    paddingRight: 40,
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700",
  },
  popularBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  popularText: {
    fontSize: 12,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 40,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: "700",
  },
  radioOuter: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 24,
    height: 24,
    borderRadius: 9999,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
  featuresSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 13,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#137fec",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  modalIcon: {
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
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  currentSubscriptionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 3,
  },
  subscriptionHeader: {
    marginBottom: Spacing.sm,
  },
  subscriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  subscriptionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subscriptionPlanName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  subscriptionDetailsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  subscriptionDetail: {
    flex: 1,
  },
  subscriptionDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  subscriptionDetailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  unsubscribeButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  unsubscribeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cancelledBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  cancelledBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
