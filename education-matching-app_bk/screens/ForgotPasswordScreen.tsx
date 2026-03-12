import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '@/navigation/AuthStackNavigator';
import { apiService } from '@/services/api';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type RouteProps = RouteProp<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  
  const userRole = route.params?.userRole || 'student';
  
  // Development-only warning for missing userRole
  if (__DEV__ && !route.params?.userRole) {
    console.warn('ForgotPasswordScreen: userRole was not provided in route params, defaulting to "student"');
  }
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }
    
    if (!validateEmail(email)) {
      Alert.alert('エラー', '有効なメールアドレスを入力してください');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiService.forgotPassword(email, userRole);
      
      if (response.success) {
        Alert.alert('成功', 'メールに認証コードを送信しました');
        navigation.navigate('VerifyCode', { email, userRole });
      } else {
        Alert.alert('エラー', response.error?.message || 'コードの送信に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenKeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconSection}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '1A' }]}>
            <MaterialCommunityIcons name="email-lock-outline" size={48} color={theme.primary} />
          </View>
        </View>

        <View style={styles.textSection}>
          <ThemedText style={styles.title}>
            {userRole === 'teacher' ? '教師' : '生徒'}アカウント - パスワードをお忘れですか？
          </ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            ご登録のメールアドレスを入力してください。6桁の認証コードをお送りします。
          </ThemedText>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>メールアドレス</ThemedText>
            <View style={[styles.inputContainer, { 
              borderColor: theme.border, 
              backgroundColor: theme.backgroundDefault 
            }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>

      <View style={[styles.footer, { 
        paddingBottom: insets.bottom + Spacing.md,
        backgroundColor: theme.backgroundRoot 
      }]}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { 
              backgroundColor: theme.primary, 
              opacity: pressed || isLoading ? 0.9 : 1 
            }
          ]}
          onPress={handleSendCode}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>認証コードを送信する</ThemedText>
          )}
        </Pressable>

        <Pressable 
          onPress={() => navigation.goBack()}
          style={styles.backLink}
        >
          <ThemedText style={[styles.backLinkText, { color: theme.primary }]}>
            ログイン画面に戻る
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: 180,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  formSection: {
    gap: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  inputContainer: {
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  primaryButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
