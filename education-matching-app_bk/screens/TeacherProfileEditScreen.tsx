import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { SubjectDisplay } from "@/components/SubjectDisplay";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import type { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";
import { CredentialForm } from "@/components/CredentialForm";

// Support navigation from both Main and Onboarding stacks
type NavigationProp = NativeStackNavigationProp<MainStackParamList> | NativeStackNavigationProp<OnboardingStackParamList>;

interface Credential {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  sortOrder: number;
}

export default function TeacherProfileEditScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { updateProfile, refreshUser } = useAuth();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<Record<string, string[]>>(
    {},
  );
  const [experience, setExperience] = useState("");
  // experienceYears is now stored as a separate field in the database
  const [experienceYears, setExperienceYears] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<
    Credential | undefined
  >(undefined);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const [profileResponse, credentialsResponse] = await Promise.all([
        apiService.getMe(),
        apiService.getTeacherCredentials(),
      ]);

      if (profileResponse.success && profileResponse.data) {
        // Load teacher-specific data from API
        const { subjects, subjectGroups, experience, experienceYears } =
          profileResponse.data;
        setSubjects(subjects ?? []);
        setSubjectGroups(subjectGroups ?? {});
        setExperience(experience ?? "");
        setExperienceYears(experienceYears ? String(experienceYears) : "");
      }

      if (credentialsResponse.success && credentialsResponse.data) {
        setCredentials(credentialsResponse.data.credentials);
      }
    } catch (error) {
      console.error("Failed to load teacher profile data:", error);
      Alert.alert("エラー", "プロフィール情報の読み込みに失敗しました", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSelection = () => {
    navigation.navigate("SubjectSelection", {
      selectedSubjects: subjects,
      selectedGroups: subjectGroups,
      onSelect: (
        selectedSubjects: string[],
        selectedGroups: Record<string, string[]>,
      ) => {
        setSubjects(selectedSubjects);
        setSubjectGroups(selectedGroups);
      },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Parse experienceYears as an integer or undefined if empty
      const trimmedYears = experienceYears.trim();
      const years = trimmedYears ? parseInt(trimmedYears, 10) : undefined;

      // Save teacher-specific data to teachers table
      const result = await updateProfile({
        experience: experience.trim(),
        subjects: subjects,
        subjectGroups: subjectGroups,
        experienceYears: years,
      });

      if (result.success) {
        // Check if we're in the onboarding flow (route name is OnboardingTeacherInfo)
        const isOnboarding = route.name === 'OnboardingTeacherInfo';
        
        if (isOnboarding) {
          // Show motivational message before transitioning to main app
          Alert.alert(
            "登録完了！",
            "さあ、指導を始めましょう！",
            [
              {
                text: "始める",
                onPress: async () => {
                  // Refresh user data to update onboarding status
                  // This will trigger RootNavigator to automatically switch to MainApp
                  await refreshUser();
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          // In main app flow, show alert and go back
          Alert.alert("保存完了", "プロフィールを保存しました", [
            {
              text: "OK",
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                }
              },
            },
          ]);
        }
      } else {
        Alert.alert(
          "エラー",
          result.error || "プロフィールの保存に失敗しました",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("エラー", "プロフィールの保存に失敗しました", [
        { text: "OK" },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCredential = () => {
    setEditingCredential(undefined);
    setShowCredentialForm(true);
  };

  const handleEditCredential = (credential: Credential) => {
    setEditingCredential(credential);
    setShowCredentialForm(true);
  };

  const handleSaveCredential = async (credential: Credential) => {
    try {
      if (credential.id) {
        // Update existing credential
        const response = await apiService.updateTeacherCredential(
          credential.id,
          credential,
        );
        if (response.success) {
          setCredentials(
            credentials.map((c) =>
              c.id === credential.id ? response.data!.credential : c,
            ),
          );
          setShowCredentialForm(false);
          Alert.alert("成功", "経歴・資格を更新しました");
        } else {
          Alert.alert("エラー", "更新に失敗しました");
        }
      } else {
        // Create new credential
        const response = await apiService.createTeacherCredential(credential);
        if (response.success) {
          setCredentials([...credentials, response.data!.credential]);
          setShowCredentialForm(false);
          Alert.alert("成功", "経歴・資格を追加しました");
        } else {
          Alert.alert("エラー", "追加に失敗しました");
        }
      }
    } catch (error) {
      console.error("Error saving credential:", error);
      Alert.alert("エラー", "保存に失敗しました");
    }
  };

  const handleDeleteCredential = async (id: string) => {
    Alert.alert("確認", "この経歴・資格を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await apiService.deleteTeacherCredential(id);
            if (response.success) {
              setCredentials(credentials.filter((c) => c.id !== id));
              Alert.alert("成功", "経歴・資格を削除しました");
            } else {
              Alert.alert("エラー", "削除に失敗しました");
            }
          } catch (error) {
            console.error("Error deleting credential:", error);
            Alert.alert("エラー", "削除に失敗しました");
          }
        },
      },
    ]);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "education":
        return "学歴";
      case "career":
        return "職歴";
      case "qualification":
        return "資格";
      default:
        return type;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: 120 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>専門科目</ThemedText>

              <Pressable
                style={[
                  styles.subjectSelectionButton,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleSubjectSelection}
              >
                <View style={styles.subjectSelectionContent}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.primary + "1A" },
                    ]}
                  >
                    <Feather name="book-open" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.subjectSelectionTextContainer}>
                    <ThemedText style={styles.subjectSelectionTitle}>
                      専門科目を設定
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.subjectSelectionSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      指導可能な科目を選択・編集
                    </ThemedText>
                  </View>
                </View>
                <Feather
                  name="chevron-right"
                  size={24}
                  color={theme.textSecondary}
                />
              </Pressable>

              {subjects.length > 0 && (
                <View style={styles.selectedSubjectsContainer}>
                  <ThemedText
                    style={[
                      styles.selectedSubjectsLabel,
                      { color: theme.textSecondary },
                    ]}
                  >
                    選択中の科目
                  </ThemedText>
                  <SubjectDisplay
                    subjects={subjects}
                    subjectGroups={subjectGroups}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>専門性</ThemedText>

              <View style={styles.field}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  指導経験
                </ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="例: 生徒一人ひとりの学習スタイルに合わせた丁寧な指導..."
                  placeholderTextColor={theme.textSecondary}
                  value={experience}
                  onChangeText={setExperience}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.field}>
                <ThemedText
                  style={[styles.label, { color: theme.textSecondary }]}
                >
                  指導経験年数
                </ThemedText>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="例: 5"
                    placeholderTextColor={theme.textSecondary}
                    value={experienceYears}
                    onChangeText={(text: string) => {
                      // Only allow numeric characters
                      const numericText = text.replace(/[^0-9]/g, "");
                      setExperienceYears(numericText);
                    }}
                    keyboardType="numeric"
                  />
                  <ThemedText
                    style={[styles.inputSuffix, { color: theme.textSecondary }]}
                  >
                    年
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>経歴・資格</ThemedText>
                <Pressable
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddCredential}
                >
                  <Feather name="plus" size={20} color="#ffffff" />
                </Pressable>
              </View>

              {credentials.length > 0 ? (
                <View style={styles.credentialsList}>
                  {credentials.map((credential) => (
                    <View
                      key={credential.id}
                      style={[
                        styles.credentialCard,
                        {
                          backgroundColor: theme.backgroundDefault,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <View style={styles.credentialInfo}>
                        <View style={styles.credentialHeader}>
                          <View
                            style={[
                              styles.typeBadge,
                              { backgroundColor: theme.primary + "1A" },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.typeBadgeText,
                                { color: theme.primary },
                              ]}
                            >
                              {getTypeLabel(credential.type)}
                            </ThemedText>
                          </View>
                        </View>
                        <ThemedText style={styles.credentialTitle}>
                          {credential.title}
                        </ThemedText>
                        {credential.organization && (
                          <ThemedText
                            style={[
                              styles.credentialSubtitle,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {credential.organization}
                          </ThemedText>
                        )}
                        {(credential.startDate || credential.endDate) && (
                          <ThemedText
                            style={[
                              styles.credentialDate,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {credential.startDate || ""}
                            {credential.startDate && credential.endDate
                              ? " 〜 "
                              : ""}
                            {credential.endDate || ""}
                          </ThemedText>
                        )}
                        {credential.description && (
                          <ThemedText
                            style={[
                              styles.credentialDescription,
                              { color: theme.textSecondary },
                            ]}
                          >
                            {credential.description}
                          </ThemedText>
                        )}
                      </View>
                      <View style={styles.credentialActions}>
                        <Pressable
                          onPress={() => handleEditCredential(credential)}
                          hitSlop={8}
                        >
                          <Feather
                            name="edit-2"
                            size={20}
                            color={theme.textSecondary}
                          />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteCredential(credential.id)}
                          hitSlop={8}
                        >
                          <Feather
                            name="trash-2"
                            size={20}
                            color={theme.textSecondary}
                          />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyState,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Feather
                    name="file-text"
                    size={32}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.emptyStateText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    まだ経歴・資格が登録されていません
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.emptyStateSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    右上の + ボタンから追加できます
                  </ThemedText>
                </View>
              )}
            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: theme.backgroundRoot + "E6",
                borderTopColor: theme.border,
                paddingBottom: insets.bottom + Spacing.md,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed || isSaving ? 0.9 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText style={styles.saveButtonText}>
                  変更を保存
                </ThemedText>
              )}
            </Pressable>
          </View>

          <CredentialForm
            visible={showCredentialForm}
            credential={editingCredential}
            onSave={handleSaveCredential}
            onCancel={() => setShowCredentialForm(false)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  subjectSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    borderStyle: "dashed",
  },
  subjectSelectionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  subjectSelectionTextContainer: {
    flex: 1,
    gap: 4,
  },
  subjectSelectionTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  subjectSelectionSubtitle: {
    fontSize: 14,
  },
  selectedSubjectsContainer: {
    marginTop: Spacing.md,
  },
  selectedSubjectsLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  selectedSubjectsText: {
    fontSize: 15,
    lineHeight: 22,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 140,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 56,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  inputSuffix: {
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  credentialsList: {
    gap: Spacing.sm,
  },
  credentialCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: "flex-start",
  },
  credentialInfo: {
    flex: 1,
    gap: 4,
  },
  credentialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  credentialTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  credentialSubtitle: {
    fontSize: 13,
  },
  credentialDate: {
    fontSize: 12,
  },
  credentialDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  credentialActions: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
    paddingLeft: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 13,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
