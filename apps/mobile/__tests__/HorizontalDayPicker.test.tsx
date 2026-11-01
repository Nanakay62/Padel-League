import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HorizontalDayPicker, generateCurrentDays } from '@/components/ui/HorizontalDayPicker';

describe('HorizontalDayPicker Dynamic Date Generation', () => {
  it('generates 7 days dynamically with current date in Africa/Accra', () => {
    const fixedDate = new Date('2026-11-01T10:00:00Z'); // Sunday Nov 1, 2026
    const days = generateCurrentDays(fixedDate);

    expect(days).toHaveLength(7);

    // Day 0: TODAY
    expect(days[0]).toEqual({
      key: 'today',
      dayLabel: 'TODAY',
      dateNumber: '1',
      isToday: true,
    });

    // Day 1: TOMORROW (Monday Nov 2)
    expect(days[1]).toEqual({
      key: 'tomorrow',
      dayLabel: 'TOM',
      dateNumber: '2',
    });

    // Day 2: TUE Nov 3
    expect(days[2]).toEqual({
      key: 'tue',
      dayLabel: 'TUE',
      dateNumber: '3',
    });

    // Day 3: WED Nov 4
    expect(days[3]).toEqual({
      key: 'wed',
      dayLabel: 'WED',
      dateNumber: '4',
    });

    // Day 4: THU Nov 5
    expect(days[4]).toEqual({
      key: 'thu',
      dayLabel: 'THU',
      dateNumber: '5',
    });

    // Day 5: FRI Nov 6
    expect(days[5]).toEqual({
      key: 'fri',
      dayLabel: 'FRI',
      dateNumber: '6',
    });

    // Day 6: SAT Nov 7
    expect(days[6]).toEqual({
      key: 'sat',
      dayLabel: 'SAT',
      dateNumber: '7',
    });
  });

  it('renders dynamic today date by default when days prop is omitted', async () => {
    const onSelectDay = jest.fn();
    await render(<HorizontalDayPicker onSelectDay={onSelectDay} />);

    // Expected today's day number in Accra
    const expectedTodayNum = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Accra',
      day: 'numeric',
    }).format(new Date());

    expect(screen.getByText('TODAY')).toBeTruthy();
    expect(screen.getByText(expectedTodayNum)).toBeTruthy();

    // Selecting a day triggers onSelectDay
    const tomorrowBtn = screen.getByTestId('day-picker-item-tomorrow');
    fireEvent.press(tomorrowBtn);
    expect(onSelectDay).toHaveBeenCalledWith('tomorrow');
  });
});
