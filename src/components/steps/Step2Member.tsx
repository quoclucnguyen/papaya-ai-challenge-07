import memberData from '../../data/member.json';
import { toIsoDate } from '../../state/dates';
import type { MemberInfo } from '../../state/types';
import { FormField, StepShell, fieldAria } from '../StepShell';
import { useStepForm } from '../useStepForm';

export function Step2Member() {
  const { draft, dispatch, errors, handleSubmit } = useStepForm(2);
  const m = draft.member;
  const today = toIsoDate(new Date());

  const set = (field: keyof MemberInfo, value: string | boolean) =>
    dispatch({ type: 'setMemberField', field, value });

  return (
    <StepShell
      title="Member & policy information"
      description="Pre-filled from your policy — review and edit if anything has changed."
      onSubmit={handleSubmit}
    >
      <div className="field-grid">
        <FormField id="memberName" label="Member name" error={errors.memberName} required>
          <input
            type="text"
            value={m.memberName}
            onChange={(e) => set('memberName', e.target.value)}
            autoComplete="name"
            {...fieldAria('memberName', errors.memberName)}
          />
        </FormField>
        <FormField id="policyNumber" label="Policy number" error={errors.policyNumber} required>
          <input
            type="text"
            value={m.policyNumber}
            onChange={(e) => set('policyNumber', e.target.value)}
            {...fieldAria('policyNumber', errors.policyNumber)}
          />
        </FormField>
        <FormField id="memberId" label="Member ID" error={errors.memberId} required>
          <input
            type="text"
            value={m.memberId}
            onChange={(e) => set('memberId', e.target.value)}
            {...fieldAria('memberId', errors.memberId)}
          />
        </FormField>
        <FormField id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth} required>
          <input
            type="date"
            max={today}
            value={m.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
            {...fieldAria('dateOfBirth', errors.dateOfBirth)}
          />
        </FormField>
      </div>

      <div className="dependent-block">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={m.isForDependent}
            onChange={(e) => set('isForDependent', e.target.checked)}
          />
          <span>This claim is for a dependent</span>
        </label>
        {m.isForDependent && (
          <FormField
            id="dependentId"
            label="Dependent"
            error={errors.dependentId}
            hint="Dependents registered under this policy"
            required
          >
            <select
              value={m.dependentId}
              onChange={(e) => set('dependentId', e.target.value)}
              {...fieldAria('dependentId', errors.dependentId, 'hint')}
            >
              <option value="">Select a dependent…</option>
              {memberData.dependents.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name} — {dep.relationship}
                </option>
              ))}
            </select>
          </FormField>
        )}
      </div>
    </StepShell>
  );
}
