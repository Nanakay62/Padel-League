import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  filterMatchesAtPlayerLevel,
  calculateSeatFeePesewas,
  generateWhatsAppShareText,
  type OpenMatchItem,
} from '@/features/home/utils/playTonightUtils';
import { PlayTonightFeed } from '@/features/home/components/PlayTonightFeed';
import { OpenMatchSeatModal } from '@/features/home/components/OpenMatchSeatModal';
import { PostMatchResultModal } from '@/features/home/components/PostMatchResultModal';

const SAMPLE_OPEN_MATCHES: OpenMatchItem[] = [
  {
    id: 'om-1',
    title: 'Evening Doubles Duel',
    venueName: 'Accra Padel Club',
    courtName: 'Court 1 (Panoramic)',
    timeDisplay: 'Today, 7:00 PM',
    targetLevel: 3.5,
    levelBandLabel: 'Intermediate (3.0 – 4.0)',
    courtCostPesewas: 24000,
    totalSeats: 4,
    confirmedPlayers: [
      { id: 'p1', name: 'Kwame A.', initials: 'KA', rating: 3.6 },
      { id: 'p2', name: 'Ama B.', initials: 'AB', rating: 3.4 },
    ],
  },
  {
    id: 'om-2',
    title: 'Beginner Open Hit',
    venueName: 'East Legon Padel Club',
    courtName: 'Court 3',
    timeDisplay: 'Today, 8:30 PM',
    targetLevel: 1.5,
    levelBandLabel: 'Beginner (1.0 – 2.0)',
    courtCostPesewas: 20000,
    totalSeats: 4,
    confirmedPlayers: [
      { id: 'p3', name: 'Kofi M.', initials: 'KM', rating: 1.5 },
    ],
  },
  {
    id: 'om-3',
    title: 'Advanced Circuit Prep',
    venueName: 'Cantonments Social Club',
    courtName: 'Center Court',
    timeDisplay: 'Tomorrow, 6:00 PM',
    targetLevel: 5.0,
    levelBandLabel: 'Advanced (4.5 – 5.5)',
    courtCostPesewas: 28000,
    totalSeats: 4,
    confirmedPlayers: [
      { id: 'p4', name: 'Farouk S.', initials: 'FS', rating: 5.2 },
    ],
  },
];

