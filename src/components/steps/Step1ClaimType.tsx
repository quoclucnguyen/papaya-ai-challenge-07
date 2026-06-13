import { hasTypeSpecificData } from '../../state/wizardReducer';
import { CLAIM_TYPE_LABELS } from '../../state/types';
import type { ClaimType } from '../../state/types';
import { StepShell } from '../StepShell';
import { useStepForm } from '../useStepForm';

const CLAIM_TYPE_DETAILS: Record<ClaimType, string> = {
  outpatient: 'Clinic visits, consultations and day procedures. Needs a medical receipt.',
  inpatient: 'Hospital admissions with an overnight stay. Needs discharge summary, itemized bill and receipt.',
  dental: 'Dental treatment from check-ups to major work. Needs a dental receipt.',
};

export function Step1ClaimType() {
  const { draft, dispatch, errors, handleSubmit } = useStepForm(1);

  const select = (claimType: ClaimType) => {
    if (draft.claimType && draft.claimType !== claimType && hasTypeSpecificData(draft)) {
      const ok = window.confirm(
        'Changing the claim type clears the treatment details and uploaded documents entered for the current type. Your member info, diagnosis and ICD-10 code are kept. Continue?',
      );
      if (!ok) return;
    }
    dispatch({ type: 'selectClaimType', claimType });
  };

  return (
    <StepShell
      title="What type of claim are you submitting?"
      description="The claim type determines which details and documents we ask for next."
      onSubmit={handleSubmit}
    >
      <fieldset className="claim-type-group" aria-describedby={errors.claimType ? 'claimType-error' : undefined}>
        <legend className="sr-only">Claim type required</legend>
        <div className="claim-type-grid">
          {(Object.keys(CLAIM_TYPE_LABELS) as ClaimType[]).map((type) => (
            <label
              key={type}
              className={`claim-type-card${draft.claimType === type ? ' is-selected' : ''}`}
            >
              <input
                type="radio"
                name="claimType"
                value={type}
                checked={draft.claimType === type}
                onChange={() => select(type)}
              />
              <span className="claim-type-name">
                {CLAIM_TYPE_LABELS[type]}
                <span className="required-mark" aria-hidden="true">
                  *
                </span>
              </span>
              <span className="claim-type-detail">{CLAIM_TYPE_DETAILS[type]}</span>
            </label>
          ))}
        </div>
        {errors.claimType && (
          <p className="field-error" id="claimType-error" role="alert">
            {errors.claimType}
          </p>
        )}
      </fieldset>
    </StepShell>
  );
}
