import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangeEmailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [currentEmail] = useState('current.user@example.com');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    setError('');
    
    if (!newEmail) {
      setError('新しいメールアドレスを入力してください');
      return;
    }
    
    if (!validateEmail(newEmail)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }
    
    if (!password) {
      setError('パスワードを入力してください');
      return;
    }
    
    Alert.alert('成功', 'メールアドレスが変更されました', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const clearNewEmail = () => {
    setNewEmail('');
    setError('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenKeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.description, { color: theme.text }]}>
          新しいメールアドレスを入力し、本人確認のためにパスワードを入力してください。
        </ThemedText>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>現在のメールアドレス</ThemedText>
            <View style={[styles.inputContainer, { 
              borderColor: theme.border, 
              backgroundColor: theme.backgroundDefault,
              opacity: 0.7
            }]}>
              <TextInput
                style={[styles.input, { color: theme.textSecondary }]}
                value={currentEmail}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>新しいメールアドレス</ThemedText>
            <View style={[styles.inputContainer, { 
              borderColor: theme.border, 
              backgroundColor: theme.backgroundDefault 
            }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="新しいメールアドレスを入力"
                placeholderTextColor={theme.textSecondary}
                value={newEmail}
                onChangeText={(text) => {
                  setNewEmail(text);
                  setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {newEmail.length > 0 && (
                <Pressable onPress={clearNewEmail} style={styles.iconButton}>
                  <Feather name="x" size={20} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>パスワード</ThemedText>
            <View style={[styles.inputContainer, { 
              borderColor: theme.border, 
              backgroundColor: theme.backgroundDefault 
            }]}>
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
                style={styles.iconButton}
              >
                <Feather 
                  name={showPassword ? 'eye' : 'eye-off'} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </Pressable>
            </View>
            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>

      <View style={[styles.footer, { 
        paddingBottom: insets.bottom + Spacing.md,
        backgroundColor: theme.backgroundRoot 
      }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 }
          ]}
          onPress={handleSave}
        >
          <ThemedText style={styles.saveButtonText}>変更を保存する</ThemedText>
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
    paddingTop: Spacing.lg,
    paddingBottom: 120,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.xl,
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
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: Spacing.xs,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  saveButton: {
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
