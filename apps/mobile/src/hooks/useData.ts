/**
 * Data layer hooks for Padel Ghana Platform.
 * Provides typed hooks matching the backend API response shapes.
 * Returns { data, isMock: true, isLoading: false } while mocked.
 */

import { useAuth } from '@/context/AuthContext';

export interface MoneyBreakdown {
  court_share_pesewas: number;
  platform_fee_pesewas: number;
  total_price_pesewas: number;
}

export interface NextGameData {
  id: string;
  title: string;
  venue_name: string;
  venue_address: string;
  gps_address: string;
  start_time: string; // ISO 8601 UTC
  format: 'AMERICANO' | 'MEXICANO';
  court_count: number;
  point_target: number;
  planned_rounds: number;
  confirmed_players: number;
  max_players: number;
  level_name: string;
  level_min: number;
  level_max: number;
  pricing: MoneyBreakdown;
}

export interface EventItemData {
  id: string;
  title: string;
  venue_name: string;
  format: 'AMERICANO' | 'MEXICANO' | 'TEAM_AMERICANO';
  courts: number;
  point_target: number;
  start_time: string; // ISO 8601 UTC
  confirmed_count: number;
  max_players: number;
  seats_left: number;
  status: 'OPEN' | 'FULL' | 'LOOKING_FOR_FOURTH';
  level_name: string;
  level_min: number;
  level_max: number;
  pricing: MoneyBreakdown;
}

export interface PlayerRatingData {
  rating: number;
  min_range: number;
  max_range: number;
  reliability: number; // 0.0 - 1.0 (threshold: 0.85)
  category: string;
  delta_month: string;
  matches_played: number;
  matches_won: number;
}

export interface VenueItemData {
  id: string;
  name: string;
  location: string;
  rating: number;
  review_count: number;
  courts_count: number;
  court_type: string;
  min_price_pesewas: number;
}

export interface LeagueItemData {
  id: string;
  name: string;
  division: string;
  teams_count: number;
  status: 'LIVE' | 'NEXT_ROUND' | 'UPCOMING';
  badge_label?: string;
  start_date?: string;
}

export interface HookResult<T> {
  data: T;
  isMock: boolean;
  isLoading: boolean;
  error?: Error | null;
}

// Seed data (All money in integer pesewas, all timestamps in UTC ISO strings)
const SEED_NEXT_GAME: NextGameData = {
  id: 'evt-001',
  title: 'Thursday Americano',
  venue_name: 'Accra Padel Club',
  venue_address: 'Airport Residential Area, Accra',
  gps_address: 'GA-492-8012',
  start_time: '2026-10-08T18:00:00Z',
  format: 'AMERICANO',
  court_count: 2,
  point_target: 24,
  planned_rounds: 8,
  confirmed_players: 8,
  max_players: 12,
  level_name: 'Intermediate',
  level_min: 3.0,
  level_max: 4.0,
  pricing: {
    court_share_pesewas: 8000,
    platform_fee_pesewas: 500,
    total_price_pesewas: 8500,
  },
};

const SEED_EVENTS: EventItemData[] = [
  {
    id: 'evt-001',
    title: 'Thursday Americano',
    venue_name: 'Accra Padel Club',
    format: 'AMERICANO',
    courts: 2,
    point_target: 24,
    start_time: '2026-10-08T18:00:00Z',
    confirmed_count: 8,
    max_players: 12,
    seats_left: 4,
    status: 'OPEN',
    level_name: 'Intermediate',
    level_min: 3.0,
    level_max: 4.0,
    pricing: {
      court_share_pesewas: 8000,
      platform_fee_pesewas: 500,
      total_price_pesewas: 8500,
    },
  },
  {
    id: 'evt-002',
    title: 'Friday Mexicano',
    venue_name: 'East Legon Padel Club',
    format: 'MEXICANO',
    courts: 3,
    point_target: 32,
    start_time: '2026-10-09T19:00:00Z',
    confirmed_count: 10,
    max_players: 12,
    seats_left: 2,
    status: 'OPEN',
    level_name: 'Intermediate',
    level_min: 3.0,
    level_max: 4.0,
    pricing: {
      court_share_pesewas: 9000,
      platform_fee_pesewas: 500,
      total_price_pesewas: 9500,
    },
  },
  {
    id: 'evt-003',
    title: 'Saturday Americano',
    venue_name: 'Cantonments Club',
    format: 'AMERICANO',
    courts: 2,
    point_target: 24,
    start_time: '2026-10-10T16:00:00Z',
    confirmed_count: 7,
    max_players: 8,
    seats_left: 1,
    status: 'LOOKING_FOR_FOURTH',
    level_name: 'Advanced',
    level_min: 4.0,
    level_max: 5.0,
    pricing: {
      court_share_pesewas: 8500,
      platform_fee_pesewas: 500,
      total_price_pesewas: 9000,
    },
  },
];

