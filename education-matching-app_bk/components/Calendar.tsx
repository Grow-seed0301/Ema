import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';

export type DayStatus = 'available' | 'selected' | 'unavailable';

export interface CalendarProps {
  currentMonth: Date;
  selectedDate: number | null;
  onDateSelect: (date: number) => void;
  onMonthChange: (date: Date) => void;
  unavailableDates?: number[];
  dayStatuses?: Record<number, DayStatus>;
  showDayIndicators?: boolean;
}

export function Calendar({
  currentMonth,
  selectedDate,
  onDateSelect,
  onMonthChange,
  unavailableDates = [],
  dayStatuses = {},
  showDayIndicators = false,
}: CalendarProps) {
  const { theme } = useTheme();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    onMonthChange(newDate);
  };

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Pressable
          style={styles.calendarNavBtn}
          onPress={handlePrevMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={24} color={theme.textSecondary} />
        </Pressable>
        <ThemedText style={styles.calendarMonthText}>
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </ThemedText>
        <Pressable
          style={styles.calendarNavBtn}
          onPress={handleNextMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.calendarDayNames}>
        {dayNames.map((day, index) => (
          <View key={day} style={styles.calendarDayNameCell}>
            <ThemedText
              style={[
                styles.calendarDayName,
                {
                  color:
                    index === 0
                      ? '#ef4444'
                      : index === 6
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              {day}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          const dayOfWeekIndex = index % 7;
          const isUnavailable = day ? unavailableDates.includes(day) : false;
          const isSelected = selectedDate === day;
          const dayStatus = day ? dayStatuses[day] : undefined;

          return (
            <Pressable
              key={index}
              style={styles.calendarDayCell}
              onPress={() => {
                if (day && !isUnavailable) {
                  onDateSelect(day);
                }
              }}
              disabled={!day || isUnavailable}
            >
              {day ? (
                <View style={styles.calendarDayContainer}>
                  <View
                    style={[
                      styles.calendarDay,
                      isSelected && { backgroundColor: theme.primary },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.calendarDayText,
                        isSelected && { color: '#ffffff' },
                        isUnavailable && { color: theme.border },
                        !isSelected &&
                          !isUnavailable &&
                          dayOfWeekIndex === 0 && { color: '#ef4444' },
                        !isSelected &&
                          !isUnavailable &&
                          dayOfWeekIndex === 6 && { color: theme.primary },
                      ]}
                    >
                      {day}
                    </ThemedText>
                  </View>
                  {showDayIndicators && dayStatus && dayStatus !== 'selected' && !isSelected && (
                    <View
                      style={[
                        styles.dayIndicator,
                        {
                          backgroundColor:
                            dayStatus === 'available'
                              ? '#10b981'
                              : dayStatus === 'unavailable'
                              ? '#ef4444'
                              : 'transparent',
                        },
                      ]}
                    />
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: BorderRadius.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calendarNavBtn: {
    padding: Spacing.xs,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  calendarDayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayName: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
