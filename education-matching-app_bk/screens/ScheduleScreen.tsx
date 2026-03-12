import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/ThemedText";
import { Calendar, type DayStatus } from "@/components/Calendar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import apiService from "@/services/api";
import { timeStringToDate, dateToTimeString } from "@/utils/timeUtils";
import { getDayOfWeek, formatDateAsLocalString } from "@/utils/dateUtils";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
}

interface DaySchedule {
  date: string;
  timeSlots: TimeSlot[];
  repeatEnabled: boolean;
  dayOfWeek: string | null;
  hasBookedSlots?: boolean;
  hasAvailableSlots?: boolean;
}

// Helper function to convert schedule data to day status for calendar display
const scheduleToDayStatus = (schedule: DaySchedule): DayStatus => {
  // If has booked slots, show as "unavailable" (red indicator in calendar)
  if (schedule.hasBookedSlots) {
    return "unavailable";
  }
  // If has available slots, show as "available" (green indicator in calendar)
  if (schedule.hasAvailableSlots) {
    return "available";
  }
  // Otherwise return "selected" (no indicator shown in calendar)
  return "selected";
};

export default function ScheduleScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [dayStatuses, setDayStatuses] = useState<Record<number, DayStatus>>({});

  const [timeSlotIdCounter, setTimeSlotIdCounter] = useState(1);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [repeatEnabled, setRepeatEnabled] = useState(true);

  // Store the full schedule data from API
  const [scheduleData, setScheduleData] = useState<Record<string, DaySchedule>>(
    {},
  );

  // Time picker states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editingTimeType, setEditingTimeType] = useState<"start" | "end">(
    "start",
  );
  const [tempTime, setTempTime] = useState(new Date());

  // Get current selected date's day of week
  const currentDayOfWeek = getDayOfWeek(
    new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate),
  );

  // Helper function to load schedule for a given month
  const loadScheduleForMonth = async (year: number, month: number) => {
    try {
      const result = await apiService.getTeacherSchedule(year, month);

      if (result.success && result.data) {
        setScheduleData(result.data.schedule);

        // Update dayStatuses based on loaded schedule
        const newDayStatuses: Record<number, DayStatus> = {};
        Object.keys(result.data.schedule).forEach((dateKey) => {
          const dayNum = parseInt(dateKey, 10);
          if (!isNaN(dayNum)) {
            const daySchedule = result.data.schedule[dateKey];
            newDayStatuses[dayNum] = scheduleToDayStatus(daySchedule);
          }
        });
        setDayStatuses(newDayStatuses);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    }
  };

  // Load schedule data when month changes
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsLoading(true);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        await loadScheduleForMonth(year, month);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [currentMonth]);

  // Load selected date's schedule when date changes
  useEffect(() => {
    if (selectedDate !== null) {
      const dateKey = selectedDate.toString();
      const daySchedule = scheduleData[dateKey];

      if (daySchedule && daySchedule.timeSlots) {
        // Load the time slots for this date
        setTimeSlots(daySchedule.timeSlots || []);
        setTimeSlotIdCounter((daySchedule.timeSlots?.length || 0) + 1);
        setRepeatEnabled(daySchedule.repeatEnabled || false);
      } else {
        // No schedule for this date, reset to defaults
        setTimeSlots([]);
        setTimeSlotIdCounter(1);
        setRepeatEnabled(true);
      }
    }
  }, [selectedDate, scheduleData]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Prepare schedule data to save
      const scheduleData = {
        date: formatDateAsLocalString(
          new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            selectedDate,
          ),
        ),
        timeSlots,
        dayStatuses,
        repeatEnabled,
        dayOfWeek: currentDayOfWeek,
      };

      // Call API to save schedule
      const result = await apiService.updateTeacherSchedule(scheduleData);

      if (result.success) {
        Alert.alert("保存完了", "スケジュールを保存しました", [{ text: "OK" }]);

        // Reload the schedule to get the updated data
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        await loadScheduleForMonth(year, month);
      } else {
        Alert.alert(
          "エラー",
          result.error?.message || "スケジュールの保存に失敗しました",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("エラー", "スケジュールの保存に失敗しました", [
        { text: "OK" },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTime = (slotId: string, timeType: "start" | "end") => {
    const slot = timeSlots.find((s) => s.id === slotId);
    if (!slot) return;

    const timeStr = timeType === "start" ? slot.startTime : slot.endTime;
    setEditingSlotId(slotId);
    setEditingTimeType(timeType);
    setTempTime(timeStringToDate(timeStr));
    setShowTimePicker(true);
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedTime?: Date,
  ) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "set" && selectedTime && editingSlotId) {
      const newTimeStr = dateToTimeString(selectedTime);
      setTimeSlots((prev) =>
        prev.map((slot) => {
          if (slot.id === editingSlotId) {
            return {
              ...slot,
              [editingTimeType === "start" ? "startTime" : "endTime"]:
                newTimeStr,
            };
          }
          return slot;
        }),
      );

      if (Platform.OS === "ios") {
        setTempTime(selectedTime);
      }
    }

    if (event.type === "dismissed") {
      setShowTimePicker(false);
    }
  };

  const confirmIOSTime = () => {
    if (editingSlotId) {
      const newTimeStr = dateToTimeString(tempTime);
      setTimeSlots((prev) =>
        prev.map((slot) => {
          if (slot.id === editingSlotId) {
            return {
              ...slot,
              [editingTimeType === "start" ? "startTime" : "endTime"]:
                newTimeStr,
            };
          }
          return slot;
        }),
      );
    }
    setShowTimePicker(false);
  };

  const handleAddTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot_${timeSlotIdCounter}`,
      startTime: "9:00",
      endTime: "10:00",
    };
    setTimeSlots([...timeSlots, newSlot]);
    setTimeSlotIdCounter(timeSlotIdCounter + 1);
  };

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={styles.loadingText}>
            スケジュールを読み込んでいます...
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: insets.bottom + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText
            style={[styles.instructionText, { color: theme.textSecondary }]}
          >
            日付をタップして、指導可能な時間を設定してください。
          </ThemedText>

          <View
            style={[
              styles.calendarCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <Calendar
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onMonthChange={setCurrentMonth}
              dayStatuses={dayStatuses}
              showDayIndicators={true}
            />
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>指導可能な時間</ThemedText>
          </View>

          {timeSlots.map((slot) => (
            <View
              key={slot.id}
              style={[
                styles.timeSlotCard,
                { backgroundColor: theme.backgroundDefault },
                slot.isBooked && { opacity: 0.6 },
              ]}
            >
              <View style={styles.timeSlotContent}>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => handleEditTime(slot.id, "start")}
                  disabled={slot.isBooked}
                >
                  <ThemedText style={styles.timeButtonText}>
                    {slot.startTime}
                  </ThemedText>
                  <Feather
                    name="clock"
                    size={16}
                    color={theme.textSecondary}
                    style={styles.clockIcon}
                  />
                </Pressable>
                <ThemedText style={styles.timeSeparator}>-</ThemedText>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => handleEditTime(slot.id, "end")}
                  disabled={slot.isBooked}
                >
                  <ThemedText style={styles.timeButtonText}>
                    {slot.endTime}
                  </ThemedText>
                  <Feather
                    name="clock"
                    size={16}
                    color={theme.textSecondary}
                    style={styles.clockIcon}
                  />
                </Pressable>
                {slot.isBooked && (
                  <View style={styles.bookedBadge}>
                    <ThemedText style={styles.bookedBadgeText}>
                      予約済み
                    </ThemedText>
                  </View>
                )}
              </View>
              {!slot.isBooked && (
                <Pressable onPress={() => handleRemoveTimeSlot(slot.id)}>
                  <Feather name="trash-2" size={20} color="#FF6B6B" />
                </Pressable>
              )}
            </View>
          ))}

          <Pressable style={styles.addTimeBtn} onPress={handleAddTimeSlot}>
            <View
              style={[styles.addTimeIcon, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={20} color="#ffffff" />
            </View>
            <ThemedText style={[styles.addTimeText, { color: theme.primary }]}>
              時間を追加
            </ThemedText>
          </Pressable>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>繰り返し設定</ThemedText>
          </View>

          <View
            style={[
              styles.repeatCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText style={styles.repeatText}>
              毎週{currentDayOfWeek}に繰り返す
            </ThemedText>
            <Pressable
              style={[
                styles.toggle,
                {
                  backgroundColor: repeatEnabled ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setRepeatEnabled(!repeatEnabled)}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: "#ffffff" },
                  repeatEnabled && styles.toggleThumbActive,
                ]}
              />
            </Pressable>
          </View>

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
        </ScrollView>
      )}

      {/* Time Picker Modal for iOS and Android */}
      {Platform.OS === "ios" ? (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowTimePicker(false)}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <ThemedText
                    style={[styles.modalButton, { color: theme.textSecondary }]}
                  >
                    キャンセル
                  </ThemedText>
                </Pressable>
                <ThemedText style={styles.modalTitle}>
                  {editingTimeType === "start" ? "開始時刻" : "終了時刻"}
                </ThemedText>
                <Pressable onPress={confirmIOSTime}>
                  <ThemedText
                    style={[styles.modalButton, { color: theme.primary }]}
                  >
                    完了
                  </ThemedText>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.timePicker}
                textColor={isDark ? "#ffffff" : undefined}
                themeVariant={isDark ? "dark" : "light"}
              />
            </View>
          </Pressable>
        </Modal>
      ) : (
        showTimePicker && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
            textColor={isDark ? "#ffffff" : undefined}
            themeVariant={isDark ? "dark" : "light"}
          />
        )
      )}
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
    padding: Spacing.md,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  calendarCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  timeSlotCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  timeSlotContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    gap: Spacing.xs,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: Spacing.xs,
  },
  clockIcon: {
    marginLeft: 4,
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addTimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  addTimeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  addTimeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  repeatCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  repeatText: {
    fontSize: 16,
    fontWeight: "600",
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  saveButton: {
    paddingVertical: Spacing.lg,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalButton: {
    fontSize: 16,
  },
  timePicker: {
    height: 200,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  bookedBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: "#ef4444",
    borderRadius: BorderRadius.sm,
  },
  bookedBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
