import fs from 'fs';
import path from 'path';
import { Tokens } from '@/constants/theme';
import { SAMPLE_VENUES } from '@/app/venues/index';
import { SAMPLE_AMERICANO_STANDINGS } from '@/features/leagues/LeagueStandingsScreen';

describe('Mica Dark Shell & Media Integration Tests', () => {
  it('defines dark charcoal sidebar theme tokens according to Stitch specification', () => {
    const colors = Tokens.colors as any;
    expect(colors.sidebarBackground).toBe('#0B0F0E');
    expect(colors.sidebarBorder).toBe('#1F2426');
    expect(colors.sidebarText).toBe('#FFFFFF');
    expect(colors.sidebarTextMuted).toBe('#9BA2A6');
    expect(colors.sidebarItemActiveBg).toBe('rgba(0, 200, 83, 0.12)');
    expect(colors.sidebarQuickActionBg).toBe('rgba(255, 255, 255, 0.06)');
    expect(colors.sidebarQuickActionBorder).toBe('#25302C');
  });

  it('configures global.css desktop-sidebar with dark background and border', () => {
    const cssPath = path.resolve(__dirname, '../src/global.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toContain('background-color: #0B0F0E');
    expect(css).toContain('border-right: 1px solid #1F2426');
  });

  it('has dedicated tab route files for venues and credits inside (tabs)', () => {
    const tabsDir = path.resolve(__dirname, '../src/app/(tabs)');
    expect(fs.existsSync(path.join(tabsDir, 'venues.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(tabsDir, 'credits.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(tabsDir, 'leagues.tsx'))).toBe(true);
  });

  it('includes authentic photographic image URLs for all venues', () => {
    expect(SAMPLE_VENUES.length).toBeGreaterThan(0);
    SAMPLE_VENUES.forEach((venue) => {
      expect(venue.imageUrl).toBeDefined();
      expect(venue.imageUrl).toMatch(/^https?:\/\//);
    });
  });

  it('includes authentic player portrait avatar URLs for Americano standings', () => {
    expect(SAMPLE_AMERICANO_STANDINGS.length).toBeGreaterThan(0);
    SAMPLE_AMERICANO_STANDINGS.forEach((standing) => {
      expect(standing.avatarUrl).toBeDefined();
      expect(standing.avatarUrl).toMatch(/^https?:\/\//);
    });
  });

  it('includes authentic Stitch sunset padel court photo for Home hero banner', () => {
    const { HOME_HERO_IMAGE_URL } = require('@/app/(tabs)/index');
    expect(HOME_HERO_IMAGE_URL).toBeDefined();
    expect(HOME_HERO_IMAGE_URL).toContain('googleusercontent.com');
  });

  it('does not have borderLeft or green edge outlines on sidebar navigation buttons', () => {
    const componentPath = path.resolve(__dirname, '../src/components/app-tabs.web.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    expect(content).not.toContain('borderLeft: is');
    expect(content).not.toContain('3px solid ${Tokens.colors.primary}');
  });
});
