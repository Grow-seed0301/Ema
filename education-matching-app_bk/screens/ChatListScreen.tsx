import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { SubjectDisplay } from "@/components/SubjectDisplay";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import { apiService } from "@/services/api";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface ChatItem {
  id: string;
  participantId: string;
  name: string;
  avatarUrl?: string | null;
  avatarColor?: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  subjects: { label: string; color: string }[];
}

export default function ChatListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [searchText, setSearchText] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getChats();

      if (response.success && response.data) {
        const formattedChats = response.data.map((chat) => ({
          id: chat.id,
          participantId: chat.participantId,
          name: chat.participantName,
          avatarUrl: chat.participantAvatar,
          avatarColor: chat.participantAvatarColor,
          lastMessage: chat.lastMessage,
          time: chat.timeAgo,
          unreadCount: chat.unreadCount,
          subjects: chat.subjects || [],
        }));
        setChats(formattedChats);
      } else {
        setError(response.error?.message || "チャットの読み込みに失敗しました");
      }
    } catch (err) {
      console.error("Error loading chats:", err);
      setError("チャットの読み込み中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  const filteredChats = searchText.trim()
    ? chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchText.toLowerCase()),
      )
    : chats;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.backgroundTertiary,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="検索"
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      <ScreenScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              {error}
            </ThemedText>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={loadChats}
            >
              <ThemedText style={styles.retryButtonText}>再読み込み</ThemedText>
            </Pressable>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.centerContainer}>
            <Feather
              name="message-circle"
              size={64}
              color={theme.textSecondary}
            />
            <ThemedText
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              {searchText.trim()
                ? "該当するチャットが見つかりません"
                : "チャットがありません"}
            </ThemedText>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <Pressable
              key={chat.id}
              style={({ pressed }) => [
                styles.chatItem,
                {
                  backgroundColor: pressed
                    ? theme.backgroundTertiary
                    : "transparent",
                },
              ]}
              onPress={() =>
                navigation.navigate("Chat", {
                  chatId: chat.id,
                  name: chat.name,
                  participantId: chat.participantId,
                })
              }
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: (chat.avatarColor || theme.primary) + "1A" },
                ]}
              >
                {chat.avatarUrl ? (
                  <Image
                    source={{ uri: chat.avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Feather name="user" size={24} color={chat.avatarColor || theme.primary} />
                )}
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <ThemedText style={styles.chatName}>{chat.name}</ThemedText>
                  <ThemedText
                    style={[styles.chatTime, { color: theme.textSecondary }]}
                  >
                    {chat.time}
                  </ThemedText>
                </View>
                <View style={styles.messageRow}>
                  <ThemedText
                    style={[
                      styles.lastMessage,
                      {
                        color: theme.textSecondary,
                        fontWeight: chat.unreadCount > 0 ? "600" : "400",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage}
                  </ThemedText>
                  {chat.unreadCount > 0 ? (
                    <View
                      style={[
                        styles.unreadBadge,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <ThemedText style={styles.unreadText}>
                        {chat.unreadCount}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                {chat.subjects.length > 0 && (
                  <SubjectDisplay
                    subjects={chat.subjects.map((s) => s.label)}
                  />
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 9999,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: 0,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  chatItem: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
  },
  chatTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 20,
  },
  subjectsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  subjectBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
