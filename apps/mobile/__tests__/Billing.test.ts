import {
  computePricingBreakdown,
  formatPesewasToGHS,
} from "../src/features/billing/billing-utils";

describe("Billing utilities", () => {
  it("formats integer pesewas into Ghana Cedis format", () => {
    expect(formatPesewasToGHS(5000)).toBe("GH₵ 50.00");
    expect(formatPesewasToGHS(5500)).toBe("GH₵ 55.00");
    expect(formatPesewasToGHS(100)).toBe("GH₵ 1.00");
    expect(formatPesewasToGHS(0)).toBe("GH₵ 0.00");
    expect(formatPesewasToGHS(2750)).toBe("GH₵ 27.50");
  });

  it("calculates transparent fee breakdown with platform fee separated", () => {
    const breakdown = computePricingBreakdown(5000, 500);
    expect(breakdown.courtFeePesewas).toBe(5000);
    expect(breakdown.platformFeePesewas).toBe(500);
    expect(breakdown.totalPesewas).toBe(5500);
    expect(breakdown.courtFeeFormatted).toBe("GH₵ 50.00");
    expect(breakdown.platformFeeFormatted).toBe("GH₵ 5.00");
    expect(breakdown.totalFormatted).toBe("GH₵ 55.00");
  });
});
