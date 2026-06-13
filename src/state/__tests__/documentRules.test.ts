import { describe, expect, it } from 'vitest';
import { documentRules } from '../documentRules';

const ids = (claimType: Parameters<typeof documentRules>[0], category?: 'major' | 'basic') =>
  documentRules(claimType, category).map((d) => ({ id: d.id, required: d.required }));

describe('documentRules — conditional document matrix', () => {
  it('outpatient: medical receipt required, prescription optional', () => {
    expect(ids('outpatient')).toEqual([
      { id: 'medical_receipt', required: true },
      { id: 'prescription', required: false },
    ]);
  });

  it('inpatient: discharge summary, itemized bill and medical receipt all required', () => {
    expect(ids('inpatient')).toEqual([
      { id: 'discharge_summary', required: true },
      { id: 'itemized_bill', required: true },
      { id: 'medical_receipt', required: true },
    ]);
  });

  it('dental (non-major): receipt required, treatment plan optional', () => {
    expect(ids('dental', 'basic')).toEqual([
      { id: 'dental_receipt', required: true },
      { id: 'treatment_plan', required: false },
    ]);
  });

  it('dental (major): treatment plan becomes required', () => {
    expect(ids('dental', 'major')).toEqual([
      { id: 'dental_receipt', required: true },
      { id: 'treatment_plan', required: true },
    ]);
  });
});
