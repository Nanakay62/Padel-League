import { renderRouter } from 'expo-router/testing-library';

jest.mock('@/components/animated-icon', () => ({
  AnimatedSplashOverlay: () => null,
  AnimatedIcon: () => null,
}));

jest.setTimeout(60000);

describe('Community & Header Clean Layout Alignment', () => {
  it('renders Community tab cleanly without ACCRA PADEL NETWORK pill, COMMUNITY pill, or obsolete Phase 3 text', async () => {
    const { findByText, findAllByText, queryByText } = await renderRouter('src/app', {
      initialUrl: '/community',
    });

    // Main header and live feature sections must be present
    expect(await findByText('Accra Padel Community')).toBeTruthy();
    expect(await findByText('Find Hitting Partners')).toBeTruthy();
    const boxLeagues = await findAllByText('Accra Box Leagues & Ladders');
    expect(boxLeagues.length).toBeGreaterThanOrEqual(1);
    expect(await findByText('Ghana Padel Rating & Level Bands')).toBeTruthy();
    expect(await findByText('Club WhatsApp Channels')).toBeTruthy();

    // Verify obsolete pills and placeholders are strictly removed
    expect(queryByText('ACCRA PADEL NETWORK')).toBeNull();
    expect(queryByText('COMMUNITY')).toBeNull();
    expect(
      queryByText('Player matchmaking, rankings, and community groups arrive in Phase 3.')
    ).toBeNull();
  });

  it('renders Home tab without the Demo data badge', async () => {
    const { findByText, queryByText } = await renderRouter('src/app', {
      initialUrl: '/',
    });

    expect(await findByText('Good afternoon, Nana')).toBeTruthy();
    // Verify Demo data pill is absent
    expect(queryByText('Demo data')).toBeNull();
  });
});
