import { renderRouter, fireEvent, waitFor, act } from 'expo-router/testing-library';
import { router } from 'expo-router';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

describe('Home Screen Real Router Smoke Navigation Tests', () => {
  it('renders Home and verifies navigation to every destination screen', async () => {
    const { getByTestId, findByText } = await renderRouter('src/app', { initialUrl: '/' });

    // 1. Credit Balance -> /credits
    await waitFor(() => {
      expect(getByTestId('home-credit-balance-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-credit-balance-btn'));
    expect(
      await findByText('Credit balance and cancellation credits arrive with payments (Phase 5)')
    ).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 2. Courtside Live -> /events/evt-001/live
    await waitFor(() => {
      expect(getByTestId('home-courtside-live-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-courtside-live-btn'));
    expect(await findByText(/Thursday Americano \(evt-001\)/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 3. Find Events -> /events
    await waitFor(() => {
      expect(getByTestId('home-find-events-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-find-events-btn'));
    expect(await findByText('Friday Sunset Americano')).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 4. Box Leagues -> /leagues
    await waitFor(() => {
      expect(getByTestId('home-box-leagues-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-box-leagues-btn'));
    expect(await findByText(/Premier Box/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 5. Partner Finder -> /partners
    await waitFor(() => {
      expect(getByTestId('home-partner-finder-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-partner-finder-btn'));
    expect(await findByText(/Kojo Ansah/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 6. My Rating -> /ratings
    await waitFor(() => {
      expect(getByTestId('home-my-rating-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-my-rating-btn'));
    expect(await findByText(/Won Friday Americano final/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 7. Venues -> /venues
    await waitFor(() => {
      expect(getByTestId('home-venues-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-venues-btn'));
    expect(await findByText(/Accra City Padel Club/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 8. Settings -> /settings
    await waitFor(() => {
      expect(getByTestId('home-settings-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-settings-btn'));
    expect(await findByText(/Settings & Performance/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');

    // 9. Create Event -> /events/create
    await waitFor(() => {
      expect(getByTestId('home-create-event-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-create-event-btn'));
    expect(await findByText(/Host a Padel Session/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Akwaaba, Kwadwo 🎾');
  }, 30000);
});
