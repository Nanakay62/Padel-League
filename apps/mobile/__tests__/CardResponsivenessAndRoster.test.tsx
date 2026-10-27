import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PlayerSlotRoster } from '@/components/ui/PlayerSlotRoster';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

describe('Card Responsiveness & PlayerSlotRoster Layout', () => {
  it('renders Americano roster with responsive layout, player quota, and contained join button', async () => {
    const handleJoin = jest.fn();

    await render(
      <PlayerSlotRoster
        mode="americano"
        filledSlots={[
          { name: 'K. Mensah', level: '3.8' },
          { name: 'A. Osei', level: '3.2' },
          { name: 'N. Asante', level: '3.5' },
          { name: 'P. Danquah', level: '3.7' },
        ]}
        totalSlots={16}
        confirmedCount={14}
        emptySlotLabel="Join"
        onPressEmpty={handleJoin}
        testID="test-americano-roster"
      />
    );

    // Quota text
    expect(screen.getByText('14/16 players')).toBeTruthy();
    expect(screen.getByText('2 spots left')).toBeTruthy();

    // Initials of visible avatars
    expect(screen.getByText('KM')).toBeTruthy();
    expect(screen.getByText('AO')).toBeTruthy();
    expect(screen.getByText('NA')).toBeTruthy();
    expect(screen.getByText('PD')).toBeTruthy();

    // Contained Join button
    const joinBtn = screen.getByText('Join');
    expect(joinBtn).toBeTruthy();

    fireEvent.press(joinBtn);
    expect(handleJoin).toHaveBeenCalledTimes(1);
  });

  it('renders singular "1 spot left" when only one slot remains', async () => {
    await render(
      <PlayerSlotRoster
        mode="americano"
        filledSlots={[
          { name: 'K. Mensah', level: '4.2' },
          { name: 'D. Boateng', level: '3.9' },
          { name: 'S. Addo', level: '4.0' },
          { name: 'E. Mensah', level: '4.1' },
        ]}
        totalSlots={8}
        confirmedCount={7}
        emptySlotLabel="Join"
        onPressEmpty={jest.fn()}
      />
    );

    expect(screen.getByText('7/8 players')).toBeTruthy();
    expect(screen.getByText('1 spot left')).toBeTruthy();
  });

  it('renders court mode for 4-player matches with 4 slots', async () => {
    const handleJoinCourt = jest.fn();

    await render(
      <PlayerSlotRoster
        mode="court"
        filledSlots={[
          { name: 'Kofi A.', level: '3.6' },
          { name: 'Nana K.', level: '3.4' },
          { name: 'Yaw B.', level: '3.8' },
        ]}
        totalSlots={4}
        emptySlotLabel="Open"
        onPressEmpty={handleJoinCourt}
      />
    );

    expect(screen.getByText('Kofi')).toBeTruthy();
    expect(screen.getByText('Nana')).toBeTruthy();
    expect(screen.getByText('Yaw')).toBeTruthy();
    expect(screen.getByText('Open')).toBeTruthy();

    fireEvent.press(screen.getByText('Open'));
    expect(handleJoinCourt).toHaveBeenCalledTimes(1);
  });
});
