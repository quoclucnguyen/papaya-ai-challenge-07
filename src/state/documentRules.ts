import type { ClaimType, DentalCategory, DocumentTypeId } from './types';

export interface DocumentRequirement {
  id: DocumentTypeId;
  label: string;
  required: boolean;
  hint?: string;
}

/**
 * Single source of truth for which documents each claim type needs.
 * Convention (see README): the treatment plan is required only for
 * "major" dental treatment; for other dental categories it is optional.
 */
export function documentRules(
  claimType: ClaimType,
  dentalCategory?: DentalCategory | '',
): DocumentRequirement[] {
  switch (claimType) {
    case 'outpatient':
      return [
        { id: 'medical_receipt', label: 'Medical receipt', required: true },
        { id: 'prescription', label: 'Prescription', required: false },
      ];
    case 'inpatient':
      return [
        { id: 'discharge_summary', label: 'Discharge summary', required: true },
        { id: 'itemized_bill', label: 'Itemized bill', required: true },
        { id: 'medical_receipt', label: 'Medical receipt', required: true },
      ];
    case 'dental':
      return [
        { id: 'dental_receipt', label: 'Dental receipt', required: true },
        {
          id: 'treatment_plan',
          label: 'Treatment plan',
          required: dentalCategory === 'major',
          hint: dentalCategory === 'major' ? 'Required for major dental treatment' : undefined,
        },
      ];
  }
}