const SEED_RATING: PlayerRatingData = {
  rating: 3.42,
  min_range: 3.0,
  max_range: 3.5,
  reliability: 0.82, // < 0.85 -> triggers Provisional display
  category: 'Intermediate',
  delta_month: '+0.08 this month',
  matches_played: 18,
  matches_won: 11,
};

const SEED_VENUES: VenueItemData[] = [
  {
    id: 'ven-001',
    name: 'Accra Padel Club',
    location: 'Airport Residential',
    rating: 4.8,
    review_count: 124,
    courts_count: 6,
    court_type: 'Indoor / Outdoor',
    min_price_pesewas: 18000, // GH₵ 180.00 / hour
  },
  {
    id: 'ven-002',
    name: 'East Legon Padel Center',
    location: 'East Legon, Accra',
    rating: 4.7,
    review_count: 89,
    courts_count: 4,
    court_type: 'Outdoor Panoramic',
    min_price_pesewas: 15000,
  },
  {
    id: 'ven-003',
    name: 'Cantonments Sports Club',
    location: 'Cantonments, Accra',
    rating: 4.9,
    review_count: 62,
    courts_count: 3,
    court_type: 'Indoor Air-conditioned',
    min_price_pesewas: 20000,
  },
];

const SEED_LEAGUES: LeagueItemData[] = [
  {
    id: 'lg-001',
    name: 'Accra Winter League',
    division: 'Division 2',
    teams_count: 6,
    status: 'LIVE',
    badge_label: 'Live',
  },
  {
    id: 'lg-002',
    name: 'East Legon Box League',
    division: 'Box 3',
    teams_count: 4,
    status: 'NEXT_ROUND',
    badge_label: 'Next Round',
  },
  {
    id: 'lg-003',
    name: 'Tema Open League',
    division: 'Division 3',
    teams_count: 8,
    status: 'UPCOMING',
    badge_label: 'Starts Oct 20',
    start_date: 'Oct 20',
  },
];

export function useNextGame(): HookResult<NextGameData> {
  return {
    data: SEED_NEXT_GAME,
    isMock: true,
    isLoading: false,
    error: null,
  };
}

export function useEvents(): HookResult<EventItemData[]> {
  return {
    data: SEED_EVENTS,
    isMock: true,
    isLoading: false,
    error: null,
  };
}

export function useRating(): HookResult<PlayerRatingData> {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user && user.level !== undefined) {
    const level = user.level;
    const min_range = Math.max(1.0, Math.floor(level * 2) / 2);
    const max_range = Math.min(7.0, min_range + 0.5);
    const reliability = user.reliability ?? (user.is_provisional ? 0.5 : 1.0);

    return {
      data: {
        rating: level,
        min_range,
        max_range,
        reliability,
        category: user.level_band || 'Intermediate',
        delta_month: user.is_provisional ? 'Provisional' : '+0.00 this month',
        matches_played: 0,
        matches_won: 0,
      },
      isMock: false,
      isLoading: false,
      error: null,
    };
  }

  return {
    data: SEED_RATING,
    isMock: true,
    isLoading: false,
    error: null,
  };
}

export function useVenues(): HookResult<VenueItemData[]> {
  return {
    data: SEED_VENUES,
    isMock: true,
    isLoading: false,
    error: null,
  };
}

export function useLeagues(): HookResult<LeagueItemData[]> {
  return {
    data: SEED_LEAGUES,
    isMock: true,
    isLoading: false,
    error: null,
  };
}
