import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, Modal, ScrollView, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

interface Credential {
  id?: string;
  type: string;
  title: string;
  organization?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  sortOrder?: number;
}

interface CredentialFormProps {
  visible: boolean;
  credential?: Credential;
  onSave: (credential: Credential) => Promise<void>;
  onCancel: () => void;
}

export function CredentialForm({ visible, credential, onSave, onCancel }: CredentialFormProps) {
  const { theme, isDark } = useTheme();
  const [type, setType] = useState(credential?.type || 'education');
  const [title, setTitle] = useState(credential?.title || '');
  const [organization, setOrganization] = useState(credential?.organization || '');
  const [startDate, setStartDate] = useState(credential?.startDate || '');
  const [endDate, setEndDate] = useState(credential?.endDate || '');
  const [description, setDescription] = useState(credential?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Update state when credential prop changes (for editing different credentials)
  useEffect(() => {
    setType(credential?.type || 'education');
    setTitle(credential?.title || '');
    setOrganization(credential?.organization || '');
    setStartDate(credential?.startDate || '');
    setEndDate(credential?.endDate || '');
    setDescription(credential?.description || '');
    setIsSaving(false);
  }, [credential]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...credential,
        type,
        title: title.trim(),
        organization: organization.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
        description: description.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (
    event: any,
    selectedDate: Date | undefined,
    isStartDate: boolean
  ) => {
    // On Android, the picker auto-dismisses after selection
    // On iOS, we need to keep it open until user clicks elsewhere
    const shouldClose = Platform.OS === 'android';
    
    if (shouldClose) {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    }
    
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const formattedDate = `${year}年${month}月`;
      
      if (isStartDate) {
        setStartDate(formattedDate);
      } else {
        setEndDate(formattedDate);
      }
    }
  };

  const parseDateFromString = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    // Try to parse Japanese format (e.g., "2015年4月")
    const match = dateString.match(/(\d+)年(\d+)月/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; // JavaScript months are 0-indexed
      return new Date(year, month, 1);
    }
    
    // Fallback to standard Date parsing
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const typeOptions = [
    { value: 'education', label: '学歴' },
    { value: 'career', label: '職歴' },
    { value: 'qualification', label: '資格' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <ThemedText style={styles.modalTitle}>
              {credential?.id ? '経歴・資格を編集' : '経歴・資格を追加'}
            </ThemedText>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>種別</ThemedText>
              <View style={styles.typeSelector}>
                {typeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: type === option.value ? theme.primary : theme.backgroundDefault,
                        borderColor: type === option.value ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => setType(option.value)}
                  >
                    <ThemedText
                      style={[
                        styles.typeOptionText,
                        { color: type === option.value ? '#ffffff' : theme.text }
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>タイトル *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text
                  }
                ]}
                placeholder="例: 東京大学 理学部 卒業"
                placeholderTextColor={theme.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>組織・機関名</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text
                  }
                ]}
                placeholder="例: 東京大学"
                placeholderTextColor={theme.textSecondary}
                value={organization}
                onChangeText={setOrganization}
              />
            </View>

            <View style={styles.dateRow}>
              <View style={[styles.field, styles.dateField]}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>開始時期</ThemedText>
                <Pressable
                  style={[
                    styles.datePickerButton,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Feather name="calendar" size={20} color={theme.textSecondary} />
                  <ThemedText style={[
                    styles.datePickerText,
                    { color: startDate ? theme.text : theme.textSecondary }
                  ]}>
                    {startDate || '例: 2015年4月'}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={[styles.field, styles.dateField]}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>終了時期</ThemedText>
                <Pressable
                  style={[
                    styles.datePickerButton,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.border,
                    }
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Feather name="calendar" size={20} color={theme.textSecondary} />
                  <ThemedText style={[
                    styles.datePickerText,
                    { color: endDate ? theme.text : theme.textSecondary }
                  ]}>
                    {endDate || '例: 2019年3月'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Date Pickers */}
            {Platform.OS === 'ios' && showStartDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showStartDatePicker}
                onRequestClose={() => setShowStartDatePicker(false)}
              >
                <Pressable 
                  style={styles.datePickerOverlay}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <View style={[styles.datePickerModal, { backgroundColor: theme.backgroundRoot }]}>
                    <View style={[styles.datePickerHeader, { borderBottomColor: theme.border }]}>
                      <Pressable onPress={() => setShowStartDatePicker(false)}>
                        <ThemedText style={{ color: theme.primary, fontSize: 16 }}>完了</ThemedText>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={parseDateFromString(startDate)}
                      mode="date"
                      display="spinner"
                      onChange={(event, date) => handleDateChange(event, date, true)}
                      textColor={isDark ? "#ffffff" : undefined}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                </Pressable>
              </Modal>
            )}
            {Platform.OS === 'ios' && showEndDatePicker && (
              <Modal
                transparent={true}
                animationType="slide"
                visible={showEndDatePicker}
                onRequestClose={() => setShowEndDatePicker(false)}
              >
                <Pressable 
                  style={styles.datePickerOverlay}
                  onPress={() => setShowEndDatePicker(false)}
                >
                  <View style={[styles.datePickerModal, { backgroundColor: theme.backgroundRoot }]}>
                    <View style={[styles.datePickerHeader, { borderBottomColor: theme.border }]}>
                      <Pressable onPress={() => setShowEndDatePicker(false)}>
                        <ThemedText style={{ color: theme.primary, fontSize: 16 }}>完了</ThemedText>
                      </Pressable>
                    </View>
                    <DateTimePicker
                      value={parseDateFromString(endDate)}
                      mode="date"
                      display="spinner"
                      onChange={(event, date) => handleDateChange(event, date, false)}
                      textColor={isDark ? "#ffffff" : undefined}
                      themeVariant={isDark ? "dark" : "light"}
                    />
                  </View>
                </Pressable>
              </Modal>
            )}
            {Platform.OS === 'android' && showStartDatePicker && (
              <DateTimePicker
                value={parseDateFromString(startDate)}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, true)}
                textColor={isDark ? "#ffffff" : undefined}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}
            {Platform.OS === 'android' && showEndDatePicker && (
              <DateTimePicker
                value={parseDateFromString(endDate)}
                mode="date"
                display="default"
                onChange={(event, date) => handleDateChange(event, date, false)}
                textColor={isDark ? "#ffffff" : undefined}
                themeVariant={isDark ? "dark" : "light"}
              />
            )}

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>説明</ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                    color: theme.text
                  }
                ]}
                placeholder="詳細な説明や補足情報があれば記入してください"
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Pressable
              style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
              onPress={onCancel}
              disabled={isSaving}
            >
              <ThemedText style={{ color: theme.text }}>キャンセル</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.button, 
                styles.saveButton, 
                { 
                  backgroundColor: theme.primary,
                  opacity: isSaving ? 0.7 : 1
                }
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <ThemedText style={{ color: '#ffffff' }}>保存</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    height: 48,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  datePickerText: {
    fontSize: 15,
    flex: 1,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  datePickerModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
  },
});
