import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/navigation/AuthStackNavigator';
import { Spacing, BorderRadius } from '@/constants/theme';
import { apiService } from '@/services/api';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RegisterScreenRouteProp = RouteProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const route = useRoute<RegisterScreenRouteProp>();
  const { theme, isDark } = useTheme();
  const { register, loginWithGoogle, loginWithFacebook, loginWithTwitter, loginWithInstagram } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<'email' | 'google' | 'facebook' | 'twitter' | 'instagram' | null>(null);
  const [role, setRole] = useState<'teacher' | 'student'>(route.params?.userRole || 'student');
  const [isTogglingRole, setIsTogglingRole] = useState(false);
  
  // Animation values
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('エラー', 'すべてのフィールドを入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('エラー', '利用規約に同意してください');
      return;
    }
    
    setIsLoading(true);
    setLoadingMethod('email');
    try {
      // Step 1: Register the user
      const result = await register(name, email, password, role);
      if (!result.success) {
        Alert.alert('エラー', result.error || '登録に失敗しました');
        return;
      }

      // Step 2: Send OTP verification code
      const otpResult = await apiService.sendOtp(email, name, role);
      if (!otpResult.success) {
        Alert.alert('エラー', otpResult.error?.message || 'OTPの送信に失敗しました');
        return;
      }

      // Step 3: Navigate to email verification screen
      navigation.navigate('EmailVerification', {
        email,
        name,
        userRole: role,
      });
    } catch (error) {
      Alert.alert('エラー', '登録に失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setLoadingMethod('google');
    try {
      const result = await loginWithGoogle(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Googleで登録に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Googleで登録に失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleFacebookRegister = async () => {
    setIsLoading(true);
    setLoadingMethod('facebook');
    try {
      const result = await loginWithFacebook(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Facebookで登録に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Facebookで登録に失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleTwitterRegister = async () => {
    setIsLoading(true);
    setLoadingMethod('twitter');
    try {
      const result = await loginWithTwitter(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Twitterで登録に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Twitterで登録に失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleInstagramRegister = async () => {
    setIsLoading(true);
    setLoadingMethod('instagram');
    try {
      const result = await loginWithInstagram(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Instagramで登録に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Instagramで登録に失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const toggleRole = () => {
    if (isTogglingRole) return; // Prevent multiple simultaneous toggles
    
    setIsTogglingRole(true);
    const screenWidth = Dimensions.get('window').width;
    
    // Animate out to the left
    opacity.value = withTiming(0, { duration: 250 });
    translateX.value = withTiming(-screenWidth, { duration: 250 }, () => {
      // Reset position to right side and animate in using sequence
      translateX.value = withSequence(
        withTiming(screenWidth, { duration: 0 }),
        withTiming(0, { duration: 350 })
      );
      opacity.value = withTiming(1, { duration: 350 });
    });
    
    // Delay role change to sync with animation
    setTimeout(() => {
      setRole(role === 'student' ? 'teacher' : 'student');
      setIsTogglingRole(false);
    }, 250);
  };
  
  // Animated style for the form section
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <ScreenKeyboardAwareScrollView 
      contentContainerStyle={styles.container}
      style={{ backgroundColor: theme.backgroundRoot }}
    >
      <Animated.View style={animatedStyle}>
        <View style={styles.brandingSection}>
          <ThemedText style={styles.title}>{role === 'teacher' ? '教師新規登録' : '新規登録'}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            アカウントを作成しましょう
          </ThemedText>
        </View>

        <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>氏名</ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color={theme.iconInactive}
              style={styles.leftIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="氏名を入力"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>メールアドレス</ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <MaterialCommunityIcons
              name="email-outline"
              size={24}
              color={theme.iconInactive}
              style={styles.leftIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="メールアドレスを入力"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>パスワード</ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={24}
              color={theme.iconInactive}
              style={styles.leftIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="パスワードを入力"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.rightIcon}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>パスワード確認</ThemedText>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={24}
              color={theme.iconInactive}
              style={styles.leftIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="パスワードを再入力"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.rightIcon}
            >
              <MaterialCommunityIcons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        style={styles.termsContainer}
      >
        <View style={[styles.checkbox, { borderColor: theme.border }]}>
          {agreedToTerms ? (
            <MaterialCommunityIcons name="check" size={18} color={theme.primary} />
          ) : null}
        </View>
        <ThemedText style={[styles.termsText, { color: theme.textSecondary }]}>
          利用規約とプライバシーポリシーに同意します
        </ThemedText>
      </Pressable>

      <View style={styles.actionSection}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 }
          ]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {loadingMethod === 'email' ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>アカウントを作成</ThemedText>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { borderColor: theme.border }]} />
          <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>または</ThemedText>
          <View style={[styles.dividerLine, { borderColor: theme.border }]} />
        </View>

        <View style={styles.snsSection}>
          <ThemedText style={[styles.snsTitle, { color: theme.text }]}>SNSで登録</ThemedText>
          <View style={styles.snsButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.snsButton,
                { 
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
              onPress={handleGoogleRegister}
              disabled={isLoading}
            >
              {loadingMethod === 'google' ? (
                <ActivityIndicator size="small" color="#EA4335" />
              ) : (
                <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.snsButton,
                { 
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
              onPress={handleFacebookRegister}
              disabled={isLoading}
            >
              {loadingMethod === 'facebook' ? (
                <ActivityIndicator size="small" color="#1877F2" />
              ) : (
                <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.snsButton,
                { 
                  backgroundColor: theme.backgroundDefault,
                  opacity: 0.5 // Disabled opacity
                }
              ]}
              onPress={handleInstagramRegister}
              disabled={true} // Disable Instagram button
            >
              <MaterialCommunityIcons name="instagram" size={24} color="#E4405F" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.snsButton,
                { 
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
              onPress={handleTwitterRegister}
              disabled={isLoading}
            >
              {loadingMethod === 'twitter' ? (
                <ActivityIndicator size="small" color={isDark ? '#ffffff' : '#14171A'} />
              ) : (
                <MaterialCommunityIcons name="twitter" size={24} color={isDark ? '#ffffff' : '#14171A'} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
      </Animated.View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          既にアカウントをお持ちですか？{' '}
        </ThemedText>
        <Pressable onPress={() => navigation.goBack()}>
          <ThemedText style={[styles.footerLink, { color: theme.primary }]}>ログイン</ThemedText>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.roleToggleButton,
          { 
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            opacity: pressed ? 0.8 : 1
          }
        ]}
        onPress={toggleRole}
      >
        <ThemedText style={[styles.roleToggleText, { color: theme.text }]}>
          {role === 'student' ? '教師として登録' : '生徒として登録'}
        </ThemedText>
      </Pressable>

      <View style={{ height: Spacing['2xl'] }} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
  },
  formSection: {
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginLeft: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: Spacing.md,
  },
  rightIcon: {
    paddingRight: Spacing.lg,
    paddingLeft: Spacing.md,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    flex: 1,
  },
  actionSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    borderTopWidth: 1,
  },
  dividerText: {
    fontSize: 14,
  },
  snsSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  snsTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  snsButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  snsButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  roleToggleButton: {
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleToggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
