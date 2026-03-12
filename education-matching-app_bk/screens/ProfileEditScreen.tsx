import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";

export default function ProfileEditScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user, updateProfile } = useAuth();
  const { isUploading, uploadImage } = useProfileImageUpload();

  const [name, setName] = useState(user?.name || "");
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [birthdate, setBirthdate] = useState<Date | null>(() => {
    // Parse user's dateOfBirth, or return null if not set
    if (user?.dateOfBirth) {
      // Try to parse the date string
      const parsed = new Date(user.dateOfBirth);
      if (isNaN(parsed.getTime())) {
        // If invalid, return null to show blank
        return null;
      }
      return parsed;
    }
    // Return null to show blank when no date is set
    return null;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [address, setAddress] = useState(user?.address || "");
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.avatarUrl || null,
  );
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [tempBirthdate, setTempBirthdate] = useState<Date | null>(null);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (selectedDate) {
        setBirthdate(selectedDate);
      }
    } else if (Platform.OS === "ios") {
      // On iOS, update the temp date for preview
      if (selectedDate) {
        setTempBirthdate(selectedDate);
      }
    }
  };

  const handleDatePickerConfirm = () => {
    if (tempBirthdate) {
      setBirthdate(tempBirthdate);
    }
    setShowDatePicker(false);
    setTempBirthdate(null);
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
    setTempBirthdate(null);
  };

  const handleDatePickerShow = () => {
    setTempBirthdate(birthdate || new Date());
    setShowDatePicker(true);
  };

  const handleImageSelection = async (localUri: string) => {
    // Just store the local URI and display it immediately
    // Upload will happen when Save button is clicked
    setLocalImageUri(localUri);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "権限が必要です",
        "写真ライブラリへのアクセス権限が必要です。設定から権限を許可してください。",
        [{ text: "OK" }],
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelection(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "権限が必要です",
        "カメラへのアクセス権限が必要です。設定から権限を許可してください。",
        [{ text: "OK" }],
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelection(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    Alert.alert("プロフィール画像を変更", "画像の選択方法を選んでください", [
      { text: "カメラで撮影", onPress: takePhoto },
      { text: "ライブラリから選択", onPress: pickImage },
      { text: "キャンセル", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Upload image first if a new local image was selected
      if (localImageUri) {
        const serverUrl = await uploadImage(localImageUri);
        if (serverUrl) {
          setProfileImage(serverUrl);
          // Clear the local URI after successful upload
          setLocalImageUri(null);
        } else {
          // If image upload failed, still continue with other profile updates
          // The error alert is already shown by the upload hook
        }
      }

      const updateData: {
        name: string;
        nickname: string;
        bio: string;
        phone: string;
        gender: string;
        address: string;
        dateOfBirth?: string;
      } = {
        name,
        nickname,
        bio,
        phone,
        gender,
        address,
      };

      // Only include dateOfBirth if it's set
      if (birthdate) {
        updateData.dateOfBirth = birthdate.toISOString();
      }

      const result = await updateProfile(updateData);

      if (result.success) {
        // Check if we're in the onboarding flow (route name is OnboardingProfile)
        const isOnboarding = route.name === 'OnboardingProfile';
        
        if (isOnboarding) {
          // Navigate to the appropriate screen based on user role in onboarding
          if (user?.userRole === 'student') {
            (navigation as any).navigate('OnboardingLearningInfo');
          } else if (user?.userRole === 'teacher') {
            (navigation as any).navigate('OnboardingTeacherInfo');
          } else {
            // Fallback: if role is not set properly, show alert and go back
            Alert.alert(
              "エラー",
              "ユーザーロールが設定されていません。もう一度お試しください。",
              [
                {
                  text: "OK",
                  onPress: () => {
                    if (navigation.canGoBack()) {
                      navigation.goBack();
                    }
                  },
                },
              ]
            );
          }
        } else {
          // In main app flow, just go back after showing success alert
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
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
      >
        <View style={styles.profileSection}>
          <Pressable style={styles.avatarContainer} onPress={handleImagePress}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              {localImageUri || profileImage ? (
                <Image
                  source={{ uri: localImageUri || profileImage || "" }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={48} color={theme.textSecondary} />
              )}
              {isUploading ? (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#ffffff" />
                </View>
              ) : null}
            </View>
            <View
              style={[
                styles.editAvatarButton,
                { backgroundColor: theme.primary },
              ]}
            >
              <Feather name="camera" size={14} color="#ffffff" />
            </View>
          </Pressable>
          <ThemedText style={styles.userName}>{name}</ThemedText>
        </View>

        <View style={styles.formSection}>
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              名前
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="名前を入力"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              ニックネーム
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={nickname}
              onChangeText={setNickname}
              placeholder="ニックネームを入力"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              生年月日
            </ThemedText>
            <Pressable
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
              onPress={handleDatePickerShow}
            >
              <ThemedText
                style={{
                  color: birthdate ? theme.text : theme.textSecondary,
                }}
              >
                {birthdate ? formatDate(birthdate) : "生年月日を選択"}
              </ThemedText>
              <Feather name="calendar" size={20} color={theme.textSecondary} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={
                  Platform.OS === "ios" && tempBirthdate
                    ? tempBirthdate
                    : birthdate || new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1940, 0, 1)}
                textColor={isDark ? "#ffffff" : undefined}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
            {Platform.OS === "ios" && showDatePicker && (
              <View
                style={[
                  styles.datePickerButtons,
                  { backgroundColor: theme.backgroundDefault },
                ]}
              >
                <Pressable
                  style={[
                    styles.datePickerButton,
                    { borderRightWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={handleDatePickerCancel}
                >
                  <ThemedText style={{ color: theme.textSecondary }}>
                    キャンセル
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={styles.datePickerButton}
                  onPress={handleDatePickerConfirm}
                >
                  <ThemedText style={{ color: theme.primary }}>完了</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              自己紹介
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
              value={bio}
              onChangeText={setBio}
              placeholder="自己紹介を入力..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              電話番号
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="電話番号を入力"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              性別
            </ThemedText>
            <Pressable
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
              ]}
              onPress={() => setShowGenderDropdown(!showGenderDropdown)}
            >
              <ThemedText
                style={
                  gender
                    ? { color: theme.text }
                    : { color: theme.textSecondary }
                }
              >
                {gender || "性別を選択"}
              </ThemedText>
              <Feather
                name={showGenderDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
            {showGenderDropdown ? (
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                {["男性", "女性", "その他"].map((genderOption) => (
                  <Pressable
                    key={genderOption}
                    style={[
                      styles.dropdownItem,
                      gender === genderOption && {
                        backgroundColor: theme.primary + "1A",
                      },
                    ]}
                    onPress={() => {
                      setGender(genderOption);
                      setShowGenderDropdown(false);
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.dropdownItemText,
                        gender === genderOption && { color: theme.primary },
                      ]}
                    >
                      {genderOption}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              住所
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder="住所を入力"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>
      </ScreenKeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed || isSaving ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.saveButtonText}>
              変更を保存する
            </ThemedText>
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
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 56,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  formSection: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    fontSize: 16,
  },
  datePickerButtons: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  datePickerButton: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    fontSize: 16,
    minHeight: 140,
    ...Platform.select({
      ios: {
        paddingTop: Spacing.lg,
      },
    }),
  },
  dropdownMenu: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: Spacing.lg,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    paddingVertical: Spacing.lg,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
