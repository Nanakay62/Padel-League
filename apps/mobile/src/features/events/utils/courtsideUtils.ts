/**
 * Pure domain utilities for Courtside Live Mode and Club Back Office operations.
 * Non-negotiable rules:
 * - Format and rotation math is offline-safe and idempotent.
 * - Scores must add up exactly to point_target.
 * - Money is strictly integer pesewas (never floating point).
 */

/**
 * Validates that two scores add up exactly to the event's point target.
 */
export function validateAmericanoScore(
  scoreA: number,
  scoreB: number,
  pointTarget: number
): boolean {
  if (scoreA < 0 || scoreB < 0 || pointTarget <= 0) return false;
  return scoreA + scoreB === pointTarget;
}

/**
 * Generates a deterministic, idempotent result_id for a given match and round.
 * This guarantees client-generated replays never double-apply or create duplicate audit entries.
 */
export function generateIdempotentResultId(
  matchId: string,
  roundNumber: number
): string {
  // Deterministic seed string
  const rawKey = `result_${matchId}_r${roundNumber}_court_v1`;

  // Generate a standard deterministic UUID v4 string from hash
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }

  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return `00000000-${hexHash.slice(0, 4)}-4000-8000-${hexHash.padStart(12, 'a')}`;
}

export interface ClubRevenueParams {
  confirmedPlayersCount: number;
  feePerPlayerPesewas: number;
  courtCostPesewas: number;
  platformFeeRate: number; // e.g. 0.08 or 0.10
}

export interface ClubRevenueBreakdown {
  totalGrossPesewas: number;
  platformFeePesewas: number;
  netClubPayoutPesewas: number;
}

/**
 * Calculate event revenue strictly in integer pesewas.
 */
export function calculateClubEventRevenue(
  params: ClubRevenueParams
): ClubRevenueBreakdown {
  const totalGrossPesewas = Math.round(
    params.confirmedPlayersCount * params.feePerPlayerPesewas
  );
  const platformFeePesewas = Math.round(
    totalGrossPesewas * params.platformFeeRate
  );
  const netClubPayoutPesewas = totalGrossPesewas - platformFeePesewas;

  return {
    totalGrossPesewas,
    platformFeePesewas,
    netClubPayoutPesewas,
  };
}
