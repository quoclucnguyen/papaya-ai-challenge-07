export type ClaimType = 'outpatient' | 'inpatient' | 'dental';
export type DentalCategory = 'preventive' | 'basic' | 'major';
export type StepId = 1 | 2 | 3 | 4 | 5;

export const STEPS: { id: StepId; title: string }[] = [
  { id: 1, title: 'Claim type' },
  { id: 2, title: 'Member & policy' },
  { id: 3, title: 'Diagnosis & treatment' },
  { id: 4, title: 'Documents' },
  { id: 5, title: 'Review & submit' },
];

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  outpatient: 'Outpatient',
  inpatient: 'Inpatient',
  dental: 'Dental',
};

export const DENTAL_CATEGORY_LABELS: Record<DentalCategory, string> = {
  preventive: 'Preventive (cleaning, check-up)',
  basic: 'Basic (filling, extraction)',
  major: 'Major (crown, implant, orthodontics)',
};

export type DocumentTypeId =
  | 'medical_receipt'
  | 'prescription'
  | 'discharge_summary'
  | 'itemized_bill'
  | 'dental_receipt'
  | 'treatment_plan';

export type UploadStatus = 'uploading' | 'done' | 'error';

export interface DocumentSlotState {
  status: UploadStatus;
  fileName: string;
  fileSize: number;
  /** 0–100, only meaningful while status === 'uploading' */
  progress: number;
  error?: string;
}

export interface MemberInfo {
  memberName: string;
  policyNumber: string;
  memberId: string;
  dateOfBirth: string;
  isForDependent: boolean;
  dependentId: string;
}

export interface DiagnosisInfo {
  diagnosisDescription: string;
  icd10Code: string;
  providerName: string;
  /** outpatient & dental */
  treatmentDate: string;
  /** inpatient only */
  admissionDate: string;
  dischargeDate: string;
  admissionReason: string;
  /** dental only */
  dentalCategory: DentalCategory | '';
}

export interface ClaimDraft {
  claimType: ClaimType | '';
  member: MemberInfo;
  diagnosis: DiagnosisInfo;
  documents: Partial<Record<DocumentTypeId, DocumentSlotState>>;
  confirmed: boolean;
}

export interface WizardState {
  step: StepId;
  /** set when the user jumps to a step from the Review screen */
  returnToReview: boolean;
  submitted: boolean;
  draft: ClaimDraft;
}

export type FieldErrors = Record<string, string>;
