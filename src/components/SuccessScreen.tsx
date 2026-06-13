import { useEffect, useRef, useState } from 'react';
import memberData from '../data/member.json';
import { CLAIM_TYPE_LABELS } from '../state/types';
import { useWizard } from './WizardContext';

export function SuccessScreen() {
  const { state, dispatch } = useWizard();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [reference] = useState(
    () => `CLM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const claimType = state.draft.claimType;

  return (
    <div className="success-screen" role="status">
      <div className="success-icon" aria-hidden="true">
        ✓
      </div>
      <h2 className="step-title" tabIndex={-1} ref={headingRef}>
        Claim submitted successfully
      </h2>
      <p>
        Your {claimType ? CLAIM_TYPE_LABELS[claimType].toLowerCase() : ''} claim has been received
        with reference <strong>{reference}</strong>. This is a mock submission — the full payload
        was logged to the browser console.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => dispatch({ type: 'reset', prefill: memberData.member })}
      >
        Submit another claim
      </button>
    </div>
  );
}
