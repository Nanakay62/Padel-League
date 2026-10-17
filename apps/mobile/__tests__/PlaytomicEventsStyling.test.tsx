import { renderRouter } from 'expo-router/testing-library';
import { Tokens } from '@/constants/theme';
import { computeContrastRatio } from './TokensContrast.test';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(60000);

describe('Playtomic Padel Styling and Blue Button Alignment', () => {
  it('enforces Tokens.colors.primary is brand blue with white text', () => {
    expect(Tokens.colors.primary).toBe('#1D4ED8');
    expect(Tokens.colors.textOnPrimary).toBe('#FFFFFF');
    expect(Tokens.colors.primaryForeground).toBe('#FFFFFF');
  });

  it('guarantees white text on primary blue button achieves WCAG AA contrast (>= 4.5:1)', () => {
    const ratio = computeContrastRatio(Tokens.colors.textOnPrimary, Tokens.colors.primary);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('renders Find Events screen with Playtomic padel cards, level badges, and blue CTA buttons', async () => {
    const { findAllByText, findByTestId } = await renderRouter('src/app', {
      initialUrl: '/play',
    });

    // 1. Host Event button is rendered
    expect(await findByTestId('find-events-host-btn')).toBeTruthy();

    // 2. Playtomic Padel Level badges are rendered on the cards
    const levelBadges = await findAllByText(/Level \d\.\d - \d\.\d/);
    expect(levelBadges.length).toBeGreaterThanOrEqual(1);

    // 3. View Session blue CTA buttons are rendered
    const viewButtons = await findAllByText('View Session');
    expect(viewButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('guarantees darker blue banner tokens exist with accessible contrast', () => {
    expect(Tokens.colors.brandBlueDark).toBe('#1E40AF');
    const whiteRatio = computeContrastRatio('#FFFFFF', Tokens.colors.brandBlueDark);
    expect(whiteRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA
    const mutedRatio = computeContrastRatio('#DBEAFE', Tokens.colors.brandBlueDark);
    expect(mutedRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA
  });

  it('verifies top search bar placement and removal of circled header, Live Circuit, and Accra Metro Series', async () => {
    const { findByPlaceholderText, queryByText } = await renderRouter('src/app', {
      initialUrl: '/play',
    });

    // 1. Search bar input is present
    const searchInput = await findByPlaceholderText('Search by title, format or club...');
    expect(searchInput).toBeTruthy();

    // 2. Circled subtitle "Discover and join matches" is removed
    expect(queryByText('Discover and join matches')).toBeNull();

    // 3. "Live Circuit" pill is removed
    expect(queryByText('Live Circuit')).toBeNull();

    // 4. "Accra Metro Series • Season 02" is removed
    expect(queryByText(/Accra Metro Series/i)).toBeNull();
  });
});
