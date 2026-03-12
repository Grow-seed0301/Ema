import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/RootNavigator';
import { apiService } from '@/services/api';
import { useChatImageUpload } from '@/hooks/useChatImageUpload';
import { useAuth } from '@/contexts/AuthContext';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'Chat'>;
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Message {
  id: string;
  text: string;
  time: string;
  isMe: boolean;
  isRead?: boolean;
  isImage?: boolean;
  imageUrl?: string | null;
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantAvatarUrl, setParticipantAvatarUrl] = useState<string | null>(null);
  const [participantAvatarColor, setParticipantAvatarColor] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { isUploading, uploadChatImage } = useChatImageUpload();

  const { chatId, participantId } = route.params;

  // Handle navigation to teacher detail
  const navigateToTeacherDetail = useCallback(() => {
    if (participantId) {
      navigation.navigate('TeacherDetail', { teacherId: participantId });
    }
  }, [navigation, participantId]);

  // Memoize the header title component to prevent unnecessary re-renders
  const headerTitle = useCallback(() => (
    <Pressable 
      onPress={navigateToTeacherDetail}
      accessibilityRole="button"
      accessibilityLabel={`${route.params.name}のプロフィールを表示`}
      disabled={!participantId}
    >
      <ThemedText style={headerStyles.title}>
        {route.params.name}
      </ThemedText>
    </Pressable>
  ), [navigateToTeacherDetail, route.params.name, participantId]);

  // Customize the header to make the title clickable
  useEffect(() => {
    navigation.setOptions({
      headerTitle,
    });
  }, [navigation, headerTitle]);

  const fetchParticipantAvatar = useCallback(async () => {
    if (!participantId) return;
    
    try {
      const response = await apiService.getTeacherDetails(participantId);
      if (response.success && response.data) {
        setParticipantAvatarUrl(response.data.avatarUrl);
        setParticipantAvatarColor(response.data.avatarColor);
      }
    } catch (error) {
      console.error('Error fetching participant avatar:', error);
    }
  }, [participantId]);

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  useEffect(() => {
    fetchParticipantAvatar();
  }, [fetchParticipantAvatar]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getChatMessages(chatId);
      
      if (response.success && response.data) {
        const formattedMessages = response.data.messages.map((msg) => ({
          id: msg.id,
          text: msg.text,
          time: msg.time,
          isMe: msg.isMe,
          isRead: msg.isRead,
          isImage: msg.isImage,
          imageUrl: msg.imageUrl,
        }));
        setMessages(formattedMessages);
        
        // Mark messages as read when entering the chat
        apiService.markMessagesAsRead(chatId).catch((err) => {
          console.error('Error marking messages as read:', err);
        });
      } else {
        setError(response.error?.message || 'メッセージの読み込みに失敗しました');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('メッセージの読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await apiService.sendMessage(chatId, messageText);
      
      if (response.success && response.data) {
        const newMessage: Message = {
          id: response.data.id,
          text: response.data.text,
          time: response.data.time,
          isMe: true,
          isRead: false,
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom after a short delay to ensure the message is rendered
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        // Restore the input text if sending failed
        setInputText(messageText);
        setError(response.error?.message || 'メッセージの送信に失敗しました');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setInputText(messageText);
      setError('メッセージの送信中にエラーが発生しました');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          '写真ライブラリへのアクセス権限が必要です。設定から権限を許可してください。',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('エラー', '画像の選択に失敗しました', [{ text: 'OK' }]);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          'カメラへのアクセス権限が必要です。設定から権限を許可してください。',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました', [{ text: 'OK' }]);
    }
  };

  const handleImageButtonPress = () => {
    Alert.alert('画像を送信', '画像の選択方法を選んでください', [
      { text: 'カメラで撮影', onPress: handleTakePhoto },
      { text: 'ライブラリから選択', onPress: handleImagePick },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleSendImage = async (imageUri: string) => {
    try {
      const messageId = await uploadChatImage(chatId, imageUri);
      if (messageId) {
        // Reload messages to show the new image message
        await loadMessages();
        
        // Scroll to bottom after a short delay
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending image:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isMe) {
      return (
        <View style={styles.myMessageContainer}>
          <View style={styles.myMessageContent}>
            {item.isImage && item.imageUrl ? (
              <View style={styles.myImageBubble}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.chatImage}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View style={[styles.myMessageBubble, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.myMessageText}>{item.text}</ThemedText>
              </View>
            )}
            <View style={styles.messageFooter}>
              {item.isRead ? (
                <ThemedText style={[styles.readIndicator, { color: theme.textSecondary }]}>
                  既読
                </ThemedText>
              ) : null}
              <ThemedText style={[styles.messageTime, { color: theme.textSecondary }]}>
                {item.time}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.myAvatar, { backgroundColor: theme.primary + '1A' }]}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.myAvatarImage}
                contentFit="cover"
              />
            ) : (
              <Feather name="user" size={16} color={theme.primary} />
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageContainer}>
        <View style={[styles.otherAvatar, { backgroundColor: (participantAvatarColor || theme.primary) + '1A' }]}>
          {participantAvatarUrl ? (
            <Image
              source={{ uri: participantAvatarUrl }}
              style={styles.otherAvatarImage}
              contentFit="cover"
            />
          ) : (
            <Feather name="user" size={16} color={participantAvatarColor || theme.primary} />
          )}
        </View>
        <View style={styles.otherMessageContent}>
          {item.isImage && item.imageUrl ? (
            <View style={styles.otherImageBubble}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.chatImage}
                contentFit="cover"
              />
            </View>
          ) : (
            <View style={[styles.otherMessageBubble, { backgroundColor: theme.backgroundDefault }]}>
              <ThemedText style={[styles.otherMessageText, { color: theme.text }]}>
                {item.text}
              </ThemedText>
            </View>
          )}
          <ThemedText style={[styles.messageTime, { color: theme.textSecondary }]}>
            {item.time}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderDateHeader = () => (
    <View style={styles.dateHeaderContainer}>
      <ThemedText style={[styles.dateHeader, { color: theme.textSecondary }]}>今日</ThemedText>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText style={[styles.errorText, { color: theme.danger }]}>
          {error}
        </ThemedText>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={loadMessages}
        >
          <ThemedText style={styles.retryButtonText}>再読み込み</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messagesList, { paddingBottom: Spacing.lg }]}
        ListHeaderComponent={messages.length > 0 ? renderDateHeader : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={64} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              まだメッセージがありません
            </ThemedText>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.backgroundDefault,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + Spacing.sm
        }
      ]}>
        <Pressable 
          style={styles.attachButton} 
          onPress={handleImageButtonPress}
          disabled={isUploading || sending}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Feather name="image" size={24} color={theme.textSecondary} />
          )}
        </Pressable>
        <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundTertiary }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="メッセージを入力"
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <Pressable style={styles.emojiButton}>
            <Feather name="smile" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>
        <Pressable 
          style={[
            styles.sendButton, 
            { 
              backgroundColor: theme.primary,
              opacity: (inputText.trim() && !sending) ? 1 : 0.5
            }
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Feather name="send" size={20} color="#ffffff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '500',
  },
  myMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  myMessageContent: {
    alignItems: 'flex-end',
    maxWidth: '70%',
  },
  myAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  myAvatarImage: {
    width: '100%',
    height: '100%',
  },
  myMessageBubble: {
    maxWidth: '100%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
  },
  myMessageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: 4,
  },
  readIndicator: {
    fontSize: 12,
  },
  messageTime: {
    fontSize: 12,
  },
  otherMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  otherAvatarImage: {
    width: '100%',
    height: '100%',
  },
  otherMessageContent: {
    maxWidth: '70%',
  },
  otherMessageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
  },
  otherMessageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  myImageBubble: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    maxWidth: 250,
  },
  otherImageBubble: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    maxWidth: 250,
  },
  chatImage: {
    width: 250,
    height: 250,
    borderRadius: BorderRadius.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 9999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    maxHeight: 100,
  },
  emojiButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const headerStyles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
