import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type RouteProps = RouteProp<AuthStackParamList, "EmailVerification">;

export default function EmailVerificationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();

  const email = route.params?.email || "your.email@example.com";
  const name = route.params?.name || "";
  const userRole = route.params?.userRole || "student";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.slice(-1);
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      Alert.alert("エラー", "6桁のコードを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.verifyOtp(email, fullCode, userRole);

      if (response.success) {
        // OTP verification successful - refresh user data to trigger navigation to onboarding
        await refreshUser();
        Alert.alert("成功", "メールアドレスが確認されました。プロフィールを設定しましょう！");
      } else {
        Alert.alert(
          "エラー",
          response.error?.message || "コードの検証に失敗しました"
        );
      }
    } catch (error) {
      Alert.alert("エラー", "ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await apiService.sendOtp(email, name, userRole);

      if (response.success) {
        Alert.alert("成功", "認証コードを再送信しました");
      } else {
        Alert.alert(
          "エラー",
          response.error?.message || "コードの再送信に失敗しました"
        );
      }
    } catch (error) {
      Alert.alert("エラー", "ネットワークエラーが発生しました");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.iconSection}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.primary + "1A" },
            ]}
          >
            <MaterialCommunityIcons
              name="email-check-outline"
              size={48}
              color={theme.primary}
            />
          </View>
        </View>

        <View style={styles.textSection}>
          <ThemedText style={styles.title}>
            {userRole === "teacher" ? "教師" : "生徒"}アカウント - メール認証
          </ThemedText>
          <ThemedText
            style={[styles.description, { color: theme.textSecondary }]}
          >
            {email} に送信された6桁のコードを入力してください。
          </ThemedText>
        </View>

        <View style={styles.codeSection}>
          <View style={styles.codeInputs}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  {
                    borderColor: digit ? theme.primary : theme.border,
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)
                }
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.resendSection}>
            <ThemedText
              style={[styles.resendText, { color: theme.textSecondary }]}
            >
              コードが届きませんか？{" "}
            </ThemedText>
            <Pressable
              onPress={handleResend}
              disabled={isResending}
              accessibilityState={{ disabled: isResending }}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText
                  style={[styles.resendLink, { color: theme.primary }]}
                >
                  再送信
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed || isLoading ? 0.9 : 1,
            },
          ]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>認証</ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
    paddingBottom: 120,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  textSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
  },
  codeSection: {
    alignItems: "center",
    gap: Spacing.xl,
  },
  codeInputs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  resendSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
