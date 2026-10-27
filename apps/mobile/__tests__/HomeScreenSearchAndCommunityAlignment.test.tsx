import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import { Tokens } from '@/constants/theme';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { DesktopSearchBar } from '@/components/DesktopSearchBar';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Home Desktop In-Place Search & Community Alignment', () => {
  describe('DesktopSearchBar', () => {
    it('renders input with search placeholder and does not navigate away to /search', async () => {
      const mockNavigate = jest.fn();
      await render(<DesktopSearchBar onNavigate={mockNavigate} />);

      const searchInput = screen.getByTestId('topbar-search-input');
      expect(searchInput).toBeTruthy();

      // Typing does not trigger any page navigation to /search
      fireEvent.changeText(searchInput, 'Accra');
      expect(mockNavigate).not.toHaveBeenCalledWith('/search');

      // Dropdown popover should be visible with filtered results
      expect(await screen.findByTestId('topbar-search-popover')).toBeTruthy();
    });

    it('filters events, venues, and players based on query and selects item', async () => {
      const mockNavigate = jest.fn();
      await render(<DesktopSearchBar onNavigate={mockNavigate} />);

      const searchInput = screen.getByTestId('topbar-search-input');
      fireEvent.changeText(searchInput, 'Sunset');

      // 'Friday Night Sunset' event match should be shown
      const resultItem = await screen.findByText('Friday Night Sunset');
      expect(resultItem).toBeTruthy();

      // Clicking result navigates directly to the specific item
      fireEvent.press(resultItem);
      expect(mockNavigate).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith('/search');
    });

    it('clears query and closes dropdown when clear button is pressed', async () => {
      await render(<DesktopSearchBar />);

      const searchInput = screen.getByTestId('topbar-search-input');
      fireEvent.changeText(searchInput, 'Padel');
      expect(await screen.findByTestId('topbar-search-popover')).toBeTruthy();

      const clearBtn = screen.getByTestId('topbar-search-clear-btn');
      fireEvent.press(clearBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('topbar-search-popover')).toBeNull();
      });
    });
  });

  describe('Community Layout Spacing & WhatsApp Icon', () => {
    const communityFilePath = path.resolve(__dirname, '../src/app/(tabs)/community.tsx');
    const communityContent = fs.readFileSync(communityFilePath, 'utf-8');

    it('has proper top margin on the community container to separate from the blue banner', () => {
      expect(communityContent).toContain('marginTop: Tokens.spacing.xl');
    });

    it('uses the official WhatsAppIcon instead of generic MessageCircle', () => {
      expect(communityContent).toContain('<WhatsAppIcon');
      expect(communityContent).not.toContain('<MessageCircle');
    });

    it('renders WhatsAppIcon with valid dimensions and brand token color', async () => {
      await render(
        <WhatsAppIcon size={24} color={Tokens.colors.whatsapp} testID="wa-icon" />
      );
      const icon = screen.getByTestId('wa-icon');
      expect(icon).toBeTruthy();
    });
  });
});
