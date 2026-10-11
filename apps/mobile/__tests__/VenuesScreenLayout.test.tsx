import { renderRouter } from 'expo-router/testing-library';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(60000);

describe('VenuesScreen Layout and Header Alignment', () => {
  it('renders clean header without duplicate titles or unnecessary pills', async () => {
    const { findByText, queryByText } = await renderRouter('src/app', { initialUrl: '/venues' });

    // The main heading is present
    expect(await findByText('Accra Padel Clubs & Court Booking')).toBeTruthy();

    // The unnecessary copy requested to be removed must be absent
    expect(queryByText('Airport Residential, East Legon & Cantonments')).toBeNull();
    expect(queryByText('Accra Circuit Live')).toBeNull();
    expect(queryByText('• Instant MTN / Telecel MoMo Confirmation')).toBeNull();
    expect(queryByText('Accra Padel Clubs & Booking')).toBeNull();
  });

  it('renders View club button cleanly for each club card', async () => {
    const { findAllByText } = await renderRouter('src/app', { initialUrl: '/venues' });

    // View club button for clubs
    const viewClubButtons = await findAllByText('View club');
    expect(viewClubButtons.length).toBeGreaterThanOrEqual(1);
  });
});
