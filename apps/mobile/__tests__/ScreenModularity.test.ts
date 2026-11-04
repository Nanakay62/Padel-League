import fs from 'fs';
import path from 'path';

describe('Screen Modularity and File Size Guardrails', () => {
  const root = path.resolve(__dirname, '..');

  const MAX_SCREEN_LINES = 600;

  const targetScreens = [
    'src/features/venues/VenueListScreen.tsx',
    'src/features/leagues/LeagueStandingsScreen.tsx',
    'src/features/auth/PhoneLoginScreen.tsx',
    'src/app/(tabs)/index.tsx',
  ];

  targetScreens.forEach((relativeScreenPath) => {
    it(`${relativeScreenPath} should not exceed ${MAX_SCREEN_LINES} lines`, () => {
      const fullPath = path.join(root, relativeScreenPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(MAX_SCREEN_LINES);
    });
  });

  const extractedModules = [
    // Venues
    'src/features/venues/components/VenueCard.tsx',
    'src/features/venues/components/VenueBookingModal.tsx',
    'src/features/venues/components/VenueFilterBar.tsx',
    'src/features/venues/hooks/useVenueFilters.ts',
    // Leagues
    'src/features/leagues/components/StandingsTable.tsx',
    'src/features/leagues/components/DivisionPillSelector.tsx',
    'src/features/leagues/hooks/useLeagueStandings.ts',
    // Auth
    'src/features/auth/components/PhoneAuthForm.tsx',
    'src/features/auth/components/OtpVerificationView.tsx',
    'src/features/auth/components/EmailAuthForm.tsx',
    // Home
    'src/features/home/components/NextMatchCard.tsx',
    'src/features/home/components/RatingSummaryCard.tsx',
    'src/features/home/components/SessionsGrid.tsx',
  ];

  extractedModules.forEach((relativeModulePath) => {
    it(`extracted module ${relativeModulePath} must exist and be modular (< 450 lines)`, () => {
      const fullPath = path.join(root, relativeModulePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(450);
    });
  });
});
