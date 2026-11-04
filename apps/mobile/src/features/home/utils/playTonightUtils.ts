export interface ConfirmedMatchPlayer {
  id: string;
  name: string;
  initials: string;
  rating?: number;
  isCurrentUser?: boolean;
}

export interface OpenMatchItem {
  id: string;
  title: string;
  venueName: string;
  courtName: string;
  timeDisplay: string;
  targetLevel: number; // e.g. 3.5 on the 0.0 - 7.0 scale
  levelBandLabel: string;
  courtCostPesewas: number; // integer pesewas
  totalSeats: number; // 4
  confirmedPlayers: ConfirmedMatchPlayer[];
}

/**
 * Filter open matches by player level within an optional tolerance window (default ±0.5).
 * If tolerance is null, all matches are returned.
 */
export function filterMatchesAtPlayerLevel(
  matches: OpenMatchItem[],
  playerRating: number,
  tolerance: number | null = 0.5
): OpenMatchItem[] {
  if (tolerance === null) {
    return matches;
  }
  const minAllowed = Math.max(0, playerRating - tolerance);
  const maxAllowed = Math.min(7.0, playerRating + tolerance);

  return matches.filter(
    (m) => m.targetLevel >= minAllowed && m.targetLevel <= maxAllowed
  );
}

/**
 * Calculate per-seat cost strictly in integer pesewas.
 * Never use floating-point money math.
 */
export function calculateSeatFeePesewas(
  courtCostPesewas: number,
  totalSeats: number
): number {
  if (totalSeats <= 0) return 0;
  // Use Math.ceil so integer split never underfunds the court
  return Math.ceil(courtCostPesewas / totalSeats);
}

export interface WhatsAppShareParams {
  playerName: string;
  partnerName: string;
  opponentTeam: string;
  scoreText: string;
  venueName: string;
  newRating: number;
  ratingDelta: number;
}

/**
 * Generate formatted WhatsApp match result text for one-tap sharing.
 */
export function generateWhatsAppShareText(params: WhatsAppShareParams): string {
  const deltaSign = params.ratingDelta >= 0 ? `+${params.ratingDelta.toFixed(2)}` : params.ratingDelta.toFixed(2);

  return (
    `[Padel Ghana Match Result]\n\n` +
    `Match: ${params.playerName} & ${params.partnerName} vs ${params.opponentTeam}\n` +
    `Score: ${params.scoreText}\n` +
    `Venue: ${params.venueName}\n\n` +
    `Skill Rating: ${params.newRating.toFixed(2)} (${deltaSign})\n` +
    `Accra Padel Circuit • Ghana Padel Platform`
  );
}
