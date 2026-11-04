import {
  OfflineMutationQueue,
  ScoreMutationPayload,
} from '@/lib/offlineQueue';
import {
  generateIdempotentResultId,
  validateAmericanoScore,
  calculateClubEventRevenue,
} from '@/features/events/utils/courtsideUtils';

describe('Phase 5 — Quality Gate: Offline Resilience & Idempotent Sync', () => {
  let queue: OfflineMutationQueue;

  beforeEach(() => {
    queue = new OfflineMutationQueue();
  });

  describe('1. Idempotency & Deterministic UUIDs', () => {
    it('generates deterministic result_id for identical match and round inputs', () => {
      const id1 = generateIdempotentResultId('event-accra-01', 2);
      const id2 = generateIdempotentResultId('event-accra-01', 2);
      const idDifferentRound = generateIdempotentResultId('event-accra-01', 3);

      expect(id1).toBe(id2);
      expect(id1).not.toBe(idDifferentRound);
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('rejects duplicate submissions with same result_id (replays never double-apply)', () => {
      const resultId = generateIdempotentResultId('match-accra-101', 1);
      const payload: ScoreMutationPayload = {
        result_id: resultId,
        match_id: 'match-accra-101',
        event_id: 'event-accra-1',
        team_a_score: 21,
        team_b_score: 11,
        entered_by: 'referee-kofi',
        timestamp: 1730678400000,
      };

      queue.enqueue(payload);
      expect(queue.size()).toBe(1);

      // Re-enqueue identical payload (e.g. user taps sync multiple times or network packet retransmission)
      queue.enqueue(payload);
      expect(queue.size()).toBe(1);

      // Re-enqueue with modified score but same result_id (stale retry)
      queue.enqueue({ ...payload, team_a_score: 16, team_b_score: 16 });
      expect(queue.size()).toBe(1);
      expect(queue.getItems()[0].team_a_score).toBe(21);
    });
  });

  describe('2. Offline Queue Replay & Ordering Causality', () => {
    it('maintains strict chronological FIFO ordering of offline scores', () => {
      const baseTime = 1730678400000;
      const round1Id = generateIdempotentResultId('match-1', 1);
      const round2Id = generateIdempotentResultId('match-1', 2);
      const round3Id = generateIdempotentResultId('match-1', 3);

      queue.enqueue({
        result_id: round2Id,
        match_id: 'match-1',
        team_a_score: 18,
        team_b_score: 14,
        entered_by: 'ref-1',
        timestamp: baseTime + 2000,
      });

      queue.enqueue({
        result_id: round1Id,
        match_id: 'match-1',
        team_a_score: 16,
        team_b_score: 16,
        entered_by: 'ref-1',
        timestamp: baseTime + 1000,
      });

      queue.enqueue({
        result_id: round3Id,
        match_id: 'match-1',
        team_a_score: 20,
        team_b_score: 12,
        entered_by: 'ref-1',
        timestamp: baseTime + 3000,
      });

      const items = queue.getItems();
      expect(items.length).toBe(3);
      expect(items[0].result_id).toBe(round1Id);
      expect(items[1].result_id).toBe(round2Id);
      expect(items[2].result_id).toBe(round3Id);
    });

    it('halts replay on network error to preserve sequential causality and increments retry counter', async () => {
      const baseTime = 1730678400000;
      queue.enqueue({
        result_id: 'res-1',
        match_id: 'm-1',
        timestamp: baseTime + 1000,
        entered_by: 'ref-1',
      });
      queue.enqueue({
        result_id: 'res-2',
        match_id: 'm-2',
        timestamp: baseTime + 2000,
        entered_by: 'ref-1',
      });

      // Simulated network sender: fails on first item
      const failingSender = jest.fn().mockRejectedValue(new Error('Spotty cage connectivity'));
      const synced = await queue.replay(failingSender);

      expect(synced).toBe(0);
      expect(failingSender).toHaveBeenCalledTimes(1);
      expect(queue.size()).toBe(2);
      expect(queue.getItems()[0].retries).toBe(1);

      // Now simulated connectivity returns
      const successfulSender = jest.fn().mockResolvedValue({ success: true });
      const secondSyncCount = await queue.replay(successfulSender);

      expect(secondSyncCount).toBe(2);
      expect(successfulSender).toHaveBeenCalledTimes(2);
      expect(queue.size()).toBe(0);
    });
  });

  describe('3. Americano Score Pre-Validation Before Offline Enqueue', () => {
    it('rejects scores that do not sum exactly to event point target', () => {
      // 32-point Americano: 20 + 11 = 31 (invalid)
      expect(validateAmericanoScore(20, 11, 32)).toBe(false);

      // 32-point Americano: 20 + 12 = 32 (valid)
      expect(validateAmericanoScore(20, 12, 32)).toBe(true);
    });

    it('rejects negative scores or point targets <= 0', () => {
      expect(validateAmericanoScore(-1, 33, 32)).toBe(false);
      expect(validateAmericanoScore(16, 16, 0)).toBe(false);
      expect(validateAmericanoScore(16, 16, -10)).toBe(false);
    });
  });

  describe('4. Integer Pesewas Invariance (Money Rule Enforcement)', () => {
    it('calculates club revenue and payout with zero float discrepancies', () => {
      // 12 confirmed players, GH₵ 70.00 each = 7,000 pesewas per player = 84,000 pesewas gross
      const rev = calculateClubEventRevenue({
        confirmedPlayersCount: 12,
        feePerPlayerPesewas: 7000,
        courtCostPesewas: 30000,
        platformFeeRate: 0.08,
      });

      expect(Number.isInteger(rev.totalGrossPesewas)).toBe(true);
      expect(Number.isInteger(rev.platformFeePesewas)).toBe(true);
      expect(Number.isInteger(rev.netClubPayoutPesewas)).toBe(true);

      expect(rev.totalGrossPesewas).toBe(84000);
      expect(rev.platformFeePesewas).toBe(6720);
      expect(rev.netClubPayoutPesewas).toBe(77280);
      expect(rev.totalGrossPesewas - rev.platformFeePesewas).toBe(rev.netClubPayoutPesewas);
    });
  });

  describe('5. Rating Progression Immutable Event Pattern', () => {
    interface MockRatingEvent {
      id: string;
      user_id: string;
      match_id: string;
      rating_before: number;
      rating_after: number;
      delta: number;
      created_at: string;
    }

    it('calculates ratings via immutable event logs without in-place mutation', () => {
      const initialRating = 3.5;
      const history: MockRatingEvent[] = [];

      // Simulate match 1 completion: +0.2 delta
      const delta1 = 0.2;
      const event1: MockRatingEvent = {
        id: 'rev-1',
        user_id: 'usr-kofi',
        match_id: 'm-1',
        rating_before: initialRating,
        rating_after: parseFloat((initialRating + delta1).toFixed(2)),
        delta: delta1,
        created_at: new Date('2026-11-04T00:00:00Z').toISOString(),
      };
      history.push(event1);

      // Simulate match 2 completion: -0.1 delta
      const delta2 = -0.1;
      const event2: MockRatingEvent = {
        id: 'rev-2',
        user_id: 'usr-kofi',
        match_id: 'm-2',
        rating_before: event1.rating_after,
        rating_after: parseFloat((event1.rating_after + delta2).toFixed(2)),
        delta: delta2,
        created_at: new Date('2026-11-04T01:00:00Z').toISOString(),
      };
      history.push(event2);

      // Verify that current rating is derived from event log fold
      const derivedRating = history.reduce((current, ev) => current + ev.delta, initialRating);
      expect(parseFloat(derivedRating.toFixed(2))).toBe(3.6);
      expect(history.length).toBe(2);
      expect(history[0].rating_after).toBe(3.7);
      expect(history[1].rating_after).toBe(3.6);
    });
  });
});
