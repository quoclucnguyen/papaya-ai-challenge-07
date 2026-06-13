import { canGoToStep, validateStep } from './validateStep';
import type {
  ClaimDraft,
  ClaimType,
  DiagnosisInfo,
  DocumentTypeId,
  MemberInfo,
  StepId,
  WizardState,
} from './types';

export interface MemberPrefill {
  memberName: string;
  policyNumber: string;
  memberId: string;
  dateOfBirth: string;
}

const emptyDiagnosis: DiagnosisInfo = {
  diagnosisDescription: '',
  icd10Code: '',
  providerName: '',
  treatmentDate: '',
  admissionDate: '',
  dischargeDate: '',
  admissionReason: '',
  dentalCategory: '',
};

export function createInitialDraft(prefill?: MemberPrefill): ClaimDraft {
  return {
    claimType: '',
    member: {
      memberName: prefill?.memberName ?? '',
      policyNumber: prefill?.policyNumber ?? '',
      memberId: prefill?.memberId ?? '',
      dateOfBirth: prefill?.dateOfBirth ?? '',
      isForDependent: false,
      dependentId: '',
    },
    diagnosis: { ...emptyDiagnosis },
    documents: {},
    confirmed: false,
  };
}

export function createInitialState(prefill?: MemberPrefill): WizardState {
  return { step: 1, returnToReview: false, submitted: false, draft: createInitialDraft(prefill) };
}

/** True when switching claim type would discard data the user already entered. */
export function hasTypeSpecificData(draft: ClaimDraft): boolean {
  const d = draft.diagnosis;
  return Boolean(
    d.treatmentDate ||
      d.admissionDate ||
      d.dischargeDate ||
      d.admissionReason ||
      d.dentalCategory ||
      Object.keys(draft.documents).length > 0,
  );
}

export type WizardAction =
  | { type: 'selectClaimType'; claimType: ClaimType }
  | { type: 'setMemberField'; field: keyof MemberInfo; value: string | boolean }
  | { type: 'setDiagnosisField'; field: keyof DiagnosisInfo; value: string }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goToStep'; step: StepId }
  | { type: 'editStep'; step: StepId }
  | { type: 'uploadStart'; doc: DocumentTypeId; fileName: string; fileSize: number }
  | { type: 'uploadProgress'; doc: DocumentTypeId; progress: number }
  | { type: 'uploadDone'; doc: DocumentTypeId }
  | { type: 'uploadError'; doc: DocumentTypeId; fileName: string; error: string }
  | { type: 'removeDocument'; doc: DocumentTypeId }
  | { type: 'setConfirmed'; value: boolean }
  | { type: 'submit' }
  | { type: 'reset'; prefill?: MemberPrefill };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  const { draft } = state;
  switch (action.type) {
    case 'selectClaimType': {
      if (draft.claimType === action.claimType) return state;
      // Keep shared data (member, diagnosis text, ICD-10, provider); reset
      // type-specific fields and uploaded documents — the document list and
      // date shape differ per claim type. See README convention #2.
      return {
        ...state,
        draft: {
          ...draft,
          claimType: action.claimType,
          diagnosis: {
            ...emptyDiagnosis,
            diagnosisDescription: draft.diagnosis.diagnosisDescription,
            icd10Code: draft.diagnosis.icd10Code,
            providerName: draft.diagnosis.providerName,
          },
          documents: {},
          confirmed: false,
        },
      };
    }

    case 'setMemberField': {
      const member = { ...draft.member, [action.field]: action.value };
      if (action.field === 'isForDependent' && action.value === false) {
        member.dependentId = '';
      }
      return { ...state, draft: { ...draft, member, confirmed: false } };
    }

    case 'setDiagnosisField':
      return {
        ...state,
        draft: {
          ...draft,
          diagnosis: { ...draft.diagnosis, [action.field]: action.value },
          confirmed: false,
        },
      };

    case 'next': {
      if (Object.keys(validateStep(state.step, draft)).length > 0) return state;
      if (state.returnToReview && canGoToStep(5, draft)) {
        return { ...state, step: 5, returnToReview: false };
      }
      const step = Math.min(state.step + 1, 5) as StepId;
      return { ...state, step, returnToReview: step === 5 ? false : state.returnToReview };
    }

    case 'back':
      return state.step > 1 ? { ...state, step: (state.step - 1) as StepId } : state;

    case 'goToStep': {
      if (action.step === state.step) return state;
      if (action.step > state.step && !canGoToStep(action.step, draft)) return state;
      return { ...state, step: action.step, returnToReview: false };
    }

    case 'editStep':
      return { ...state, step: action.step, returnToReview: true };

    case 'uploadStart':
      return {
        ...state,
        draft: {
          ...draft,
          confirmed: false,
          documents: {
            ...draft.documents,
            [action.doc]: {
              status: 'uploading',
              fileName: action.fileName,
              fileSize: action.fileSize,
              progress: 0,
            },
          },
        },
      };

    case 'uploadProgress': {
      const slot = draft.documents[action.doc];
      if (!slot || slot.status !== 'uploading') return state;
      return {
        ...state,
        draft: {
          ...draft,
          documents: {
            ...draft.documents,
            [action.doc]: { ...slot, progress: Math.min(action.progress, 100) },
          },
        },
      };
    }

    case 'uploadDone': {
      const slot = draft.documents[action.doc];
      if (!slot) return state;
      return {
        ...state,
        draft: {
          ...draft,
          documents: {
            ...draft.documents,
            [action.doc]: { ...slot, status: 'done', progress: 100 },
          },
        },
      };
    }

    case 'uploadError':
      return {
        ...state,
        draft: {
          ...draft,
          documents: {
            ...draft.documents,
            [action.doc]: {
              status: 'error',
              fileName: action.fileName,
              fileSize: 0,
              progress: 0,
              error: action.error,
            },
          },
        },
      };

    case 'removeDocument': {
      const documents = { ...draft.documents };
      delete documents[action.doc];
      return { ...state, draft: { ...draft, documents, confirmed: false } };
    }

    case 'setConfirmed':
      return { ...state, draft: { ...draft, confirmed: action.value } };

    case 'submit': {
      for (let s = 1 as StepId; s <= 5; s++) {
        if (Object.keys(validateStep(s as StepId, draft)).length > 0) return state;
      }
      return { ...state, submitted: true };
    }

    case 'reset':
      return createInitialState(action.prefill);
  }
}
