import { describe, expect, it } from 'vitest';
import { canGoToStep, validateStep } from '../validateStep';
import { createInitialDraft } from '../wizardReducer';
import { PREFILL, TODAY, doneSlot, validDraft } from './fixtures';

describe('validateStep — step 1 & 2', () => {
  it('step 1 requires a claim type', () => {
    const draft = createInitialDraft(PREFILL);
    expect(validateStep(1, draft, TODAY)).toHaveProperty('claimType');
    draft.claimType = 'outpatient';
    expect(validateStep(1, draft, TODAY)).toEqual({});
  });

  it('step 2 flags missing member fields', () => {
    const draft = validDraft('outpatient');
    draft.member.memberName = '  ';
    draft.member.policyNumber = '';
    const errors = validateStep(2, draft, TODAY);
    expect(errors).toHaveProperty('memberName');
    expect(errors).toHaveProperty('policyNumber');
  });

  it('step 2 requires a dependent selection when claiming for a dependent', () => {
    const draft = validDraft('outpatient');
    draft.member.isForDependent = true;
    expect(validateStep(2, draft, TODAY)).toHaveProperty('dependentId');
    draft.member.dependentId = 'DEP-01';
    expect(validateStep(2, draft, TODAY)).toEqual({});
  });
});

describe('validateStep — step 3 per claim type', () => {
  it('outpatient/dental require a treatment date that is not in the future', () => {
    const draft = validDraft('outpatient');
    draft.diagnosis.treatmentDate = '';
    expect(validateStep(3, draft, TODAY)).toHaveProperty('treatmentDate');
    draft.diagnosis.treatmentDate = '2026-06-20'; // after TODAY (2026-06-11)
    expect(validateStep(3, draft, TODAY)).toHaveProperty('treatmentDate');
    draft.diagnosis.treatmentDate = '2026-06-05';
    expect(validateStep(3, draft, TODAY)).toEqual({});
  });

  it('inpatient rejects discharge before admission and requires a reason', () => {
    const draft = validDraft('inpatient');
    draft.diagnosis.dischargeDate = '2026-05-30'; // before admission 2026-06-01
    expect(validateStep(3, draft, TODAY)).toHaveProperty('dischargeDate');
    draft.diagnosis.dischargeDate = '2026-06-04';
    draft.diagnosis.admissionReason = '';
    expect(validateStep(3, draft, TODAY)).toHaveProperty('admissionReason');
  });

  it('dental requires a treatment category', () => {
    const draft = validDraft('dental');
    draft.diagnosis.dentalCategory = '';
    expect(validateStep(3, draft, TODAY)).toHaveProperty('dentalCategory');
  });

  it('requires the shared fields (diagnosis, ICD-10, provider)', () => {
    const draft = validDraft('outpatient');
    draft.diagnosis.icd10Code = '';
    draft.diagnosis.providerName = '';
    const errors = validateStep(3, draft, TODAY);
    expect(errors).toHaveProperty('icd10Code');
    expect(errors).toHaveProperty('providerName');
  });
});

describe('validateStep — step 4 document gate', () => {
  it('blocks until every required document is uploaded', () => {
    const draft = validDraft('inpatient');
    draft.documents = { discharge_summary: doneSlot(), itemized_bill: doneSlot() };
    expect(validateStep(4, draft, TODAY)).toHaveProperty('doc_medical_receipt');
    draft.documents.medical_receipt = doneSlot();
    expect(validateStep(4, draft, TODAY)).toEqual({});
  });

  it('missing optional documents do not block', () => {
    const draft = validDraft('outpatient');
    draft.documents = { medical_receipt: doneSlot() }; // no prescription
    expect(validateStep(4, draft, TODAY)).toEqual({});
  });

  it('major dental requires the treatment plan; basic dental does not', () => {
    const draft = validDraft('dental');
    draft.documents = { dental_receipt: doneSlot() };
    expect(validateStep(4, draft, TODAY)).toEqual({});
    draft.diagnosis.dentalCategory = 'major';
    expect(validateStep(4, draft, TODAY)).toHaveProperty('doc_treatment_plan');
  });

  it('an in-progress upload does not count as provided', () => {
    const draft = validDraft('outpatient');
    draft.documents = {
      medical_receipt: { status: 'uploading', fileName: 'r.pdf', fileSize: 1, progress: 40 },
    };
    expect(validateStep(4, draft, TODAY)).toHaveProperty('doc_medical_receipt');
  });
});

describe('validateStep — step 5 & navigation guard', () => {
  it('step 5 requires the accuracy confirmation', () => {
    const draft = validDraft('outpatient');
    expect(validateStep(5, draft, TODAY)).toHaveProperty('confirmed');
    draft.confirmed = true;
    expect(validateStep(5, draft, TODAY)).toEqual({});
  });

  it('canGoToStep blocks forward navigation past an invalid step', () => {
    const draft = validDraft('outpatient');
    draft.diagnosis.treatmentDate = ''; // step 3 invalid
    expect(canGoToStep(3, draft, TODAY)).toBe(true);
    expect(canGoToStep(4, draft, TODAY)).toBe(false);
    draft.diagnosis.treatmentDate = '2026-06-05';
    draft.documents = { medical_receipt: doneSlot() };
    expect(canGoToStep(5, draft, TODAY)).toBe(true);
  });
});
