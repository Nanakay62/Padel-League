import { renderRouter } from 'expo-router/testing-library';
import { Tokens } from '@/constants/theme';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(60000);

describe('HomeScreen Stitch Design Alignment', () => {
  it('exposes all semantic tokens required by the Stitch design system', () => {
    const colors = Tokens.colors as any;
    expect(colors.surfaceContainerLow).toBe('#F1F4F6');
    expect(colors.surfaceContainer).toBe('#EBEEF1');
    expect(colors.surfaceContainerHighest).toBe('#E0E3E5');
    expect(colors.openBadgeBg).toBe('#D1FADF');
    expect(colors.openBadgeText).toBe('#027A48');
    expect(colors.needsFourthBg).toBe('#FFEDD5');
    expect(colors.needsFourthText).toBe('#C2410C');
    expect(colors.activeRoundBg).toBe('#FEF9E7');
    expect(colors.activeRoundBorder).toBe('#FCE8A3');
    expect(colors.activeRoundText).toBe('#8D6B00');
  });

  it('renders Hero Banner with authentic Stitch text and no cluttered bottom pills', async () => {
    const { findByText, queryByText } = await renderRouter('src/app', { initialUrl: '/' });
    expect(await findByText('Meet. Play. Build the community.')).toBeTruthy();
    expect(
      await findByText(
        'Accra’s dedicated circuit connecting players and clubs across Airport Residential, East Legon, and Cantonments.'
      )
    ).toBeTruthy();
    expect(await findByText('ACCRA PADEL CIRCUIT')).toBeTruthy();
    expect(await findByText('Community Open Play')).toBeTruthy();

    // Verify removed pills
    expect(queryByText('1,240+ Active Players')).toBeNull();
    expect(queryByText('12+ Partner Clubs')).toBeNull();
  });

  it('renders "Your Next Game" with top-right price, 3-column specs, and view session button', async () => {
    const { findByText, findAllByText, getByTestId } = await renderRouter('src/app', { initialUrl: '/' });
    expect(await findByText('YOUR NEXT GAME')).toBeTruthy();
    const timeElements = await findAllByText('Thu, 6:00 PM');
    expect(timeElements.length).toBeGreaterThanOrEqual(1);
    const gameTitles = await findAllByText('Thursday Americano');
    expect(gameTitles.length).toBeGreaterThanOrEqual(1);
    expect(await findByText('Confirmed')).toBeTruthy();
    expect(await findByText('Accra Padel Club • Court 2 & 3')).toBeTruthy();
    expect(await findByText('Paid via MTN MoMo')).toBeTruthy();
    expect(await findByText('Level')).toBeTruthy();
    expect(await findByText('Intermediate 3.0-4.0')).toBeTruthy();
    const capacityLabels = await findAllByText('Capacity');
    expect(capacityLabels.length).toBeGreaterThanOrEqual(1);
    expect(await findByText('8/12 players')).toBeTruthy();
    const formatLabels = await findAllByText('Format');
    expect(formatLabels.length).toBeGreaterThanOrEqual(1);
    expect(await findByText('Timed Americano (21 pts)')).toBeTruthy();
    expect(await findByText('Airport Residential Area, Accra')).toBeTruthy();
    expect(getByTestId('home-view-session-btn')).toBeTruthy();
  });

  it('renders "Your Rating" with calculated value, metric tiles, and full stats link', async () => {
    const { findByText, findAllByText, getByTestId } = await renderRouter('src/app', { initialUrl: '/' });
    expect(await findByText('YOUR RATING')).toBeTruthy();
    expect(await findByText('Provisional')).toBeTruthy();
    expect(await findByText('Accra Metro Skill Index')).toBeTruthy();
    expect(await findByText('3.40')).toBeTruthy();
    expect(await findByText('Calculated')).toBeTruthy();
    expect(await findByText('Rating Reliability')).toBeTruthy();
    expect(await findByText('82% reliability')).toBeTruthy();
    const matchesElements = await findAllByText('Matches');
    expect(matchesElements.length).toBeGreaterThanOrEqual(1);
    expect(await findByText('14')).toBeTruthy();
    expect(await findByText('Win rate')).toBeTruthy();
    expect(await findByText('64%')).toBeTruthy();
    expect(await findByText('Last update: 2 days ago')).toBeTruthy();
    expect(getByTestId('home-my-rating-btn')).toBeTruthy();
  });

  it('renders "Play near you" with 3 session cards and outline view details buttons', async () => {
    const { findByText, findAllByText, getByTestId } = await renderRouter('src/app', { initialUrl: '/' });
    expect(await findByText('Play near you')).toBeTruthy();
    expect(await findByText('Open sessions with available slots this week')).toBeTruthy();
    expect(getByTestId('home-see-all-sessions-btn')).toBeTruthy();

    expect(await findByText('Friday Night Sunset')).toBeTruthy();
    expect(await findByText('Saturday Morning Sprint')).toBeTruthy();
    expect(await findByText('Sunday Morning Coffee & Padel')).toBeTruthy();

    const perPlayerLabels = await findAllByText('Per player');
    expect(perPlayerLabels.length).toBe(3);
    const viewDetailsBtns = await findAllByText('View details');
    expect(viewDetailsBtns.length).toBe(3);
  });

  it('renders "Upcoming leagues" with stacked rows, badges, stats, and action buttons', async () => {
    const { findByText, getByTestId } = await renderRouter('src/app', { initialUrl: '/' });
    expect(await findByText('Upcoming leagues')).toBeTruthy();
    expect(await findByText('Official ranking tournaments across the circuit')).toBeTruthy();
    expect(getByTestId('home-see-all-leagues-btn')).toBeTruthy();

    // League 1
    expect(await findByText('Accra Metro Premier League')).toBeTruthy();
    expect(await findByText('Active • Round 6')).toBeTruthy();
    expect(await findByText('Season 2 • 16 registered pairs • Cantonments & Airport')).toBeTruthy();
    expect(await findByText('Kwame A. / Nana K.')).toBeTruthy();
    expect(await findByText('GH₵ 4,500.00')).toBeTruthy();
    expect(await findByText('Standings')).toBeTruthy();

    // League 2
    expect(await findByText('East Legon Americano Cup')).toBeTruthy();
    expect(await findByText('Starts Nov 15')).toBeTruthy();
    expect(await findByText('Individual format • 32 player quota • East Legon Padel Club')).toBeTruthy();
    expect(await findByText('24/32 registered')).toBeTruthy();
    expect(await findByText('GH₵ 350.00')).toBeTruthy();
    expect(await findByText('Register')).toBeTruthy();

    // League 3
    expect(await findByText('Cantonments Corporate Ladder')).toBeTruthy();
    expect(await findByText('Rolling Season')).toBeTruthy();
    expect(await findByText('Challenge-based weekly matches • 20 Corporate Teams')).toBeTruthy();
    expect(await findByText('Ecobank Accra')).toBeTruthy();
    expect(await findByText('Weekly')).toBeTruthy();
    expect(await findByText('View ladder')).toBeTruthy();
  });
});
