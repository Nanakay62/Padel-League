import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tokens, Typography } from '@/constants/theme';

export interface DayItem {
  key: string;
  dayLabel: string;
  dateNumber: string;
  isToday?: boolean;
}

export interface HorizontalDayPickerProps {
  days?: DayItem[];
  selectedKey?: string;
  selectedDayId?: string;
  onSelectDay: (key: string) => void;
  testID?: string;
}

export function generateCurrentDays(baseDate: Date = new Date()): DayItem[] {
  const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(baseDate.getTime() + idx * 24 * 60 * 60 * 1000);
    const dayNumber = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Accra',
      day: 'numeric',
    }).format(d);

    const dayOfWeekShort = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Accra',
      weekday: 'short',
    }).format(d);

    const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayOfWeekShort);
    const dayKey = weekdayKeys[weekdayIndex >= 0 ? weekdayIndex : 0];
    const dayLabel = weekdayLabels[weekdayIndex >= 0 ? weekdayIndex : 0];

    if (idx === 0) {
      return {
        key: 'today',
        dayLabel: 'TODAY',
        dateNumber: dayNumber,
        isToday: true,
      };
    }
    if (idx === 1) {
      return {
        key: 'tomorrow',
        dayLabel: 'TOM',
        dateNumber: dayNumber,
      };
    }
    return {
      key: dayKey,
      dayLabel: dayLabel,
      dateNumber: dayNumber,
    };
  });
}

export function HorizontalDayPicker({
  days,
  selectedKey,
  selectedDayId,
  onSelectDay,
  testID,
}: HorizontalDayPickerProps) {
  const resolvedDays = useMemo(() => (days && days.length > 0 ? days : generateCurrentDays()), [days]);
  const activeKey = selectedKey ?? selectedDayId ?? 'today';

  return (
    <View style={styles.wrapper} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {resolvedDays.map((day) => {
          const isSelected = day.key === activeKey;

          return (
            <TouchableOpacity
              key={day.key}
              activeOpacity={0.7}
              onPress={() => onSelectDay(day.key)}
              style={[
                styles.dayPill,
                isSelected ? styles.dayPillSelected : styles.dayPillUnselected,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${day.dayLabel} ${day.dateNumber}`}
              testID={`day-picker-item-${day.key}`}
            >
              <Text
                style={[
                  styles.dayLabel,
                  isSelected ? styles.dayLabelSelected : styles.dayLabelUnselected,
                ]}
              >
                {day.dayLabel}
              </Text>
              <Text
                style={[
                  styles.dateNumber,
                  isSelected ? styles.dateNumberSelected : styles.dateNumberUnselected,
                  Typography.tabularNums,
                ]}
              >
                {day.dateNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: Tokens.spacing.xs,
  },
  scrollContent: {
    gap: Tokens.spacing.sm,
    paddingHorizontal: 2,
  },
  dayPill: {
    width: 64,
    height: 60,
    borderRadius: Tokens.radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayPillSelected: {
    backgroundColor: Tokens.colors.dayPickerActiveBg,
    shadowColor: Tokens.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayPillUnselected: {
    backgroundColor: Tokens.colors.dayPickerInactiveBg,
    borderWidth: 1,
    borderColor: Tokens.colors.dayPickerInactiveBorder,
  },
  dayLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.xxs,
    letterSpacing: 0.5,
  },
  dayLabelSelected: {
    color: Tokens.colors.dayPickerActiveText,
  },
  dayLabelUnselected: {
    color: Tokens.colors.dayPickerInactiveSub,
  },
  dateNumber: {
    fontFamily: Typography.fontFamily.semibold,
    fontWeight: Tokens.fontWeight.semibold,
    fontSize: Tokens.fontSize.base,
    lineHeight: Tokens.lineHeight.base,
  },
  dateNumberSelected: {
    color: Tokens.colors.dayPickerActiveText,
  },
  dateNumberUnselected: {
    color: Tokens.colors.text,
  },
});
