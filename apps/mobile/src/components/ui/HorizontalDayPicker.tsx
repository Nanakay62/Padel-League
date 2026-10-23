import React from 'react';
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

const DEFAULT_DAYS: DayItem[] = [
  { key: 'today', dayLabel: 'TODAY', dateNumber: '23', isToday: true },
  { key: 'tomorrow', dayLabel: 'TOM', dateNumber: '24' },
  { key: 'sat', dayLabel: 'SAT', dateNumber: '25' },
  { key: 'sun', dayLabel: 'SUN', dateNumber: '26' },
  { key: 'mon', dayLabel: 'MON', dateNumber: '27' },
  { key: 'tue', dayLabel: 'TUE', dateNumber: '28' },
  { key: 'wed', dayLabel: 'WED', dateNumber: '29' },
];

export function HorizontalDayPicker({
  days = DEFAULT_DAYS,
  selectedKey,
  selectedDayId,
  onSelectDay,
  testID,
}: HorizontalDayPickerProps) {
  const activeKey = selectedKey ?? selectedDayId ?? 'today';

  return (
    <View style={styles.wrapper} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
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
