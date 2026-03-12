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
import { ACCOUNT_TYPES, BANK_ACCOUNT_VALIDATION } from "@/constants/rewards";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import apiService from "@/services/api";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type AccountType = typeof ACCOUNT_TYPES.ORDINARY | typeof ACCOUNT_TYPES.CURRENT;

interface BankAccountInfo {
  bankName: string;
  branchName: string;
  branchCode: string;
  accountType: AccountType;
  accountNumber: string;
  accountHolder: string;
}

export default function BankAccountEditScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [bankInfo, setBankInfo] = useState<BankAccountInfo>({
    bankName: "",
    branchName: "",
    branchCode: "",
    accountType: ACCOUNT_TYPES.ORDINARY,
    accountNumber: "",
    accountHolder: "",
  });

  useEffect(() => {
    fetchBankAccountInfo();
  }, []);

  const fetchBankAccountInfo = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getBankAccount();
      if (response.data) {
        setBankInfo({
          bankName: response.data.bankName || "",
          branchName: response.data.branchName || "",
          branchCode: response.data.branchCode || "",
          accountType: response.data.accountType || ACCOUNT_TYPES.ORDINARY,
          accountNumber: response.data.accountNumber || "",
          accountHolder: response.data.accountHolder || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch bank account info:", error);
      Alert.alert("エラー", "口座情報の取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (
      !bankInfo.bankName ||
      !bankInfo.branchName ||
      !bankInfo.branchCode ||
      !bankInfo.accountNumber ||
      !bankInfo.accountHolder
    ) {
      Alert.alert("エラー", "すべての項目を入力してください。");
      return;
    }

    if (
      !BANK_ACCOUNT_VALIDATION.ACCOUNT_NUMBER_PATTERN.test(
        bankInfo.accountNumber,
      )
    ) {
      Alert.alert(
        "エラー",
        `口座番号は${BANK_ACCOUNT_VALIDATION.ACCOUNT_NUMBER_LENGTH}桁で入力してください。`,
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiService.updateBankAccount(bankInfo);
      if (response.success) {
        Alert.alert("成功", "口座情報を保存しました。");
        navigation.goBack();
      } else {
        Alert.alert(
          "エラー",
          response.error?.message || "保存に失敗しました。",
        );
      }
    } catch (error) {
      console.error("Failed to save bank account info:", error);
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScreenScrollView contentContainerStyle={styles.content}>
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                銀行名
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="例：三菱UFJ銀行"
                placeholderTextColor={theme.textSecondary}
                value={bankInfo.bankName}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, bankName: text })
                }
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  支店名
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="例：渋谷支店"
                  placeholderTextColor={theme.textSecondary}
                  value={bankInfo.branchName}
                  onChangeText={(text) =>
                    setBankInfo({ ...bankInfo, branchName: text })
                  }
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  支店番号
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputCenter,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="123"
                  placeholderTextColor={theme.textSecondary}
                  value={bankInfo.branchCode}
                  onChangeText={(text) =>
                    setBankInfo({ ...bankInfo, branchCode: text })
                  }
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                口座種別
              </ThemedText>
              <View style={styles.radioGroup}>
                <Pressable
                  style={[
                    styles.radioButton,
                    bankInfo.accountType === ACCOUNT_TYPES.ORDINARY
                      ? {
                          backgroundColor: theme.primary + "0D",
                          borderColor: theme.primary,
                          borderWidth: 2,
                        }
                      : {
                          backgroundColor: theme.backgroundDefault,
                          borderColor: theme.border,
                          borderWidth: 2,
                        },
                  ]}
                  onPress={() =>
                    setBankInfo({
                      ...bankInfo,
                      accountType: ACCOUNT_TYPES.ORDINARY,
                    })
                  }
                >
                  <ThemedText
                    style={[
                      styles.radioText,
                      {
                        color:
                          bankInfo.accountType === ACCOUNT_TYPES.ORDINARY
                            ? theme.primary
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    普通
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.radioButton,
                    bankInfo.accountType === ACCOUNT_TYPES.CURRENT
                      ? {
                          backgroundColor: theme.primary + "0D",
                          borderColor: theme.primary,
                          borderWidth: 2,
                        }
                      : {
                          backgroundColor: theme.backgroundDefault,
                          borderColor: theme.border,
                          borderWidth: 2,
                        },
                  ]}
                  onPress={() =>
                    setBankInfo({
                      ...bankInfo,
                      accountType: ACCOUNT_TYPES.CURRENT,
                    })
                  }
                >
                  <ThemedText
                    style={[
                      styles.radioText,
                      {
                        color:
                          bankInfo.accountType === ACCOUNT_TYPES.CURRENT
                            ? theme.primary
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    当座
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                口座番号
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="7桁の数字を入力"
                placeholderTextColor={theme.textSecondary}
                value={bankInfo.accountNumber}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, accountNumber: text })
                }
                keyboardType="number-pad"
                maxLength={7}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                口座名義（カナ）
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="例：タナカ タロウ"
                placeholderTextColor={theme.textSecondary}
                value={bankInfo.accountHolder}
                onChangeText={(text) =>
                  setBankInfo({ ...bankInfo, accountHolder: text })
                }
              />
              <View style={styles.helperBox}>
                <Feather name="info" size={12} color={theme.textSecondary} />
                <ThemedText
                  style={[styles.helperText, { color: theme.textSecondary }]}
                >
                  全角カタカナで入力してください。
                </ThemedText>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.securityBox,
              { backgroundColor: theme.backgroundTertiary },
            ]}
          >
            <Feather
              name="shield"
              size={20}
              color={theme.textSecondary}
              style={styles.securityIcon}
            />
            <View style={styles.securityContent}>
              <ThemedText
                style={[styles.securityTitle, { color: theme.textSecondary }]}
              >
                セキュリティ
              </ThemedText>
              <ThemedText
                style={[styles.securityText, { color: theme.textSecondary }]}
              >
                入力された口座情報は暗号化され、安全に管理されます。報酬の振込以外の目的で使用されることはありません。
              </ThemedText>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScreenScrollView>
      )}

      <View style={[styles.footer, { backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Feather name="save" size={20} color="#ffffff" />
          <ThemedText style={styles.saveButtonText}>
            変更内容を保存する
          </ThemedText>
        </Pressable>
      </View>
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  formSection: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  inputCenter: {
    textAlign: "center",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "700",
  },
  helperBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  helperText: {
    fontSize: 10,
  },
  securityBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius["2xl"],
    marginTop: Spacing.lg,
    gap: 12,
  },
  securityIcon: {
    flexShrink: 0,
  },
  securityContent: {
    flex: 1,
    gap: 4,
  },
  securityTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  securityText: {
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
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
