import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  hasTypeSpecificData,
  wizardReducer,
  type WizardAction,
} from '../wizardReducer';
import { PREFILL, doneSlot, validDraft } from './fixtures';
import type { WizardState } from '../types';

function run(state: WizardState, ...actions: WizardAction[]): WizardState {
  return actions.reduce(wizardReducer, state);
}

describe('wizardReducer — claim type switch', () => {
  it('keeps shared fields, resets type-specific fields and documents', () => {
    const state: WizardState = { ...createInitialState(PREFILL), draft: validDraft('inpatient') };
    state.draft.documents = { discharge_summary: doneSlot() };

    const next = wizardReducer(state, { type: 'selectClaimType', claimType: 'dental' });

    expect(next.draft.claimType).toBe('dental');
    // shared data survives
    expect(next.draft.member.memberName).toBe(PREFILL.memberName);
    expect(next.draft.diagnosis.diagnosisDescription).not.toBe('');
    expect(next.draft.diagnosis.icd10Code).toBe('J06.9');
    expect(next.draft.diagnosis.providerName).not.toBe('');
    // type-specific data is reset
    expect(next.draft.diagnosis.admissionDate).toBe('');
    expect(next.draft.diagnosis.admissionReason).toBe('');
    expect(next.draft.documents).toEqual({});
  });

  it('re-selecting the same type is a no-op (no data loss)', () => {
    const state: WizardState = { ...createInitialState(PREFILL), draft: validDraft('inpatient') };
    expect(wizardReducer(state, { type: 'selectClaimType', claimType: 'inpatient' })).toBe(state);
  });

  it('hasTypeSpecificData detects when a switch would lose data', () => {
    const fresh = createInitialState(PREFILL);
    expect(hasTypeSpecificData(fresh.draft)).toBe(false);
    expect(hasTypeSpecificData(validDraft('inpatient'))).toBe(true);
  });
});

describe('wizardReducer — navigation', () => {
  it('back/forward keeps entered data intact', () => {
    let state: WizardState = { ...createInitialState(PREFILL), draft: validDraft('outpatient') };
    state = run(state, { type: 'next' }, { type: 'next' }, { type: 'next' }); // → 4
    expect(state.step).toBe(4);
    state = run(state, { type: 'back' }, { type: 'back' }); // → 2
    expect(state.step).toBe(2);
    expect(state.draft.diagnosis.icd10Code).toBe('J06.9');
    state = run(state, { type: 'next' });
    expect(state.draft.diagnosis.treatmentDate).toBe('2026-06-05');
  });

  it('next is blocked while the current step is invalid', () => {
    const state = createInitialState(PREFILL); // step 1, no claim type yet
    expect(wizardReducer(state, { type: 'next' }).step).toBe(1);
  });

  it('goToStep cannot jump forward past an invalid step', () => {
    const state: WizardState = { ...createInitialState(PREFILL), draft: validDraft('outpatient') };
    state.draft.diagnosis.treatmentDate = ''; // step 3 invalid
    expect(wizardReducer(state, { type: 'goToStep', step: 4 }).step).toBe(1);
    expect(wizardReducer(state, { type: 'goToStep', step: 3 }).step).toBe(3);
  });

  it('editing from review returns to review once the step is valid again', () => {
    let state: WizardState = {
      ...createInitialState(PREFILL),
      step: 5,
      draft: validDraft('outpatient'),
    };
    state.draft.documents = { medical_receipt: doneSlot() };
    state = run(state, { type: 'editStep', step: 2 });
    expect(state.step).toBe(2);
    state = run(state, { type: 'setMemberField', field: 'memberName', value: 'Tran Thi Mai' }, {
      type: 'next',
    });
    expect(state.step).toBe(5); // straight back to review, not step 3
    expect(state.draft.member.memberName).toBe('Tran Thi Mai');
  });
});

describe('wizardReducer — documents & submit', () => {
  it('tracks the upload lifecycle and removal', () => {
    let state: WizardState = { ...createInitialState(PREFILL), draft: validDraft('outpatient') };
    state = run(
      state,
      { type: 'uploadStart', doc: 'medical_receipt', fileName: 'r.pdf', fileSize: 5000 },
      { type: 'uploadProgress', doc: 'medical_receipt', progress: 60 },
    );
    expect(state.draft.documents.medical_receipt).toMatchObject({ status: 'uploading', progress: 60 });
    state = run(state, { type: 'uploadDone', doc: 'medical_receipt' });
    expect(state.draft.documents.medical_receipt).toMatchObject({ status: 'done', progress: 100 });
    state = run(state, { type: 'removeDocument', doc: 'medical_receipt' });
    expect(state.draft.documents.medical_receipt).toBeUndefined();
  });

  it('editing data after confirming clears the confirmation checkbox', () => {
    let state: WizardState = { ...createInitialState(PREFILL), draft: validDraft('outpatient') };
    state = run(state, { type: 'setConfirmed', value: true });
    expect(state.draft.confirmed).toBe(true);
    state = run(state, { type: 'setDiagnosisField', field: 'providerName', value: 'Cho Ray Hospital' });
    expect(state.draft.confirmed).toBe(false);
  });

  it('submit only succeeds when every step is valid', () => {
    let state: WizardState = {
      ...createInitialState(PREFILL),
      step: 5,
      draft: validDraft('outpatient'),
    };
    expect(wizardReducer(state, { type: 'submit' }).submitted).toBe(false); // no docs, not confirmed
    state.draft.documents = { medical_receipt: doneSlot() };
    state = run(state, { type: 'setConfirmed', value: true }, { type: 'submit' });
    expect(state.submitted).toBe(true);
  });
});
