/**
 * Offline Mutation Queue for courtside score submission.
 * Ensures score entry survives airplane mode or spotty cage signal,
 * and replays mutations strictly idempotently using client-generated result_id.
 */

export interface ScoreMutationPayload {
  result_id: string;
  match_id: string;
  event_id?: string;
  league_id?: string;
  team_a_score?: number;
  team_b_score?: number;
  team_a_sets?: number;
  team_b_sets?: number;
  team_a_games?: number;
  team_b_games?: number;
  is_walkover?: boolean;
  walkover_winner?: string | null;
  entered_by: string;
  venue_name?: string;
  timestamp: number;
}

export interface QueueItem extends ScoreMutationPayload {
  retries: number;
  queuedAt: number;
}

export class OfflineMutationQueue {
  private queue: Map<string, QueueItem> = new Map();

  /**
   * Enqueue a courtside score submission.
   * If a submission with the same result_id already exists, it is ignored (idempotent).
   */
  enqueue(payload: ScoreMutationPayload): void {
    if (this.queue.has(payload.result_id)) {
      return;
    }

    this.queue.set(payload.result_id, {
      ...payload,
      retries: 0,
      queuedAt: Date.now(),
    });
  }

  /**
   * Returns all pending items in FIFO order.
   */
  getItems(): QueueItem[] {
    return Array.from(this.queue.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  /**
   * Number of items currently queued.
   */
  size(): number {
    return this.queue.size;
  }

  /**
   * Clears all items from the queue.
   */
  clear(): void {
    this.queue.clear();
  }

  /**
   * Replays pending mutations in FIFO order.
   * Calls sender callback for each mutation. On success, removes item from queue.
   * On failure, increments retry count and stops replay to preserve ordering.
   * Returns the count of successfully synced items.
   */
  async replay(
    sender: (payload: ScoreMutationPayload) => Promise<{ success: boolean }>
  ): Promise<number> {
    const items = this.getItems();
    let syncedCount = 0;

    for (const item of items) {
      try {
        await sender(item);
        this.queue.delete(item.result_id);
        syncedCount += 1;
      } catch {
        // Failed network request (e.g. still no cell service)
        // Increment retry counter and leave in queue
        const current = this.queue.get(item.result_id);
        if (current) {
          current.retries += 1;
        }
        // Break out to preserve sequence
        break;
      }
    }

    return syncedCount;
  }
}

// Global singleton instance for application use
export const courtsideScoreQueue = new OfflineMutationQueue();
