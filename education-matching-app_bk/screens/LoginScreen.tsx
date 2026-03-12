import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStackParamList } from '@/navigation/AuthStackNavigator';
import { Spacing, BorderRadius } from '@/constants/theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { login, loginWithGoogle, loginWithFacebook, loginWithTwitter, loginWithInstagram, loginWithApple } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<'email' | 'google' | 'facebook' | 'twitter' | 'instagram' | 'apple' | null>(null);
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [isTogglingRole, setIsTogglingRole] = useState(false);
  
  // Animation values
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    
    setIsLoading(true);
    setLoadingMethod('email');
    try {
      const result = await login(email, password, role);
      if (!result.success) {
        Alert.alert('エラー', result.error || 'ログインに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setLoadingMethod('google');
    try {
      const result = await loginWithGoogle(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Googleログインに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Googleログインに失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setLoadingMethod('facebook');
    try {
      const result = await loginWithFacebook(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Facebookログインに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Facebookログインに失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleTwitterLogin = async () => {
    setIsLoading(true);
    setLoadingMethod('twitter');
    try {
      const result = await loginWithTwitter(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Twitterログインに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Twitterログインに失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleInstagramLogin = async () => {
    setIsLoading(true);
    setLoadingMethod('instagram');
    try {
      const result = await loginWithInstagram(role);
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Instagramログインに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Instagramログインに失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setLoadingMethod('apple');
    try {
      const result = await loginWithApple();
      if (!result.success) {
        Alert.alert('お知らせ', result.error || 'Appleサインインに失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'Appleサインインに失敗しました');
    } finally {
      setIsLoading(false);
      setLoadingMethod(null);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { userRole: role });
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
          <ThemedText style={styles.title}>{role === 'teacher' ? '教師ログイン' : 'ログイン'}</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            アカウントにアクセスしましょう
          </ThemedText>
        </View>

        <View style={styles.formSection}>
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
      </View>

      <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
        <ThemedText style={[styles.forgotPasswordText, { color: theme.primary }]}>
          パスワードをお忘れの場合
        </ThemedText>
      </Pressable>

      <View style={styles.actionSection}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 }
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {loadingMethod === 'email' ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>ログイン</ThemedText>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { borderColor: theme.border }]} />
          <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>または</ThemedText>
          <View style={[styles.dividerLine, { borderColor: theme.border }]} />
        </View>

        <View style={styles.snsSection}>
          <ThemedText style={[styles.snsTitle, { color: theme.text }]}>SNSでログイン</ThemedText>
          <View style={styles.snsButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.snsButton,
                { 
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.7 : 1
                }
              ]}
              onPress={handleGoogleLogin}
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
              onPress={handleFacebookLogin}
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
              onPress={handleInstagramLogin}
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
              onPress={handleTwitterLogin}
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
          アカウントをお持ちでないですか？{' '}
        </ThemedText>
        <Pressable onPress={() => navigation.navigate('Register', { userRole: role })}>
          <ThemedText style={[styles.footerLink, { color: theme.primary }]}>新規登録</ThemedText>
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
          {role === 'student' ? '教師としてログイン' : '生徒としてログイン'}
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
    gap: Spacing['2xl'],
    marginBottom: Spacing.lg,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
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
