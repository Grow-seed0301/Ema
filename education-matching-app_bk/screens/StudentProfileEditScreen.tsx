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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/RootNavigator";
import type { OnboardingStackParamList } from "@/navigation/OnboardingStackNavigator";

// Support navigation from both Main and Onboarding stacks
type NavigationProp = NativeStackNavigationProp<MainStackParamList> | NativeStackNavigationProp<OnboardingStackParamList>;

interface Subject {
  id: string;
  name: string;
  icon: keyof typeof Feather.glyphMap;
}

const subjects: Subject[] = [
  { id: "math", name: "数学", icon: "hash" },
  { id: "english", name: "英語", icon: "globe" },
  { id: "science", name: "理科", icon: "activity" },
  { id: "social", name: "社会", icon: "book" },
];

const grades = [
  "小学1年生",
  "小学2年生",
  "小学3年生",
  "小学4年生",
  "小学5年生",
  "小学6年生",
  "中学1年生",
  "中学2年生",
  "中学3年生",
  "高校1年生",
  "高校2年生",
  "高校3年生",
  "大学1年生",
  "大学2年生",
  "大学3年生",
  "大学4年生",
  "仕事中",
];

const teachingStyles = [
  { id: "basic", label: "基礎からじっくり" },
  { id: "advanced", label: "応用問題に挑戦" },
  { id: "school", label: "学校の予習・復習" },
];

