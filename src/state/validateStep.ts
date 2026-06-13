import { z } from 'zod';
import { memberSchema, diagnosisBaseSchema } from '../schemas/claimSchema';
import { documentRules } from './documentRules';
import { isValidIsoDate, isFutureDate, lengthOfStay } from './dates';
import type { ClaimDraft, FieldErrors, StepId } from './types';

function zodErrors(schema: z.ZodType, data: unknown): FieldErrors {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

function requireDate(
  errors: FieldErrors,
  field: string,
  value: string,
  label: string,
  today: Date,
  { allowFuture = false } = {},
): void {
  if (errors[field]) return;
  if (!value) {
    errors[field] = `${label} is required`;
  } else if (!isValidIsoDate(value)) {
    errors[field] = `Enter a valid ${label.toLowerCase()}`;
  } else if (!allowFuture && isFutureDate(value, today)) {
    errors[field] = `${label} cannot be in the future`;
  }
}

/**
 * Pure per-step validation. Returns a map of field name → message;
 * an empty object means the step is valid.
 */
export function validateStep(step: StepId, draft: ClaimDraft, today: Date = new Date()): FieldErrors {
  switch (step) {
    case 1: {
      return draft.claimType ? {} : { claimType: 'Select a claim type to continue' };
    }

    case 2: {
      const errors = zodErrors(memberSchema, draft.member);
      requireDate(errors, 'dateOfBirth', draft.member.dateOfBirth, 'Date of birth', today);
      if (draft.member.isForDependent && !draft.member.dependentId) {
        errors.dependentId = 'Select the dependent this claim is for';
      }
      return errors;
    }

    case 3: {
      const errors = zodErrors(diagnosisBaseSchema, draft.diagnosis);
      const d = draft.diagnosis;
      if (draft.claimType === 'inpatient') {
        requireDate(errors, 'admissionDate', d.admissionDate, 'Admission date', today);
        requireDate(errors, 'dischargeDate', d.dischargeDate, 'Discharge date', today);
        if (
          !errors.admissionDate &&
          !errors.dischargeDate &&
          lengthOfStay(d.admissionDate, d.dischargeDate) === null
        ) {
          errors.dischargeDate = 'Discharge date cannot be before admission date';
        }
        if (!d.admissionReason.trim()) {
          errors.admissionReason = 'Admission reason is required';
        }
      } else {
        requireDate(errors, 'treatmentDate', d.treatmentDate, 'Treatment date', today);
      }
      if (draft.claimType === 'dental' && !d.dentalCategory) {
        errors.dentalCategory = 'Select the dental treatment category';
      }
      return errors;
    }

    case 4: {
      const errors: FieldErrors = {};
      if (!draft.claimType) return { claimType: 'Select a claim type first' };
      for (const doc of documentRules(draft.claimType, draft.diagnosis.dentalCategory)) {
        const slot = draft.documents[doc.id];
        if (!doc.required) continue;
        if (!slot || slot.status === 'error') {
          errors[`doc_${doc.id}`] = `${doc.label} is required`;
        } else if (slot.status === 'uploading') {
          errors[`doc_${doc.id}`] = `Wait for ${doc.label.toLowerCase()} to finish uploading`;
        }
      }
      return errors;
    }

    case 5: {
      return draft.confirmed
        ? {}
        : { confirmed: 'Confirm that the information is accurate before submitting' };
    }
  }
}

export function isStepValid(step: StepId, draft: ClaimDraft, today?: Date): boolean {
  return Object.keys(validateStep(step, draft, today)).length === 0;
}

/** A step is reachable when every step before it is valid. */
export function canGoToStep(target: StepId, draft: ClaimDraft, today?: Date): boolean {
  for (let s = 1 as StepId; s < target; s++) {
    if (!isStepValid(s as StepId, draft, today)) return false;
  }
  return true;
}
