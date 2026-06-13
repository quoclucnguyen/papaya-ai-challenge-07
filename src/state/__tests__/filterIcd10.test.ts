import { describe, expect, it } from 'vitest';
import { filterIcd10 } from '../filterIcd10';
import icd10 from '../../data/icd10.json';

describe('filterIcd10 — autocomplete filter', () => {
  it('dataset has at least 100 codes (challenge requirement)', () => {
    expect(icd10.length).toBeGreaterThanOrEqual(100);
  });

  it('matches by code prefix, case-insensitive', () => {
    const results = filterIcd10(icd10, 'e11');
    expect(results.map((r) => r.code)).toContain('E11.9');
    expect(results.map((r) => r.code)).toContain('E11.65');
  });

  it('matches by description text', () => {
    const results = filterIcd10(icd10, 'diabetes');
    expect(results.some((r) => r.code === 'E11.9')).toBe(true);
  });

  it('ranks code-prefix matches before description matches', () => {
    const results = filterIcd10(icd10, 'K02');
    expect(results[0].code).toBe('K02.9');
  });

  it('caps results at the given limit', () => {
    expect(filterIcd10(icd10, 'a', 20).length).toBeLessThanOrEqual(20);
  });

  it('returns nothing for an empty query', () => {
    expect(filterIcd10(icd10, '   ')).toEqual([]);
  });
});
