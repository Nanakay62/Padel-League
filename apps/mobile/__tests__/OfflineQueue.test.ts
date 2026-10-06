import { OfflineMutationQueue, ScoreMutationPayload } from '../src/lib/offlineQueue';

describe('Offline Mutation Queue (Courtside Score Sync)', () => {
  let queue: OfflineMutationQueue;

  beforeEach(() => {
    queue = new OfflineMutationQueue();
  });

  it('enqueues a courtside score submission', () => {
    const payload: ScoreMutationPayload = {
      result_id: 'offline-uuid-1',
      match_id: 'match-101',
      event_id: 'event-01',
      team_a_score: 14,
      team_b_score: 10,
      entered_by: 'Player One',
      timestamp: Date.now(),
    };

    queue.enqueue(payload);
    expect(queue.size()).toBe(1);
    expect(queue.getItems()[0].result_id).toBe('offline-uuid-1');
  });

  it('deduplicates submissions with the exact same result_id (idempotency)', () => {
    const payload: ScoreMutationPayload = {
      result_id: 'offline-uuid-dup',
      match_id: 'match-102',
      event_id: 'event-01',
      team_a_score: 16,
      team_b_score: 8,
      entered_by: 'Player One',
      timestamp: Date.now(),
    };

    queue.enqueue(payload);
    queue.enqueue(payload); // Re-submitted in airplane mode

    expect(queue.size()).toBe(1);
  });

  it('replays queue items in FIFO order and clears successful mutations', async () => {
    const p1: ScoreMutationPayload = {
      result_id: 'res-1',
      match_id: 'm-1',
      team_a_score: 12,
      team_b_score: 12,
      entered_by: 'Player One',
      timestamp: 1000,
    };
    const p2: ScoreMutationPayload = {
      result_id: 'res-2',
      match_id: 'm-2',
      team_a_score: 15,
      team_b_score: 9,
      entered_by: 'Player Two',
      timestamp: 2000,
    };

    queue.enqueue(p1);
    queue.enqueue(p2);
    expect(queue.size()).toBe(2);

    const syncedResults: string[] = [];
    const mockSyncSender = async (item: ScoreMutationPayload) => {
      syncedResults.push(item.result_id);
      return { success: true };
    };

    const replayedCount = await queue.replay(mockSyncSender);
    expect(replayedCount).toBe(2);
    expect(syncedResults).toEqual(['res-1', 'res-2']);
    expect(queue.size()).toBe(0);
  });

  it('retains failed mutations in queue with incremented retry count', async () => {
    const p1: ScoreMutationPayload = {
      result_id: 'res-fail',
      match_id: 'm-fail',
      team_a_score: 13,
      team_b_score: 11,
      entered_by: 'Player One',
      timestamp: 1000,
    };

    queue.enqueue(p1);

    const mockFailingSender = async (_item: ScoreMutationPayload) => {
      throw new Error('Network request failed - no cell service');
    };

    const replayedCount = await queue.replay(mockFailingSender);
    expect(replayedCount).toBe(0);
    expect(queue.size()).toBe(1);
    expect(queue.getItems()[0].retries).toBe(1);
  });
});
