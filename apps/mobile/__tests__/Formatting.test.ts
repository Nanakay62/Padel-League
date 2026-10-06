import {
  formatGhanaCedis,
  formatGhanaPhoneDisplay,
  normalizeGhanaPhoneE164,
  validateGhanaPhone,
} from '@/lib/formatting';

describe('Formatting Utilities (Ghana Cedis & +233 Phones)', () => {
  describe('Ghana Cedis Currency Formatting', () => {
    it('formats integer pesewas to GH₵ display without float precision bugs', () => {
      expect(formatGhanaCedis(5000)).toBe('GH₵ 50.00');
      expect(formatGhanaCedis(0)).toBe('GH₵ 0.00');
      expect(formatGhanaCedis(1250)).toBe('GH₵ 12.50');
      expect(formatGhanaCedis(99)).toBe('GH₵ 0.99');
      expect(formatGhanaCedis(100000)).toBe('GH₵ 1,000.00');
      expect(formatGhanaCedis(250050)).toBe('GH₵ 2,500.50');
    });

    it('handles negative pesewas for refunds gracefully', () => {
      expect(formatGhanaCedis(-2500)).toBe('-GH₵ 25.00');
    });
  });

  describe('Ghanaian Phone Number Formatting & Validation', () => {
    it('normalizes local Ghanaian numbers to E.164 (+233)', () => {
      expect(normalizeGhanaPhoneE164('0241234567')).toBe('+233241234567');
      expect(normalizeGhanaPhoneE164('024 123 4567')).toBe('+233241234567');
      expect(normalizeGhanaPhoneE164('050-987-6543')).toBe('+233509876543');
      expect(normalizeGhanaPhoneE164('+233241234567')).toBe('+233241234567');
      expect(normalizeGhanaPhoneE164('233241234567')).toBe('+233241234567');
    });

    it('validates Ghanaian telco prefixes (MTN 024/054/055/059, Telecel 020/050, AT 027/057/026)', () => {
      expect(validateGhanaPhone('0241234567')).toBe(true);
      expect(validateGhanaPhone('0501234567')).toBe(true);
      expect(validateGhanaPhone('0271234567')).toBe(true);
      expect(validateGhanaPhone('0551234567')).toBe(true);
      expect(validateGhanaPhone('0591234567')).toBe(true);

      // Invalid prefixes / lengths
      expect(validateGhanaPhone('0121234567')).toBe(false);
      expect(validateGhanaPhone('02412345')).toBe(false);
      expect(validateGhanaPhone('024123456789')).toBe(false);
      expect(validateGhanaPhone('')).toBe(false);
    });

    it('formats E.164 into readable spaced Ghanaian display format', () => {
      expect(formatGhanaPhoneDisplay('+233241234567')).toBe('+233 24 123 4567');
      expect(formatGhanaPhoneDisplay('0241234567')).toBe('024 123 4567');
    });
  });
});
