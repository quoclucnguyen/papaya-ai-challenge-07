import type { FormEvent, ReactNode } from 'react';
import { isStepValid } from '../state/validateStep';
import { useWizard } from './WizardContext';

interface StepShellProps {
  title: string;
  description?: string;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  nextLabel?: string;
}

export function StepShell({ title, description, onSubmit, children, nextLabel }: StepShellProps) {
  const { state, dispatch } = useWizard();

  const defaultNext = state.returnToReview ? 'Save & return to review' : 'Continue';

  return (
    <form className="step" onSubmit={onSubmit} noValidate>
      <h2 className="step-title" tabIndex={-1}>
        {title}
      </h2>
      {description && <p className="step-description">{description}</p>}
      <div className="step-body">{children}</div>
      <div className="step-footer">
        {state.step > 1 ? (
          <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'back' })}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn btn-primary">
          {nextLabel ?? defaultNext}
        </button>
      </div>
    </form>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ id, label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className={`field${error ? ' field-invalid' : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
        {required && (
          <>
            <span className="required-mark" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** aria helpers shared by every input bound to a FormField */
export function fieldAria(id: string, error?: string, hint?: string) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  };
}
