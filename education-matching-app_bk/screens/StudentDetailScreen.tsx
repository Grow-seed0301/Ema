import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import { apiService } from "@/services/api";
import { getLearningGoal } from "@/utils/learningGoalUtils";

const DEFAULT_AVATAR_COLOR = "#3B82F6";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface StudentData {
  id: string;
  name: string;
  email: string;
  nickname: string | null;
  phone: string | null;
  avatarUrl: string | null;
  avatarColor?: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  bio: string | null;
  learningGoal?: string | null;
  totalLessons?: number;
  plan?: {
    id: string;
    name: string;
    remainingLessons: number;
    totalLessons: number;
    expiryDate: string;
  };
  rank?: {
    level: string;
    points: number;
    nextLevelPoints: number;
  };
  isProfileComplete?: boolean;
  isLearningInfoComplete?: boolean;
}

export default function StudentDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<MainStackParamList, "StudentDetail">>();

  const studentId = route.params?.studentId;

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      Alert.alert("エラー", "生徒IDが指定されていません");
      return;
    }
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      const response = await apiService.getStudentDetails(studentId);
      if (response.success && response.data) {
        setStudentData(response.data);
      } else if (response.error) {
        Alert.alert(
          "エラー",
          response.error.message || "生徒情報の取得に失敗しました",
        );
      }
    } catch (error: any) {
      console.error("Failed to fetch student details:", error);
      Alert.alert("エラー", "生徒情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date of birth
  const formatDateOfBirth = (dateOfBirth: string | null): string | null => {
    if (!dateOfBirth) return null;
    try {
      const date = new Date(dateOfBirth);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
    } catch {
      return dateOfBirth;
    }
  };

  // Helper function to translate gender
  const formatGender = (gender: string | null): string | null => {
    if (!gender) return null;
    const genderMap: Record<string, string> = {
      male: "男性",
      female: "女性",
      other: "その他",
    };
    return genderMap[gender] || gender;
  };

  // Helper function to parse learning goal subjects
  const parseSubjects = (learningGoal: string | null): string[] => {
    if (!learningGoal) return [];
    try {
      const data = JSON.parse(learningGoal);
      return data.subjects || [];
    } catch {
      return [];
    }
  };

  const handleContactStudent = async () => {
    if (!studentData) return;

    try {
      // Get or create chat with the student
      const chatResponse = await apiService.getOrCreateChat(studentData.id);

      if (chatResponse.success && chatResponse.data) {
        // Navigate to chat with the actual chatId
        navigation.navigate("Chat", {
          chatId: chatResponse.data.id,
          name: studentData.name,
          participantId: studentData.id,
        });
      } else {
        // Error message is in response.error.message or response.message
        const errorMessage =
          chatResponse.error?.message || "チャットの作成に失敗しました";
        Alert.alert("エラー", errorMessage);
      }
    } catch (error: any) {
      console.error("Failed to create/get chat:", error);
      Alert.alert("エラー", "チャットの作成に失敗しました");
    }
  };

  // Parse subjects from learning goal using useMemo for performance
  const subjects = useMemo(
    () => parseSubjects(studentData?.learningGoal || null),
    [studentData?.learningGoal],
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.loadingText}>読み込み中...</ThemedText>
        </View>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText
            style={[styles.errorText, { color: theme.textSecondary }]}
          >
            生徒情報が見つかりません
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    studentData.avatarColor || DEFAULT_AVATAR_COLOR,
                  borderColor: theme.backgroundDefault,
                },
              ]}
            >
              {studentData.avatarUrl && !imageError ? (
                <Image
                  source={{ uri: studentData.avatarUrl }}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <ThemedText style={styles.avatarText}>
                  {studentData.name.charAt(0)}
                </ThemedText>
              )}
            </View>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText style={styles.studentName}>
              {studentData.name}
            </ThemedText>
            {studentData.nickname && (
              <ThemedText style={[styles.gradeText, { color: theme.primary }]}>
                {studentData.nickname}
              </ThemedText>
            )}
            {studentData.address && (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color={theme.textSecondary} />
                <ThemedText
                  style={[styles.locationText, { color: theme.textSecondary }]}
                >
                  {studentData.address}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Bio Section */}
        {studentData.bio && (
          <View
            style={[
              styles.section,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-search"
                size={22}
                color={theme.primary}
              />
              <ThemedText style={styles.sectionTitle}>自己紹介</ThemedText>
            </View>
            <ThemedText
              style={[styles.bioText, { color: theme.textSecondary }]}
            >
              {studentData.bio}
            </ThemedText>
          </View>
        )}

        {/* Profile Details Section */}
        <View
          style={[styles.section, { backgroundColor: theme.backgroundDefault }]}
        >
          <View
            style={[
              styles.sectionHeader,
              styles.sectionHeaderBorder,
              { borderBottomColor: theme.border },
            ]}
          >
            <Feather name="info" size={22} color={theme.primary} />
            <ThemedText style={styles.sectionTitle}>
              プロフィール詳細
            </ThemedText>
          </View>

          {studentData.dateOfBirth && (
            <View
              style={[styles.detailRow, { borderBottomColor: theme.border }]}
            >
              <ThemedText
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                生年月日
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDateOfBirth(studentData.dateOfBirth)}
              </ThemedText>
            </View>
          )}

          {studentData.gender && (
            <View style={styles.detailRow}>
              <ThemedText
                style={[styles.detailLabel, { color: theme.textSecondary }]}
              >
                性別
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatGender(studentData.gender)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Learning Content Section */}
        {studentData.learningGoal && (
          <View
            style={[
              styles.section,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={22}
                color={theme.primary}
              />
              <ThemedText style={styles.sectionTitle}>希望学習内容</ThemedText>
            </View>

            {/* Subjects */}
            {subjects.length > 0 && (
              <View style={styles.subsection}>
                <ThemedText
                  style={[
                    styles.subsectionLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  希望科目
                </ThemedText>
                <View style={styles.subjectTags}>
                  {subjects.map((subject, index) => (
                    <View
                      key={index}
                      style={[
                        styles.subjectTag,
                        { backgroundColor: `${theme.primary}15` },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.subjectTagText,
                          { color: theme.primary },
                        ]}
                      >
                        {subject}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Learning Goal Text */}
            <View style={styles.subsection}>
              <ThemedText
                style={[styles.subsectionLabel, { color: theme.textSecondary }]}
              >
                学習目標
              </ThemedText>
              <ThemedText style={styles.subsectionValue}>
                {getLearningGoal(studentData.learningGoal)}
              </ThemedText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer with Contact Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundDefault,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.contactButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={handleContactStudent}
        >
          <Feather name="message-circle" size={20} color="#ffffff" />
          <ThemedText style={styles.contactButtonText}>
            生徒に連絡する
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  profileInfo: {
    alignItems: "center",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.sm,
  },
  locationText: {
    fontSize: 14,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeaderBorder: {
    paddingBottom: Spacing.md,
    marginBottom: 0,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  subsection: {
    marginTop: Spacing.lg,
  },
  subsectionLabel: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
  },
  subsectionValue: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  subjectTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  subjectTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subjectTagText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  contactButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
