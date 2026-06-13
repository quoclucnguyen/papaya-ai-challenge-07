import { describe, expect, it } from 'vitest';
import { isFutureDate, isValidIsoDate, lengthOfStay } from '../dates';

describe('lengthOfStay — nights between admission and discharge', () => {
  it('counts nights, not calendar days', () => {
    expect(lengthOfStay('2026-03-01', '2026-03-04')).toBe(3);
  });

  it('same-day discharge is 0 nights', () => {
    expect(lengthOfStay('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('crosses month boundaries correctly', () => {
    expect(lengthOfStay('2026-01-30', '2026-02-02')).toBe(3);
  });

  it('returns null when discharge is before admission', () => {
    expect(lengthOfStay('2026-03-04', '2026-03-01')).toBeNull();
  });

  it('returns null for invalid dates', () => {
    expect(lengthOfStay('', '2026-03-01')).toBeNull();
    expect(lengthOfStay('2026-02-30', '2026-03-01')).toBeNull();
  });
});

describe('date helpers', () => {
  it('rejects malformed and impossible dates', () => {
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('01/03/2026')).toBe(false);
    expect(isValidIsoDate('2026-02-28')).toBe(true);
  });

  it('flags future dates relative to the given today', () => {
    const today = new Date(2026, 5, 11);
    expect(isFutureDate('2026-06-12', today)).toBe(true);
    expect(isFutureDate('2026-06-11', today)).toBe(false);
  });
});
