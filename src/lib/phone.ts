/**
 * Phone numbers.
 *
 * Phone is the church's real contact channel — many members have no email at
 * all, which is why sign-up insists on a number but not on an address. So the
 * validation here stays deliberately permissive: an Ethiopian number typed any
 * of the usual ways is normalized to E.164, and anything else with enough
 * digits is accepted as a foreign number rather than rejected. Turning away a
 * diaspora member's number would lock them out of an app whose whole purpose is
 * to reach them.
 */

const ET_COUNTRY_CODE = '251';

/**
 * The shortest run of digits that could plausibly be a phone number. Ethiopian
 * subscriber numbers are 9 digits after the trunk 0, so anything shorter is a
 * typo rather than an unusual format.
 */
const MIN_DIGITS = 9;

/**
 * Returns the number in E.164 form (`+251911223344`), or null when it does not
 * look like a phone number at all.
 *
 * Accepts `0911223344`, `911223344`, `+251 911 22 33 44`, `00251-911-223344`
 * and foreign numbers such as `+1 202 555 0143`.
 */
export function normalizeEthiopianPhone(raw: string): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;

  const international = /^(\+|00)/.test(trimmed);
  const bare = trimmed.replace(/\D/g, '').replace(/^00/, '');
  if (bare.length < MIN_DIGITS) return null;

  // Already carries the Ethiopian country code, with or without the plus.
  if (bare.startsWith(ET_COUNTRY_CODE)) return `+${bare}`;

  if (!international) {
    // Local form with the trunk prefix: 0911223344 → +251911223344
    if (bare.startsWith('0')) return `+${ET_COUNTRY_CODE}${bare.slice(1)}`;
    // Bare subscriber number: 911223344 → +251911223344
    if (bare.length === MIN_DIGITS) return `+${ET_COUNTRY_CODE}${bare}`;
  }

  // Somebody's foreign number. Keep it, in E.164 shape.
  return `+${bare}`;
}

/** Would `normalizeEthiopianPhone` accept this? */
export function isValidPhone(raw: string): boolean {
  return normalizeEthiopianPhone(raw) !== null;
}
