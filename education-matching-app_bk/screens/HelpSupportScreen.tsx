import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { ScreenKeyboardAwareScrollView } from '@/components/ScreenKeyboardAwareScrollView';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { apiService } from '@/services/api';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function HelpSupportScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('入力エラー', '全ての項目を入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.submitInquiry({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (response.success) {
        Alert.alert('送信完了', 'お問い合わせを受け付けました。担当者より連絡いたします。');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        Alert.alert('送信エラー', response.error?.message || 'お問い合わせの送信に失敗しました。');
      }
    } catch (error) {
      Alert.alert('送信エラー', 'お問い合わせの送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <ScreenKeyboardAwareScrollView 
      style={{ backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={styles.content}
    >
      <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
        ご質問やご意見がございましたら、こちらのフォームよりお気軽にお問い合わせください。
      </ThemedText>

      <View style={styles.formSection}>
        <ThemedText style={styles.label}>お名前</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text
            }
          ]}
          placeholder="山田 太郎"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.formSection}>
        <ThemedText style={styles.label}>メールアドレス</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text
            }
          ]}
          placeholder="example@mail.com"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formSection}>
        <ThemedText style={styles.label}>お問い合わせ内容</ThemedText>
        <TextInput
          style={[
            styles.textArea,
            { 
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text
            }
          ]}
          placeholder="お問い合わせ内容をご入力ください"
          placeholderTextColor={theme.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <ThemedText style={[styles.privacyText, { color: theme.textSecondary }]}>
          送信することで、
          <ThemedText 
            style={[styles.privacyLink, { color: theme.primary }]}
            onPress={handlePrivacyPress}
          >
            プライバシーポリシー
          </ThemedText>
          に同意したことになります。
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { 
              backgroundColor: theme.primary,
              opacity: pressed || isSubmitting ? 0.9 : 1
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>送信する</ThemedText>
          )}
        </Pressable>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 140,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    paddingTop: Spacing.lg,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  privacyLink: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  submitButton: {
    height: 52,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
