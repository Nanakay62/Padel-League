/**
 * Ghana-specific formatting utilities for currency (GHS in pesewas)
 * and mobile phone numbers (+233 / local).
 */

/**
 * Formats integer pesewas into Ghanaian Cedis (GH₵) with thousands separators.
 * Avoids JavaScript floating-point errors by using integer math.
 * Example: 5000 -> "GH₵ 50.00", 100000 -> "GH₵ 1,000.00", -2500 -> "-GH₵ 25.00"
 */
export function formatGhanaCedis(pesewas: number): string {
  const isNegative = pesewas < 0;
  const absPesewas = Math.abs(pesewas);
  const cedis = Math.floor(absPesewas / 100);
  const remPesewas = absPesewas % 100;

  const cedisFormatted = cedis.toLocaleString('en-US');
  const pesewasFormatted = remPesewas.toString().padStart(2, '0');

  const prefix = isNegative ? '-GH₵ ' : 'GH₵ ';
  return `${prefix}${cedisFormatted}.${pesewasFormatted}`;
}

const GHANA_VALID_PREFIXES = [
  '24',
  '54',
  '55',
  '59',
  '53', // MTN
  '20',
  '50', // Telecel (Vodafone)
  '27',
  '57',
  '26', // AT (AirtelTigo)
];

/**
 * Normalizes any Ghanaian phone number into international E.164 (+233XXXXXXXXX).
 */
export function normalizeGhanaPhoneE164(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9+]/g, '');

  if (digits.startsWith('+233')) {
    return digits;
  }
  if (digits.startsWith('233')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+233${digits.substring(1)}`;
  }
  return `+233${digits}`;
}

/**
 * Validates whether a phone number matches legitimate Ghanaian telco network prefixes.
 */
export function validateGhanaPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizeGhanaPhoneE164(phone);
  // Must be in the form +233XXXXXXXXX (total length 13 chars)
  if (!/^\+233\d{9}$/.test(normalized)) {
    return false;
  }
  const prefix = normalized.substring(4, 6);
  return GHANA_VALID_PREFIXES.includes(prefix);
}

/**
 * Formats a phone number for clean readability on cards and screens.
 * E.g., "+233241234567" -> "+233 24 123 4567", "0241234567" -> "024 123 4567"
 */
export function formatGhanaPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s-]/g, '');

  if (cleaned.startsWith('+233') && cleaned.length === 13) {
    const p1 = cleaned.substring(0, 4); // +233
    const p2 = cleaned.substring(4, 6); // 24
    const p3 = cleaned.substring(6, 9); // 123
    const p4 = cleaned.substring(9, 13); // 4567
    return `${p1} ${p2} ${p3} ${p4}`;
  }

  if (cleaned.startsWith('0') && cleaned.length === 10) {
    const p1 = cleaned.substring(0, 3); // 024
    const p2 = cleaned.substring(3, 6); // 123
    const p3 = cleaned.substring(6, 10); // 4567
    return `${p1} ${p2} ${p3}`;
  }

  return phone;
}