describe('Phase 3 — Core Padel Experience ("Play Tonight", Open Matches & Social Loop)', () => {
  describe('1. Pure Domain Logic & Maths (PlayTonightUtils)', () => {
    it('filters matches within ±0.5 of player rating (0.0–7.0 scale)', () => {
      const playerRating = 3.4;
      const matched = filterMatchesAtPlayerLevel(SAMPLE_OPEN_MATCHES, playerRating, 0.5);

      expect(matched).toHaveLength(1);
      expect(matched[0].id).toBe('om-1');
      expect(matched[0].targetLevel).toBe(3.5);
    });

    it('returns all matches when filter is disabled or tolerance is wide', () => {
      const playerRating = 3.4;
      const all = filterMatchesAtPlayerLevel(SAMPLE_OPEN_MATCHES, playerRating, null);
      expect(all).toHaveLength(3);
    });

    it('calculates seat fee strictly in integer pesewas without floating point drift', () => {
      // 24000 pesewas / 4 = 6000 pesewas (GH₵ 60.00)
      const perPlayer = calculateSeatFeePesewas(24000, 4);
      expect(perPlayer).toBe(6000);
      expect(Number.isInteger(perPlayer)).toBe(true);

      // Edge case: indivisible cost rounds safely to ceiling integer
      const indivisible = calculateSeatFeePesewas(10001, 3);
      expect(indivisible).toBe(3334);
      expect(Number.isInteger(indivisible)).toBe(true);
    });

    it('generates rich WhatsApp match result share text with scores and rating delta', () => {
      const shareText = generateWhatsAppShareText({
        playerName: 'Nana K.',
        partnerName: 'Ama B.',
        opponentTeam: 'Kwame A. & Kofi M.',
        scoreText: '6-4, 7-5',
        venueName: 'Accra Padel Club',
        newRating: 3.54,
        ratingDelta: 0.14,
      });

      expect(shareText).toContain('Padel Ghana Match Result');
      expect(shareText).toContain('Nana K. & Ama B.');
      expect(shareText).toContain('6-4, 7-5');
      expect(shareText).toContain('Accra Padel Club');
      expect(shareText).toContain('3.54');
      expect(shareText).toContain('+0.14');
    });
  });

  describe('2. PlayTonightFeed Component', () => {
    it('renders Play Tonight section with level toggle and match cards', async () => {
      const onSelectMatch = jest.fn();
      await render(
        <PlayTonightFeed
          matches={SAMPLE_OPEN_MATCHES}
          userRating={3.4}
          onSelectMatch={onSelectMatch}
        />
      );

      expect(screen.getByText('Play Tonight')).toBeTruthy();
      expect(screen.getByText('Evening Doubles Duel')).toBeTruthy();

      // Open seats indicator: 2 of 4 taken -> 2 spots left
      expect(screen.getByText('2 spots open')).toBeTruthy();

      // Join button
      const joinBtn = screen.getByTestId('join-match-om-1');
      expect(joinBtn).toBeTruthy();
      fireEvent.press(joinBtn);
      expect(onSelectMatch).toHaveBeenCalledWith(SAMPLE_OPEN_MATCHES[0]);
    });
  });

  describe('3. OpenMatchSeatModal Component', () => {
    it('displays 4-seat court diagram, MoMo provider rails, and integer pesewas split', async () => {
      const onConfirmReservation = jest.fn();
      const onClose = jest.fn();

      await render(
        <OpenMatchSeatModal
          visible={true}
          match={SAMPLE_OPEN_MATCHES[0]}
          onClose={onClose}
          onConfirmReservation={onConfirmReservation}
        />
      );

      // Venue and match title
      expect(screen.getByText('Accra Padel Club')).toBeTruthy();
      expect(screen.getAllByText('Court 1 (Panoramic)').length).toBeGreaterThanOrEqual(1);

      // MoMo provider selection (MTN MoMo, Telecel Cash, AT Money)
      expect(screen.getByText('MTN MoMo')).toBeTruthy();
      expect(screen.getByText('Telecel')).toBeTruthy();
      expect(screen.getByText('AT Money')).toBeTruthy();

      // Price split display
      expect(screen.getByText('GH₵ 60.00')).toBeTruthy();

      // Reserve seat action
      const reserveBtn = screen.getByTestId('reserve-seat-btn');
      expect(reserveBtn).toBeTruthy();
      fireEvent.press(reserveBtn);
      expect(onConfirmReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: 'om-1',
          provider: 'mtn',
          feePesewas: 6000,
        })
      );
    });
  });

  describe('4. PostMatchResultModal Component', () => {
    it('renders match victory, score, rating delta badge, and WhatsApp trigger', async () => {
      const onShareWhatsApp = jest.fn();
      const onPlayAgain = jest.fn();
      const onClose = jest.fn();

      await render(
        <PostMatchResultModal
          visible={true}
          matchTitle="Thursday Doubles"
          venueName="Accra Padel Club"
          score="21 – 17"
          isWinner={true}
          ratingBefore={3.40}
          ratingAfter={3.54}
          ratingDelta={0.14}
          onShareWhatsApp={onShareWhatsApp}
          onPlayAgain={onPlayAgain}
          onClose={onClose}
        />
      );

      expect(screen.getByText('Match Completed')).toBeTruthy();
      expect(screen.getByText('21 – 17')).toBeTruthy();
      expect(screen.getByText('+0.14')).toBeTruthy();
      expect(screen.getByText('3.54')).toBeTruthy();

      // WhatsApp share action
      const shareBtn = screen.getByTestId('whatsapp-share-btn');
      fireEvent.press(shareBtn);
      expect(onShareWhatsApp).toHaveBeenCalled();

      // Play again action
      const playAgainBtn = screen.getByTestId('play-again-btn');
      fireEvent.press(playAgainBtn);
      expect(onPlayAgain).toHaveBeenCalled();
    });
  });
});