export default function StudentProfileEditScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user, updateProfile, refreshUser } = useAuth();

  const [selectedGrade, setSelectedGrade] = useState("中学2年生");
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSubjectGroups, setSelectedSubjectGroups] = useState<
    Record<string, string[]>
  >({});
  const [goal, setGoal] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("advanced");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing profile data on mount
  useEffect(() => {
    if (user?.learningGoalText) {
      try {
        // Try to parse as JSON first (new format)
        const parsed = JSON.parse(user.learningGoalText);

        // Validate and set grade if it's a valid grade
        if (
          parsed.grade &&
          typeof parsed.grade === "string" &&
          grades.includes(parsed.grade)
        ) {
          setSelectedGrade(parsed.grade);
        }

        // Handle subjects - can be either old format (IDs) or new format (names)
        if (Array.isArray(parsed.subjects)) {
          const validSubjectIds = subjects.map((s) => s.id);

          // Check if all items are in the old format (IDs like 'math', 'english')
          // or new format (names like '数学', '英語')
          const allAreIds = parsed.subjects.every((subj: string) =>
            validSubjectIds.includes(subj),
          );
          const allAreNames = parsed.subjects.every(
            (subj: string) => !validSubjectIds.includes(subj),
          );

          if (allAreIds) {
            // Convert old format IDs to subject names for backward compatibility
            const subjectNames = parsed.subjects
              .map((id: string) => {
                const subject = subjects.find((s) => s.id === id);
                return subject ? subject.name : null;
              })
              .filter((name): name is string => name !== null);
            setSelectedSubjects(subjectNames);
          } else if (allAreNames) {
            // New format - already subject names
            setSelectedSubjects(parsed.subjects);
          } else {
            // Mixed format or invalid data - skip to avoid inconsistency
            console.warn(
              "Mixed or invalid subject format detected, skipping subject loading",
            );
          }
        }

        // Load subject groups if they exist
        if (parsed.subjectGroups && typeof parsed.subjectGroups === "object") {
          setSelectedSubjectGroups(parsed.subjectGroups);
        }

        // Set goal if it's a string
        if (parsed.goal && typeof parsed.goal === "string") {
          setGoal(parsed.goal);
        }

        // Validate and set style if it's a valid style ID
        if (parsed.style && typeof parsed.style === "string") {
          const validStyleIds = teachingStyles.map((s) => s.id);
          if (validStyleIds.includes(parsed.style)) {
            setSelectedStyle(parsed.style);
          }
        }
      } catch (e) {
        // If parsing fails, treat as plain text (old format)
        // This maintains backward compatibility
        console.warn(
          "Failed to parse learning goal as JSON, treating as plain text:",
          e,
        );
        setGoal(user.learningGoalText);
      }
    }
    setIsLoading(false);
  }, [user]);

  const handleSubjectSelection = () => {
    navigation.navigate("SubjectSelection", {
      selectedSubjects: selectedSubjects,
      selectedGroups: selectedSubjectGroups,
      onSelect: (subjects: string[], groups: Record<string, string[]>) => {
        setSelectedSubjects(subjects);
        setSelectedSubjectGroups(groups);
      },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Store all learning information as JSON in learningGoal field
      const learningData = {
        grade: selectedGrade,
        subjects: selectedSubjects,
        subjectGroups: selectedSubjectGroups,
        goal,
        style: selectedStyle,
      };

      const result = await updateProfile({
        learningGoal: JSON.stringify(learningData),
      });

      if (result.success) {
        // Check if we're in the onboarding flow (route name is OnboardingLearningInfo)
        const isOnboarding = route.name === 'OnboardingLearningInfo';
        
        if (isOnboarding) {
          // Show motivational message before transitioning to main app
          Alert.alert(
            "登録完了！",
            "さあ、先生を探して学習を始めましょう！",
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
            <View style={styles.field}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                学年
              </ThemedText>
              <Pressable
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setShowGradeDropdown(!showGradeDropdown)}
              >
                <ThemedText style={styles.dropdownText}>
                  {selectedGrade}
                </ThemedText>
                <Feather
                  name={showGradeDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
              {showGradeDropdown ? (
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  {grades.map((grade) => (
                    <Pressable
                      key={grade}
                      style={[
                        styles.dropdownItem,
                        selectedGrade === grade && {
                          backgroundColor: theme.primary + "1A",
                        },
                      ]}
                      onPress={() => {
                        setSelectedGrade(grade);
                        setShowGradeDropdown(false);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.dropdownItemText,
                          selectedGrade === grade && { color: theme.primary },
                        ]}
                      >
                        {grade}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                学習したい科目
              </ThemedText>

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
                      学習したい科目を選択
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.subjectSelectionSubtitle,
                        { color: theme.textSecondary },
                      ]}
                    >
                      学びたい科目・分野を選択
                    </ThemedText>
                  </View>
                </View>
                <Feather
                  name="chevron-right"
                  size={24}
                  color={theme.textSecondary}
                />
              </Pressable>

              {selectedSubjects.length > 0 && (
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
                    subjects={selectedSubjects}
                    subjectGroups={selectedSubjectGroups}
                  />
                </View>
              )}
            </View>

            <View style={styles.field}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                学習目標
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
                placeholder="例：定期テストで平均80点以上取る"
                placeholderTextColor={theme.textSecondary}
                value={goal}
                onChangeText={setGoal}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <ThemedText
                style={[styles.label, { color: theme.textSecondary }]}
              >
                希望する指導スタイル
              </ThemedText>
              <View style={styles.radioGroup}>
                {teachingStyles.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <Pressable
                      key={style.id}
                      style={[
                        styles.radioItem,
                        { backgroundColor: theme.backgroundDefault },
                      ]}
                      onPress={() => setSelectedStyle(style.id)}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          {
                            borderColor: isSelected
                              ? theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        {isSelected ? (
                          <View
                            style={[
                              styles.radioInner,
                              { backgroundColor: theme.primary },
                            ]}
                          />
                        ) : null}
                      </View>
                      <ThemedText style={styles.radioLabel}>
                        {style.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.bottomBar,
              {
                backgroundColor: theme.backgroundDefault,
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
                <ThemedText style={styles.saveButtonText}>保存する</ThemedText>
              )}
            </Pressable>
          </View>
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
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  dropdownText: {
    fontSize: 15,
  },
  dropdownMenu: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: Spacing.md,
  },
  dropdownItemText: {
    fontSize: 15,
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
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
  },
  radioGroup: {
    gap: Spacing.sm,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
  radioLabel: {
    fontSize: 15,
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  saveButton: {
    height: 56,
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
