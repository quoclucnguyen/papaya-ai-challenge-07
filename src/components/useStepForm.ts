import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { validateStep } from '../state/validateStep';
import type { ClaimDraft, FieldErrors, StepId } from '../state/types';
import type { WizardAction } from '../state/wizardReducer';
import { useWizard } from './WizardContext';

export interface StepForm {
  draft: ClaimDraft;
  dispatch: (action: WizardAction) => void;
  /** Only populated after the user attempted to continue. */
  errors: FieldErrors;
  handleSubmit: (e: FormEvent) => void;
  returnToReview: boolean;
}

export function useStepForm(stepId: StepId): StepForm {
  const { state, dispatch } = useWizard();
  const [attempted, setAttempted] = useState(false);
  const allErrors = useMemo(() => validateStep(stepId, state.draft), [stepId, state.draft]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.keys(allErrors).length > 0) {
      setAttempted(true);
      // Move focus to the first invalid control for keyboard/screen-reader users.
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    dispatch({ type: 'next' });
  };

  return {
    draft: state.draft,
    dispatch,
    errors: attempted ? allErrors : {},
    handleSubmit,
    returnToReview: state.returnToReview,
  };
}
