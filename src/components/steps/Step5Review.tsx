import icd10 from '../../data/icd10.json';
import memberData from '../../data/member.json';
import { claimSchema } from '../../schemas/claimSchema';
import { documentRules } from '../../state/documentRules';
import { lengthOfStay } from '../../state/dates';
import { validateStep } from '../../state/validateStep';
import { CLAIM_TYPE_LABELS, DENTAL_CATEGORY_LABELS } from '../../state/types';
import type { ClaimDraft, StepId } from '../../state/types';
import { StepShell } from '../StepShell';
import { useStepForm } from '../useStepForm';
import { useWizard } from '../WizardContext';

function buildSubmission(draft: ClaimDraft) {
  const { member, diagnosis } = draft;
  const dependent = memberData.dependents.find((dep) => dep.id === member.dependentId);
  const base = {
    claimType: draft.claimType,
    memberName: member.memberName,
    policyNumber: member.policyNumber,
    memberId: member.memberId,
    dateOfBirth: member.dateOfBirth,
    diagnosisDescription: diagnosis.diagnosisDescription,
    icd10Code: diagnosis.icd10Code,
    providerName: diagnosis.providerName,
    ...(draft.claimType === 'inpatient'
      ? {
          admissionDate: diagnosis.admissionDate,
          dischargeDate: diagnosis.dischargeDate,
          admissionReason: diagnosis.admissionReason,
        }
      : { treatmentDate: diagnosis.treatmentDate }),
    ...(draft.claimType === 'dental' ? { dentalCategory: diagnosis.dentalCategory } : {}),
  };
  return {
    claim: claimSchema.parse(base),
    claimFor: dependent
      ? { type: 'dependent', name: dependent.name, relationship: dependent.relationship }
      : { type: 'member' },
    documents: Object.entries(draft.documents)
      .filter(([, slot]) => slot.status === 'done')
      .map(([id, slot]) => ({ type: id, fileName: slot.fileName, fileSize: slot.fileSize })),
    ...(draft.claimType === 'inpatient'
      ? { lengthOfStayNights: lengthOfStay(diagnosis.admissionDate, diagnosis.dischargeDate) }
      : {}),
    submittedAt: new Date().toISOString(),
  };
}

function ReviewSection({
  title,
  step,
  children,
}: {
  title: string;
  step: StepId;
  children: React.ReactNode;
}) {
  const { dispatch } = useWizard();
  return (
    <section className="review-section">
      <div className="review-section-header">
        <h3>{title}</h3>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => dispatch({ type: 'editStep', step })}
        >
          Edit<span className="sr-only"> {title}</span>
        </button>
      </div>
      <dl className="review-grid">{children}</dl>
    </section>
  );
}

function Row({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </>
  );
}

export function Step5Review() {
  const { draft, dispatch, errors, handleSubmit } = useStepForm(5);
  const d = draft.diagnosis;
  const icdEntry = icd10.find((e) => e.code === d.icd10Code);
  const dependent = memberData.dependents.find((dep) => dep.id === draft.member.dependentId);
  const nights = lengthOfStay(d.admissionDate, d.dischargeDate);

  const submit = (e: React.FormEvent) => {
    if (Object.keys(validateStep(5, draft)).length > 0) {
      handleSubmit(e); // surfaces the confirmation error and moves focus to it
      return;
    }
    e.preventDefault();
    // Mock submission: log the payload, then show the success screen.
    console.log('Mock claim submission:', buildSubmission(draft));
    dispatch({ type: 'submit' });
  };

  return (
    <StepShell
      title="Review & submit"
      description="Check everything below — you can edit any section without losing your answers."
      onSubmit={submit}
      nextLabel="Submit claim"
    >
      <ReviewSection title="Claim type" step={1}>
        <Row term="Type" value={draft.claimType ? CLAIM_TYPE_LABELS[draft.claimType] : '—'} />
      </ReviewSection>

      <ReviewSection title="Member & policy" step={2}>
        <Row term="Member name" value={draft.member.memberName} />
        <Row term="Policy number" value={draft.member.policyNumber} />
        <Row term="Member ID" value={draft.member.memberId} />
        <Row term="Date of birth" value={draft.member.dateOfBirth} />
        <Row
          term="Claim for"
          value={dependent ? `${dependent.name} (${dependent.relationship})` : 'Myself (the member)'}
        />
      </ReviewSection>

      <ReviewSection title="Diagnosis & treatment" step={3}>
        <Row term="Diagnosis" value={d.diagnosisDescription} />
        <Row
          term="ICD-10 code"
          value={icdEntry ? `${icdEntry.code} — ${icdEntry.description}` : d.icd10Code}
        />
        <Row term="Provider" value={d.providerName} />
        {draft.claimType === 'inpatient' ? (
          <>
            <Row term="Admission" value={d.admissionDate} />
            <Row term="Discharge" value={d.dischargeDate} />
            <Row
              term="Length of stay"
              value={nights === null ? '—' : nights === 0 ? 'Same-day (0 nights)' : `${nights} night${nights > 1 ? 's' : ''}`}
            />
            <Row term="Admission reason" value={d.admissionReason} />
          </>
        ) : (
          <Row term="Treatment date" value={d.treatmentDate} />
        )}
        {draft.claimType === 'dental' && (
          <Row
            term="Treatment category"
            value={d.dentalCategory ? DENTAL_CATEGORY_LABELS[d.dentalCategory] : '—'}
          />
        )}
      </ReviewSection>

      <ReviewSection title="Documents" step={4}>
        {draft.claimType &&
          documentRules(draft.claimType, d.dentalCategory).map((rule) => {
            const slot = draft.documents[rule.id];
            return (
              <Row
                key={rule.id}
                term={`${rule.label}${rule.required ? '' : ' (optional)'}`}
                value={
                  slot && slot.status === 'done' ? (
                    <span className="review-doc-ok">✓ {slot.fileName}</span>
                  ) : (
                    <span className="review-doc-missing">Not provided</span>
                  )
                }
              />
            );
          })}
      </ReviewSection>

      <div className={`confirm-block${errors.confirmed ? ' field-invalid' : ''}`}>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={draft.confirmed}
            aria-invalid={errors.confirmed ? true : undefined}
            aria-describedby={errors.confirmed ? 'confirmed-error' : undefined}
            onChange={(e) => dispatch({ type: 'setConfirmed', value: e.target.checked })}
          />
          <span>
            I confirm this information is accurate
            <span className="required-mark" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> required</span>
          </span>
        </label>
        {errors.confirmed && (
          <p className="field-error" id="confirmed-error" role="alert">
            {errors.confirmed}
          </p>
        )}
      </div>
    </StepShell>
  );
}
