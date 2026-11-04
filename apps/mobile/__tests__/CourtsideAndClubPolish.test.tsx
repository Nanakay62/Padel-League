import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { Tokens } from '@/constants/theme';
import {
  validateAmericanoScore,
  generateIdempotentResultId,
  calculateClubEventRevenue,
} from '@/features/events/utils/courtsideUtils';
import { CourtsideScoreKeeper } from '@/features/events/components/CourtsideScoreKeeper';
import { EventTvDisplay } from '@/features/events/components/EventTvDisplay';
import { ClubRevenueSummary } from '@/features/events/components/ClubRevenueSummary';

describe('Phase 4 — Courtside & Club Polish', () => {
  describe('1. Courtside Domain Rules & Maths (courtsideUtils)', () => {
    it('enforces that Americano scores add up exactly to event point_target', () => {
      expect(validateAmericanoScore(14, 10, 24)).toBe(true);
      expect(validateAmericanoScore(12, 12, 24)).toBe(true);
      expect(validateAmericanoScore(24, 0, 24)).toBe(true);

      // Fails if sum doesn't equal point target
      expect(validateAmericanoScore(15, 10, 24)).toBe(false);
      expect(validateAmericanoScore(10, 10, 24)).toBe(false);
      expect(validateAmericanoScore(-1, 25, 24)).toBe(false);
    });

    it('generates a valid idempotent client result_id UUID for offline-safe recording', () => {
      const id1 = generateIdempotentResultId('m-1', 1);
      const id2 = generateIdempotentResultId('m-1', 1);
      const id3 = generateIdempotentResultId('m-2', 1);

      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
      // Deterministic idempotency for identical match and round
      expect(id1).toBe(id2);
      expect(id1).not.toBe(id3);
    });

    it('calculates club event revenue strictly in integer pesewas without floating points', () => {
      // 12 players paying 6000 pesewas each = 72000 pesewas total revenue
      const revenue = calculateClubEventRevenue({
        confirmedPlayersCount: 12,
        feePerPlayerPesewas: 6000,
        courtCostPesewas: 60000,
        platformFeeRate: 0.1, // 10%
      });

      expect(revenue.totalGrossPesewas).toBe(72000);
      expect(revenue.platformFeePesewas).toBe(7200);
      expect(revenue.netClubPayoutPesewas).toBe(64800);
      expect(Number.isInteger(revenue.netClubPayoutPesewas)).toBe(true);
    });
  });

  describe('2. CourtsideScoreKeeper Component', () => {
    it('enforces 64pt minimum stepper size for one-handed courtside use', async () => {
      const onSubmit = jest.fn();
      await render(
        <CourtsideScoreKeeper
          matchId="m-1"
          courtNumber={1}
          teamANames={['Nana K.', 'Kofi M.']}
          teamBNames={['Ama B.', 'Daniel K.']}
          pointTarget={24}
          onSubmitScore={onSubmit}
        />
      );

      const plusBtn = screen.getByTestId('stepper-plus-a');
      expect(plusBtn).toBeTruthy();
      const flatStyle = Array.isArray(plusBtn.props.style)
        ? Object.assign({}, ...plusBtn.props.style.filter(Boolean))
        : plusBtn.props.style;

      expect(flatStyle.height).toBeGreaterThanOrEqual(Tokens.touch.minStepper);
      expect(flatStyle.height).toBeGreaterThanOrEqual(64);
    });

    it('submits exact scores with deterministic idempotent result_id', async () => {
      const onSubmit = jest.fn();
      await render(
        <CourtsideScoreKeeper
          matchId="m-101"
          roundNumber={2}
          courtNumber={2}
          teamANames={['Nana K.', 'Kofi M.']}
          teamBNames={['Ama B.', 'Daniel K.']}
          pointTarget={24}
          onSubmitScore={onSubmit}
        />
      );

      // Tap submit
      const submitBtn = screen.getByTestId('courtside-submit-score-btn');
      fireEvent.press(submitBtn);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          matchId: 'm-101',
          scoreA: expect.any(Number),
          scoreB: expect.any(Number),
          resultId: expect.any(String),
        })
      );
    });
  });

  describe('3. EventTvDisplay Component', () => {
    it('renders tournament leaderboard and court assignments for TV lounge displays', async () => {
      await render(
        <EventTvDisplay
          eventName="Accra Americano Masters"
          venueName="Accra Padel Club"
          currentRound={3}
          totalRounds={8}
          courts={[
            { courtNumber: 1, teamA: 'Nana / Kofi', teamB: 'Ama / Daniel', score: '12 - 12' },
            { courtNumber: 2, teamA: 'Abena / Yaw', teamB: 'Akua / Kwaku', score: '14 - 10' },
          ]}
          leaderboard={[
            { rank: 1, name: 'Nana Kwame', points: 42 },
            { rank: 2, name: 'Ama Boateng', points: 38 },
          ]}
        />
      );

      expect(screen.getByText('Accra Americano Masters')).toBeTruthy();
      expect(screen.getByText('Nana / Kofi')).toBeTruthy();
      expect(screen.getByText('Ama / Daniel')).toBeTruthy();
      expect(screen.getByText('Court 1')).toBeTruthy();
    });
  });

  describe('4. ClubRevenueSummary Component', () => {
    it('renders fill-rate, gross GHS revenue, and net payout in integer pesewas', async () => {
      await render(
        <ClubRevenueSummary
          eventName="Thursday Open Americano"
          maxCapacity={16}
          confirmedPlayersCount={14}
          feePerPlayerPesewas={6000}
          courtCostPesewas={70000}
          platformFeeRate={0.08}
        />
      );

      expect(screen.getByText('14/16 (88%)')).toBeTruthy();
      // Gross: 14 * 60 = 840 GHS (appears in KPI tile and breakdown)
      expect(screen.getAllByText('GH₵ 840.00').length).toBeGreaterThanOrEqual(1);
      // Net: 840.00 - 8% (67.20) = 772.80 GHS
      expect(screen.getByText('GH₵ 772.80')).toBeTruthy();
    });
  });
});
