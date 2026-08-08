// @vitest-environment node
// Pure logic, no DOM — same reason atbiyaRoles.test.ts pins node.
import { describe, expect, it } from 'vitest';
import { isValidPhone, normalizeEthiopianPhone } from '@/lib/phone';

/**
 * Sign-up insists on a phone number and nothing else, so this is the only
 * contact detail the church is guaranteed to hold. The two things that matter:
 * the same number typed four different ways must collapse to one stored value,
 * and a foreign number must not be turned away.
 */
describe('normalizeEthiopianPhone', () => {
  it('collapses every local spelling of one number to the same E.164 value', () => {
    const forms = [
      '0911223344',
      '0911 22 33 44',
      '091-122-3344',
      '911223344',
      '+251911223344',
      '+251 911 22 33 44',
      '251911223344',
      '00251911223344',
    ];
    for (const form of forms) {
      expect(normalizeEthiopianPhone(form)).toBe('+251911223344');
    }
  });

  it('normalizes an Ethiopian landline', () => {
    expect(normalizeEthiopianPhone('011 123 4567')).toBe('+251111234567');
  });

  it('keeps a foreign number rather than rejecting it', () => {
    // A diaspora member must not be locked out of an app meant to reach them.
    expect(normalizeEthiopianPhone('+1 202 555 0143')).toBe('+12025550143');
    expect(normalizeEthiopianPhone('+44 20 7946 0958')).toBe('+442079460958');
  });

  it('rejects blanks and anything too short to be a number', () => {
    expect(normalizeEthiopianPhone('')).toBeNull();
    expect(normalizeEthiopianPhone('   ')).toBeNull();
    expect(normalizeEthiopianPhone('12345')).toBeNull();
    expect(normalizeEthiopianPhone('not a phone')).toBeNull();
  });

  it('is idempotent, so re-saving a profile does not mangle the number', () => {
    const once = normalizeEthiopianPhone('0911223344')!;
    expect(normalizeEthiopianPhone(once)).toBe(once);
  });
});

describe('isValidPhone', () => {
  it('agrees with normalizeEthiopianPhone', () => {
    expect(isValidPhone('0911223344')).toBe(true);
    expect(isValidPhone('+1 202 555 0143')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});
