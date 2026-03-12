import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
type RouteProps = RouteProp<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  
  const email = route.params?.email;
  const code = route.params?.code;
  const userRole = route.params?.userRole || 'student';
  
  // Development-only warning for missing userRole
  if (__DEV__ && !route.params?.userRole) {
    console.warn('ResetPasswordScreen: userRole was not provided in route params, defaulting to "student"');
  }
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!newPassword) {
      Alert.alert('エラー', '新しいパスワードを入力してください');
      return;
    }
    
    if (newPassword.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上である必要があります');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }
    
    if (!email || !code) {
      Alert.alert('エラー', 'セッションが無効です');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiService.resetPassword(email, code, newPassword, userRole);
      
      if (response.success) {
        Alert.alert('成功', 'パスワードがリセットされました', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('エラー', response.error?.message || 'パスワードのリセットに失敗しました');
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
        <View style={styles.textSection}>
          <ThemedText style={styles.title}>
            {userRole === 'teacher' ? '教師' : '生徒'}アカウント - 新しいパスワードを設定
          </ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            新しいパスワードは8文字以上である必要があります。
          </ThemedText>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>新しいパスワード</ThemedText>
            <View style={[styles.inputContainer, { 
              borderColor: theme.border, 
              backgroundColor: theme.backgroundDefault 
            }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="パスワードを入力"
                placeholderTextColor={theme.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable 
                onPress={() => setShowNewPassword(!showNewPassword)} 
                style={styles.iconButton}
              >
                <Feather 
                  name={showNewPassword ? 'eye' : 'eye-off'} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>新しいパスワードの確認</ThemedText>
            <View style={[styles.inputContainer, { 
              borderColor: theme.border, 
              backgroundColor: theme.backgroundDefault 
            }]}>
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
                style={styles.iconButton}
              >
                <Feather 
                  name={showConfirmPassword ? 'eye' : 'eye-off'} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </Pressable>
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
          onPress={handleReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>パスワードをリセット</ThemedText>
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
    paddingTop: Spacing['2xl'],
    paddingBottom: 120,
  },
  textSection: {
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
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
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
});
