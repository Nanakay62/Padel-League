/**
 * Pure billing utilities for Ghana Cedis (GHS) and integer pesewas.
 */

export function formatPesewasToGHS(pesewas: number): string {
  const cedis = pesewas / 100;
  return `GH₵ ${cedis.toFixed(2)}`;
}

export interface PricingBreakdown {
  courtFeePesewas: number;
  platformFeePesewas: number;
  totalPesewas: number;
  courtFeeFormatted: string;
  platformFeeFormatted: string;
  totalFormatted: string;
}

export function computePricingBreakdown(
  courtFeePesewas: number,
  platformFeePesewas: number = 500
): PricingBreakdown {
  const total = courtFeePesewas + platformFeePesewas;
  return {
    courtFeePesewas,
    platformFeePesewas,
    totalPesewas: total,
    courtFeeFormatted: formatPesewasToGHS(courtFeePesewas),
    platformFeeFormatted: formatPesewasToGHS(platformFeePesewas),
    totalFormatted: formatPesewasToGHS(total),
  };
}
