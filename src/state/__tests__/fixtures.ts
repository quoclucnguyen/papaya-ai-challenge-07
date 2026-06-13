import { createInitialDraft } from '../wizardReducer';
import type { ClaimDraft, ClaimType, DocumentSlotState } from '../types';

export const PREFILL = {
  memberName: 'Nguyen Van An',
  policyNumber: 'PAP-2024-008431',
  memberId: 'MBR-104-552',
  dateOfBirth: '1988-04-12',
};

/** Fixed reference date so tests don't depend on the wall clock. */
export const TODAY = new Date(2026, 5, 11); // 2026-06-11

export const doneSlot = (fileName = 'receipt.pdf'): DocumentSlotState => ({
  status: 'done',
  fileName,
  fileSize: 120_000,
  progress: 100,
});

/** A draft that is valid through step 3 for the given claim type. */
export function validDraft(claimType: ClaimType): ClaimDraft {
  const draft = createInitialDraft(PREFILL);
  draft.claimType = claimType;
  draft.diagnosis.diagnosisDescription = 'Persistent cough and fever for five days';
  draft.diagnosis.icd10Code = 'J06.9';
  draft.diagnosis.providerName = 'FV Hospital (Ho Chi Minh City)';
  if (claimType === 'inpatient') {
    draft.diagnosis.admissionDate = '2026-06-01';
    draft.diagnosis.dischargeDate = '2026-06-04';
    draft.diagnosis.admissionReason = 'Severe dengue fever requiring IV fluids';
  } else {
    draft.diagnosis.treatmentDate = '2026-06-05';
  }
  if (claimType === 'dental') {
    draft.diagnosis.dentalCategory = 'basic';
  }
  return draft;
}
