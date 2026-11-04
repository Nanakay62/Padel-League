import { useState } from 'react';

export interface BoxStandingItem {
  rank: number;
  pair_id: string;
  pair_name: string;
  points: number;
  matches_played: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  set_difference: number;
  game_difference: number;
  walkovers_given: number;
  zone: 'PROMOTION' | 'RELEGATION' | 'SAFE';
  rating?: number;
  venue?: string;
  form?: ('W' | 'L')[];
  is_user?: boolean;
}

export interface LeagueBoxItem {
  id: string;
  box_number: number;
  name: string;
  cycle_deadline?: string | null;
  standings: BoxStandingItem[];
}

export interface ScheduledChallenge {
  id: string;
  title: string;
  venue: string;
  court: string;
  time: string;
  challenger: {
    name: string;
    rung: number;
    rating: number;
  };
  defender: {
    name: string;
    rung: number;
    rating: number;
  };
  format: string;
  splitFeePerTeam: string;
  confirmed: boolean;
}

export interface AmericanoStanding {
  rank: number;
  name: string;
  club: string;
  points: number;
  weeklyDelta: number;
  avatarInitials: string;
  avatarUrl?: string;
}

export interface PrizePoolData {
  total: string;
  firstPlace: string;
  secondPlace: string;
  thirdPlace: string;
  sponsors: string;
}

export const DEFAULT_CHALLENGE: ScheduledChallenge = {
  id: 'ch-1',
  title: 'Official Rung Duel',
  venue: 'Accra Padel Club',
  court: 'Court 1 (Panoramic)',
  time: 'Thu, 6:00 PM',
  challenger: {
    name: 'Kwame A. & Partner',
    rung: 4,
    rating: 4.35,
  },
  defender: {
    name: 'Ekow B. & Farouk S.',
    rung: 3,
    rating: 4.41,
  },
  format: 'Best of 3',
  splitFeePerTeam: 'GH₵ 60.00 / team',
  confirmed: true,
};

export const SAMPLE_AMERICANO_STANDINGS: AmericanoStanding[] = [
  {
    rank: 1,
    name: 'Ama B.',
    club: 'Airport Residential Club',
    points: 342,
    weeklyDelta: 24,
    avatarInitials: 'AB',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBdJ_AXf-mJcoGNC0md_j8X81pNJ1bsbALj9_TnS0LWHswDOVOtsPw60mtjvNRcWUeWjhBxJn7ebAqBAbzkmgELRiabqId6MzQF7Rlh8PloC2zsLvh2nBqVaUuEAVkqnPRox7Cqs_FFpShZBbUVTV58G0eJYWPXs_grYFUN06m2tBNuue0plrqYamcVD1E7I1grisd6UfnKgnp8JyV5gxm7TbQMgqlZJmBHhMKBaGFZxyaex-blG_x4',
  },
  {
    rank: 2,
    name: 'Kwame A.',
    club: 'East Legon Padel Club',
    points: 318,
    weeklyDelta: 18,
    avatarInitials: 'KA',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuChdoKLE-f4CmKzK2tMLAw6UrDjgtJwpUm3LhYhXfJ9a5nTQrsTvzvzAkXXIbhltL5P7ofxYR684B3nvS2aQZcqOPXAjbx_A4AwaQH-mwuQpAPczmCXFdBKM9nWm3O2u8BtGLzehqCtsja5iOvncQolymEsDxtMVvDZSIgLBHzIigFvlVKLIilTppRkxpAdnDOdBnf6R5j1fUfIAUM1g1rg1ZoSWalfjDo-zRMGrPeFhDqmCDOM_bjA',
  },
  {
    rank: 3,
    name: 'Kofi M.',
    club: 'Cantonments Social Club',
    points: 295,
    weeklyDelta: 12,
    avatarInitials: 'KM',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxiOQXlV7-G2ByUtL6l3V0RtwXODAZOl1wVj1oWn-LdPFxkNyRenJm-4t7iyccq2_97f58PsUwRDGCex3Ngoz4HOKQDhicvXJFLQS_K6WAsf-Y4qXad_Ddxizs7CSaYK5ziGeHwjPuRoseeH5rpkTtepaP8xIx1a3ETu3S0SoOXHy8c_ei1OfHBqKWPou2DMZi2VauQbP3hFQ04HQ27CdfO2uBL8Wyepu-hnfqbloFbvjFBxrO_57O',
  },
];

export const DEFAULT_AMERICANO_STANDINGS = SAMPLE_AMERICANO_STANDINGS;

export const DEFAULT_PRIZE_POOL: PrizePoolData = {
  total: 'GH₵ 8,500.00',
  firstPlace: 'GH₵ 4,500',
  secondPlace: 'GH₵ 2,500',
  thirdPlace: 'GH₵ 1,500',
  sponsors: 'MTN MoMo • Telecel • Puma Energy Ghana',
};

export function useLeagueStandings(
  boxes: LeagueBoxItem[],
  onSelectBox?: (boxId: string) => void
) {
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(0);
  const currentBox = boxes[selectedBoxIndex] || boxes[0];

  const handleBoxSelect = (idx: number, boxId: string) => {
    setSelectedBoxIndex(idx);
    if (onSelectBox) {
      onSelectBox(boxId);
    }
  };

  return {
    selectedBoxIndex,
    setSelectedBoxIndex,
    currentBox,
    handleBoxSelect,
  };
}
