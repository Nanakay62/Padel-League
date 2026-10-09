import { renderRouter, fireEvent, waitFor, act } from 'expo-router/testing-library';
import { router } from 'expo-router';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(90000);

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
    await findByText('Good afternoon, Nana');

    // 2. View Session -> /events/evt-001
    await waitFor(() => {
      expect(getByTestId('home-view-session-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-view-session-btn'));
    expect(await findByText(/Confirmed Roster/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 3. Courtside Live -> /events/evt-001/live
    await waitFor(() => {
      expect(getByTestId('home-courtside-live-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-courtside-live-btn'));
    expect(await findByText(/Thursday Americano \(evt-001\)/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 4. Find Events / See All Sessions -> /play
    await waitFor(() => {
      expect(getByTestId('home-see-all-sessions-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-see-all-sessions-btn'));
    expect(await findByText('+ Host Event')).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 5. Box Leagues -> /leagues
    await waitFor(() => {
      expect(getByTestId('home-box-leagues-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-box-leagues-btn'));
    expect(await findByText(/Premier Box/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 6. Partner Finder -> /partners
    await waitFor(() => {
      expect(getByTestId('home-partner-finder-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-partner-finder-btn'));
    expect(await findByText(/Kojo Ansah/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 7. My Rating -> /ratings
    await waitFor(() => {
      expect(getByTestId('home-my-rating-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-my-rating-btn'));
    expect(await findByText(/Won Friday Americano final/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 8. Venues -> /venues
    await waitFor(() => {
      expect(getByTestId('home-venues-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-venues-btn'));
    expect(await findByText(/Accra City Padel Club/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 9. Settings -> /settings
    await waitFor(() => {
      expect(getByTestId('home-settings-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-settings-btn'));
    expect(await findByText(/Settings & Performance/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');

    // 10. Create Event -> /events/create
    await waitFor(() => {
      expect(getByTestId('home-create-event-btn')).toBeTruthy();
    });
    fireEvent.press(getByTestId('home-create-event-btn'));
    expect(await findByText(/Host a Padel Session/i)).toBeTruthy();

    act(() => {
      router.replace('/' as any);
    });
    await findByText('Good afternoon, Nana');
  }, 90000);
});
