import { renderRouter } from 'expo-router/testing-library';
import { Tokens } from '@/constants/theme';
import { CircuitBanner } from '@/components/ui';
import { computeContrastRatio } from './TokensContrast.test';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(60000);

describe('CircuitBanner and Top Blue Banner Consistency across Player Tabs', () => {
  it('guarantees blue banner tokens have verified WCAG contrast and Events screen renders banner', async () => {
    // Verify token contrast
    const whiteRatio = computeContrastRatio(Tokens.colors.bannerBlueText, Tokens.colors.bannerBlueDark);
    expect(whiteRatio).toBeGreaterThanOrEqual(7.0); // WCAG AAA
    const mutedRatio = computeContrastRatio(Tokens.colors.bannerBlueTextMuted, Tokens.colors.bannerBlueDark);
    expect(mutedRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA

    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/events',
    });
    expect(await findByTestId('events-banner-card')).toBeTruthy();
  });

  it('renders blue banner card on Venues tab (/venues)', async () => {
    const { findByTestId, findByText } = await renderRouter('src/app', {
      initialUrl: '/venues',
    });

    const banner = await findByTestId('venues-banner-card');
    expect(banner).toBeTruthy();
    expect(await findByText('Accra Padel Clubs & Court Booking')).toBeTruthy();
  });

  it('renders blue banner card on Leagues tab (/leagues)', async () => {
    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/leagues',
    });

    const banner = await findByTestId('leagues-banner-card');
    expect(banner).toBeTruthy();
  });

  it('renders blue banner card on Ratings screen (/ratings)', async () => {
    const { findByTestId, findByText } = await renderRouter('src/app', {
      initialUrl: '/ratings',
    });

    const banner = await findByTestId('ratings-banner-card');
    expect(banner).toBeTruthy();
    expect(await findByText('Padel Ghana Official Player Rankings')).toBeTruthy();
  });

  it('renders blue banner card on Community tab (/community)', async () => {
    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/community',
    });

    const banner = await findByTestId('community-banner-card');
    expect(banner).toBeTruthy();
  });

  it('renders blue banner card on Profile tab (/profile)', async () => {
    const { findByTestId } = await renderRouter('src/app', {
      initialUrl: '/profile',
    });

    const banner = await findByTestId('profile-banner-card');
    expect(banner).toBeTruthy();
  });

  it('renders blue banner card on Partner Finder screen (/partners)', async () => {
    const { findByTestId, findByText } = await renderRouter('src/app', {
      initialUrl: '/partners',
    });

    const banner = await findByTestId('partners-banner-card');
    expect(banner).toBeTruthy();
    expect(await findByText('Find a Hitting Partner')).toBeTruthy();
  });

  it('renders blue banner card on Settings screen (/settings)', async () => {
    const { findByTestId, findByText } = await renderRouter('src/app', {
      initialUrl: '/settings',
    });

    const banner = await findByTestId('settings-banner-card');
    expect(banner).toBeTruthy();
    expect(await findByText('Settings & Performance')).toBeTruthy();
  });
});
