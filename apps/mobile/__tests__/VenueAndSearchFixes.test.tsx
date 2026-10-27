import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import fs from 'fs';
import path from 'path';
import { CheckoutModal } from '@/features/billing/CheckoutModal';
import { VenueListScreen } from '@/features/venues/VenueListScreen';
import { SAMPLE_VENUES } from '@/app/venues/index';

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

describe('Venue Booking, Day Filtering, and Search Polish', () => {
  describe('CheckoutModal payment method copy', () => {
    it('renders MoMo / Card without (Paystack)', async () => {
      await render(
        <CheckoutModal
          visible={true}
          eventTitle="Sunset Americano"
          courtFeePesewas={8000}
          platformFeePesewas={500}
          onClose={jest.fn()}
          onInitiatePayment={jest.fn()}
          onCheckOrderStatus={jest.fn()}
          onPaymentConfirmed={jest.fn()}
        />
      );

      // Must find "MoMo / Card"
      expect(screen.getByText('MoMo / Card')).toBeTruthy();
      // Must NOT contain "(Paystack)"
      expect(screen.queryByText(/Paystack/i)).toBeNull();
    });
  });

  describe('VenueListScreen court reflection & dynamic rates', () => {
    it('reflects selected venue in configuring court header and allows selecting different courts', async () => {
      await render(<VenueListScreen venues={SAMPLE_VENUES} />);

      // Accra City Padel Club is selected by default
      expect(screen.getByText('Accra City Padel Club')).toBeTruthy();

      // Court options should be visible for the selected venue
      expect(screen.getAllByText(/Court 1 \(Panoramic\)/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Court 2 (Center Court)')).toBeTruthy();

      // Selecting Court 2 updates configuring court session and pricing
      const court2Btn = screen.getByTestId('court-select-c2');
      await act(async () => {
        fireEvent.press(court2Btn);
      });

      // The configuring header should reflect Court 2
      expect(screen.getByTestId('active-court-name').props.children).toContain('Court 2');
    });

    it('changes total payable when different venues or courts with different rates are selected', async () => {
      await render(<VenueListScreen venues={SAMPLE_VENUES} />);

      // Default rate for Accra City Padel (Court 1: GH₵ 120/hr, duration 90m = 180 + 20 light + 65 balls = 265 or duration 60m)
      const initialTotal = screen.getByTestId('total-payable-amount');
      expect(initialTotal).toBeTruthy();
      const initialAmountText = [...initialTotal.props.children];

      // Select East Legon Padel Club (Base rate GH₵ 110/hr)
      const eastLegonCard = screen.getByTestId('venue-card-v2');
      await act(async () => {
        fireEvent.press(eastLegonCard);
      });

      // Total payable amount should reflect the new venue's rate
      const updatedTotal = screen.getByTestId('total-payable-amount');
      expect(updatedTotal.props.children).not.toEqual(initialAmountText);
    });
  });

  describe('Search box styling & zero outlines', () => {
    it('defines searchBarContainer and searchInput styles in events/index.tsx', () => {
      const eventsFilePath = path.resolve(__dirname, '../src/app/events/index.tsx');
      const eventsContent = fs.readFileSync(eventsFilePath, 'utf-8');

      expect(eventsContent).toContain('searchBarContainer:');
      expect(eventsContent).toContain('searchInput:');
    });

    it('contains global CSS reset preventing browser black focus outlines', () => {
      const globalCssPath = path.resolve(__dirname, '../src/global.css');
      const globalCssContent = fs.readFileSync(globalCssPath, 'utf-8');

      expect(globalCssContent).toContain('outline: none !important');
    });
  });
});
