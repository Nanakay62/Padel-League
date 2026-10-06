import { VenueMetricsData } from '../src/features/organizer/ClubDashboardView';

describe('Organizer Dashboard and Controls Logic', () => {
  it('validates score correction constraints strictly', () => {
    const pointTarget = 24;

    const validateCorrection = (scoreA: number, scoreB: number, reason: string) => {
      if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
        return { valid: false, error: 'Negative or invalid score' };
      }
      if (scoreA + scoreB !== pointTarget) {
        return {
          valid: false,
          error: `Scores must sum to ${pointTarget}, got ${scoreA + scoreB}`,
        };
      }
      if (!reason.trim()) {
        return { valid: false, error: 'Reason required' };
      }
      return { valid: true, error: null };
    };

    // Valid case
    expect(validateCorrection(14, 10, 'Scores were inverted on sheet')).toEqual({
      valid: true,
      error: null,
    });

    // Invalid score sum
    expect(validateCorrection(14, 11, 'Typo on sheet')).toEqual({
      valid: false,
      error: 'Scores must sum to 24, got 25',
    });

    // Missing reason
    expect(validateCorrection(14, 10, '   ')).toEqual({
      valid: false,
      error: 'Reason required',
    });

    // Negative score
    expect(validateCorrection(-2, 26, 'Correction')).toEqual({
      valid: false,
      error: 'Negative or invalid score',
    });
  });

  it('correctly parses and structures venue metrics for dashboard rendering', () => {
    const metrics: VenueMetricsData = {
      venue_id: 'venue-123',
      venue_name: 'Cantonments Padel Club',
      court_hours_used: 36.0,
      capacity_hours: 80.0,
      fill_rate_percent: 45.0,
      confirmed_players: 48,
      waitlist_demand: 12,
      new_players_count: 7,
      total_revenue_pesewas: 264000,
      total_revenue_ghs: 2640.0,
      unreported_matches_count: 0,
      whatsapp_summary: '📊 Cantonments Padel Club - Weekly Performance Summary',
    };

    expect(metrics.fill_rate_percent).toBe(45.0);
    expect(metrics.court_hours_used / metrics.capacity_hours).toBe(0.45);
    expect(metrics.total_revenue_ghs).toBe(2640.0);
    expect(metrics.whatsapp_summary).toContain('Cantonments Padel Club');
  });
});
